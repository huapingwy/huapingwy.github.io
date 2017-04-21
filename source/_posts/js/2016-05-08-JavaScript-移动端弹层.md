---
title: JavaScript-移动端弹层
categories: [JavaScript]
---

> *  JavaScript

```js
define('common/dialog', [], function (zepto) {
    var exports = {};

    exports.dialog = function (options) {

        var defaults = {
            "autoTime": '2000', //当没有 确定和取消按钮的时候，弹出框自动关闭的时间
            "content": "我是一个弹出框", //弹出框里面的内容
            contentPad: 20,
            "height": '70',
            "okBtn": true, //是否显示确定按钮
            "cancelBtn": true, //是否显示取消按钮
            "okBtnText": "确定", //确定按钮的文字
            "cancelBtnText": "取消", //取消按钮的文字
            "lock": false, //是否显示遮罩
            "isclose": true, // 为false时 点击okBtn 不关闭弹层（弹层里有表单时，需要设置成flase，开启表单验证,且要手动删除弹层DOM）
            marksEvent: false, // 是否开启遮罩层关闭弹层事件
            "okFn": function(opt) {}, //点击确定按钮执行的函数
            "cancelFn": function() {}, //点击取消按钮执行的函数
            "autoFn": function() {}
        };

        var opt = $.extend({}, defaults, options);

        if($('.g-dialog-tips').length > 0) {
            return false;
        }

        function closeFn () {
            mainEle.remove();
        };

        $('<div class="yb-dialog">' +
            '<div class="content-box">' +
                '<div class="bg"></div>' +
                '<div class="content">'+ opt.content +'</div>' +
                '<p class="btn-box">' +
                    '<a href="javascript:;" class="ok-btn btn">'+ opt.okBtnText +'</a>' +
                    '<span class="line"></span>' +
                    '<a href="javascript:;" class="cancel-btn btn">' + opt.cancelBtnText + '</a>' +
                '</p>' +
            '</div>' +
            '<div class="marks"></div>' +
        '</div>').appendTo('body');

        var mainEle = $('.yb-dialog');

        mainEle.find('.content-box').css({
            "margin-top": '-' + Math.floor(mainEle.find('.content-box').height()/2) + 'px'
        });
        mainEle.find('.content').css({padding: opt.contentPad});

        // 遮罩层关闭弹层事件
        if(opt.marksEvent) {
            mainEle.find('.marks').on('click', function () {
                closeFn();
            });
        }

        //判断按钮是否显示
        if(!opt.okBtn && !opt.cancelBtn) {
            mainEle.find('.btn-box').hide();
            mainEle.find('.content').css({lineHeight: opt.height + 'px'});
            setTimeout(function () {
                closeFn();
                opt.autoFn();
            }, opt.autoTime);
        }
        //判读遮罩层是否显示
        if(opt.lock) {
            mainEle.find('.marks').show().addClass('fadeIn animated-4ms');
            mainEle.find('.content-box').addClass('bounceIn animated');
            setTimeout(function () {
                mainEle.find('.marks').removeClass('fadeIn animated-4ms');
                mainEle.find('.content-box').removeClass('bounceIn animated');
            },400);
        } else {
            mainEle.find('.marks').hide();
            mainEle.find('.content-box').addClass('bounceIn animated');
            setTimeout(function () {
                mainEle.find('.content-box').removeClass('bounceIn animated');
            },600);
        }
        //判读确认按钮显示取消按钮隐藏
        if(opt.okBtn && !opt.cancelBtn) {
            mainEle.find('.cancel-btn').hide();
            mainEle.find('.ok-btn').css({ width: '100%'});
            mainEle.find('.line').hide();
        }
        ////判读取消按钮显示确认按钮隐藏
        if(!opt.okBtn && opt.cancelBtn) {
            mainEle.find('.ok-btn').hide();
            mainEle.find('.cancel-btn').css({ width: '100%'});
            mainEle.find('.line').hide();
        }

        mainEle.find('.ok-btn').on('click', function () {
            if(opt.isclose) {
                closeFn();
            }
            opt.okFn(opt);
        });

        mainEle.find('.cancel-btn').on('click', function () {
            closeFn();
            opt.cancelFn();
            return false;
        })

    };

    return exports;
});
```

> * less

```less
.yb-dialog {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
    font-size: 20px;
    .marks {
        display: none;
        position: fixed;
        left: 0;
        top: 0;
        background: #000;
        opacity: 0.5;
        width: 100%;
        height: 100%;
        z-index: 99;
    }
    .content-box {
        position: absolute;
        left: 50%;
        top: 50%;
        margin: -30% 0 0 -40%;
        border-radius: 5px;
        width: 80%;
        z-index: 999;
        overflow: hidden;
        .bg {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: #fff;
            opacity: 1;
            z-index: 999;
        }
        .content {
            position: relative;
            text-align: center;
            padding: 20px;
            z-index:1000;
            line-height: 24px;
            color: #323232;
            font-size: 16px;
        }
        .btn-box {
            position: relative;
            border-top: 1px solid #eee;
            background: none;
            overflow: hidden;
            z-index:1000;
        }
        .btn {
            font-size: 20px;
            float: left;
            box-sizing: border-box;
            background: none;
            border-radius: 0;
            color: #323232;
            width: 50%;
            text-align: center;
            margin: 0;
            font-weight: normal;
            background: none;
            line-height: 50px;
            height: 50px;
			:active {
				background: #eee;
			}
        }
        .btn:nth-of-type(1) {
            margin-left: -1px;
        }
        .line {
            float: left;
            overflow: hidden;
            background: #eee;
            width: 1px;
            height: 50px;
            position: relative;
            z-index: 1000;
        }
    }
}
```
