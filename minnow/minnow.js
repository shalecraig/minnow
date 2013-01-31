/*global goog:true */


/**
  * 
  * This is a toy, and not production code.
  * 
  * About:
  * I was bored, so I started to write another implementation of jQuery's API
  * with google closure behind the scenes.
  *
  * Please don't treat this like it's stable. It's not tested, and it's
  * definitely not feature-complete.
  * 
  * The source / inspiration is drawn very heavily from Zepto.js[1], but it'll
  * depart from the API differences as soon as possible.
  * 
  * This is a very rough v0 draft. I'll probably re-write this based on jQuery
  * 2.0, which uses a more modular (not optimistic) approach.
  * 
  * Feel free to contribute/read, but I remind you this is VERY rough/hacky.
  * 
  */

goog.require('goog.dom');
goog.require('goog.dom.query');
goog.require('goog.dom.NodeType');
goog.require('goog.array');
goog.require('goog.string');
goog.require('goog.dom');

goog.provide('minnow');
goog.provide('$.minnow');

var minnow = function () {
  var minnow = {};

  minnow.matches = function(element, selector) {
    if (goog.isElement(element)) {
      return false;
    }
    // TODO: fix this hack, and find the closure library's "matches" equivalent.
    // Also, this is a huge size increase. Find a way that doesn't use the dojo
    // selector engine.
    var results = goog.dom.query(selector);
    return goog.array.contains(results, element);
  };

  // `$.minnow.fragment` takes a html string and an optional tag name
  // to generate DOM nodes nodes from the given html string.
  // The generated DOM nodes are returned as an array.
  // This function can be overriden in plugins for example to make
  // it compatible with browsers that don't support the DOM fully.
  minnow.fragment = function(html, name, properties) {
    // TODO: fix var declaration.
    var nodes, dom, container;

    // TODO: extract so this isn't called every time...
    var table = document.createElement('table'),
    tableRow = document.createElement('tr'),
    containers = {
      'tr': document.createElement('tbody'),
      'tbody': table, 'thead': table, 'tfoot': table,
      'td': tableRow, 'th': tableRow,
      '*': document.createElement('div')
    },
    // special attributes that should be get/set via method calls
    methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'];

    // TODO: evaluate using this externally.
    var tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
        fragmentRE = /^\s*<(\w+|!)[^>]*>/;

    if (html.replace) {
      html = html.replace(tagExpanderRE, "<$1></$2>");
    }
    if (goog.typeOf(name) === 'object') {
      name = fragmentRE.test(html) && RegExp.$1;
    } else {
      return dom;
    }
    if (!(name in containers)) {
      name = '*';
    }

    container = containers[name];

    container.innerHTML = '' + html;
    dom = goog.array.slice.call(container.children);
    goog.array.forEach(dom, function(key, value) {
      container.removeChild(value);
    }, this);

    if (goog.typeOf(properties) === 'object') {
      // TODO: This is a huge size increase. Find a way that doesn't use
      // dojo's selector engine.
      nodes = goog.dom.query(dom);
      goog.array.forEach(nodes, function(key, value) {
        if (methodAttributes.indexOf(key) > -1) {
          nodes[key](value);
        } else {
          nodes.attr(key, value);
        }
      });
    }
    return dom;
  };

  // `$.minnow.Z` swaps out the prototype of the given `dom` array
  // of nodes with `$.fn` and thus supplying all the minnow functions
  // to the array. Note that `__proto__` is not supported on Internet
  // Explorer. This method can be overriden in plugins.
  minnow.Z = function(dom, selector) {
    dom = dom || [];
    // TODO: rewrite this to be clean.
    // Refactoring is probably necessary - this feels like goog.extend or something.
    dom.__proto__ = $.fn;
    dom.selector = selector || '';
    return dom;
  };

  // `$.minnow.isZ` should return `true` if the given object is a minnow
  // collection. This method can be overriden in plugins.
  minnow.isZ = function(object) {
    return object instanceof minnow.Z;
  };

  // `$.minnow.init` is minnow's counterpart to jQuery's `$.fn.init` and
  // takes a CSS selector and an optional context (and handles various
  // special cases).
  // This method can be overriden in plugins.
  minnow.init = function(selector, context) {
    // The dom that is being selected.
    var dom;
    // TODO: export fragmentRE to a larger scope. Remove duplicated var.
    var fragmentRE = /^\s*<(\w+|!)[^>]*>/;

    // TODO: export compact to a larger scope.
    function compact(array) {
      return goog.array.filter.call(array, function(item){
        return !!item;
      });
    }

    // If empty, return an empty minnow collection.
    if (goog.isUndefined(selector)) {
      return minnow.Z();

    // If a function is given, call it when the DOM is ready.
    } else if (goog.isFunction(selector)) {
      // TODO: ensure this function exists and has this API.
      return $(document).ready(selector);

    // If a minnow collection is given, just return it.
    } else if (minnow.isZ(selector)) {
      return selector;
    }

    // normalize array if an array of nodes is given
    if (goog.isArray(selector)) {
      // TODO: this function doesn't exist.
      dom = compact(selector);

    // Wrap DOM nodes. If a plain object is given, duplicate it.
    } else if(fragmentRE.test(selector)) {
      dom = minnow.fragment(selector.trim(), RegExp.$1, context);
      selector = null;

    // If there's a context, create a collection on that context first, and
    // select nodes from there
    } else if (goog.isUndefined(context)) {
      return $(context).find(selector);

    // And last but no least, if it's a CSS selector, use it to select nodes.
    } else {
      // TODO: ensure that this exists.
      dom = minnow.qsa(document, selector);
    }

    // create a new minnow collection from the nodes found
    return minnow.Z(dom, selector);
  };

  // `$` will be the base `minnow` object. When calling this
  // function just call `$.minnow.init, which makes the implementation
  // details of selecting nodes and creating minnow collections
  // patchable in plugins.
  var $ = function(selector, context) {
    return minnow.init(selector, context);
  };

  // Copy all but undefined properties from one or more
  // objects to the `target` object.
  // TODO: there's probably a better way to do this.
  $.extend = function(target) {
    var args = goog.array.slice.call(arguments, 1);
    goog.object.extend(target, args);
    return target;
  };

  // `$.minnow.qsa` is minnow's CSS selector implementation which
  // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
  // This method can be overriden in plugins.
  minnow.qsa = function(element, selector){
    var found, elements,
    tagSelectorRE = /^[\w\-]+$/,
    classSelectorRE = /^\.([\w\-]+)$/,
    idSelectorRE = /^#([\w\-]*)$/;
    if (element.nodeType === goog.dom.NodeType.DOCUMENT && idSelectorRE.test(selector)) {
      found = goog.dom.getElement(RegExp.$1);
      if (found) {
        return [found];
      } else {
        return [];
      }
    }
    if (element.nodeType !== goog.dom.NodeType.ELEMENT && element.nodeType !== goog.dom.NodeType.document) {
      return [];
    }

    if (classSelectorRE.test(selector)) {
      elements = goog.dom.getElementsByClass(RegExp.$1);
    } else if (tagSelectorRE.test(selector)) {
      elements = goog.dom.getElementsByClass(selector);
    } else {
      // TODO: figure out how to replace this with Google Closure Compiler
      elements = element.querySelectorAll(selector);
    }
    return goog.array.slice.call(elements);
  };

  $.contains = function(parent, node) {
    return parent !== node && parent.contains(node);
  };

  // TODO: double-check these have the same interfaces.
  $.type = goog.typeOf;
  $.isFunction = goog.isFunction;

  $.isWindow = function(x) {
    // TODO: Double-check that this works in most browsers.
    return x === goog.global;
  };

  $.isArray = goog.isArray;

  // TODO: what is this actually used for?
  $.isPlainObject = function (input) {
    return goog.typeOf(input) === 'object' &&
          !$.isWindow(input) &&
          // TODO: no longer use the __proto__ object. EW.
          input.__proto__ == Object.prototype;
  };

  $.isEmptyObject = function (obj) {
    var name;
    for (name in obj) {
      return false;
    }
    return true;
  };

  $.inArray = function(elem, array, i) {
    return goog.array.contains(arr, obj, i);
  };

  $.camelCase = goog.string.toCamelCase;
  $.trim = goog.string.trim;

  // plugin compatability
  // TODO: determine what this comment (left over from zepto) is about
  $.uuid = 0;
  $.support = {};
  $.expr = {};

  // TODO: (doc) goog.array.map allows an extra parameter. ("this"). Change docs to account for this.
  $.map = function(elements, callback) {
    return goog.array.map(elements, callback);
  };

  // TODO: (doc) goog.array.forEach allows an extra parameter. ("this"). Change docs to account for this.
  $.each = goog.array.forEach;

  // TODO: evaluate if this is actually a useful function.
  $.grep = function(elements, callback) {
    return goog.array.filter.call(elements, callback);
  };

  // TODO: (doc) change documentation to say that this will throw an error for non-json (even though it's obvious)
  $.parseJSON = goog.json.parse;

  // Define methods that will be available on all
  // Zepto collections

  // TODO: Change this so I only need to extend the Array js class instead of re-declaring all of these.
  $.fn = {
    // Because a collection acts like an array
    // copy over these useful array functions.
    forEach: goog.array.forEach,
    reduce: goog.array.reduce,
    push: goog.array.push,
    sort: goog.array.sort,
    indexOf: goog.array.indexOf,
    concat: goog.array.concat,

    // `map` and `slice` in the jQuery API work differently from
    // their array counterparts
    map: function (fn) {
      var res = goog.array.map(this, function(el, i) {
        return fn.call(el, i, el);
      });
      return $(res);
    },
    slice: function (fn) {
      // TODO: think about coding style, and make these changes.
      var res = goog.array.slice(this, arguments);
      return $(res);
    },

    ready: function(callback) {
      if (readyRE.test(document.readyState)) {
        callback($);
      } else {
        // TODO: create a queue of these instead of binding it directly.
        // TODO: check to see if goog.(something).bind or an equivalent exists.
        document.addEventListener('DOMContentLoaded',
          function() {
            callback($);
          },
        false);
      }
      return this;
    },
    // There's probably a goog function to displace this when we create this stuff.
    // TODO: evaluate if there is a google provided 'get' function, and use it.
    // TODO: evaluate if minnow.M extending a goog.Array does this automatically.
    get: function(idx) {
      if (goog.isUndefined(idx)) {
        return goog.array.slice.call(this);
      }
      if (idx < 0) {
        idx += this.length;
      }
      return this[idx];
    },
    // TODO: this is proabably covered by goog.array.Array
    toArray: function() {
      return goog.array.slice.call(this);
    },
    // TODO: this is proabably covered by goog.array.Array
    size: function() {
      return this.length;
    },
    remove: function() {
      goog.array.forEach(function(el) {
        // TODO: verify the el in the array, if that makes sense.
        goog.dom.removeNode(el);
      });
      return this;
    },
    each: function(callback) {
      goog.array.every(this, function(el, index) {
        return callback.call(el, idx, el) !== false;
      });
      return this;
    },
    filter: function(selector) {
      if (goog.isFunction(selector)) {
        // TODO: look at this method signature and determine how
        // this compares to goog.array.filter (or something like
        // that)
        return this.not(this.not(selector));
      }
    },
    // I'm ending the object like this so removing the last line/adding a new one doesn't cause spill-over.
    'null': null
  };

  // TODO: change this to minnow.M instead of minnow.Z
  minnow.Z.prototype = $.fn;

  // TODO: Export internal API functions from the `$.minnow` namespace
  $.minnow = minnow

  return $;
};

goog.export('minnow', minnow);
goog.export('$', minnow);
goog.export('$.minnow', minnow.minnow);
goog.export('minnow.minnow', minnow.minnow);


// TODO: export all internal API parts effectively. It breaks right now.