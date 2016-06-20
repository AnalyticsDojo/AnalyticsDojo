'use strict';

window.common = function (global) {
  // common namespace
  // all classes should be stored here
  // called at the beginning of dom ready
  var _global$Rx = global.Rx;
  var Disposable = _global$Rx.Disposable;
  var Observable = _global$Rx.Observable;
  var config = _global$Rx.config;
  var _global$common = global.common;
  var common = _global$common === undefined ? { init: [] } : _global$common;

  config.longStackSupport = true;
  common.head = common.head || [];
  common.tail = common.tail || [];
  common.salt = Math.random();

  common.challengeTypes = {
    HTML: '0',
    JS: '1',
    VIDEO: '2',
    ZIPLINE: '3',
    BASEJUMP: '4',
    BONFIRE: '5',
    HIKES: '6',
    STEP: '7'
  };

  common.arrayToNewLineString = function arrayToNewLineString(seedData) {
    seedData = Array.isArray(seedData) ? seedData : [seedData];
    return seedData.reduce(function (seed, line) {
      return '' + seed + line + '\n';
    }, '');
  };

  common.seed = common.arrayToNewLineString(common.challengeSeed);

  common.replaceScriptTags = function replaceScriptTags(value) {
    return value.replace(/<script>/gi, 'fccss').replace(/<\/script>/gi, 'fcces');
  };

  common.replaceSafeTags = function replaceSafeTags(value) {
    return value.replace(/fccss/gi, '<script>').replace(/fcces/gi, '</script>');
  };

  common.replaceFormActionAttr = function replaceFormAction(value) {
    return value.replace(/<form[^>]*>/, function (val) {
      return val.replace(/action(\s*?)=/, 'fccfaa$1=');
    });
  };

  common.replaceFccfaaAttr = function replaceFccfaaAttr(value) {
    return value.replace(/<form[^>]*>/, function (val) {
      return val.replace(/fccfaa(\s*?)=/, 'action$1=');
    });
  };

  common.scopejQuery = function scopejQuery(str) {
    return str.replace(/\$/gi, 'j$').replace(/document/gi, 'jdocument').replace(/jQuery/gi, 'jjQuery');
  };

  common.unScopeJQuery = function unScopeJQuery(str) {
    return str.replace(/j\$/gi, '$').replace(/jdocument/gi, 'document').replace(/jjQuery/gi, 'jQuery');
  };

  var commentRegex = /(\/\*[^(\*\/)]*\*\/)|([ \n]\/\/[^\n]*)/g;
  common.removeComments = function removeComments(str) {
    return str.replace(commentRegex, '');
  };

  var logRegex = /(console\.[\w]+\s*\(.*\;)/g;
  common.removeLogs = function removeLogs(str) {
    return str.replace(logRegex, '');
  };

  common.reassembleTest = function reassembleTest() {
    var code = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
    var _ref = arguments[1];
    var line = _ref.line;
    var text = _ref.text;

    var regexp = new RegExp('//' + line + common.salt);
    return code.replace(regexp, text);
  };

  common.getScriptContent$ = function getScriptContent$(script) {
    return Observable.create(function (observer) {
      var jqXHR = $.get(script, null, null, 'text').success(function (data) {
        observer.onNext(data);
        observer.onCompleted();
      }).fail(function (e) {
        return observer.onError(e);
      }).always(function () {
        return observer.onCompleted();
      });

      return new Disposable(function () {
        jqXHR.abort();
      });
    });
  };

  var openScript = /\<\s?script\s?\>/gi;
  var closingScript = /\<\s?\/\s?script\s?\>/gi;

  // detects if there is JavaScript in the first script tag
  common.hasJs = function hasJs(code) {
    return !!common.getJsFromHtml(code);
  };

  // grabs the content from the first script tag in the code
  common.getJsFromHtml = function getJsFromHtml(code) {
    // grab user javaScript
    return (code.split(openScript)[1] || '').split(closingScript)[0] || '';
  };

  return common;
}(window);
'use strict';

window.common = function (global) {
  var $ = global.$;
  var Observable = global.Rx.Observable;
  var _global$common = global.common;
  var common = _global$common === undefined ? { init: [] } : _global$common;

  common.ctrlEnterClickHandler = function ctrlEnterClickHandler(e) {
    // ctrl + enter or cmd + enter
    if (e.keyCode === 13 && (e.metaKey || e.ctrlKey)) {
      $('#complete-courseware-dialog').off('keydown', ctrlEnterClickHandler);
      if ($('#submit-challenge').length > 0) {
        $('#submit-challenge').click();
      } else {
        window.location = '/challenges/next-challenge?id=' + common.challengeId;
      }
    }
  };

  common.init.push(function ($) {

    var $marginFix = $('.innerMarginFix');
    $marginFix.css('min-height', $marginFix.height());

    common.submitBtn$ = Observable.fromEvent($('#submitButton'), 'click');

    common.resetBtn$ = Observable.fromEvent($('#reset-button'), 'click');

    // init modal keybindings on open
    $('#complete-courseware-dialog').on('shown.bs.modal', function () {
      $('#complete-courseware-dialog').keydown(common.ctrlEnterClickHandler);
    });

    // remove modal keybinds on close
    $('#complete-courseware-dialog').on('hidden.bs.modal', function () {
      $('#complete-courseware-dialog').off('keydown', common.ctrlEnterClickHandler);
    });

    // video checklist binding
    $('.challenge-list-checkbox').on('change', function () {
      var checkboxId = $(this).parent().parent().attr('id');
      if ($(this).is(':checked')) {
        $(this).parent().siblings().children().addClass('faded');
        if (!localStorage || !localStorage[checkboxId]) {
          localStorage[checkboxId] = true;
        }
      }

      if (!$(this).is(':checked')) {
        $(this).parent().siblings().children().removeClass('faded');
        if (localStorage[checkboxId]) {
          localStorage.removeItem(checkboxId);
        }
      }
    });

    $('.checklist-element').each(function () {
      var checklistElementId = $(this).attr('id');
      if (localStorage[checklistElementId]) {
        $(this).children().children('li').addClass('faded');
        $(this).children().children('input').trigger('click');
      }
    });

    // video challenge submit
    $('#next-courseware-button').on('click', function () {
      $('#next-courseware-button').unbind('click');
      if ($('.signup-btn-nav').length < 1) {
        var data;
        var solution = $('#public-url').val() || null;
        var githubLink = $('#github-url').val() || null;
        switch (common.challengeType) {
          case common.challengeTypes.VIDEO:
            data = {
              id: common.challengeId,
              name: common.challengeName,
              challengeType: +common.challengeType
            };
            $.ajax({
              url: '/completed-challenge/',
              type: 'POST',
              data: JSON.stringify(data),
              contentType: 'application/json',
              dataType: 'json'
            }).success(function (res) {
              if (!res) {
                return;
              }
              window.location.href = '/challenges/next-challenge?id=' + common.challengeId;
            }).fail(function () {
              window.location.replace(window.location.href);
            });

            break;
          case common.challengeTypes.BASEJUMP:
          case common.challengeTypes.ZIPLINE:
            data = {
              id: common.challengeId,
              name: common.challengeName,
              challengeType: +common.challengeType,
              solution: solution,
              githubLink: githubLink
            };

            $.ajax({
              url: '/completed-zipline-or-basejump/',
              type: 'POST',
              data: JSON.stringify(data),
              contentType: 'application/json',
              dataType: 'json'
            }).success(function () {
              window.location.href = '/challenges/next-challenge?id=' + common.challengeId;
            }).fail(function () {
              window.location.replace(window.location.href);
            });
            break;

          case common.challengeTypes.BONFIRE:
            window.location.href = '/challenges/next-challenge?id=' + common.challengeId;
            break;

          default:
            console.log('Happy Coding!');
            break;
        }
      }
    });

    if (common.challengeName) {
      window.ga('send', 'event', 'Challenge', 'load', common.gaName);
    }

    $('#complete-courseware-dialog').on('hidden.bs.modal', function () {
      if (common.editor.focus) {
        common.editor.focus();
      }
    });

    $('#trigger-issue-modal').on('click', function () {
      $('#issue-modal').modal('show');
    });

    $('#trigger-help-modal').on('click', function () {
      $('#help-modal').modal('show');
    });

    $('#trigger-reset-modal').on('click', function () {
      $('#reset-modal').modal('show');
    });

    $('#trigger-pair-modal').on('click', function () {
      $('#pair-modal').modal('show');
    });

    $('#completed-courseware').on('click', function () {
      $('#complete-courseware-dialog').modal('show');
    });

    $('#help-ive-found-a-bug-wiki-article').on('click', function () {
      window.open('https://github.com/FreeCodeCamp/FreeCodeCamp/wiki/' + "Help-I've-Found-a-Bug", '_blank');
    });

    $('#search-issue').on('click', function () {
      var queryIssue = window.location.href.toString().split('?')[0].replace(/(#*)$/, '');
      window.open('https://github.com/FreeCodeCamp/FreeCodeCamp/issues?q=' + 'is:issue is:all ' + common.challengeName + ' OR ' + queryIssue.substr(queryIssue.lastIndexOf('challenges/') + 11).replace('/', ''), '_blank');
    });
  });

  return common;
}(window);
'use strict';

// depends on: codeUri
window.common = function (global) {
  var localStorage = global.localStorage;
  var _global$common = global.common;
  var common = _global$common === undefined ? { init: [] } : _global$common;

  var challengePrefix = ['Bonfire: ', 'Waypoint: ', 'Zipline: ', 'Basejump: ', 'Checkpoint: '],
      item;

  var codeStorage = {
    getStoredValue: function getStoredValue(key) {
      if (!localStorage || typeof localStorage.getItem !== 'function' || !key || typeof key !== 'string') {
        console.log('unable to read from storage');
        return '';
      }
      if (localStorage.getItem(key + 'Val')) {
        return '' + localStorage.getItem(key + 'Val');
      } else {
        for (var i = 0; i <= challengePrefix.length; i++) {
          item = localStorage.getItem(challengePrefix[i] + key + 'Val');
          if (item) {
            return '' + item;
          }
        }
      }
    },

    isAlive: function isAlive(key) {
      var val = this.getStoredValue(key);
      return val !== 'null' && val !== 'undefined' && val && val.length > 0;
    },

    updateStorage: function updateStorage(key, code) {
      if (!localStorage || typeof localStorage.setItem !== 'function' || !key || typeof key !== 'string') {
        console.log('unable to save to storage');
        return code;
      }
      localStorage.setItem(key + 'Val', code);
      return code;
    }
  };

  common.codeStorage = codeStorage;

  return common;
}(window, window.common);
'use strict';

// store code in the URL
window.common = function (global) {
  var _encode = global.encodeURIComponent;
  var _decode = global.decodeURIComponent;
  var location = global.location;
  var history = global.history;
  var _global$common = global.common;
  var common = _global$common === undefined ? { init: [] } : _global$common;
  var replaceScriptTags = common.replaceScriptTags;
  var replaceSafeTags = common.replaceSafeTags;
  var replaceFormActionAttr = common.replaceFormActionAttr;
  var replaceFccfaaAttr = common.replaceFccfaaAttr;

  var queryRegex = /^(\?|#\?)/;
  function encodeFcc(val) {
    return replaceScriptTags(replaceFormActionAttr(val));
  }

  function decodeFcc(val) {
    return replaceSafeTags(replaceFccfaaAttr(val));
  }

  var codeUri = {
    encode: function encode(code) {
      return _encode(code);
    },
    decode: function decode(code) {
      try {
        return _decode(code);
      } catch (ignore) {
        return null;
      }
    },
    isInQuery: function isInQuery(query) {
      var decoded = codeUri.decode(query);
      if (!decoded || typeof decoded.split !== 'function') {
        return false;
      }
      return decoded.replace(queryRegex, '').split('&').reduce(function (found, param) {
        var key = param.split('=')[0];
        if (key === 'solution') {
          return true;
        }
        return found;
      }, false);
    },
    isAlive: function isAlive() {
      return codeUri.enabled && codeUri.isInQuery(location.search) || codeUri.isInQuery(location.hash);
    },
    getKeyInQuery: function getKeyInQuery(query) {
      var keyToFind = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

      return query.split('&').reduce(function (oldValue, param) {
        var key = param.split('=')[0];
        var value = param.split('=').slice(1).join('=');

        if (key === keyToFind) {
          return value;
        }
        return oldValue;
      }, null);
    },
    getSolutionFromQuery: function getSolutionFromQuery() {
      var query = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

      return decodeFcc(codeUri.decode(codeUri.getKeyInQuery(query, 'solution')));
    },

    parse: function parse() {
      if (!codeUri.enabled) {
        return null;
      }
      var query;
      if (location.search && codeUri.isInQuery(location.search)) {
        query = location.search.replace(/^\?/, '');

        if (history && typeof history.replaceState === 'function') {
          history.replaceState(history.state, null, location.href.split('?')[0]);
          location.hash = '#?' + encodeFcc(query);
        }
      } else {
        query = location.hash.replace(/^\#\?/, '');
      }

      if (!query) {
        return null;
      }

      return this.getSolutionFromQuery(query);
    },
    querify: function querify(solution) {
      if (!codeUri.enabled) {
        return null;
      }
      if (history && typeof history.replaceState === 'function') {
        // grab the url up to the query
        // destroy any hash symbols still clinging to life
        var url = location.href.split('?')[0].replace(/(#*)$/, '');
        history.replaceState(history.state, null, url + '#?' + (codeUri.shouldRun() ? '' : 'run=disabled&') + 'solution=' + codeUri.encode(encodeFcc(solution)));
      } else {
        location.hash = '?solution=' + codeUri.encode(encodeFcc(solution));
      }

      return solution;
    },
    enabled: true,
    shouldRun: function shouldRun() {
      return !this.getKeyInQuery((location.search || location.hash).replace(queryRegex, ''), 'run');
    }
  };

  common.init.push(function () {
    codeUri.parse();
  });

  common.codeUri = codeUri;
  common.shouldRun = function () {
    return codeUri.shouldRun();
  };

  return common;
}(window);
'use strict';

window.common = function (global) {
  var loopProtect = global.loopProtect;
  var _global$common = global.common;
  var common = _global$common === undefined ? { init: [] } : _global$common;

  loopProtect.hit = function hit(line) {
    var err = 'Error: Exiting potential infinite loop at line ' + line + '. To disable loop protection, write: \n\\/\\/ noprotect\nas the first' + 'line. Beware that if you do have an infinite loop in your code' + 'this will crash your browser.';
    console.error(err);
  };

  common.addLoopProtect = function addLoopProtect() {
    var code = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

    return loopProtect(code);
  };

  return common;
}(window);
'use strict';

window.common = function (global) {
  var _global$common = global.common;
  var common = _global$common === undefined ? { init: [] } : _global$common;
  var doc = global.document;

  common.getIframe = function getIframe() {
    var id = arguments.length <= 0 || arguments[0] === undefined ? 'preview' : arguments[0];

    var previewFrame = doc.getElementById(id);

    // create and append a hidden preview frame
    if (!previewFrame) {
      previewFrame = doc.createElement('iframe');
      previewFrame.id = id;
      previewFrame.setAttribute('style', 'display: none');
      doc.body.appendChild(previewFrame);
    }

    return previewFrame.contentDocument || previewFrame.contentWindow.document;
  };

  return common;
}(window);
'use strict';

window.common = function (global) {
  var _global$Rx = global.Rx;
  var BehaviorSubject = _global$Rx.BehaviorSubject;
  var Observable = _global$Rx.Observable;
  var _global$common = global.common;
  var common = _global$common === undefined ? { init: [] } : _global$common;

  // the first script tag here is to proxy jQuery
  // We use the same jQuery on the main window but we change the
  // context to that of the iframe.

  var libraryIncludes = '\n<script>\n  window.loopProtect = parent.loopProtect;\n  window.__err = null;\n  window.loopProtect.hit = function(line) {\n    window.__err = new Error(\n      \'Potential infinite loop at line \' +\n      line +\n      \'. To disable loop protection, write:\' +\n      \' \\n\\/\\/ noprotect\\nas the first\' +\n      \' line. Beware that if you do have an infinite loop in your code\' +\n      \' this will crash your browser.\'\n    );\n  };\n</script>\n<link\n  rel=\'stylesheet\'\n  href=\'//cdnjs.cloudflare.com/ajax/libs/animate.css/3.2.0/animate.min.css\'\n  />\n<link\n  rel=\'stylesheet\'\n  href=\'//maxcdn.bootstrapcdn.com/bootstrap/3.3.1/css/bootstrap.min.css\'\n  />\n\n<link\n  rel=\'stylesheet\'\n  href=\'//maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css\'\n  />\n<style>\n  body { padding: 0px 3px 0px 3px; }\n</style>\n  ';
  var codeDisabledError = '\n    <script>\n      window.__err = new Error(\'code has been disabled\');\n    </script>\n  ';

  var iFrameScript$ = common.getScriptContent$('/js/iFrameScripts-4bc3c4c1bc.js').shareReplay();
  var jQueryScript$ = common.getScriptContent$('/bower_components/jquery/dist/jquery.js').shareReplay();

  // behavior subject allways remembers the last value
  // we use this to determine if runPreviewTest$ is defined
  // and prime it with false
  common.previewReady$ = new BehaviorSubject(false);

  // These should be set up in the preview window
  // if this error is seen it is because the function tried to run
  // before the iframe has completely loaded
  common.runPreviewTests$ = common.checkPreview$ = function () {
    return Observable.throw(new Error('Preview not fully loaded'));
  };

  common.updatePreview$ = function updatePreview$() {
    var code = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

    var preview = common.getIframe('preview');

    return Observable.combineLatest(iFrameScript$, jQueryScript$, function (iframe, jQuery) {
      return {
        iframeScript: '<script>' + iframe + '</script>',
        jQuery: '<script>' + jQuery + '</script>'
      };
    }).first().flatMap(function (_ref) {
      var iframeScript = _ref.iframeScript;
      var jQuery = _ref.jQuery;

      // we make sure to override the last value in the
      // subject to false here.
      common.previewReady$.onNext(false);
      preview.open();
      preview.write(libraryIncludes + jQuery + (common.shouldRun() ? code : codeDisabledError) + '<!-- -->' + iframeScript);
      preview.close();
      // now we filter false values and wait for the first true
      return common.previewReady$.filter(function (ready) {
        return ready;
      }).first()
      // the delay here is to give code within the iframe
      // control to run
      .delay(400);
    }).map(function () {
      return code;
    });
  };

  return common;
}(window);
'use strict';

window.common = function (global) {
  var _global$Rx = global.Rx;
  var Subject = _global$Rx.Subject;
  var Observable = _global$Rx.Observable;
  var CodeMirror = global.CodeMirror;
  var emmetCodeMirror = global.emmetCodeMirror;
  var _global$common = global.common;
  var common = _global$common === undefined ? { init: [] } : _global$common;
  var _common$challengeType = common.challengeType;
  var challengeType = _common$challengeType === undefined ? '0' : _common$challengeType;
  var challengeTypes = common.challengeTypes;

  if (!CodeMirror || challengeType === challengeTypes.BASEJUMP || challengeType === challengeTypes.ZIPLINE || challengeType === challengeTypes.VIDEO || challengeType === challengeTypes.STEP || challengeType === challengeTypes.HIKES) {
    common.editor = {};
    return common;
  }

  var editor = CodeMirror.fromTextArea(document.getElementById('codeEditor'), {
    lint: true,
    lineNumbers: true,
    mode: 'javascript',
    theme: 'monokai',
    runnable: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    scrollbarStyle: 'null',
    lineWrapping: true,
    gutters: ['CodeMirror-lint-markers']
  });

  editor.setSize('100%', 'auto');

  common.editorExecute$ = new Subject();
  common.editorKeyUp$ = Observable.fromEventPattern(function (handler) {
    return editor.on('keyup', handler);
  }, function (handler) {
    return editor.off('keyup', handler);
  });

  editor.setOption('extraKeys', {
    Tab: function Tab(cm) {
      if (cm.somethingSelected()) {
        cm.indentSelection('add');
      } else {
        var spaces = Array(cm.getOption('indentUnit') + 1).join(' ');
        cm.replaceSelection(spaces);
      }
    },
    'Shift-Tab': function ShiftTab(cm) {
      if (cm.somethingSelected()) {
        cm.indentSelection('subtract');
      } else {
        var spaces = Array(cm.getOption('indentUnit') + 1).join(' ');
        cm.replaceSelection(spaces);
      }
    },
    'Ctrl-Enter': function CtrlEnter() {
      common.editorExecute$.onNext();
      return false;
    },
    'Cmd-Enter': function CmdEnter() {
      common.editorExecute$.onNext();
      return false;
    }
  });

  var info = editor.getScrollInfo();

  var after = editor.charCoords({
    line: editor.getCursor().line + 1,
    ch: 0
  }, 'local').top;

  if (info.top + info.clientHeight < after) {
    editor.scrollTo(null, after - info.clientHeight + 3);
  }

  if (emmetCodeMirror) {
    emmetCodeMirror(editor, {
      'Cmd-E': 'emmet.expand_abbreviation',
      Tab: 'emmet.expand_abbreviation_with_tab',
      Enter: 'emmet.insert_formatted_line_break_only'
    });
  }
  common.init.push(function () {
    var editorValue = undefined;
    if (common.codeUri.isAlive()) {
      editorValue = common.codeUri.parse();
    } else {
      editorValue = common.codeStorage.isAlive(common.challengeName) ? common.codeStorage.getStoredValue(common.challengeName) : common.seed;
    }

    editor.setValue(common.replaceSafeTags(editorValue));
    editor.refresh();
  });

  common.editor = editor;

  return common;
}(window);
'use strict';

window.common = function (global) {
  var Observable = global.Rx.Observable;
  var _global$common = global.common;
  var common = _global$common === undefined ? { init: [] } : _global$common;

  var detectFunctionCall = /function\s*?\(|function\s+\w+\s*?\(/gi;
  var detectUnsafeJQ = /\$\s*?\(\s*?\$\s*?\)/gi;
  var detectUnsafeConsoleCall = /if\s\(null\)\sconsole\.log\(1\);/gi;

  common.detectUnsafeCode$ = function detectUnsafeCode$(code) {
    var openingComments = code.match(/\/\*/gi);
    var closingComments = code.match(/\*\//gi);

    // checks if the number of opening comments(/*) matches the number of
    // closing comments(*/)
    if (openingComments && (!closingComments || openingComments.length > closingComments.length)) {

      return Observable.throw(new Error('SyntaxError: Unfinished multi-line comment'));
    }

    if (code.match(detectUnsafeJQ)) {
      return Observable.throw(new Error('Unsafe $($)'));
    }

    if (code.match(/function/g) && !code.match(detectFunctionCall)) {
      return Observable.throw(new Error('SyntaxError: Unsafe or unfinished function declaration'));
    }

    if (code.match(detectUnsafeConsoleCall)) {
      return Observable.throw(new Error('Invalid if (null) console.log(1); detected'));
    }

    return Observable.just(code);
  };

  return common;
}(window);
'use strict';

window.common = function (_ref) {
  var $ = _ref.$;
  var _ref$common = _ref.common;
  var common = _ref$common === undefined ? { init: [] } : _ref$common;

  common.displayTestResults = function displayTestResults() {
    var data = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

    $('#testSuite').children().remove();
    data.forEach(function (_ref2) {
      var _ref2$err = _ref2.err;
      var err = _ref2$err === undefined ? false : _ref2$err;
      var _ref2$text = _ref2.text;
      var text = _ref2$text === undefined ? '' : _ref2$text;

      var iconClass = err ? '"ion-close-circled big-error-icon"' : '"ion-checkmark-circled big-success-icon"';

      $('<div></div>').html('\n        <div class=\'row\'>\n          <div class=\'col-xs-2 text-center\'>\n            <i class=' + iconClass + '></i>\n          </div>\n          <div class=\'col-xs-10 test-output\'>\n            ' + text.split('message: ').pop().replace(/\'\);/g, '') + '\n          </div>\n          <div class=\'ten-pixel-break\'/>\n        </div>\n      ').appendTo($('#testSuite'));
    });

    return data;
  };

  return common;
}(window);
'use strict';

window.common = function (global) {
  var ga = global.ga;
  var _global$common = global.common;
  var common = _global$common === undefined ? { init: [] } : _global$common;
  var addLoopProtect = common.addLoopProtect;
  var getJsFromHtml = common.getJsFromHtml;
  var detectUnsafeCode$ = common.detectUnsafeCode$;
  var updatePreview$ = common.updatePreview$;
  var challengeType = common.challengeType;
  var challengeTypes = common.challengeTypes;

  common.executeChallenge$ = function executeChallenge$() {
    var code = common.editor.getValue();
    var originalCode = code;
    var head = common.arrayToNewLineString(common.head);
    var tail = common.arrayToNewLineString(common.tail);
    var combinedCode = head + code + tail;

    ga('send', 'event', 'Challenge', 'ran-code', common.gaName);

    // run checks for unsafe code
    return detectUnsafeCode$(code)
    // add head and tail and detect loops
    .map(function () {
      if (challengeType !== challengeTypes.HTML) {
        return '<script>;' + addLoopProtect(combinedCode) + '/**/</script>';
      }

      return addLoopProtect(combinedCode);
    }).flatMap(function (code) {
      return updatePreview$(code);
    }).flatMap(function (code) {
      var output = undefined;

      if (challengeType === challengeTypes.HTML && common.hasJs(code)) {
        output = common.getJsOutput(getJsFromHtml(code));
      } else if (challengeType !== challengeTypes.HTML) {
        output = common.getJsOutput(addLoopProtect(combinedCode));
      }

      return common.runPreviewTests$({
        tests: common.tests.slice(),
        originalCode: originalCode,
        output: output
      });
    });
  };

  return common;
}(window);
'use strict';

window.common = function (global) {
  var CodeMirror = global.CodeMirror;
  var doc = global.document;
  var _global$common = global.common;
  var common = _global$common === undefined ? { init: [] } : _global$common;
  var challengeTypes = common.challengeTypes;
  var _common$challengeType = common.challengeType;
  var challengeType = _common$challengeType === undefined ? '0' : _common$challengeType;

  if (!CodeMirror || challengeType !== challengeTypes.JS && challengeType !== challengeTypes.BONFIRE) {
    common.updateOutputDisplay = function () {};
    common.appendToOutputDisplay = function () {};
    return common;
  }

  var codeOutput = CodeMirror.fromTextArea(doc.getElementById('codeOutput'), {
    lineNumbers: false,
    mode: 'text',
    theme: 'monokai',
    readOnly: 'nocursor',
    lineWrapping: true
  });

  codeOutput.setValue('/**\n  * Your output will go here.\n  * Console.log() -type statements\n  * will appear in your browser\'s\n  * DevTools JavaScript console.\n  */');

  codeOutput.setSize('100%', '100%');

  common.updateOutputDisplay = function updateOutputDisplay() {
    var str = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

    if (typeof str !== 'string') {
      str = JSON.stringify(str);
    }
    codeOutput.setValue(str);
    return str;
  };

  common.appendToOutputDisplay = function appendToOutputDisplay() {
    var str = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

    codeOutput.setValue(codeOutput.getValue() + str);
    return str;
  };

  return common;
}(window);
'use strict';

window.common = function (_ref) {
  var _ref$common = _ref.common;
  var common = _ref$common === undefined ? { init: [] } : _ref$common;

  common.lockTop = function lockTop() {
    var magiVal;

    if ($(window).width() >= 990) {
      if ($('.editorScrollDiv').html()) {

        magiVal = $(window).height() - $('.navbar').height();

        if (magiVal < 0) {
          magiVal = 0;
        }
        $('.editorScrollDiv').css('height', magiVal - 50 + 'px');
      }

      magiVal = $(window).height() - $('.navbar').height();

      if (magiVal < 0) {
        magiVal = 0;
      }

      $('.scroll-locker').css('min-height', $('.editorScrollDiv').height()).css('height', magiVal - 50);
    } else {
      $('.editorScrollDiv').css('max-height', 500 + 'px');

      $('.scroll-locker').css('position', 'inherit').css('top', 'inherit').css('width', '100%').css('max-height', '100%');
    }
  };

  common.init.push(function ($) {
    // fakeiphone positioning hotfix
    if ($('.iphone-position').html() || $('.iphone').html()) {
      var startIphonePosition = parseInt($('.iphone-position').css('top').replace('px', ''), 10);

      var startIphone = parseInt($('.iphone').css('top').replace('px', ''), 10);

      $(window).on('scroll', function () {
        var courseHeight = $('.courseware-height').height();
        var courseTop = $('.courseware-height').offset().top;
        var windowScrollTop = $(window).scrollTop();
        var phoneHeight = $('.iphone-position').height();

        if (courseHeight + courseTop - windowScrollTop - phoneHeight <= 0) {
          $('.iphone-position').css('top', startIphonePosition + courseHeight + courseTop - windowScrollTop - phoneHeight);

          $('.iphone').css('top', startIphonePosition + courseHeight + courseTop - windowScrollTop - phoneHeight + 120);
        } else {
          $('.iphone-position').css('top', startIphonePosition);
          $('.iphone').css('top', startIphone);
        }
      });
    }

    if ($('.scroll-locker').html()) {

      if ($('.scroll-locker').html()) {
        common.lockTop();
        $(window).on('resize', function () {
          common.lockTop();
        });
        $(window).on('scroll', function () {
          common.lockTop();
        });
      }

      var execInProgress = false;

      // why is this not $???
      document.getElementById('scroll-locker').addEventListener('previewUpdateSpy', function (e) {
        if (execInProgress) {
          return null;
        }
        execInProgress = true;
        setTimeout(function () {
          if ($($('.scroll-locker').children()[0]).height() - 800 > e.detail) {
            $('.scroll-locker').scrollTop(e.detail);
          } else {
            var scrollTop = $($('.scroll-locker').children()[0]).height();

            $('.scroll-locker').animate({ scrollTop: scrollTop }, 175);
          }
          execInProgress = false;
        }, 750);
      }, false);
    }
  });

  return common;
}(window);
'use strict';

window.common = function (_ref) {
  var _ref$common = _ref.common;
  var common = _ref$common === undefined ? { init: [] } : _ref$common;

  common.init.push(function ($) {
    $('#report-issue').on('click', function () {
      var textMessage = ['Challenge [', common.challengeName || window.location.pathname, '](', window.location.href, ') has an issue.\n', 'User Agent is: <code>', navigator.userAgent, '</code>.\n', 'Please describe how to reproduce this issue, and include ', 'links to screenshots if possible.\n\n'].join('');

      if (common.editor && typeof common.editor.getValue === 'function' && common.editor.getValue().trim()) {
        var type;
        switch (common.challengeType) {
          case common.challengeTypes.HTML:
            type = 'html';
            break;
          case common.challengeTypes.JS:
          case common.challengeTypes.BONFIRE:
            type = 'javascript';
            break;
          default:
            type = '';
        }

        textMessage += ['My code:\n```', type, '\n', common.editor.getValue(), '\n```\n\n'].join('');
      }

      textMessage = encodeURIComponent(textMessage);

      $('#issue-modal').modal('hide');
      window.open('https://github.com/freecodecamp/freecodecamp/issues/new?&body=' + textMessage, '_blank');
    });
  });

  return common;
}(window);
"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

window.common = function (global) {
  var Observable = global.Rx.Observable;
  var chai = global.chai;
  var _global$common = global.common;
  var common = _global$common === undefined ? { init: [] } : _global$common;

  common.runTests$ = function runTests$(_ref) {
    var code = _ref.code;
    var originalCode = _ref.originalCode;
    var userTests = _ref.userTests;

    var rest = _objectWithoutProperties(_ref, ["code", "originalCode", "userTests"]);

    return Observable.from(userTests).map(function (test) {

      /* eslint-disable no-unused-vars */
      var assert = chai.assert;
      var editor = {
        getValue: function getValue() {
          return originalCode;
        }
      };
      /* eslint-enable no-unused-vars */

      try {
        if (test) {
          /* eslint-disable no-eval  */
          eval(common.reassembleTest(code, test));
          /* eslint-enable no-eval */
        }
      } catch (e) {
        test.err = e.message;
      }

      return test;
    }).toArray().map(function (tests) {
      return _extends({}, rest, { tests: tests });
    });
  };

  return common;
}(window);
'use strict';

window.common = function (global) {
  var $ = global.$;
  var moment = global.moment;
  var _global$ga = global.ga;
  var ga = _global$ga === undefined ? function () {} : _global$ga;
  var _global$common = global.common;
  var common = _global$common === undefined ? { init: [] } : _global$common;

  common.showCompletion = function showCompletion() {

    ga('send', 'event', 'Challenge', 'solved', common.gaName, true);

    var solution = common.editor.getValue();
    var didCompleteWith = $('#completed-with').val() || null;

    $('#complete-courseware-dialog').modal('show');
    $('#complete-courseware-dialog .modal-header').click();

    $('#submit-challenge').click(function (e) {
      e.preventDefault();

      $('#submit-challenge').attr('disabled', 'true').removeClass('btn-primary').addClass('btn-warning disabled');

      var $checkmarkContainer = $('#checkmark-container');
      $checkmarkContainer.css({ height: $checkmarkContainer.innerHeight() });

      $('#challenge-checkmark').addClass('zoomOutUp')
      // .removeClass('zoomInDown')
      .delay(1000).queue(function (next) {
        $(this).replaceWith('<div id="challenge-spinner" ' + 'class="animated zoomInUp inner-circles-loader">' + 'submitting...</div>');
        next();
      });

      var timezone = 'UTC';
      try {
        timezone = moment.tz.guess();
      } catch (err) {
        err.message = '\n          known bug, see: https://github.com/moment/moment-timezone/issues/294:\n          ' + err.message + '\n        ';
        console.error(err);
      }
      var data = JSON.stringify({
        id: common.challengeId,
        name: common.challengeName,
        completedWith: didCompleteWith,
        challengeType: +common.challengeType,
        solution: solution,
        timezone: timezone
      });

      $.ajax({
        url: '/completed-challenge/',
        type: 'POST',
        data: data,
        contentType: 'application/json',
        dataType: 'json'
      }).success(function (res) {
        if (res) {
          window.location = '/challenges/next-challenge?id=' + common.challengeId;
        }
      }).fail(function () {
        window.location.replace(window.location.href);
      });
    });
  };

  return common;
}(window);
'use strict';

window.common = function (_ref) {
  var $ = _ref.$;
  var _ref$common = _ref.common;
  var common = _ref$common === undefined ? { init: [] } : _ref$common;

  var stepClass = '.challenge-step';
  var prevBtnClass = '.challenge-step-btn-prev';
  var nextBtnClass = '.challenge-step-btn-next';
  var actionBtnClass = '.challenge-step-btn-action';
  var finishBtnClass = '.challenge-step-btn-finish';
  var submitBtnId = '#challenge-step-btn-submit';
  var submitModalId = '#challenge-step-modal';

  function getPreviousStep($challengeSteps) {
    var $prevStep = false;
    var prevStepIndex = 0;
    $challengeSteps.each(function (index) {
      var $step = $(this);
      if (!$step.hasClass('hidden')) {
        prevStepIndex = index - 1;
      }
    });

    $prevStep = $challengeSteps[prevStepIndex];

    return $prevStep;
  }

  function getNextStep($challengeSteps) {
    var length = $challengeSteps.length;
    var $nextStep = false;
    var nextStepIndex = 0;
    $challengeSteps.each(function (index) {
      var $step = $(this);
      if (!$step.hasClass('hidden') && index + 1 !== length) {
        nextStepIndex = index + 1;
      }
    });

    $nextStep = $challengeSteps[nextStepIndex];

    return $nextStep;
  }

  function handlePrevStepClick(e) {
    e.preventDefault();
    var prevStep = getPreviousStep($(stepClass));
    $(this).parent().parent().removeClass('slideInLeft slideInRight').addClass('animated fadeOutRight fast-animation').delay(250).queue(function (prev) {
      $(this).addClass('hidden');
      if (prevStep) {
        $(prevStep).removeClass('hidden').removeClass('fadeOutLeft fadeOutRight').addClass('animated slideInLeft fast-animation').delay(500).queue(function (prev) {
          prev();
        });
      }
      prev();
    });
  }

  function handleNextStepClick(e) {
    e.preventDefault();
    var nextStep = getNextStep($(stepClass));
    $(this).parent().parent().removeClass('slideInRight slideInLeft').addClass('animated fadeOutLeft fast-animation').delay(250).queue(function (next) {
      $(this).addClass('hidden');
      if (nextStep) {
        $(nextStep).removeClass('hidden').removeClass('fadeOutRight fadeOutLeft').addClass('animated slideInRight fast-animation').delay(500).queue(function (next) {
          next();
        });
      }
      next();
    });
  }

  function handleActionClick(e) {
    var props = common.challengeSeed[0] || { stepIndex: [] };

    var $el = $(this);
    var index = +$el.attr('id');
    var propIndex = props.stepIndex.indexOf(index);

    if (propIndex === -1) {
      return $el.parent().find('.disabled').removeClass('disabled');
    }

    // an API action
    // prevent link from opening
    e.preventDefault();
    var prop = props.properties[propIndex];
    var api = props.apis[propIndex];
    if (common[prop]) {
      return $el.parent().find('.disabled').removeClass('disabled');
    }
    $.post(api).done(function (data) {
      // assume a boolean indicates passing
      if (typeof data === 'boolean') {
        return $el.parent().find('.disabled').removeClass('disabled');
      }
      // assume api returns string when fails
      $el.parent().find('.disabled').replaceWith('<p>' + data + '</p>');
    }).fail(function () {
      console.log('failed');
    });
  }

  function handleFinishClick(e) {
    e.preventDefault();
    $(submitModalId).modal('show');
    $(submitModalId + '.modal-header').click();
    $(submitBtnId).click(handleSubmitClick);
  }

  function handleSubmitClick(e) {
    e.preventDefault();

    $('#submit-challenge').attr('disabled', 'true').removeClass('btn-primary').addClass('btn-warning disabled');

    var $checkmarkContainer = $('#checkmark-container');
    $checkmarkContainer.css({ height: $checkmarkContainer.innerHeight() });

    $('#challenge-checkmark').addClass('zoomOutUp').delay(1000).queue(function (next) {
      $(this).replaceWith('<div id="challenge-spinner" ' + 'class="animated zoomInUp inner-circles-loader">' + 'submitting...</div>');
      next();
    });

    $.ajax({
      url: '/completed-challenge/',
      type: 'POST',
      data: JSON.stringify({
        id: common.challengeId,
        name: common.challengeName,
        challengeType: +common.challengeType
      }),
      contentType: 'application/json',
      dataType: 'json'
    }).success(function (res) {
      if (res) {
        window.location = '/challenges/next-challenge?id=' + common.challengeId;
      }
    }).fail(function () {
      window.location.replace(window.location.href);
    });
  }

  common.init.push(function ($) {
    if (common.challengeType !== '7') {
      return null;
    }

    $(prevBtnClass).click(handlePrevStepClick);
    $(nextBtnClass).click(handleNextStepClick);
    $(actionBtnClass).click(handleActionClick);
    $(finishBtnClass).click(handleFinishClick);
  });

  return common;
}(window);
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

$(document).ready(function () {
  var common = window.common;
  var Observable = window.Rx.Observable;
  var addLoopProtect = common.addLoopProtect;
  var challengeName = common.challengeName;
  var challengeType = common.challengeType;
  var challengeTypes = common.challengeTypes;

  common.init.forEach(function (init) {
    init($);
  });

  // only run if editor present
  if (common.editor.getValue) {
    var code$ = common.editorKeyUp$.debounce(750).map(function () {
      return common.editor.getValue();
    }).distinctUntilChanged().shareReplay();

    // update storage
    code$.subscribe(function (code) {
      common.codeStorage.updateStorage(common.challengeName, code);
      common.codeUri.querify(code);
    }, function (err) {
      return console.error(err);
    });

    code$
    // only run for HTML
    .filter(function () {
      return common.challengeType === challengeTypes.HTML;
    }).flatMap(function (code) {
      return common.detectUnsafeCode$(code).map(function () {
        var combinedCode = common.head + code + common.tail;

        return addLoopProtect(combinedCode);
      }).flatMap(function (code) {
        return common.updatePreview$(code);
      }).flatMap(function () {
        return common.checkPreview$({ code: code });
      }).catch(function (err) {
        return Observable.just({ err: err });
      });
    }).subscribe(function (_ref) {
      var err = _ref.err;

      if (err) {
        console.error(err);
        return common.updatePreview$('\n              <h1>' + err + '</h1>\n            ').subscribe(function () {});
      }
    }, function (err) {
      return console.error(err);
    });
  }

  common.resetBtn$.doOnNext(function () {
    common.editor.setValue(common.replaceSafeTags(common.seed));
  }).flatMap(function () {
    return common.executeChallenge$().catch(function (err) {
      return Observable.just({ err: err });
    });
  }).subscribe(function (_ref2) {
    var err = _ref2.err;
    var output = _ref2.output;
    var originalCode = _ref2.originalCode;

    if (err) {
      console.error(err);
      return common.updateOutputDisplay('' + err);
    }
    common.codeStorage.updateStorage(challengeName, originalCode);
    common.codeUri.querify(originalCode);
    common.updateOutputDisplay(output);
  }, function (err) {
    if (err) {
      console.error(err);
    }
    common.updateOutputDisplay('' + err);
  });

  Observable.merge(common.editorExecute$, common.submitBtn$).flatMap(function () {
    common.appendToOutputDisplay('\n// testing challenge...');
    return common.executeChallenge$().map(function (_ref3) {
      var tests = _ref3.tests;

      var rest = _objectWithoutProperties(_ref3, ['tests']);

      var solved = tests.every(function (test) {
        return !test.err;
      });
      return _extends({}, rest, { tests: tests, solved: solved });
    }).catch(function (err) {
      return Observable.just({ err: err });
    });
  }).subscribe(function (_ref4) {
    var err = _ref4.err;
    var solved = _ref4.solved;
    var output = _ref4.output;
    var tests = _ref4.tests;

    if (err) {
      console.error(err);
      if (common.challengeType === common.challengeTypes.HTML) {
        return common.updatePreview$('\n              <h1>' + err + '</h1>\n            ').first().subscribe(function () {});
      }
      return common.updateOutputDisplay('' + err);
    }
    common.updateOutputDisplay(output);
    common.displayTestResults(tests);
    if (solved) {
      common.showCompletion();
    }
  }, function (_ref5) {
    var err = _ref5.err;

    console.error(err);
    common.updateOutputDisplay('' + err);
  });

  // initial challenge run to populate tests
  if (challengeType === challengeTypes.HTML) {
    var $preview = $('#preview');
    return Observable.fromCallback($preview.ready, $preview)().delay(500).flatMap(function () {
      return common.executeChallenge$();
    }).catch(function (err) {
      return Observable.just({ err: err });
    }).subscribe(function (_ref6) {
      var err = _ref6.err;
      var tests = _ref6.tests;

      if (err) {
        console.error(err);
        if (common.challengeType === common.challengeTypes.HTML) {
          return common.updatePreview$('\n                <h1>' + err + '</h1>\n              ').subscribe(function () {});
        }
        return common.updateOutputDisplay('' + err);
      }
      common.displayTestResults(tests);
    }, function (_ref7) {
      var err = _ref7.err;

      console.error(err);
    });
  }

  if (challengeType === challengeTypes.BONFIRE || challengeType === challengeTypes.JS) {
    Observable.just({}).delay(500).flatMap(function () {
      return common.executeChallenge$();
    }).catch(function (err) {
      return Observable.just({ err: err });
    }).subscribe(function (_ref8) {
      var err = _ref8.err;
      var originalCode = _ref8.originalCode;
      var tests = _ref8.tests;

      if (err) {
        console.error(err);
        return common.updateOutputDisplay('' + err);
      }
      common.codeStorage.updateStorage(challengeName, originalCode);
      common.displayTestResults(tests);
    }, function (err) {
      console.error(err);
      common.updateOutputDisplay('' + err);
    });
  }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluaXQuanMiLCJiaW5kaW5ncy5qcyIsImNvZGUtc3RvcmFnZS5qcyIsImNvZGUtdXJpLmpzIiwiYWRkLWxvb3AtcHJvdGVjdC5qcyIsImdldC1pZnJhbWUuanMiLCJ1cGRhdGUtcHJldmlldy5qcyIsImNyZWF0ZS1lZGl0b3IuanMiLCJkZXRlY3QtdW5zYWZlLWNvZGUtc3RyZWFtLmpzIiwiZGlzcGxheS10ZXN0LXJlc3VsdHMuanMiLCJleGVjdXRlLWNoYWxsZW5nZS1zdHJlYW0uanMiLCJvdXRwdXQtZGlzcGxheS5qcyIsInBob25lLXNjcm9sbC1sb2NrLmpzIiwicmVwb3J0LWlzc3VlLmpzIiwicnVuLXRlc3RzLXN0cmVhbS5qcyIsInNob3ctY29tcGxldGlvbi5qcyIsInN0ZXAtY2hhbGxlbmdlLmpzIiwiZW5kLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImNvbW1vbkZyYW1ld29yay5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0Jztcblxud2luZG93LmNvbW1vbiA9IGZ1bmN0aW9uIChnbG9iYWwpIHtcbiAgLy8gY29tbW9uIG5hbWVzcGFjZVxuICAvLyBhbGwgY2xhc3NlcyBzaG91bGQgYmUgc3RvcmVkIGhlcmVcbiAgLy8gY2FsbGVkIGF0IHRoZSBiZWdpbm5pbmcgb2YgZG9tIHJlYWR5XG4gIHZhciBfZ2xvYmFsJFJ4ID0gZ2xvYmFsLlJ4O1xuICB2YXIgRGlzcG9zYWJsZSA9IF9nbG9iYWwkUnguRGlzcG9zYWJsZTtcbiAgdmFyIE9ic2VydmFibGUgPSBfZ2xvYmFsJFJ4Lk9ic2VydmFibGU7XG4gIHZhciBjb25maWcgPSBfZ2xvYmFsJFJ4LmNvbmZpZztcbiAgdmFyIF9nbG9iYWwkY29tbW9uID0gZ2xvYmFsLmNvbW1vbjtcbiAgdmFyIGNvbW1vbiA9IF9nbG9iYWwkY29tbW9uID09PSB1bmRlZmluZWQgPyB7IGluaXQ6IFtdIH0gOiBfZ2xvYmFsJGNvbW1vbjtcblxuICBjb25maWcubG9uZ1N0YWNrU3VwcG9ydCA9IHRydWU7XG4gIGNvbW1vbi5oZWFkID0gY29tbW9uLmhlYWQgfHwgW107XG4gIGNvbW1vbi50YWlsID0gY29tbW9uLnRhaWwgfHwgW107XG4gIGNvbW1vbi5zYWx0ID0gTWF0aC5yYW5kb20oKTtcblxuICBjb21tb24uY2hhbGxlbmdlVHlwZXMgPSB7XG4gICAgSFRNTDogJzAnLFxuICAgIEpTOiAnMScsXG4gICAgVklERU86ICcyJyxcbiAgICBaSVBMSU5FOiAnMycsXG4gICAgQkFTRUpVTVA6ICc0JyxcbiAgICBCT05GSVJFOiAnNScsXG4gICAgSElLRVM6ICc2JyxcbiAgICBTVEVQOiAnNydcbiAgfTtcblxuICBjb21tb24uYXJyYXlUb05ld0xpbmVTdHJpbmcgPSBmdW5jdGlvbiBhcnJheVRvTmV3TGluZVN0cmluZyhzZWVkRGF0YSkge1xuICAgIHNlZWREYXRhID0gQXJyYXkuaXNBcnJheShzZWVkRGF0YSkgPyBzZWVkRGF0YSA6IFtzZWVkRGF0YV07XG4gICAgcmV0dXJuIHNlZWREYXRhLnJlZHVjZShmdW5jdGlvbiAoc2VlZCwgbGluZSkge1xuICAgICAgcmV0dXJuICcnICsgc2VlZCArIGxpbmUgKyAnXFxuJztcbiAgICB9LCAnJyk7XG4gIH07XG5cbiAgY29tbW9uLnNlZWQgPSBjb21tb24uYXJyYXlUb05ld0xpbmVTdHJpbmcoY29tbW9uLmNoYWxsZW5nZVNlZWQpO1xuXG4gIGNvbW1vbi5yZXBsYWNlU2NyaXB0VGFncyA9IGZ1bmN0aW9uIHJlcGxhY2VTY3JpcHRUYWdzKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoLzxzY3JpcHQ+L2dpLCAnZmNjc3MnKS5yZXBsYWNlKC88XFwvc2NyaXB0Pi9naSwgJ2ZjY2VzJyk7XG4gIH07XG5cbiAgY29tbW9uLnJlcGxhY2VTYWZlVGFncyA9IGZ1bmN0aW9uIHJlcGxhY2VTYWZlVGFncyh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZS5yZXBsYWNlKC9mY2Nzcy9naSwgJzxzY3JpcHQ+JykucmVwbGFjZSgvZmNjZXMvZ2ksICc8L3NjcmlwdD4nKTtcbiAgfTtcblxuICBjb21tb24ucmVwbGFjZUZvcm1BY3Rpb25BdHRyID0gZnVuY3Rpb24gcmVwbGFjZUZvcm1BY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUucmVwbGFjZSgvPGZvcm1bXj5dKj4vLCBmdW5jdGlvbiAodmFsKSB7XG4gICAgICByZXR1cm4gdmFsLnJlcGxhY2UoL2FjdGlvbihcXHMqPyk9LywgJ2ZjY2ZhYSQxPScpO1xuICAgIH0pO1xuICB9O1xuXG4gIGNvbW1vbi5yZXBsYWNlRmNjZmFhQXR0ciA9IGZ1bmN0aW9uIHJlcGxhY2VGY2NmYWFBdHRyKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoLzxmb3JtW14+XSo+LywgZnVuY3Rpb24gKHZhbCkge1xuICAgICAgcmV0dXJuIHZhbC5yZXBsYWNlKC9mY2NmYWEoXFxzKj8pPS8sICdhY3Rpb24kMT0nKTtcbiAgICB9KTtcbiAgfTtcblxuICBjb21tb24uc2NvcGVqUXVlcnkgPSBmdW5jdGlvbiBzY29wZWpRdWVyeShzdHIpIHtcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoL1xcJC9naSwgJ2okJykucmVwbGFjZSgvZG9jdW1lbnQvZ2ksICdqZG9jdW1lbnQnKS5yZXBsYWNlKC9qUXVlcnkvZ2ksICdqalF1ZXJ5Jyk7XG4gIH07XG5cbiAgY29tbW9uLnVuU2NvcGVKUXVlcnkgPSBmdW5jdGlvbiB1blNjb3BlSlF1ZXJ5KHN0cikge1xuICAgIHJldHVybiBzdHIucmVwbGFjZSgvalxcJC9naSwgJyQnKS5yZXBsYWNlKC9qZG9jdW1lbnQvZ2ksICdkb2N1bWVudCcpLnJlcGxhY2UoL2pqUXVlcnkvZ2ksICdqUXVlcnknKTtcbiAgfTtcblxuICB2YXIgY29tbWVudFJlZ2V4ID0gLyhcXC9cXCpbXihcXCpcXC8pXSpcXCpcXC8pfChbIFxcbl1cXC9cXC9bXlxcbl0qKS9nO1xuICBjb21tb24ucmVtb3ZlQ29tbWVudHMgPSBmdW5jdGlvbiByZW1vdmVDb21tZW50cyhzdHIpIHtcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoY29tbWVudFJlZ2V4LCAnJyk7XG4gIH07XG5cbiAgdmFyIGxvZ1JlZ2V4ID0gLyhjb25zb2xlXFwuW1xcd10rXFxzKlxcKC4qXFw7KS9nO1xuICBjb21tb24ucmVtb3ZlTG9ncyA9IGZ1bmN0aW9uIHJlbW92ZUxvZ3Moc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKGxvZ1JlZ2V4LCAnJyk7XG4gIH07XG5cbiAgY29tbW9uLnJlYXNzZW1ibGVUZXN0ID0gZnVuY3Rpb24gcmVhc3NlbWJsZVRlc3QoKSB7XG4gICAgdmFyIGNvZGUgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyAnJyA6IGFyZ3VtZW50c1swXTtcbiAgICB2YXIgX3JlZiA9IGFyZ3VtZW50c1sxXTtcbiAgICB2YXIgbGluZSA9IF9yZWYubGluZTtcbiAgICB2YXIgdGV4dCA9IF9yZWYudGV4dDtcblxuICAgIHZhciByZWdleHAgPSBuZXcgUmVnRXhwKCcvLycgKyBsaW5lICsgY29tbW9uLnNhbHQpO1xuICAgIHJldHVybiBjb2RlLnJlcGxhY2UocmVnZXhwLCB0ZXh0KTtcbiAgfTtcblxuICBjb21tb24uZ2V0U2NyaXB0Q29udGVudCQgPSBmdW5jdGlvbiBnZXRTY3JpcHRDb250ZW50JChzY3JpcHQpIHtcbiAgICByZXR1cm4gT2JzZXJ2YWJsZS5jcmVhdGUoZnVuY3Rpb24gKG9ic2VydmVyKSB7XG4gICAgICB2YXIganFYSFIgPSAkLmdldChzY3JpcHQsIG51bGwsIG51bGwsICd0ZXh0Jykuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICBvYnNlcnZlci5vbk5leHQoZGF0YSk7XG4gICAgICAgIG9ic2VydmVyLm9uQ29tcGxldGVkKCk7XG4gICAgICB9KS5mYWlsKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHJldHVybiBvYnNlcnZlci5vbkVycm9yKGUpO1xuICAgICAgfSkuYWx3YXlzKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG9ic2VydmVyLm9uQ29tcGxldGVkKCk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIG5ldyBEaXNwb3NhYmxlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAganFYSFIuYWJvcnQoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIHZhciBvcGVuU2NyaXB0ID0gL1xcPFxccz9zY3JpcHRcXHM/XFw+L2dpO1xuICB2YXIgY2xvc2luZ1NjcmlwdCA9IC9cXDxcXHM/XFwvXFxzP3NjcmlwdFxccz9cXD4vZ2k7XG5cbiAgLy8gZGV0ZWN0cyBpZiB0aGVyZSBpcyBKYXZhU2NyaXB0IGluIHRoZSBmaXJzdCBzY3JpcHQgdGFnXG4gIGNvbW1vbi5oYXNKcyA9IGZ1bmN0aW9uIGhhc0pzKGNvZGUpIHtcbiAgICByZXR1cm4gISFjb21tb24uZ2V0SnNGcm9tSHRtbChjb2RlKTtcbiAgfTtcblxuICAvLyBncmFicyB0aGUgY29udGVudCBmcm9tIHRoZSBmaXJzdCBzY3JpcHQgdGFnIGluIHRoZSBjb2RlXG4gIGNvbW1vbi5nZXRKc0Zyb21IdG1sID0gZnVuY3Rpb24gZ2V0SnNGcm9tSHRtbChjb2RlKSB7XG4gICAgLy8gZ3JhYiB1c2VyIGphdmFTY3JpcHRcbiAgICByZXR1cm4gKGNvZGUuc3BsaXQob3BlblNjcmlwdClbMV0gfHwgJycpLnNwbGl0KGNsb3NpbmdTY3JpcHQpWzBdIHx8ICcnO1xuICB9O1xuXG4gIHJldHVybiBjb21tb247XG59KHdpbmRvdyk7IiwiJ3VzZSBzdHJpY3QnO1xuXG53aW5kb3cuY29tbW9uID0gZnVuY3Rpb24gKGdsb2JhbCkge1xuICB2YXIgJCA9IGdsb2JhbC4kO1xuICB2YXIgT2JzZXJ2YWJsZSA9IGdsb2JhbC5SeC5PYnNlcnZhYmxlO1xuICB2YXIgX2dsb2JhbCRjb21tb24gPSBnbG9iYWwuY29tbW9uO1xuICB2YXIgY29tbW9uID0gX2dsb2JhbCRjb21tb24gPT09IHVuZGVmaW5lZCA/IHsgaW5pdDogW10gfSA6IF9nbG9iYWwkY29tbW9uO1xuXG4gIGNvbW1vbi5jdHJsRW50ZXJDbGlja0hhbmRsZXIgPSBmdW5jdGlvbiBjdHJsRW50ZXJDbGlja0hhbmRsZXIoZSkge1xuICAgIC8vIGN0cmwgKyBlbnRlciBvciBjbWQgKyBlbnRlclxuICAgIGlmIChlLmtleUNvZGUgPT09IDEzICYmIChlLm1ldGFLZXkgfHwgZS5jdHJsS2V5KSkge1xuICAgICAgJCgnI2NvbXBsZXRlLWNvdXJzZXdhcmUtZGlhbG9nJykub2ZmKCdrZXlkb3duJywgY3RybEVudGVyQ2xpY2tIYW5kbGVyKTtcbiAgICAgIGlmICgkKCcjc3VibWl0LWNoYWxsZW5nZScpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgJCgnI3N1Ym1pdC1jaGFsbGVuZ2UnKS5jbGljaygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uID0gJy9jaGFsbGVuZ2VzL25leHQtY2hhbGxlbmdlP2lkPScgKyBjb21tb24uY2hhbGxlbmdlSWQ7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGNvbW1vbi5pbml0LnB1c2goZnVuY3Rpb24gKCQpIHtcblxuICAgIHZhciAkbWFyZ2luRml4ID0gJCgnLmlubmVyTWFyZ2luRml4Jyk7XG4gICAgJG1hcmdpbkZpeC5jc3MoJ21pbi1oZWlnaHQnLCAkbWFyZ2luRml4LmhlaWdodCgpKTtcblxuICAgIGNvbW1vbi5zdWJtaXRCdG4kID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQoJCgnI3N1Ym1pdEJ1dHRvbicpLCAnY2xpY2snKTtcblxuICAgIGNvbW1vbi5yZXNldEJ0biQgPSBPYnNlcnZhYmxlLmZyb21FdmVudCgkKCcjcmVzZXQtYnV0dG9uJyksICdjbGljaycpO1xuXG4gICAgLy8gaW5pdCBtb2RhbCBrZXliaW5kaW5ncyBvbiBvcGVuXG4gICAgJCgnI2NvbXBsZXRlLWNvdXJzZXdhcmUtZGlhbG9nJykub24oJ3Nob3duLmJzLm1vZGFsJywgZnVuY3Rpb24gKCkge1xuICAgICAgJCgnI2NvbXBsZXRlLWNvdXJzZXdhcmUtZGlhbG9nJykua2V5ZG93bihjb21tb24uY3RybEVudGVyQ2xpY2tIYW5kbGVyKTtcbiAgICB9KTtcblxuICAgIC8vIHJlbW92ZSBtb2RhbCBrZXliaW5kcyBvbiBjbG9zZVxuICAgICQoJyNjb21wbGV0ZS1jb3Vyc2V3YXJlLWRpYWxvZycpLm9uKCdoaWRkZW4uYnMubW9kYWwnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcjY29tcGxldGUtY291cnNld2FyZS1kaWFsb2cnKS5vZmYoJ2tleWRvd24nLCBjb21tb24uY3RybEVudGVyQ2xpY2tIYW5kbGVyKTtcbiAgICB9KTtcblxuICAgIC8vIHZpZGVvIGNoZWNrbGlzdCBiaW5kaW5nXG4gICAgJCgnLmNoYWxsZW5nZS1saXN0LWNoZWNrYm94Jykub24oJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBjaGVja2JveElkID0gJCh0aGlzKS5wYXJlbnQoKS5wYXJlbnQoKS5hdHRyKCdpZCcpO1xuICAgICAgaWYgKCQodGhpcykuaXMoJzpjaGVja2VkJykpIHtcbiAgICAgICAgJCh0aGlzKS5wYXJlbnQoKS5zaWJsaW5ncygpLmNoaWxkcmVuKCkuYWRkQ2xhc3MoJ2ZhZGVkJyk7XG4gICAgICAgIGlmICghbG9jYWxTdG9yYWdlIHx8ICFsb2NhbFN0b3JhZ2VbY2hlY2tib3hJZF0pIHtcbiAgICAgICAgICBsb2NhbFN0b3JhZ2VbY2hlY2tib3hJZF0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghJCh0aGlzKS5pcygnOmNoZWNrZWQnKSkge1xuICAgICAgICAkKHRoaXMpLnBhcmVudCgpLnNpYmxpbmdzKCkuY2hpbGRyZW4oKS5yZW1vdmVDbGFzcygnZmFkZWQnKTtcbiAgICAgICAgaWYgKGxvY2FsU3RvcmFnZVtjaGVja2JveElkXSkge1xuICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGNoZWNrYm94SWQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAkKCcuY2hlY2tsaXN0LWVsZW1lbnQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBjaGVja2xpc3RFbGVtZW50SWQgPSAkKHRoaXMpLmF0dHIoJ2lkJyk7XG4gICAgICBpZiAobG9jYWxTdG9yYWdlW2NoZWNrbGlzdEVsZW1lbnRJZF0pIHtcbiAgICAgICAgJCh0aGlzKS5jaGlsZHJlbigpLmNoaWxkcmVuKCdsaScpLmFkZENsYXNzKCdmYWRlZCcpO1xuICAgICAgICAkKHRoaXMpLmNoaWxkcmVuKCkuY2hpbGRyZW4oJ2lucHV0JykudHJpZ2dlcignY2xpY2snKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIHZpZGVvIGNoYWxsZW5nZSBzdWJtaXRcbiAgICAkKCcjbmV4dC1jb3Vyc2V3YXJlLWJ1dHRvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICQoJyNuZXh0LWNvdXJzZXdhcmUtYnV0dG9uJykudW5iaW5kKCdjbGljaycpO1xuICAgICAgaWYgKCQoJy5zaWdudXAtYnRuLW5hdicpLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgdmFyIGRhdGE7XG4gICAgICAgIHZhciBzb2x1dGlvbiA9ICQoJyNwdWJsaWMtdXJsJykudmFsKCkgfHwgbnVsbDtcbiAgICAgICAgdmFyIGdpdGh1YkxpbmsgPSAkKCcjZ2l0aHViLXVybCcpLnZhbCgpIHx8IG51bGw7XG4gICAgICAgIHN3aXRjaCAoY29tbW9uLmNoYWxsZW5nZVR5cGUpIHtcbiAgICAgICAgICBjYXNlIGNvbW1vbi5jaGFsbGVuZ2VUeXBlcy5WSURFTzpcbiAgICAgICAgICAgIGRhdGEgPSB7XG4gICAgICAgICAgICAgIGlkOiBjb21tb24uY2hhbGxlbmdlSWQsXG4gICAgICAgICAgICAgIG5hbWU6IGNvbW1vbi5jaGFsbGVuZ2VOYW1lLFxuICAgICAgICAgICAgICBjaGFsbGVuZ2VUeXBlOiArY29tbW9uLmNoYWxsZW5nZVR5cGVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICB1cmw6ICcvY29tcGxldGVkLWNoYWxsZW5nZS8nLFxuICAgICAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KGRhdGEpLFxuICAgICAgICAgICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nXG4gICAgICAgICAgICB9KS5zdWNjZXNzKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgICAgICAgaWYgKCFyZXMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSAnL2NoYWxsZW5nZXMvbmV4dC1jaGFsbGVuZ2U/aWQ9JyArIGNvbW1vbi5jaGFsbGVuZ2VJZDtcbiAgICAgICAgICAgIH0pLmZhaWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVwbGFjZSh3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBjb21tb24uY2hhbGxlbmdlVHlwZXMuQkFTRUpVTVA6XG4gICAgICAgICAgY2FzZSBjb21tb24uY2hhbGxlbmdlVHlwZXMuWklQTElORTpcbiAgICAgICAgICAgIGRhdGEgPSB7XG4gICAgICAgICAgICAgIGlkOiBjb21tb24uY2hhbGxlbmdlSWQsXG4gICAgICAgICAgICAgIG5hbWU6IGNvbW1vbi5jaGFsbGVuZ2VOYW1lLFxuICAgICAgICAgICAgICBjaGFsbGVuZ2VUeXBlOiArY29tbW9uLmNoYWxsZW5nZVR5cGUsXG4gICAgICAgICAgICAgIHNvbHV0aW9uOiBzb2x1dGlvbixcbiAgICAgICAgICAgICAgZ2l0aHViTGluazogZ2l0aHViTGlua1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgdXJsOiAnL2NvbXBsZXRlZC16aXBsaW5lLW9yLWJhc2VqdW1wLycsXG4gICAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoZGF0YSksXG4gICAgICAgICAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICAgICAgICAgIH0pLnN1Y2Nlc3MoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9ICcvY2hhbGxlbmdlcy9uZXh0LWNoYWxsZW5nZT9pZD0nICsgY29tbW9uLmNoYWxsZW5nZUlkO1xuICAgICAgICAgICAgfSkuZmFpbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZXBsYWNlKHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIGNvbW1vbi5jaGFsbGVuZ2VUeXBlcy5CT05GSVJFOlxuICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSAnL2NoYWxsZW5nZXMvbmV4dC1jaGFsbGVuZ2U/aWQ9JyArIGNvbW1vbi5jaGFsbGVuZ2VJZDtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdIYXBweSBDb2RpbmchJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKGNvbW1vbi5jaGFsbGVuZ2VOYW1lKSB7XG4gICAgICB3aW5kb3cuZ2EoJ3NlbmQnLCAnZXZlbnQnLCAnQ2hhbGxlbmdlJywgJ2xvYWQnLCBjb21tb24uZ2FOYW1lKTtcbiAgICB9XG5cbiAgICAkKCcjY29tcGxldGUtY291cnNld2FyZS1kaWFsb2cnKS5vbignaGlkZGVuLmJzLm1vZGFsJywgZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKGNvbW1vbi5lZGl0b3IuZm9jdXMpIHtcbiAgICAgICAgY29tbW9uLmVkaXRvci5mb2N1cygpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgJCgnI3RyaWdnZXItaXNzdWUtbW9kYWwnKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcjaXNzdWUtbW9kYWwnKS5tb2RhbCgnc2hvdycpO1xuICAgIH0pO1xuXG4gICAgJCgnI3RyaWdnZXItaGVscC1tb2RhbCcpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICQoJyNoZWxwLW1vZGFsJykubW9kYWwoJ3Nob3cnKTtcbiAgICB9KTtcblxuICAgICQoJyN0cmlnZ2VyLXJlc2V0LW1vZGFsJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgJCgnI3Jlc2V0LW1vZGFsJykubW9kYWwoJ3Nob3cnKTtcbiAgICB9KTtcblxuICAgICQoJyN0cmlnZ2VyLXBhaXItbW9kYWwnKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcjcGFpci1tb2RhbCcpLm1vZGFsKCdzaG93Jyk7XG4gICAgfSk7XG5cbiAgICAkKCcjY29tcGxldGVkLWNvdXJzZXdhcmUnKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcjY29tcGxldGUtY291cnNld2FyZS1kaWFsb2cnKS5tb2RhbCgnc2hvdycpO1xuICAgIH0pO1xuXG4gICAgJCgnI2hlbHAtaXZlLWZvdW5kLWEtYnVnLXdpa2ktYXJ0aWNsZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHdpbmRvdy5vcGVuKCdodHRwczovL2dpdGh1Yi5jb20vRnJlZUNvZGVDYW1wL0ZyZWVDb2RlQ2FtcC93aWtpLycgKyBcIkhlbHAtSSd2ZS1Gb3VuZC1hLUJ1Z1wiLCAnX2JsYW5rJyk7XG4gICAgfSk7XG5cbiAgICAkKCcjc2VhcmNoLWlzc3VlJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHF1ZXJ5SXNzdWUgPSB3aW5kb3cubG9jYXRpb24uaHJlZi50b1N0cmluZygpLnNwbGl0KCc/JylbMF0ucmVwbGFjZSgvKCMqKSQvLCAnJyk7XG4gICAgICB3aW5kb3cub3BlbignaHR0cHM6Ly9naXRodWIuY29tL0ZyZWVDb2RlQ2FtcC9GcmVlQ29kZUNhbXAvaXNzdWVzP3E9JyArICdpczppc3N1ZSBpczphbGwgJyArIGNvbW1vbi5jaGFsbGVuZ2VOYW1lICsgJyBPUiAnICsgcXVlcnlJc3N1ZS5zdWJzdHIocXVlcnlJc3N1ZS5sYXN0SW5kZXhPZignY2hhbGxlbmdlcy8nKSArIDExKS5yZXBsYWNlKCcvJywgJycpLCAnX2JsYW5rJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiBjb21tb247XG59KHdpbmRvdyk7IiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBkZXBlbmRzIG9uOiBjb2RlVXJpXG53aW5kb3cuY29tbW9uID0gZnVuY3Rpb24gKGdsb2JhbCkge1xuICB2YXIgbG9jYWxTdG9yYWdlID0gZ2xvYmFsLmxvY2FsU3RvcmFnZTtcbiAgdmFyIF9nbG9iYWwkY29tbW9uID0gZ2xvYmFsLmNvbW1vbjtcbiAgdmFyIGNvbW1vbiA9IF9nbG9iYWwkY29tbW9uID09PSB1bmRlZmluZWQgPyB7IGluaXQ6IFtdIH0gOiBfZ2xvYmFsJGNvbW1vbjtcblxuICB2YXIgY2hhbGxlbmdlUHJlZml4ID0gWydCb25maXJlOiAnLCAnV2F5cG9pbnQ6ICcsICdaaXBsaW5lOiAnLCAnQmFzZWp1bXA6ICcsICdDaGVja3BvaW50OiAnXSxcbiAgICAgIGl0ZW07XG5cbiAgdmFyIGNvZGVTdG9yYWdlID0ge1xuICAgIGdldFN0b3JlZFZhbHVlOiBmdW5jdGlvbiBnZXRTdG9yZWRWYWx1ZShrZXkpIHtcbiAgICAgIGlmICghbG9jYWxTdG9yYWdlIHx8IHR5cGVvZiBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSAhPT0gJ2Z1bmN0aW9uJyB8fCAha2V5IHx8IHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCd1bmFibGUgdG8gcmVhZCBmcm9tIHN0b3JhZ2UnKTtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgICAgfVxuICAgICAgaWYgKGxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSArICdWYWwnKSkge1xuICAgICAgICByZXR1cm4gJycgKyBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkgKyAnVmFsJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBjaGFsbGVuZ2VQcmVmaXgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpdGVtID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oY2hhbGxlbmdlUHJlZml4W2ldICsga2V5ICsgJ1ZhbCcpO1xuICAgICAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gJycgKyBpdGVtO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICBpc0FsaXZlOiBmdW5jdGlvbiBpc0FsaXZlKGtleSkge1xuICAgICAgdmFyIHZhbCA9IHRoaXMuZ2V0U3RvcmVkVmFsdWUoa2V5KTtcbiAgICAgIHJldHVybiB2YWwgIT09ICdudWxsJyAmJiB2YWwgIT09ICd1bmRlZmluZWQnICYmIHZhbCAmJiB2YWwubGVuZ3RoID4gMDtcbiAgICB9LFxuXG4gICAgdXBkYXRlU3RvcmFnZTogZnVuY3Rpb24gdXBkYXRlU3RvcmFnZShrZXksIGNvZGUpIHtcbiAgICAgIGlmICghbG9jYWxTdG9yYWdlIHx8IHR5cGVvZiBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSAhPT0gJ2Z1bmN0aW9uJyB8fCAha2V5IHx8IHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCd1bmFibGUgdG8gc2F2ZSB0byBzdG9yYWdlJyk7XG4gICAgICAgIHJldHVybiBjb2RlO1xuICAgICAgfVxuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5ICsgJ1ZhbCcsIGNvZGUpO1xuICAgICAgcmV0dXJuIGNvZGU7XG4gICAgfVxuICB9O1xuXG4gIGNvbW1vbi5jb2RlU3RvcmFnZSA9IGNvZGVTdG9yYWdlO1xuXG4gIHJldHVybiBjb21tb247XG59KHdpbmRvdywgd2luZG93LmNvbW1vbik7IiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBzdG9yZSBjb2RlIGluIHRoZSBVUkxcbndpbmRvdy5jb21tb24gPSBmdW5jdGlvbiAoZ2xvYmFsKSB7XG4gIHZhciBfZW5jb2RlID0gZ2xvYmFsLmVuY29kZVVSSUNvbXBvbmVudDtcbiAgdmFyIF9kZWNvZGUgPSBnbG9iYWwuZGVjb2RlVVJJQ29tcG9uZW50O1xuICB2YXIgbG9jYXRpb24gPSBnbG9iYWwubG9jYXRpb247XG4gIHZhciBoaXN0b3J5ID0gZ2xvYmFsLmhpc3Rvcnk7XG4gIHZhciBfZ2xvYmFsJGNvbW1vbiA9IGdsb2JhbC5jb21tb247XG4gIHZhciBjb21tb24gPSBfZ2xvYmFsJGNvbW1vbiA9PT0gdW5kZWZpbmVkID8geyBpbml0OiBbXSB9IDogX2dsb2JhbCRjb21tb247XG4gIHZhciByZXBsYWNlU2NyaXB0VGFncyA9IGNvbW1vbi5yZXBsYWNlU2NyaXB0VGFncztcbiAgdmFyIHJlcGxhY2VTYWZlVGFncyA9IGNvbW1vbi5yZXBsYWNlU2FmZVRhZ3M7XG4gIHZhciByZXBsYWNlRm9ybUFjdGlvbkF0dHIgPSBjb21tb24ucmVwbGFjZUZvcm1BY3Rpb25BdHRyO1xuICB2YXIgcmVwbGFjZUZjY2ZhYUF0dHIgPSBjb21tb24ucmVwbGFjZUZjY2ZhYUF0dHI7XG5cbiAgdmFyIHF1ZXJ5UmVnZXggPSAvXihcXD98I1xcPykvO1xuICBmdW5jdGlvbiBlbmNvZGVGY2ModmFsKSB7XG4gICAgcmV0dXJuIHJlcGxhY2VTY3JpcHRUYWdzKHJlcGxhY2VGb3JtQWN0aW9uQXR0cih2YWwpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlY29kZUZjYyh2YWwpIHtcbiAgICByZXR1cm4gcmVwbGFjZVNhZmVUYWdzKHJlcGxhY2VGY2NmYWFBdHRyKHZhbCkpO1xuICB9XG5cbiAgdmFyIGNvZGVVcmkgPSB7XG4gICAgZW5jb2RlOiBmdW5jdGlvbiBlbmNvZGUoY29kZSkge1xuICAgICAgcmV0dXJuIF9lbmNvZGUoY29kZSk7XG4gICAgfSxcbiAgICBkZWNvZGU6IGZ1bmN0aW9uIGRlY29kZShjb2RlKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gX2RlY29kZShjb2RlKTtcbiAgICAgIH0gY2F0Y2ggKGlnbm9yZSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9LFxuICAgIGlzSW5RdWVyeTogZnVuY3Rpb24gaXNJblF1ZXJ5KHF1ZXJ5KSB7XG4gICAgICB2YXIgZGVjb2RlZCA9IGNvZGVVcmkuZGVjb2RlKHF1ZXJ5KTtcbiAgICAgIGlmICghZGVjb2RlZCB8fCB0eXBlb2YgZGVjb2RlZC5zcGxpdCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gZGVjb2RlZC5yZXBsYWNlKHF1ZXJ5UmVnZXgsICcnKS5zcGxpdCgnJicpLnJlZHVjZShmdW5jdGlvbiAoZm91bmQsIHBhcmFtKSB7XG4gICAgICAgIHZhciBrZXkgPSBwYXJhbS5zcGxpdCgnPScpWzBdO1xuICAgICAgICBpZiAoa2V5ID09PSAnc29sdXRpb24nKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZvdW5kO1xuICAgICAgfSwgZmFsc2UpO1xuICAgIH0sXG4gICAgaXNBbGl2ZTogZnVuY3Rpb24gaXNBbGl2ZSgpIHtcbiAgICAgIHJldHVybiBjb2RlVXJpLmVuYWJsZWQgJiYgY29kZVVyaS5pc0luUXVlcnkobG9jYXRpb24uc2VhcmNoKSB8fCBjb2RlVXJpLmlzSW5RdWVyeShsb2NhdGlvbi5oYXNoKTtcbiAgICB9LFxuICAgIGdldEtleUluUXVlcnk6IGZ1bmN0aW9uIGdldEtleUluUXVlcnkocXVlcnkpIHtcbiAgICAgIHZhciBrZXlUb0ZpbmQgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDEgfHwgYXJndW1lbnRzWzFdID09PSB1bmRlZmluZWQgPyAnJyA6IGFyZ3VtZW50c1sxXTtcblxuICAgICAgcmV0dXJuIHF1ZXJ5LnNwbGl0KCcmJykucmVkdWNlKGZ1bmN0aW9uIChvbGRWYWx1ZSwgcGFyYW0pIHtcbiAgICAgICAgdmFyIGtleSA9IHBhcmFtLnNwbGl0KCc9JylbMF07XG4gICAgICAgIHZhciB2YWx1ZSA9IHBhcmFtLnNwbGl0KCc9Jykuc2xpY2UoMSkuam9pbignPScpO1xuXG4gICAgICAgIGlmIChrZXkgPT09IGtleVRvRmluZCkge1xuICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb2xkVmFsdWU7XG4gICAgICB9LCBudWxsKTtcbiAgICB9LFxuICAgIGdldFNvbHV0aW9uRnJvbVF1ZXJ5OiBmdW5jdGlvbiBnZXRTb2x1dGlvbkZyb21RdWVyeSgpIHtcbiAgICAgIHZhciBxdWVyeSA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/ICcnIDogYXJndW1lbnRzWzBdO1xuXG4gICAgICByZXR1cm4gZGVjb2RlRmNjKGNvZGVVcmkuZGVjb2RlKGNvZGVVcmkuZ2V0S2V5SW5RdWVyeShxdWVyeSwgJ3NvbHV0aW9uJykpKTtcbiAgICB9LFxuXG4gICAgcGFyc2U6IGZ1bmN0aW9uIHBhcnNlKCkge1xuICAgICAgaWYgKCFjb2RlVXJpLmVuYWJsZWQpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICB2YXIgcXVlcnk7XG4gICAgICBpZiAobG9jYXRpb24uc2VhcmNoICYmIGNvZGVVcmkuaXNJblF1ZXJ5KGxvY2F0aW9uLnNlYXJjaCkpIHtcbiAgICAgICAgcXVlcnkgPSBsb2NhdGlvbi5zZWFyY2gucmVwbGFjZSgvXlxcPy8sICcnKTtcblxuICAgICAgICBpZiAoaGlzdG9yeSAmJiB0eXBlb2YgaGlzdG9yeS5yZXBsYWNlU3RhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBoaXN0b3J5LnJlcGxhY2VTdGF0ZShoaXN0b3J5LnN0YXRlLCBudWxsLCBsb2NhdGlvbi5ocmVmLnNwbGl0KCc/JylbMF0pO1xuICAgICAgICAgIGxvY2F0aW9uLmhhc2ggPSAnIz8nICsgZW5jb2RlRmNjKHF1ZXJ5KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcXVlcnkgPSBsb2NhdGlvbi5oYXNoLnJlcGxhY2UoL15cXCNcXD8vLCAnJyk7XG4gICAgICB9XG5cbiAgICAgIGlmICghcXVlcnkpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLmdldFNvbHV0aW9uRnJvbVF1ZXJ5KHF1ZXJ5KTtcbiAgICB9LFxuICAgIHF1ZXJpZnk6IGZ1bmN0aW9uIHF1ZXJpZnkoc29sdXRpb24pIHtcbiAgICAgIGlmICghY29kZVVyaS5lbmFibGVkKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKGhpc3RvcnkgJiYgdHlwZW9mIGhpc3RvcnkucmVwbGFjZVN0YXRlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIGdyYWIgdGhlIHVybCB1cCB0byB0aGUgcXVlcnlcbiAgICAgICAgLy8gZGVzdHJveSBhbnkgaGFzaCBzeW1ib2xzIHN0aWxsIGNsaW5naW5nIHRvIGxpZmVcbiAgICAgICAgdmFyIHVybCA9IGxvY2F0aW9uLmhyZWYuc3BsaXQoJz8nKVswXS5yZXBsYWNlKC8oIyopJC8sICcnKTtcbiAgICAgICAgaGlzdG9yeS5yZXBsYWNlU3RhdGUoaGlzdG9yeS5zdGF0ZSwgbnVsbCwgdXJsICsgJyM/JyArIChjb2RlVXJpLnNob3VsZFJ1bigpID8gJycgOiAncnVuPWRpc2FibGVkJicpICsgJ3NvbHV0aW9uPScgKyBjb2RlVXJpLmVuY29kZShlbmNvZGVGY2Moc29sdXRpb24pKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsb2NhdGlvbi5oYXNoID0gJz9zb2x1dGlvbj0nICsgY29kZVVyaS5lbmNvZGUoZW5jb2RlRmNjKHNvbHV0aW9uKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzb2x1dGlvbjtcbiAgICB9LFxuICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgc2hvdWxkUnVuOiBmdW5jdGlvbiBzaG91bGRSdW4oKSB7XG4gICAgICByZXR1cm4gIXRoaXMuZ2V0S2V5SW5RdWVyeSgobG9jYXRpb24uc2VhcmNoIHx8IGxvY2F0aW9uLmhhc2gpLnJlcGxhY2UocXVlcnlSZWdleCwgJycpLCAncnVuJyk7XG4gICAgfVxuICB9O1xuXG4gIGNvbW1vbi5pbml0LnB1c2goZnVuY3Rpb24gKCkge1xuICAgIGNvZGVVcmkucGFyc2UoKTtcbiAgfSk7XG5cbiAgY29tbW9uLmNvZGVVcmkgPSBjb2RlVXJpO1xuICBjb21tb24uc2hvdWxkUnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBjb2RlVXJpLnNob3VsZFJ1bigpO1xuICB9O1xuXG4gIHJldHVybiBjb21tb247XG59KHdpbmRvdyk7IiwiJ3VzZSBzdHJpY3QnO1xuXG53aW5kb3cuY29tbW9uID0gZnVuY3Rpb24gKGdsb2JhbCkge1xuICB2YXIgbG9vcFByb3RlY3QgPSBnbG9iYWwubG9vcFByb3RlY3Q7XG4gIHZhciBfZ2xvYmFsJGNvbW1vbiA9IGdsb2JhbC5jb21tb247XG4gIHZhciBjb21tb24gPSBfZ2xvYmFsJGNvbW1vbiA9PT0gdW5kZWZpbmVkID8geyBpbml0OiBbXSB9IDogX2dsb2JhbCRjb21tb247XG5cbiAgbG9vcFByb3RlY3QuaGl0ID0gZnVuY3Rpb24gaGl0KGxpbmUpIHtcbiAgICB2YXIgZXJyID0gJ0Vycm9yOiBFeGl0aW5nIHBvdGVudGlhbCBpbmZpbml0ZSBsb29wIGF0IGxpbmUgJyArIGxpbmUgKyAnLiBUbyBkaXNhYmxlIGxvb3AgcHJvdGVjdGlvbiwgd3JpdGU6IFxcblxcXFwvXFxcXC8gbm9wcm90ZWN0XFxuYXMgdGhlIGZpcnN0JyArICdsaW5lLiBCZXdhcmUgdGhhdCBpZiB5b3UgZG8gaGF2ZSBhbiBpbmZpbml0ZSBsb29wIGluIHlvdXIgY29kZScgKyAndGhpcyB3aWxsIGNyYXNoIHlvdXIgYnJvd3Nlci4nO1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgfTtcblxuICBjb21tb24uYWRkTG9vcFByb3RlY3QgPSBmdW5jdGlvbiBhZGRMb29wUHJvdGVjdCgpIHtcbiAgICB2YXIgY29kZSA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/ICcnIDogYXJndW1lbnRzWzBdO1xuXG4gICAgcmV0dXJuIGxvb3BQcm90ZWN0KGNvZGUpO1xuICB9O1xuXG4gIHJldHVybiBjb21tb247XG59KHdpbmRvdyk7IiwiJ3VzZSBzdHJpY3QnO1xuXG53aW5kb3cuY29tbW9uID0gZnVuY3Rpb24gKGdsb2JhbCkge1xuICB2YXIgX2dsb2JhbCRjb21tb24gPSBnbG9iYWwuY29tbW9uO1xuICB2YXIgY29tbW9uID0gX2dsb2JhbCRjb21tb24gPT09IHVuZGVmaW5lZCA/IHsgaW5pdDogW10gfSA6IF9nbG9iYWwkY29tbW9uO1xuICB2YXIgZG9jID0gZ2xvYmFsLmRvY3VtZW50O1xuXG4gIGNvbW1vbi5nZXRJZnJhbWUgPSBmdW5jdGlvbiBnZXRJZnJhbWUoKSB7XG4gICAgdmFyIGlkID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gJ3ByZXZpZXcnIDogYXJndW1lbnRzWzBdO1xuXG4gICAgdmFyIHByZXZpZXdGcmFtZSA9IGRvYy5nZXRFbGVtZW50QnlJZChpZCk7XG5cbiAgICAvLyBjcmVhdGUgYW5kIGFwcGVuZCBhIGhpZGRlbiBwcmV2aWV3IGZyYW1lXG4gICAgaWYgKCFwcmV2aWV3RnJhbWUpIHtcbiAgICAgIHByZXZpZXdGcmFtZSA9IGRvYy5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgICAgIHByZXZpZXdGcmFtZS5pZCA9IGlkO1xuICAgICAgcHJldmlld0ZyYW1lLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCAnZGlzcGxheTogbm9uZScpO1xuICAgICAgZG9jLmJvZHkuYXBwZW5kQ2hpbGQocHJldmlld0ZyYW1lKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJldmlld0ZyYW1lLmNvbnRlbnREb2N1bWVudCB8fCBwcmV2aWV3RnJhbWUuY29udGVudFdpbmRvdy5kb2N1bWVudDtcbiAgfTtcblxuICByZXR1cm4gY29tbW9uO1xufSh3aW5kb3cpOyIsIid1c2Ugc3RyaWN0Jztcblxud2luZG93LmNvbW1vbiA9IGZ1bmN0aW9uIChnbG9iYWwpIHtcbiAgdmFyIF9nbG9iYWwkUnggPSBnbG9iYWwuUng7XG4gIHZhciBCZWhhdmlvclN1YmplY3QgPSBfZ2xvYmFsJFJ4LkJlaGF2aW9yU3ViamVjdDtcbiAgdmFyIE9ic2VydmFibGUgPSBfZ2xvYmFsJFJ4Lk9ic2VydmFibGU7XG4gIHZhciBfZ2xvYmFsJGNvbW1vbiA9IGdsb2JhbC5jb21tb247XG4gIHZhciBjb21tb24gPSBfZ2xvYmFsJGNvbW1vbiA9PT0gdW5kZWZpbmVkID8geyBpbml0OiBbXSB9IDogX2dsb2JhbCRjb21tb247XG5cbiAgLy8gdGhlIGZpcnN0IHNjcmlwdCB0YWcgaGVyZSBpcyB0byBwcm94eSBqUXVlcnlcbiAgLy8gV2UgdXNlIHRoZSBzYW1lIGpRdWVyeSBvbiB0aGUgbWFpbiB3aW5kb3cgYnV0IHdlIGNoYW5nZSB0aGVcbiAgLy8gY29udGV4dCB0byB0aGF0IG9mIHRoZSBpZnJhbWUuXG5cbiAgdmFyIGxpYnJhcnlJbmNsdWRlcyA9ICdcXG48c2NyaXB0PlxcbiAgd2luZG93Lmxvb3BQcm90ZWN0ID0gcGFyZW50Lmxvb3BQcm90ZWN0O1xcbiAgd2luZG93Ll9fZXJyID0gbnVsbDtcXG4gIHdpbmRvdy5sb29wUHJvdGVjdC5oaXQgPSBmdW5jdGlvbihsaW5lKSB7XFxuICAgIHdpbmRvdy5fX2VyciA9IG5ldyBFcnJvcihcXG4gICAgICBcXCdQb3RlbnRpYWwgaW5maW5pdGUgbG9vcCBhdCBsaW5lIFxcJyArXFxuICAgICAgbGluZSArXFxuICAgICAgXFwnLiBUbyBkaXNhYmxlIGxvb3AgcHJvdGVjdGlvbiwgd3JpdGU6XFwnICtcXG4gICAgICBcXCcgXFxcXG5cXFxcL1xcXFwvIG5vcHJvdGVjdFxcXFxuYXMgdGhlIGZpcnN0XFwnICtcXG4gICAgICBcXCcgbGluZS4gQmV3YXJlIHRoYXQgaWYgeW91IGRvIGhhdmUgYW4gaW5maW5pdGUgbG9vcCBpbiB5b3VyIGNvZGVcXCcgK1xcbiAgICAgIFxcJyB0aGlzIHdpbGwgY3Jhc2ggeW91ciBicm93c2VyLlxcJ1xcbiAgICApO1xcbiAgfTtcXG48L3NjcmlwdD5cXG48bGlua1xcbiAgcmVsPVxcJ3N0eWxlc2hlZXRcXCdcXG4gIGhyZWY9XFwnLy9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvYW5pbWF0ZS5jc3MvMy4yLjAvYW5pbWF0ZS5taW4uY3NzXFwnXFxuICAvPlxcbjxsaW5rXFxuICByZWw9XFwnc3R5bGVzaGVldFxcJ1xcbiAgaHJlZj1cXCcvL21heGNkbi5ib290c3RyYXBjZG4uY29tL2Jvb3RzdHJhcC8zLjMuMS9jc3MvYm9vdHN0cmFwLm1pbi5jc3NcXCdcXG4gIC8+XFxuXFxuPGxpbmtcXG4gIHJlbD1cXCdzdHlsZXNoZWV0XFwnXFxuICBocmVmPVxcJy8vbWF4Y2RuLmJvb3RzdHJhcGNkbi5jb20vZm9udC1hd2Vzb21lLzQuMi4wL2Nzcy9mb250LWF3ZXNvbWUubWluLmNzc1xcJ1xcbiAgLz5cXG48c3R5bGU+XFxuICBib2R5IHsgcGFkZGluZzogMHB4IDNweCAwcHggM3B4OyB9XFxuPC9zdHlsZT5cXG4gICc7XG4gIHZhciBjb2RlRGlzYWJsZWRFcnJvciA9ICdcXG4gICAgPHNjcmlwdD5cXG4gICAgICB3aW5kb3cuX19lcnIgPSBuZXcgRXJyb3IoXFwnY29kZSBoYXMgYmVlbiBkaXNhYmxlZFxcJyk7XFxuICAgIDwvc2NyaXB0PlxcbiAgJztcblxuICB2YXIgaUZyYW1lU2NyaXB0JCA9IGNvbW1vbi5nZXRTY3JpcHRDb250ZW50JCgnL2pzL2lGcmFtZVNjcmlwdHMuanMnKS5zaGFyZVJlcGxheSgpO1xuICB2YXIgalF1ZXJ5U2NyaXB0JCA9IGNvbW1vbi5nZXRTY3JpcHRDb250ZW50JCgnL2Jvd2VyX2NvbXBvbmVudHMvanF1ZXJ5L2Rpc3QvanF1ZXJ5LmpzJykuc2hhcmVSZXBsYXkoKTtcblxuICAvLyBiZWhhdmlvciBzdWJqZWN0IGFsbHdheXMgcmVtZW1iZXJzIHRoZSBsYXN0IHZhbHVlXG4gIC8vIHdlIHVzZSB0aGlzIHRvIGRldGVybWluZSBpZiBydW5QcmV2aWV3VGVzdCQgaXMgZGVmaW5lZFxuICAvLyBhbmQgcHJpbWUgaXQgd2l0aCBmYWxzZVxuICBjb21tb24ucHJldmlld1JlYWR5JCA9IG5ldyBCZWhhdmlvclN1YmplY3QoZmFsc2UpO1xuXG4gIC8vIFRoZXNlIHNob3VsZCBiZSBzZXQgdXAgaW4gdGhlIHByZXZpZXcgd2luZG93XG4gIC8vIGlmIHRoaXMgZXJyb3IgaXMgc2VlbiBpdCBpcyBiZWNhdXNlIHRoZSBmdW5jdGlvbiB0cmllZCB0byBydW5cbiAgLy8gYmVmb3JlIHRoZSBpZnJhbWUgaGFzIGNvbXBsZXRlbHkgbG9hZGVkXG4gIGNvbW1vbi5ydW5QcmV2aWV3VGVzdHMkID0gY29tbW9uLmNoZWNrUHJldmlldyQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIE9ic2VydmFibGUudGhyb3cobmV3IEVycm9yKCdQcmV2aWV3IG5vdCBmdWxseSBsb2FkZWQnKSk7XG4gIH07XG5cbiAgY29tbW9uLnVwZGF0ZVByZXZpZXckID0gZnVuY3Rpb24gdXBkYXRlUHJldmlldyQoKSB7XG4gICAgdmFyIGNvZGUgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyAnJyA6IGFyZ3VtZW50c1swXTtcblxuICAgIHZhciBwcmV2aWV3ID0gY29tbW9uLmdldElmcmFtZSgncHJldmlldycpO1xuXG4gICAgcmV0dXJuIE9ic2VydmFibGUuY29tYmluZUxhdGVzdChpRnJhbWVTY3JpcHQkLCBqUXVlcnlTY3JpcHQkLCBmdW5jdGlvbiAoaWZyYW1lLCBqUXVlcnkpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGlmcmFtZVNjcmlwdDogJzxzY3JpcHQ+JyArIGlmcmFtZSArICc8L3NjcmlwdD4nLFxuICAgICAgICBqUXVlcnk6ICc8c2NyaXB0PicgKyBqUXVlcnkgKyAnPC9zY3JpcHQ+J1xuICAgICAgfTtcbiAgICB9KS5maXJzdCgpLmZsYXRNYXAoZnVuY3Rpb24gKF9yZWYpIHtcbiAgICAgIHZhciBpZnJhbWVTY3JpcHQgPSBfcmVmLmlmcmFtZVNjcmlwdDtcbiAgICAgIHZhciBqUXVlcnkgPSBfcmVmLmpRdWVyeTtcblxuICAgICAgLy8gd2UgbWFrZSBzdXJlIHRvIG92ZXJyaWRlIHRoZSBsYXN0IHZhbHVlIGluIHRoZVxuICAgICAgLy8gc3ViamVjdCB0byBmYWxzZSBoZXJlLlxuICAgICAgY29tbW9uLnByZXZpZXdSZWFkeSQub25OZXh0KGZhbHNlKTtcbiAgICAgIHByZXZpZXcub3BlbigpO1xuICAgICAgcHJldmlldy53cml0ZShsaWJyYXJ5SW5jbHVkZXMgKyBqUXVlcnkgKyAoY29tbW9uLnNob3VsZFJ1bigpID8gY29kZSA6IGNvZGVEaXNhYmxlZEVycm9yKSArICc8IS0tIC0tPicgKyBpZnJhbWVTY3JpcHQpO1xuICAgICAgcHJldmlldy5jbG9zZSgpO1xuICAgICAgLy8gbm93IHdlIGZpbHRlciBmYWxzZSB2YWx1ZXMgYW5kIHdhaXQgZm9yIHRoZSBmaXJzdCB0cnVlXG4gICAgICByZXR1cm4gY29tbW9uLnByZXZpZXdSZWFkeSQuZmlsdGVyKGZ1bmN0aW9uIChyZWFkeSkge1xuICAgICAgICByZXR1cm4gcmVhZHk7XG4gICAgICB9KS5maXJzdCgpXG4gICAgICAvLyB0aGUgZGVsYXkgaGVyZSBpcyB0byBnaXZlIGNvZGUgd2l0aGluIHRoZSBpZnJhbWVcbiAgICAgIC8vIGNvbnRyb2wgdG8gcnVuXG4gICAgICAuZGVsYXkoNDAwKTtcbiAgICB9KS5tYXAoZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGNvZGU7XG4gICAgfSk7XG4gIH07XG5cbiAgcmV0dXJuIGNvbW1vbjtcbn0od2luZG93KTsiLCIndXNlIHN0cmljdCc7XG5cbndpbmRvdy5jb21tb24gPSBmdW5jdGlvbiAoZ2xvYmFsKSB7XG4gIHZhciBfZ2xvYmFsJFJ4ID0gZ2xvYmFsLlJ4O1xuICB2YXIgU3ViamVjdCA9IF9nbG9iYWwkUnguU3ViamVjdDtcbiAgdmFyIE9ic2VydmFibGUgPSBfZ2xvYmFsJFJ4Lk9ic2VydmFibGU7XG4gIHZhciBDb2RlTWlycm9yID0gZ2xvYmFsLkNvZGVNaXJyb3I7XG4gIHZhciBlbW1ldENvZGVNaXJyb3IgPSBnbG9iYWwuZW1tZXRDb2RlTWlycm9yO1xuICB2YXIgX2dsb2JhbCRjb21tb24gPSBnbG9iYWwuY29tbW9uO1xuICB2YXIgY29tbW9uID0gX2dsb2JhbCRjb21tb24gPT09IHVuZGVmaW5lZCA/IHsgaW5pdDogW10gfSA6IF9nbG9iYWwkY29tbW9uO1xuICB2YXIgX2NvbW1vbiRjaGFsbGVuZ2VUeXBlID0gY29tbW9uLmNoYWxsZW5nZVR5cGU7XG4gIHZhciBjaGFsbGVuZ2VUeXBlID0gX2NvbW1vbiRjaGFsbGVuZ2VUeXBlID09PSB1bmRlZmluZWQgPyAnMCcgOiBfY29tbW9uJGNoYWxsZW5nZVR5cGU7XG4gIHZhciBjaGFsbGVuZ2VUeXBlcyA9IGNvbW1vbi5jaGFsbGVuZ2VUeXBlcztcblxuICBpZiAoIUNvZGVNaXJyb3IgfHwgY2hhbGxlbmdlVHlwZSA9PT0gY2hhbGxlbmdlVHlwZXMuQkFTRUpVTVAgfHwgY2hhbGxlbmdlVHlwZSA9PT0gY2hhbGxlbmdlVHlwZXMuWklQTElORSB8fCBjaGFsbGVuZ2VUeXBlID09PSBjaGFsbGVuZ2VUeXBlcy5WSURFTyB8fCBjaGFsbGVuZ2VUeXBlID09PSBjaGFsbGVuZ2VUeXBlcy5TVEVQIHx8IGNoYWxsZW5nZVR5cGUgPT09IGNoYWxsZW5nZVR5cGVzLkhJS0VTKSB7XG4gICAgY29tbW9uLmVkaXRvciA9IHt9O1xuICAgIHJldHVybiBjb21tb247XG4gIH1cblxuICB2YXIgZWRpdG9yID0gQ29kZU1pcnJvci5mcm9tVGV4dEFyZWEoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvZGVFZGl0b3InKSwge1xuICAgIGxpbnQ6IHRydWUsXG4gICAgbGluZU51bWJlcnM6IHRydWUsXG4gICAgbW9kZTogJ2phdmFzY3JpcHQnLFxuICAgIHRoZW1lOiAnbW9ub2thaScsXG4gICAgcnVubmFibGU6IHRydWUsXG4gICAgbWF0Y2hCcmFja2V0czogdHJ1ZSxcbiAgICBhdXRvQ2xvc2VCcmFja2V0czogdHJ1ZSxcbiAgICBzY3JvbGxiYXJTdHlsZTogJ251bGwnLFxuICAgIGxpbmVXcmFwcGluZzogdHJ1ZSxcbiAgICBndXR0ZXJzOiBbJ0NvZGVNaXJyb3ItbGludC1tYXJrZXJzJ11cbiAgfSk7XG5cbiAgZWRpdG9yLnNldFNpemUoJzEwMCUnLCAnYXV0bycpO1xuXG4gIGNvbW1vbi5lZGl0b3JFeGVjdXRlJCA9IG5ldyBTdWJqZWN0KCk7XG4gIGNvbW1vbi5lZGl0b3JLZXlVcCQgPSBPYnNlcnZhYmxlLmZyb21FdmVudFBhdHRlcm4oZnVuY3Rpb24gKGhhbmRsZXIpIHtcbiAgICByZXR1cm4gZWRpdG9yLm9uKCdrZXl1cCcsIGhhbmRsZXIpO1xuICB9LCBmdW5jdGlvbiAoaGFuZGxlcikge1xuICAgIHJldHVybiBlZGl0b3Iub2ZmKCdrZXl1cCcsIGhhbmRsZXIpO1xuICB9KTtcblxuICBlZGl0b3Iuc2V0T3B0aW9uKCdleHRyYUtleXMnLCB7XG4gICAgVGFiOiBmdW5jdGlvbiBUYWIoY20pIHtcbiAgICAgIGlmIChjbS5zb21ldGhpbmdTZWxlY3RlZCgpKSB7XG4gICAgICAgIGNtLmluZGVudFNlbGVjdGlvbignYWRkJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgc3BhY2VzID0gQXJyYXkoY20uZ2V0T3B0aW9uKCdpbmRlbnRVbml0JykgKyAxKS5qb2luKCcgJyk7XG4gICAgICAgIGNtLnJlcGxhY2VTZWxlY3Rpb24oc3BhY2VzKTtcbiAgICAgIH1cbiAgICB9LFxuICAgICdTaGlmdC1UYWInOiBmdW5jdGlvbiBTaGlmdFRhYihjbSkge1xuICAgICAgaWYgKGNtLnNvbWV0aGluZ1NlbGVjdGVkKCkpIHtcbiAgICAgICAgY20uaW5kZW50U2VsZWN0aW9uKCdzdWJ0cmFjdCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHNwYWNlcyA9IEFycmF5KGNtLmdldE9wdGlvbignaW5kZW50VW5pdCcpICsgMSkuam9pbignICcpO1xuICAgICAgICBjbS5yZXBsYWNlU2VsZWN0aW9uKHNwYWNlcyk7XG4gICAgICB9XG4gICAgfSxcbiAgICAnQ3RybC1FbnRlcic6IGZ1bmN0aW9uIEN0cmxFbnRlcigpIHtcbiAgICAgIGNvbW1vbi5lZGl0b3JFeGVjdXRlJC5vbk5leHQoKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuICAgICdDbWQtRW50ZXInOiBmdW5jdGlvbiBDbWRFbnRlcigpIHtcbiAgICAgIGNvbW1vbi5lZGl0b3JFeGVjdXRlJC5vbk5leHQoKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0pO1xuXG4gIHZhciBpbmZvID0gZWRpdG9yLmdldFNjcm9sbEluZm8oKTtcblxuICB2YXIgYWZ0ZXIgPSBlZGl0b3IuY2hhckNvb3Jkcyh7XG4gICAgbGluZTogZWRpdG9yLmdldEN1cnNvcigpLmxpbmUgKyAxLFxuICAgIGNoOiAwXG4gIH0sICdsb2NhbCcpLnRvcDtcblxuICBpZiAoaW5mby50b3AgKyBpbmZvLmNsaWVudEhlaWdodCA8IGFmdGVyKSB7XG4gICAgZWRpdG9yLnNjcm9sbFRvKG51bGwsIGFmdGVyIC0gaW5mby5jbGllbnRIZWlnaHQgKyAzKTtcbiAgfVxuXG4gIGlmIChlbW1ldENvZGVNaXJyb3IpIHtcbiAgICBlbW1ldENvZGVNaXJyb3IoZWRpdG9yLCB7XG4gICAgICAnQ21kLUUnOiAnZW1tZXQuZXhwYW5kX2FiYnJldmlhdGlvbicsXG4gICAgICBUYWI6ICdlbW1ldC5leHBhbmRfYWJicmV2aWF0aW9uX3dpdGhfdGFiJyxcbiAgICAgIEVudGVyOiAnZW1tZXQuaW5zZXJ0X2Zvcm1hdHRlZF9saW5lX2JyZWFrX29ubHknXG4gICAgfSk7XG4gIH1cbiAgY29tbW9uLmluaXQucHVzaChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGVkaXRvclZhbHVlID0gdW5kZWZpbmVkO1xuICAgIGlmIChjb21tb24uY29kZVVyaS5pc0FsaXZlKCkpIHtcbiAgICAgIGVkaXRvclZhbHVlID0gY29tbW9uLmNvZGVVcmkucGFyc2UoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWRpdG9yVmFsdWUgPSBjb21tb24uY29kZVN0b3JhZ2UuaXNBbGl2ZShjb21tb24uY2hhbGxlbmdlTmFtZSkgPyBjb21tb24uY29kZVN0b3JhZ2UuZ2V0U3RvcmVkVmFsdWUoY29tbW9uLmNoYWxsZW5nZU5hbWUpIDogY29tbW9uLnNlZWQ7XG4gICAgfVxuXG4gICAgZWRpdG9yLnNldFZhbHVlKGNvbW1vbi5yZXBsYWNlU2FmZVRhZ3MoZWRpdG9yVmFsdWUpKTtcbiAgICBlZGl0b3IucmVmcmVzaCgpO1xuICB9KTtcblxuICBjb21tb24uZWRpdG9yID0gZWRpdG9yO1xuXG4gIHJldHVybiBjb21tb247XG59KHdpbmRvdyk7IiwiJ3VzZSBzdHJpY3QnO1xuXG53aW5kb3cuY29tbW9uID0gZnVuY3Rpb24gKGdsb2JhbCkge1xuICB2YXIgT2JzZXJ2YWJsZSA9IGdsb2JhbC5SeC5PYnNlcnZhYmxlO1xuICB2YXIgX2dsb2JhbCRjb21tb24gPSBnbG9iYWwuY29tbW9uO1xuICB2YXIgY29tbW9uID0gX2dsb2JhbCRjb21tb24gPT09IHVuZGVmaW5lZCA/IHsgaW5pdDogW10gfSA6IF9nbG9iYWwkY29tbW9uO1xuXG4gIHZhciBkZXRlY3RGdW5jdGlvbkNhbGwgPSAvZnVuY3Rpb25cXHMqP1xcKHxmdW5jdGlvblxccytcXHcrXFxzKj9cXCgvZ2k7XG4gIHZhciBkZXRlY3RVbnNhZmVKUSA9IC9cXCRcXHMqP1xcKFxccyo/XFwkXFxzKj9cXCkvZ2k7XG4gIHZhciBkZXRlY3RVbnNhZmVDb25zb2xlQ2FsbCA9IC9pZlxcc1xcKG51bGxcXClcXHNjb25zb2xlXFwubG9nXFwoMVxcKTsvZ2k7XG5cbiAgY29tbW9uLmRldGVjdFVuc2FmZUNvZGUkID0gZnVuY3Rpb24gZGV0ZWN0VW5zYWZlQ29kZSQoY29kZSkge1xuICAgIHZhciBvcGVuaW5nQ29tbWVudHMgPSBjb2RlLm1hdGNoKC9cXC9cXCovZ2kpO1xuICAgIHZhciBjbG9zaW5nQ29tbWVudHMgPSBjb2RlLm1hdGNoKC9cXCpcXC8vZ2kpO1xuXG4gICAgLy8gY2hlY2tzIGlmIHRoZSBudW1iZXIgb2Ygb3BlbmluZyBjb21tZW50cygvKikgbWF0Y2hlcyB0aGUgbnVtYmVyIG9mXG4gICAgLy8gY2xvc2luZyBjb21tZW50cygqLylcbiAgICBpZiAob3BlbmluZ0NvbW1lbnRzICYmICghY2xvc2luZ0NvbW1lbnRzIHx8IG9wZW5pbmdDb21tZW50cy5sZW5ndGggPiBjbG9zaW5nQ29tbWVudHMubGVuZ3RoKSkge1xuXG4gICAgICByZXR1cm4gT2JzZXJ2YWJsZS50aHJvdyhuZXcgRXJyb3IoJ1N5bnRheEVycm9yOiBVbmZpbmlzaGVkIG11bHRpLWxpbmUgY29tbWVudCcpKTtcbiAgICB9XG5cbiAgICBpZiAoY29kZS5tYXRjaChkZXRlY3RVbnNhZmVKUSkpIHtcbiAgICAgIHJldHVybiBPYnNlcnZhYmxlLnRocm93KG5ldyBFcnJvcignVW5zYWZlICQoJCknKSk7XG4gICAgfVxuXG4gICAgaWYgKGNvZGUubWF0Y2goL2Z1bmN0aW9uL2cpICYmICFjb2RlLm1hdGNoKGRldGVjdEZ1bmN0aW9uQ2FsbCkpIHtcbiAgICAgIHJldHVybiBPYnNlcnZhYmxlLnRocm93KG5ldyBFcnJvcignU3ludGF4RXJyb3I6IFVuc2FmZSBvciB1bmZpbmlzaGVkIGZ1bmN0aW9uIGRlY2xhcmF0aW9uJykpO1xuICAgIH1cblxuICAgIGlmIChjb2RlLm1hdGNoKGRldGVjdFVuc2FmZUNvbnNvbGVDYWxsKSkge1xuICAgICAgcmV0dXJuIE9ic2VydmFibGUudGhyb3cobmV3IEVycm9yKCdJbnZhbGlkIGlmIChudWxsKSBjb25zb2xlLmxvZygxKTsgZGV0ZWN0ZWQnKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIE9ic2VydmFibGUuanVzdChjb2RlKTtcbiAgfTtcblxuICByZXR1cm4gY29tbW9uO1xufSh3aW5kb3cpOyIsIid1c2Ugc3RyaWN0Jztcblxud2luZG93LmNvbW1vbiA9IGZ1bmN0aW9uIChfcmVmKSB7XG4gIHZhciAkID0gX3JlZi4kO1xuICB2YXIgX3JlZiRjb21tb24gPSBfcmVmLmNvbW1vbjtcbiAgdmFyIGNvbW1vbiA9IF9yZWYkY29tbW9uID09PSB1bmRlZmluZWQgPyB7IGluaXQ6IFtdIH0gOiBfcmVmJGNvbW1vbjtcblxuICBjb21tb24uZGlzcGxheVRlc3RSZXN1bHRzID0gZnVuY3Rpb24gZGlzcGxheVRlc3RSZXN1bHRzKCkge1xuICAgIHZhciBkYXRhID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gW10gOiBhcmd1bWVudHNbMF07XG5cbiAgICAkKCcjdGVzdFN1aXRlJykuY2hpbGRyZW4oKS5yZW1vdmUoKTtcbiAgICBkYXRhLmZvckVhY2goZnVuY3Rpb24gKF9yZWYyKSB7XG4gICAgICB2YXIgX3JlZjIkZXJyID0gX3JlZjIuZXJyO1xuICAgICAgdmFyIGVyciA9IF9yZWYyJGVyciA9PT0gdW5kZWZpbmVkID8gZmFsc2UgOiBfcmVmMiRlcnI7XG4gICAgICB2YXIgX3JlZjIkdGV4dCA9IF9yZWYyLnRleHQ7XG4gICAgICB2YXIgdGV4dCA9IF9yZWYyJHRleHQgPT09IHVuZGVmaW5lZCA/ICcnIDogX3JlZjIkdGV4dDtcblxuICAgICAgdmFyIGljb25DbGFzcyA9IGVyciA/ICdcImlvbi1jbG9zZS1jaXJjbGVkIGJpZy1lcnJvci1pY29uXCInIDogJ1wiaW9uLWNoZWNrbWFyay1jaXJjbGVkIGJpZy1zdWNjZXNzLWljb25cIic7XG5cbiAgICAgICQoJzxkaXY+PC9kaXY+JykuaHRtbCgnXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcJ3Jvd1xcJz5cXG4gICAgICAgICAgPGRpdiBjbGFzcz1cXCdjb2wteHMtMiB0ZXh0LWNlbnRlclxcJz5cXG4gICAgICAgICAgICA8aSBjbGFzcz0nICsgaWNvbkNsYXNzICsgJz48L2k+XFxuICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICA8ZGl2IGNsYXNzPVxcJ2NvbC14cy0xMCB0ZXN0LW91dHB1dFxcJz5cXG4gICAgICAgICAgICAnICsgdGV4dC5zcGxpdCgnbWVzc2FnZTogJykucG9wKCkucmVwbGFjZSgvXFwnXFwpOy9nLCAnJykgKyAnXFxuICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICA8ZGl2IGNsYXNzPVxcJ3Rlbi1waXhlbC1icmVha1xcJy8+XFxuICAgICAgICA8L2Rpdj5cXG4gICAgICAnKS5hcHBlbmRUbygkKCcjdGVzdFN1aXRlJykpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGRhdGE7XG4gIH07XG5cbiAgcmV0dXJuIGNvbW1vbjtcbn0od2luZG93KTsiLCIndXNlIHN0cmljdCc7XG5cbndpbmRvdy5jb21tb24gPSBmdW5jdGlvbiAoZ2xvYmFsKSB7XG4gIHZhciBnYSA9IGdsb2JhbC5nYTtcbiAgdmFyIF9nbG9iYWwkY29tbW9uID0gZ2xvYmFsLmNvbW1vbjtcbiAgdmFyIGNvbW1vbiA9IF9nbG9iYWwkY29tbW9uID09PSB1bmRlZmluZWQgPyB7IGluaXQ6IFtdIH0gOiBfZ2xvYmFsJGNvbW1vbjtcbiAgdmFyIGFkZExvb3BQcm90ZWN0ID0gY29tbW9uLmFkZExvb3BQcm90ZWN0O1xuICB2YXIgZ2V0SnNGcm9tSHRtbCA9IGNvbW1vbi5nZXRKc0Zyb21IdG1sO1xuICB2YXIgZGV0ZWN0VW5zYWZlQ29kZSQgPSBjb21tb24uZGV0ZWN0VW5zYWZlQ29kZSQ7XG4gIHZhciB1cGRhdGVQcmV2aWV3JCA9IGNvbW1vbi51cGRhdGVQcmV2aWV3JDtcbiAgdmFyIGNoYWxsZW5nZVR5cGUgPSBjb21tb24uY2hhbGxlbmdlVHlwZTtcbiAgdmFyIGNoYWxsZW5nZVR5cGVzID0gY29tbW9uLmNoYWxsZW5nZVR5cGVzO1xuXG4gIGNvbW1vbi5leGVjdXRlQ2hhbGxlbmdlJCA9IGZ1bmN0aW9uIGV4ZWN1dGVDaGFsbGVuZ2UkKCkge1xuICAgIHZhciBjb2RlID0gY29tbW9uLmVkaXRvci5nZXRWYWx1ZSgpO1xuICAgIHZhciBvcmlnaW5hbENvZGUgPSBjb2RlO1xuICAgIHZhciBoZWFkID0gY29tbW9uLmFycmF5VG9OZXdMaW5lU3RyaW5nKGNvbW1vbi5oZWFkKTtcbiAgICB2YXIgdGFpbCA9IGNvbW1vbi5hcnJheVRvTmV3TGluZVN0cmluZyhjb21tb24udGFpbCk7XG4gICAgdmFyIGNvbWJpbmVkQ29kZSA9IGhlYWQgKyBjb2RlICsgdGFpbDtcblxuICAgIGdhKCdzZW5kJywgJ2V2ZW50JywgJ0NoYWxsZW5nZScsICdyYW4tY29kZScsIGNvbW1vbi5nYU5hbWUpO1xuXG4gICAgLy8gcnVuIGNoZWNrcyBmb3IgdW5zYWZlIGNvZGVcbiAgICByZXR1cm4gZGV0ZWN0VW5zYWZlQ29kZSQoY29kZSlcbiAgICAvLyBhZGQgaGVhZCBhbmQgdGFpbCBhbmQgZGV0ZWN0IGxvb3BzXG4gICAgLm1hcChmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoY2hhbGxlbmdlVHlwZSAhPT0gY2hhbGxlbmdlVHlwZXMuSFRNTCkge1xuICAgICAgICByZXR1cm4gJzxzY3JpcHQ+OycgKyBhZGRMb29wUHJvdGVjdChjb21iaW5lZENvZGUpICsgJy8qKi88L3NjcmlwdD4nO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYWRkTG9vcFByb3RlY3QoY29tYmluZWRDb2RlKTtcbiAgICB9KS5mbGF0TWFwKGZ1bmN0aW9uIChjb2RlKSB7XG4gICAgICByZXR1cm4gdXBkYXRlUHJldmlldyQoY29kZSk7XG4gICAgfSkuZmxhdE1hcChmdW5jdGlvbiAoY29kZSkge1xuICAgICAgdmFyIG91dHB1dCA9IHVuZGVmaW5lZDtcblxuICAgICAgaWYgKGNoYWxsZW5nZVR5cGUgPT09IGNoYWxsZW5nZVR5cGVzLkhUTUwgJiYgY29tbW9uLmhhc0pzKGNvZGUpKSB7XG4gICAgICAgIG91dHB1dCA9IGNvbW1vbi5nZXRKc091dHB1dChnZXRKc0Zyb21IdG1sKGNvZGUpKTtcbiAgICAgIH0gZWxzZSBpZiAoY2hhbGxlbmdlVHlwZSAhPT0gY2hhbGxlbmdlVHlwZXMuSFRNTCkge1xuICAgICAgICBvdXRwdXQgPSBjb21tb24uZ2V0SnNPdXRwdXQoYWRkTG9vcFByb3RlY3QoY29tYmluZWRDb2RlKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjb21tb24ucnVuUHJldmlld1Rlc3RzJCh7XG4gICAgICAgIHRlc3RzOiBjb21tb24udGVzdHMuc2xpY2UoKSxcbiAgICAgICAgb3JpZ2luYWxDb2RlOiBvcmlnaW5hbENvZGUsXG4gICAgICAgIG91dHB1dDogb3V0cHV0XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICByZXR1cm4gY29tbW9uO1xufSh3aW5kb3cpOyIsIid1c2Ugc3RyaWN0Jztcblxud2luZG93LmNvbW1vbiA9IGZ1bmN0aW9uIChnbG9iYWwpIHtcbiAgdmFyIENvZGVNaXJyb3IgPSBnbG9iYWwuQ29kZU1pcnJvcjtcbiAgdmFyIGRvYyA9IGdsb2JhbC5kb2N1bWVudDtcbiAgdmFyIF9nbG9iYWwkY29tbW9uID0gZ2xvYmFsLmNvbW1vbjtcbiAgdmFyIGNvbW1vbiA9IF9nbG9iYWwkY29tbW9uID09PSB1bmRlZmluZWQgPyB7IGluaXQ6IFtdIH0gOiBfZ2xvYmFsJGNvbW1vbjtcbiAgdmFyIGNoYWxsZW5nZVR5cGVzID0gY29tbW9uLmNoYWxsZW5nZVR5cGVzO1xuICB2YXIgX2NvbW1vbiRjaGFsbGVuZ2VUeXBlID0gY29tbW9uLmNoYWxsZW5nZVR5cGU7XG4gIHZhciBjaGFsbGVuZ2VUeXBlID0gX2NvbW1vbiRjaGFsbGVuZ2VUeXBlID09PSB1bmRlZmluZWQgPyAnMCcgOiBfY29tbW9uJGNoYWxsZW5nZVR5cGU7XG5cbiAgaWYgKCFDb2RlTWlycm9yIHx8IGNoYWxsZW5nZVR5cGUgIT09IGNoYWxsZW5nZVR5cGVzLkpTICYmIGNoYWxsZW5nZVR5cGUgIT09IGNoYWxsZW5nZVR5cGVzLkJPTkZJUkUpIHtcbiAgICBjb21tb24udXBkYXRlT3V0cHV0RGlzcGxheSA9IGZ1bmN0aW9uICgpIHt9O1xuICAgIGNvbW1vbi5hcHBlbmRUb091dHB1dERpc3BsYXkgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICByZXR1cm4gY29tbW9uO1xuICB9XG5cbiAgdmFyIGNvZGVPdXRwdXQgPSBDb2RlTWlycm9yLmZyb21UZXh0QXJlYShkb2MuZ2V0RWxlbWVudEJ5SWQoJ2NvZGVPdXRwdXQnKSwge1xuICAgIGxpbmVOdW1iZXJzOiBmYWxzZSxcbiAgICBtb2RlOiAndGV4dCcsXG4gICAgdGhlbWU6ICdtb25va2FpJyxcbiAgICByZWFkT25seTogJ25vY3Vyc29yJyxcbiAgICBsaW5lV3JhcHBpbmc6IHRydWVcbiAgfSk7XG5cbiAgY29kZU91dHB1dC5zZXRWYWx1ZSgnLyoqXFxuICAqIFlvdXIgb3V0cHV0IHdpbGwgZ28gaGVyZS5cXG4gICogQ29uc29sZS5sb2coKSAtdHlwZSBzdGF0ZW1lbnRzXFxuICAqIHdpbGwgYXBwZWFyIGluIHlvdXIgYnJvd3NlclxcJ3NcXG4gICogRGV2VG9vbHMgSmF2YVNjcmlwdCBjb25zb2xlLlxcbiAgKi8nKTtcblxuICBjb2RlT3V0cHV0LnNldFNpemUoJzEwMCUnLCAnMTAwJScpO1xuXG4gIGNvbW1vbi51cGRhdGVPdXRwdXREaXNwbGF5ID0gZnVuY3Rpb24gdXBkYXRlT3V0cHV0RGlzcGxheSgpIHtcbiAgICB2YXIgc3RyID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gJycgOiBhcmd1bWVudHNbMF07XG5cbiAgICBpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHN0ciA9IEpTT04uc3RyaW5naWZ5KHN0cik7XG4gICAgfVxuICAgIGNvZGVPdXRwdXQuc2V0VmFsdWUoc3RyKTtcbiAgICByZXR1cm4gc3RyO1xuICB9O1xuXG4gIGNvbW1vbi5hcHBlbmRUb091dHB1dERpc3BsYXkgPSBmdW5jdGlvbiBhcHBlbmRUb091dHB1dERpc3BsYXkoKSB7XG4gICAgdmFyIHN0ciA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/ICcnIDogYXJndW1lbnRzWzBdO1xuXG4gICAgY29kZU91dHB1dC5zZXRWYWx1ZShjb2RlT3V0cHV0LmdldFZhbHVlKCkgKyBzdHIpO1xuICAgIHJldHVybiBzdHI7XG4gIH07XG5cbiAgcmV0dXJuIGNvbW1vbjtcbn0od2luZG93KTsiLCIndXNlIHN0cmljdCc7XG5cbndpbmRvdy5jb21tb24gPSBmdW5jdGlvbiAoX3JlZikge1xuICB2YXIgX3JlZiRjb21tb24gPSBfcmVmLmNvbW1vbjtcbiAgdmFyIGNvbW1vbiA9IF9yZWYkY29tbW9uID09PSB1bmRlZmluZWQgPyB7IGluaXQ6IFtdIH0gOiBfcmVmJGNvbW1vbjtcblxuICBjb21tb24ubG9ja1RvcCA9IGZ1bmN0aW9uIGxvY2tUb3AoKSB7XG4gICAgdmFyIG1hZ2lWYWw7XG5cbiAgICBpZiAoJCh3aW5kb3cpLndpZHRoKCkgPj0gOTkwKSB7XG4gICAgICBpZiAoJCgnLmVkaXRvclNjcm9sbERpdicpLmh0bWwoKSkge1xuXG4gICAgICAgIG1hZ2lWYWwgPSAkKHdpbmRvdykuaGVpZ2h0KCkgLSAkKCcubmF2YmFyJykuaGVpZ2h0KCk7XG5cbiAgICAgICAgaWYgKG1hZ2lWYWwgPCAwKSB7XG4gICAgICAgICAgbWFnaVZhbCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgJCgnLmVkaXRvclNjcm9sbERpdicpLmNzcygnaGVpZ2h0JywgbWFnaVZhbCAtIDUwICsgJ3B4Jyk7XG4gICAgICB9XG5cbiAgICAgIG1hZ2lWYWwgPSAkKHdpbmRvdykuaGVpZ2h0KCkgLSAkKCcubmF2YmFyJykuaGVpZ2h0KCk7XG5cbiAgICAgIGlmIChtYWdpVmFsIDwgMCkge1xuICAgICAgICBtYWdpVmFsID0gMDtcbiAgICAgIH1cblxuICAgICAgJCgnLnNjcm9sbC1sb2NrZXInKS5jc3MoJ21pbi1oZWlnaHQnLCAkKCcuZWRpdG9yU2Nyb2xsRGl2JykuaGVpZ2h0KCkpLmNzcygnaGVpZ2h0JywgbWFnaVZhbCAtIDUwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgJCgnLmVkaXRvclNjcm9sbERpdicpLmNzcygnbWF4LWhlaWdodCcsIDUwMCArICdweCcpO1xuXG4gICAgICAkKCcuc2Nyb2xsLWxvY2tlcicpLmNzcygncG9zaXRpb24nLCAnaW5oZXJpdCcpLmNzcygndG9wJywgJ2luaGVyaXQnKS5jc3MoJ3dpZHRoJywgJzEwMCUnKS5jc3MoJ21heC1oZWlnaHQnLCAnMTAwJScpO1xuICAgIH1cbiAgfTtcblxuICBjb21tb24uaW5pdC5wdXNoKGZ1bmN0aW9uICgkKSB7XG4gICAgLy8gZmFrZWlwaG9uZSBwb3NpdGlvbmluZyBob3RmaXhcbiAgICBpZiAoJCgnLmlwaG9uZS1wb3NpdGlvbicpLmh0bWwoKSB8fCAkKCcuaXBob25lJykuaHRtbCgpKSB7XG4gICAgICB2YXIgc3RhcnRJcGhvbmVQb3NpdGlvbiA9IHBhcnNlSW50KCQoJy5pcGhvbmUtcG9zaXRpb24nKS5jc3MoJ3RvcCcpLnJlcGxhY2UoJ3B4JywgJycpLCAxMCk7XG5cbiAgICAgIHZhciBzdGFydElwaG9uZSA9IHBhcnNlSW50KCQoJy5pcGhvbmUnKS5jc3MoJ3RvcCcpLnJlcGxhY2UoJ3B4JywgJycpLCAxMCk7XG5cbiAgICAgICQod2luZG93KS5vbignc2Nyb2xsJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY291cnNlSGVpZ2h0ID0gJCgnLmNvdXJzZXdhcmUtaGVpZ2h0JykuaGVpZ2h0KCk7XG4gICAgICAgIHZhciBjb3Vyc2VUb3AgPSAkKCcuY291cnNld2FyZS1oZWlnaHQnKS5vZmZzZXQoKS50b3A7XG4gICAgICAgIHZhciB3aW5kb3dTY3JvbGxUb3AgPSAkKHdpbmRvdykuc2Nyb2xsVG9wKCk7XG4gICAgICAgIHZhciBwaG9uZUhlaWdodCA9ICQoJy5pcGhvbmUtcG9zaXRpb24nKS5oZWlnaHQoKTtcblxuICAgICAgICBpZiAoY291cnNlSGVpZ2h0ICsgY291cnNlVG9wIC0gd2luZG93U2Nyb2xsVG9wIC0gcGhvbmVIZWlnaHQgPD0gMCkge1xuICAgICAgICAgICQoJy5pcGhvbmUtcG9zaXRpb24nKS5jc3MoJ3RvcCcsIHN0YXJ0SXBob25lUG9zaXRpb24gKyBjb3Vyc2VIZWlnaHQgKyBjb3Vyc2VUb3AgLSB3aW5kb3dTY3JvbGxUb3AgLSBwaG9uZUhlaWdodCk7XG5cbiAgICAgICAgICAkKCcuaXBob25lJykuY3NzKCd0b3AnLCBzdGFydElwaG9uZVBvc2l0aW9uICsgY291cnNlSGVpZ2h0ICsgY291cnNlVG9wIC0gd2luZG93U2Nyb2xsVG9wIC0gcGhvbmVIZWlnaHQgKyAxMjApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICQoJy5pcGhvbmUtcG9zaXRpb24nKS5jc3MoJ3RvcCcsIHN0YXJ0SXBob25lUG9zaXRpb24pO1xuICAgICAgICAgICQoJy5pcGhvbmUnKS5jc3MoJ3RvcCcsIHN0YXJ0SXBob25lKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKCQoJy5zY3JvbGwtbG9ja2VyJykuaHRtbCgpKSB7XG5cbiAgICAgIGlmICgkKCcuc2Nyb2xsLWxvY2tlcicpLmh0bWwoKSkge1xuICAgICAgICBjb21tb24ubG9ja1RvcCgpO1xuICAgICAgICAkKHdpbmRvdykub24oJ3Jlc2l6ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb21tb24ubG9ja1RvcCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgJCh3aW5kb3cpLm9uKCdzY3JvbGwnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29tbW9uLmxvY2tUb3AoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHZhciBleGVjSW5Qcm9ncmVzcyA9IGZhbHNlO1xuXG4gICAgICAvLyB3aHkgaXMgdGhpcyBub3QgJD8/P1xuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Njcm9sbC1sb2NrZXInKS5hZGRFdmVudExpc3RlbmVyKCdwcmV2aWV3VXBkYXRlU3B5JywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKGV4ZWNJblByb2dyZXNzKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZXhlY0luUHJvZ3Jlc3MgPSB0cnVlO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBpZiAoJCgkKCcuc2Nyb2xsLWxvY2tlcicpLmNoaWxkcmVuKClbMF0pLmhlaWdodCgpIC0gODAwID4gZS5kZXRhaWwpIHtcbiAgICAgICAgICAgICQoJy5zY3JvbGwtbG9ja2VyJykuc2Nyb2xsVG9wKGUuZGV0YWlsKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHNjcm9sbFRvcCA9ICQoJCgnLnNjcm9sbC1sb2NrZXInKS5jaGlsZHJlbigpWzBdKS5oZWlnaHQoKTtcblxuICAgICAgICAgICAgJCgnLnNjcm9sbC1sb2NrZXInKS5hbmltYXRlKHsgc2Nyb2xsVG9wOiBzY3JvbGxUb3AgfSwgMTc1KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZXhlY0luUHJvZ3Jlc3MgPSBmYWxzZTtcbiAgICAgICAgfSwgNzUwKTtcbiAgICAgIH0sIGZhbHNlKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBjb21tb247XG59KHdpbmRvdyk7IiwiJ3VzZSBzdHJpY3QnO1xuXG53aW5kb3cuY29tbW9uID0gZnVuY3Rpb24gKF9yZWYpIHtcbiAgdmFyIF9yZWYkY29tbW9uID0gX3JlZi5jb21tb247XG4gIHZhciBjb21tb24gPSBfcmVmJGNvbW1vbiA9PT0gdW5kZWZpbmVkID8geyBpbml0OiBbXSB9IDogX3JlZiRjb21tb247XG5cbiAgY29tbW9uLmluaXQucHVzaChmdW5jdGlvbiAoJCkge1xuICAgICQoJyNyZXBvcnQtaXNzdWUnKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgdGV4dE1lc3NhZ2UgPSBbJ0NoYWxsZW5nZSBbJywgY29tbW9uLmNoYWxsZW5nZU5hbWUgfHwgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLCAnXSgnLCB3aW5kb3cubG9jYXRpb24uaHJlZiwgJykgaGFzIGFuIGlzc3VlLlxcbicsICdVc2VyIEFnZW50IGlzOiA8Y29kZT4nLCBuYXZpZ2F0b3IudXNlckFnZW50LCAnPC9jb2RlPi5cXG4nLCAnUGxlYXNlIGRlc2NyaWJlIGhvdyB0byByZXByb2R1Y2UgdGhpcyBpc3N1ZSwgYW5kIGluY2x1ZGUgJywgJ2xpbmtzIHRvIHNjcmVlbnNob3RzIGlmIHBvc3NpYmxlLlxcblxcbiddLmpvaW4oJycpO1xuXG4gICAgICBpZiAoY29tbW9uLmVkaXRvciAmJiB0eXBlb2YgY29tbW9uLmVkaXRvci5nZXRWYWx1ZSA9PT0gJ2Z1bmN0aW9uJyAmJiBjb21tb24uZWRpdG9yLmdldFZhbHVlKCkudHJpbSgpKSB7XG4gICAgICAgIHZhciB0eXBlO1xuICAgICAgICBzd2l0Y2ggKGNvbW1vbi5jaGFsbGVuZ2VUeXBlKSB7XG4gICAgICAgICAgY2FzZSBjb21tb24uY2hhbGxlbmdlVHlwZXMuSFRNTDpcbiAgICAgICAgICAgIHR5cGUgPSAnaHRtbCc7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIGNvbW1vbi5jaGFsbGVuZ2VUeXBlcy5KUzpcbiAgICAgICAgICBjYXNlIGNvbW1vbi5jaGFsbGVuZ2VUeXBlcy5CT05GSVJFOlxuICAgICAgICAgICAgdHlwZSA9ICdqYXZhc2NyaXB0JztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0eXBlID0gJyc7XG4gICAgICAgIH1cblxuICAgICAgICB0ZXh0TWVzc2FnZSArPSBbJ015IGNvZGU6XFxuYGBgJywgdHlwZSwgJ1xcbicsIGNvbW1vbi5lZGl0b3IuZ2V0VmFsdWUoKSwgJ1xcbmBgYFxcblxcbiddLmpvaW4oJycpO1xuICAgICAgfVxuXG4gICAgICB0ZXh0TWVzc2FnZSA9IGVuY29kZVVSSUNvbXBvbmVudCh0ZXh0TWVzc2FnZSk7XG5cbiAgICAgICQoJyNpc3N1ZS1tb2RhbCcpLm1vZGFsKCdoaWRlJyk7XG4gICAgICB3aW5kb3cub3BlbignaHR0cHM6Ly9naXRodWIuY29tL2ZyZWVjb2RlY2FtcC9mcmVlY29kZWNhbXAvaXNzdWVzL25ldz8mYm9keT0nICsgdGV4dE1lc3NhZ2UsICdfYmxhbmsnKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgcmV0dXJuIGNvbW1vbjtcbn0od2luZG93KTsiLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxuZnVuY3Rpb24gX29iamVjdFdpdGhvdXRQcm9wZXJ0aWVzKG9iaiwga2V5cykgeyB2YXIgdGFyZ2V0ID0ge307IGZvciAodmFyIGkgaW4gb2JqKSB7IGlmIChrZXlzLmluZGV4T2YoaSkgPj0gMCkgY29udGludWU7IGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgaSkpIGNvbnRpbnVlOyB0YXJnZXRbaV0gPSBvYmpbaV07IH0gcmV0dXJuIHRhcmdldDsgfVxuXG53aW5kb3cuY29tbW9uID0gZnVuY3Rpb24gKGdsb2JhbCkge1xuICB2YXIgT2JzZXJ2YWJsZSA9IGdsb2JhbC5SeC5PYnNlcnZhYmxlO1xuICB2YXIgY2hhaSA9IGdsb2JhbC5jaGFpO1xuICB2YXIgX2dsb2JhbCRjb21tb24gPSBnbG9iYWwuY29tbW9uO1xuICB2YXIgY29tbW9uID0gX2dsb2JhbCRjb21tb24gPT09IHVuZGVmaW5lZCA/IHsgaW5pdDogW10gfSA6IF9nbG9iYWwkY29tbW9uO1xuXG4gIGNvbW1vbi5ydW5UZXN0cyQgPSBmdW5jdGlvbiBydW5UZXN0cyQoX3JlZikge1xuICAgIHZhciBjb2RlID0gX3JlZi5jb2RlO1xuICAgIHZhciBvcmlnaW5hbENvZGUgPSBfcmVmLm9yaWdpbmFsQ29kZTtcbiAgICB2YXIgdXNlclRlc3RzID0gX3JlZi51c2VyVGVzdHM7XG5cbiAgICB2YXIgcmVzdCA9IF9vYmplY3RXaXRob3V0UHJvcGVydGllcyhfcmVmLCBbXCJjb2RlXCIsIFwib3JpZ2luYWxDb2RlXCIsIFwidXNlclRlc3RzXCJdKTtcblxuICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb20odXNlclRlc3RzKS5tYXAoZnVuY3Rpb24gKHRlc3QpIHtcblxuICAgICAgLyogZXNsaW50LWRpc2FibGUgbm8tdW51c2VkLXZhcnMgKi9cbiAgICAgIHZhciBhc3NlcnQgPSBjaGFpLmFzc2VydDtcbiAgICAgIHZhciBlZGl0b3IgPSB7XG4gICAgICAgIGdldFZhbHVlOiBmdW5jdGlvbiBnZXRWYWx1ZSgpIHtcbiAgICAgICAgICByZXR1cm4gb3JpZ2luYWxDb2RlO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgLyogZXNsaW50LWVuYWJsZSBuby11bnVzZWQtdmFycyAqL1xuXG4gICAgICB0cnkge1xuICAgICAgICBpZiAodGVzdCkge1xuICAgICAgICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLWV2YWwgICovXG4gICAgICAgICAgZXZhbChjb21tb24ucmVhc3NlbWJsZVRlc3QoY29kZSwgdGVzdCkpO1xuICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgbm8tZXZhbCAqL1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHRlc3QuZXJyID0gZS5tZXNzYWdlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGVzdDtcbiAgICB9KS50b0FycmF5KCkubWFwKGZ1bmN0aW9uICh0ZXN0cykge1xuICAgICAgcmV0dXJuIF9leHRlbmRzKHt9LCByZXN0LCB7IHRlc3RzOiB0ZXN0cyB9KTtcbiAgICB9KTtcbiAgfTtcblxuICByZXR1cm4gY29tbW9uO1xufSh3aW5kb3cpOyIsIid1c2Ugc3RyaWN0Jztcblxud2luZG93LmNvbW1vbiA9IGZ1bmN0aW9uIChnbG9iYWwpIHtcbiAgdmFyICQgPSBnbG9iYWwuJDtcbiAgdmFyIG1vbWVudCA9IGdsb2JhbC5tb21lbnQ7XG4gIHZhciBfZ2xvYmFsJGdhID0gZ2xvYmFsLmdhO1xuICB2YXIgZ2EgPSBfZ2xvYmFsJGdhID09PSB1bmRlZmluZWQgPyBmdW5jdGlvbiAoKSB7fSA6IF9nbG9iYWwkZ2E7XG4gIHZhciBfZ2xvYmFsJGNvbW1vbiA9IGdsb2JhbC5jb21tb247XG4gIHZhciBjb21tb24gPSBfZ2xvYmFsJGNvbW1vbiA9PT0gdW5kZWZpbmVkID8geyBpbml0OiBbXSB9IDogX2dsb2JhbCRjb21tb247XG5cbiAgY29tbW9uLnNob3dDb21wbGV0aW9uID0gZnVuY3Rpb24gc2hvd0NvbXBsZXRpb24oKSB7XG5cbiAgICBnYSgnc2VuZCcsICdldmVudCcsICdDaGFsbGVuZ2UnLCAnc29sdmVkJywgY29tbW9uLmdhTmFtZSwgdHJ1ZSk7XG5cbiAgICB2YXIgc29sdXRpb24gPSBjb21tb24uZWRpdG9yLmdldFZhbHVlKCk7XG4gICAgdmFyIGRpZENvbXBsZXRlV2l0aCA9ICQoJyNjb21wbGV0ZWQtd2l0aCcpLnZhbCgpIHx8IG51bGw7XG5cbiAgICAkKCcjY29tcGxldGUtY291cnNld2FyZS1kaWFsb2cnKS5tb2RhbCgnc2hvdycpO1xuICAgICQoJyNjb21wbGV0ZS1jb3Vyc2V3YXJlLWRpYWxvZyAubW9kYWwtaGVhZGVyJykuY2xpY2soKTtcblxuICAgICQoJyNzdWJtaXQtY2hhbGxlbmdlJykuY2xpY2soZnVuY3Rpb24gKGUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgJCgnI3N1Ym1pdC1jaGFsbGVuZ2UnKS5hdHRyKCdkaXNhYmxlZCcsICd0cnVlJykucmVtb3ZlQ2xhc3MoJ2J0bi1wcmltYXJ5JykuYWRkQ2xhc3MoJ2J0bi13YXJuaW5nIGRpc2FibGVkJyk7XG5cbiAgICAgIHZhciAkY2hlY2ttYXJrQ29udGFpbmVyID0gJCgnI2NoZWNrbWFyay1jb250YWluZXInKTtcbiAgICAgICRjaGVja21hcmtDb250YWluZXIuY3NzKHsgaGVpZ2h0OiAkY2hlY2ttYXJrQ29udGFpbmVyLmlubmVySGVpZ2h0KCkgfSk7XG5cbiAgICAgICQoJyNjaGFsbGVuZ2UtY2hlY2ttYXJrJykuYWRkQ2xhc3MoJ3pvb21PdXRVcCcpXG4gICAgICAvLyAucmVtb3ZlQ2xhc3MoJ3pvb21JbkRvd24nKVxuICAgICAgLmRlbGF5KDEwMDApLnF1ZXVlKGZ1bmN0aW9uIChuZXh0KSB7XG4gICAgICAgICQodGhpcykucmVwbGFjZVdpdGgoJzxkaXYgaWQ9XCJjaGFsbGVuZ2Utc3Bpbm5lclwiICcgKyAnY2xhc3M9XCJhbmltYXRlZCB6b29tSW5VcCBpbm5lci1jaXJjbGVzLWxvYWRlclwiPicgKyAnc3VibWl0dGluZy4uLjwvZGl2PicpO1xuICAgICAgICBuZXh0KCk7XG4gICAgICB9KTtcblxuICAgICAgdmFyIHRpbWV6b25lID0gJ1VUQyc7XG4gICAgICB0cnkge1xuICAgICAgICB0aW1lem9uZSA9IG1vbWVudC50ei5ndWVzcygpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGVyci5tZXNzYWdlID0gJ1xcbiAgICAgICAgICBrbm93biBidWcsIHNlZTogaHR0cHM6Ly9naXRodWIuY29tL21vbWVudC9tb21lbnQtdGltZXpvbmUvaXNzdWVzLzI5NDpcXG4gICAgICAgICAgJyArIGVyci5tZXNzYWdlICsgJ1xcbiAgICAgICAgJztcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgfVxuICAgICAgdmFyIGRhdGEgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIGlkOiBjb21tb24uY2hhbGxlbmdlSWQsXG4gICAgICAgIG5hbWU6IGNvbW1vbi5jaGFsbGVuZ2VOYW1lLFxuICAgICAgICBjb21wbGV0ZWRXaXRoOiBkaWRDb21wbGV0ZVdpdGgsXG4gICAgICAgIGNoYWxsZW5nZVR5cGU6ICtjb21tb24uY2hhbGxlbmdlVHlwZSxcbiAgICAgICAgc29sdXRpb246IHNvbHV0aW9uLFxuICAgICAgICB0aW1lem9uZTogdGltZXpvbmVcbiAgICAgIH0pO1xuXG4gICAgICAkLmFqYXgoe1xuICAgICAgICB1cmw6ICcvY29tcGxldGVkLWNoYWxsZW5nZS8nLFxuICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICAgIH0pLnN1Y2Nlc3MoZnVuY3Rpb24gKHJlcykge1xuICAgICAgICBpZiAocmVzKSB7XG4gICAgICAgICAgd2luZG93LmxvY2F0aW9uID0gJy9jaGFsbGVuZ2VzL25leHQtY2hhbGxlbmdlP2lkPScgKyBjb21tb24uY2hhbGxlbmdlSWQ7XG4gICAgICAgIH1cbiAgICAgIH0pLmZhaWwoZnVuY3Rpb24gKCkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVwbGFjZSh3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICByZXR1cm4gY29tbW9uO1xufSh3aW5kb3cpOyIsIid1c2Ugc3RyaWN0Jztcblxud2luZG93LmNvbW1vbiA9IGZ1bmN0aW9uIChfcmVmKSB7XG4gIHZhciAkID0gX3JlZi4kO1xuICB2YXIgX3JlZiRjb21tb24gPSBfcmVmLmNvbW1vbjtcbiAgdmFyIGNvbW1vbiA9IF9yZWYkY29tbW9uID09PSB1bmRlZmluZWQgPyB7IGluaXQ6IFtdIH0gOiBfcmVmJGNvbW1vbjtcblxuICB2YXIgc3RlcENsYXNzID0gJy5jaGFsbGVuZ2Utc3RlcCc7XG4gIHZhciBwcmV2QnRuQ2xhc3MgPSAnLmNoYWxsZW5nZS1zdGVwLWJ0bi1wcmV2JztcbiAgdmFyIG5leHRCdG5DbGFzcyA9ICcuY2hhbGxlbmdlLXN0ZXAtYnRuLW5leHQnO1xuICB2YXIgYWN0aW9uQnRuQ2xhc3MgPSAnLmNoYWxsZW5nZS1zdGVwLWJ0bi1hY3Rpb24nO1xuICB2YXIgZmluaXNoQnRuQ2xhc3MgPSAnLmNoYWxsZW5nZS1zdGVwLWJ0bi1maW5pc2gnO1xuICB2YXIgc3VibWl0QnRuSWQgPSAnI2NoYWxsZW5nZS1zdGVwLWJ0bi1zdWJtaXQnO1xuICB2YXIgc3VibWl0TW9kYWxJZCA9ICcjY2hhbGxlbmdlLXN0ZXAtbW9kYWwnO1xuXG4gIGZ1bmN0aW9uIGdldFByZXZpb3VzU3RlcCgkY2hhbGxlbmdlU3RlcHMpIHtcbiAgICB2YXIgJHByZXZTdGVwID0gZmFsc2U7XG4gICAgdmFyIHByZXZTdGVwSW5kZXggPSAwO1xuICAgICRjaGFsbGVuZ2VTdGVwcy5lYWNoKGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgdmFyICRzdGVwID0gJCh0aGlzKTtcbiAgICAgIGlmICghJHN0ZXAuaGFzQ2xhc3MoJ2hpZGRlbicpKSB7XG4gICAgICAgIHByZXZTdGVwSW5kZXggPSBpbmRleCAtIDE7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAkcHJldlN0ZXAgPSAkY2hhbGxlbmdlU3RlcHNbcHJldlN0ZXBJbmRleF07XG5cbiAgICByZXR1cm4gJHByZXZTdGVwO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0TmV4dFN0ZXAoJGNoYWxsZW5nZVN0ZXBzKSB7XG4gICAgdmFyIGxlbmd0aCA9ICRjaGFsbGVuZ2VTdGVwcy5sZW5ndGg7XG4gICAgdmFyICRuZXh0U3RlcCA9IGZhbHNlO1xuICAgIHZhciBuZXh0U3RlcEluZGV4ID0gMDtcbiAgICAkY2hhbGxlbmdlU3RlcHMuZWFjaChmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgIHZhciAkc3RlcCA9ICQodGhpcyk7XG4gICAgICBpZiAoISRzdGVwLmhhc0NsYXNzKCdoaWRkZW4nKSAmJiBpbmRleCArIDEgIT09IGxlbmd0aCkge1xuICAgICAgICBuZXh0U3RlcEluZGV4ID0gaW5kZXggKyAxO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgJG5leHRTdGVwID0gJGNoYWxsZW5nZVN0ZXBzW25leHRTdGVwSW5kZXhdO1xuXG4gICAgcmV0dXJuICRuZXh0U3RlcDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZVByZXZTdGVwQ2xpY2soZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB2YXIgcHJldlN0ZXAgPSBnZXRQcmV2aW91c1N0ZXAoJChzdGVwQ2xhc3MpKTtcbiAgICAkKHRoaXMpLnBhcmVudCgpLnBhcmVudCgpLnJlbW92ZUNsYXNzKCdzbGlkZUluTGVmdCBzbGlkZUluUmlnaHQnKS5hZGRDbGFzcygnYW5pbWF0ZWQgZmFkZU91dFJpZ2h0IGZhc3QtYW5pbWF0aW9uJykuZGVsYXkoMjUwKS5xdWV1ZShmdW5jdGlvbiAocHJldikge1xuICAgICAgJCh0aGlzKS5hZGRDbGFzcygnaGlkZGVuJyk7XG4gICAgICBpZiAocHJldlN0ZXApIHtcbiAgICAgICAgJChwcmV2U3RlcCkucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpLnJlbW92ZUNsYXNzKCdmYWRlT3V0TGVmdCBmYWRlT3V0UmlnaHQnKS5hZGRDbGFzcygnYW5pbWF0ZWQgc2xpZGVJbkxlZnQgZmFzdC1hbmltYXRpb24nKS5kZWxheSg1MDApLnF1ZXVlKGZ1bmN0aW9uIChwcmV2KSB7XG4gICAgICAgICAgcHJldigpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHByZXYoKTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZU5leHRTdGVwQ2xpY2soZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB2YXIgbmV4dFN0ZXAgPSBnZXROZXh0U3RlcCgkKHN0ZXBDbGFzcykpO1xuICAgICQodGhpcykucGFyZW50KCkucGFyZW50KCkucmVtb3ZlQ2xhc3MoJ3NsaWRlSW5SaWdodCBzbGlkZUluTGVmdCcpLmFkZENsYXNzKCdhbmltYXRlZCBmYWRlT3V0TGVmdCBmYXN0LWFuaW1hdGlvbicpLmRlbGF5KDI1MCkucXVldWUoZnVuY3Rpb24gKG5leHQpIHtcbiAgICAgICQodGhpcykuYWRkQ2xhc3MoJ2hpZGRlbicpO1xuICAgICAgaWYgKG5leHRTdGVwKSB7XG4gICAgICAgICQobmV4dFN0ZXApLnJlbW92ZUNsYXNzKCdoaWRkZW4nKS5yZW1vdmVDbGFzcygnZmFkZU91dFJpZ2h0IGZhZGVPdXRMZWZ0JykuYWRkQ2xhc3MoJ2FuaW1hdGVkIHNsaWRlSW5SaWdodCBmYXN0LWFuaW1hdGlvbicpLmRlbGF5KDUwMCkucXVldWUoZnVuY3Rpb24gKG5leHQpIHtcbiAgICAgICAgICBuZXh0KCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgbmV4dCgpO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlQWN0aW9uQ2xpY2soZSkge1xuICAgIHZhciBwcm9wcyA9IGNvbW1vbi5jaGFsbGVuZ2VTZWVkWzBdIHx8IHsgc3RlcEluZGV4OiBbXSB9O1xuXG4gICAgdmFyICRlbCA9ICQodGhpcyk7XG4gICAgdmFyIGluZGV4ID0gKyRlbC5hdHRyKCdpZCcpO1xuICAgIHZhciBwcm9wSW5kZXggPSBwcm9wcy5zdGVwSW5kZXguaW5kZXhPZihpbmRleCk7XG5cbiAgICBpZiAocHJvcEluZGV4ID09PSAtMSkge1xuICAgICAgcmV0dXJuICRlbC5wYXJlbnQoKS5maW5kKCcuZGlzYWJsZWQnKS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcbiAgICB9XG5cbiAgICAvLyBhbiBBUEkgYWN0aW9uXG4gICAgLy8gcHJldmVudCBsaW5rIGZyb20gb3BlbmluZ1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB2YXIgcHJvcCA9IHByb3BzLnByb3BlcnRpZXNbcHJvcEluZGV4XTtcbiAgICB2YXIgYXBpID0gcHJvcHMuYXBpc1twcm9wSW5kZXhdO1xuICAgIGlmIChjb21tb25bcHJvcF0pIHtcbiAgICAgIHJldHVybiAkZWwucGFyZW50KCkuZmluZCgnLmRpc2FibGVkJykucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgfVxuICAgICQucG9zdChhcGkpLmRvbmUoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgIC8vIGFzc3VtZSBhIGJvb2xlYW4gaW5kaWNhdGVzIHBhc3NpbmdcbiAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgIHJldHVybiAkZWwucGFyZW50KCkuZmluZCgnLmRpc2FibGVkJykucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICB9XG4gICAgICAvLyBhc3N1bWUgYXBpIHJldHVybnMgc3RyaW5nIHdoZW4gZmFpbHNcbiAgICAgICRlbC5wYXJlbnQoKS5maW5kKCcuZGlzYWJsZWQnKS5yZXBsYWNlV2l0aCgnPHA+JyArIGRhdGEgKyAnPC9wPicpO1xuICAgIH0pLmZhaWwoZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coJ2ZhaWxlZCcpO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlRmluaXNoQ2xpY2soZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAkKHN1Ym1pdE1vZGFsSWQpLm1vZGFsKCdzaG93Jyk7XG4gICAgJChzdWJtaXRNb2RhbElkICsgJy5tb2RhbC1oZWFkZXInKS5jbGljaygpO1xuICAgICQoc3VibWl0QnRuSWQpLmNsaWNrKGhhbmRsZVN1Ym1pdENsaWNrKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZVN1Ym1pdENsaWNrKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAkKCcjc3VibWl0LWNoYWxsZW5nZScpLmF0dHIoJ2Rpc2FibGVkJywgJ3RydWUnKS5yZW1vdmVDbGFzcygnYnRuLXByaW1hcnknKS5hZGRDbGFzcygnYnRuLXdhcm5pbmcgZGlzYWJsZWQnKTtcblxuICAgIHZhciAkY2hlY2ttYXJrQ29udGFpbmVyID0gJCgnI2NoZWNrbWFyay1jb250YWluZXInKTtcbiAgICAkY2hlY2ttYXJrQ29udGFpbmVyLmNzcyh7IGhlaWdodDogJGNoZWNrbWFya0NvbnRhaW5lci5pbm5lckhlaWdodCgpIH0pO1xuXG4gICAgJCgnI2NoYWxsZW5nZS1jaGVja21hcmsnKS5hZGRDbGFzcygnem9vbU91dFVwJykuZGVsYXkoMTAwMCkucXVldWUoZnVuY3Rpb24gKG5leHQpIHtcbiAgICAgICQodGhpcykucmVwbGFjZVdpdGgoJzxkaXYgaWQ9XCJjaGFsbGVuZ2Utc3Bpbm5lclwiICcgKyAnY2xhc3M9XCJhbmltYXRlZCB6b29tSW5VcCBpbm5lci1jaXJjbGVzLWxvYWRlclwiPicgKyAnc3VibWl0dGluZy4uLjwvZGl2PicpO1xuICAgICAgbmV4dCgpO1xuICAgIH0pO1xuXG4gICAgJC5hamF4KHtcbiAgICAgIHVybDogJy9jb21wbGV0ZWQtY2hhbGxlbmdlLycsXG4gICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIGlkOiBjb21tb24uY2hhbGxlbmdlSWQsXG4gICAgICAgIG5hbWU6IGNvbW1vbi5jaGFsbGVuZ2VOYW1lLFxuICAgICAgICBjaGFsbGVuZ2VUeXBlOiArY29tbW9uLmNoYWxsZW5nZVR5cGVcbiAgICAgIH0pLFxuICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICB9KS5zdWNjZXNzKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgIGlmIChyZXMpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uID0gJy9jaGFsbGVuZ2VzL25leHQtY2hhbGxlbmdlP2lkPScgKyBjb21tb24uY2hhbGxlbmdlSWQ7XG4gICAgICB9XG4gICAgfSkuZmFpbChmdW5jdGlvbiAoKSB7XG4gICAgICB3aW5kb3cubG9jYXRpb24ucmVwbGFjZSh3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gICAgfSk7XG4gIH1cblxuICBjb21tb24uaW5pdC5wdXNoKGZ1bmN0aW9uICgkKSB7XG4gICAgaWYgKGNvbW1vbi5jaGFsbGVuZ2VUeXBlICE9PSAnNycpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgICQocHJldkJ0bkNsYXNzKS5jbGljayhoYW5kbGVQcmV2U3RlcENsaWNrKTtcbiAgICAkKG5leHRCdG5DbGFzcykuY2xpY2soaGFuZGxlTmV4dFN0ZXBDbGljayk7XG4gICAgJChhY3Rpb25CdG5DbGFzcykuY2xpY2soaGFuZGxlQWN0aW9uQ2xpY2spO1xuICAgICQoZmluaXNoQnRuQ2xhc3MpLmNsaWNrKGhhbmRsZUZpbmlzaENsaWNrKTtcbiAgfSk7XG5cbiAgcmV0dXJuIGNvbW1vbjtcbn0od2luZG93KTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbmZ1bmN0aW9uIF9vYmplY3RXaXRob3V0UHJvcGVydGllcyhvYmosIGtleXMpIHsgdmFyIHRhcmdldCA9IHt9OyBmb3IgKHZhciBpIGluIG9iaikgeyBpZiAoa2V5cy5pbmRleE9mKGkpID49IDApIGNvbnRpbnVlOyBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGkpKSBjb250aW51ZTsgdGFyZ2V0W2ldID0gb2JqW2ldOyB9IHJldHVybiB0YXJnZXQ7IH1cblxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24gKCkge1xuICB2YXIgY29tbW9uID0gd2luZG93LmNvbW1vbjtcbiAgdmFyIE9ic2VydmFibGUgPSB3aW5kb3cuUnguT2JzZXJ2YWJsZTtcbiAgdmFyIGFkZExvb3BQcm90ZWN0ID0gY29tbW9uLmFkZExvb3BQcm90ZWN0O1xuICB2YXIgY2hhbGxlbmdlTmFtZSA9IGNvbW1vbi5jaGFsbGVuZ2VOYW1lO1xuICB2YXIgY2hhbGxlbmdlVHlwZSA9IGNvbW1vbi5jaGFsbGVuZ2VUeXBlO1xuICB2YXIgY2hhbGxlbmdlVHlwZXMgPSBjb21tb24uY2hhbGxlbmdlVHlwZXM7XG5cbiAgY29tbW9uLmluaXQuZm9yRWFjaChmdW5jdGlvbiAoaW5pdCkge1xuICAgIGluaXQoJCk7XG4gIH0pO1xuXG4gIC8vIG9ubHkgcnVuIGlmIGVkaXRvciBwcmVzZW50XG4gIGlmIChjb21tb24uZWRpdG9yLmdldFZhbHVlKSB7XG4gICAgdmFyIGNvZGUkID0gY29tbW9uLmVkaXRvcktleVVwJC5kZWJvdW5jZSg3NTApLm1hcChmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gY29tbW9uLmVkaXRvci5nZXRWYWx1ZSgpO1xuICAgIH0pLmRpc3RpbmN0VW50aWxDaGFuZ2VkKCkuc2hhcmVSZXBsYXkoKTtcblxuICAgIC8vIHVwZGF0ZSBzdG9yYWdlXG4gICAgY29kZSQuc3Vic2NyaWJlKGZ1bmN0aW9uIChjb2RlKSB7XG4gICAgICBjb21tb24uY29kZVN0b3JhZ2UudXBkYXRlU3RvcmFnZShjb21tb24uY2hhbGxlbmdlTmFtZSwgY29kZSk7XG4gICAgICBjb21tb24uY29kZVVyaS5xdWVyaWZ5KGNvZGUpO1xuICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIHJldHVybiBjb25zb2xlLmVycm9yKGVycik7XG4gICAgfSk7XG5cbiAgICBjb2RlJFxuICAgIC8vIG9ubHkgcnVuIGZvciBIVE1MXG4gICAgLmZpbHRlcihmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gY29tbW9uLmNoYWxsZW5nZVR5cGUgPT09IGNoYWxsZW5nZVR5cGVzLkhUTUw7XG4gICAgfSkuZmxhdE1hcChmdW5jdGlvbiAoY29kZSkge1xuICAgICAgcmV0dXJuIGNvbW1vbi5kZXRlY3RVbnNhZmVDb2RlJChjb2RlKS5tYXAoZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY29tYmluZWRDb2RlID0gY29tbW9uLmhlYWQgKyBjb2RlICsgY29tbW9uLnRhaWw7XG5cbiAgICAgICAgcmV0dXJuIGFkZExvb3BQcm90ZWN0KGNvbWJpbmVkQ29kZSk7XG4gICAgICB9KS5mbGF0TWFwKGZ1bmN0aW9uIChjb2RlKSB7XG4gICAgICAgIHJldHVybiBjb21tb24udXBkYXRlUHJldmlldyQoY29kZSk7XG4gICAgICB9KS5mbGF0TWFwKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGNvbW1vbi5jaGVja1ByZXZpZXckKHsgY29kZTogY29kZSB9KTtcbiAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuanVzdCh7IGVycjogZXJyIH0pO1xuICAgICAgfSk7XG4gICAgfSkuc3Vic2NyaWJlKGZ1bmN0aW9uIChfcmVmKSB7XG4gICAgICB2YXIgZXJyID0gX3JlZi5lcnI7XG5cbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICByZXR1cm4gY29tbW9uLnVwZGF0ZVByZXZpZXckKCdcXG4gICAgICAgICAgICAgIDxoMT4nICsgZXJyICsgJzwvaDE+XFxuICAgICAgICAgICAgJykuc3Vic2NyaWJlKGZ1bmN0aW9uICgpIHt9KTtcbiAgICAgIH1cbiAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICByZXR1cm4gY29uc29sZS5lcnJvcihlcnIpO1xuICAgIH0pO1xuICB9XG5cbiAgY29tbW9uLnJlc2V0QnRuJC5kb09uTmV4dChmdW5jdGlvbiAoKSB7XG4gICAgY29tbW9uLmVkaXRvci5zZXRWYWx1ZShjb21tb24ucmVwbGFjZVNhZmVUYWdzKGNvbW1vbi5zZWVkKSk7XG4gIH0pLmZsYXRNYXAoZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBjb21tb24uZXhlY3V0ZUNoYWxsZW5nZSQoKS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICByZXR1cm4gT2JzZXJ2YWJsZS5qdXN0KHsgZXJyOiBlcnIgfSk7XG4gICAgfSk7XG4gIH0pLnN1YnNjcmliZShmdW5jdGlvbiAoX3JlZjIpIHtcbiAgICB2YXIgZXJyID0gX3JlZjIuZXJyO1xuICAgIHZhciBvdXRwdXQgPSBfcmVmMi5vdXRwdXQ7XG4gICAgdmFyIG9yaWdpbmFsQ29kZSA9IF9yZWYyLm9yaWdpbmFsQ29kZTtcblxuICAgIGlmIChlcnIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgIHJldHVybiBjb21tb24udXBkYXRlT3V0cHV0RGlzcGxheSgnJyArIGVycik7XG4gICAgfVxuICAgIGNvbW1vbi5jb2RlU3RvcmFnZS51cGRhdGVTdG9yYWdlKGNoYWxsZW5nZU5hbWUsIG9yaWdpbmFsQ29kZSk7XG4gICAgY29tbW9uLmNvZGVVcmkucXVlcmlmeShvcmlnaW5hbENvZGUpO1xuICAgIGNvbW1vbi51cGRhdGVPdXRwdXREaXNwbGF5KG91dHB1dCk7XG4gIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgfVxuICAgIGNvbW1vbi51cGRhdGVPdXRwdXREaXNwbGF5KCcnICsgZXJyKTtcbiAgfSk7XG5cbiAgT2JzZXJ2YWJsZS5tZXJnZShjb21tb24uZWRpdG9yRXhlY3V0ZSQsIGNvbW1vbi5zdWJtaXRCdG4kKS5mbGF0TWFwKGZ1bmN0aW9uICgpIHtcbiAgICBjb21tb24uYXBwZW5kVG9PdXRwdXREaXNwbGF5KCdcXG4vLyB0ZXN0aW5nIGNoYWxsZW5nZS4uLicpO1xuICAgIHJldHVybiBjb21tb24uZXhlY3V0ZUNoYWxsZW5nZSQoKS5tYXAoZnVuY3Rpb24gKF9yZWYzKSB7XG4gICAgICB2YXIgdGVzdHMgPSBfcmVmMy50ZXN0cztcblxuICAgICAgdmFyIHJlc3QgPSBfb2JqZWN0V2l0aG91dFByb3BlcnRpZXMoX3JlZjMsIFsndGVzdHMnXSk7XG5cbiAgICAgIHZhciBzb2x2ZWQgPSB0ZXN0cy5ldmVyeShmdW5jdGlvbiAodGVzdCkge1xuICAgICAgICByZXR1cm4gIXRlc3QuZXJyO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gX2V4dGVuZHMoe30sIHJlc3QsIHsgdGVzdHM6IHRlc3RzLCBzb2x2ZWQ6IHNvbHZlZCB9KTtcbiAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICByZXR1cm4gT2JzZXJ2YWJsZS5qdXN0KHsgZXJyOiBlcnIgfSk7XG4gICAgfSk7XG4gIH0pLnN1YnNjcmliZShmdW5jdGlvbiAoX3JlZjQpIHtcbiAgICB2YXIgZXJyID0gX3JlZjQuZXJyO1xuICAgIHZhciBzb2x2ZWQgPSBfcmVmNC5zb2x2ZWQ7XG4gICAgdmFyIG91dHB1dCA9IF9yZWY0Lm91dHB1dDtcbiAgICB2YXIgdGVzdHMgPSBfcmVmNC50ZXN0cztcblxuICAgIGlmIChlcnIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgIGlmIChjb21tb24uY2hhbGxlbmdlVHlwZSA9PT0gY29tbW9uLmNoYWxsZW5nZVR5cGVzLkhUTUwpIHtcbiAgICAgICAgcmV0dXJuIGNvbW1vbi51cGRhdGVQcmV2aWV3JCgnXFxuICAgICAgICAgICAgICA8aDE+JyArIGVyciArICc8L2gxPlxcbiAgICAgICAgICAgICcpLmZpcnN0KCkuc3Vic2NyaWJlKGZ1bmN0aW9uICgpIHt9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjb21tb24udXBkYXRlT3V0cHV0RGlzcGxheSgnJyArIGVycik7XG4gICAgfVxuICAgIGNvbW1vbi51cGRhdGVPdXRwdXREaXNwbGF5KG91dHB1dCk7XG4gICAgY29tbW9uLmRpc3BsYXlUZXN0UmVzdWx0cyh0ZXN0cyk7XG4gICAgaWYgKHNvbHZlZCkge1xuICAgICAgY29tbW9uLnNob3dDb21wbGV0aW9uKCk7XG4gICAgfVxuICB9LCBmdW5jdGlvbiAoX3JlZjUpIHtcbiAgICB2YXIgZXJyID0gX3JlZjUuZXJyO1xuXG4gICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgIGNvbW1vbi51cGRhdGVPdXRwdXREaXNwbGF5KCcnICsgZXJyKTtcbiAgfSk7XG5cbiAgLy8gaW5pdGlhbCBjaGFsbGVuZ2UgcnVuIHRvIHBvcHVsYXRlIHRlc3RzXG4gIGlmIChjaGFsbGVuZ2VUeXBlID09PSBjaGFsbGVuZ2VUeXBlcy5IVE1MKSB7XG4gICAgdmFyICRwcmV2aWV3ID0gJCgnI3ByZXZpZXcnKTtcbiAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tQ2FsbGJhY2soJHByZXZpZXcucmVhZHksICRwcmV2aWV3KSgpLmRlbGF5KDUwMCkuZmxhdE1hcChmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gY29tbW9uLmV4ZWN1dGVDaGFsbGVuZ2UkKCk7XG4gICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgcmV0dXJuIE9ic2VydmFibGUuanVzdCh7IGVycjogZXJyIH0pO1xuICAgIH0pLnN1YnNjcmliZShmdW5jdGlvbiAoX3JlZjYpIHtcbiAgICAgIHZhciBlcnIgPSBfcmVmNi5lcnI7XG4gICAgICB2YXIgdGVzdHMgPSBfcmVmNi50ZXN0cztcblxuICAgICAgaWYgKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgIGlmIChjb21tb24uY2hhbGxlbmdlVHlwZSA9PT0gY29tbW9uLmNoYWxsZW5nZVR5cGVzLkhUTUwpIHtcbiAgICAgICAgICByZXR1cm4gY29tbW9uLnVwZGF0ZVByZXZpZXckKCdcXG4gICAgICAgICAgICAgICAgPGgxPicgKyBlcnIgKyAnPC9oMT5cXG4gICAgICAgICAgICAgICcpLnN1YnNjcmliZShmdW5jdGlvbiAoKSB7fSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbW1vbi51cGRhdGVPdXRwdXREaXNwbGF5KCcnICsgZXJyKTtcbiAgICAgIH1cbiAgICAgIGNvbW1vbi5kaXNwbGF5VGVzdFJlc3VsdHModGVzdHMpO1xuICAgIH0sIGZ1bmN0aW9uIChfcmVmNykge1xuICAgICAgdmFyIGVyciA9IF9yZWY3LmVycjtcblxuICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgIH0pO1xuICB9XG5cbiAgaWYgKGNoYWxsZW5nZVR5cGUgPT09IGNoYWxsZW5nZVR5cGVzLkJPTkZJUkUgfHwgY2hhbGxlbmdlVHlwZSA9PT0gY2hhbGxlbmdlVHlwZXMuSlMpIHtcbiAgICBPYnNlcnZhYmxlLmp1c3Qoe30pLmRlbGF5KDUwMCkuZmxhdE1hcChmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gY29tbW9uLmV4ZWN1dGVDaGFsbGVuZ2UkKCk7XG4gICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgcmV0dXJuIE9ic2VydmFibGUuanVzdCh7IGVycjogZXJyIH0pO1xuICAgIH0pLnN1YnNjcmliZShmdW5jdGlvbiAoX3JlZjgpIHtcbiAgICAgIHZhciBlcnIgPSBfcmVmOC5lcnI7XG4gICAgICB2YXIgb3JpZ2luYWxDb2RlID0gX3JlZjgub3JpZ2luYWxDb2RlO1xuICAgICAgdmFyIHRlc3RzID0gX3JlZjgudGVzdHM7XG5cbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICByZXR1cm4gY29tbW9uLnVwZGF0ZU91dHB1dERpc3BsYXkoJycgKyBlcnIpO1xuICAgICAgfVxuICAgICAgY29tbW9uLmNvZGVTdG9yYWdlLnVwZGF0ZVN0b3JhZ2UoY2hhbGxlbmdlTmFtZSwgb3JpZ2luYWxDb2RlKTtcbiAgICAgIGNvbW1vbi5kaXNwbGF5VGVzdFJlc3VsdHModGVzdHMpO1xuICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgIGNvbW1vbi51cGRhdGVPdXRwdXREaXNwbGF5KCcnICsgZXJyKTtcbiAgICB9KTtcbiAgfVxufSk7Il0sInNvdXJjZVJvb3QiOiIvY29tbW9uRnJhbWV3b3JrIn0=
