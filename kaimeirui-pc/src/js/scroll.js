(function (w, f) {
    var Scroll = function () {
        this.elements = null;
        this.vary = 0; // 变化值
        this.scrollHeight = null; // 可滚动的高度
        this.scale = null; // 比例
        this.maxRange = null; //
        this.defaults = {
            scrollMove: document.getElementById('scroll-move'),
            scroll: document.getElementById('scroll'),
            scrollBarClass: 'scrollBarBox'
        };
    }
    Scroll.prototype = {
        constructor: Scroll,
        init: function (opt) {
            for(var property in opt){
                this.defaults[property] = opt[property];
            }
            this.scrollHeight = this.defaults.scrollMove.scrollHeight - this.defaults.scroll.offsetHeight;
            this.elements = this.defaults.scroll;
            this.createScrollBarBox(this.elements);
        },
        event: {
            addHandler: function (elements, type, handler) {
                if (elements.addEventListener) {
                    return elements.addEventListener(type, handler, false);
                } else {
                    return elements.attachEvent('on' + type, handler);
                };
            },
            preventDefault: function (ev) {
                if(ev.preventDefault){
                    return ev.preventDefault();
                } else {
                    return ev.returnValue = false;
                }
            }
        },
        createScrollBarBox: function (elements) { //创建滚动条容器
            //滚动条大小比例
            var scrollBarScale = this.defaults.scroll.offsetHeight/this.defaults.scrollMove.scrollHeight
            if(scrollBarScale > 1) {
                scrollBarScale = 1;
            }
            var scrollBar = document.createElement('div');
            var This = this;
            scrollBar.className = this.defaults.scrollBarClass;
            scrollBar.innerHTML = '<div class="scrollBar"></div>';
            elements.appendChild(scrollBar);
            scrollBar =  scrollBar.getElementsByTagName('div')[0];
            scrollBar.style.height = scrollBarScale*scrollBar.parentNode.offsetHeight + 'px';
            this.drag(scrollBar);
            this.event.addHandler(this.elements, 'DOMMouseScroll', function (ev) {
                var ev = ev || window.event;
                This.mouseWheel(This, scrollBar, ev);
            })
            this.event.addHandler(this.elements, 'mousewheel', function (ev) {
                var ev = ev || window.event;
                This.mouseWheel(This, scrollBar, ev);
            })
        },
        mouseWheel: function (globalThis, dragEle, ev) {
            var bDown = true;
            this.maxRange = dragEle.parentNode.offsetHeight - dragEle.offsetHeight;
            bDown = ev.wheelDelta ? ev.wheelDelta < 0 :ev.detail > 0;
            if(bDown){
                globalThis.vary += 10;
                if(globalThis.vary >= this.maxRange) {
                    globalThis.vary = this.maxRange;
                }
            } else {
                globalThis.vary -= 10;
                if(globalThis.vary <= 0) {
                    globalThis.vary = 0;
                }
            }
            dragEle.style.top = globalThis.vary + 'px';
            this.scale = globalThis.vary/(this.maxRange);
            this.defaults.scrollMove.style.top = -this.scale*this.scrollHeight+ 'px';
            globalThis.event.preventDefault(ev);
        },
        drag: function (dragEle) {
            var This = this;
            this.maxRange = dragEle.parentNode.offsetHeight - dragEle.offsetHeight;
            dragEle.onmousedown = function (ev) {
                var ev = ev || event;
                var eleThis = this;
                var downL = ev.clientX - dragEle.parentNode.offsetLeft;
                var downT = ev.clientY - dragEle.offsetTop;
                if(eleThis.setCapture){
                    eleThis.setCapture()
                }
                document.onmousemove = function (ev) {
                    var ev = ev || event;
                    This.vary = ev.clientY - downT;
                    if(This.vary <= 0) {
                        This.vary = 0;
                    } else if(This.vary >= This.maxRange) {
                        This.vary = This.maxRange;
                    }
                    //dragEle.style.left = ev.clientX - downL + 'px';
                    dragEle.style.top = This.vary + 'px';
                    This.scale = This.vary/(This.maxRange);
                    This.defaults.scrollMove.style.top = -This.scale*This.scrollHeight + 'px';
                }
                document.onmouseup = function () {
                    if(eleThis.releaseCapture){
                        eleThis.releaseCapture()
                    }
                    document.onmousemove = null;
                    document.onmouseup = null;
                }
                return false;
            }
        }
    }
    window.scroll = function (opt) {
        return new Scroll().init(opt);
    }
})(window, undefined)