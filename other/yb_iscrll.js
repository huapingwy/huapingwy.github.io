/*! iScroll v5.1.2 ~ (c) 2008-2014 Matteo Spinelli ~ http://cubiq.org/license */
(function (window, document, Math) {
    var rAF = window.requestAnimationFrame	||
    	window.webkitRequestAnimationFrame	||
    	window.mozRequestAnimationFrame		||
    	window.oRequestAnimationFrame		||
    	window.msRequestAnimationFrame		||
    	function (callback) { window.setTimeout(callback, 1000 / 60); };

    var utils = (function () {
        var me = {};
        var _elementStyle = document.createElement('div').style;
    	var _vendor = (function () {
    		var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
    			transform,
    			i = 0,
    			l = vendors.length;

    		for ( ; i < l; i++ ) {
    			transform = vendors[i] + 'ransform';
    			if ( transform in _elementStyle ) return vendors[i].substr(0, vendors[i].length-1);
    		}

    		return false;
    	})();

    	function _prefixStyle (style) {
    		if ( _vendor === false ) return false;
    		if ( _vendor === '' ) return style;
    		return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
    	}

    	me.getTime = Date.now || function getTime () { return new Date().getTime(); };

    	me.extend = function (target, obj) {
    		for ( var i in obj ) {
    			target[i] = obj[i];
    		}
    	};
        me.addEvent = function (el, type, fn, capture) {
    		el.addEventListener(type, fn, !!capture);
    	};

    	me.removeEvent = function (el, type, fn, capture) {
    		el.removeEventListener(type, fn, !!capture);
    	};

    	me.prefixPointerEvent = function (pointerEvent) {
    		return window.MSPointerEvent ?
    			'MSPointer' + pointerEvent.charAt(9).toUpperCase() + pointerEvent.substr(10):
    			pointerEvent;
    	};

    	me.momentum = function (current, start, time, lowerMargin, wrapperSize, deceleration) {

    		var distance = current - start,
    			speed = Math.abs(distance) / time,
    			destination,
    			duration;
    		deceleration = deceleration === undefined ? 0.0006 : deceleration;

    		destination = current + ( speed * speed ) / ( 2 * deceleration ) * ( distance < 0 ? -1 : 1 );
    		duration = speed / deceleration;

    		if ( destination < lowerMargin ) {
    			destination = wrapperSize ? lowerMargin - ( wrapperSize / 2.5 * ( speed / 8 ) ) : lowerMargin;
    			distance = Math.abs(destination - current);
    			duration = distance / speed;
    		} else if ( destination > 0 ) {
    			destination = wrapperSize ? wrapperSize / 2.5 * ( speed / 8 ) : 0;
    			distance = Math.abs(current) + destination;
    			duration = distance / speed;
    		}

    		return {
    			destination: Math.round(destination),
    			duration: duration
    		};
    	};

    	var _transform = _prefixStyle('transform');
        //给utils定义一些bool值属性，用来检测浏览器是否支持某些特性
    	me.extend(me, {
    		hasTransform: _transform !== false,
    		hasPerspective: _prefixStyle('perspective') in _elementStyle,
    		hasTouch: 'ontouchstart' in window,
    		hasPointer: window.PointerEvent || window.MSPointerEvent, // IE10 is prefixed
    		hasTransition: _prefixStyle('transition') in _elementStyle
    	});

    	// This should find all Android browsers lower than build 535.19 (both stock browser and webview)
    	me.isBadAndroid = /Android /.test(window.navigator.appVersion) && !(/Chrome\/\d/.test(window.navigator.appVersion));

    	me.extend(me.style = {}, {
    		transform: _transform,
    		transitionTimingFunction: _prefixStyle('transitionTimingFunction'),
    		transitionDuration: _prefixStyle('transitionDuration'),
    		transitionDelay: _prefixStyle('transitionDelay'),
    		transformOrigin: _prefixStyle('transformOrigin')
    	});


        me.preventDefaultException = function (el, exceptions) {
    		for ( var i in exceptions ) {
    			if ( exceptions[i].test(el[i]) ) {
    				return true;
    			}
    		}

    		return false;
    	};

    	me.extend(me.eventType = {}, {
    		touchstart: 1,
    		touchmove: 1,
    		touchend: 1,

    		mousedown: 2,
    		mousemove: 2,
    		mouseup: 2,

    		pointerdown: 3,
    		pointermove: 3,
    		pointerup: 3,

    		MSPointerDown: 3,
    		MSPointerMove: 3,
    		MSPointerUp: 3
    	});

        me.extend(me.ease = {}, {
    		circular: {
    			style: 'cubic-bezier(0.1, 0.57, 0.1, 1)',	// Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
    			fn: function (k) {
    				return Math.sqrt( 1 - ( --k * k ) );
    			}
    		}
    	});

        return me;
    }());

    function IScroll (el, options) {
    	this.wrapper = typeof el == 'string' ? document.querySelector(el) : el;
    	this.scroller = this.wrapper.children[0];
    	this.scrollerStyle = this.scroller.style;		// cache style for better performance

    	this.options = {

    		resizeScrollbars: true,

    		snapThreshold: 0.334,

    		startY: 0,
    		scrollY: true,
    		directionLockThreshold: 5,
    		momentum: true,

    		bounce: true,
    		bounceTime: 600,

    		preventDefault: true,
    		preventDefaultException: { tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT)$/ },

    		HWCompositing: true,
    		useTransition: true,
    		useTransform: true
    	};

    	for ( var i in options ) {
    		this.options[i] = options[i];
    	}

    	// Normalize options
    	this.translateZ = this.options.HWCompositing && utils.hasPerspective ? ' translateZ(0)' : '';

    	this.options.useTransition = utils.hasTransition && this.options.useTransition;
    	this.options.useTransform = utils.hasTransform && this.options.useTransform;

    	this.options.directionLockThreshold = this.options.eventPassthrough ? 0 : this.options.directionLockThreshold;

    	this.options.resizePolling = this.options.resizePolling === undefined ? 60 : this.options.resizePolling;

    	this.options.invertWheelDirection = this.options.invertWheelDirection ? -1 : 1;

    	if ( this.options.probeType == 3 ) {
    		this.options.useTransition = false;
    	}

    // INSERT POINT: NORMALIZATION

    	// Some defaults
    	this.y = 0;
    	this.directionY = 0;
    	this._events = {};

    // INSERT POINT: DEFAULTS

    	this._init();
    	this.refresh();

    	this.scrollTo(this.options.startX, this.options.startY);
    	this.enable();
    };

    IScroll.prototype = {
        version: '5.1.2',

    	_init: function () {
    		this._initEvents();

    		if ( this.options.scrollbars || this.options.indicators ) {
    			this._initIndicators();
    		}
    	},
        destroy: function () {
            this._initEvents(true);

            this._execEvent('destroy');
        },

        _transitionEnd: function (e) {
            if ( e.target != this.scroller || !this.isInTransition ) {
                return;
            }

            this._transitionTime();
            if ( !this.resetPosition(this.options.bounceTime) ) {
                this.isInTransition = false;
                this._execEvent('scrollEnd');
            }
        },

        _start: function (e) {
            // React to left mouse button only
            if ( utils.eventType[e.type] != 1 ) {
                if ( e.button !== 0 ) {
                    return;
                }
            }

            if ( !this.enabled || (this.initiated && utils.eventType[e.type] !== this.initiated) ) {
                return;
            }

            if ( this.options.preventDefault && !utils.isBadAndroid && !utils.preventDefaultException(e.target, this.options.preventDefaultException) ) {
                e.preventDefault();
            }

            var point = e.touches ? e.touches[0] : e,
                pos;

            this.initiated	= utils.eventType[e.type];
            this.moved		= false;
            this.distX		= 0;
            this.distY		= 0;
            this.directionX = 0;
            this.directionY = 0;
            this.directionLocked = 0;

            this._transitionTime();

            this.startTime = utils.getTime();

            if ( this.options.useTransition && this.isInTransition ) {
                this.isInTransition = false;
                pos = this.getComputedPosition();
                this._translate(Math.round(pos.x), Math.round(pos.y));
                this._execEvent('scrollEnd');
            } else if ( !this.options.useTransition && this.isAnimating ) {
                this.isAnimating = false;
                this._execEvent('scrollEnd');
            }

            this.startX    = this.x;
            this.startY    = this.y;
            this.absStartX = this.x;
            this.absStartY = this.y;
            this.pointX    = point.pageX;
            this.pointY    = point.pageY;

            this._execEvent('beforeScrollStart');
        },

        _move: function (e) {
            if ( !this.enabled || utils.eventType[e.type] !== this.initiated ) {
                return;
            }

            if ( this.options.preventDefault ) {	// increases performance on Android? TODO: check!
                e.preventDefault();
            }

            var point		= e.touches ? e.touches[0] : e,
                deltaX		= point.pageX - this.pointX,
                deltaY		= point.pageY - this.pointY,
                timestamp	= utils.getTime(),
                newX, newY,
                absDistX, absDistY;

            this.pointX		= point.pageX;
            this.pointY		= point.pageY;

            this.distX		+= deltaX;
            this.distY		+= deltaY;
            absDistX		= Math.abs(this.distX);
            absDistY		= Math.abs(this.distY);

            // We need to move at least 10 pixels for the scrolling to initiate
            if ( timestamp - this.endTime > 300 && (absDistX < 10 && absDistY < 10) ) {
                return;
            }

            this.directionLocked = 'v';

            console.log(this.directionLocked);

            if ( this.directionLocked == 'v' ) {
                if ( this.options.eventPassthrough == 'horizontal' ) {
                    e.preventDefault();
                } else if ( this.options.eventPassthrough == 'vertical' ) {
                    this.initiated = false;
                    return;
                }

                deltaX = 0;
            }

            deltaY = this.hasVerticalScroll ? deltaY : 0;

            newX = this.x + deltaX;
            newY = this.y + deltaY;

            if ( newY > 0 || newY < this.maxScrollY ) {
                newY = this.options.bounce ? this.y + deltaY / 3 : newY > 0 ? 0 : this.maxScrollY;
            }

            this.directionX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
            this.directionY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

            if ( !this.moved ) {
                this._execEvent('scrollStart');
            }

            this.moved = true;

            this._translate(newX, newY);

            /* REPLACE START: _move */
            if ( timestamp - this.startTime > 300 ) {
                this.startTime = timestamp;
                this.startX = this.x;
                this.startY = this.y;

                if ( this.options.probeType == 1 ) {
                    this._execEvent('scroll');
                }
            }

            if ( this.options.probeType > 1 ) {
                this._execEvent('scroll');
            }
            /* REPLACE END: _move */

        },

        _end: function (e) {
            if ( !this.enabled || utils.eventType[e.type] !== this.initiated ) {
                return;
            }

            if ( this.options.preventDefault && !utils.preventDefaultException(e.target, this.options.preventDefaultException) ) {
                e.preventDefault();
            }

            var point = e.changedTouches ? e.changedTouches[0] : e,
                momentumX,
                momentumY,
                duration = utils.getTime() - this.startTime,
                newX = Math.round(this.x),
                newY = Math.round(this.y),
                distanceX = Math.abs(newX - this.startX),
                distanceY = Math.abs(newY - this.startY),
                time = 0,
                easing = '';

            this.isInTransition = 0;
            this.initiated = 0;
            this.endTime = utils.getTime();

            // reset if we are outside of the boundaries
            if ( this.resetPosition(this.options.bounceTime) ) {
                return;
            }

            this.scrollTo(newX, newY);	// ensures that the last position is rounded

            // we scrolled less than 10 pixels
            if ( !this.moved ) {
                if ( this.options.tap ) {
                    utils.tap(e, this.options.tap);
                }

                if ( this.options.click ) {
                    utils.click(e);
                }

                this._execEvent('scrollCancel');
                return;
            }

            if ( this._events.flick && duration < 200 && distanceX < 100 && distanceY < 100 ) {
                this._execEvent('flick');
                return;
            }

            // start momentum animation if needed
            if ( this.options.momentum && duration < 300 ) {
                momentumX = this.hasHorizontalScroll ? utils.momentum(this.x, this.startX, duration, this.maxScrollX, this.options.bounce ? this.wrapperWidth : 0, this.options.deceleration) : { destination: newX, duration: 0 };
                momentumY = this.hasVerticalScroll ? utils.momentum(this.y, this.startY, duration, this.maxScrollY, this.options.bounce ? this.wrapperHeight : 0, this.options.deceleration) : { destination: newY, duration: 0 };
                newX = momentumX.destination;
                newY = momentumY.destination;
                time = Math.max(momentumX.duration, momentumY.duration);
                this.isInTransition = 1;
            }


            if ( this.options.snap ) {
                var snap = this._nearestSnap(newX, newY);
                this.currentPage = snap;
                time = this.options.snapSpeed || Math.max(
                        Math.max(
                            Math.min(Math.abs(newX - snap.x), 1000),
                            Math.min(Math.abs(newY - snap.y), 1000)
                        ), 300);
                newX = snap.x;
                newY = snap.y;

                this.directionX = 0;
                this.directionY = 0;
                easing = this.options.bounceEasing;
            }

            // INSERT POINT: _end

            if ( newX != this.x || newY != this.y ) {
                // change easing function when scroller goes out of the boundaries
                if ( newX > 0 || newX < this.maxScrollX || newY > 0 || newY < this.maxScrollY ) {
                    easing = utils.ease.quadratic;
                }

                this.scrollTo(newX, newY, time, easing);
                return;
            }

            this._execEvent('scrollEnd');
        },

        _resize: function () {
            var that = this;

            clearTimeout(this.resizeTimeout);

            this.resizeTimeout = setTimeout(function () {
                that.refresh();
            }, this.options.resizePolling);
        },

        _initIndicators: function () {
            var interactive = this.options.interactiveScrollbars,
                customStyle = typeof this.options.scrollbars != 'string',
                indicators = [],
                indicator;

            var that = this;

            this.indicators = [];

            if ( this.options.scrollbars ) {
                // Vertical scrollbar
                if ( this.options.scrollY ) {
                    indicator = {
                        el: createDefaultScrollbar('v', interactive, this.options.scrollbars),
                        interactive: interactive,
                        defaultScrollbars: true,
                        customStyle: customStyle,
                        resize: this.options.resizeScrollbars,
                        shrink: this.options.shrinkScrollbars,
                        fade: this.options.fadeScrollbars,
                        listenX: false
                    };

                    this.wrapper.appendChild(indicator.el);
                    indicators.push(indicator);
                }
            }

            if ( this.options.indicators ) {
                // TODO: check concat compatibility
                indicators = indicators.concat(this.options.indicators);
            }

            for ( var i = indicators.length; i--; ) {
                this.indicators.push( new Indicator(this, indicators[i]) );
            }

            // TODO: check if we can use array.map (wide compatibility and performance issues)
            function _indicatorsMap (fn) {
                for ( var i = that.indicators.length; i--; ) {
                    fn.call(that.indicators[i]);
                }
            }

            if ( this.options.fadeScrollbars ) {
                this.on('scrollEnd', function () {
                    _indicatorsMap(function () {
                        this.fade();
                    });
                });

                this.on('scrollCancel', function () {
                    _indicatorsMap(function () {
                        this.fade();
                    });
                });

                this.on('scrollStart', function () {
                    _indicatorsMap(function () {
                        this.fade(1);
                    });
                });

                this.on('beforeScrollStart', function () {
                    _indicatorsMap(function () {
                        this.fade(1, true);
                    });
                });
            }


            this.on('refresh', function () {
                _indicatorsMap(function () {
                    this.refresh();
                });
            });

            this.on('destroy', function () {
                _indicatorsMap(function () {
                    this.destroy();
                });

                delete this.indicators;
            });
        },

        _initEvents: function (remove) {
            var eventType = remove ? utils.removeEvent : utils.addEvent,
                target = this.options.bindToWrapper ? this.wrapper : window;

            eventType(window, 'orientationchange', this);
            eventType(window, 'resize', this);

            if ( this.options.click ) {
                eventType(this.wrapper, 'click', this, true);
            }

            if ( utils.hasPointer && !this.options.disablePointer ) {
                eventType(this.wrapper, utils.prefixPointerEvent('pointerdown'), this);
                eventType(target, utils.prefixPointerEvent('pointermove'), this);
                eventType(target, utils.prefixPointerEvent('pointercancel'), this);
                eventType(target, utils.prefixPointerEvent('pointerup'), this);
            }

            if ( utils.hasTouch && !this.options.disableTouch ) {
                eventType(this.wrapper, 'touchstart', this);
                eventType(target, 'touchmove', this);
                eventType(target, 'touchcancel', this);
                eventType(target, 'touchend', this);
            }

            eventType(this.scroller, 'transitionend', this);
            eventType(this.scroller, 'webkitTransitionEnd', this);
            eventType(this.scroller, 'oTransitionEnd', this);
            eventType(this.scroller, 'MSTransitionEnd', this);
        },
    };

})(window, document, Math);
