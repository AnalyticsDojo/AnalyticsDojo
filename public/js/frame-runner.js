'use strict';

document.addEventListener('DOMContentLoaded', function () {
  var common = parent.__common;
  var frameId = window.__frameId;
  var frameReady = common[frameId + 'Ready$'] || {
    onNext: function onNext() {}
  };
  var Rx = document.Rx;
  var chai = parent.chai;
  var source = document.__source;

  document.__getJsOutput = function getJsOutput() {
    if (window.__err || !common.shouldRun()) {
      return window.__err || 'source disabled';
    }
    var output = void 0;
    try {
      /* eslint-disable no-eval */
      output = eval(source);
      /* eslint-enable no-eval */
    } catch (e) {
      output = e.message + '\n' + e.stack;
      window.__err = e;
    }
    return output;
  };

  document.__runTests$ = function runTests$() {
    var tests = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

    /* eslint-disable no-unused-vars */
    var editor = {
      getValue: function getValue() {
        return source;
      }
    };
    var code = source;
    /* eslint-enable no-unused-vars */
    if (window.__err) {
      return Rx.Observable.throw(window.__err);
    }

    // Iterate through the test one at a time
    // on new stacks
    return Rx.Observable.from(tests, null, null, Rx.Scheduler.default)
    // add delay here for firefox to catch up
    .delay(200)
    /* eslint-disable no-unused-vars */
    .map(function (_ref) {
      var text = _ref.text;
      var testString = _ref.testString;

      var assert = chai.assert;
      /* eslint-enable no-unused-vars */
      var newTest = { text: text, testString: testString };
      var test = void 0;
      try {
        /* eslint-disable no-eval */
        test = eval(testString);
        /* eslint-enable no-eval */
        if (typeof test === 'function') {
          // maybe sync/promise/observable
          if (test.length === 0) {
            test();
          }
          // callback test
          if (test.length === 1) {
            console.log('callback test');
          }
        }
      } catch (e) {
        newTest.err = e.message + '\n' + e.stack;
      }
      if (!newTest.err) {
        newTest.pass = true;
      }
      return newTest;
    })
    // gather tests back into an array
    .toArray();
  };

  // notify that the window methods are ready to run
  frameReady.onNext(null);
});