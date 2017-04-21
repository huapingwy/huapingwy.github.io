//     Zepto.js
//     (c) 2010-2015 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

var Zepto = (function() {
    //定义局部变量    concat = emptyArray.concat 缩短作用域链
  var undefined, key, $, classList, emptyArray = [], concat = emptyArray.concat, filter = emptyArray.filter, slice = emptyArray.slice,



    document = window.document,

      //缓存元素的默认display属性
    elementDisplay = {},

      //缓存匹配class正则表达式 ，hasClass判断用到，
      classCache = {},

   //设置CSS时，不用加px单位的属性
    cssNumber = { 'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1,'opacity': 1, 'z-index': 1, 'zoom': 1 },
   //匹配HTML代码
    fragmentRE = /^\s*<(\w+|!)[^>]*>/,
      //TODO 匹配单个HTML标签
    singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
  //TODO 匹配自闭合标签
    tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
   //匹配根节点
    rootNodeRE = /^(?:body|html)$/i,
     //匹配A-Z
    capitalRE = /([A-Z])/g,

    // special attributes that should be get/set via method calls
  //需要提供get和set的方法名
    methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],
   //相邻DOM的操作
    adjacencyOperators = [ 'after', 'prepend', 'before', 'append' ],
    table = document.createElement('table'),
    tableRow = document.createElement('tr'),

  //这里的用途是当需要给tr,tbody,thead,tfoot,td,th设置innerHTMl的时候，需要用其父元素作为容器来装载HTML字符串
    containers = {
      'tr': document.createElement('tbody'),
      'tbody': table, 'thead': table, 'tfoot': table,
      'td': tableRow, 'th': tableRow,
      '*': document.createElement('div')
    },
  //当DOM ready的时候，document会有以下三种状态的一种
    readyRE = /complete|loaded|interactive/,
    simpleSelectorRE = /^[\w-]*$/,
      //缓存对象类型，用于类型判断 如object
    class2type = {},
    toString = class2type.toString,
    zepto = {},
    camelize, uniq,
    tempParent = document.createElement('div'),
    propMap = {
      'tabindex': 'tabIndex',
      'readonly': 'readOnly',
      'for': 'htmlFor',
      'class': 'className',
      'maxlength': 'maxLength',
      'cellspacing': 'cellSpacing',
      'cellpadding': 'cellPadding',
      'rowspan': 'rowSpan',
      'colspan': 'colSpan',
      'usemap': 'useMap',
      'frameborder': 'frameBorder',
      'contenteditable': 'contentEditable'
    },

    isArray = Array.isArray ||
      function(object){ return object instanceof Array }

    /**
     * 元素是否匹配选择器
     * @param element
     * @param selector
     * @returns {*}
     */
  zepto.matches = function(element, selector) {
     //没参数，非元素，直接返回
      if (!selector || !element || element.nodeType !== 1) return false

      //如果浏览器支持MatchesSelector  直接调用
    var matchesSelector = element.webkitMatchesSelector || element.mozMatchesSelector ||
                          element.oMatchesSelector || element.matchesSelector
    if (matchesSelector) return matchesSelector.call(element, selector)

      //浏览器不支持MatchesSelector
    var match, parent = element.parentNode, temp = !parent

      //元素没有父元素，存入到临时的div tempParent
    if (temp) (parent = tempParent).appendChild(element)

      //再通过父元素来搜索此表达式。  找不到-1  找到有索引从0开始
      //注意 ~取反位运算符  作用是将值取负数再减1   如-1变成0  0变成-1
    match = ~zepto.qsa(parent, selector).indexOf(element)

    //清理临时父节点
    temp && tempParent.removeChild(element)

      //返回匹配
    return match
  }

    /**
     * 获取对象类型
     * @param obj
     * @returns {*}
     */
  function type(obj) {
    return obj == null ? String(obj) :
      class2type[toString.call(obj)] || "object"
  }

  function isFunction(value) { return type(value) == "function" }
  function isWindow(obj)     { return obj != null && obj == obj.window }
  function isDocument(obj)   { return obj != null && obj.nodeType == obj.DOCUMENT_NODE }
  function isObject(obj)     {
      return type(obj) == "object"
  }
    /**
     * 是否是纯粹对象   JSON/new Object
     * @param obj
     * @returns {*|boolean|boolean}
     */
  function isPlainObject(obj) {
        //是对象  非window  非new时需要传参的
    return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
  }

    /**
     * 伪数组/数组判断
     * @param obj
     * @returns {boolean}
     */
  function likeArray(obj) { return typeof obj.length == 'number' }

    /**
     * 清掉数组中的null/undefined
     * @param array
     * @returns {*}
     */
  function compact(array) { return filter.call(array, function(item){ return item != null }) }

    /**
     * 返回一个数组副本
     * 利用空数组$.fn.concat.apply([], array) 合并新的数组，返回副本
     * @param array
     * @returns {*|Function|Function|Function|Function|Function|Zepto.fn.concat|Zepto.fn.concat|Zepto.fn.concat|Array|string}
     */
  function flatten(array) {
      return array.length > 0 ? $.fn.concat.apply([], array) : array
  }

    /**
     * 将'-'字符串转成驼峰格式
     * @param str
     * @returns {*|void}
     */
  camelize = function(str){
      return str.replace(/-+(.)?/g, function(match, chr){
          //匹配到-字符后的字母，转换为大写返回
          return chr ? chr.toUpperCase() : ''
      })
  }

    /**
     * 字符串转换成浏览器可识别的 -拼接形式。 如background-color
     *
     * @param str
     * @returns {string}
     */
  function dasherize(str) {
    return str.replace(/::/g, '/') //将：：替换成/
           .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2') //在大小写字符之间插入_,大写在前，比如AAAbb,得到AA_Abb
           .replace(/([a-z\d])([A-Z])/g, '$1_$2')  //在大小写字符之间插入_,小写或数字在前，比如bbbAaa,得到bbb_Aaa
           .replace(/_/g, '-')  //将_替换成-
           .toLowerCase()   //转成小写
  }
    //数组去重，如果该条数据在数组中的位置与循环的索引值不相同，则说明数组中有与其相同的值
  uniq = function(array){ return filter.call(array, function(item, idx){ return array.indexOf(item) == idx }) }

    /**
     * 将参数变为正则表达式
     * @param name
     * @returns {*}
     */
  function classRE(name) {
      //classCache,缓存正则
        //TODO 缓存可以理解，但应该在重复使用第二次时再缓存吧，直接缓存？
    return name in classCache ?
      classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
  }

    /**
     *  除了cssNumber指定的不需要加单位的，默认加上px
     * @param name
     * @param value
     * @returns {string}
     */
  function maybeAddPx(name, value) {
    return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
  }

    /**
     * 获取元素的默认display属性
     * 是为了兼容什么？
     * @param nodeName
     * @returns {*}
     */
  function defaultDisplay(nodeName) {
    var element, display
    if (!elementDisplay[nodeName]) {  //缓存里没有

      element = document.createElement(nodeName)
      document.body.appendChild(element)
      display = getComputedStyle(element, '').getPropertyValue("display")
      element.parentNode.removeChild(element)

        // display == "none"，设置成blaock，即隐藏-显示
      display == "none" && (display = "block")

      elementDisplay[nodeName] = display //TODO:缓存元素的默认display属性，缓存干嘛？
    }
    return elementDisplay[nodeName]
  }

    /**
     * 获取元素的子节集
     * 原理：原生方法children  老的火狐不支持的，遍历childNodes
     * @param element
     * @returns {*}
     */
  function children(element) {
    return 'children' in element ?
      slice.call(element.children) :
      $.map(element.childNodes, function(node){ if (node.nodeType == 1) return node })
  }

    /**
     * 构造器
     * @param dom
     * @param selector
     * @constructor
     */
  function Z(dom, selector) {
    var i, len = dom ? dom.length : 0
    for (i = 0; i < len; i++) this[i] = dom[i]
    this.length = len
    this.selector = selector || ''
  }

  // `$.zepto.fragment` takes a html string and an optional tag name
  // to generate DOM nodes nodes from the given html string.
  // The generated DOM nodes are returned as an array.
  // This function can be overriden in plugins for example to make
  // it compatible with browsers that don't support the DOM fully.
    /**
     *  内部函数 HTML 转换成 DOM
     *  原理是 创建父元素，innerHTML转换
     * @param html  html片段
     * @param name  容器标签名
     * @param propertie  附加的属性对象
     * @returns {*}
     */
  zepto.fragment = function(html, name, properties) {
    var dom, nodes, container

    // A special case optimization for a single tag
      //如果是单个元素，创建dom
      //TODO
      // RegExp 是javascript中的一个内置对象。为正则表达式。
//      RegExp.$1是RegExp的一个属性,指的是与正则表达式匹配的第一个 子匹配(以括号为标志)字符串，以此类推，RegExp.$2，RegExp.$3，..RegExp.$99总共可以有99个匹配
    if (singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1))

    if (!dom) {
        //修正自闭合标签 如<div />，转换成<div></div>
      if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>")
        //给name取元素名
      if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
        //设置容器名，如果不是tr,tbody,thead,tfoot,td,th，则容器名为div
        //为什么设置容器，是严格按照HTML语法，虽然tr td th浏览器会会自动添加tbody
      if (!(name in containers)) name = '*'

      container = containers[name]    //创建容器
      container.innerHTML = '' + html       //生成DOM
       //取容器的子节点，TODO:子节点集会返回
      dom = $.each(slice.call(container.childNodes), function(){
        container.removeChild(this)   //把创建的子节点逐个删除
      })
    }
    //如果properties是对象，遍历它，将它设置成DOM的属性
    if (isPlainObject(properties)) {
        //转换成Zepto Obj,方便调用Zepto的方法
      nodes = $(dom)
        //遍历对象，设置属性
      $.each(properties, function(key, value) {
          //优先获取属性修正对象，通过修正对象读写值
          // methodAttributes包含'val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'，
          //TODO: 奇怪的属性
        if (methodAttributes.indexOf(key) > -1) nodes[key](value)
        else nodes.attr(key, value)
      })
    }

    //返回dom数组  如[div,div]
    return dom
  }

  // `$.zepto.Z` swaps out the prototype of the given `dom` array
  // of nodes with `$.fn` and thus supplying all the Zepto functions
  // to the array. This method can be overriden in plugins.
    //入口函数？
  zepto.Z = function(dom, selector) {
    return new Z(dom, selector)
  }

  // `$.zepto.isZ` should return `true` if the given object is a Zepto
  // collection. This method can be overriden in plugins.
    //判断给定的参数是否是Zepto集
  zepto.isZ = function(object) {
    return object instanceof zepto.Z
  }

  // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
  // takes a CSS selector and an optional context (and handles various
  // special cases).
  // This method can be overriden in plugins.
  zepto.init = function(selector, context) {
    var dom
    // If nothing given, return an empty Zepto collection
    //未传参，undefined进行boolean转换，返回空Zepto对象
    if (!selector) return zepto.Z()
    // Optimize for string selectors

    //selector是字符串，即css表达式
    else if (typeof selector == 'string') {
       //去前后空格
      selector = selector.trim()
      // If it's a html fragment, create nodes from it
      // Note: In both Chrome 21 and Firefox 15, DOM error 12
      // is thrown if the fragment doesn't begin with <
      //如果是<开头 >结尾  基本的HTML代码时
      if (selector[0] == '<' && fragmentRE.test(selector))
        //调用片段生成dom
        dom = zepto.fragment(selector, RegExp.$1, context), selector = null
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      //如果传递了上下文，在上下文中查找元素
      else if (context !== undefined) return $(context).find(selector)
      // If it's a CSS selector, use it to select nodes.
      //通过css表达式查找元素
      else dom = zepto.qsa(document, selector)
    }
    // If a function is given, call it when the DOM is ready
    //如果selector是函数，则在DOM ready的时候执行它
    else if (isFunction(selector)) return $(document).ready(selector)
    // If a Zepto collection is given, just return it
    //如果selector是一个Zepto对象，返回它自己
    else if (zepto.isZ(selector)) return selector
    else {
      // normalize array if an array of nodes is given
        //如果selector是数组，过滤null,undefined
      if (isArray(selector)) dom = compact(selector)
      // Wrap DOM nodes.
      //如果selector是对象,TODO://转换为数组？ 它应是DOM; 注意DOM节点的typeof值也是object，所以在里面还要再进行一次判断
      else if (isObject(selector))
        dom = [selector], selector = null
      // If it's a html fragment, create nodes from it
      //如果selector是复杂的HTML代码，调用片段换成DOM节点
      else if (fragmentRE.test(selector))
        dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      //如果存在上下文context，仍在上下文中查找selector
      else if (context !== undefined) return $(context).find(selector)
      // And last but no least, if it's a CSS selector, use it to select nodes.
      //如果没有给定上下文，在document中查找selector
      else dom = zepto.qsa(document, selector)
    }
    // create a new Zepto collection from the nodes found
    //将查询结果转换成Zepto对象
    return zepto.Z(dom, selector)
  }

  // `$` will be the base `Zepto` object. When calling this
  // function just call `$.zepto.init, which makes the implementation
  // details of selecting nodes and creating Zepto collections
  // patchable in plugins.
  $ = function(selector, context){
    return zepto.init(selector, context)
  }

    /**
     * 内部方法：用户合并一个或多个对象到第一个对象
     * @param target 目标对象  对象都合并到target里
     * @param source 合并对象
     * @param deep 是否执行深度合并
     */
  function extend(target, source, deep) {
    for (key in source)
        //如果深度合并
      if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
          //如果要合并的属性是对象，但target对应的key非对象
        if (isPlainObject(source[key]) && !isPlainObject(target[key]))
          target[key] = {}
          //如果要合并的属性是数组，但target对应的key非数组
        if (isArray(source[key]) && !isArray(target[key]))
          target[key] = []

         //执行递归合并
        extend(target[key], source[key], deep)
      }
      //不是深度合并，直接覆盖
      //TODO: 合并不显得太简单了？
      else if (source[key] !== undefined) target[key] = source[key]
  }

  // Copy all but undefined properties from one or more
  // objects to the `target` object.
    /**
     * 对外方法
     * 合并
     * @param target
     * @returns {*}
     */
  $.extend = function(target){
    var deep,    //是否执行深度合并
        args = slice.call(arguments, 1)//arguments[0]是target，被合并对象，或为deep
    if (typeof target == 'boolean') {
        //第一个参数为boolean值时，表示是否深度合并
      deep = target
      target = args.shift()   //target取第二个参数
    }
    //遍历后面的参数，都合并到target上
    args.forEach(function(arg){ extend(target, arg, deep) })
    return target
  }

  // `$.zepto.qsa` is Zepto's CSS selector implementation which
  // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
  // This method can be overriden in plugins.
    /**
     *  通过选择器表达式查找DOM
     *  原理  判断下选择器的类型（id/class/标签/表达式）
     *  使用对应方法getElementById getElementsByClassName getElementsByTagName querySelectorAll 查找
     * @param element
     * @param selector
     * @returns {Array}
     */
  zepto.qsa = function(element, selector){
    var found,
        maybeID = selector[0] == '#',//ID标识
        maybeClass = !maybeID && selector[0] == '.',//class 标识
        //是id/class,就取'#/.'后的字符串，如‘#test’取‘test'
        nameOnly = maybeID || maybeClass ? selector.slice(1) : selector,
        isSimple = simpleSelectorRE.test(nameOnly)  //TODO:是否为单个选择器  没有空格
    return (element.getElementById && isSimple && maybeID) ? // Safari DocumentFragment doesn't have getElementById
        //通过getElementById查找DOM，找到返回[dom],找不到返回[]
      ( (found = element.getElementById(nameOnly)) ? [found] : [] ) :
        //当element不为元素节点或document fragment时，返回空
        //元素element   1   属性attr   2   文本text   3   注释comments   8   文档document   9   片段 fragment 11
      (element.nodeType !== 1 && element.nodeType !== 9 && element.nodeType !== 11) ? [] :
      slice.call(
          //如果是class，通过getElementsByClassName查找DOM，
        isSimple && !maybeID && element.getElementsByClassName ? // DocumentFragment doesn't have getElementsByClassName/TagName
          maybeClass ? element.getElementsByClassName(nameOnly) : // If it's simple, it could be a class
          element.getElementsByTagName(selector) : // Or a tag //如果是标签名,调用getElementsByTagName
            //最后调用querySelectorAll
          element.querySelectorAll(selector) // Or it's not simple, and we need to query all
      )
  }

    /**
     * 在元素集中过滤某些元素
     * @param nodes
     * @param selector
     * @returns {*|HTMLElement}
     */
  function filtered(nodes, selector) {
    return selector == null ? $(nodes) : $(nodes).filter(selector)
  }

    /**
     * 父元素是否包含子元素
     * @type {Function}
     */
  $.contains = document.documentElement.contains ?
    function(parent, node) {
        //父元素
      return parent !== node && parent.contains(node)
    } :
    function(parent, node) {
      while (node && (node = node.parentNode))
        if (node === parent) return true
      return false
    }

    /**
     * 处理 arg为函数/值
     * 为函数，返回函数返回值
     * 为值，返回值
     * @param context
     * @param arg
     * @param idx
     * @param payload
     * @returns {*}
     */
  function funcArg(context, arg, idx, payload) {
    return isFunction(arg) ? arg.call(context, idx, payload) : arg
  }

    /**
     * 设置属性
     * @param node
     * @param name
     * @param value
     */
  function setAttribute(node, name, value) {
      //value为null/undefined,处理成删除，否则设值
    value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
  }

  // access className property while respecting SVGAnimatedString
    /**
     * 对SVGAnimatedString的兼容？
     * @param node
     * @param value
     * @returns {*}
     */
  function className(node, value){
    var klass = node.className || '',
        svg   = klass && klass.baseVal !== undefined

    if (value === undefined) return svg ? klass.baseVal : klass
    svg ? (klass.baseVal = value) : (node.className = value) //class设值
  }

  // "true"  => true
  // "false" => false
  // "null"  => null
  // "42"    => 42
  // "42.5"  => 42.5
  // "08"    => "08"
  // JSON    => parse if valid
  // String  => self
    /**
     * 序列化值  把自定义数据读出来时做应该的转换，$.data()方法使用
     * @param value
     * @returns {*}
     */
  function deserializeValue(value) {
    try {
      return value ?
        value == "true" ||
        ( value == "false" ? false :
          value == "null" ? null :
          +value + "" == value ? +value :
          /^[\[\{]/.test(value) ? $.parseJSON(value) :
          value )
        : value
    } catch(e) {
      return value
    }
  }

  $.type = type
  $.isFunction = isFunction
  $.isWindow = isWindow
  $.isArray = isArray
  $.isPlainObject = isPlainObject

    /**
     * 空对象
     * @param obj
     * @returns {boolean}
     */
  $.isEmptyObject = function(obj) {
    var name
    for (name in obj) return false
    return true
  }

    /**
     * 获取在数组中的索引
     * @param elem
     * @param array
     * @param i
     * @returns {number}
     */
  $.inArray = function(elem, array, i){
      //i从第几个开始搜索
    return emptyArray.indexOf.call(array, elem, i)
  }

    //将字符串转成驼峰格式
  $.camelCase = camelize
    //去字符串头尾空格
  $.trim = function(str) {
    return str == null ? "" : String.prototype.trim.call(str)
  }

  // plugin compatibility
  $.uuid = 0
  $.support = { }
  $.expr = { }
  $.noop = function() {}


    /**
     * 内部方法
     * 遍历对象/数组 在每个元素上执行回调，将回调的返回值放入一个新的数组返回
     * @param elements
     * @param callback
     * @returns {*}
     */
  $.map = function(elements, callback){
    var value, values = [], i, key
      //如果被遍历的数据是数组或者Zepto(伪数组）
    if (likeArray(elements))
      for (i = 0; i < elements.length; i++) {
        value = callback(elements[i], i)
        if (value != null) values.push(value)
      }
    else
    //如果是对象
      for (key in elements) {
        value = callback(elements[key], key)
        if (value != null) values.push(value)
      }
    return flatten(values)
  }

    /**
     * 以集合每一个元素作为上下文，来执行回调函数
     * @param elements
     * @param callback
     * @returns {*}
     */
  $.each = function(elements, callback){
    var i, key
    if (likeArray(elements)) {        //数组、伪数组
      for (i = 0; i < elements.length; i++)
        if (callback.call(elements[i], i, elements[i]) === false) return elements
    } else {
      for (key in elements)       //对象
        if (callback.call(elements[key], key, elements[key]) === false) return elements
    }

    return elements
  }

    /**
     * 查找数组满足过滤函数的元素
     * @param elements
     * @param callback
     * @returns {*}
     */
  $.grep = function(elements, callback){
    return filter.call(elements, callback)
  }

  if (window.JSON) $.parseJSON = JSON.parse

    //填充class2type的值
  $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
    class2type[ "[object " + name + "]" ] = name.toLowerCase()
  })

  // Define methods that will be available on all
  // Zepto collections
    //针对DOM的一些操作
  $.fn = {
    constructor: zepto.Z,
    length: 0,

    // Because a collection acts like an array
    // copy over these useful array functions.
    forEach: emptyArray.forEach,
    reduce: emptyArray.reduce,
    push: emptyArray.push,
    sort: emptyArray.sort,
    splice: emptyArray.splice,
    indexOf: emptyArray.indexOf,
      /**
       * 合并多个数组
       * @returns {*}
       */
    concat: function(){
      var i, value, args = []
      for (i = 0; i < arguments.length; i++) {
        value = arguments[i]
        args[i] = zepto.isZ(value) ? value.toArray() : value
      }
      return concat.apply(zepto.isZ(this) ? this.toArray() : this, args)
    },

    // `map` and `slice` in the jQuery API work differently
    // from their array counterparts
      /**
       * 遍历对象/数组 在每个元素上执行回调，将回调的返回值放入一个新的Zepto返回
       * @param fn
       * @returns {*|HTMLElement}
       */
    map: function(fn){
      return $($.map(this, function(el, i){ return fn.call(el, i, el) }))
    },
      /**
       * slice包装成Zepto
       * @returns {*|HTMLElement}
       */
    slice: function(){
      return $(slice.apply(this, arguments))
    },

      /**
       * 当DOM载入就绪时，绑定回调
       * 如  $(function(){}） $(document).ready(function(){
  // 在这里写你的代码
       * @param callback
       * @returns {*}
       */
    ready: function(callback){
      // need to check if document.body exists for IE as that browser reports
      // document ready when it hasn't yet created the body element

        //如果已经ready
      if (readyRE.test(document.readyState) && document.body) callback($)

      //监听DOM已渲染完毕事件
      else document.addEventListener('DOMContentLoaded', function(){ callback($) }, false)
      return this
    },
      /**
       * 取Zepto中指定索引的值
       * @param idx    可选，不传时，将Zetpo转换成数组
       * @returns {*}
       */
    get: function(idx){
      return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
    },
      /**
       * 将Zepto(伪数组)转换成数组
       * 原理是 伪数组转换成数组oa = {0:'a',length:1};Array.prototype.slice.call(oa);
       * 数组转换伪数组  var obj = {}, push = Array.prototype.push; push.apply(obj,[1,2]);
       * @returns {*}
       */
    toArray: function(){
        return this.get()
    },
      //获取集合长度
    size: function(){
      return this.length
    },
      /**
       * 删除元素集
       * 原理   parentNode.removeChild
       * @returns {*}
       */
    remove: function(){
          //遍历到其父元素   removeChild
      return this.each(function(){
        if (this.parentNode != null)
          this.parentNode.removeChild(this)
      })
    },
      //遍历集合，将集合中的每一项放入callback中进行处理，去掉结果为false的项，注意这里的callback如果明确返回false
      //那么就会停止循环了
      /**
       *  遍历Zepto，在每个元素上执行回调函数
       * @param callback
       * @returns {*}
       */
    each: function(callback){

      emptyArray.every.call(this, function(el, idx){
          //el：元素，idx：下标 传递给callback(idx,el)
        return callback.call(el, idx, el) !== false
      })
      return this
    },

      /**
       *  过滤，返回处理结果为true的记录
       * @param selector
       * @returns {*}
       */
    filter: function(selector){
        //this.not(selector)取到需要排除的集合，第二次再取反(这个时候this.not的参数就是一个集合了)，得到想要的集合
      if (isFunction(selector)) return this.not(this.not(selector))

        //filter收集返回结果为true的记录
      return $(filter.call(this, function(element){
          //当element与selector匹配，则收集
        return zepto.matches(element, selector)
      }))
    },
      //将由selector获取到的结果追加到当前集合中
    add: function(selector,context){
        //追加并去重
      return $(uniq(this.concat($(selector,context))))
    },
      //返回集合中的第1条记录是否与selector匹配
    is: function(selector){
      return this.length > 0 && zepto.matches(this[0], selector)
    },
      //排除集合里满足条件的记录，接收参数为：css选择器，function, dom ,nodeList
    not: function(selector){
      var nodes=[]
        //当selector为函数时，safari下的typeof odeList也是function，所以这里需要再加一个判断selector.call !== undefined
      if (isFunction(selector) && selector.call !== undefined)
        this.each(function(idx){
            //注意这里收集的是selector.call(this,idx)返回结果为false的时候记录
          if (!selector.call(this,idx)) nodes.push(this)
        })
      else {
          //当selector为字符串的时候，对集合进行筛选，也就是筛选出集合中满足selector的记录
        var excludes = typeof selector == 'string' ? this.filter(selector) :
            //当selector为nodeList时执行slice.call(selector),注意这里的isFunction(selector.item)是为了排除selector为数组的情况
            //当selector为css选择器，执行$(selector)
          (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
        this.forEach(function(el){
            //筛选出不在excludes集合里的记录，达到排除的目的
          if (excludes.indexOf(el) < 0) nodes.push(el)
        })
      }
      return $(nodes)//由于上面得到的结果是数组，这里需要转成zepto对象，以便继承其它方法，实现链写
    },

      /*
       接收node和string作为参数，给当前集合筛选出包含selector的集合
       isObject(selector)是判断参数是否是node，因为typeof node == 'object'
       当参数为node时，只需要判读当前记当里是否包含node节点即可
       当参数为string时，则在当前记录里查询selector，如果长度为0，则为false，filter函数就会过滤掉这条记录，否则保存该记录
       */
    has: function(selector){
      return this.filter(function(){
        return isObject(selector) ?
          $.contains(this, selector) :
          $(this).find(selector).size()
      })
    },
      /**
       * 取Zepto中的指定索引的元素，再包装成Zepto返回
       * @param idx
       * @returns {*}
       */
    eq: function(idx){
      return idx === -1 ? this.slice(idx) : this.slice(idx, + idx + 1)
    },
      /*
       取第一条$(元素）
       */
    first: function(){
      var el = this[0]    //取第一个元素

       //非$对象，转换成$，
        //如果element，isObject会判断为true。zepto也判断为true，都会重新转换成$(el)
        //TODO:这里是bug？
      return el && !isObject(el) ? el : $(el)
    },
      /*
       取最后一条$(元素）
       */
    last: function(){
      var el = this[this.length - 1]
      return el && !isObject(el) ? el : $(el)
    },
      /*
       在当前集合中查找selector，selector可以是集合，选择器，以及节点
       */
    find: function(selector){
      var result, $this = this
        //如果selector为node或者zepto集合时
      if (!selector) result = $()
      //遍历selector，筛选出父级为集合中记录的selector
      else if (typeof selector == 'object')
        result = $(selector).filter(function(){
          var node = this
            //如果$.contains(parent, node)返回true，则emptyArray.some也会返回true,外层的filter则会收录该条记录
          return emptyArray.some.call($this, function(parent){
            return $.contains(parent, node)
          })
        })
      //如果selector是css选择器
      //如果当前集合长度为1时，调用zepto.qsa，将结果转成zepto对象
      else if (this.length == 1) result = $(zepto.qsa(this[0], selector))
      //如果长度大于1，则调用map遍历
      else result = this.map(function(){ return zepto.qsa(this, selector) })
      return result
    },


      /**
       * 取最近的满足selector选择器的祖先元素
       * @param selector
       * @param context
       * @returns {*|HTMLElement}
       */
    closest: function(selector, context){
      var node = this[0], collection = false
      if (typeof selector == 'object') collection = $(selector)

          //node递归parentNode，直到满足selector表达式，返回$
      while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
          //当node 不是context,document的时候，取node.parentNode
        node = node !== context && !isDocument(node) && node.parentNode
      return $(node)
    },
      /**
       * 取得所有匹配的祖先元素
       * @param selector
       * @returns {*}
       */
    parents: function(selector){
      var ancestors = [], nodes = this

      //先取得所有祖先元素
      while (nodes.length > 0)   //到不再有父元素时，退出循环
        //取得所有父元素 //nodes被再赋值为收集到的父元素数组
        nodes = $.map(nodes, function(node){
            //获取父级， isDocument(node) 到Document为止
            //    ancestors.indexOf(node)去重复
          if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
            ancestors.push(node)
              //收集已经获取到的父级元素，用于去重复
            return node
          }
        })

      //筛选出符合selector的祖先元素
      return filtered(ancestors, selector)
    },
      /**
       * 获取父元素
       * @param selector
       * @returns {*|HTMLElement}
       */
    parent: function(selector){
      return filtered(uniq(this.pluck('parentNode')), selector)
    },
      /**
       *   获取子元素集
       * @param selector
       * @returns {*|HTMLElement}
       */
    children: function(selector){
      return filtered(this.map(function(){ return children(this) }), selector)
    },
      /**
       * 获取iframe的docment，或子节集
       * @returns {*|HTMLElement}
       */
    contents: function() {
      return this.map(function() { return this.contentDocument || slice.call(this.childNodes) })
    },
      /**
       * 获取兄弟节点集
       * @param selector
       * @returns {*|HTMLElement}
       */
    siblings: function(selector){
      return filtered(this.map(function(i, el){
         //到其父元素取得所有子节点，再排除本身
        return filter.call(children(el.parentNode), function(child){ return child!==el })
      }), selector)
    },
      /**
       * 移除所有子元素
       * 原理：  innerHTML = ''
       * @returns {*}
       */
    empty: function(){
      return this.each(function(){ this.innerHTML = '' })
    },

      /**
       * 根据是否存在此属性来获取当前集合
       * @param property
       * @returns {*}
       */
    pluck: function(property){
      return $.map(this, function(el){ return el[property] })
    },
      /**
       * 展示
       * @returns {*}
       */
    show: function(){
      return this.each(function(){
          //清除内联样式display="none"
        this.style.display == "none" && (this.style.display = '')
          //计算样式display为none时，重赋显示值
        if (getComputedStyle(this, '').getPropertyValue("display") == "none")
          this.style.display = defaultDisplay(this.nodeName)
          //defaultDisplay是获取元素默认display的方法
      })
    },
      /**
       * 替换元素
       * 原理  before
       * @param newContent
       * @returns {*}
       */
    replaceWith: function(newContent){
        //将要替换内容插到被替换内容前面，然后删除被替换内容
      return this.before(newContent).remove()
    },
      /**
       * 匹配的每条元素都被单个元素包裹
       * @param structure   fun/
       * @returns {*}
       */
    wrap: function(structure){
      var func = isFunction(structure)
      if (this[0] && !func) //如果structure是字符串
        //直接转成DOM
        var dom   = $(structure).get(0),
            //如果DOM已存在(通过在文档中读parentNode判断)，或$集不止一条，需要克隆。避免DOM被移动位置
            clone = dom.parentNode || this.length > 1

      return this.each(function(index){
          //递归包裹克隆的DOM
        $(this).wrapAll(
          func ? structure.call(this, index) :
            clone ? dom.cloneNode(true) : dom  //克隆包裹
        )
      })
    },
      /**
       * 将所有匹配的元素用单个元素包裹起来
       * @param structure   包裹内容
       * @returns {*}
       */
    wrapAll: function(structure){
      if (this[0]) {
          //包裹内容插入到第一个元素前
        $(this[0]).before(structure = $(structure))
        var children
        // drill down to the inmost element
          // drill down to the inmost element
          //取包裹内容里的第一个子元素的最里层
          while ((children = structure.children()).length) structure = children.first()

          //将当前$插入到最里层元素里
        $(structure).append(this)
      }
      return this
    },
      /**
       * 包裹到里面  将每一个匹配元素的子内容(包括文本节点)用HTML包裹起来
       * 原理  获取节点的内容
       * @param structure
       * @returns {*}
       */
    wrapInner: function(structure){
      var func = isFunction(structure)
      return this.each(function(index){
          //遍历获取节点的内容，然后用structure将内容包裹
        var self = $(this), contents = self.contents(),
            dom  = func ? structure.call(this, index) : structure
        contents.length ? contents.wrapAll(dom) : self.append(dom) //内容不存在，直接添加structure
      })
    },
      /**
       * 去包裹  移除元素的父元素
       * 原理： 子元素替换父元素
       * @returns {*}
       */
    unwrap: function(){
      this.parent().each(function(){
        $(this).replaceWith($(this).children())
      })
      return this
    },
      /**
       * 复制元素的副本 TODO:事件、自定义数据会复制吗？
       * 原理  cloneNode
       * @returns {*|HTMLElement}
       */
    clone: function(){
      return this.map(function(){ return this.cloneNode(true) })
    },
      /**
       * 隐藏
       * @returns {*}
       */
    hide: function(){
      return this.css("display", "none")
    },
      /**
       * 不给参数，切换显示隐藏
       * 给参数  true show  false hide
       * @param setting
       * @returns {*}
       */
    toggle: function(setting){
      return this.each(function(){

        var el = $(this)
        ;(setting === undefined ? el.css("display") == "none" : setting) ? el.show() : el.hide()
      })
    },
      /**
       * 筛选前面所有的兄弟元素
       * @param selector
       * @returns {*}
       */
    prev: function(selector){ return $(this.pluck('previousElementSibling')).filter(selector || '*') },


      /**
       * 筛选后面所有的兄弟元素
       * @param selector
       * @returns {*}
       */
    next: function(selector){ return $(this.pluck('nextElementSibling')).filter(selector || '*') },


      /**
       * 读写元素HTML内容
       * 原理 通过innerHTML读内容,append()写内容
       * @param html
       * @returns {*|string|string|string|string|string}
       */
    html: function(html){
      return 0 in arguments ?
        this.each(function(idx){
          var originHtml = this.innerHTML   //记录原始的innerHTMl
            //如果参数html是字符串直接插入到记录中，
            //如果是函数，则将当前记录作为上下文，调用该函数，且传入该记录的索引和原始innerHTML作为参数
          $(this).empty().append( funcArg(this, html, idx, originHtml) )
        }) :
        (0 in this ? this[0].innerHTML : null)
    },
      /**
       * 读写元素文本内容
       * 原理：  通过 textContent 读写文本
       * @param text
       * @returns {*}
       */
    text: function(text){
      return 0 in arguments ?
        this.each(function(idx){                               //传参遍历写入
          var newText = funcArg(this, text, idx, this.textContent)
          this.textContent = newText == null ? '' : ''+newText
        }) :
        (0 in this ? this[0].textContent : null)   //未传参读
    },

      /**
       * 元素的HTML属性读写
       * 读：原理是getAttribute
       * 写：原理是setAttribute
       * @param name
       * @param value
       * @returns {undefined}
       */
    attr: function(name, value){
      var result
       //仅有name，且为字符串时，表示读
      return (typeof name == 'string' && !(1 in arguments)) ?
          //$是空的 或里面的元素非元素，返回undefined
        (!this.length || this[0].nodeType !== 1 ? undefined :
            //直接用getAttribute(name)读，
          (!(result = this[0].getAttribute(name)) && name in this[0]) ? this[0][name] : result
        ) :  //否则是写，不管name为对象{k:v},或name value 都存在
        this.each(function(idx){
          if (this.nodeType !== 1) return   //非元素
            //如果name为对象，批量设置属性
          if (isObject(name)) for (key in name) setAttribute(this, key, name[key])
          //处理value为函数/null/undefined的情况
          else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))
        })
    },
      /**
       * 元素的删除
       * @param name 单个值 空格分隔
       * @returns {*}
       */
    removeAttr: function(name){
      return this.each(
          function(){
              this.nodeType === 1 && name.split(' ').forEach(
                  function(attribute){
                      //不传value，会直接调用removeAttribute删除属性
                    setAttribute(this, attribute)
                 }, this)
        })
    },
      //获取第一条数据的指定的name属性或者给每条数据添加自定义属性，注意和setAttribute的区别

      /**
       * 元素的DOM属性读写
       * 原理：Element[name] 操作
       * @param name
       * @param value
       * @returns {*}
       */
    prop: function(name, value){
        //优先读取修正属性，DOM的两字母属性都是驼峰格式
      name = propMap[name] || name
      //没有给定value时，为获取，给定value则给每一条数据添加，value可以为值也可以是一个返回值的函数
      return (1 in arguments) ?
          //有value，遍历写入
        this.each(function(idx){
          this[name] = funcArg(this, value, idx, this[name])
        }) :
          //读第一个元素
        (this[0] && this[0][name])
    },

      /**
       * 设置自定义数据
       * 注意与jQuery的区别，jQuery可以读写任何数据类型。这里原理是H5的data-，或直接setAttribute/getAttribute，只能读写字符串
       * @param name
       * @param value
       * @returns {*}
       */
    data: function(name, value){
      var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase()

      var data = (1 in arguments) ?
        this.attr(attrName, value) :
        this.attr(attrName)

      return data !== null ? deserializeValue(data) : undefined
    },
      /**
       * 适合表单元素读写
       * 写： 写入每个元素   element.value
       * 读： 读第一个元素
       * @param value  值/函数
       * @returns {*}
       */
    val: function(value){
      return 0 in arguments ?
          //只有一个参数是写，
        this.each(function(idx){
          this.value = funcArg(this, value, idx, this.value)
        }) :
          //如果是读
        (this[0] && (this[0].multiple ?    //对多选的select的兼容处理，返回一个包含被选中的option的值的数组
           $(this[0]).find('option').filter(function(){ return this.selected }).pluck('value') :
           this[0].value)
        )
    },
      /**
       * 读/写坐标  距离文档document的偏移值
       * 原理： 读 getBoundingClientRect视窗坐标-页面偏移   写：坐标-父元素坐标
       * @param coordinates
       * @returns {*}
       */
    offset: function(coordinates){
          //写入坐标
      if (coordinates) return this.each(function(index){
        var $this = $(this),
            //如果coordinates是函数，执行函数，
            coords = funcArg(this, coordinates, index, $this.offset()),
        //取父元素坐标
            parentOffset = $this.offsetParent().offset(),
         //计算出合理的坐标
            props = {
              top:  coords.top  - parentOffset.top,
              left: coords.left - parentOffset.left
            }
          //修正postin  static-relative
        if ($this.css('position') == 'static') props['position'] = 'relative'

        //写入样式
        $this.css(props)
      })
      //读取坐标 取第一个元素的坐标
      if (!this.length) return null
          //如果父元素是document
      if (!$.contains(document.documentElement, this[0]))
        return {top: 0, left: 0}

          //读取到元素相对于页面视窗的位置
      var obj = this[0].getBoundingClientRect()

        //window.pageYOffset就是类似Math.max(document.documentElement.scrollTop||document.body.scrollTop)
      return {
        left: obj.left + window.pageXOffset,    //文档水平滚动偏移
        top: obj.top + window.pageYOffset,      //文档垂直滚动偏移 pageYOffset和scrollTop的区别是？
        width: Math.round(obj.width),
        height: Math.round(obj.height)
      }
    },
      /**
       * 读写样式   写：内联样式  读：计算样式
       *   原理 读：elment[style]/getComputedStyle， 写 this.style.cssText 行内样式设值
       * @param property   String/Array/Fun
       * @param value
       * @returns {*}
       */
    css: function(property, value){
        //只有一个传参，读
      if (arguments.length < 2) {
        var computedStyle, element = this[0]
        if(!element) return
         //getComputedStyle是一个可以获取当前元素所有最终使用的CSS属性值。返回的是一个CSS样式声明对象([object CSSStyleDeclaration])，只读
          //读到计算样式
        computedStyle = getComputedStyle(element, '')
          //设置样式
        if (typeof property == 'string')// 字符串
            //优先读行内样式，再读计算样式，行内样式级别最高？ TODO:似乎有bug，如果设置了!important 呢
          return element.style[camelize(property)] || computedStyle.getPropertyValue(property)
        else if (isArray(property)) {     //数组
          var props = {}
          $.each(property, function(_, prop){     //遍历读取每一条样式，存入JSON，返回
            props[prop] = (element.style[camelize(prop)] || computedStyle.getPropertyValue(prop))
          })
          return props
        }
      }

          //如果是写
      var css = ''
      if (type(property) == 'string') {
        if (!value && value !== 0)  //null，undefined时，删掉样式
          this.each(function(){
              //删除        dasherize是将字符串转换成css属性(background-color格式）
              this.style.removeProperty(dasherize(property))
          })
        else
           //‘-’格式值 + px单位
          css = dasherize(property) + ":" + maybeAddPx(property, value)
      } else {
        for (key in property)     //是对象时
          if (!property[key] && property[key] !== 0)
          //当property[key]的值为null/undefined，删除属性
            this.each(function(){ this.style.removeProperty(dasherize(key)) })
          else
            //‘-’格式值 + px单位
            css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
      }

        //设值   //TODO:   this.style.cssText +=  未考虑去重了
      return this.each(function(){ this.style.cssText += ';' + css })
    },
    index: function(element){
        //这里的$(element)[0]是为了将字符串转成node,因为this是个包含node的数组
        //当不指定element时，取集合中第一条记录在其父节点的位置
        //this.parent().children().indexOf(this[0])这句很巧妙，和取第一记录的parent().children().indexOf(this)相同
      return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
    },
      /**
       * 是否含有指定的类样式
       * @param name
       * @returns {boolean}
       */
    hasClass: function(name){
      if (!name) return false
          //some ES5的新方法 有一个匹配，即返回true 。
      return emptyArray.some.call(this, function(el){
          //this是classRE(name)生成的正则
        return this.test(className(el))
      }, classRE(name))
    },
      /**
       * 增加一个或多个类名
       * @param name  类名/空格分隔的类名/函数
       * @returns {*}
       */
    addClass: function(name){
      if (!name) return this

      //遍历增加
      return this.each(function(idx){
        //已存在，返回
        if (!('className' in this)) return
        classList = []
        var cls = className(this), newName = funcArg(this, name, idx, cls)  //修正类名，处理name是函数，SVG动画兼容的情况

          //多个类，空格分隔为数组
        newName.split(/\s+/g).forEach(function(klass){
          if (!$(this).hasClass(klass)) classList.push(klass)
        }, this)

          //设值
        classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "))
      })
    },
      /**
       *删除一个或多个类名 同addClass
       * 原理： className.repalce 替换撒谎年初
       * @param name 类名/空格分隔的类名/函数
       * @returns {*}
       */
    removeClass: function(name){
      return this.each(function(idx){
        if (!('className' in this)) return
        if (name === undefined) return className(this, '')
        classList = className(this)
        funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass){
          //替换删除
          classList = classList.replace(classRE(klass), " ")
        })
        className(this, classList.trim())
      })
    },

      /**
       *切换类的添加或移除
       * 原理 如果存在，即removeClass移除，不存在，即addClass添加
       * @param name   类名/空格分隔的类名/函数
       * @param when
       * @returns {*}
       */
    toggleClass: function(name, when){
      if (!name) return this
      return this.each(function(idx){
        var $this = $(this), names = funcArg(this, name, idx, className(this))
        names.split(/\s+/g).forEach(function(klass){
          (when === undefined ? !$this.hasClass(klass) : when) ?
            $this.addClass(klass) : $this.removeClass(klass)
        })
      })
    },
      /**
       * 读写元素 滚动条的垂直偏移
       * 读： 第一个元素  scrollTop 或 pageYOffset
       * 写：所有元素     scrollTop
       * 如果设置的偏移值，滚动做不到，可能不生效，不会取滚动最大值
       * @param value
       * @returns {*}
       */
    scrollTop: function(value){
      if (!this.length) return
      var hasScrollTop = 'scrollTop' in this[0]
          //读
      if (value === undefined) return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset//取scrollTop 或 pageYOffset(Sarifri老版只有它）

         //写
      return this.each(hasScrollTop ?
        function(){ this.scrollTop = value } :  //支持scrollTop，直接赋值
        function(){ this.scrollTo(this.scrollX, value) }) //滚到指定坐标
    },
      /**
       * 读写元素 滚动条的垂直偏移
       * 读： 第一个元素  scrollLeft 或 pageXOffset
       * 写：所有元素     scrollLeft
       * @param value
       * @returns {*}
       */
    scrollLeft: function(value){
      if (!this.length) return
      var hasScrollLeft = 'scrollLeft' in this[0]
      if (value === undefined) return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset
      return this.each(hasScrollLeft ?
        function(){ this.scrollLeft = value } :
        function(){ this.scrollTo(value, this.scrollY) })
    },

      /**
       * 获取相对父元素的坐标  当前元素的外边框magin到最近父元素内边框的距离
       * @returns {{top: number, left: number}}
       */
    position: function() {
      if (!this.length) return

      var elem = this[0],
        // Get *real* offsetParent
          //读到父元素
        offsetParent = this.offsetParent(),
        // Get correct offsets
          //读到坐标
        offset       = this.offset(),
          //读到父元素的坐标
        parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset()

      // Subtract element margins
      // note: when an element has margin: auto the offsetLeft and marginLeft
      // are the same in Safari causing offset.left to incorrectly be 0
       //坐标减去外边框
      offset.top  -= parseFloat( $(elem).css('margin-top') ) || 0
      offset.left -= parseFloat( $(elem).css('margin-left') ) || 0

      // Add offsetParent borders
       //加上父元素的border
      parentOffset.top  += parseFloat( $(offsetParent[0]).css('border-top-width') ) || 0
      parentOffset.left += parseFloat( $(offsetParent[0]).css('border-left-width') ) || 0

      // Subtract the two offsets
      return {
        top:  offset.top  - parentOffset.top,
        left: offset.left - parentOffset.left
      }
    },
      /**
       * 返回第一个匹配元素用于定位的祖先元素
       * 原理：读取父元素中第一个其position设为relative或absolute的可见元素
       * @returns {*|HTMLElement}
       */
    offsetParent: function() {
        //map遍历$集，在回调函数里读出最近的定位祖先元素 ，再返回包含这些定位元素的$对象
      return this.map(function(){
          //读取定位父元素，没有，则body
        var parent = this.offsetParent || document.body

          //如果找到的定位元素  position=‘static’继续往上找，直到body/Html
        while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static")
          parent = parent.offsetParent
        return parent
      })
    }
  }

  // for now
  $.fn.detach = $.fn.remove

  // Generate the `width` and `height` functions
  /*
   * width height 模板方法  读写width/height
   */
  ;['width', 'height'].forEach(function(dimension){
        //将width,hegiht转成Width,Height，用于document获取
    var dimensionProperty =
      dimension.replace(/./, function(m){ return m[0].toUpperCase() })

    $.fn[dimension] = function(value){
      var offset, el = this[0]
        //读时，是window 用innerWidth,innerHeight获取
      if (value === undefined) return isWindow(el) ? el['inner' + dimensionProperty] :
          //是document，用scrollWidth,scrollHeight获取
        isDocument(el) ? el.documentElement['scroll' + dimensionProperty] :
        (offset = this.offset()) && offset[dimension]   //TODO:否则用 offsetWidth offsetHeight

      //写
      else return this.each(function(idx){
        el = $(this)
          //设值，支持value为函数
        el.css(dimension, funcArg(this, value, idx, el[dimension]()))
      })
    }
  })

  function traverseNode(node, fun) {
    fun(node)
    for (var i = 0, len = node.childNodes.length; i < len; i++)
      traverseNode(node.childNodes[i], fun)
  }

  // Generate the `after`, `prepend`, `before`, `append`,
  // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
    /**
     * TODO: 模板方法：DOM的插入操作
     */
  adjacencyOperators.forEach(function(operator, operatorIndex) {
    var inside = operatorIndex % 2 //=> prepend, append  有余数 注意forEach遍历出的索引从0开始

    $.fn[operator] = function(){
      // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
        //nodes  HTML字符串生成的DOM集
      var argType, nodes = $.map(arguments, function(arg) {
            argType = type(arg)
              //传参非 object、array、null，就直接调用zepto.fragment生成DOM
            return argType == "object" || argType == "array" || arg == null ?
              arg : zepto.fragment(arg)
          }),
        //如果$长度>1,需要克隆里面的元素
          parent, copyByClone = this.length > 1

      if (nodes.length < 1) return this     //为0，不需要操作，直接返回

      //遍历源$,执行插入   _指代此参数无效或不用
      return this.each(function(_, target){
        parent = inside ? target : target.parentNode //prepend, append取父元素

        // convert all methods to a "before" operation

          //用insertBefore模拟实现
        target = operatorIndex == 0 ? target.nextSibling :   //after，target等于下一个兄弟元素，然后将DOM通过insertBefore插入到target前
                 operatorIndex == 1 ? target.firstChild :   //prepend target为parent的第一个元素，然后将DOM通过insertBefore插入到target前
                 operatorIndex == 2 ? target :       // before  直接将将DOM通过insertBefore插入到target前
                 null                                //  append  直接调用$(target).append

          //父元素是否在document中
        var parentInDocument = $.contains(document.documentElement, parent)

          //遍历待插入的元素
        nodes.forEach(function(node){
            //克隆
          if (copyByClone) node = node.cloneNode(true)

          //定位元素不存在，，没法执行插入操作，直接删除，返回
          else if (!parent) return $(node).remove()

            //插入节点后，如果被插入的节点是SCRIPT，则执行里面的内容并将window设为上下文
          //插入元素
          parent.insertBefore(node, target)

          //如果父元素在document里，修正script标签。原因是script标签通过innerHTML加入DOM不执行。需要在全局环境下执行它
          if (parentInDocument) traverseNode(node, function(el){
            if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
               (!el.type || el.type === 'text/javascript') && !el.src)
              window['eval'].call(window, el.innerHTML)
          })
        })
      })
    }

    // after    => insertAfter
    // prepend  => prependTo
    // before   => insertBefore
    // append   => appendTo
      /**
       * 插入方法转换
       * @param html
       * @returns {*}
       */
    $.fn[inside ? operator+'To' : 'insert'+(operatorIndex ? 'Before' : 'After')] = function(html){
      $(html)[operator](this)
      return this
    }
  })

   // zepto.Z.prototype 继承所有$.fn所有原型方法
  zepto.Z.prototype = Z.prototype = $.fn

  // Export internal API functions in the `$.zepto` namespace
  zepto.uniq = uniq
  zepto.deserializeValue = deserializeValue
  $.zepto = zepto

  return $
})()

// If `$` is not yet defined, point it to `Zepto`
window.Zepto = Zepto
window.$ === undefined && (window.$ = Zepto)
构造Zepto对象

结构
    var Zepto = (function() {

    //实际构造函数`
    function Z(dom, selector) {
        var i, len = dom ? dom.length : 0
        for (i = 0; i < len; i++) this[i] = dom[i]
        this.length = len
        this.selector = selector || ''
    }

    zepto.Z = function(dom, selector) {
        return new Z(dom, selector)
    }

    //是否Zepto对象
    zepto.isZ = function(object) {
        return object instanceof zepto.Z
    }

    // 初始化参数、DOM
     zepto.init = function(selector, context) {
       ...
        return zepto.Z(dom, selector)
    }

    //构造函数
    $ = function(selector, context){
        return zepto.init(selector, context)
    }
    //原型设置
    $.fn = { ... }


    zepto.Z.prototype = Z.prototype = $.fn

    $.zepto = zepto

    return $
})()

// If `$` is not yet defined, point it to `Zepto`
window.Zepto = Zepto
window.$ === undefined && (window.$ = Zepto)
