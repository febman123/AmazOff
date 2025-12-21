(function (global) {
  'use strict';

  var _bridge = null;

  function getBridgeCtor() {
    return global.WebOSServiceBridge || global.PalmServiceBridge || null;
  }

  /**
   * LS2 call helper (ES5-friendly).
   * - single reused bridge instance
   * - timeout
   * - treats {returnValue:false} as error
   */
  function ls2Call(uri, method, parameters, opts) {
    parameters = parameters || {};
    opts = opts || {};

    var timeoutMs = typeof opts.timeoutMs === 'number' ? opts.timeoutMs : 8000;
    var raw = !!opts.raw;

    return new Promise(function (resolve, reject) {
      var BridgeCtor = getBridgeCtor();
      if (!BridgeCtor) {
        reject(new Error('No LS2 bridge (WebOSServiceBridge/PalmServiceBridge)'));
        return;
      }
      if (!_bridge) _bridge = new BridgeCtor();

      var full = uri + '/' + method;
      var payload;
      try {
        payload = JSON.stringify(parameters);
      } catch (e) {
        reject(e);
        return;
      }

      var settled = false;
      var timer = setTimeout(function () {
        if (settled) return;
        settled = true;
        reject(new Error('LS2 timeout after ' + timeoutMs + 'ms: ' + full));
      }, timeoutMs);

      _bridge.onservicecallback = function (msg) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);

        if (raw) {
          resolve(msg);
          return;
        }

        var parsed = msg;
        if (typeof msg === 'string') {
          try { parsed = JSON.parse(msg); } catch (e) {}
        }

        if (parsed && typeof parsed === 'object' && parsed.returnValue === false) {
          var errText =
            parsed.errorText ||
            parsed.errorMessage ||
            parsed.message ||
            ('LS2 error: ' + full);
          var err = new Error(errText);
          err.details = parsed;
          reject(err);
          return;
        }

        resolve(parsed);
      };

      try {
        _bridge.call(full, payload);
      } catch (e) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(e);
      }
    });
  }

  global.ls2Call = ls2Call;
})(window);
