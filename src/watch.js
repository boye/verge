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