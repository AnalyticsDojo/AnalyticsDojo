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
              challengeType: common.challengeType
            };
            $.post('/completed-challenge/', data).success(function (res) {
              if (!res) {
                return;
              }
              window.location.href = '/challenges/next-challenge?id=' + common.challengeId;
            }).fail(function () {
              window.location.href = '/challenges';
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

            $.post('/completed-zipline-or-basejump/', data).success(function () {
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
      var data = {
        id: common.challengeId,
        name: common.challengeName,
        completedWith: didCompleteWith,
        challengeType: common.challengeType,
        solution: solution,
        timezone: timezone
      };

      $.post('/completed-challenge/', data, function (res) {
        if (res) {
          window.location = '/challenges/next-challenge?id=' + common.challengeId;
        }
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

    $.post('/completed-challenge/', {
      id: common.challengeId,
      name: common.challengeName,
      challengeType: common.challengeType
    }, function (res) {
      if (res) {
        window.location = '/challenges/next-challenge?id=' + common.challengeId;
      }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluaXQuanMiLCJiaW5kaW5ncy5qcyIsImNvZGUtc3RvcmFnZS5qcyIsImNvZGUtdXJpLmpzIiwiYWRkLWxvb3AtcHJvdGVjdC5qcyIsImdldC1pZnJhbWUuanMiLCJ1cGRhdGUtcHJldmlldy5qcyIsImNyZWF0ZS1lZGl0b3IuanMiLCJkZXRlY3QtdW5zYWZlLWNvZGUtc3RyZWFtLmpzIiwiZGlzcGxheS10ZXN0LXJlc3VsdHMuanMiLCJleGVjdXRlLWNoYWxsZW5nZS1zdHJlYW0uanMiLCJvdXRwdXQtZGlzcGxheS5qcyIsInBob25lLXNjcm9sbC1sb2NrLmpzIiwicmVwb3J0LWlzc3VlLmpzIiwicnVuLXRlc3RzLXN0cmVhbS5qcyIsInNob3ctY29tcGxldGlvbi5qcyIsInN0ZXAtY2hhbGxlbmdlLmpzIiwiZW5kLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJjb21tb25GcmFtZXdvcmsuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbndpbmRvdy5jb21tb24gPSBmdW5jdGlvbiAoZ2xvYmFsKSB7XG4gIC8vIGNvbW1vbiBuYW1lc3BhY2VcbiAgLy8gYWxsIGNsYXNzZXMgc2hvdWxkIGJlIHN0b3JlZCBoZXJlXG4gIC8vIGNhbGxlZCBhdCB0aGUgYmVnaW5uaW5nIG9mIGRvbSByZWFkeVxuICB2YXIgX2dsb2JhbCRSeCA9IGdsb2JhbC5SeDtcbiAgdmFyIERpc3Bvc2FibGUgPSBfZ2xvYmFsJFJ4LkRpc3Bvc2FibGU7XG4gIHZhciBPYnNlcnZhYmxlID0gX2dsb2JhbCRSeC5PYnNlcnZhYmxlO1xuICB2YXIgY29uZmlnID0gX2dsb2JhbCRSeC5jb25maWc7XG4gIHZhciBfZ2xvYmFsJGNvbW1vbiA9IGdsb2JhbC5jb21tb247XG4gIHZhciBjb21tb24gPSBfZ2xvYmFsJGNvbW1vbiA9PT0gdW5kZWZpbmVkID8geyBpbml0OiBbXSB9IDogX2dsb2JhbCRjb21tb247XG5cbiAgY29uZmlnLmxvbmdTdGFja1N1cHBvcnQgPSB0cnVlO1xuICBjb21tb24uaGVhZCA9IGNvbW1vbi5oZWFkIHx8IFtdO1xuICBjb21tb24udGFpbCA9IGNvbW1vbi50YWlsIHx8IFtdO1xuICBjb21tb24uc2FsdCA9IE1hdGgucmFuZG9tKCk7XG5cbiAgY29tbW9uLmNoYWxsZW5nZVR5cGVzID0ge1xuICAgIEhUTUw6ICcwJyxcbiAgICBKUzogJzEnLFxuICAgIFZJREVPOiAnMicsXG4gICAgWklQTElORTogJzMnLFxuICAgIEJBU0VKVU1QOiAnNCcsXG4gICAgQk9ORklSRTogJzUnLFxuICAgIEhJS0VTOiAnNicsXG4gICAgU1RFUDogJzcnXG4gIH07XG5cbiAgY29tbW9uLmFycmF5VG9OZXdMaW5lU3RyaW5nID0gZnVuY3Rpb24gYXJyYXlUb05ld0xpbmVTdHJpbmcoc2VlZERhdGEpIHtcbiAgICBzZWVkRGF0YSA9IEFycmF5LmlzQXJyYXkoc2VlZERhdGEpID8gc2VlZERhdGEgOiBbc2VlZERhdGFdO1xuICAgIHJldHVybiBzZWVkRGF0YS5yZWR1Y2UoZnVuY3Rpb24gKHNlZWQsIGxpbmUpIHtcbiAgICAgIHJldHVybiAnJyArIHNlZWQgKyBsaW5lICsgJ1xcbic7XG4gICAgfSwgJycpO1xuICB9O1xuXG4gIGNvbW1vbi5zZWVkID0gY29tbW9uLmFycmF5VG9OZXdMaW5lU3RyaW5nKGNvbW1vbi5jaGFsbGVuZ2VTZWVkKTtcblxuICBjb21tb24ucmVwbGFjZVNjcmlwdFRhZ3MgPSBmdW5jdGlvbiByZXBsYWNlU2NyaXB0VGFncyh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZS5yZXBsYWNlKC88c2NyaXB0Pi9naSwgJ2ZjY3NzJykucmVwbGFjZSgvPFxcL3NjcmlwdD4vZ2ksICdmY2NlcycpO1xuICB9O1xuXG4gIGNvbW1vbi5yZXBsYWNlU2FmZVRhZ3MgPSBmdW5jdGlvbiByZXBsYWNlU2FmZVRhZ3ModmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUucmVwbGFjZSgvZmNjc3MvZ2ksICc8c2NyaXB0PicpLnJlcGxhY2UoL2ZjY2VzL2dpLCAnPC9zY3JpcHQ+Jyk7XG4gIH07XG5cbiAgY29tbW9uLnJlcGxhY2VGb3JtQWN0aW9uQXR0ciA9IGZ1bmN0aW9uIHJlcGxhY2VGb3JtQWN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoLzxmb3JtW14+XSo+LywgZnVuY3Rpb24gKHZhbCkge1xuICAgICAgcmV0dXJuIHZhbC5yZXBsYWNlKC9hY3Rpb24oXFxzKj8pPS8sICdmY2NmYWEkMT0nKTtcbiAgICB9KTtcbiAgfTtcblxuICBjb21tb24ucmVwbGFjZUZjY2ZhYUF0dHIgPSBmdW5jdGlvbiByZXBsYWNlRmNjZmFhQXR0cih2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZS5yZXBsYWNlKC88Zm9ybVtePl0qPi8sIGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgIHJldHVybiB2YWwucmVwbGFjZSgvZmNjZmFhKFxccyo/KT0vLCAnYWN0aW9uJDE9Jyk7XG4gICAgfSk7XG4gIH07XG5cbiAgY29tbW9uLnNjb3BlalF1ZXJ5ID0gZnVuY3Rpb24gc2NvcGVqUXVlcnkoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXCQvZ2ksICdqJCcpLnJlcGxhY2UoL2RvY3VtZW50L2dpLCAnamRvY3VtZW50JykucmVwbGFjZSgvalF1ZXJ5L2dpLCAnampRdWVyeScpO1xuICB9O1xuXG4gIGNvbW1vbi51blNjb3BlSlF1ZXJ5ID0gZnVuY3Rpb24gdW5TY29wZUpRdWVyeShzdHIpIHtcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoL2pcXCQvZ2ksICckJykucmVwbGFjZSgvamRvY3VtZW50L2dpLCAnZG9jdW1lbnQnKS5yZXBsYWNlKC9qalF1ZXJ5L2dpLCAnalF1ZXJ5Jyk7XG4gIH07XG5cbiAgdmFyIGNvbW1lbnRSZWdleCA9IC8oXFwvXFwqW14oXFwqXFwvKV0qXFwqXFwvKXwoWyBcXG5dXFwvXFwvW15cXG5dKikvZztcbiAgY29tbW9uLnJlbW92ZUNvbW1lbnRzID0gZnVuY3Rpb24gcmVtb3ZlQ29tbWVudHMoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKGNvbW1lbnRSZWdleCwgJycpO1xuICB9O1xuXG4gIHZhciBsb2dSZWdleCA9IC8oY29uc29sZVxcLltcXHddK1xccypcXCguKlxcOykvZztcbiAgY29tbW9uLnJlbW92ZUxvZ3MgPSBmdW5jdGlvbiByZW1vdmVMb2dzKHN0cikge1xuICAgIHJldHVybiBzdHIucmVwbGFjZShsb2dSZWdleCwgJycpO1xuICB9O1xuXG4gIGNvbW1vbi5yZWFzc2VtYmxlVGVzdCA9IGZ1bmN0aW9uIHJlYXNzZW1ibGVUZXN0KCkge1xuICAgIHZhciBjb2RlID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gJycgOiBhcmd1bWVudHNbMF07XG4gICAgdmFyIF9yZWYgPSBhcmd1bWVudHNbMV07XG4gICAgdmFyIGxpbmUgPSBfcmVmLmxpbmU7XG4gICAgdmFyIHRleHQgPSBfcmVmLnRleHQ7XG5cbiAgICB2YXIgcmVnZXhwID0gbmV3IFJlZ0V4cCgnLy8nICsgbGluZSArIGNvbW1vbi5zYWx0KTtcbiAgICByZXR1cm4gY29kZS5yZXBsYWNlKHJlZ2V4cCwgdGV4dCk7XG4gIH07XG5cbiAgY29tbW9uLmdldFNjcmlwdENvbnRlbnQkID0gZnVuY3Rpb24gZ2V0U2NyaXB0Q29udGVudCQoc2NyaXB0KSB7XG4gICAgcmV0dXJuIE9ic2VydmFibGUuY3JlYXRlKGZ1bmN0aW9uIChvYnNlcnZlcikge1xuICAgICAgdmFyIGpxWEhSID0gJC5nZXQoc2NyaXB0LCBudWxsLCBudWxsLCAndGV4dCcpLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgb2JzZXJ2ZXIub25OZXh0KGRhdGEpO1xuICAgICAgICBvYnNlcnZlci5vbkNvbXBsZXRlZCgpO1xuICAgICAgfSkuZmFpbChmdW5jdGlvbiAoZSkge1xuICAgICAgICByZXR1cm4gb2JzZXJ2ZXIub25FcnJvcihlKTtcbiAgICAgIH0pLmFsd2F5cyhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBvYnNlcnZlci5vbkNvbXBsZXRlZCgpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBuZXcgRGlzcG9zYWJsZShmdW5jdGlvbiAoKSB7XG4gICAgICAgIGpxWEhSLmFib3J0KCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICB2YXIgb3BlblNjcmlwdCA9IC9cXDxcXHM/c2NyaXB0XFxzP1xcPi9naTtcbiAgdmFyIGNsb3NpbmdTY3JpcHQgPSAvXFw8XFxzP1xcL1xccz9zY3JpcHRcXHM/XFw+L2dpO1xuXG4gIC8vIGRldGVjdHMgaWYgdGhlcmUgaXMgSmF2YVNjcmlwdCBpbiB0aGUgZmlyc3Qgc2NyaXB0IHRhZ1xuICBjb21tb24uaGFzSnMgPSBmdW5jdGlvbiBoYXNKcyhjb2RlKSB7XG4gICAgcmV0dXJuICEhY29tbW9uLmdldEpzRnJvbUh0bWwoY29kZSk7XG4gIH07XG5cbiAgLy8gZ3JhYnMgdGhlIGNvbnRlbnQgZnJvbSB0aGUgZmlyc3Qgc2NyaXB0IHRhZyBpbiB0aGUgY29kZVxuICBjb21tb24uZ2V0SnNGcm9tSHRtbCA9IGZ1bmN0aW9uIGdldEpzRnJvbUh0bWwoY29kZSkge1xuICAgIC8vIGdyYWIgdXNlciBqYXZhU2NyaXB0XG4gICAgcmV0dXJuIChjb2RlLnNwbGl0KG9wZW5TY3JpcHQpWzFdIHx8ICcnKS5zcGxpdChjbG9zaW5nU2NyaXB0KVswXSB8fCAnJztcbiAgfTtcblxuICByZXR1cm4gY29tbW9uO1xufSh3aW5kb3cpOyIsIid1c2Ugc3RyaWN0Jztcblxud2luZG93LmNvbW1vbiA9IGZ1bmN0aW9uIChnbG9iYWwpIHtcbiAgdmFyICQgPSBnbG9iYWwuJDtcbiAgdmFyIE9ic2VydmFibGUgPSBnbG9iYWwuUnguT2JzZXJ2YWJsZTtcbiAgdmFyIF9nbG9iYWwkY29tbW9uID0gZ2xvYmFsLmNvbW1vbjtcbiAgdmFyIGNvbW1vbiA9IF9nbG9iYWwkY29tbW9uID09PSB1bmRlZmluZWQgPyB7IGluaXQ6IFtdIH0gOiBfZ2xvYmFsJGNvbW1vbjtcblxuICBjb21tb24uY3RybEVudGVyQ2xpY2tIYW5kbGVyID0gZnVuY3Rpb24gY3RybEVudGVyQ2xpY2tIYW5kbGVyKGUpIHtcbiAgICAvLyBjdHJsICsgZW50ZXIgb3IgY21kICsgZW50ZXJcbiAgICBpZiAoZS5rZXlDb2RlID09PSAxMyAmJiAoZS5tZXRhS2V5IHx8IGUuY3RybEtleSkpIHtcbiAgICAgICQoJyNjb21wbGV0ZS1jb3Vyc2V3YXJlLWRpYWxvZycpLm9mZigna2V5ZG93bicsIGN0cmxFbnRlckNsaWNrSGFuZGxlcik7XG4gICAgICBpZiAoJCgnI3N1Ym1pdC1jaGFsbGVuZ2UnKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICQoJyNzdWJtaXQtY2hhbGxlbmdlJykuY2xpY2soKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9ICcvY2hhbGxlbmdlcy9uZXh0LWNoYWxsZW5nZT9pZD0nICsgY29tbW9uLmNoYWxsZW5nZUlkO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBjb21tb24uaW5pdC5wdXNoKGZ1bmN0aW9uICgkKSB7XG5cbiAgICB2YXIgJG1hcmdpbkZpeCA9ICQoJy5pbm5lck1hcmdpbkZpeCcpO1xuICAgICRtYXJnaW5GaXguY3NzKCdtaW4taGVpZ2h0JywgJG1hcmdpbkZpeC5oZWlnaHQoKSk7XG5cbiAgICBjb21tb24uc3VibWl0QnRuJCA9IE9ic2VydmFibGUuZnJvbUV2ZW50KCQoJyNzdWJtaXRCdXR0b24nKSwgJ2NsaWNrJyk7XG5cbiAgICBjb21tb24ucmVzZXRCdG4kID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQoJCgnI3Jlc2V0LWJ1dHRvbicpLCAnY2xpY2snKTtcblxuICAgIC8vIGluaXQgbW9kYWwga2V5YmluZGluZ3Mgb24gb3BlblxuICAgICQoJyNjb21wbGV0ZS1jb3Vyc2V3YXJlLWRpYWxvZycpLm9uKCdzaG93bi5icy5tb2RhbCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICQoJyNjb21wbGV0ZS1jb3Vyc2V3YXJlLWRpYWxvZycpLmtleWRvd24oY29tbW9uLmN0cmxFbnRlckNsaWNrSGFuZGxlcik7XG4gICAgfSk7XG5cbiAgICAvLyByZW1vdmUgbW9kYWwga2V5YmluZHMgb24gY2xvc2VcbiAgICAkKCcjY29tcGxldGUtY291cnNld2FyZS1kaWFsb2cnKS5vbignaGlkZGVuLmJzLm1vZGFsJywgZnVuY3Rpb24gKCkge1xuICAgICAgJCgnI2NvbXBsZXRlLWNvdXJzZXdhcmUtZGlhbG9nJykub2ZmKCdrZXlkb3duJywgY29tbW9uLmN0cmxFbnRlckNsaWNrSGFuZGxlcik7XG4gICAgfSk7XG5cbiAgICAvLyB2aWRlbyBjaGVja2xpc3QgYmluZGluZ1xuICAgICQoJy5jaGFsbGVuZ2UtbGlzdC1jaGVja2JveCcpLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgY2hlY2tib3hJZCA9ICQodGhpcykucGFyZW50KCkucGFyZW50KCkuYXR0cignaWQnKTtcbiAgICAgIGlmICgkKHRoaXMpLmlzKCc6Y2hlY2tlZCcpKSB7XG4gICAgICAgICQodGhpcykucGFyZW50KCkuc2libGluZ3MoKS5jaGlsZHJlbigpLmFkZENsYXNzKCdmYWRlZCcpO1xuICAgICAgICBpZiAoIWxvY2FsU3RvcmFnZSB8fCAhbG9jYWxTdG9yYWdlW2NoZWNrYm94SWRdKSB7XG4gICAgICAgICAgbG9jYWxTdG9yYWdlW2NoZWNrYm94SWRdID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoISQodGhpcykuaXMoJzpjaGVja2VkJykpIHtcbiAgICAgICAgJCh0aGlzKS5wYXJlbnQoKS5zaWJsaW5ncygpLmNoaWxkcmVuKCkucmVtb3ZlQ2xhc3MoJ2ZhZGVkJyk7XG4gICAgICAgIGlmIChsb2NhbFN0b3JhZ2VbY2hlY2tib3hJZF0pIHtcbiAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShjaGVja2JveElkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgJCgnLmNoZWNrbGlzdC1lbGVtZW50JykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgY2hlY2tsaXN0RWxlbWVudElkID0gJCh0aGlzKS5hdHRyKCdpZCcpO1xuICAgICAgaWYgKGxvY2FsU3RvcmFnZVtjaGVja2xpc3RFbGVtZW50SWRdKSB7XG4gICAgICAgICQodGhpcykuY2hpbGRyZW4oKS5jaGlsZHJlbignbGknKS5hZGRDbGFzcygnZmFkZWQnKTtcbiAgICAgICAgJCh0aGlzKS5jaGlsZHJlbigpLmNoaWxkcmVuKCdpbnB1dCcpLnRyaWdnZXIoJ2NsaWNrJyk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyB2aWRlbyBjaGFsbGVuZ2Ugc3VibWl0XG4gICAgJCgnI25leHQtY291cnNld2FyZS1idXR0b24nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcjbmV4dC1jb3Vyc2V3YXJlLWJ1dHRvbicpLnVuYmluZCgnY2xpY2snKTtcbiAgICAgIGlmICgkKCcuc2lnbnVwLWJ0bi1uYXYnKS5sZW5ndGggPCAxKSB7XG4gICAgICAgIHZhciBkYXRhO1xuICAgICAgICB2YXIgc29sdXRpb24gPSAkKCcjcHVibGljLXVybCcpLnZhbCgpIHx8IG51bGw7XG4gICAgICAgIHZhciBnaXRodWJMaW5rID0gJCgnI2dpdGh1Yi11cmwnKS52YWwoKSB8fCBudWxsO1xuICAgICAgICBzd2l0Y2ggKGNvbW1vbi5jaGFsbGVuZ2VUeXBlKSB7XG4gICAgICAgICAgY2FzZSBjb21tb24uY2hhbGxlbmdlVHlwZXMuVklERU86XG4gICAgICAgICAgICBkYXRhID0ge1xuICAgICAgICAgICAgICBpZDogY29tbW9uLmNoYWxsZW5nZUlkLFxuICAgICAgICAgICAgICBuYW1lOiBjb21tb24uY2hhbGxlbmdlTmFtZSxcbiAgICAgICAgICAgICAgY2hhbGxlbmdlVHlwZTogY29tbW9uLmNoYWxsZW5nZVR5cGVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAkLnBvc3QoJy9jb21wbGV0ZWQtY2hhbGxlbmdlLycsIGRhdGEpLnN1Y2Nlc3MoZnVuY3Rpb24gKHJlcykge1xuICAgICAgICAgICAgICBpZiAoIXJlcykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9ICcvY2hhbGxlbmdlcy9uZXh0LWNoYWxsZW5nZT9pZD0nICsgY29tbW9uLmNoYWxsZW5nZUlkO1xuICAgICAgICAgICAgfSkuZmFpbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gJy9jaGFsbGVuZ2VzJztcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIGNvbW1vbi5jaGFsbGVuZ2VUeXBlcy5CQVNFSlVNUDpcbiAgICAgICAgICBjYXNlIGNvbW1vbi5jaGFsbGVuZ2VUeXBlcy5aSVBMSU5FOlxuICAgICAgICAgICAgZGF0YSA9IHtcbiAgICAgICAgICAgICAgaWQ6IGNvbW1vbi5jaGFsbGVuZ2VJZCxcbiAgICAgICAgICAgICAgbmFtZTogY29tbW9uLmNoYWxsZW5nZU5hbWUsXG4gICAgICAgICAgICAgIGNoYWxsZW5nZVR5cGU6ICtjb21tb24uY2hhbGxlbmdlVHlwZSxcbiAgICAgICAgICAgICAgc29sdXRpb246IHNvbHV0aW9uLFxuICAgICAgICAgICAgICBnaXRodWJMaW5rOiBnaXRodWJMaW5rXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAkLnBvc3QoJy9jb21wbGV0ZWQtemlwbGluZS1vci1iYXNlanVtcC8nLCBkYXRhKS5zdWNjZXNzKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSAnL2NoYWxsZW5nZXMvbmV4dC1jaGFsbGVuZ2U/aWQ9JyArIGNvbW1vbi5jaGFsbGVuZ2VJZDtcbiAgICAgICAgICAgIH0pLmZhaWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVwbGFjZSh3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBjb21tb24uY2hhbGxlbmdlVHlwZXMuQk9ORklSRTpcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gJy9jaGFsbGVuZ2VzL25leHQtY2hhbGxlbmdlP2lkPScgKyBjb21tb24uY2hhbGxlbmdlSWQ7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnSGFwcHkgQ29kaW5nIScpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChjb21tb24uY2hhbGxlbmdlTmFtZSkge1xuICAgICAgd2luZG93LmdhKCdzZW5kJywgJ2V2ZW50JywgJ0NoYWxsZW5nZScsICdsb2FkJywgY29tbW9uLmdhTmFtZSk7XG4gICAgfVxuXG4gICAgJCgnI2NvbXBsZXRlLWNvdXJzZXdhcmUtZGlhbG9nJykub24oJ2hpZGRlbi5icy5tb2RhbCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChjb21tb24uZWRpdG9yLmZvY3VzKSB7XG4gICAgICAgIGNvbW1vbi5lZGl0b3IuZm9jdXMoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgICQoJyN0cmlnZ2VyLWlzc3VlLW1vZGFsJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgJCgnI2lzc3VlLW1vZGFsJykubW9kYWwoJ3Nob3cnKTtcbiAgICB9KTtcblxuICAgICQoJyN0cmlnZ2VyLWhlbHAtbW9kYWwnKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcjaGVscC1tb2RhbCcpLm1vZGFsKCdzaG93Jyk7XG4gICAgfSk7XG5cbiAgICAkKCcjdHJpZ2dlci1yZXNldC1tb2RhbCcpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICQoJyNyZXNldC1tb2RhbCcpLm1vZGFsKCdzaG93Jyk7XG4gICAgfSk7XG5cbiAgICAkKCcjdHJpZ2dlci1wYWlyLW1vZGFsJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgJCgnI3BhaXItbW9kYWwnKS5tb2RhbCgnc2hvdycpO1xuICAgIH0pO1xuXG4gICAgJCgnI2NvbXBsZXRlZC1jb3Vyc2V3YXJlJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgJCgnI2NvbXBsZXRlLWNvdXJzZXdhcmUtZGlhbG9nJykubW9kYWwoJ3Nob3cnKTtcbiAgICB9KTtcblxuICAgICQoJyNoZWxwLWl2ZS1mb3VuZC1hLWJ1Zy13aWtpLWFydGljbGUnKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICB3aW5kb3cub3BlbignaHR0cHM6Ly9naXRodWIuY29tL0ZyZWVDb2RlQ2FtcC9GcmVlQ29kZUNhbXAvd2lraS8nICsgXCJIZWxwLUkndmUtRm91bmQtYS1CdWdcIiwgJ19ibGFuaycpO1xuICAgIH0pO1xuXG4gICAgJCgnI3NlYXJjaC1pc3N1ZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBxdWVyeUlzc3VlID0gd2luZG93LmxvY2F0aW9uLmhyZWYudG9TdHJpbmcoKS5zcGxpdCgnPycpWzBdLnJlcGxhY2UoLygjKikkLywgJycpO1xuICAgICAgd2luZG93Lm9wZW4oJ2h0dHBzOi8vZ2l0aHViLmNvbS9GcmVlQ29kZUNhbXAvRnJlZUNvZGVDYW1wL2lzc3Vlcz9xPScgKyAnaXM6aXNzdWUgaXM6YWxsICcgKyBjb21tb24uY2hhbGxlbmdlTmFtZSArICcgT1IgJyArIHF1ZXJ5SXNzdWUuc3Vic3RyKHF1ZXJ5SXNzdWUubGFzdEluZGV4T2YoJ2NoYWxsZW5nZXMvJykgKyAxMSkucmVwbGFjZSgnLycsICcnKSwgJ19ibGFuaycpO1xuICAgIH0pO1xuICB9KTtcblxuICByZXR1cm4gY29tbW9uO1xufSh3aW5kb3cpOyIsIid1c2Ugc3RyaWN0JztcblxuLy8gZGVwZW5kcyBvbjogY29kZVVyaVxud2luZG93LmNvbW1vbiA9IGZ1bmN0aW9uIChnbG9iYWwpIHtcbiAgdmFyIGxvY2FsU3RvcmFnZSA9IGdsb2JhbC5sb2NhbFN0b3JhZ2U7XG4gIHZhciBfZ2xvYmFsJGNvbW1vbiA9IGdsb2JhbC5jb21tb247XG4gIHZhciBjb21tb24gPSBfZ2xvYmFsJGNvbW1vbiA9PT0gdW5kZWZpbmVkID8geyBpbml0OiBbXSB9IDogX2dsb2JhbCRjb21tb247XG5cbiAgdmFyIGNoYWxsZW5nZVByZWZpeCA9IFsnQm9uZmlyZTogJywgJ1dheXBvaW50OiAnLCAnWmlwbGluZTogJywgJ0Jhc2VqdW1wOiAnLCAnQ2hlY2twb2ludDogJ10sXG4gICAgICBpdGVtO1xuXG4gIHZhciBjb2RlU3RvcmFnZSA9IHtcbiAgICBnZXRTdG9yZWRWYWx1ZTogZnVuY3Rpb24gZ2V0U3RvcmVkVmFsdWUoa2V5KSB7XG4gICAgICBpZiAoIWxvY2FsU3RvcmFnZSB8fCB0eXBlb2YgbG9jYWxTdG9yYWdlLmdldEl0ZW0gIT09ICdmdW5jdGlvbicgfHwgIWtleSB8fCB0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJykge1xuICAgICAgICBjb25zb2xlLmxvZygndW5hYmxlIHRvIHJlYWQgZnJvbSBzdG9yYWdlJyk7XG4gICAgICAgIHJldHVybiAnJztcbiAgICAgIH1cbiAgICAgIGlmIChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkgKyAnVmFsJykpIHtcbiAgICAgICAgcmV0dXJuICcnICsgbG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5ICsgJ1ZhbCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gY2hhbGxlbmdlUHJlZml4Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaXRlbSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKGNoYWxsZW5nZVByZWZpeFtpXSArIGtleSArICdWYWwnKTtcbiAgICAgICAgICBpZiAoaXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuICcnICsgaXRlbTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgaXNBbGl2ZTogZnVuY3Rpb24gaXNBbGl2ZShrZXkpIHtcbiAgICAgIHZhciB2YWwgPSB0aGlzLmdldFN0b3JlZFZhbHVlKGtleSk7XG4gICAgICByZXR1cm4gdmFsICE9PSAnbnVsbCcgJiYgdmFsICE9PSAndW5kZWZpbmVkJyAmJiB2YWwgJiYgdmFsLmxlbmd0aCA+IDA7XG4gICAgfSxcblxuICAgIHVwZGF0ZVN0b3JhZ2U6IGZ1bmN0aW9uIHVwZGF0ZVN0b3JhZ2Uoa2V5LCBjb2RlKSB7XG4gICAgICBpZiAoIWxvY2FsU3RvcmFnZSB8fCB0eXBlb2YgbG9jYWxTdG9yYWdlLnNldEl0ZW0gIT09ICdmdW5jdGlvbicgfHwgIWtleSB8fCB0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJykge1xuICAgICAgICBjb25zb2xlLmxvZygndW5hYmxlIHRvIHNhdmUgdG8gc3RvcmFnZScpO1xuICAgICAgICByZXR1cm4gY29kZTtcbiAgICAgIH1cbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSArICdWYWwnLCBjb2RlKTtcbiAgICAgIHJldHVybiBjb2RlO1xuICAgIH1cbiAgfTtcblxuICBjb21tb24uY29kZVN0b3JhZ2UgPSBjb2RlU3RvcmFnZTtcblxuICByZXR1cm4gY29tbW9uO1xufSh3aW5kb3csIHdpbmRvdy5jb21tb24pOyIsIid1c2Ugc3RyaWN0JztcblxuLy8gc3RvcmUgY29kZSBpbiB0aGUgVVJMXG53aW5kb3cuY29tbW9uID0gZnVuY3Rpb24gKGdsb2JhbCkge1xuICB2YXIgX2VuY29kZSA9IGdsb2JhbC5lbmNvZGVVUklDb21wb25lbnQ7XG4gIHZhciBfZGVjb2RlID0gZ2xvYmFsLmRlY29kZVVSSUNvbXBvbmVudDtcbiAgdmFyIGxvY2F0aW9uID0gZ2xvYmFsLmxvY2F0aW9uO1xuICB2YXIgaGlzdG9yeSA9IGdsb2JhbC5oaXN0b3J5O1xuICB2YXIgX2dsb2JhbCRjb21tb24gPSBnbG9iYWwuY29tbW9uO1xuICB2YXIgY29tbW9uID0gX2dsb2JhbCRjb21tb24gPT09IHVuZGVmaW5lZCA/IHsgaW5pdDogW10gfSA6IF9nbG9iYWwkY29tbW9uO1xuICB2YXIgcmVwbGFjZVNjcmlwdFRhZ3MgPSBjb21tb24ucmVwbGFjZVNjcmlwdFRhZ3M7XG4gIHZhciByZXBsYWNlU2FmZVRhZ3MgPSBjb21tb24ucmVwbGFjZVNhZmVUYWdzO1xuICB2YXIgcmVwbGFjZUZvcm1BY3Rpb25BdHRyID0gY29tbW9uLnJlcGxhY2VGb3JtQWN0aW9uQXR0cjtcbiAgdmFyIHJlcGxhY2VGY2NmYWFBdHRyID0gY29tbW9uLnJlcGxhY2VGY2NmYWFBdHRyO1xuXG4gIHZhciBxdWVyeVJlZ2V4ID0gL14oXFw/fCNcXD8pLztcbiAgZnVuY3Rpb24gZW5jb2RlRmNjKHZhbCkge1xuICAgIHJldHVybiByZXBsYWNlU2NyaXB0VGFncyhyZXBsYWNlRm9ybUFjdGlvbkF0dHIodmFsKSk7XG4gIH1cblxuICBmdW5jdGlvbiBkZWNvZGVGY2ModmFsKSB7XG4gICAgcmV0dXJuIHJlcGxhY2VTYWZlVGFncyhyZXBsYWNlRmNjZmFhQXR0cih2YWwpKTtcbiAgfVxuXG4gIHZhciBjb2RlVXJpID0ge1xuICAgIGVuY29kZTogZnVuY3Rpb24gZW5jb2RlKGNvZGUpIHtcbiAgICAgIHJldHVybiBfZW5jb2RlKGNvZGUpO1xuICAgIH0sXG4gICAgZGVjb2RlOiBmdW5jdGlvbiBkZWNvZGUoY29kZSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIF9kZWNvZGUoY29kZSk7XG4gICAgICB9IGNhdGNoIChpZ25vcmUpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfSxcbiAgICBpc0luUXVlcnk6IGZ1bmN0aW9uIGlzSW5RdWVyeShxdWVyeSkge1xuICAgICAgdmFyIGRlY29kZWQgPSBjb2RlVXJpLmRlY29kZShxdWVyeSk7XG4gICAgICBpZiAoIWRlY29kZWQgfHwgdHlwZW9mIGRlY29kZWQuc3BsaXQgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRlY29kZWQucmVwbGFjZShxdWVyeVJlZ2V4LCAnJykuc3BsaXQoJyYnKS5yZWR1Y2UoZnVuY3Rpb24gKGZvdW5kLCBwYXJhbSkge1xuICAgICAgICB2YXIga2V5ID0gcGFyYW0uc3BsaXQoJz0nKVswXTtcbiAgICAgICAgaWYgKGtleSA9PT0gJ3NvbHV0aW9uJykge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmb3VuZDtcbiAgICAgIH0sIGZhbHNlKTtcbiAgICB9LFxuICAgIGlzQWxpdmU6IGZ1bmN0aW9uIGlzQWxpdmUoKSB7XG4gICAgICByZXR1cm4gY29kZVVyaS5lbmFibGVkICYmIGNvZGVVcmkuaXNJblF1ZXJ5KGxvY2F0aW9uLnNlYXJjaCkgfHwgY29kZVVyaS5pc0luUXVlcnkobG9jYXRpb24uaGFzaCk7XG4gICAgfSxcbiAgICBnZXRLZXlJblF1ZXJ5OiBmdW5jdGlvbiBnZXRLZXlJblF1ZXJ5KHF1ZXJ5KSB7XG4gICAgICB2YXIga2V5VG9GaW5kID0gYXJndW1lbnRzLmxlbmd0aCA8PSAxIHx8IGFyZ3VtZW50c1sxXSA9PT0gdW5kZWZpbmVkID8gJycgOiBhcmd1bWVudHNbMV07XG5cbiAgICAgIHJldHVybiBxdWVyeS5zcGxpdCgnJicpLnJlZHVjZShmdW5jdGlvbiAob2xkVmFsdWUsIHBhcmFtKSB7XG4gICAgICAgIHZhciBrZXkgPSBwYXJhbS5zcGxpdCgnPScpWzBdO1xuICAgICAgICB2YXIgdmFsdWUgPSBwYXJhbS5zcGxpdCgnPScpLnNsaWNlKDEpLmpvaW4oJz0nKTtcblxuICAgICAgICBpZiAoa2V5ID09PSBrZXlUb0ZpbmQpIHtcbiAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG9sZFZhbHVlO1xuICAgICAgfSwgbnVsbCk7XG4gICAgfSxcbiAgICBnZXRTb2x1dGlvbkZyb21RdWVyeTogZnVuY3Rpb24gZ2V0U29sdXRpb25Gcm9tUXVlcnkoKSB7XG4gICAgICB2YXIgcXVlcnkgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyAnJyA6IGFyZ3VtZW50c1swXTtcblxuICAgICAgcmV0dXJuIGRlY29kZUZjYyhjb2RlVXJpLmRlY29kZShjb2RlVXJpLmdldEtleUluUXVlcnkocXVlcnksICdzb2x1dGlvbicpKSk7XG4gICAgfSxcblxuICAgIHBhcnNlOiBmdW5jdGlvbiBwYXJzZSgpIHtcbiAgICAgIGlmICghY29kZVVyaS5lbmFibGVkKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgdmFyIHF1ZXJ5O1xuICAgICAgaWYgKGxvY2F0aW9uLnNlYXJjaCAmJiBjb2RlVXJpLmlzSW5RdWVyeShsb2NhdGlvbi5zZWFyY2gpKSB7XG4gICAgICAgIHF1ZXJ5ID0gbG9jYXRpb24uc2VhcmNoLnJlcGxhY2UoL15cXD8vLCAnJyk7XG5cbiAgICAgICAgaWYgKGhpc3RvcnkgJiYgdHlwZW9mIGhpc3RvcnkucmVwbGFjZVN0YXRlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgaGlzdG9yeS5yZXBsYWNlU3RhdGUoaGlzdG9yeS5zdGF0ZSwgbnVsbCwgbG9jYXRpb24uaHJlZi5zcGxpdCgnPycpWzBdKTtcbiAgICAgICAgICBsb2NhdGlvbi5oYXNoID0gJyM/JyArIGVuY29kZUZjYyhxdWVyeSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXJ5ID0gbG9jYXRpb24uaGFzaC5yZXBsYWNlKC9eXFwjXFw/LywgJycpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXF1ZXJ5KSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5nZXRTb2x1dGlvbkZyb21RdWVyeShxdWVyeSk7XG4gICAgfSxcbiAgICBxdWVyaWZ5OiBmdW5jdGlvbiBxdWVyaWZ5KHNvbHV0aW9uKSB7XG4gICAgICBpZiAoIWNvZGVVcmkuZW5hYmxlZCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIGlmIChoaXN0b3J5ICYmIHR5cGVvZiBoaXN0b3J5LnJlcGxhY2VTdGF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBncmFiIHRoZSB1cmwgdXAgdG8gdGhlIHF1ZXJ5XG4gICAgICAgIC8vIGRlc3Ryb3kgYW55IGhhc2ggc3ltYm9scyBzdGlsbCBjbGluZ2luZyB0byBsaWZlXG4gICAgICAgIHZhciB1cmwgPSBsb2NhdGlvbi5ocmVmLnNwbGl0KCc/JylbMF0ucmVwbGFjZSgvKCMqKSQvLCAnJyk7XG4gICAgICAgIGhpc3RvcnkucmVwbGFjZVN0YXRlKGhpc3Rvcnkuc3RhdGUsIG51bGwsIHVybCArICcjPycgKyAoY29kZVVyaS5zaG91bGRSdW4oKSA/ICcnIDogJ3J1bj1kaXNhYmxlZCYnKSArICdzb2x1dGlvbj0nICsgY29kZVVyaS5lbmNvZGUoZW5jb2RlRmNjKHNvbHV0aW9uKSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbG9jYXRpb24uaGFzaCA9ICc/c29sdXRpb249JyArIGNvZGVVcmkuZW5jb2RlKGVuY29kZUZjYyhzb2x1dGlvbikpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc29sdXRpb247XG4gICAgfSxcbiAgICBlbmFibGVkOiB0cnVlLFxuICAgIHNob3VsZFJ1bjogZnVuY3Rpb24gc2hvdWxkUnVuKCkge1xuICAgICAgcmV0dXJuICF0aGlzLmdldEtleUluUXVlcnkoKGxvY2F0aW9uLnNlYXJjaCB8fCBsb2NhdGlvbi5oYXNoKS5yZXBsYWNlKHF1ZXJ5UmVnZXgsICcnKSwgJ3J1bicpO1xuICAgIH1cbiAgfTtcblxuICBjb21tb24uaW5pdC5wdXNoKGZ1bmN0aW9uICgpIHtcbiAgICBjb2RlVXJpLnBhcnNlKCk7XG4gIH0pO1xuXG4gIGNvbW1vbi5jb2RlVXJpID0gY29kZVVyaTtcbiAgY29tbW9uLnNob3VsZFJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gY29kZVVyaS5zaG91bGRSdW4oKTtcbiAgfTtcblxuICByZXR1cm4gY29tbW9uO1xufSh3aW5kb3cpOyIsIid1c2Ugc3RyaWN0Jztcblxud2luZG93LmNvbW1vbiA9IGZ1bmN0aW9uIChnbG9iYWwpIHtcbiAgdmFyIGxvb3BQcm90ZWN0ID0gZ2xvYmFsLmxvb3BQcm90ZWN0O1xuICB2YXIgX2dsb2JhbCRjb21tb24gPSBnbG9iYWwuY29tbW9uO1xuICB2YXIgY29tbW9uID0gX2dsb2JhbCRjb21tb24gPT09IHVuZGVmaW5lZCA/IHsgaW5pdDogW10gfSA6IF9nbG9iYWwkY29tbW9uO1xuXG4gIGxvb3BQcm90ZWN0LmhpdCA9IGZ1bmN0aW9uIGhpdChsaW5lKSB7XG4gICAgdmFyIGVyciA9ICdFcnJvcjogRXhpdGluZyBwb3RlbnRpYWwgaW5maW5pdGUgbG9vcCBhdCBsaW5lICcgKyBsaW5lICsgJy4gVG8gZGlzYWJsZSBsb29wIHByb3RlY3Rpb24sIHdyaXRlOiBcXG5cXFxcL1xcXFwvIG5vcHJvdGVjdFxcbmFzIHRoZSBmaXJzdCcgKyAnbGluZS4gQmV3YXJlIHRoYXQgaWYgeW91IGRvIGhhdmUgYW4gaW5maW5pdGUgbG9vcCBpbiB5b3VyIGNvZGUnICsgJ3RoaXMgd2lsbCBjcmFzaCB5b3VyIGJyb3dzZXIuJztcbiAgICBjb25zb2xlLmVycm9yKGVycik7XG4gIH07XG5cbiAgY29tbW9uLmFkZExvb3BQcm90ZWN0ID0gZnVuY3Rpb24gYWRkTG9vcFByb3RlY3QoKSB7XG4gICAgdmFyIGNvZGUgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyAnJyA6IGFyZ3VtZW50c1swXTtcblxuICAgIHJldHVybiBsb29wUHJvdGVjdChjb2RlKTtcbiAgfTtcblxuICByZXR1cm4gY29tbW9uO1xufSh3aW5kb3cpOyIsIid1c2Ugc3RyaWN0Jztcblxud2luZG93LmNvbW1vbiA9IGZ1bmN0aW9uIChnbG9iYWwpIHtcbiAgdmFyIF9nbG9iYWwkY29tbW9uID0gZ2xvYmFsLmNvbW1vbjtcbiAgdmFyIGNvbW1vbiA9IF9nbG9iYWwkY29tbW9uID09PSB1bmRlZmluZWQgPyB7IGluaXQ6IFtdIH0gOiBfZ2xvYmFsJGNvbW1vbjtcbiAgdmFyIGRvYyA9IGdsb2JhbC5kb2N1bWVudDtcblxuICBjb21tb24uZ2V0SWZyYW1lID0gZnVuY3Rpb24gZ2V0SWZyYW1lKCkge1xuICAgIHZhciBpZCA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/ICdwcmV2aWV3JyA6IGFyZ3VtZW50c1swXTtcblxuICAgIHZhciBwcmV2aWV3RnJhbWUgPSBkb2MuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuXG4gICAgLy8gY3JlYXRlIGFuZCBhcHBlbmQgYSBoaWRkZW4gcHJldmlldyBmcmFtZVxuICAgIGlmICghcHJldmlld0ZyYW1lKSB7XG4gICAgICBwcmV2aWV3RnJhbWUgPSBkb2MuY3JlYXRlRWxlbWVudCgnaWZyYW1lJyk7XG4gICAgICBwcmV2aWV3RnJhbWUuaWQgPSBpZDtcbiAgICAgIHByZXZpZXdGcmFtZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgJ2Rpc3BsYXk6IG5vbmUnKTtcbiAgICAgIGRvYy5ib2R5LmFwcGVuZENoaWxkKHByZXZpZXdGcmFtZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByZXZpZXdGcmFtZS5jb250ZW50RG9jdW1lbnQgfHwgcHJldmlld0ZyYW1lLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQ7XG4gIH07XG5cbiAgcmV0dXJuIGNvbW1vbjtcbn0od2luZG93KTsiLCIndXNlIHN0cmljdCc7XG5cbndpbmRvdy5jb21tb24gPSBmdW5jdGlvbiAoZ2xvYmFsKSB7XG4gIHZhciBfZ2xvYmFsJFJ4ID0gZ2xvYmFsLlJ4O1xuICB2YXIgQmVoYXZpb3JTdWJqZWN0ID0gX2dsb2JhbCRSeC5CZWhhdmlvclN1YmplY3Q7XG4gIHZhciBPYnNlcnZhYmxlID0gX2dsb2JhbCRSeC5PYnNlcnZhYmxlO1xuICB2YXIgX2dsb2JhbCRjb21tb24gPSBnbG9iYWwuY29tbW9uO1xuICB2YXIgY29tbW9uID0gX2dsb2JhbCRjb21tb24gPT09IHVuZGVmaW5lZCA/IHsgaW5pdDogW10gfSA6IF9nbG9iYWwkY29tbW9uO1xuXG4gIC8vIHRoZSBmaXJzdCBzY3JpcHQgdGFnIGhlcmUgaXMgdG8gcHJveHkgalF1ZXJ5XG4gIC8vIFdlIHVzZSB0aGUgc2FtZSBqUXVlcnkgb24gdGhlIG1haW4gd2luZG93IGJ1dCB3ZSBjaGFuZ2UgdGhlXG4gIC8vIGNvbnRleHQgdG8gdGhhdCBvZiB0aGUgaWZyYW1lLlxuXG4gIHZhciBsaWJyYXJ5SW5jbHVkZXMgPSAnXFxuPHNjcmlwdD5cXG4gIHdpbmRvdy5sb29wUHJvdGVjdCA9IHBhcmVudC5sb29wUHJvdGVjdDtcXG4gIHdpbmRvdy5fX2VyciA9IG51bGw7XFxuICB3aW5kb3cubG9vcFByb3RlY3QuaGl0ID0gZnVuY3Rpb24obGluZSkge1xcbiAgICB3aW5kb3cuX19lcnIgPSBuZXcgRXJyb3IoXFxuICAgICAgXFwnUG90ZW50aWFsIGluZmluaXRlIGxvb3AgYXQgbGluZSBcXCcgK1xcbiAgICAgIGxpbmUgK1xcbiAgICAgIFxcJy4gVG8gZGlzYWJsZSBsb29wIHByb3RlY3Rpb24sIHdyaXRlOlxcJyArXFxuICAgICAgXFwnIFxcXFxuXFxcXC9cXFxcLyBub3Byb3RlY3RcXFxcbmFzIHRoZSBmaXJzdFxcJyArXFxuICAgICAgXFwnIGxpbmUuIEJld2FyZSB0aGF0IGlmIHlvdSBkbyBoYXZlIGFuIGluZmluaXRlIGxvb3AgaW4geW91ciBjb2RlXFwnICtcXG4gICAgICBcXCcgdGhpcyB3aWxsIGNyYXNoIHlvdXIgYnJvd3Nlci5cXCdcXG4gICAgKTtcXG4gIH07XFxuPC9zY3JpcHQ+XFxuPGxpbmtcXG4gIHJlbD1cXCdzdHlsZXNoZWV0XFwnXFxuICBocmVmPVxcJy8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL2FuaW1hdGUuY3NzLzMuMi4wL2FuaW1hdGUubWluLmNzc1xcJ1xcbiAgLz5cXG48bGlua1xcbiAgcmVsPVxcJ3N0eWxlc2hlZXRcXCdcXG4gIGhyZWY9XFwnLy9tYXhjZG4uYm9vdHN0cmFwY2RuLmNvbS9ib290c3RyYXAvMy4zLjEvY3NzL2Jvb3RzdHJhcC5taW4uY3NzXFwnXFxuICAvPlxcblxcbjxsaW5rXFxuICByZWw9XFwnc3R5bGVzaGVldFxcJ1xcbiAgaHJlZj1cXCcvL21heGNkbi5ib290c3RyYXBjZG4uY29tL2ZvbnQtYXdlc29tZS80LjIuMC9jc3MvZm9udC1hd2Vzb21lLm1pbi5jc3NcXCdcXG4gIC8+XFxuPHN0eWxlPlxcbiAgYm9keSB7IHBhZGRpbmc6IDBweCAzcHggMHB4IDNweDsgfVxcbjwvc3R5bGU+XFxuICAnO1xuICB2YXIgY29kZURpc2FibGVkRXJyb3IgPSAnXFxuICAgIDxzY3JpcHQ+XFxuICAgICAgd2luZG93Ll9fZXJyID0gbmV3IEVycm9yKFxcJ2NvZGUgaGFzIGJlZW4gZGlzYWJsZWRcXCcpO1xcbiAgICA8L3NjcmlwdD5cXG4gICc7XG5cbiAgdmFyIGlGcmFtZVNjcmlwdCQgPSBjb21tb24uZ2V0U2NyaXB0Q29udGVudCQoJy9qcy9pRnJhbWVTY3JpcHRzLmpzJykuc2hhcmVSZXBsYXkoKTtcbiAgdmFyIGpRdWVyeVNjcmlwdCQgPSBjb21tb24uZ2V0U2NyaXB0Q29udGVudCQoJy9ib3dlcl9jb21wb25lbnRzL2pxdWVyeS9kaXN0L2pxdWVyeS5qcycpLnNoYXJlUmVwbGF5KCk7XG5cbiAgLy8gYmVoYXZpb3Igc3ViamVjdCBhbGx3YXlzIHJlbWVtYmVycyB0aGUgbGFzdCB2YWx1ZVxuICAvLyB3ZSB1c2UgdGhpcyB0byBkZXRlcm1pbmUgaWYgcnVuUHJldmlld1Rlc3QkIGlzIGRlZmluZWRcbiAgLy8gYW5kIHByaW1lIGl0IHdpdGggZmFsc2VcbiAgY29tbW9uLnByZXZpZXdSZWFkeSQgPSBuZXcgQmVoYXZpb3JTdWJqZWN0KGZhbHNlKTtcblxuICAvLyBUaGVzZSBzaG91bGQgYmUgc2V0IHVwIGluIHRoZSBwcmV2aWV3IHdpbmRvd1xuICAvLyBpZiB0aGlzIGVycm9yIGlzIHNlZW4gaXQgaXMgYmVjYXVzZSB0aGUgZnVuY3Rpb24gdHJpZWQgdG8gcnVuXG4gIC8vIGJlZm9yZSB0aGUgaWZyYW1lIGhhcyBjb21wbGV0ZWx5IGxvYWRlZFxuICBjb21tb24ucnVuUHJldmlld1Rlc3RzJCA9IGNvbW1vbi5jaGVja1ByZXZpZXckID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBPYnNlcnZhYmxlLnRocm93KG5ldyBFcnJvcignUHJldmlldyBub3QgZnVsbHkgbG9hZGVkJykpO1xuICB9O1xuXG4gIGNvbW1vbi51cGRhdGVQcmV2aWV3JCA9IGZ1bmN0aW9uIHVwZGF0ZVByZXZpZXckKCkge1xuICAgIHZhciBjb2RlID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gJycgOiBhcmd1bWVudHNbMF07XG5cbiAgICB2YXIgcHJldmlldyA9IGNvbW1vbi5nZXRJZnJhbWUoJ3ByZXZpZXcnKTtcblxuICAgIHJldHVybiBPYnNlcnZhYmxlLmNvbWJpbmVMYXRlc3QoaUZyYW1lU2NyaXB0JCwgalF1ZXJ5U2NyaXB0JCwgZnVuY3Rpb24gKGlmcmFtZSwgalF1ZXJ5KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBpZnJhbWVTY3JpcHQ6ICc8c2NyaXB0PicgKyBpZnJhbWUgKyAnPC9zY3JpcHQ+JyxcbiAgICAgICAgalF1ZXJ5OiAnPHNjcmlwdD4nICsgalF1ZXJ5ICsgJzwvc2NyaXB0PidcbiAgICAgIH07XG4gICAgfSkuZmlyc3QoKS5mbGF0TWFwKGZ1bmN0aW9uIChfcmVmKSB7XG4gICAgICB2YXIgaWZyYW1lU2NyaXB0ID0gX3JlZi5pZnJhbWVTY3JpcHQ7XG4gICAgICB2YXIgalF1ZXJ5ID0gX3JlZi5qUXVlcnk7XG5cbiAgICAgIC8vIHdlIG1ha2Ugc3VyZSB0byBvdmVycmlkZSB0aGUgbGFzdCB2YWx1ZSBpbiB0aGVcbiAgICAgIC8vIHN1YmplY3QgdG8gZmFsc2UgaGVyZS5cbiAgICAgIGNvbW1vbi5wcmV2aWV3UmVhZHkkLm9uTmV4dChmYWxzZSk7XG4gICAgICBwcmV2aWV3Lm9wZW4oKTtcbiAgICAgIHByZXZpZXcud3JpdGUobGlicmFyeUluY2x1ZGVzICsgalF1ZXJ5ICsgKGNvbW1vbi5zaG91bGRSdW4oKSA/IGNvZGUgOiBjb2RlRGlzYWJsZWRFcnJvcikgKyAnPCEtLSAtLT4nICsgaWZyYW1lU2NyaXB0KTtcbiAgICAgIHByZXZpZXcuY2xvc2UoKTtcbiAgICAgIC8vIG5vdyB3ZSBmaWx0ZXIgZmFsc2UgdmFsdWVzIGFuZCB3YWl0IGZvciB0aGUgZmlyc3QgdHJ1ZVxuICAgICAgcmV0dXJuIGNvbW1vbi5wcmV2aWV3UmVhZHkkLmZpbHRlcihmdW5jdGlvbiAocmVhZHkpIHtcbiAgICAgICAgcmV0dXJuIHJlYWR5O1xuICAgICAgfSkuZmlyc3QoKVxuICAgICAgLy8gdGhlIGRlbGF5IGhlcmUgaXMgdG8gZ2l2ZSBjb2RlIHdpdGhpbiB0aGUgaWZyYW1lXG4gICAgICAvLyBjb250cm9sIHRvIHJ1blxuICAgICAgLmRlbGF5KDQwMCk7XG4gICAgfSkubWFwKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBjb2RlO1xuICAgIH0pO1xuICB9O1xuXG4gIHJldHVybiBjb21tb247XG59KHdpbmRvdyk7IiwiJ3VzZSBzdHJpY3QnO1xuXG53aW5kb3cuY29tbW9uID0gZnVuY3Rpb24gKGdsb2JhbCkge1xuICB2YXIgX2dsb2JhbCRSeCA9IGdsb2JhbC5SeDtcbiAgdmFyIFN1YmplY3QgPSBfZ2xvYmFsJFJ4LlN1YmplY3Q7XG4gIHZhciBPYnNlcnZhYmxlID0gX2dsb2JhbCRSeC5PYnNlcnZhYmxlO1xuICB2YXIgQ29kZU1pcnJvciA9IGdsb2JhbC5Db2RlTWlycm9yO1xuICB2YXIgZW1tZXRDb2RlTWlycm9yID0gZ2xvYmFsLmVtbWV0Q29kZU1pcnJvcjtcbiAgdmFyIF9nbG9iYWwkY29tbW9uID0gZ2xvYmFsLmNvbW1vbjtcbiAgdmFyIGNvbW1vbiA9IF9nbG9iYWwkY29tbW9uID09PSB1bmRlZmluZWQgPyB7IGluaXQ6IFtdIH0gOiBfZ2xvYmFsJGNvbW1vbjtcbiAgdmFyIF9jb21tb24kY2hhbGxlbmdlVHlwZSA9IGNvbW1vbi5jaGFsbGVuZ2VUeXBlO1xuICB2YXIgY2hhbGxlbmdlVHlwZSA9IF9jb21tb24kY2hhbGxlbmdlVHlwZSA9PT0gdW5kZWZpbmVkID8gJzAnIDogX2NvbW1vbiRjaGFsbGVuZ2VUeXBlO1xuICB2YXIgY2hhbGxlbmdlVHlwZXMgPSBjb21tb24uY2hhbGxlbmdlVHlwZXM7XG5cbiAgaWYgKCFDb2RlTWlycm9yIHx8IGNoYWxsZW5nZVR5cGUgPT09IGNoYWxsZW5nZVR5cGVzLkJBU0VKVU1QIHx8IGNoYWxsZW5nZVR5cGUgPT09IGNoYWxsZW5nZVR5cGVzLlpJUExJTkUgfHwgY2hhbGxlbmdlVHlwZSA9PT0gY2hhbGxlbmdlVHlwZXMuVklERU8gfHwgY2hhbGxlbmdlVHlwZSA9PT0gY2hhbGxlbmdlVHlwZXMuU1RFUCB8fCBjaGFsbGVuZ2VUeXBlID09PSBjaGFsbGVuZ2VUeXBlcy5ISUtFUykge1xuICAgIGNvbW1vbi5lZGl0b3IgPSB7fTtcbiAgICByZXR1cm4gY29tbW9uO1xuICB9XG5cbiAgdmFyIGVkaXRvciA9IENvZGVNaXJyb3IuZnJvbVRleHRBcmVhKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb2RlRWRpdG9yJyksIHtcbiAgICBsaW50OiB0cnVlLFxuICAgIGxpbmVOdW1iZXJzOiB0cnVlLFxuICAgIG1vZGU6ICdqYXZhc2NyaXB0JyxcbiAgICB0aGVtZTogJ21vbm9rYWknLFxuICAgIHJ1bm5hYmxlOiB0cnVlLFxuICAgIG1hdGNoQnJhY2tldHM6IHRydWUsXG4gICAgYXV0b0Nsb3NlQnJhY2tldHM6IHRydWUsXG4gICAgc2Nyb2xsYmFyU3R5bGU6ICdudWxsJyxcbiAgICBsaW5lV3JhcHBpbmc6IHRydWUsXG4gICAgZ3V0dGVyczogWydDb2RlTWlycm9yLWxpbnQtbWFya2VycyddXG4gIH0pO1xuXG4gIGVkaXRvci5zZXRTaXplKCcxMDAlJywgJ2F1dG8nKTtcblxuICBjb21tb24uZWRpdG9yRXhlY3V0ZSQgPSBuZXcgU3ViamVjdCgpO1xuICBjb21tb24uZWRpdG9yS2V5VXAkID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnRQYXR0ZXJuKGZ1bmN0aW9uIChoYW5kbGVyKSB7XG4gICAgcmV0dXJuIGVkaXRvci5vbigna2V5dXAnLCBoYW5kbGVyKTtcbiAgfSwgZnVuY3Rpb24gKGhhbmRsZXIpIHtcbiAgICByZXR1cm4gZWRpdG9yLm9mZigna2V5dXAnLCBoYW5kbGVyKTtcbiAgfSk7XG5cbiAgZWRpdG9yLnNldE9wdGlvbignZXh0cmFLZXlzJywge1xuICAgIFRhYjogZnVuY3Rpb24gVGFiKGNtKSB7XG4gICAgICBpZiAoY20uc29tZXRoaW5nU2VsZWN0ZWQoKSkge1xuICAgICAgICBjbS5pbmRlbnRTZWxlY3Rpb24oJ2FkZCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHNwYWNlcyA9IEFycmF5KGNtLmdldE9wdGlvbignaW5kZW50VW5pdCcpICsgMSkuam9pbignICcpO1xuICAgICAgICBjbS5yZXBsYWNlU2VsZWN0aW9uKHNwYWNlcyk7XG4gICAgICB9XG4gICAgfSxcbiAgICAnU2hpZnQtVGFiJzogZnVuY3Rpb24gU2hpZnRUYWIoY20pIHtcbiAgICAgIGlmIChjbS5zb21ldGhpbmdTZWxlY3RlZCgpKSB7XG4gICAgICAgIGNtLmluZGVudFNlbGVjdGlvbignc3VidHJhY3QnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBzcGFjZXMgPSBBcnJheShjbS5nZXRPcHRpb24oJ2luZGVudFVuaXQnKSArIDEpLmpvaW4oJyAnKTtcbiAgICAgICAgY20ucmVwbGFjZVNlbGVjdGlvbihzcGFjZXMpO1xuICAgICAgfVxuICAgIH0sXG4gICAgJ0N0cmwtRW50ZXInOiBmdW5jdGlvbiBDdHJsRW50ZXIoKSB7XG4gICAgICBjb21tb24uZWRpdG9yRXhlY3V0ZSQub25OZXh0KCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcbiAgICAnQ21kLUVudGVyJzogZnVuY3Rpb24gQ21kRW50ZXIoKSB7XG4gICAgICBjb21tb24uZWRpdG9yRXhlY3V0ZSQub25OZXh0KCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9KTtcblxuICB2YXIgaW5mbyA9IGVkaXRvci5nZXRTY3JvbGxJbmZvKCk7XG5cbiAgdmFyIGFmdGVyID0gZWRpdG9yLmNoYXJDb29yZHMoe1xuICAgIGxpbmU6IGVkaXRvci5nZXRDdXJzb3IoKS5saW5lICsgMSxcbiAgICBjaDogMFxuICB9LCAnbG9jYWwnKS50b3A7XG5cbiAgaWYgKGluZm8udG9wICsgaW5mby5jbGllbnRIZWlnaHQgPCBhZnRlcikge1xuICAgIGVkaXRvci5zY3JvbGxUbyhudWxsLCBhZnRlciAtIGluZm8uY2xpZW50SGVpZ2h0ICsgMyk7XG4gIH1cblxuICBpZiAoZW1tZXRDb2RlTWlycm9yKSB7XG4gICAgZW1tZXRDb2RlTWlycm9yKGVkaXRvciwge1xuICAgICAgJ0NtZC1FJzogJ2VtbWV0LmV4cGFuZF9hYmJyZXZpYXRpb24nLFxuICAgICAgVGFiOiAnZW1tZXQuZXhwYW5kX2FiYnJldmlhdGlvbl93aXRoX3RhYicsXG4gICAgICBFbnRlcjogJ2VtbWV0Lmluc2VydF9mb3JtYXR0ZWRfbGluZV9icmVha19vbmx5J1xuICAgIH0pO1xuICB9XG4gIGNvbW1vbi5pbml0LnB1c2goZnVuY3Rpb24gKCkge1xuICAgIHZhciBlZGl0b3JWYWx1ZSA9IHVuZGVmaW5lZDtcbiAgICBpZiAoY29tbW9uLmNvZGVVcmkuaXNBbGl2ZSgpKSB7XG4gICAgICBlZGl0b3JWYWx1ZSA9IGNvbW1vbi5jb2RlVXJpLnBhcnNlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVkaXRvclZhbHVlID0gY29tbW9uLmNvZGVTdG9yYWdlLmlzQWxpdmUoY29tbW9uLmNoYWxsZW5nZU5hbWUpID8gY29tbW9uLmNvZGVTdG9yYWdlLmdldFN0b3JlZFZhbHVlKGNvbW1vbi5jaGFsbGVuZ2VOYW1lKSA6IGNvbW1vbi5zZWVkO1xuICAgIH1cblxuICAgIGVkaXRvci5zZXRWYWx1ZShjb21tb24ucmVwbGFjZVNhZmVUYWdzKGVkaXRvclZhbHVlKSk7XG4gICAgZWRpdG9yLnJlZnJlc2goKTtcbiAgfSk7XG5cbiAgY29tbW9uLmVkaXRvciA9IGVkaXRvcjtcblxuICByZXR1cm4gY29tbW9uO1xufSh3aW5kb3cpOyIsIid1c2Ugc3RyaWN0Jztcblxud2luZG93LmNvbW1vbiA9IGZ1bmN0aW9uIChnbG9iYWwpIHtcbiAgdmFyIE9ic2VydmFibGUgPSBnbG9iYWwuUnguT2JzZXJ2YWJsZTtcbiAgdmFyIF9nbG9iYWwkY29tbW9uID0gZ2xvYmFsLmNvbW1vbjtcbiAgdmFyIGNvbW1vbiA9IF9nbG9iYWwkY29tbW9uID09PSB1bmRlZmluZWQgPyB7IGluaXQ6IFtdIH0gOiBfZ2xvYmFsJGNvbW1vbjtcblxuICB2YXIgZGV0ZWN0RnVuY3Rpb25DYWxsID0gL2Z1bmN0aW9uXFxzKj9cXCh8ZnVuY3Rpb25cXHMrXFx3K1xccyo/XFwoL2dpO1xuICB2YXIgZGV0ZWN0VW5zYWZlSlEgPSAvXFwkXFxzKj9cXChcXHMqP1xcJFxccyo/XFwpL2dpO1xuICB2YXIgZGV0ZWN0VW5zYWZlQ29uc29sZUNhbGwgPSAvaWZcXHNcXChudWxsXFwpXFxzY29uc29sZVxcLmxvZ1xcKDFcXCk7L2dpO1xuXG4gIGNvbW1vbi5kZXRlY3RVbnNhZmVDb2RlJCA9IGZ1bmN0aW9uIGRldGVjdFVuc2FmZUNvZGUkKGNvZGUpIHtcbiAgICB2YXIgb3BlbmluZ0NvbW1lbnRzID0gY29kZS5tYXRjaCgvXFwvXFwqL2dpKTtcbiAgICB2YXIgY2xvc2luZ0NvbW1lbnRzID0gY29kZS5tYXRjaCgvXFwqXFwvL2dpKTtcblxuICAgIC8vIGNoZWNrcyBpZiB0aGUgbnVtYmVyIG9mIG9wZW5pbmcgY29tbWVudHMoLyopIG1hdGNoZXMgdGhlIG51bWJlciBvZlxuICAgIC8vIGNsb3NpbmcgY29tbWVudHMoKi8pXG4gICAgaWYgKG9wZW5pbmdDb21tZW50cyAmJiAoIWNsb3NpbmdDb21tZW50cyB8fCBvcGVuaW5nQ29tbWVudHMubGVuZ3RoID4gY2xvc2luZ0NvbW1lbnRzLmxlbmd0aCkpIHtcblxuICAgICAgcmV0dXJuIE9ic2VydmFibGUudGhyb3cobmV3IEVycm9yKCdTeW50YXhFcnJvcjogVW5maW5pc2hlZCBtdWx0aS1saW5lIGNvbW1lbnQnKSk7XG4gICAgfVxuXG4gICAgaWYgKGNvZGUubWF0Y2goZGV0ZWN0VW5zYWZlSlEpKSB7XG4gICAgICByZXR1cm4gT2JzZXJ2YWJsZS50aHJvdyhuZXcgRXJyb3IoJ1Vuc2FmZSAkKCQpJykpO1xuICAgIH1cblxuICAgIGlmIChjb2RlLm1hdGNoKC9mdW5jdGlvbi9nKSAmJiAhY29kZS5tYXRjaChkZXRlY3RGdW5jdGlvbkNhbGwpKSB7XG4gICAgICByZXR1cm4gT2JzZXJ2YWJsZS50aHJvdyhuZXcgRXJyb3IoJ1N5bnRheEVycm9yOiBVbnNhZmUgb3IgdW5maW5pc2hlZCBmdW5jdGlvbiBkZWNsYXJhdGlvbicpKTtcbiAgICB9XG5cbiAgICBpZiAoY29kZS5tYXRjaChkZXRlY3RVbnNhZmVDb25zb2xlQ2FsbCkpIHtcbiAgICAgIHJldHVybiBPYnNlcnZhYmxlLnRocm93KG5ldyBFcnJvcignSW52YWxpZCBpZiAobnVsbCkgY29uc29sZS5sb2coMSk7IGRldGVjdGVkJykpO1xuICAgIH1cblxuICAgIHJldHVybiBPYnNlcnZhYmxlLmp1c3QoY29kZSk7XG4gIH07XG5cbiAgcmV0dXJuIGNvbW1vbjtcbn0od2luZG93KTsiLCIndXNlIHN0cmljdCc7XG5cbndpbmRvdy5jb21tb24gPSBmdW5jdGlvbiAoX3JlZikge1xuICB2YXIgJCA9IF9yZWYuJDtcbiAgdmFyIF9yZWYkY29tbW9uID0gX3JlZi5jb21tb247XG4gIHZhciBjb21tb24gPSBfcmVmJGNvbW1vbiA9PT0gdW5kZWZpbmVkID8geyBpbml0OiBbXSB9IDogX3JlZiRjb21tb247XG5cbiAgY29tbW9uLmRpc3BsYXlUZXN0UmVzdWx0cyA9IGZ1bmN0aW9uIGRpc3BsYXlUZXN0UmVzdWx0cygpIHtcbiAgICB2YXIgZGF0YSA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IFtdIDogYXJndW1lbnRzWzBdO1xuXG4gICAgJCgnI3Rlc3RTdWl0ZScpLmNoaWxkcmVuKCkucmVtb3ZlKCk7XG4gICAgZGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChfcmVmMikge1xuICAgICAgdmFyIF9yZWYyJGVyciA9IF9yZWYyLmVycjtcbiAgICAgIHZhciBlcnIgPSBfcmVmMiRlcnIgPT09IHVuZGVmaW5lZCA/IGZhbHNlIDogX3JlZjIkZXJyO1xuICAgICAgdmFyIF9yZWYyJHRleHQgPSBfcmVmMi50ZXh0O1xuICAgICAgdmFyIHRleHQgPSBfcmVmMiR0ZXh0ID09PSB1bmRlZmluZWQgPyAnJyA6IF9yZWYyJHRleHQ7XG5cbiAgICAgIHZhciBpY29uQ2xhc3MgPSBlcnIgPyAnXCJpb24tY2xvc2UtY2lyY2xlZCBiaWctZXJyb3ItaWNvblwiJyA6ICdcImlvbi1jaGVja21hcmstY2lyY2xlZCBiaWctc3VjY2Vzcy1pY29uXCInO1xuXG4gICAgICAkKCc8ZGl2PjwvZGl2PicpLmh0bWwoJ1xcbiAgICAgICAgPGRpdiBjbGFzcz1cXCdyb3dcXCc+XFxuICAgICAgICAgIDxkaXYgY2xhc3M9XFwnY29sLXhzLTIgdGV4dC1jZW50ZXJcXCc+XFxuICAgICAgICAgICAgPGkgY2xhc3M9JyArIGljb25DbGFzcyArICc+PC9pPlxcbiAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgPGRpdiBjbGFzcz1cXCdjb2wteHMtMTAgdGVzdC1vdXRwdXRcXCc+XFxuICAgICAgICAgICAgJyArIHRleHQuc3BsaXQoJ21lc3NhZ2U6ICcpLnBvcCgpLnJlcGxhY2UoL1xcJ1xcKTsvZywgJycpICsgJ1xcbiAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgPGRpdiBjbGFzcz1cXCd0ZW4tcGl4ZWwtYnJlYWtcXCcvPlxcbiAgICAgICAgPC9kaXY+XFxuICAgICAgJykuYXBwZW5kVG8oJCgnI3Rlc3RTdWl0ZScpKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBkYXRhO1xuICB9O1xuXG4gIHJldHVybiBjb21tb247XG59KHdpbmRvdyk7IiwiJ3VzZSBzdHJpY3QnO1xuXG53aW5kb3cuY29tbW9uID0gZnVuY3Rpb24gKGdsb2JhbCkge1xuICB2YXIgZ2EgPSBnbG9iYWwuZ2E7XG4gIHZhciBfZ2xvYmFsJGNvbW1vbiA9IGdsb2JhbC5jb21tb247XG4gIHZhciBjb21tb24gPSBfZ2xvYmFsJGNvbW1vbiA9PT0gdW5kZWZpbmVkID8geyBpbml0OiBbXSB9IDogX2dsb2JhbCRjb21tb247XG4gIHZhciBhZGRMb29wUHJvdGVjdCA9IGNvbW1vbi5hZGRMb29wUHJvdGVjdDtcbiAgdmFyIGdldEpzRnJvbUh0bWwgPSBjb21tb24uZ2V0SnNGcm9tSHRtbDtcbiAgdmFyIGRldGVjdFVuc2FmZUNvZGUkID0gY29tbW9uLmRldGVjdFVuc2FmZUNvZGUkO1xuICB2YXIgdXBkYXRlUHJldmlldyQgPSBjb21tb24udXBkYXRlUHJldmlldyQ7XG4gIHZhciBjaGFsbGVuZ2VUeXBlID0gY29tbW9uLmNoYWxsZW5nZVR5cGU7XG4gIHZhciBjaGFsbGVuZ2VUeXBlcyA9IGNvbW1vbi5jaGFsbGVuZ2VUeXBlcztcblxuICBjb21tb24uZXhlY3V0ZUNoYWxsZW5nZSQgPSBmdW5jdGlvbiBleGVjdXRlQ2hhbGxlbmdlJCgpIHtcbiAgICB2YXIgY29kZSA9IGNvbW1vbi5lZGl0b3IuZ2V0VmFsdWUoKTtcbiAgICB2YXIgb3JpZ2luYWxDb2RlID0gY29kZTtcbiAgICB2YXIgaGVhZCA9IGNvbW1vbi5hcnJheVRvTmV3TGluZVN0cmluZyhjb21tb24uaGVhZCk7XG4gICAgdmFyIHRhaWwgPSBjb21tb24uYXJyYXlUb05ld0xpbmVTdHJpbmcoY29tbW9uLnRhaWwpO1xuICAgIHZhciBjb21iaW5lZENvZGUgPSBoZWFkICsgY29kZSArIHRhaWw7XG5cbiAgICBnYSgnc2VuZCcsICdldmVudCcsICdDaGFsbGVuZ2UnLCAncmFuLWNvZGUnLCBjb21tb24uZ2FOYW1lKTtcblxuICAgIC8vIHJ1biBjaGVja3MgZm9yIHVuc2FmZSBjb2RlXG4gICAgcmV0dXJuIGRldGVjdFVuc2FmZUNvZGUkKGNvZGUpXG4gICAgLy8gYWRkIGhlYWQgYW5kIHRhaWwgYW5kIGRldGVjdCBsb29wc1xuICAgIC5tYXAoZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKGNoYWxsZW5nZVR5cGUgIT09IGNoYWxsZW5nZVR5cGVzLkhUTUwpIHtcbiAgICAgICAgcmV0dXJuICc8c2NyaXB0PjsnICsgYWRkTG9vcFByb3RlY3QoY29tYmluZWRDb2RlKSArICcvKiovPC9zY3JpcHQ+JztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFkZExvb3BQcm90ZWN0KGNvbWJpbmVkQ29kZSk7XG4gICAgfSkuZmxhdE1hcChmdW5jdGlvbiAoY29kZSkge1xuICAgICAgcmV0dXJuIHVwZGF0ZVByZXZpZXckKGNvZGUpO1xuICAgIH0pLmZsYXRNYXAoZnVuY3Rpb24gKGNvZGUpIHtcbiAgICAgIHZhciBvdXRwdXQgPSB1bmRlZmluZWQ7XG5cbiAgICAgIGlmIChjaGFsbGVuZ2VUeXBlID09PSBjaGFsbGVuZ2VUeXBlcy5IVE1MICYmIGNvbW1vbi5oYXNKcyhjb2RlKSkge1xuICAgICAgICBvdXRwdXQgPSBjb21tb24uZ2V0SnNPdXRwdXQoZ2V0SnNGcm9tSHRtbChjb2RlKSk7XG4gICAgICB9IGVsc2UgaWYgKGNoYWxsZW5nZVR5cGUgIT09IGNoYWxsZW5nZVR5cGVzLkhUTUwpIHtcbiAgICAgICAgb3V0cHV0ID0gY29tbW9uLmdldEpzT3V0cHV0KGFkZExvb3BQcm90ZWN0KGNvbWJpbmVkQ29kZSkpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gY29tbW9uLnJ1blByZXZpZXdUZXN0cyQoe1xuICAgICAgICB0ZXN0czogY29tbW9uLnRlc3RzLnNsaWNlKCksXG4gICAgICAgIG9yaWdpbmFsQ29kZTogb3JpZ2luYWxDb2RlLFxuICAgICAgICBvdXRwdXQ6IG91dHB1dFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG5cbiAgcmV0dXJuIGNvbW1vbjtcbn0od2luZG93KTsiLCIndXNlIHN0cmljdCc7XG5cbndpbmRvdy5jb21tb24gPSBmdW5jdGlvbiAoZ2xvYmFsKSB7XG4gIHZhciBDb2RlTWlycm9yID0gZ2xvYmFsLkNvZGVNaXJyb3I7XG4gIHZhciBkb2MgPSBnbG9iYWwuZG9jdW1lbnQ7XG4gIHZhciBfZ2xvYmFsJGNvbW1vbiA9IGdsb2JhbC5jb21tb247XG4gIHZhciBjb21tb24gPSBfZ2xvYmFsJGNvbW1vbiA9PT0gdW5kZWZpbmVkID8geyBpbml0OiBbXSB9IDogX2dsb2JhbCRjb21tb247XG4gIHZhciBjaGFsbGVuZ2VUeXBlcyA9IGNvbW1vbi5jaGFsbGVuZ2VUeXBlcztcbiAgdmFyIF9jb21tb24kY2hhbGxlbmdlVHlwZSA9IGNvbW1vbi5jaGFsbGVuZ2VUeXBlO1xuICB2YXIgY2hhbGxlbmdlVHlwZSA9IF9jb21tb24kY2hhbGxlbmdlVHlwZSA9PT0gdW5kZWZpbmVkID8gJzAnIDogX2NvbW1vbiRjaGFsbGVuZ2VUeXBlO1xuXG4gIGlmICghQ29kZU1pcnJvciB8fCBjaGFsbGVuZ2VUeXBlICE9PSBjaGFsbGVuZ2VUeXBlcy5KUyAmJiBjaGFsbGVuZ2VUeXBlICE9PSBjaGFsbGVuZ2VUeXBlcy5CT05GSVJFKSB7XG4gICAgY29tbW9uLnVwZGF0ZU91dHB1dERpc3BsYXkgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICBjb21tb24uYXBwZW5kVG9PdXRwdXREaXNwbGF5ID0gZnVuY3Rpb24gKCkge307XG4gICAgcmV0dXJuIGNvbW1vbjtcbiAgfVxuXG4gIHZhciBjb2RlT3V0cHV0ID0gQ29kZU1pcnJvci5mcm9tVGV4dEFyZWEoZG9jLmdldEVsZW1lbnRCeUlkKCdjb2RlT3V0cHV0JyksIHtcbiAgICBsaW5lTnVtYmVyczogZmFsc2UsXG4gICAgbW9kZTogJ3RleHQnLFxuICAgIHRoZW1lOiAnbW9ub2thaScsXG4gICAgcmVhZE9ubHk6ICdub2N1cnNvcicsXG4gICAgbGluZVdyYXBwaW5nOiB0cnVlXG4gIH0pO1xuXG4gIGNvZGVPdXRwdXQuc2V0VmFsdWUoJy8qKlxcbiAgKiBZb3VyIG91dHB1dCB3aWxsIGdvIGhlcmUuXFxuICAqIENvbnNvbGUubG9nKCkgLXR5cGUgc3RhdGVtZW50c1xcbiAgKiB3aWxsIGFwcGVhciBpbiB5b3VyIGJyb3dzZXJcXCdzXFxuICAqIERldlRvb2xzIEphdmFTY3JpcHQgY29uc29sZS5cXG4gICovJyk7XG5cbiAgY29kZU91dHB1dC5zZXRTaXplKCcxMDAlJywgJzEwMCUnKTtcblxuICBjb21tb24udXBkYXRlT3V0cHV0RGlzcGxheSA9IGZ1bmN0aW9uIHVwZGF0ZU91dHB1dERpc3BsYXkoKSB7XG4gICAgdmFyIHN0ciA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/ICcnIDogYXJndW1lbnRzWzBdO1xuXG4gICAgaWYgKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSB7XG4gICAgICBzdHIgPSBKU09OLnN0cmluZ2lmeShzdHIpO1xuICAgIH1cbiAgICBjb2RlT3V0cHV0LnNldFZhbHVlKHN0cik7XG4gICAgcmV0dXJuIHN0cjtcbiAgfTtcblxuICBjb21tb24uYXBwZW5kVG9PdXRwdXREaXNwbGF5ID0gZnVuY3Rpb24gYXBwZW5kVG9PdXRwdXREaXNwbGF5KCkge1xuICAgIHZhciBzdHIgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyAnJyA6IGFyZ3VtZW50c1swXTtcblxuICAgIGNvZGVPdXRwdXQuc2V0VmFsdWUoY29kZU91dHB1dC5nZXRWYWx1ZSgpICsgc3RyKTtcbiAgICByZXR1cm4gc3RyO1xuICB9O1xuXG4gIHJldHVybiBjb21tb247XG59KHdpbmRvdyk7IiwiJ3VzZSBzdHJpY3QnO1xuXG53aW5kb3cuY29tbW9uID0gZnVuY3Rpb24gKF9yZWYpIHtcbiAgdmFyIF9yZWYkY29tbW9uID0gX3JlZi5jb21tb247XG4gIHZhciBjb21tb24gPSBfcmVmJGNvbW1vbiA9PT0gdW5kZWZpbmVkID8geyBpbml0OiBbXSB9IDogX3JlZiRjb21tb247XG5cbiAgY29tbW9uLmxvY2tUb3AgPSBmdW5jdGlvbiBsb2NrVG9wKCkge1xuICAgIHZhciBtYWdpVmFsO1xuXG4gICAgaWYgKCQod2luZG93KS53aWR0aCgpID49IDk5MCkge1xuICAgICAgaWYgKCQoJy5lZGl0b3JTY3JvbGxEaXYnKS5odG1sKCkpIHtcblxuICAgICAgICBtYWdpVmFsID0gJCh3aW5kb3cpLmhlaWdodCgpIC0gJCgnLm5hdmJhcicpLmhlaWdodCgpO1xuXG4gICAgICAgIGlmIChtYWdpVmFsIDwgMCkge1xuICAgICAgICAgIG1hZ2lWYWwgPSAwO1xuICAgICAgICB9XG4gICAgICAgICQoJy5lZGl0b3JTY3JvbGxEaXYnKS5jc3MoJ2hlaWdodCcsIG1hZ2lWYWwgLSA1MCArICdweCcpO1xuICAgICAgfVxuXG4gICAgICBtYWdpVmFsID0gJCh3aW5kb3cpLmhlaWdodCgpIC0gJCgnLm5hdmJhcicpLmhlaWdodCgpO1xuXG4gICAgICBpZiAobWFnaVZhbCA8IDApIHtcbiAgICAgICAgbWFnaVZhbCA9IDA7XG4gICAgICB9XG5cbiAgICAgICQoJy5zY3JvbGwtbG9ja2VyJykuY3NzKCdtaW4taGVpZ2h0JywgJCgnLmVkaXRvclNjcm9sbERpdicpLmhlaWdodCgpKS5jc3MoJ2hlaWdodCcsIG1hZ2lWYWwgLSA1MCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICQoJy5lZGl0b3JTY3JvbGxEaXYnKS5jc3MoJ21heC1oZWlnaHQnLCA1MDAgKyAncHgnKTtcblxuICAgICAgJCgnLnNjcm9sbC1sb2NrZXInKS5jc3MoJ3Bvc2l0aW9uJywgJ2luaGVyaXQnKS5jc3MoJ3RvcCcsICdpbmhlcml0JykuY3NzKCd3aWR0aCcsICcxMDAlJykuY3NzKCdtYXgtaGVpZ2h0JywgJzEwMCUnKTtcbiAgICB9XG4gIH07XG5cbiAgY29tbW9uLmluaXQucHVzaChmdW5jdGlvbiAoJCkge1xuICAgIC8vIGZha2VpcGhvbmUgcG9zaXRpb25pbmcgaG90Zml4XG4gICAgaWYgKCQoJy5pcGhvbmUtcG9zaXRpb24nKS5odG1sKCkgfHwgJCgnLmlwaG9uZScpLmh0bWwoKSkge1xuICAgICAgdmFyIHN0YXJ0SXBob25lUG9zaXRpb24gPSBwYXJzZUludCgkKCcuaXBob25lLXBvc2l0aW9uJykuY3NzKCd0b3AnKS5yZXBsYWNlKCdweCcsICcnKSwgMTApO1xuXG4gICAgICB2YXIgc3RhcnRJcGhvbmUgPSBwYXJzZUludCgkKCcuaXBob25lJykuY3NzKCd0b3AnKS5yZXBsYWNlKCdweCcsICcnKSwgMTApO1xuXG4gICAgICAkKHdpbmRvdykub24oJ3Njcm9sbCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNvdXJzZUhlaWdodCA9ICQoJy5jb3Vyc2V3YXJlLWhlaWdodCcpLmhlaWdodCgpO1xuICAgICAgICB2YXIgY291cnNlVG9wID0gJCgnLmNvdXJzZXdhcmUtaGVpZ2h0Jykub2Zmc2V0KCkudG9wO1xuICAgICAgICB2YXIgd2luZG93U2Nyb2xsVG9wID0gJCh3aW5kb3cpLnNjcm9sbFRvcCgpO1xuICAgICAgICB2YXIgcGhvbmVIZWlnaHQgPSAkKCcuaXBob25lLXBvc2l0aW9uJykuaGVpZ2h0KCk7XG5cbiAgICAgICAgaWYgKGNvdXJzZUhlaWdodCArIGNvdXJzZVRvcCAtIHdpbmRvd1Njcm9sbFRvcCAtIHBob25lSGVpZ2h0IDw9IDApIHtcbiAgICAgICAgICAkKCcuaXBob25lLXBvc2l0aW9uJykuY3NzKCd0b3AnLCBzdGFydElwaG9uZVBvc2l0aW9uICsgY291cnNlSGVpZ2h0ICsgY291cnNlVG9wIC0gd2luZG93U2Nyb2xsVG9wIC0gcGhvbmVIZWlnaHQpO1xuXG4gICAgICAgICAgJCgnLmlwaG9uZScpLmNzcygndG9wJywgc3RhcnRJcGhvbmVQb3NpdGlvbiArIGNvdXJzZUhlaWdodCArIGNvdXJzZVRvcCAtIHdpbmRvd1Njcm9sbFRvcCAtIHBob25lSGVpZ2h0ICsgMTIwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkKCcuaXBob25lLXBvc2l0aW9uJykuY3NzKCd0b3AnLCBzdGFydElwaG9uZVBvc2l0aW9uKTtcbiAgICAgICAgICAkKCcuaXBob25lJykuY3NzKCd0b3AnLCBzdGFydElwaG9uZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICgkKCcuc2Nyb2xsLWxvY2tlcicpLmh0bWwoKSkge1xuXG4gICAgICBpZiAoJCgnLnNjcm9sbC1sb2NrZXInKS5odG1sKCkpIHtcbiAgICAgICAgY29tbW9uLmxvY2tUb3AoKTtcbiAgICAgICAgJCh3aW5kb3cpLm9uKCdyZXNpemUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29tbW9uLmxvY2tUb3AoKTtcbiAgICAgICAgfSk7XG4gICAgICAgICQod2luZG93KS5vbignc2Nyb2xsJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbW1vbi5sb2NrVG9wKCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICB2YXIgZXhlY0luUHJvZ3Jlc3MgPSBmYWxzZTtcblxuICAgICAgLy8gd2h5IGlzIHRoaXMgbm90ICQ/Pz9cbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzY3JvbGwtbG9ja2VyJykuYWRkRXZlbnRMaXN0ZW5lcigncHJldmlld1VwZGF0ZVNweScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmIChleGVjSW5Qcm9ncmVzcykge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGV4ZWNJblByb2dyZXNzID0gdHJ1ZTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgaWYgKCQoJCgnLnNjcm9sbC1sb2NrZXInKS5jaGlsZHJlbigpWzBdKS5oZWlnaHQoKSAtIDgwMCA+IGUuZGV0YWlsKSB7XG4gICAgICAgICAgICAkKCcuc2Nyb2xsLWxvY2tlcicpLnNjcm9sbFRvcChlLmRldGFpbCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBzY3JvbGxUb3AgPSAkKCQoJy5zY3JvbGwtbG9ja2VyJykuY2hpbGRyZW4oKVswXSkuaGVpZ2h0KCk7XG5cbiAgICAgICAgICAgICQoJy5zY3JvbGwtbG9ja2VyJykuYW5pbWF0ZSh7IHNjcm9sbFRvcDogc2Nyb2xsVG9wIH0sIDE3NSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGV4ZWNJblByb2dyZXNzID0gZmFsc2U7XG4gICAgICAgIH0sIDc1MCk7XG4gICAgICB9LCBmYWxzZSk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gY29tbW9uO1xufSh3aW5kb3cpOyIsIid1c2Ugc3RyaWN0Jztcblxud2luZG93LmNvbW1vbiA9IGZ1bmN0aW9uIChfcmVmKSB7XG4gIHZhciBfcmVmJGNvbW1vbiA9IF9yZWYuY29tbW9uO1xuICB2YXIgY29tbW9uID0gX3JlZiRjb21tb24gPT09IHVuZGVmaW5lZCA/IHsgaW5pdDogW10gfSA6IF9yZWYkY29tbW9uO1xuXG4gIGNvbW1vbi5pbml0LnB1c2goZnVuY3Rpb24gKCQpIHtcbiAgICAkKCcjcmVwb3J0LWlzc3VlJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHRleHRNZXNzYWdlID0gWydDaGFsbGVuZ2UgWycsIGNvbW1vbi5jaGFsbGVuZ2VOYW1lIHx8IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSwgJ10oJywgd2luZG93LmxvY2F0aW9uLmhyZWYsICcpIGhhcyBhbiBpc3N1ZS5cXG4nLCAnVXNlciBBZ2VudCBpczogPGNvZGU+JywgbmF2aWdhdG9yLnVzZXJBZ2VudCwgJzwvY29kZT4uXFxuJywgJ1BsZWFzZSBkZXNjcmliZSBob3cgdG8gcmVwcm9kdWNlIHRoaXMgaXNzdWUsIGFuZCBpbmNsdWRlICcsICdsaW5rcyB0byBzY3JlZW5zaG90cyBpZiBwb3NzaWJsZS5cXG5cXG4nXS5qb2luKCcnKTtcblxuICAgICAgaWYgKGNvbW1vbi5lZGl0b3IgJiYgdHlwZW9mIGNvbW1vbi5lZGl0b3IuZ2V0VmFsdWUgPT09ICdmdW5jdGlvbicgJiYgY29tbW9uLmVkaXRvci5nZXRWYWx1ZSgpLnRyaW0oKSkge1xuICAgICAgICB2YXIgdHlwZTtcbiAgICAgICAgc3dpdGNoIChjb21tb24uY2hhbGxlbmdlVHlwZSkge1xuICAgICAgICAgIGNhc2UgY29tbW9uLmNoYWxsZW5nZVR5cGVzLkhUTUw6XG4gICAgICAgICAgICB0eXBlID0gJ2h0bWwnO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBjb21tb24uY2hhbGxlbmdlVHlwZXMuSlM6XG4gICAgICAgICAgY2FzZSBjb21tb24uY2hhbGxlbmdlVHlwZXMuQk9ORklSRTpcbiAgICAgICAgICAgIHR5cGUgPSAnamF2YXNjcmlwdCc7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdHlwZSA9ICcnO1xuICAgICAgICB9XG5cbiAgICAgICAgdGV4dE1lc3NhZ2UgKz0gWydNeSBjb2RlOlxcbmBgYCcsIHR5cGUsICdcXG4nLCBjb21tb24uZWRpdG9yLmdldFZhbHVlKCksICdcXG5gYGBcXG5cXG4nXS5qb2luKCcnKTtcbiAgICAgIH1cblxuICAgICAgdGV4dE1lc3NhZ2UgPSBlbmNvZGVVUklDb21wb25lbnQodGV4dE1lc3NhZ2UpO1xuXG4gICAgICAkKCcjaXNzdWUtbW9kYWwnKS5tb2RhbCgnaGlkZScpO1xuICAgICAgd2luZG93Lm9wZW4oJ2h0dHBzOi8vZ2l0aHViLmNvbS9mcmVlY29kZWNhbXAvZnJlZWNvZGVjYW1wL2lzc3Vlcy9uZXc/JmJvZHk9JyArIHRleHRNZXNzYWdlLCAnX2JsYW5rJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiBjb21tb247XG59KHdpbmRvdyk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbmZ1bmN0aW9uIF9vYmplY3RXaXRob3V0UHJvcGVydGllcyhvYmosIGtleXMpIHsgdmFyIHRhcmdldCA9IHt9OyBmb3IgKHZhciBpIGluIG9iaikgeyBpZiAoa2V5cy5pbmRleE9mKGkpID49IDApIGNvbnRpbnVlOyBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGkpKSBjb250aW51ZTsgdGFyZ2V0W2ldID0gb2JqW2ldOyB9IHJldHVybiB0YXJnZXQ7IH1cblxud2luZG93LmNvbW1vbiA9IGZ1bmN0aW9uIChnbG9iYWwpIHtcbiAgdmFyIE9ic2VydmFibGUgPSBnbG9iYWwuUnguT2JzZXJ2YWJsZTtcbiAgdmFyIGNoYWkgPSBnbG9iYWwuY2hhaTtcbiAgdmFyIF9nbG9iYWwkY29tbW9uID0gZ2xvYmFsLmNvbW1vbjtcbiAgdmFyIGNvbW1vbiA9IF9nbG9iYWwkY29tbW9uID09PSB1bmRlZmluZWQgPyB7IGluaXQ6IFtdIH0gOiBfZ2xvYmFsJGNvbW1vbjtcblxuICBjb21tb24ucnVuVGVzdHMkID0gZnVuY3Rpb24gcnVuVGVzdHMkKF9yZWYpIHtcbiAgICB2YXIgY29kZSA9IF9yZWYuY29kZTtcbiAgICB2YXIgb3JpZ2luYWxDb2RlID0gX3JlZi5vcmlnaW5hbENvZGU7XG4gICAgdmFyIHVzZXJUZXN0cyA9IF9yZWYudXNlclRlc3RzO1xuXG4gICAgdmFyIHJlc3QgPSBfb2JqZWN0V2l0aG91dFByb3BlcnRpZXMoX3JlZiwgW1wiY29kZVwiLCBcIm9yaWdpbmFsQ29kZVwiLCBcInVzZXJUZXN0c1wiXSk7XG5cbiAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tKHVzZXJUZXN0cykubWFwKGZ1bmN0aW9uICh0ZXN0KSB7XG5cbiAgICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLXVudXNlZC12YXJzICovXG4gICAgICB2YXIgYXNzZXJ0ID0gY2hhaS5hc3NlcnQ7XG4gICAgICB2YXIgZWRpdG9yID0ge1xuICAgICAgICBnZXRWYWx1ZTogZnVuY3Rpb24gZ2V0VmFsdWUoKSB7XG4gICAgICAgICAgcmV0dXJuIG9yaWdpbmFsQ29kZTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIC8qIGVzbGludC1lbmFibGUgbm8tdW51c2VkLXZhcnMgKi9cblxuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHRlc3QpIHtcbiAgICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby1ldmFsICAqL1xuICAgICAgICAgIGV2YWwoY29tbW9uLnJlYXNzZW1ibGVUZXN0KGNvZGUsIHRlc3QpKTtcbiAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLWV2YWwgKi9cbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB0ZXN0LmVyciA9IGUubWVzc2FnZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRlc3Q7XG4gICAgfSkudG9BcnJheSgpLm1hcChmdW5jdGlvbiAodGVzdHMpIHtcbiAgICAgIHJldHVybiBfZXh0ZW5kcyh7fSwgcmVzdCwgeyB0ZXN0czogdGVzdHMgfSk7XG4gICAgfSk7XG4gIH07XG5cbiAgcmV0dXJuIGNvbW1vbjtcbn0od2luZG93KTsiLCIndXNlIHN0cmljdCc7XG5cbndpbmRvdy5jb21tb24gPSBmdW5jdGlvbiAoZ2xvYmFsKSB7XG4gIHZhciAkID0gZ2xvYmFsLiQ7XG4gIHZhciBtb21lbnQgPSBnbG9iYWwubW9tZW50O1xuICB2YXIgX2dsb2JhbCRnYSA9IGdsb2JhbC5nYTtcbiAgdmFyIGdhID0gX2dsb2JhbCRnYSA9PT0gdW5kZWZpbmVkID8gZnVuY3Rpb24gKCkge30gOiBfZ2xvYmFsJGdhO1xuICB2YXIgX2dsb2JhbCRjb21tb24gPSBnbG9iYWwuY29tbW9uO1xuICB2YXIgY29tbW9uID0gX2dsb2JhbCRjb21tb24gPT09IHVuZGVmaW5lZCA/IHsgaW5pdDogW10gfSA6IF9nbG9iYWwkY29tbW9uO1xuXG4gIGNvbW1vbi5zaG93Q29tcGxldGlvbiA9IGZ1bmN0aW9uIHNob3dDb21wbGV0aW9uKCkge1xuXG4gICAgZ2EoJ3NlbmQnLCAnZXZlbnQnLCAnQ2hhbGxlbmdlJywgJ3NvbHZlZCcsIGNvbW1vbi5nYU5hbWUsIHRydWUpO1xuXG4gICAgdmFyIHNvbHV0aW9uID0gY29tbW9uLmVkaXRvci5nZXRWYWx1ZSgpO1xuICAgIHZhciBkaWRDb21wbGV0ZVdpdGggPSAkKCcjY29tcGxldGVkLXdpdGgnKS52YWwoKSB8fCBudWxsO1xuXG4gICAgJCgnI2NvbXBsZXRlLWNvdXJzZXdhcmUtZGlhbG9nJykubW9kYWwoJ3Nob3cnKTtcbiAgICAkKCcjY29tcGxldGUtY291cnNld2FyZS1kaWFsb2cgLm1vZGFsLWhlYWRlcicpLmNsaWNrKCk7XG5cbiAgICAkKCcjc3VibWl0LWNoYWxsZW5nZScpLmNsaWNrKGZ1bmN0aW9uIChlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICQoJyNzdWJtaXQtY2hhbGxlbmdlJykuYXR0cignZGlzYWJsZWQnLCAndHJ1ZScpLnJlbW92ZUNsYXNzKCdidG4tcHJpbWFyeScpLmFkZENsYXNzKCdidG4td2FybmluZyBkaXNhYmxlZCcpO1xuXG4gICAgICB2YXIgJGNoZWNrbWFya0NvbnRhaW5lciA9ICQoJyNjaGVja21hcmstY29udGFpbmVyJyk7XG4gICAgICAkY2hlY2ttYXJrQ29udGFpbmVyLmNzcyh7IGhlaWdodDogJGNoZWNrbWFya0NvbnRhaW5lci5pbm5lckhlaWdodCgpIH0pO1xuXG4gICAgICAkKCcjY2hhbGxlbmdlLWNoZWNrbWFyaycpLmFkZENsYXNzKCd6b29tT3V0VXAnKVxuICAgICAgLy8gLnJlbW92ZUNsYXNzKCd6b29tSW5Eb3duJylcbiAgICAgIC5kZWxheSgxMDAwKS5xdWV1ZShmdW5jdGlvbiAobmV4dCkge1xuICAgICAgICAkKHRoaXMpLnJlcGxhY2VXaXRoKCc8ZGl2IGlkPVwiY2hhbGxlbmdlLXNwaW5uZXJcIiAnICsgJ2NsYXNzPVwiYW5pbWF0ZWQgem9vbUluVXAgaW5uZXItY2lyY2xlcy1sb2FkZXJcIj4nICsgJ3N1Ym1pdHRpbmcuLi48L2Rpdj4nKTtcbiAgICAgICAgbmV4dCgpO1xuICAgICAgfSk7XG5cbiAgICAgIHZhciB0aW1lem9uZSA9ICdVVEMnO1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGltZXpvbmUgPSBtb21lbnQudHouZ3Vlc3MoKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBlcnIubWVzc2FnZSA9ICdcXG4gICAgICAgICAga25vd24gYnVnLCBzZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9tb21lbnQvbW9tZW50LXRpbWV6b25lL2lzc3Vlcy8yOTQ6XFxuICAgICAgICAgICcgKyBlcnIubWVzc2FnZSArICdcXG4gICAgICAgICc7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgIH1cbiAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICBpZDogY29tbW9uLmNoYWxsZW5nZUlkLFxuICAgICAgICBuYW1lOiBjb21tb24uY2hhbGxlbmdlTmFtZSxcbiAgICAgICAgY29tcGxldGVkV2l0aDogZGlkQ29tcGxldGVXaXRoLFxuICAgICAgICBjaGFsbGVuZ2VUeXBlOiBjb21tb24uY2hhbGxlbmdlVHlwZSxcbiAgICAgICAgc29sdXRpb246IHNvbHV0aW9uLFxuICAgICAgICB0aW1lem9uZTogdGltZXpvbmVcbiAgICAgIH07XG5cbiAgICAgICQucG9zdCgnL2NvbXBsZXRlZC1jaGFsbGVuZ2UvJywgZGF0YSwgZnVuY3Rpb24gKHJlcykge1xuICAgICAgICBpZiAocmVzKSB7XG4gICAgICAgICAgd2luZG93LmxvY2F0aW9uID0gJy9jaGFsbGVuZ2VzL25leHQtY2hhbGxlbmdlP2lkPScgKyBjb21tb24uY2hhbGxlbmdlSWQ7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIHJldHVybiBjb21tb247XG59KHdpbmRvdyk7IiwiJ3VzZSBzdHJpY3QnO1xuXG53aW5kb3cuY29tbW9uID0gZnVuY3Rpb24gKF9yZWYpIHtcbiAgdmFyICQgPSBfcmVmLiQ7XG4gIHZhciBfcmVmJGNvbW1vbiA9IF9yZWYuY29tbW9uO1xuICB2YXIgY29tbW9uID0gX3JlZiRjb21tb24gPT09IHVuZGVmaW5lZCA/IHsgaW5pdDogW10gfSA6IF9yZWYkY29tbW9uO1xuXG4gIHZhciBzdGVwQ2xhc3MgPSAnLmNoYWxsZW5nZS1zdGVwJztcbiAgdmFyIHByZXZCdG5DbGFzcyA9ICcuY2hhbGxlbmdlLXN0ZXAtYnRuLXByZXYnO1xuICB2YXIgbmV4dEJ0bkNsYXNzID0gJy5jaGFsbGVuZ2Utc3RlcC1idG4tbmV4dCc7XG4gIHZhciBhY3Rpb25CdG5DbGFzcyA9ICcuY2hhbGxlbmdlLXN0ZXAtYnRuLWFjdGlvbic7XG4gIHZhciBmaW5pc2hCdG5DbGFzcyA9ICcuY2hhbGxlbmdlLXN0ZXAtYnRuLWZpbmlzaCc7XG4gIHZhciBzdWJtaXRCdG5JZCA9ICcjY2hhbGxlbmdlLXN0ZXAtYnRuLXN1Ym1pdCc7XG4gIHZhciBzdWJtaXRNb2RhbElkID0gJyNjaGFsbGVuZ2Utc3RlcC1tb2RhbCc7XG5cbiAgZnVuY3Rpb24gZ2V0UHJldmlvdXNTdGVwKCRjaGFsbGVuZ2VTdGVwcykge1xuICAgIHZhciAkcHJldlN0ZXAgPSBmYWxzZTtcbiAgICB2YXIgcHJldlN0ZXBJbmRleCA9IDA7XG4gICAgJGNoYWxsZW5nZVN0ZXBzLmVhY2goZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICB2YXIgJHN0ZXAgPSAkKHRoaXMpO1xuICAgICAgaWYgKCEkc3RlcC5oYXNDbGFzcygnaGlkZGVuJykpIHtcbiAgICAgICAgcHJldlN0ZXBJbmRleCA9IGluZGV4IC0gMTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgICRwcmV2U3RlcCA9ICRjaGFsbGVuZ2VTdGVwc1twcmV2U3RlcEluZGV4XTtcblxuICAgIHJldHVybiAkcHJldlN0ZXA7XG4gIH1cblxuICBmdW5jdGlvbiBnZXROZXh0U3RlcCgkY2hhbGxlbmdlU3RlcHMpIHtcbiAgICB2YXIgbGVuZ3RoID0gJGNoYWxsZW5nZVN0ZXBzLmxlbmd0aDtcbiAgICB2YXIgJG5leHRTdGVwID0gZmFsc2U7XG4gICAgdmFyIG5leHRTdGVwSW5kZXggPSAwO1xuICAgICRjaGFsbGVuZ2VTdGVwcy5lYWNoKGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgdmFyICRzdGVwID0gJCh0aGlzKTtcbiAgICAgIGlmICghJHN0ZXAuaGFzQ2xhc3MoJ2hpZGRlbicpICYmIGluZGV4ICsgMSAhPT0gbGVuZ3RoKSB7XG4gICAgICAgIG5leHRTdGVwSW5kZXggPSBpbmRleCArIDE7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAkbmV4dFN0ZXAgPSAkY2hhbGxlbmdlU3RlcHNbbmV4dFN0ZXBJbmRleF07XG5cbiAgICByZXR1cm4gJG5leHRTdGVwO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlUHJldlN0ZXBDbGljayhlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHZhciBwcmV2U3RlcCA9IGdldFByZXZpb3VzU3RlcCgkKHN0ZXBDbGFzcykpO1xuICAgICQodGhpcykucGFyZW50KCkucGFyZW50KCkucmVtb3ZlQ2xhc3MoJ3NsaWRlSW5MZWZ0IHNsaWRlSW5SaWdodCcpLmFkZENsYXNzKCdhbmltYXRlZCBmYWRlT3V0UmlnaHQgZmFzdC1hbmltYXRpb24nKS5kZWxheSgyNTApLnF1ZXVlKGZ1bmN0aW9uIChwcmV2KSB7XG4gICAgICAkKHRoaXMpLmFkZENsYXNzKCdoaWRkZW4nKTtcbiAgICAgIGlmIChwcmV2U3RlcCkge1xuICAgICAgICAkKHByZXZTdGVwKS5yZW1vdmVDbGFzcygnaGlkZGVuJykucmVtb3ZlQ2xhc3MoJ2ZhZGVPdXRMZWZ0IGZhZGVPdXRSaWdodCcpLmFkZENsYXNzKCdhbmltYXRlZCBzbGlkZUluTGVmdCBmYXN0LWFuaW1hdGlvbicpLmRlbGF5KDUwMCkucXVldWUoZnVuY3Rpb24gKHByZXYpIHtcbiAgICAgICAgICBwcmV2KCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcHJldigpO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlTmV4dFN0ZXBDbGljayhlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHZhciBuZXh0U3RlcCA9IGdldE5leHRTdGVwKCQoc3RlcENsYXNzKSk7XG4gICAgJCh0aGlzKS5wYXJlbnQoKS5wYXJlbnQoKS5yZW1vdmVDbGFzcygnc2xpZGVJblJpZ2h0IHNsaWRlSW5MZWZ0JykuYWRkQ2xhc3MoJ2FuaW1hdGVkIGZhZGVPdXRMZWZ0IGZhc3QtYW5pbWF0aW9uJykuZGVsYXkoMjUwKS5xdWV1ZShmdW5jdGlvbiAobmV4dCkge1xuICAgICAgJCh0aGlzKS5hZGRDbGFzcygnaGlkZGVuJyk7XG4gICAgICBpZiAobmV4dFN0ZXApIHtcbiAgICAgICAgJChuZXh0U3RlcCkucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpLnJlbW92ZUNsYXNzKCdmYWRlT3V0UmlnaHQgZmFkZU91dExlZnQnKS5hZGRDbGFzcygnYW5pbWF0ZWQgc2xpZGVJblJpZ2h0IGZhc3QtYW5pbWF0aW9uJykuZGVsYXkoNTAwKS5xdWV1ZShmdW5jdGlvbiAobmV4dCkge1xuICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBuZXh0KCk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVBY3Rpb25DbGljayhlKSB7XG4gICAgdmFyIHByb3BzID0gY29tbW9uLmNoYWxsZW5nZVNlZWRbMF0gfHwgeyBzdGVwSW5kZXg6IFtdIH07XG5cbiAgICB2YXIgJGVsID0gJCh0aGlzKTtcbiAgICB2YXIgaW5kZXggPSArJGVsLmF0dHIoJ2lkJyk7XG4gICAgdmFyIHByb3BJbmRleCA9IHByb3BzLnN0ZXBJbmRleC5pbmRleE9mKGluZGV4KTtcblxuICAgIGlmIChwcm9wSW5kZXggPT09IC0xKSB7XG4gICAgICByZXR1cm4gJGVsLnBhcmVudCgpLmZpbmQoJy5kaXNhYmxlZCcpLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuICAgIH1cblxuICAgIC8vIGFuIEFQSSBhY3Rpb25cbiAgICAvLyBwcmV2ZW50IGxpbmsgZnJvbSBvcGVuaW5nXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHZhciBwcm9wID0gcHJvcHMucHJvcGVydGllc1twcm9wSW5kZXhdO1xuICAgIHZhciBhcGkgPSBwcm9wcy5hcGlzW3Byb3BJbmRleF07XG4gICAgaWYgKGNvbW1vbltwcm9wXSkge1xuICAgICAgcmV0dXJuICRlbC5wYXJlbnQoKS5maW5kKCcuZGlzYWJsZWQnKS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcbiAgICB9XG4gICAgJC5wb3N0KGFwaSkuZG9uZShmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgLy8gYXNzdW1lIGEgYm9vbGVhbiBpbmRpY2F0ZXMgcGFzc2luZ1xuICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgcmV0dXJuICRlbC5wYXJlbnQoKS5maW5kKCcuZGlzYWJsZWQnKS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgIH1cbiAgICAgIC8vIGFzc3VtZSBhcGkgcmV0dXJucyBzdHJpbmcgd2hlbiBmYWlsc1xuICAgICAgJGVsLnBhcmVudCgpLmZpbmQoJy5kaXNhYmxlZCcpLnJlcGxhY2VXaXRoKCc8cD4nICsgZGF0YSArICc8L3A+Jyk7XG4gICAgfSkuZmFpbChmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZygnZmFpbGVkJyk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVGaW5pc2hDbGljayhlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICQoc3VibWl0TW9kYWxJZCkubW9kYWwoJ3Nob3cnKTtcbiAgICAkKHN1Ym1pdE1vZGFsSWQgKyAnLm1vZGFsLWhlYWRlcicpLmNsaWNrKCk7XG4gICAgJChzdWJtaXRCdG5JZCkuY2xpY2soaGFuZGxlU3VibWl0Q2xpY2spO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlU3VibWl0Q2xpY2soZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICQoJyNzdWJtaXQtY2hhbGxlbmdlJykuYXR0cignZGlzYWJsZWQnLCAndHJ1ZScpLnJlbW92ZUNsYXNzKCdidG4tcHJpbWFyeScpLmFkZENsYXNzKCdidG4td2FybmluZyBkaXNhYmxlZCcpO1xuXG4gICAgdmFyICRjaGVja21hcmtDb250YWluZXIgPSAkKCcjY2hlY2ttYXJrLWNvbnRhaW5lcicpO1xuICAgICRjaGVja21hcmtDb250YWluZXIuY3NzKHsgaGVpZ2h0OiAkY2hlY2ttYXJrQ29udGFpbmVyLmlubmVySGVpZ2h0KCkgfSk7XG5cbiAgICAkKCcjY2hhbGxlbmdlLWNoZWNrbWFyaycpLmFkZENsYXNzKCd6b29tT3V0VXAnKS5kZWxheSgxMDAwKS5xdWV1ZShmdW5jdGlvbiAobmV4dCkge1xuICAgICAgJCh0aGlzKS5yZXBsYWNlV2l0aCgnPGRpdiBpZD1cImNoYWxsZW5nZS1zcGlubmVyXCIgJyArICdjbGFzcz1cImFuaW1hdGVkIHpvb21JblVwIGlubmVyLWNpcmNsZXMtbG9hZGVyXCI+JyArICdzdWJtaXR0aW5nLi4uPC9kaXY+Jyk7XG4gICAgICBuZXh0KCk7XG4gICAgfSk7XG5cbiAgICAkLnBvc3QoJy9jb21wbGV0ZWQtY2hhbGxlbmdlLycsIHtcbiAgICAgIGlkOiBjb21tb24uY2hhbGxlbmdlSWQsXG4gICAgICBuYW1lOiBjb21tb24uY2hhbGxlbmdlTmFtZSxcbiAgICAgIGNoYWxsZW5nZVR5cGU6IGNvbW1vbi5jaGFsbGVuZ2VUeXBlXG4gICAgfSwgZnVuY3Rpb24gKHJlcykge1xuICAgICAgaWYgKHJlcykge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24gPSAnL2NoYWxsZW5nZXMvbmV4dC1jaGFsbGVuZ2U/aWQ9JyArIGNvbW1vbi5jaGFsbGVuZ2VJZDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGNvbW1vbi5pbml0LnB1c2goZnVuY3Rpb24gKCQpIHtcbiAgICBpZiAoY29tbW9uLmNoYWxsZW5nZVR5cGUgIT09ICc3Jykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgJChwcmV2QnRuQ2xhc3MpLmNsaWNrKGhhbmRsZVByZXZTdGVwQ2xpY2spO1xuICAgICQobmV4dEJ0bkNsYXNzKS5jbGljayhoYW5kbGVOZXh0U3RlcENsaWNrKTtcbiAgICAkKGFjdGlvbkJ0bkNsYXNzKS5jbGljayhoYW5kbGVBY3Rpb25DbGljayk7XG4gICAgJChmaW5pc2hCdG5DbGFzcykuY2xpY2soaGFuZGxlRmluaXNoQ2xpY2spO1xuICB9KTtcblxuICByZXR1cm4gY29tbW9uO1xufSh3aW5kb3cpOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxuZnVuY3Rpb24gX29iamVjdFdpdGhvdXRQcm9wZXJ0aWVzKG9iaiwga2V5cykgeyB2YXIgdGFyZ2V0ID0ge307IGZvciAodmFyIGkgaW4gb2JqKSB7IGlmIChrZXlzLmluZGV4T2YoaSkgPj0gMCkgY29udGludWU7IGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgaSkpIGNvbnRpbnVlOyB0YXJnZXRbaV0gPSBvYmpbaV07IH0gcmV0dXJuIHRhcmdldDsgfVxuXG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbiAoKSB7XG4gIHZhciBjb21tb24gPSB3aW5kb3cuY29tbW9uO1xuICB2YXIgT2JzZXJ2YWJsZSA9IHdpbmRvdy5SeC5PYnNlcnZhYmxlO1xuICB2YXIgYWRkTG9vcFByb3RlY3QgPSBjb21tb24uYWRkTG9vcFByb3RlY3Q7XG4gIHZhciBjaGFsbGVuZ2VOYW1lID0gY29tbW9uLmNoYWxsZW5nZU5hbWU7XG4gIHZhciBjaGFsbGVuZ2VUeXBlID0gY29tbW9uLmNoYWxsZW5nZVR5cGU7XG4gIHZhciBjaGFsbGVuZ2VUeXBlcyA9IGNvbW1vbi5jaGFsbGVuZ2VUeXBlcztcblxuICBjb21tb24uaW5pdC5mb3JFYWNoKGZ1bmN0aW9uIChpbml0KSB7XG4gICAgaW5pdCgkKTtcbiAgfSk7XG5cbiAgLy8gb25seSBydW4gaWYgZWRpdG9yIHByZXNlbnRcbiAgaWYgKGNvbW1vbi5lZGl0b3IuZ2V0VmFsdWUpIHtcbiAgICB2YXIgY29kZSQgPSBjb21tb24uZWRpdG9yS2V5VXAkLmRlYm91bmNlKDc1MCkubWFwKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBjb21tb24uZWRpdG9yLmdldFZhbHVlKCk7XG4gICAgfSkuZGlzdGluY3RVbnRpbENoYW5nZWQoKS5zaGFyZVJlcGxheSgpO1xuXG4gICAgLy8gdXBkYXRlIHN0b3JhZ2VcbiAgICBjb2RlJC5zdWJzY3JpYmUoZnVuY3Rpb24gKGNvZGUpIHtcbiAgICAgIGNvbW1vbi5jb2RlU3RvcmFnZS51cGRhdGVTdG9yYWdlKGNvbW1vbi5jaGFsbGVuZ2VOYW1lLCBjb2RlKTtcbiAgICAgIGNvbW1vbi5jb2RlVXJpLnF1ZXJpZnkoY29kZSk7XG4gICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICB9KTtcblxuICAgIGNvZGUkXG4gICAgLy8gb25seSBydW4gZm9yIEhUTUxcbiAgICAuZmlsdGVyKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBjb21tb24uY2hhbGxlbmdlVHlwZSA9PT0gY2hhbGxlbmdlVHlwZXMuSFRNTDtcbiAgICB9KS5mbGF0TWFwKGZ1bmN0aW9uIChjb2RlKSB7XG4gICAgICByZXR1cm4gY29tbW9uLmRldGVjdFVuc2FmZUNvZGUkKGNvZGUpLm1hcChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjb21iaW5lZENvZGUgPSBjb21tb24uaGVhZCArIGNvZGUgKyBjb21tb24udGFpbDtcblxuICAgICAgICByZXR1cm4gYWRkTG9vcFByb3RlY3QoY29tYmluZWRDb2RlKTtcbiAgICAgIH0pLmZsYXRNYXAoZnVuY3Rpb24gKGNvZGUpIHtcbiAgICAgICAgcmV0dXJuIGNvbW1vbi51cGRhdGVQcmV2aWV3JChjb2RlKTtcbiAgICAgIH0pLmZsYXRNYXAoZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gY29tbW9uLmNoZWNrUHJldmlldyQoeyBjb2RlOiBjb2RlIH0pO1xuICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5qdXN0KHsgZXJyOiBlcnIgfSk7XG4gICAgICB9KTtcbiAgICB9KS5zdWJzY3JpYmUoZnVuY3Rpb24gKF9yZWYpIHtcbiAgICAgIHZhciBlcnIgPSBfcmVmLmVycjtcblxuICAgICAgaWYgKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgIHJldHVybiBjb21tb24udXBkYXRlUHJldmlldyQoJ1xcbiAgICAgICAgICAgICAgPGgxPicgKyBlcnIgKyAnPC9oMT5cXG4gICAgICAgICAgICAnKS5zdWJzY3JpYmUoZnVuY3Rpb24gKCkge30pO1xuICAgICAgfVxuICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIHJldHVybiBjb25zb2xlLmVycm9yKGVycik7XG4gICAgfSk7XG4gIH1cblxuICBjb21tb24ucmVzZXRCdG4kLmRvT25OZXh0KGZ1bmN0aW9uICgpIHtcbiAgICBjb21tb24uZWRpdG9yLnNldFZhbHVlKGNvbW1vbi5yZXBsYWNlU2FmZVRhZ3MoY29tbW9uLnNlZWQpKTtcbiAgfSkuZmxhdE1hcChmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGNvbW1vbi5leGVjdXRlQ2hhbGxlbmdlJCgpLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIHJldHVybiBPYnNlcnZhYmxlLmp1c3QoeyBlcnI6IGVyciB9KTtcbiAgICB9KTtcbiAgfSkuc3Vic2NyaWJlKGZ1bmN0aW9uIChfcmVmMikge1xuICAgIHZhciBlcnIgPSBfcmVmMi5lcnI7XG4gICAgdmFyIG91dHB1dCA9IF9yZWYyLm91dHB1dDtcbiAgICB2YXIgb3JpZ2luYWxDb2RlID0gX3JlZjIub3JpZ2luYWxDb2RlO1xuXG4gICAgaWYgKGVycikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgcmV0dXJuIGNvbW1vbi51cGRhdGVPdXRwdXREaXNwbGF5KCcnICsgZXJyKTtcbiAgICB9XG4gICAgY29tbW9uLmNvZGVTdG9yYWdlLnVwZGF0ZVN0b3JhZ2UoY2hhbGxlbmdlTmFtZSwgb3JpZ2luYWxDb2RlKTtcbiAgICBjb21tb24uY29kZVVyaS5xdWVyaWZ5KG9yaWdpbmFsQ29kZSk7XG4gICAgY29tbW9uLnVwZGF0ZU91dHB1dERpc3BsYXkob3V0cHV0KTtcbiAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICB9XG4gICAgY29tbW9uLnVwZGF0ZU91dHB1dERpc3BsYXkoJycgKyBlcnIpO1xuICB9KTtcblxuICBPYnNlcnZhYmxlLm1lcmdlKGNvbW1vbi5lZGl0b3JFeGVjdXRlJCwgY29tbW9uLnN1Ym1pdEJ0biQpLmZsYXRNYXAoZnVuY3Rpb24gKCkge1xuICAgIGNvbW1vbi5hcHBlbmRUb091dHB1dERpc3BsYXkoJ1xcbi8vIHRlc3RpbmcgY2hhbGxlbmdlLi4uJyk7XG4gICAgcmV0dXJuIGNvbW1vbi5leGVjdXRlQ2hhbGxlbmdlJCgpLm1hcChmdW5jdGlvbiAoX3JlZjMpIHtcbiAgICAgIHZhciB0ZXN0cyA9IF9yZWYzLnRlc3RzO1xuXG4gICAgICB2YXIgcmVzdCA9IF9vYmplY3RXaXRob3V0UHJvcGVydGllcyhfcmVmMywgWyd0ZXN0cyddKTtcblxuICAgICAgdmFyIHNvbHZlZCA9IHRlc3RzLmV2ZXJ5KGZ1bmN0aW9uICh0ZXN0KSB7XG4gICAgICAgIHJldHVybiAhdGVzdC5lcnI7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBfZXh0ZW5kcyh7fSwgcmVzdCwgeyB0ZXN0czogdGVzdHMsIHNvbHZlZDogc29sdmVkIH0pO1xuICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIHJldHVybiBPYnNlcnZhYmxlLmp1c3QoeyBlcnI6IGVyciB9KTtcbiAgICB9KTtcbiAgfSkuc3Vic2NyaWJlKGZ1bmN0aW9uIChfcmVmNCkge1xuICAgIHZhciBlcnIgPSBfcmVmNC5lcnI7XG4gICAgdmFyIHNvbHZlZCA9IF9yZWY0LnNvbHZlZDtcbiAgICB2YXIgb3V0cHV0ID0gX3JlZjQub3V0cHV0O1xuICAgIHZhciB0ZXN0cyA9IF9yZWY0LnRlc3RzO1xuXG4gICAgaWYgKGVycikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgaWYgKGNvbW1vbi5jaGFsbGVuZ2VUeXBlID09PSBjb21tb24uY2hhbGxlbmdlVHlwZXMuSFRNTCkge1xuICAgICAgICByZXR1cm4gY29tbW9uLnVwZGF0ZVByZXZpZXckKCdcXG4gICAgICAgICAgICAgIDxoMT4nICsgZXJyICsgJzwvaDE+XFxuICAgICAgICAgICAgJykuZmlyc3QoKS5zdWJzY3JpYmUoZnVuY3Rpb24gKCkge30pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNvbW1vbi51cGRhdGVPdXRwdXREaXNwbGF5KCcnICsgZXJyKTtcbiAgICB9XG4gICAgY29tbW9uLnVwZGF0ZU91dHB1dERpc3BsYXkob3V0cHV0KTtcbiAgICBjb21tb24uZGlzcGxheVRlc3RSZXN1bHRzKHRlc3RzKTtcbiAgICBpZiAoc29sdmVkKSB7XG4gICAgICBjb21tb24uc2hvd0NvbXBsZXRpb24oKTtcbiAgICB9XG4gIH0sIGZ1bmN0aW9uIChfcmVmNSkge1xuICAgIHZhciBlcnIgPSBfcmVmNS5lcnI7XG5cbiAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgY29tbW9uLnVwZGF0ZU91dHB1dERpc3BsYXkoJycgKyBlcnIpO1xuICB9KTtcblxuICAvLyBpbml0aWFsIGNoYWxsZW5nZSBydW4gdG8gcG9wdWxhdGUgdGVzdHNcbiAgaWYgKGNoYWxsZW5nZVR5cGUgPT09IGNoYWxsZW5nZVR5cGVzLkhUTUwpIHtcbiAgICB2YXIgJHByZXZpZXcgPSAkKCcjcHJldmlldycpO1xuICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb21DYWxsYmFjaygkcHJldmlldy5yZWFkeSwgJHByZXZpZXcpKCkuZGVsYXkoNTAwKS5mbGF0TWFwKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBjb21tb24uZXhlY3V0ZUNoYWxsZW5nZSQoKTtcbiAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICByZXR1cm4gT2JzZXJ2YWJsZS5qdXN0KHsgZXJyOiBlcnIgfSk7XG4gICAgfSkuc3Vic2NyaWJlKGZ1bmN0aW9uIChfcmVmNikge1xuICAgICAgdmFyIGVyciA9IF9yZWY2LmVycjtcbiAgICAgIHZhciB0ZXN0cyA9IF9yZWY2LnRlc3RzO1xuXG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgaWYgKGNvbW1vbi5jaGFsbGVuZ2VUeXBlID09PSBjb21tb24uY2hhbGxlbmdlVHlwZXMuSFRNTCkge1xuICAgICAgICAgIHJldHVybiBjb21tb24udXBkYXRlUHJldmlldyQoJ1xcbiAgICAgICAgICAgICAgICA8aDE+JyArIGVyciArICc8L2gxPlxcbiAgICAgICAgICAgICAgJykuc3Vic2NyaWJlKGZ1bmN0aW9uICgpIHt9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29tbW9uLnVwZGF0ZU91dHB1dERpc3BsYXkoJycgKyBlcnIpO1xuICAgICAgfVxuICAgICAgY29tbW9uLmRpc3BsYXlUZXN0UmVzdWx0cyh0ZXN0cyk7XG4gICAgfSwgZnVuY3Rpb24gKF9yZWY3KSB7XG4gICAgICB2YXIgZXJyID0gX3JlZjcuZXJyO1xuXG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgfSk7XG4gIH1cblxuICBpZiAoY2hhbGxlbmdlVHlwZSA9PT0gY2hhbGxlbmdlVHlwZXMuQk9ORklSRSB8fCBjaGFsbGVuZ2VUeXBlID09PSBjaGFsbGVuZ2VUeXBlcy5KUykge1xuICAgIE9ic2VydmFibGUuanVzdCh7fSkuZGVsYXkoNTAwKS5mbGF0TWFwKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBjb21tb24uZXhlY3V0ZUNoYWxsZW5nZSQoKTtcbiAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICByZXR1cm4gT2JzZXJ2YWJsZS5qdXN0KHsgZXJyOiBlcnIgfSk7XG4gICAgfSkuc3Vic2NyaWJlKGZ1bmN0aW9uIChfcmVmOCkge1xuICAgICAgdmFyIGVyciA9IF9yZWY4LmVycjtcbiAgICAgIHZhciBvcmlnaW5hbENvZGUgPSBfcmVmOC5vcmlnaW5hbENvZGU7XG4gICAgICB2YXIgdGVzdHMgPSBfcmVmOC50ZXN0cztcblxuICAgICAgaWYgKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgIHJldHVybiBjb21tb24udXBkYXRlT3V0cHV0RGlzcGxheSgnJyArIGVycik7XG4gICAgICB9XG4gICAgICBjb21tb24uY29kZVN0b3JhZ2UudXBkYXRlU3RvcmFnZShjaGFsbGVuZ2VOYW1lLCBvcmlnaW5hbENvZGUpO1xuICAgICAgY29tbW9uLmRpc3BsYXlUZXN0UmVzdWx0cyh0ZXN0cyk7XG4gICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgY29tbW9uLnVwZGF0ZU91dHB1dERpc3BsYXkoJycgKyBlcnIpO1xuICAgIH0pO1xuICB9XG59KTsiXSwic291cmNlUm9vdCI6Ii9jb21tb25GcmFtZXdvcmsifQ==
