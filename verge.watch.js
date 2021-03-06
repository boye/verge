/*!
 * verge 1.9.1+201409231431
 * https://github.com/ryanve/verge
 * MIT License 2013 Ryan Van Etten
 */

(function(root, name, make) {
  if (typeof module != 'undefined' && module['exports']) module['exports'] = make();
  else root[name] = make();
}(this, 'verge', function() {

  var xports = {}
    , win = typeof window != 'undefined' && window
    , doc = typeof document != 'undefined' && document
    , docElem = doc && doc.documentElement
    , matchMedia = win['matchMedia'] || win['msMatchMedia']
    , mq = matchMedia ? function(q) {
        return !!matchMedia.call(win, q).matches;
      } : function() {
        return false;
      }
    , viewportW = xports['viewportW'] = function() {
        var a = docElem['clientWidth'], b = win['innerWidth'];
        return a < b ? b : a;
      }
    , viewportH = xports['viewportH'] = function() {
        var a = docElem['clientHeight'], b = win['innerHeight'];
        return a < b ? b : a;
      };
  
  /** 
   * Test if a media query is active. Like Modernizr.mq
   * @since 1.6.0
   * @return {boolean}
   */  
  xports['mq'] = mq;

  /** 
   * Normalized matchMedia
   * @since 1.6.0
   * @return {MediaQueryList|Object}
   */ 
  xports['matchMedia'] = matchMedia ? function() {
    // matchMedia must be binded to window
    return matchMedia.apply(win, arguments);
  } : function() {
    // Gracefully degrade to plain object
    return {};
  };

  /**
   * @since 1.8.0
   * @return {{width:number, height:number}}
   */
  function viewport() {
    return {'width':viewportW(), 'height':viewportH()};
  }
  xports['viewport'] = viewport;
  
  /** 
   * Cross-browser window.scrollX
   * @since 1.0.0
   * @return {number}
   */
  xports['scrollX'] = function() {
    return win.pageXOffset || docElem.scrollLeft; 
  };

  /** 
   * Cross-browser window.scrollY
   * @since 1.0.0
   * @return {number}
   */
  xports['scrollY'] = function() {
    return win.pageYOffset || docElem.scrollTop; 
  };

  /**
   * @param {{top:number, right:number, bottom:number, left:number}} coords
   * @param {number=} cushion adjustment
   * @return {Object}
   */
  function calibrate(coords, cushion) {
    var o = {};
    cushion = +cushion || 0;
    o['width'] = (o['right'] = coords['right'] + cushion) - (o['left'] = coords['left'] - cushion);
    o['height'] = (o['bottom'] = coords['bottom'] + cushion) - (o['top'] = coords['top'] - cushion);
    return o;
  }

  /**
   * Cross-browser element.getBoundingClientRect plus optional cushion.
   * Coords are relative to the top-left corner of the viewport.
   * @since 1.0.0
   * @param {Element|Object} el element or stack (uses first item)
   * @param {number=} cushion +/- pixel adjustment amount
   * @return {Object|boolean}
   */
  function rectangle(el, cushion) {
    el = el && !el.nodeType ? el[0] : el;
    if (!el || 1 !== el.nodeType) return false;
    return calibrate(el.getBoundingClientRect(), cushion);
  }
  xports['rectangle'] = rectangle;

  /**
   * Get the viewport aspect ratio (or the aspect ratio of an object or element)
   * @since 1.7.0
   * @param {(Element|Object)=} o optional object with width/height props or methods
   * @return {number}
   * @link http://w3.org/TR/css3-mediaqueries/#orientation
   */
  function aspect(o) {
    o = null == o ? viewport() : 1 === o.nodeType ? rectangle(o) : o;
    var h = o['height'], w = o['width'];
    h = typeof h == 'function' ? h.call(o) : h;
    w = typeof w == 'function' ? w.call(o) : w;
    return w/h;
  }
  xports['aspect'] = aspect;

  /**
   * Test if an element is in the same x-axis section as the viewport.
   * @since 1.0.0
   * @param {Element|Object} el
   * @param {number=} cushion
   * @return {boolean}
   */
  xports['inX'] = function(el, cushion) {
    var r = rectangle(el, cushion);
    return !!r && r.right >= 0 && r.left <= viewportW();
  };

  /**
   * Test if an element is in the same y-axis section as the viewport.
   * @since 1.0.0
   * @param {Element|Object} el
   * @param {number=} cushion
   * @return {boolean}
   */
  xports['inY'] = function(el, cushion) {
    var r = rectangle(el, cushion);
    return !!r && r.bottom >= 0 && r.top <= viewportH();
  };

  /**
   * Test if an element is in the viewport.
   * @since 1.0.0
   * @param {Element|Object} el
   * @param {number=} cushion
   * @return {boolean}
   */
  xports['inViewport'] = function(el, cushion) {
    // Equiv to `inX(el, cushion) && inY(el, cushion)` but just manually do both 
    // to avoid calling rectangle() twice. It gzips just as small like this.
    var r = rectangle(el, cushion);
    return !!r && r.bottom >= 0 && r.right >= 0 && r.top <= viewportH() && r.left <= viewportW();
  };

  return xports;
}));
/* global verge */
(function(window, verge) {

  if (!verge) {
    return;
  }

  function _noop() {}

  function _isArray(arr) {
    return Object.prototype.toString.call(arr) === '[object Array]';
  }

  function _watch(options) {
    var target = options.target,
        callbacks = {
          'in': _noop,
          'out': _noop
        };

    if ( !target ) {
      return this;
    }

    if ( !target || (target.nodeType && target.nodeType !== 1) ) {
      return this;
    }

    if ( _isArray(options.callback) ) {
      callbacks['in'] = options.callback[0];
      callbacks['out'] = options.callback[1];
    } else if ( typeof options.callback === 'function' ) {
      callbacks['in'] = options.callback;
    }

    _monitor(target, callbacks, options.interval);

    return this; 
  }

  function _monitor(target, callbacks, interval) {
    var didScroll = true,
        didResize = true,
        reset = false,
        evt;

    _addEventListener(window, 'scroll', function (e) {
      evt = e || window.event;
      if ( !didScroll ) {
        didScroll = true;
      }
    });

    _addEventListener(window, 'resize', function (e) {
      evt = e || window.event;
      if ( !didResize ) {
        didResize = true;        
      }
    });

     function _isInViewport() {
        if ( verge.inViewport(target) ) {
          if ( !reset ) {
            reset = true;
            callbacks['in'].apply(target, [evt]);
          }
        } else {
          if ( reset ) {
            reset = false;
            callbacks['out'].apply(target, [evt]);
          }
        }
      }

    setInterval(function () {
      if ( didScroll ) {
        didScroll = false;
        _isInViewport();
      }
      if ( didResize ) {
        didResize = false;
        _isInViewport();
      }
    }, interval || 150);
  }

  function _addEventListener(obj, evt, fn) {
    if ( obj.addEventListener ) {
      obj.addEventListener(evt, fn, false);
      return true;
    } else if ( obj.attachEvent ) {
      return obj.attachEvent('on' + evt, fn);
    }
    return false;
  }

  function _extend(original, extended) {
    var key;
    extended = extended || {};
    for (key in extended) {
      if (extended.hasOwnProperty(key)) {
        original[key] = extended[key];
      }
    }
    return original;
  }

  return _extend(window.verge, {watch: _watch});

}(this, verge));