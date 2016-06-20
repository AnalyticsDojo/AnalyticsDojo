'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

/* eslint-disable no-undef, no-unused-vars, no-native-reassign */
// the $ on the iframe window object is the same
// as the one used on the main site, but
// uses the iframe document as the context
window.$(document).ready(function () {
  var _ = parent._;
  var Rx = parent.Rx;
  var chai = parent.chai;
  var assert = chai.assert;
  var tests = parent.tests;
  var common = parent.common;

  common.getJsOutput = function evalJs() {
    var code = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

    if (window.__err || !common.shouldRun()) {
      return window.__err || 'code disabled';
    }
    var output = void 0;
    try {
      /* eslint-disable no-eval */
      output = eval(code);
      /* eslint-enable no-eval */
    } catch (e) {
      window.__err = e;
    }
    return output;
  };

  common.runPreviewTests$ = function runPreviewTests$(_ref) {
    var _ref$tests = _ref.tests;
    var tests = _ref$tests === undefined ? [] : _ref$tests;
    var originalCode = _ref.originalCode;

    var rest = _objectWithoutProperties(_ref, ['tests', 'originalCode']);

    var code = originalCode;
    var editor = {
      getValue: function getValue() {
        return originalCode;
      }
    };
    if (window.__err) {
      return Rx.Observable.throw(window.__err);
    }

    // Iterate throught the test one at a time
    // on new stacks
    return Rx.Observable.from(tests, null, null, Rx.Scheduler.default)
    // add delay here for firefox to catch up
    .delay(100).map(function (test) {
      var userTest = {};
      try {
        /* eslint-disable no-eval */
        eval(test);
        /* eslint-enable no-eval */
      } catch (e) {
        userTest.err = e.message.split(':').shift();
      } finally {
        if (!test.match(/message: /g)) {
          // assumes test does not contain arrays
          // This is a patch until all test fall into this pattern
          userTest.text = test.split(',').pop();
          userTest.text = 'message: ' + userTest.text + '\');';
        } else {
          userTest.text = test;
        }
      }
      return userTest;
    })
    // gather tests back into an array
    .toArray().map(function (tests) {
      return _extends({}, rest, { tests: tests, originalCode: originalCode });
    });
  };

  // used when updating preview without running tests
  common.checkPreview$ = function checkPreview$(args) {
    if (window.__err) {
      return Rx.Observable.throw(window.__err);
    }
    return Rx.Observable.just(args);
  };

  // now that the runPreviewTest$ is defined
  // we set the subject to true
  // this will let the updatePreview
  // script now that we are ready.
  common.previewReady$.onNext(true);
});