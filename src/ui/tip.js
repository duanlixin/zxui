/**
 * Copyright 2013 Baidu Inc. All rights reserved.
 * @file  提示层控件
 * @author  chris(wfsr@foxmail.com)
 */
define(function (require) {

	var T = baidu;
    var DOM = T.dom;
    var PAGE = T.page;
    var Base = require('./control');

    var getTarget = function (e, className) {
        var target = T.event.getTarget(e);

        if ( !DOM.hasClass(target, className) ) {
            target = DOM.getAncestorByClass(target, className);

            if ( !target ) {
                return null;
            }
        }

        return target;
    };

    /**
     * 提示层控件
     * 
     * @constructor
     * @extends  Base
     */
    var Tip = function () {
        this.constructor.superClass.constructor.apply(this, arguments);
    }
    T.inherits(Tip, Base);

    /**
     * 提示框消失的延迟时间，单位毫秒
     * 
     * @public
     * @type {number}
     */
    Tip.HIDE_DELAY = 500;


    T.extend(
        Tip.prototype, 
        /** @lends  Tip.prototype */{

        type: 'Tip',

        /**
         * 控件配置项
         * 
         * @type {Object} options 配置项
         * @param {boolean} options.disabled 控件的不可用状态
         * @param {string|HTMLElement} options.main 控件渲染容器
         * @param {boolean|string=} options.arrow 提示框的箭头参数，默认为false
         * @param {number=} options.hideDelay 提示框消失的延迟时间，默认值为Tip.HIDE_DELAY
         * @param {string=} options.mode 提示的显示模式，over|click|auto。默认为over
         * @param {string=} options.title 提示的标题信息，默认为null
         * @param {string} options.content 提示的内容信息
         * @param {string} options.prefix 控件class前缀，同时将作为main的class之一
         * @param {string} options.triggers 自动绑定本控件功能的class
         * @param {string} options.flag 标识作为trigger的class
         * @param {Object.<string, number>} options.offset 浮层显示的偏移量
         * @param {number} options.offset.x x 轴方向偏移量
         * @param {number} options.offset.y y轴方向偏移量
         * @param {string} options.tpl 浮层内部HTML模板
         */
        options: {

            // 提示框的不可用状态，默认为false。处于不可用状态的提示框不会出现。
            disabled: false,

            // 控件渲染主容器
            main: '',

            // 提示框的箭头参数，默认为false，不带箭头
            // 可以初始化时通过指定arrow属性为“1”开启箭头模式
            // 也可以手动指定箭头方向：tr | rt | rb | br | bl | lb | lt | tl。
            // 也可通过在 triggers 上设置 data-tooltips来指定
            arrow: false,

            // 提示框消失的延迟时间，默认值为Tip.HIDE_DELAY
            hideDelay: 0,

            // 提示的显示模式，over|click|auto。默认为over
            mode: 'over',

            // 提示的标题信息，默认为null
            title: null,

            // 提示的内容信息
            content: '',

            // 控件class前缀，同时将作为main的class之一
            prefix: 'ecl-hotel-ui-tip',

            // 自动绑定本控件功能的class
            triggers: 'tooltips',

            // 标识作为trigger的class
            flag: '_ecui_tips',

            // 浮层显示的偏移量
            offset: {

                // x 轴方向偏移量
                x: 0,

                // y 轴方向偏移量
                y: 0
            },

            // 控件模板
            tpl: ''
            + '<div class="{prefix}-arrow {prefix}-arrow-top">'
            +   '<em></em>'
            +   '<ins></ins>'
            + '</div>'
            + '<div class="{prefix}-title"></div>'
            + '<div class="{prefix}-body"></div>'
        },

        /**
         * 绑定 this 到实例方法
         * 
         * @type {string} 逗号分隔的方法名列表
         */
        binds: 'onResize, onShow, onHide, hide',

        /**
         * 控件初始化
         * 
         * @private
         * @param {Object} options 控件配置项 @see Tip#options
         */
        init: function (options) {
            options = this.setOptions(options);
            options.hideDelay = options.hideDelay || Tip.HIDE_DELAY;

            this.disabled  = options.disabled;
            this.title     = options.title;
            this.content   = options.content;

            var me     = this;
            var prefix = options.prefix;
            var main   = this.main = document.createElement('div');

            main.className        = prefix;
            main.innerHTML        = options.tpl.replace(/{prefix}/g, prefix);
            main.style.left = '-2000px';

            this.events = {
                over: {
                    on: 'mouseenter', 
                    un: 'mouseleave'
                },
                click: {
                    on: 'click',
                    un: 'click'
                }
            }[options.mode];
        },


        /**
         * 绘制控件
         * 
         */
        render: function () {

            var me      = this;
            var main    = this.main;
            var options = this.options;
            var events  = this.events;

            if ( !this.rendered ) {
                this.rendered = true;

                document.body.appendChild(main);

                T.on(main, 'click', function (e) {
                    me.fire('click');
                });

                T.on(main, 'mouseenter', function () {
                    me.clear();
                });

                T.on(main, 'mouseleave', function () {
                    me.clear();
                    me.timer = setTimeout(me.hide, options.hideDelay);
                });

                var elements = this.elements = {};
                var prefix = options.prefix + '-';

                T.each('arrow,title,body'.split(','), function (name) {
                    elements[name] = T.q(prefix + name, main)[0];
                });

                this.addTriggers(options.triggers);

            }

            if ( !events && this.triggers ) {
                this.show(this.triggers[0]);
            }
        },

        /**
         * 增加触发tips的DOM
         * 
         * @param {string|HTMLElement|HTMLCollection|Array} triggers 
         *        className/dom节点/dom集合或dom节点数组
         */
        addTriggers: function (triggers) {
            var me      = this;
            var options = this.options;
            var events  = this.events;
            var flag    = options.flag;

            this.triggers = typeof triggers == 'string'
                            ? T.q(options.triggers)
                            : (triggers.length ? triggers : [triggers]);

            if ( events ) {
                T.each(this.triggers, function (trigger) {
                    T.addClass(trigger, flag);
                    T.on(trigger, events.on, me.onShow);
                    T.on(trigger, events.un, me.onHide);
                });
            }
        },

        /**
         * 清除各种定时器
         * 
         */
        clear: function () {
            clearTimeout(this.timer);
            clearTimeout(this.resizeTimer);
        },

        /**
         * 浏览器可视尺寸改变时处理
         * 
         * @private
         * @param {DOMEvent} e DOM 事件对象
         */
        onResize: function (e) {
            clearTimeout(this.resizeTimer);
            var me = this;
            this.resizeTimer = setTimeout( function () {
                me.show(me.current);
            }, 100);
        },


        /**
         * 显示浮层前处理
         * 
         * @private
         * @param {DOMEvent} e DOM 事件对象
         */
        onShow: function(e){
            var target = getTarget(e, this.options.flag);
           
            this.clear();

            if ( !target || this.current === target ) {
                return;
            }

            this.current = target;

            this.fire('beforeShow', { target: target, event: e});

            this.show(target);
        },


        /**
         * 隐藏浮层前处理
         * 
         * @private
         */
        onHide: function () {
            var options = this.options;

            this.clear();
            
            if ( options.hideDelay ) {
                this.timer = setTimeout(this.hide, options.hideDelay);
            }
        },

        /**
         * 显示浮层
         * 
         * @param {?HTMLElement=} target 触发显示浮层的节点
         */
        show: function (target) {
            var options  = this.options;
            var main     = this.main;
            var events   = this.events;
            var elements = this.elements;
 
            this.clear();
           
            this.current = target;

            if ( events && target ) {
                T.on(target, events.un, this.onHide);
            }

            T.on(window, 'resize', this.onResize);

            elements.title.innerHTML = this.title || '';
            elements.body.innerHTML = this.content;

            T[ this.title ? 'show' : 'hide'](elements.title);

            if ( !options.arrow ) {
                T.hide(elements.arrow);
            }

            this.computePosition();

            this.fire('show', {target: target});

        },

        /**
         * 隐藏浮层
         * 
         */
        hide: function () {
            var options = this.options;
            var main    = this.main;

            this.clear();

            var arrow = this.elements.arrow;
            DOM.setStyle(main, 'left', - main.offsetWidth - arrow.offsetWidth);

            this.current = null;
            T.un(window, 'resize', this.onResize);

            this.fire('hide');
        },

        /**
         * 计算浮层及箭头显示位置
         * 
         * @private
         */
        computePosition: function () {
            var options = this.options;
            var target = this.current;
            var main = this.main;
            var arrow = this.elements.arrow;
            var dir = options.arrow;
            var position = DOM.getPosition(target);
            var prefix = options.prefix + '-arrow';

            var top = position.top;
            var left = position.left;

            var width = target.offsetWidth;
            var height = target.offsetHeight;

            var right = left + width;
            var bottom = top + height;

            var mainWidth = main.offsetWidth;
            var mainHeight = main.offsetHeight;

            var arrowWidth = arrow.firstChild.offsetWidth;
            var arrowHeight = arrow.firstChild.offsetHeight;

            var scrollTop = PAGE.getScrollTop();
            var scrollLeft = PAGE.getScrollLeft();
            var scrollRight = scrollLeft + PAGE.getViewWidth();
            var scrollBottom = scrollTop + PAGE.getViewHeight();

            // 属性配置优于实例配置
            var dirFromAttr = target.getAttribute('data-tooltips');
            if ( dirFromAttr ) {
                dir = /[trbl]{2}/.test(dirFromAttr) ? dirFromAttr : '1';
            }

            var second, first;

            // 未指定方向时自动按下右上左顺序计算可用方向
            if ( !dir || dir === '1') {
                if ( bottom + arrowHeight + mainHeight <= scrollBottom ) {
                    first = 'b';
                    second = left + mainWidth > scrollRight ? 'r' : 'l';
                }
                else if ( right + mainWidth + arrowWidth <= scrollRight ) {
                    first = 'r';
                    second = top + mainHeight > scrollBottom ? 'b' : 't';
                }
                else if ( top - mainHeight - arrowHeight >= scrollTop ) {
                    first = 't';
                    second = left + mainWidth > scrollRight ? 'r' : 'l';
                }
                else if ( left - mainWidth - arrowWidth >= scrollLeft ) {
                    first = 'l';
                    second = top + mainHeight > scrollBottom ? 'b' : 't';
                }

                dir = first + second;
            }
            else {
                first = dir.charAt(0);
                second = dir.charAt(1);
            }

            var lrtb = { l: 'left', r: 'right', t: 'top', b: 'bottom' };
            var offset = options.offset;

            arrow.className = prefix + ' ' + prefix + '-' + lrtb[first];

            // 改变箭头方向后需要校准箭头尺寸
            arrowWidth = arrow.firstChild.offsetWidth;
            arrowHeight = arrow.firstChild.offsetHeight;

            var middleLeft = (mainWidth - arrowWidth ) / 2;
            var middleTop = (mainHeight - arrowHeight ) / 2;

            if ( first === 'b' || first === 't' ) {
                left = second === 'l' 
                       ? left
                       : right - mainWidth;

                top = first === 'b'
                       ? bottom + arrowHeight
                       : top - arrowHeight - mainHeight;

                top += first === 'b' ? offset.y : -offset.y;

                DOM.setStyle(
                    arrow,
                    'left',
                    width > mainWidth
                    ? middleLeft
                    : (
                        second === 'l'
                        ? (width - arrowWidth) / 2
                        : (mainWidth - (width - arrowWidth) / 2)
                    )
                );
                DOM.setStyle(arrow, 'top', '');

            }
            else if ( first === 'l' || first === 'r' ) {
                top = second === 't'
                      ? top
                      : bottom - mainHeight;

                left = first === 'l'
                       ? left - arrowWidth - mainWidth
                       : right + arrowWidth;

                left += first === 'r' ? offset.x : -offset.x;

                DOM.setStyle(
                    arrow,
                    'top',
                    height > mainHeight
                    ? middleTop
                    : (
                        second === 't'
                        ? (height - arrowHeight) / 2
                        : (mainHeight - (height - arrowHeight) / 2)
                    )
                );
                DOM.setStyle(arrow, 'left', '');

            }

            DOM.setStyles(main, {left: left, top: top});

        }

    });

    return Tip;
})