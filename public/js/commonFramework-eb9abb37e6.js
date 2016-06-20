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
    }, '\n');
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
  var Mousetrap = global.Mousetrap;


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

    // set focus keybind
    Mousetrap.bind(['command+shift+e', 'ctrl+shift+e'], function () {
      common.editor.focus();
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

    $('.modal').on('show.bs.modal', function () {
      $('.gitter-chat-embed, .wiki-aside, .map-aside').addClass('is-collapsed');
    });

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

    $('#show-solution').on('click', function () {
      $('#complete-courseware-dialog').modal('hide');
      $('#nav-wiki-btn').click();
    });

    $('#challenge-help-btn').on('click', function () {
      $('.wiki-aside, .map-aside, #chat-embed-main').addClass('is-collapsed');
    });

    $('#help-ive-found-a-bug-wiki-article').on('click', function () {
      window.open('https://github.com/FreeCodeCamp/FreeCodeCamp/wiki/' + 'FreeCodeCamp-Report-Bugs', '_blank');
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
      return null;
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

  var libraryIncludes = '\n<script>\n  window.loopProtect = parent.loopProtect;\n  window.__err = null;\n  window.loopProtect.hit = function(line) {\n    window.__err = new Error(\n      \'Potential infinite loop at line \' +\n      line +\n      \'. To disable loop protection, write:\' +\n      \' \\n\\/\\/ noprotect\\nas the first\' +\n      \' line. Beware that if you do have an infinite loop in your code\' +\n      \' this will crash your browser.\'\n    );\n  };\n</script>\n<link\n  rel=\'stylesheet\'\n  href=\'//cdnjs.cloudflare.com/ajax/libs/animate.css/3.2.0/animate.min.css\'\n  />\n<link\n  rel=\'stylesheet\'\n  href=\'//maxcdn.bootstrapcdn.com/bootstrap/3.3.1/css/bootstrap.min.css\'\n  />\n\n<link\n  rel=\'stylesheet\'\n  href=\'//maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css\'\n  />\n<style>\n  body { padding: 0px 3px 0px 3px; }\n  /* FORM RESET: */\n  textarea,\n  select,\n  input[type="date"],\n  input[type="datetime"],\n  input[type="datetime-local"],\n  input[type="email"],\n  input[type="month"],\n  input[type="number"],\n  input[type="password"],\n  input[type="search"],\n  input[type="tel"],\n  input[type="text"],\n  input[type="time"],\n  input[type="url"],\n  input[type="week"] {\n    -webkit-box-sizing: border-box;\n    -moz-box-sizing: border-box;\n    box-sizing: border-box;\n    -webkit-background-clip: padding;\n    -moz-background-clip: padding;\n    background-clip:padding-box;\n    -webkit-border-radius:0;\n    -moz-border-radius:0;\n    -ms-border-radius:0;\n    -o-border-radius:0;\n    border-radius:0;\n    -webkit-appearance:none;\n    background-color:#fff;\n    color:#000;\n    outline:0;\n    margin:0;\n    padding:0;\n    text-align: left;\n    font-size:1em;\n    height: 1.8em;\n    vertical-align: middle;\n  }\n  select, select, select {\n    background:#fff\n    url(\'data:image/png;base64,R0lGODlhDQAEAIAAAAAAAP8A/yH5BAEHAAEALAAAAAANAAQAAAILhA+hG5jMDpxvhgIAOw==\');\n    background-repeat: no-repeat;\n    background-position: 97% center;\n    padding:0 25px 0 8px;\n    font-size: .875em;\n  }\n\n// ! FORM RESET\n</style>\n  ';
  var codeDisabledError = '\n    <script>\n      window.__err = new Error(\'code has been disabled\');\n    </script>\n  ';

  var iFrameScript$ = common.getScriptContent$('/js/iFrameScripts-40fbbe6a21.js').shareReplay();
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
    var editorValue = void 0;
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
      var output = void 0;

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

  codeOutput.setValue('/**\n  * Your output will go here.\n  * Any console.log() -type\n  * statements will appear in\n  * your browser\'s DevTools\n  * JavaScript console.\n  */');

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
        return setTimeout(function () {
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


  function submitChallengeHandler(e) {
    e.preventDefault();

    var solution = common.editor.getValue();

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
  }

  common.showCompletion = function showCompletion() {

    ga('send', 'event', 'Challenge', 'solved', common.gaName, true);

    $('#complete-courseware-dialog').modal('show');
    $('#complete-courseware-dialog .modal-header').click();

    $('#submit-challenge').off('click');
    $('#submit-challenge').on('click', submitChallengeHandler);
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
    return $.post(api).done(function (data) {
      // assume a boolean indicates passing
      if (typeof data === 'boolean') {
        return $el.parent().find('.disabled').removeClass('disabled');
      }
      // assume api returns string when fails
      return $el.parent().find('.disabled').replaceWith('<p class="col-sm-4 col-xs-12">' + data + '</p>');
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
    return null;
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
      return null;
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
    return null;
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
    return null;
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
      return null;
    }, function (_ref7) {
      var err = _ref7.err;

      console.error(err);
    });
  }

  if (challengeType === challengeTypes.BONFIRE || challengeType === challengeTypes.JS) {
    return Observable.just({}).delay(500).flatMap(function () {
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
      return null;
    }, function (err) {
      console.error(err);
      common.updateOutputDisplay('' + err);
    });
  }
  return null;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluaXQuanMiLCJiaW5kaW5ncy5qcyIsImNvZGUtc3RvcmFnZS5qcyIsImNvZGUtdXJpLmpzIiwiYWRkLWxvb3AtcHJvdGVjdC5qcyIsImdldC1pZnJhbWUuanMiLCJ1cGRhdGUtcHJldmlldy5qcyIsImNyZWF0ZS1lZGl0b3IuanMiLCJkZXRlY3QtdW5zYWZlLWNvZGUtc3RyZWFtLmpzIiwiZGlzcGxheS10ZXN0LXJlc3VsdHMuanMiLCJleGVjdXRlLWNoYWxsZW5nZS1zdHJlYW0uanMiLCJvdXRwdXQtZGlzcGxheS5qcyIsInBob25lLXNjcm9sbC1sb2NrLmpzIiwicmVwb3J0LWlzc3VlLmpzIiwicnVuLXRlc3RzLXN0cmVhbS5qcyIsInNob3ctY29tcGxldGlvbi5qcyIsInN0ZXAtY2hhbGxlbmdlLmpzIiwiZW5kLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJjb21tb25GcmFtZXdvcmsuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbndpbmRvdy5jb21tb24gPSBmdW5jdGlvbiAoZ2xvYmFsKSB7XG4gIC8vIGNvbW1vbiBuYW1lc3BhY2VcbiAgLy8gYWxsIGNsYXNzZXMgc2hvdWxkIGJlIHN0b3JlZCBoZXJlXG4gIC8vIGNhbGxlZCBhdCB0aGUgYmVnaW5uaW5nIG9mIGRvbSByZWFkeVxuICB2YXIgX2dsb2JhbCRSeCA9IGdsb2JhbC5SeDtcbiAgdmFyIERpc3Bvc2FibGUgPSBfZ2xvYmFsJFJ4LkRpc3Bvc2FibGU7XG4gIHZhciBPYnNlcnZhYmxlID0gX2dsb2JhbCRSeC5PYnNlcnZhYmxlO1xuICB2YXIgY29uZmlnID0gX2dsb2JhbCRSeC5jb25maWc7XG4gIHZhciBfZ2xvYmFsJGNvbW1vbiA9IGdsb2JhbC5jb21tb247XG4gIHZhciBjb21tb24gPSBfZ2xvYmFsJGNvbW1vbiA9PT0gdW5kZWZpbmVkID8geyBpbml0OiBbXSB9IDogX2dsb2JhbCRjb21tb247XG5cblxuICBjb25maWcubG9uZ1N0YWNrU3VwcG9ydCA9IHRydWU7XG4gIGNvbW1vbi5oZWFkID0gY29tbW9uLmhlYWQgfHwgW107XG4gIGNvbW1vbi50YWlsID0gY29tbW9uLnRhaWwgfHwgW107XG4gIGNvbW1vbi5zYWx0ID0gTWF0aC5yYW5kb20oKTtcblxuICBjb21tb24uY2hhbGxlbmdlVHlwZXMgPSB7XG4gICAgSFRNTDogJzAnLFxuICAgIEpTOiAnMScsXG4gICAgVklERU86ICcyJyxcbiAgICBaSVBMSU5FOiAnMycsXG4gICAgQkFTRUpVTVA6ICc0JyxcbiAgICBCT05GSVJFOiAnNScsXG4gICAgSElLRVM6ICc2JyxcbiAgICBTVEVQOiAnNydcbiAgfTtcblxuICBjb21tb24uYXJyYXlUb05ld0xpbmVTdHJpbmcgPSBmdW5jdGlvbiBhcnJheVRvTmV3TGluZVN0cmluZyhzZWVkRGF0YSkge1xuICAgIHNlZWREYXRhID0gQXJyYXkuaXNBcnJheShzZWVkRGF0YSkgPyBzZWVkRGF0YSA6IFtzZWVkRGF0YV07XG4gICAgcmV0dXJuIHNlZWREYXRhLnJlZHVjZShmdW5jdGlvbiAoc2VlZCwgbGluZSkge1xuICAgICAgcmV0dXJuICcnICsgc2VlZCArIGxpbmUgKyAnXFxuJztcbiAgICB9LCAnXFxuJyk7XG4gIH07XG5cbiAgY29tbW9uLnNlZWQgPSBjb21tb24uYXJyYXlUb05ld0xpbmVTdHJpbmcoY29tbW9uLmNoYWxsZW5nZVNlZWQpO1xuXG4gIGNvbW1vbi5yZXBsYWNlU2NyaXB0VGFncyA9IGZ1bmN0aW9uIHJlcGxhY2VTY3JpcHRUYWdzKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoLzxzY3JpcHQ+L2dpLCAnZmNjc3MnKS5yZXBsYWNlKC88XFwvc2NyaXB0Pi9naSwgJ2ZjY2VzJyk7XG4gIH07XG5cbiAgY29tbW9uLnJlcGxhY2VTYWZlVGFncyA9IGZ1bmN0aW9uIHJlcGxhY2VTYWZlVGFncyh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZS5yZXBsYWNlKC9mY2Nzcy9naSwgJzxzY3JpcHQ+JykucmVwbGFjZSgvZmNjZXMvZ2ksICc8L3NjcmlwdD4nKTtcbiAgfTtcblxuICBjb21tb24ucmVwbGFjZUZvcm1BY3Rpb25BdHRyID0gZnVuY3Rpb24gcmVwbGFjZUZvcm1BY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUucmVwbGFjZSgvPGZvcm1bXj5dKj4vLCBmdW5jdGlvbiAodmFsKSB7XG4gICAgICByZXR1cm4gdmFsLnJlcGxhY2UoL2FjdGlvbihcXHMqPyk9LywgJ2ZjY2ZhYSQxPScpO1xuICAgIH0pO1xuICB9O1xuXG4gIGNvbW1vbi5yZXBsYWNlRmNjZmFhQXR0ciA9IGZ1bmN0aW9uIHJlcGxhY2VGY2NmYWFBdHRyKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoLzxmb3JtW14+XSo+LywgZnVuY3Rpb24gKHZhbCkge1xuICAgICAgcmV0dXJuIHZhbC5yZXBsYWNlKC9mY2NmYWEoXFxzKj8pPS8sICdhY3Rpb24kMT0nKTtcbiAgICB9KTtcbiAgfTtcblxuICBjb21tb24uc2NvcGVqUXVlcnkgPSBmdW5jdGlvbiBzY29wZWpRdWVyeShzdHIpIHtcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoL1xcJC9naSwgJ2okJykucmVwbGFjZSgvZG9jdW1lbnQvZ2ksICdqZG9jdW1lbnQnKS5yZXBsYWNlKC9qUXVlcnkvZ2ksICdqalF1ZXJ5Jyk7XG4gIH07XG5cbiAgY29tbW9uLnVuU2NvcGVKUXVlcnkgPSBmdW5jdGlvbiB1blNjb3BlSlF1ZXJ5KHN0cikge1xuICAgIHJldHVybiBzdHIucmVwbGFjZSgvalxcJC9naSwgJyQnKS5yZXBsYWNlKC9qZG9jdW1lbnQvZ2ksICdkb2N1bWVudCcpLnJlcGxhY2UoL2pqUXVlcnkvZ2ksICdqUXVlcnknKTtcbiAgfTtcblxuICB2YXIgY29tbWVudFJlZ2V4ID0gLyhcXC9cXCpbXihcXCpcXC8pXSpcXCpcXC8pfChbIFxcbl1cXC9cXC9bXlxcbl0qKS9nO1xuICBjb21tb24ucmVtb3ZlQ29tbWVudHMgPSBmdW5jdGlvbiByZW1vdmVDb21tZW50cyhzdHIpIHtcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoY29tbWVudFJlZ2V4LCAnJyk7XG4gIH07XG5cbiAgdmFyIGxvZ1JlZ2V4ID0gLyhjb25zb2xlXFwuW1xcd10rXFxzKlxcKC4qXFw7KS9nO1xuICBjb21tb24ucmVtb3ZlTG9ncyA9IGZ1bmN0aW9uIHJlbW92ZUxvZ3Moc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKGxvZ1JlZ2V4LCAnJyk7XG4gIH07XG5cbiAgY29tbW9uLnJlYXNzZW1ibGVUZXN0ID0gZnVuY3Rpb24gcmVhc3NlbWJsZVRlc3QoKSB7XG4gICAgdmFyIGNvZGUgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyAnJyA6IGFyZ3VtZW50c1swXTtcbiAgICB2YXIgX3JlZiA9IGFyZ3VtZW50c1sxXTtcbiAgICB2YXIgbGluZSA9IF9yZWYubGluZTtcbiAgICB2YXIgdGV4dCA9IF9yZWYudGV4dDtcblxuICAgIHZhciByZWdleHAgPSBuZXcgUmVnRXhwKCcvLycgKyBsaW5lICsgY29tbW9uLnNhbHQpO1xuICAgIHJldHVybiBjb2RlLnJlcGxhY2UocmVnZXhwLCB0ZXh0KTtcbiAgfTtcblxuICBjb21tb24uZ2V0U2NyaXB0Q29udGVudCQgPSBmdW5jdGlvbiBnZXRTY3JpcHRDb250ZW50JChzY3JpcHQpIHtcbiAgICByZXR1cm4gT2JzZXJ2YWJsZS5jcmVhdGUoZnVuY3Rpb24gKG9ic2VydmVyKSB7XG4gICAgICB2YXIganFYSFIgPSAkLmdldChzY3JpcHQsIG51bGwsIG51bGwsICd0ZXh0Jykuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICBvYnNlcnZlci5vbk5leHQoZGF0YSk7XG4gICAgICAgIG9ic2VydmVyLm9uQ29tcGxldGVkKCk7XG4gICAgICB9KS5mYWlsKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHJldHVybiBvYnNlcnZlci5vbkVycm9yKGUpO1xuICAgICAgfSkuYWx3YXlzKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG9ic2VydmVyLm9uQ29tcGxldGVkKCk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIG5ldyBEaXNwb3NhYmxlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAganFYSFIuYWJvcnQoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIHZhciBvcGVuU2NyaXB0ID0gL1xcPFxccz9zY3JpcHRcXHM/XFw+L2dpO1xuICB2YXIgY2xvc2luZ1NjcmlwdCA9IC9cXDxcXHM/XFwvXFxzP3NjcmlwdFxccz9cXD4vZ2k7XG5cbiAgLy8gZGV0ZWN0cyBpZiB0aGVyZSBpcyBKYXZhU2NyaXB0IGluIHRoZSBmaXJzdCBzY3JpcHQgdGFnXG4gIGNvbW1vbi5oYXNKcyA9IGZ1bmN0aW9uIGhhc0pzKGNvZGUpIHtcbiAgICByZXR1cm4gISFjb21tb24uZ2V0SnNGcm9tSHRtbChjb2RlKTtcbiAgfTtcblxuICAvLyBncmFicyB0aGUgY29udGVudCBmcm9tIHRoZSBmaXJzdCBzY3JpcHQgdGFnIGluIHRoZSBjb2RlXG4gIGNvbW1vbi5nZXRKc0Zyb21IdG1sID0gZnVuY3Rpb24gZ2V0SnNGcm9tSHRtbChjb2RlKSB7XG4gICAgLy8gZ3JhYiB1c2VyIGphdmFTY3JpcHRcbiAgICByZXR1cm4gKGNvZGUuc3BsaXQob3BlblNjcmlwdClbMV0gfHwgJycpLnNwbGl0KGNsb3NpbmdTY3JpcHQpWzBdIHx8ICcnO1xuICB9O1xuXG4gIHJldHVybiBjb21tb247XG59KHdpbmRvdyk7IiwiJ3VzZSBzdHJpY3QnO1xuXG53aW5kb3cuY29tbW9uID0gZnVuY3Rpb24gKGdsb2JhbCkge1xuICB2YXIgJCA9IGdsb2JhbC4kO1xuICB2YXIgT2JzZXJ2YWJsZSA9IGdsb2JhbC5SeC5PYnNlcnZhYmxlO1xuICB2YXIgX2dsb2JhbCRjb21tb24gPSBnbG9iYWwuY29tbW9uO1xuICB2YXIgY29tbW9uID0gX2dsb2JhbCRjb21tb24gPT09IHVuZGVmaW5lZCA/IHsgaW5pdDogW10gfSA6IF9nbG9iYWwkY29tbW9uO1xuICB2YXIgTW91c2V0cmFwID0gZ2xvYmFsLk1vdXNldHJhcDtcblxuXG4gIGNvbW1vbi5jdHJsRW50ZXJDbGlja0hhbmRsZXIgPSBmdW5jdGlvbiBjdHJsRW50ZXJDbGlja0hhbmRsZXIoZSkge1xuICAgIC8vIGN0cmwgKyBlbnRlciBvciBjbWQgKyBlbnRlclxuICAgIGlmIChlLmtleUNvZGUgPT09IDEzICYmIChlLm1ldGFLZXkgfHwgZS5jdHJsS2V5KSkge1xuICAgICAgJCgnI2NvbXBsZXRlLWNvdXJzZXdhcmUtZGlhbG9nJykub2ZmKCdrZXlkb3duJywgY3RybEVudGVyQ2xpY2tIYW5kbGVyKTtcbiAgICAgIGlmICgkKCcjc3VibWl0LWNoYWxsZW5nZScpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgJCgnI3N1Ym1pdC1jaGFsbGVuZ2UnKS5jbGljaygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uID0gJy9jaGFsbGVuZ2VzL25leHQtY2hhbGxlbmdlP2lkPScgKyBjb21tb24uY2hhbGxlbmdlSWQ7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGNvbW1vbi5pbml0LnB1c2goZnVuY3Rpb24gKCQpIHtcblxuICAgIHZhciAkbWFyZ2luRml4ID0gJCgnLmlubmVyTWFyZ2luRml4Jyk7XG4gICAgJG1hcmdpbkZpeC5jc3MoJ21pbi1oZWlnaHQnLCAkbWFyZ2luRml4LmhlaWdodCgpKTtcblxuICAgIGNvbW1vbi5zdWJtaXRCdG4kID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQoJCgnI3N1Ym1pdEJ1dHRvbicpLCAnY2xpY2snKTtcblxuICAgIGNvbW1vbi5yZXNldEJ0biQgPSBPYnNlcnZhYmxlLmZyb21FdmVudCgkKCcjcmVzZXQtYnV0dG9uJyksICdjbGljaycpO1xuXG4gICAgLy8gaW5pdCBtb2RhbCBrZXliaW5kaW5ncyBvbiBvcGVuXG4gICAgJCgnI2NvbXBsZXRlLWNvdXJzZXdhcmUtZGlhbG9nJykub24oJ3Nob3duLmJzLm1vZGFsJywgZnVuY3Rpb24gKCkge1xuICAgICAgJCgnI2NvbXBsZXRlLWNvdXJzZXdhcmUtZGlhbG9nJykua2V5ZG93bihjb21tb24uY3RybEVudGVyQ2xpY2tIYW5kbGVyKTtcbiAgICB9KTtcblxuICAgIC8vIHJlbW92ZSBtb2RhbCBrZXliaW5kcyBvbiBjbG9zZVxuICAgICQoJyNjb21wbGV0ZS1jb3Vyc2V3YXJlLWRpYWxvZycpLm9uKCdoaWRkZW4uYnMubW9kYWwnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcjY29tcGxldGUtY291cnNld2FyZS1kaWFsb2cnKS5vZmYoJ2tleWRvd24nLCBjb21tb24uY3RybEVudGVyQ2xpY2tIYW5kbGVyKTtcbiAgICB9KTtcblxuICAgIC8vIHNldCBmb2N1cyBrZXliaW5kXG4gICAgTW91c2V0cmFwLmJpbmQoWydjb21tYW5kK3NoaWZ0K2UnLCAnY3RybCtzaGlmdCtlJ10sIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbW1vbi5lZGl0b3IuZm9jdXMoKTtcbiAgICB9KTtcblxuICAgIC8vIHZpZGVvIGNoZWNrbGlzdCBiaW5kaW5nXG4gICAgJCgnLmNoYWxsZW5nZS1saXN0LWNoZWNrYm94Jykub24oJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBjaGVja2JveElkID0gJCh0aGlzKS5wYXJlbnQoKS5wYXJlbnQoKS5hdHRyKCdpZCcpO1xuICAgICAgaWYgKCQodGhpcykuaXMoJzpjaGVja2VkJykpIHtcbiAgICAgICAgJCh0aGlzKS5wYXJlbnQoKS5zaWJsaW5ncygpLmNoaWxkcmVuKCkuYWRkQ2xhc3MoJ2ZhZGVkJyk7XG4gICAgICAgIGlmICghbG9jYWxTdG9yYWdlIHx8ICFsb2NhbFN0b3JhZ2VbY2hlY2tib3hJZF0pIHtcbiAgICAgICAgICBsb2NhbFN0b3JhZ2VbY2hlY2tib3hJZF0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghJCh0aGlzKS5pcygnOmNoZWNrZWQnKSkge1xuICAgICAgICAkKHRoaXMpLnBhcmVudCgpLnNpYmxpbmdzKCkuY2hpbGRyZW4oKS5yZW1vdmVDbGFzcygnZmFkZWQnKTtcbiAgICAgICAgaWYgKGxvY2FsU3RvcmFnZVtjaGVja2JveElkXSkge1xuICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGNoZWNrYm94SWQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAkKCcuY2hlY2tsaXN0LWVsZW1lbnQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBjaGVja2xpc3RFbGVtZW50SWQgPSAkKHRoaXMpLmF0dHIoJ2lkJyk7XG4gICAgICBpZiAobG9jYWxTdG9yYWdlW2NoZWNrbGlzdEVsZW1lbnRJZF0pIHtcbiAgICAgICAgJCh0aGlzKS5jaGlsZHJlbigpLmNoaWxkcmVuKCdsaScpLmFkZENsYXNzKCdmYWRlZCcpO1xuICAgICAgICAkKHRoaXMpLmNoaWxkcmVuKCkuY2hpbGRyZW4oJ2lucHV0JykudHJpZ2dlcignY2xpY2snKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIHZpZGVvIGNoYWxsZW5nZSBzdWJtaXRcbiAgICAkKCcjbmV4dC1jb3Vyc2V3YXJlLWJ1dHRvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICQoJyNuZXh0LWNvdXJzZXdhcmUtYnV0dG9uJykudW5iaW5kKCdjbGljaycpO1xuICAgICAgaWYgKCQoJy5zaWdudXAtYnRuLW5hdicpLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgdmFyIGRhdGE7XG4gICAgICAgIHZhciBzb2x1dGlvbiA9ICQoJyNwdWJsaWMtdXJsJykudmFsKCkgfHwgbnVsbDtcbiAgICAgICAgdmFyIGdpdGh1YkxpbmsgPSAkKCcjZ2l0aHViLXVybCcpLnZhbCgpIHx8IG51bGw7XG4gICAgICAgIHN3aXRjaCAoY29tbW9uLmNoYWxsZW5nZVR5cGUpIHtcbiAgICAgICAgICBjYXNlIGNvbW1vbi5jaGFsbGVuZ2VUeXBlcy5WSURFTzpcbiAgICAgICAgICAgIGRhdGEgPSB7XG4gICAgICAgICAgICAgIGlkOiBjb21tb24uY2hhbGxlbmdlSWQsXG4gICAgICAgICAgICAgIG5hbWU6IGNvbW1vbi5jaGFsbGVuZ2VOYW1lLFxuICAgICAgICAgICAgICBjaGFsbGVuZ2VUeXBlOiArY29tbW9uLmNoYWxsZW5nZVR5cGVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICB1cmw6ICcvY29tcGxldGVkLWNoYWxsZW5nZS8nLFxuICAgICAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KGRhdGEpLFxuICAgICAgICAgICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nXG4gICAgICAgICAgICB9KS5zdWNjZXNzKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgICAgICAgaWYgKCFyZXMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSAnL2NoYWxsZW5nZXMvbmV4dC1jaGFsbGVuZ2U/aWQ9JyArIGNvbW1vbi5jaGFsbGVuZ2VJZDtcbiAgICAgICAgICAgIH0pLmZhaWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVwbGFjZSh3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBjb21tb24uY2hhbGxlbmdlVHlwZXMuQkFTRUpVTVA6XG4gICAgICAgICAgY2FzZSBjb21tb24uY2hhbGxlbmdlVHlwZXMuWklQTElORTpcbiAgICAgICAgICAgIGRhdGEgPSB7XG4gICAgICAgICAgICAgIGlkOiBjb21tb24uY2hhbGxlbmdlSWQsXG4gICAgICAgICAgICAgIG5hbWU6IGNvbW1vbi5jaGFsbGVuZ2VOYW1lLFxuICAgICAgICAgICAgICBjaGFsbGVuZ2VUeXBlOiArY29tbW9uLmNoYWxsZW5nZVR5cGUsXG4gICAgICAgICAgICAgIHNvbHV0aW9uOiBzb2x1dGlvbixcbiAgICAgICAgICAgICAgZ2l0aHViTGluazogZ2l0aHViTGlua1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgdXJsOiAnL2NvbXBsZXRlZC16aXBsaW5lLW9yLWJhc2VqdW1wLycsXG4gICAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoZGF0YSksXG4gICAgICAgICAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICAgICAgICAgIH0pLnN1Y2Nlc3MoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9ICcvY2hhbGxlbmdlcy9uZXh0LWNoYWxsZW5nZT9pZD0nICsgY29tbW9uLmNoYWxsZW5nZUlkO1xuICAgICAgICAgICAgfSkuZmFpbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZXBsYWNlKHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIGNvbW1vbi5jaGFsbGVuZ2VUeXBlcy5CT05GSVJFOlxuICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSAnL2NoYWxsZW5nZXMvbmV4dC1jaGFsbGVuZ2U/aWQ9JyArIGNvbW1vbi5jaGFsbGVuZ2VJZDtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdIYXBweSBDb2RpbmchJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKGNvbW1vbi5jaGFsbGVuZ2VOYW1lKSB7XG4gICAgICB3aW5kb3cuZ2EoJ3NlbmQnLCAnZXZlbnQnLCAnQ2hhbGxlbmdlJywgJ2xvYWQnLCBjb21tb24uZ2FOYW1lKTtcbiAgICB9XG5cbiAgICAkKCcubW9kYWwnKS5vbignc2hvdy5icy5tb2RhbCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICQoJy5naXR0ZXItY2hhdC1lbWJlZCwgLndpa2ktYXNpZGUsIC5tYXAtYXNpZGUnKS5hZGRDbGFzcygnaXMtY29sbGFwc2VkJyk7XG4gICAgfSk7XG5cbiAgICAkKCcjY29tcGxldGUtY291cnNld2FyZS1kaWFsb2cnKS5vbignaGlkZGVuLmJzLm1vZGFsJywgZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKGNvbW1vbi5lZGl0b3IuZm9jdXMpIHtcbiAgICAgICAgY29tbW9uLmVkaXRvci5mb2N1cygpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgJCgnI3RyaWdnZXItaXNzdWUtbW9kYWwnKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcjaXNzdWUtbW9kYWwnKS5tb2RhbCgnc2hvdycpO1xuICAgIH0pO1xuXG4gICAgJCgnI3RyaWdnZXItaGVscC1tb2RhbCcpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICQoJyNoZWxwLW1vZGFsJykubW9kYWwoJ3Nob3cnKTtcbiAgICB9KTtcblxuICAgICQoJyN0cmlnZ2VyLXJlc2V0LW1vZGFsJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgJCgnI3Jlc2V0LW1vZGFsJykubW9kYWwoJ3Nob3cnKTtcbiAgICB9KTtcblxuICAgICQoJyN0cmlnZ2VyLXBhaXItbW9kYWwnKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcjcGFpci1tb2RhbCcpLm1vZGFsKCdzaG93Jyk7XG4gICAgfSk7XG5cbiAgICAkKCcjY29tcGxldGVkLWNvdXJzZXdhcmUnKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcjY29tcGxldGUtY291cnNld2FyZS1kaWFsb2cnKS5tb2RhbCgnc2hvdycpO1xuICAgIH0pO1xuXG4gICAgJCgnI3Nob3ctc29sdXRpb24nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcjY29tcGxldGUtY291cnNld2FyZS1kaWFsb2cnKS5tb2RhbCgnaGlkZScpO1xuICAgICAgJCgnI25hdi13aWtpLWJ0bicpLmNsaWNrKCk7XG4gICAgfSk7XG5cbiAgICAkKCcjY2hhbGxlbmdlLWhlbHAtYnRuJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgJCgnLndpa2ktYXNpZGUsIC5tYXAtYXNpZGUsICNjaGF0LWVtYmVkLW1haW4nKS5hZGRDbGFzcygnaXMtY29sbGFwc2VkJyk7XG4gICAgfSk7XG5cbiAgICAkKCcjaGVscC1pdmUtZm91bmQtYS1idWctd2lraS1hcnRpY2xlJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgd2luZG93Lm9wZW4oJ2h0dHBzOi8vZ2l0aHViLmNvbS9GcmVlQ29kZUNhbXAvRnJlZUNvZGVDYW1wL3dpa2kvJyArICdGcmVlQ29kZUNhbXAtUmVwb3J0LUJ1Z3MnLCAnX2JsYW5rJyk7XG4gICAgfSk7XG5cbiAgICAkKCcjc2VhcmNoLWlzc3VlJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHF1ZXJ5SXNzdWUgPSB3aW5kb3cubG9jYXRpb24uaHJlZi50b1N0cmluZygpLnNwbGl0KCc/JylbMF0ucmVwbGFjZSgvKCMqKSQvLCAnJyk7XG4gICAgICB3aW5kb3cub3BlbignaHR0cHM6Ly9naXRodWIuY29tL0ZyZWVDb2RlQ2FtcC9GcmVlQ29kZUNhbXAvaXNzdWVzP3E9JyArICdpczppc3N1ZSBpczphbGwgJyArIGNvbW1vbi5jaGFsbGVuZ2VOYW1lICsgJyBPUiAnICsgcXVlcnlJc3N1ZS5zdWJzdHIocXVlcnlJc3N1ZS5sYXN0SW5kZXhPZignY2hhbGxlbmdlcy8nKSArIDExKS5yZXBsYWNlKCcvJywgJycpLCAnX2JsYW5rJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiBjb21tb247XG59KHdpbmRvdyk7IiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBkZXBlbmRzIG9uOiBjb2RlVXJpXG53aW5kb3cuY29tbW9uID0gZnVuY3Rpb24gKGdsb2JhbCkge1xuICB2YXIgbG9jYWxTdG9yYWdlID0gZ2xvYmFsLmxvY2FsU3RvcmFnZTtcbiAgdmFyIF9nbG9iYWwkY29tbW9uID0gZ2xvYmFsLmNvbW1vbjtcbiAgdmFyIGNvbW1vbiA9IF9nbG9iYWwkY29tbW9uID09PSB1bmRlZmluZWQgPyB7IGluaXQ6IFtdIH0gOiBfZ2xvYmFsJGNvbW1vbjtcblxuXG4gIHZhciBjaGFsbGVuZ2VQcmVmaXggPSBbJ0JvbmZpcmU6ICcsICdXYXlwb2ludDogJywgJ1ppcGxpbmU6ICcsICdCYXNlanVtcDogJywgJ0NoZWNrcG9pbnQ6ICddLFxuICAgICAgaXRlbTtcblxuICB2YXIgY29kZVN0b3JhZ2UgPSB7XG4gICAgZ2V0U3RvcmVkVmFsdWU6IGZ1bmN0aW9uIGdldFN0b3JlZFZhbHVlKGtleSkge1xuICAgICAgaWYgKCFsb2NhbFN0b3JhZ2UgfHwgdHlwZW9mIGxvY2FsU3RvcmFnZS5nZXRJdGVtICE9PSAnZnVuY3Rpb24nIHx8ICFrZXkgfHwgdHlwZW9mIGtleSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ3VuYWJsZSB0byByZWFkIGZyb20gc3RvcmFnZScpO1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgICB9XG4gICAgICBpZiAobG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5ICsgJ1ZhbCcpKSB7XG4gICAgICAgIHJldHVybiAnJyArIGxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSArICdWYWwnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IGNoYWxsZW5nZVByZWZpeC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGl0ZW0gPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShjaGFsbGVuZ2VQcmVmaXhbaV0gKyBrZXkgKyAnVmFsJyk7XG4gICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgIHJldHVybiAnJyArIGl0ZW07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9LFxuXG5cbiAgICBpc0FsaXZlOiBmdW5jdGlvbiBpc0FsaXZlKGtleSkge1xuICAgICAgdmFyIHZhbCA9IHRoaXMuZ2V0U3RvcmVkVmFsdWUoa2V5KTtcbiAgICAgIHJldHVybiB2YWwgIT09ICdudWxsJyAmJiB2YWwgIT09ICd1bmRlZmluZWQnICYmIHZhbCAmJiB2YWwubGVuZ3RoID4gMDtcbiAgICB9LFxuXG4gICAgdXBkYXRlU3RvcmFnZTogZnVuY3Rpb24gdXBkYXRlU3RvcmFnZShrZXksIGNvZGUpIHtcbiAgICAgIGlmICghbG9jYWxTdG9yYWdlIHx8IHR5cGVvZiBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSAhPT0gJ2Z1bmN0aW9uJyB8fCAha2V5IHx8IHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCd1bmFibGUgdG8gc2F2ZSB0byBzdG9yYWdlJyk7XG4gICAgICAgIHJldHVybiBjb2RlO1xuICAgICAgfVxuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5ICsgJ1ZhbCcsIGNvZGUpO1xuICAgICAgcmV0dXJuIGNvZGU7XG4gICAgfVxuICB9O1xuXG4gIGNvbW1vbi5jb2RlU3RvcmFnZSA9IGNvZGVTdG9yYWdlO1xuXG4gIHJldHVybiBjb21tb247XG59KHdpbmRvdywgd2luZG93LmNvbW1vbik7IiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBzdG9yZSBjb2RlIGluIHRoZSBVUkxcbndpbmRvdy5jb21tb24gPSBmdW5jdGlvbiAoZ2xvYmFsKSB7XG4gIHZhciBfZW5jb2RlID0gZ2xvYmFsLmVuY29kZVVSSUNvbXBvbmVudDtcbiAgdmFyIF9kZWNvZGUgPSBnbG9iYWwuZGVjb2RlVVJJQ29tcG9uZW50O1xuICB2YXIgbG9jYXRpb24gPSBnbG9iYWwubG9jYXRpb247XG4gIHZhciBoaXN0b3J5ID0gZ2xvYmFsLmhpc3Rvcnk7XG4gIHZhciBfZ2xvYmFsJGNvbW1vbiA9IGdsb2JhbC5jb21tb247XG4gIHZhciBjb21tb24gPSBfZ2xvYmFsJGNvbW1vbiA9PT0gdW5kZWZpbmVkID8geyBpbml0OiBbXSB9IDogX2dsb2JhbCRjb21tb247XG4gIHZhciByZXBsYWNlU2NyaXB0VGFncyA9IGNvbW1vbi5yZXBsYWNlU2NyaXB0VGFncztcbiAgdmFyIHJlcGxhY2VTYWZlVGFncyA9IGNvbW1vbi5yZXBsYWNlU2FmZVRhZ3M7XG4gIHZhciByZXBsYWNlRm9ybUFjdGlvbkF0dHIgPSBjb21tb24ucmVwbGFjZUZvcm1BY3Rpb25BdHRyO1xuICB2YXIgcmVwbGFjZUZjY2ZhYUF0dHIgPSBjb21tb24ucmVwbGFjZUZjY2ZhYUF0dHI7XG5cblxuICB2YXIgcXVlcnlSZWdleCA9IC9eKFxcP3wjXFw/KS87XG4gIGZ1bmN0aW9uIGVuY29kZUZjYyh2YWwpIHtcbiAgICByZXR1cm4gcmVwbGFjZVNjcmlwdFRhZ3MocmVwbGFjZUZvcm1BY3Rpb25BdHRyKHZhbCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVjb2RlRmNjKHZhbCkge1xuICAgIHJldHVybiByZXBsYWNlU2FmZVRhZ3MocmVwbGFjZUZjY2ZhYUF0dHIodmFsKSk7XG4gIH1cblxuICB2YXIgY29kZVVyaSA9IHtcbiAgICBlbmNvZGU6IGZ1bmN0aW9uIGVuY29kZShjb2RlKSB7XG4gICAgICByZXR1cm4gX2VuY29kZShjb2RlKTtcbiAgICB9LFxuICAgIGRlY29kZTogZnVuY3Rpb24gZGVjb2RlKGNvZGUpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBfZGVjb2RlKGNvZGUpO1xuICAgICAgfSBjYXRjaCAoaWdub3JlKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH0sXG4gICAgaXNJblF1ZXJ5OiBmdW5jdGlvbiBpc0luUXVlcnkocXVlcnkpIHtcbiAgICAgIHZhciBkZWNvZGVkID0gY29kZVVyaS5kZWNvZGUocXVlcnkpO1xuICAgICAgaWYgKCFkZWNvZGVkIHx8IHR5cGVvZiBkZWNvZGVkLnNwbGl0ICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZWNvZGVkLnJlcGxhY2UocXVlcnlSZWdleCwgJycpLnNwbGl0KCcmJykucmVkdWNlKGZ1bmN0aW9uIChmb3VuZCwgcGFyYW0pIHtcbiAgICAgICAgdmFyIGtleSA9IHBhcmFtLnNwbGl0KCc9JylbMF07XG4gICAgICAgIGlmIChrZXkgPT09ICdzb2x1dGlvbicpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZm91bmQ7XG4gICAgICB9LCBmYWxzZSk7XG4gICAgfSxcbiAgICBpc0FsaXZlOiBmdW5jdGlvbiBpc0FsaXZlKCkge1xuICAgICAgcmV0dXJuIGNvZGVVcmkuZW5hYmxlZCAmJiBjb2RlVXJpLmlzSW5RdWVyeShsb2NhdGlvbi5zZWFyY2gpIHx8IGNvZGVVcmkuaXNJblF1ZXJ5KGxvY2F0aW9uLmhhc2gpO1xuICAgIH0sXG4gICAgZ2V0S2V5SW5RdWVyeTogZnVuY3Rpb24gZ2V0S2V5SW5RdWVyeShxdWVyeSkge1xuICAgICAgdmFyIGtleVRvRmluZCA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMSB8fCBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/ICcnIDogYXJndW1lbnRzWzFdO1xuXG4gICAgICByZXR1cm4gcXVlcnkuc3BsaXQoJyYnKS5yZWR1Y2UoZnVuY3Rpb24gKG9sZFZhbHVlLCBwYXJhbSkge1xuICAgICAgICB2YXIga2V5ID0gcGFyYW0uc3BsaXQoJz0nKVswXTtcbiAgICAgICAgdmFyIHZhbHVlID0gcGFyYW0uc3BsaXQoJz0nKS5zbGljZSgxKS5qb2luKCc9Jyk7XG5cbiAgICAgICAgaWYgKGtleSA9PT0ga2V5VG9GaW5kKSB7XG4gICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvbGRWYWx1ZTtcbiAgICAgIH0sIG51bGwpO1xuICAgIH0sXG4gICAgZ2V0U29sdXRpb25Gcm9tUXVlcnk6IGZ1bmN0aW9uIGdldFNvbHV0aW9uRnJvbVF1ZXJ5KCkge1xuICAgICAgdmFyIHF1ZXJ5ID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gJycgOiBhcmd1bWVudHNbMF07XG5cbiAgICAgIHJldHVybiBkZWNvZGVGY2MoY29kZVVyaS5kZWNvZGUoY29kZVVyaS5nZXRLZXlJblF1ZXJ5KHF1ZXJ5LCAnc29sdXRpb24nKSkpO1xuICAgIH0sXG5cbiAgICBwYXJzZTogZnVuY3Rpb24gcGFyc2UoKSB7XG4gICAgICBpZiAoIWNvZGVVcmkuZW5hYmxlZCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIHZhciBxdWVyeTtcbiAgICAgIGlmIChsb2NhdGlvbi5zZWFyY2ggJiYgY29kZVVyaS5pc0luUXVlcnkobG9jYXRpb24uc2VhcmNoKSkge1xuICAgICAgICBxdWVyeSA9IGxvY2F0aW9uLnNlYXJjaC5yZXBsYWNlKC9eXFw/LywgJycpO1xuXG4gICAgICAgIGlmIChoaXN0b3J5ICYmIHR5cGVvZiBoaXN0b3J5LnJlcGxhY2VTdGF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGhpc3RvcnkucmVwbGFjZVN0YXRlKGhpc3Rvcnkuc3RhdGUsIG51bGwsIGxvY2F0aW9uLmhyZWYuc3BsaXQoJz8nKVswXSk7XG4gICAgICAgICAgbG9jYXRpb24uaGFzaCA9ICcjPycgKyBlbmNvZGVGY2MocXVlcnkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBxdWVyeSA9IGxvY2F0aW9uLmhhc2gucmVwbGFjZSgvXlxcI1xcPy8sICcnKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFxdWVyeSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuZ2V0U29sdXRpb25Gcm9tUXVlcnkocXVlcnkpO1xuICAgIH0sXG4gICAgcXVlcmlmeTogZnVuY3Rpb24gcXVlcmlmeShzb2x1dGlvbikge1xuICAgICAgaWYgKCFjb2RlVXJpLmVuYWJsZWQpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBpZiAoaGlzdG9yeSAmJiB0eXBlb2YgaGlzdG9yeS5yZXBsYWNlU3RhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gZ3JhYiB0aGUgdXJsIHVwIHRvIHRoZSBxdWVyeVxuICAgICAgICAvLyBkZXN0cm95IGFueSBoYXNoIHN5bWJvbHMgc3RpbGwgY2xpbmdpbmcgdG8gbGlmZVxuICAgICAgICB2YXIgdXJsID0gbG9jYXRpb24uaHJlZi5zcGxpdCgnPycpWzBdLnJlcGxhY2UoLygjKikkLywgJycpO1xuICAgICAgICBoaXN0b3J5LnJlcGxhY2VTdGF0ZShoaXN0b3J5LnN0YXRlLCBudWxsLCB1cmwgKyAnIz8nICsgKGNvZGVVcmkuc2hvdWxkUnVuKCkgPyAnJyA6ICdydW49ZGlzYWJsZWQmJykgKyAnc29sdXRpb249JyArIGNvZGVVcmkuZW5jb2RlKGVuY29kZUZjYyhzb2x1dGlvbikpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxvY2F0aW9uLmhhc2ggPSAnP3NvbHV0aW9uPScgKyBjb2RlVXJpLmVuY29kZShlbmNvZGVGY2Moc29sdXRpb24pKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNvbHV0aW9uO1xuICAgIH0sXG4gICAgZW5hYmxlZDogdHJ1ZSxcbiAgICBzaG91bGRSdW46IGZ1bmN0aW9uIHNob3VsZFJ1bigpIHtcbiAgICAgIHJldHVybiAhdGhpcy5nZXRLZXlJblF1ZXJ5KChsb2NhdGlvbi5zZWFyY2ggfHwgbG9jYXRpb24uaGFzaCkucmVwbGFjZShxdWVyeVJlZ2V4LCAnJyksICdydW4nKTtcbiAgICB9XG4gIH07XG5cbiAgY29tbW9uLmluaXQucHVzaChmdW5jdGlvbiAoKSB7XG4gICAgY29kZVVyaS5wYXJzZSgpO1xuICB9KTtcblxuICBjb21tb24uY29kZVVyaSA9IGNvZGVVcmk7XG4gIGNvbW1vbi5zaG91bGRSdW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGNvZGVVcmkuc2hvdWxkUnVuKCk7XG4gIH07XG5cbiAgcmV0dXJuIGNvbW1vbjtcbn0od2luZG93KTsiLCIndXNlIHN0cmljdCc7XG5cbndpbmRvdy5jb21tb24gPSBmdW5jdGlvbiAoZ2xvYmFsKSB7XG4gIHZhciBsb29wUHJvdGVjdCA9IGdsb2JhbC5sb29wUHJvdGVjdDtcbiAgdmFyIF9nbG9iYWwkY29tbW9uID0gZ2xvYmFsLmNvbW1vbjtcbiAgdmFyIGNvbW1vbiA9IF9nbG9iYWwkY29tbW9uID09PSB1bmRlZmluZWQgPyB7IGluaXQ6IFtdIH0gOiBfZ2xvYmFsJGNvbW1vbjtcblxuXG4gIGxvb3BQcm90ZWN0LmhpdCA9IGZ1bmN0aW9uIGhpdChsaW5lKSB7XG4gICAgdmFyIGVyciA9ICdFcnJvcjogRXhpdGluZyBwb3RlbnRpYWwgaW5maW5pdGUgbG9vcCBhdCBsaW5lICcgKyBsaW5lICsgJy4gVG8gZGlzYWJsZSBsb29wIHByb3RlY3Rpb24sIHdyaXRlOiBcXG5cXFxcL1xcXFwvIG5vcHJvdGVjdFxcbmFzIHRoZSBmaXJzdCcgKyAnbGluZS4gQmV3YXJlIHRoYXQgaWYgeW91IGRvIGhhdmUgYW4gaW5maW5pdGUgbG9vcCBpbiB5b3VyIGNvZGUnICsgJ3RoaXMgd2lsbCBjcmFzaCB5b3VyIGJyb3dzZXIuJztcbiAgICBjb25zb2xlLmVycm9yKGVycik7XG4gIH07XG5cbiAgY29tbW9uLmFkZExvb3BQcm90ZWN0ID0gZnVuY3Rpb24gYWRkTG9vcFByb3RlY3QoKSB7XG4gICAgdmFyIGNvZGUgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyAnJyA6IGFyZ3VtZW50c1swXTtcblxuICAgIHJldHVybiBsb29wUHJvdGVjdChjb2RlKTtcbiAgfTtcblxuICByZXR1cm4gY29tbW9uO1xufSh3aW5kb3cpOyIsIid1c2Ugc3RyaWN0Jztcblxud2luZG93LmNvbW1vbiA9IGZ1bmN0aW9uIChnbG9iYWwpIHtcbiAgdmFyIF9nbG9iYWwkY29tbW9uID0gZ2xvYmFsLmNvbW1vbjtcbiAgdmFyIGNvbW1vbiA9IF9nbG9iYWwkY29tbW9uID09PSB1bmRlZmluZWQgPyB7IGluaXQ6IFtdIH0gOiBfZ2xvYmFsJGNvbW1vbjtcbiAgdmFyIGRvYyA9IGdsb2JhbC5kb2N1bWVudDtcblxuXG4gIGNvbW1vbi5nZXRJZnJhbWUgPSBmdW5jdGlvbiBnZXRJZnJhbWUoKSB7XG4gICAgdmFyIGlkID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gJ3ByZXZpZXcnIDogYXJndW1lbnRzWzBdO1xuXG4gICAgdmFyIHByZXZpZXdGcmFtZSA9IGRvYy5nZXRFbGVtZW50QnlJZChpZCk7XG5cbiAgICAvLyBjcmVhdGUgYW5kIGFwcGVuZCBhIGhpZGRlbiBwcmV2aWV3IGZyYW1lXG4gICAgaWYgKCFwcmV2aWV3RnJhbWUpIHtcbiAgICAgIHByZXZpZXdGcmFtZSA9IGRvYy5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgICAgIHByZXZpZXdGcmFtZS5pZCA9IGlkO1xuICAgICAgcHJldmlld0ZyYW1lLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCAnZGlzcGxheTogbm9uZScpO1xuICAgICAgZG9jLmJvZHkuYXBwZW5kQ2hpbGQocHJldmlld0ZyYW1lKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJldmlld0ZyYW1lLmNvbnRlbnREb2N1bWVudCB8fCBwcmV2aWV3RnJhbWUuY29udGVudFdpbmRvdy5kb2N1bWVudDtcbiAgfTtcblxuICByZXR1cm4gY29tbW9uO1xufSh3aW5kb3cpOyIsIid1c2Ugc3RyaWN0Jztcblxud2luZG93LmNvbW1vbiA9IGZ1bmN0aW9uIChnbG9iYWwpIHtcbiAgdmFyIF9nbG9iYWwkUnggPSBnbG9iYWwuUng7XG4gIHZhciBCZWhhdmlvclN1YmplY3QgPSBfZ2xvYmFsJFJ4LkJlaGF2aW9yU3ViamVjdDtcbiAgdmFyIE9ic2VydmFibGUgPSBfZ2xvYmFsJFJ4Lk9ic2VydmFibGU7XG4gIHZhciBfZ2xvYmFsJGNvbW1vbiA9IGdsb2JhbC5jb21tb247XG4gIHZhciBjb21tb24gPSBfZ2xvYmFsJGNvbW1vbiA9PT0gdW5kZWZpbmVkID8geyBpbml0OiBbXSB9IDogX2dsb2JhbCRjb21tb247XG5cbiAgLy8gdGhlIGZpcnN0IHNjcmlwdCB0YWcgaGVyZSBpcyB0byBwcm94eSBqUXVlcnlcbiAgLy8gV2UgdXNlIHRoZSBzYW1lIGpRdWVyeSBvbiB0aGUgbWFpbiB3aW5kb3cgYnV0IHdlIGNoYW5nZSB0aGVcbiAgLy8gY29udGV4dCB0byB0aGF0IG9mIHRoZSBpZnJhbWUuXG5cbiAgdmFyIGxpYnJhcnlJbmNsdWRlcyA9ICdcXG48c2NyaXB0PlxcbiAgd2luZG93Lmxvb3BQcm90ZWN0ID0gcGFyZW50Lmxvb3BQcm90ZWN0O1xcbiAgd2luZG93Ll9fZXJyID0gbnVsbDtcXG4gIHdpbmRvdy5sb29wUHJvdGVjdC5oaXQgPSBmdW5jdGlvbihsaW5lKSB7XFxuICAgIHdpbmRvdy5fX2VyciA9IG5ldyBFcnJvcihcXG4gICAgICBcXCdQb3RlbnRpYWwgaW5maW5pdGUgbG9vcCBhdCBsaW5lIFxcJyArXFxuICAgICAgbGluZSArXFxuICAgICAgXFwnLiBUbyBkaXNhYmxlIGxvb3AgcHJvdGVjdGlvbiwgd3JpdGU6XFwnICtcXG4gICAgICBcXCcgXFxcXG5cXFxcL1xcXFwvIG5vcHJvdGVjdFxcXFxuYXMgdGhlIGZpcnN0XFwnICtcXG4gICAgICBcXCcgbGluZS4gQmV3YXJlIHRoYXQgaWYgeW91IGRvIGhhdmUgYW4gaW5maW5pdGUgbG9vcCBpbiB5b3VyIGNvZGVcXCcgK1xcbiAgICAgIFxcJyB0aGlzIHdpbGwgY3Jhc2ggeW91ciBicm93c2VyLlxcJ1xcbiAgICApO1xcbiAgfTtcXG48L3NjcmlwdD5cXG48bGlua1xcbiAgcmVsPVxcJ3N0eWxlc2hlZXRcXCdcXG4gIGhyZWY9XFwnLy9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvYW5pbWF0ZS5jc3MvMy4yLjAvYW5pbWF0ZS5taW4uY3NzXFwnXFxuICAvPlxcbjxsaW5rXFxuICByZWw9XFwnc3R5bGVzaGVldFxcJ1xcbiAgaHJlZj1cXCcvL21heGNkbi5ib290c3RyYXBjZG4uY29tL2Jvb3RzdHJhcC8zLjMuMS9jc3MvYm9vdHN0cmFwLm1pbi5jc3NcXCdcXG4gIC8+XFxuXFxuPGxpbmtcXG4gIHJlbD1cXCdzdHlsZXNoZWV0XFwnXFxuICBocmVmPVxcJy8vbWF4Y2RuLmJvb3RzdHJhcGNkbi5jb20vZm9udC1hd2Vzb21lLzQuMi4wL2Nzcy9mb250LWF3ZXNvbWUubWluLmNzc1xcJ1xcbiAgLz5cXG48c3R5bGU+XFxuICBib2R5IHsgcGFkZGluZzogMHB4IDNweCAwcHggM3B4OyB9XFxuICAvKiBGT1JNIFJFU0VUOiAqL1xcbiAgdGV4dGFyZWEsXFxuICBzZWxlY3QsXFxuICBpbnB1dFt0eXBlPVwiZGF0ZVwiXSxcXG4gIGlucHV0W3R5cGU9XCJkYXRldGltZVwiXSxcXG4gIGlucHV0W3R5cGU9XCJkYXRldGltZS1sb2NhbFwiXSxcXG4gIGlucHV0W3R5cGU9XCJlbWFpbFwiXSxcXG4gIGlucHV0W3R5cGU9XCJtb250aFwiXSxcXG4gIGlucHV0W3R5cGU9XCJudW1iZXJcIl0sXFxuICBpbnB1dFt0eXBlPVwicGFzc3dvcmRcIl0sXFxuICBpbnB1dFt0eXBlPVwic2VhcmNoXCJdLFxcbiAgaW5wdXRbdHlwZT1cInRlbFwiXSxcXG4gIGlucHV0W3R5cGU9XCJ0ZXh0XCJdLFxcbiAgaW5wdXRbdHlwZT1cInRpbWVcIl0sXFxuICBpbnB1dFt0eXBlPVwidXJsXCJdLFxcbiAgaW5wdXRbdHlwZT1cIndlZWtcIl0ge1xcbiAgICAtd2Via2l0LWJveC1zaXppbmc6IGJvcmRlci1ib3g7XFxuICAgIC1tb3otYm94LXNpemluZzogYm9yZGVyLWJveDtcXG4gICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcXG4gICAgLXdlYmtpdC1iYWNrZ3JvdW5kLWNsaXA6IHBhZGRpbmc7XFxuICAgIC1tb3otYmFja2dyb3VuZC1jbGlwOiBwYWRkaW5nO1xcbiAgICBiYWNrZ3JvdW5kLWNsaXA6cGFkZGluZy1ib3g7XFxuICAgIC13ZWJraXQtYm9yZGVyLXJhZGl1czowO1xcbiAgICAtbW96LWJvcmRlci1yYWRpdXM6MDtcXG4gICAgLW1zLWJvcmRlci1yYWRpdXM6MDtcXG4gICAgLW8tYm9yZGVyLXJhZGl1czowO1xcbiAgICBib3JkZXItcmFkaXVzOjA7XFxuICAgIC13ZWJraXQtYXBwZWFyYW5jZTpub25lO1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7XFxuICAgIGNvbG9yOiMwMDA7XFxuICAgIG91dGxpbmU6MDtcXG4gICAgbWFyZ2luOjA7XFxuICAgIHBhZGRpbmc6MDtcXG4gICAgdGV4dC1hbGlnbjogbGVmdDtcXG4gICAgZm9udC1zaXplOjFlbTtcXG4gICAgaGVpZ2h0OiAxLjhlbTtcXG4gICAgdmVydGljYWwtYWxpZ246IG1pZGRsZTtcXG4gIH1cXG4gIHNlbGVjdCwgc2VsZWN0LCBzZWxlY3Qge1xcbiAgICBiYWNrZ3JvdW5kOiNmZmZcXG4gICAgdXJsKFxcJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxSMGxHT0RsaERRQUVBSUFBQUFBQUFQOEEveUg1QkFFSEFBRUFMQUFBQUFBTkFBUUFBQUlMaEEraEc1ak1EcHh2aGdJQU93PT1cXCcpO1xcbiAgICBiYWNrZ3JvdW5kLXJlcGVhdDogbm8tcmVwZWF0O1xcbiAgICBiYWNrZ3JvdW5kLXBvc2l0aW9uOiA5NyUgY2VudGVyO1xcbiAgICBwYWRkaW5nOjAgMjVweCAwIDhweDtcXG4gICAgZm9udC1zaXplOiAuODc1ZW07XFxuICB9XFxuXFxuLy8gISBGT1JNIFJFU0VUXFxuPC9zdHlsZT5cXG4gICc7XG4gIHZhciBjb2RlRGlzYWJsZWRFcnJvciA9ICdcXG4gICAgPHNjcmlwdD5cXG4gICAgICB3aW5kb3cuX19lcnIgPSBuZXcgRXJyb3IoXFwnY29kZSBoYXMgYmVlbiBkaXNhYmxlZFxcJyk7XFxuICAgIDwvc2NyaXB0PlxcbiAgJztcblxuICB2YXIgaUZyYW1lU2NyaXB0JCA9IGNvbW1vbi5nZXRTY3JpcHRDb250ZW50JCgnL2pzL2lGcmFtZVNjcmlwdHMuanMnKS5zaGFyZVJlcGxheSgpO1xuICB2YXIgalF1ZXJ5U2NyaXB0JCA9IGNvbW1vbi5nZXRTY3JpcHRDb250ZW50JCgnL2Jvd2VyX2NvbXBvbmVudHMvanF1ZXJ5L2Rpc3QvanF1ZXJ5LmpzJykuc2hhcmVSZXBsYXkoKTtcblxuICAvLyBiZWhhdmlvciBzdWJqZWN0IGFsbHdheXMgcmVtZW1iZXJzIHRoZSBsYXN0IHZhbHVlXG4gIC8vIHdlIHVzZSB0aGlzIHRvIGRldGVybWluZSBpZiBydW5QcmV2aWV3VGVzdCQgaXMgZGVmaW5lZFxuICAvLyBhbmQgcHJpbWUgaXQgd2l0aCBmYWxzZVxuICBjb21tb24ucHJldmlld1JlYWR5JCA9IG5ldyBCZWhhdmlvclN1YmplY3QoZmFsc2UpO1xuXG4gIC8vIFRoZXNlIHNob3VsZCBiZSBzZXQgdXAgaW4gdGhlIHByZXZpZXcgd2luZG93XG4gIC8vIGlmIHRoaXMgZXJyb3IgaXMgc2VlbiBpdCBpcyBiZWNhdXNlIHRoZSBmdW5jdGlvbiB0cmllZCB0byBydW5cbiAgLy8gYmVmb3JlIHRoZSBpZnJhbWUgaGFzIGNvbXBsZXRlbHkgbG9hZGVkXG4gIGNvbW1vbi5ydW5QcmV2aWV3VGVzdHMkID0gY29tbW9uLmNoZWNrUHJldmlldyQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIE9ic2VydmFibGUudGhyb3cobmV3IEVycm9yKCdQcmV2aWV3IG5vdCBmdWxseSBsb2FkZWQnKSk7XG4gIH07XG5cbiAgY29tbW9uLnVwZGF0ZVByZXZpZXckID0gZnVuY3Rpb24gdXBkYXRlUHJldmlldyQoKSB7XG4gICAgdmFyIGNvZGUgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyAnJyA6IGFyZ3VtZW50c1swXTtcblxuICAgIHZhciBwcmV2aWV3ID0gY29tbW9uLmdldElmcmFtZSgncHJldmlldycpO1xuXG4gICAgcmV0dXJuIE9ic2VydmFibGUuY29tYmluZUxhdGVzdChpRnJhbWVTY3JpcHQkLCBqUXVlcnlTY3JpcHQkLCBmdW5jdGlvbiAoaWZyYW1lLCBqUXVlcnkpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGlmcmFtZVNjcmlwdDogJzxzY3JpcHQ+JyArIGlmcmFtZSArICc8L3NjcmlwdD4nLFxuICAgICAgICBqUXVlcnk6ICc8c2NyaXB0PicgKyBqUXVlcnkgKyAnPC9zY3JpcHQ+J1xuICAgICAgfTtcbiAgICB9KS5maXJzdCgpLmZsYXRNYXAoZnVuY3Rpb24gKF9yZWYpIHtcbiAgICAgIHZhciBpZnJhbWVTY3JpcHQgPSBfcmVmLmlmcmFtZVNjcmlwdDtcbiAgICAgIHZhciBqUXVlcnkgPSBfcmVmLmpRdWVyeTtcblxuICAgICAgLy8gd2UgbWFrZSBzdXJlIHRvIG92ZXJyaWRlIHRoZSBsYXN0IHZhbHVlIGluIHRoZVxuICAgICAgLy8gc3ViamVjdCB0byBmYWxzZSBoZXJlLlxuICAgICAgY29tbW9uLnByZXZpZXdSZWFkeSQub25OZXh0KGZhbHNlKTtcbiAgICAgIHByZXZpZXcub3BlbigpO1xuICAgICAgcHJldmlldy53cml0ZShsaWJyYXJ5SW5jbHVkZXMgKyBqUXVlcnkgKyAoY29tbW9uLnNob3VsZFJ1bigpID8gY29kZSA6IGNvZGVEaXNhYmxlZEVycm9yKSArICc8IS0tIC0tPicgKyBpZnJhbWVTY3JpcHQpO1xuICAgICAgcHJldmlldy5jbG9zZSgpO1xuICAgICAgLy8gbm93IHdlIGZpbHRlciBmYWxzZSB2YWx1ZXMgYW5kIHdhaXQgZm9yIHRoZSBmaXJzdCB0cnVlXG4gICAgICByZXR1cm4gY29tbW9uLnByZXZpZXdSZWFkeSQuZmlsdGVyKGZ1bmN0aW9uIChyZWFkeSkge1xuICAgICAgICByZXR1cm4gcmVhZHk7XG4gICAgICB9KS5maXJzdCgpXG4gICAgICAvLyB0aGUgZGVsYXkgaGVyZSBpcyB0byBnaXZlIGNvZGUgd2l0aGluIHRoZSBpZnJhbWVcbiAgICAgIC8vIGNvbnRyb2wgdG8gcnVuXG4gICAgICAuZGVsYXkoNDAwKTtcbiAgICB9KS5tYXAoZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGNvZGU7XG4gICAgfSk7XG4gIH07XG5cbiAgcmV0dXJuIGNvbW1vbjtcbn0od2luZG93KTsiLCIndXNlIHN0cmljdCc7XG5cbndpbmRvdy5jb21tb24gPSBmdW5jdGlvbiAoZ2xvYmFsKSB7XG4gIHZhciBfZ2xvYmFsJFJ4ID0gZ2xvYmFsLlJ4O1xuICB2YXIgU3ViamVjdCA9IF9nbG9iYWwkUnguU3ViamVjdDtcbiAgdmFyIE9ic2VydmFibGUgPSBfZ2xvYmFsJFJ4Lk9ic2VydmFibGU7XG4gIHZhciBDb2RlTWlycm9yID0gZ2xvYmFsLkNvZGVNaXJyb3I7XG4gIHZhciBlbW1ldENvZGVNaXJyb3IgPSBnbG9iYWwuZW1tZXRDb2RlTWlycm9yO1xuICB2YXIgX2dsb2JhbCRjb21tb24gPSBnbG9iYWwuY29tbW9uO1xuICB2YXIgY29tbW9uID0gX2dsb2JhbCRjb21tb24gPT09IHVuZGVmaW5lZCA/IHsgaW5pdDogW10gfSA6IF9nbG9iYWwkY29tbW9uO1xuICB2YXIgX2NvbW1vbiRjaGFsbGVuZ2VUeXBlID0gY29tbW9uLmNoYWxsZW5nZVR5cGU7XG4gIHZhciBjaGFsbGVuZ2VUeXBlID0gX2NvbW1vbiRjaGFsbGVuZ2VUeXBlID09PSB1bmRlZmluZWQgPyAnMCcgOiBfY29tbW9uJGNoYWxsZW5nZVR5cGU7XG4gIHZhciBjaGFsbGVuZ2VUeXBlcyA9IGNvbW1vbi5jaGFsbGVuZ2VUeXBlcztcblxuXG4gIGlmICghQ29kZU1pcnJvciB8fCBjaGFsbGVuZ2VUeXBlID09PSBjaGFsbGVuZ2VUeXBlcy5CQVNFSlVNUCB8fCBjaGFsbGVuZ2VUeXBlID09PSBjaGFsbGVuZ2VUeXBlcy5aSVBMSU5FIHx8IGNoYWxsZW5nZVR5cGUgPT09IGNoYWxsZW5nZVR5cGVzLlZJREVPIHx8IGNoYWxsZW5nZVR5cGUgPT09IGNoYWxsZW5nZVR5cGVzLlNURVAgfHwgY2hhbGxlbmdlVHlwZSA9PT0gY2hhbGxlbmdlVHlwZXMuSElLRVMpIHtcbiAgICBjb21tb24uZWRpdG9yID0ge307XG4gICAgcmV0dXJuIGNvbW1vbjtcbiAgfVxuXG4gIHZhciBlZGl0b3IgPSBDb2RlTWlycm9yLmZyb21UZXh0QXJlYShkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29kZUVkaXRvcicpLCB7XG4gICAgbGludDogdHJ1ZSxcbiAgICBsaW5lTnVtYmVyczogdHJ1ZSxcbiAgICBtb2RlOiAnamF2YXNjcmlwdCcsXG4gICAgdGhlbWU6ICdtb25va2FpJyxcbiAgICBydW5uYWJsZTogdHJ1ZSxcbiAgICBtYXRjaEJyYWNrZXRzOiB0cnVlLFxuICAgIGF1dG9DbG9zZUJyYWNrZXRzOiB0cnVlLFxuICAgIHNjcm9sbGJhclN0eWxlOiAnbnVsbCcsXG4gICAgbGluZVdyYXBwaW5nOiB0cnVlLFxuICAgIGd1dHRlcnM6IFsnQ29kZU1pcnJvci1saW50LW1hcmtlcnMnXVxuICB9KTtcblxuICBlZGl0b3Iuc2V0U2l6ZSgnMTAwJScsICdhdXRvJyk7XG5cbiAgY29tbW9uLmVkaXRvckV4ZWN1dGUkID0gbmV3IFN1YmplY3QoKTtcbiAgY29tbW9uLmVkaXRvcktleVVwJCA9IE9ic2VydmFibGUuZnJvbUV2ZW50UGF0dGVybihmdW5jdGlvbiAoaGFuZGxlcikge1xuICAgIHJldHVybiBlZGl0b3Iub24oJ2tleXVwJywgaGFuZGxlcik7XG4gIH0sIGZ1bmN0aW9uIChoYW5kbGVyKSB7XG4gICAgcmV0dXJuIGVkaXRvci5vZmYoJ2tleXVwJywgaGFuZGxlcik7XG4gIH0pO1xuXG4gIGVkaXRvci5zZXRPcHRpb24oJ2V4dHJhS2V5cycsIHtcbiAgICBUYWI6IGZ1bmN0aW9uIFRhYihjbSkge1xuICAgICAgaWYgKGNtLnNvbWV0aGluZ1NlbGVjdGVkKCkpIHtcbiAgICAgICAgY20uaW5kZW50U2VsZWN0aW9uKCdhZGQnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBzcGFjZXMgPSBBcnJheShjbS5nZXRPcHRpb24oJ2luZGVudFVuaXQnKSArIDEpLmpvaW4oJyAnKTtcbiAgICAgICAgY20ucmVwbGFjZVNlbGVjdGlvbihzcGFjZXMpO1xuICAgICAgfVxuICAgIH0sXG4gICAgJ1NoaWZ0LVRhYic6IGZ1bmN0aW9uIFNoaWZ0VGFiKGNtKSB7XG4gICAgICBpZiAoY20uc29tZXRoaW5nU2VsZWN0ZWQoKSkge1xuICAgICAgICBjbS5pbmRlbnRTZWxlY3Rpb24oJ3N1YnRyYWN0Jyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgc3BhY2VzID0gQXJyYXkoY20uZ2V0T3B0aW9uKCdpbmRlbnRVbml0JykgKyAxKS5qb2luKCcgJyk7XG4gICAgICAgIGNtLnJlcGxhY2VTZWxlY3Rpb24oc3BhY2VzKTtcbiAgICAgIH1cbiAgICB9LFxuICAgICdDdHJsLUVudGVyJzogZnVuY3Rpb24gQ3RybEVudGVyKCkge1xuICAgICAgY29tbW9uLmVkaXRvckV4ZWN1dGUkLm9uTmV4dCgpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG4gICAgJ0NtZC1FbnRlcic6IGZ1bmN0aW9uIENtZEVudGVyKCkge1xuICAgICAgY29tbW9uLmVkaXRvckV4ZWN1dGUkLm9uTmV4dCgpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSk7XG5cbiAgdmFyIGluZm8gPSBlZGl0b3IuZ2V0U2Nyb2xsSW5mbygpO1xuXG4gIHZhciBhZnRlciA9IGVkaXRvci5jaGFyQ29vcmRzKHtcbiAgICBsaW5lOiBlZGl0b3IuZ2V0Q3Vyc29yKCkubGluZSArIDEsXG4gICAgY2g6IDBcbiAgfSwgJ2xvY2FsJykudG9wO1xuXG4gIGlmIChpbmZvLnRvcCArIGluZm8uY2xpZW50SGVpZ2h0IDwgYWZ0ZXIpIHtcbiAgICBlZGl0b3Iuc2Nyb2xsVG8obnVsbCwgYWZ0ZXIgLSBpbmZvLmNsaWVudEhlaWdodCArIDMpO1xuICB9XG5cbiAgaWYgKGVtbWV0Q29kZU1pcnJvcikge1xuICAgIGVtbWV0Q29kZU1pcnJvcihlZGl0b3IsIHtcbiAgICAgICdDbWQtRSc6ICdlbW1ldC5leHBhbmRfYWJicmV2aWF0aW9uJyxcbiAgICAgIFRhYjogJ2VtbWV0LmV4cGFuZF9hYmJyZXZpYXRpb25fd2l0aF90YWInLFxuICAgICAgRW50ZXI6ICdlbW1ldC5pbnNlcnRfZm9ybWF0dGVkX2xpbmVfYnJlYWtfb25seSdcbiAgICB9KTtcbiAgfVxuICBjb21tb24uaW5pdC5wdXNoKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZWRpdG9yVmFsdWUgPSB2b2lkIDA7XG4gICAgaWYgKGNvbW1vbi5jb2RlVXJpLmlzQWxpdmUoKSkge1xuICAgICAgZWRpdG9yVmFsdWUgPSBjb21tb24uY29kZVVyaS5wYXJzZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlZGl0b3JWYWx1ZSA9IGNvbW1vbi5jb2RlU3RvcmFnZS5pc0FsaXZlKGNvbW1vbi5jaGFsbGVuZ2VOYW1lKSA/IGNvbW1vbi5jb2RlU3RvcmFnZS5nZXRTdG9yZWRWYWx1ZShjb21tb24uY2hhbGxlbmdlTmFtZSkgOiBjb21tb24uc2VlZDtcbiAgICB9XG5cbiAgICBlZGl0b3Iuc2V0VmFsdWUoY29tbW9uLnJlcGxhY2VTYWZlVGFncyhlZGl0b3JWYWx1ZSkpO1xuICAgIGVkaXRvci5yZWZyZXNoKCk7XG4gIH0pO1xuXG4gIGNvbW1vbi5lZGl0b3IgPSBlZGl0b3I7XG5cbiAgcmV0dXJuIGNvbW1vbjtcbn0od2luZG93KTsiLCIndXNlIHN0cmljdCc7XG5cbndpbmRvdy5jb21tb24gPSBmdW5jdGlvbiAoZ2xvYmFsKSB7XG4gIHZhciBPYnNlcnZhYmxlID0gZ2xvYmFsLlJ4Lk9ic2VydmFibGU7XG4gIHZhciBfZ2xvYmFsJGNvbW1vbiA9IGdsb2JhbC5jb21tb247XG4gIHZhciBjb21tb24gPSBfZ2xvYmFsJGNvbW1vbiA9PT0gdW5kZWZpbmVkID8geyBpbml0OiBbXSB9IDogX2dsb2JhbCRjb21tb247XG5cblxuICB2YXIgZGV0ZWN0RnVuY3Rpb25DYWxsID0gL2Z1bmN0aW9uXFxzKj9cXCh8ZnVuY3Rpb25cXHMrXFx3K1xccyo/XFwoL2dpO1xuICB2YXIgZGV0ZWN0VW5zYWZlSlEgPSAvXFwkXFxzKj9cXChcXHMqP1xcJFxccyo/XFwpL2dpO1xuICB2YXIgZGV0ZWN0VW5zYWZlQ29uc29sZUNhbGwgPSAvaWZcXHNcXChudWxsXFwpXFxzY29uc29sZVxcLmxvZ1xcKDFcXCk7L2dpO1xuXG4gIGNvbW1vbi5kZXRlY3RVbnNhZmVDb2RlJCA9IGZ1bmN0aW9uIGRldGVjdFVuc2FmZUNvZGUkKGNvZGUpIHtcbiAgICB2YXIgb3BlbmluZ0NvbW1lbnRzID0gY29kZS5tYXRjaCgvXFwvXFwqL2dpKTtcbiAgICB2YXIgY2xvc2luZ0NvbW1lbnRzID0gY29kZS5tYXRjaCgvXFwqXFwvL2dpKTtcblxuICAgIC8vIGNoZWNrcyBpZiB0aGUgbnVtYmVyIG9mIG9wZW5pbmcgY29tbWVudHMoLyopIG1hdGNoZXMgdGhlIG51bWJlciBvZlxuICAgIC8vIGNsb3NpbmcgY29tbWVudHMoKi8pXG4gICAgaWYgKG9wZW5pbmdDb21tZW50cyAmJiAoIWNsb3NpbmdDb21tZW50cyB8fCBvcGVuaW5nQ29tbWVudHMubGVuZ3RoID4gY2xvc2luZ0NvbW1lbnRzLmxlbmd0aCkpIHtcblxuICAgICAgcmV0dXJuIE9ic2VydmFibGUudGhyb3cobmV3IEVycm9yKCdTeW50YXhFcnJvcjogVW5maW5pc2hlZCBtdWx0aS1saW5lIGNvbW1lbnQnKSk7XG4gICAgfVxuXG4gICAgaWYgKGNvZGUubWF0Y2goZGV0ZWN0VW5zYWZlSlEpKSB7XG4gICAgICByZXR1cm4gT2JzZXJ2YWJsZS50aHJvdyhuZXcgRXJyb3IoJ1Vuc2FmZSAkKCQpJykpO1xuICAgIH1cblxuICAgIGlmIChjb2RlLm1hdGNoKC9mdW5jdGlvbi9nKSAmJiAhY29kZS5tYXRjaChkZXRlY3RGdW5jdGlvbkNhbGwpKSB7XG4gICAgICByZXR1cm4gT2JzZXJ2YWJsZS50aHJvdyhuZXcgRXJyb3IoJ1N5bnRheEVycm9yOiBVbnNhZmUgb3IgdW5maW5pc2hlZCBmdW5jdGlvbiBkZWNsYXJhdGlvbicpKTtcbiAgICB9XG5cbiAgICBpZiAoY29kZS5tYXRjaChkZXRlY3RVbnNhZmVDb25zb2xlQ2FsbCkpIHtcbiAgICAgIHJldHVybiBPYnNlcnZhYmxlLnRocm93KG5ldyBFcnJvcignSW52YWxpZCBpZiAobnVsbCkgY29uc29sZS5sb2coMSk7IGRldGVjdGVkJykpO1xuICAgIH1cblxuICAgIHJldHVybiBPYnNlcnZhYmxlLmp1c3QoY29kZSk7XG4gIH07XG5cbiAgcmV0dXJuIGNvbW1vbjtcbn0od2luZG93KTsiLCIndXNlIHN0cmljdCc7XG5cbndpbmRvdy5jb21tb24gPSBmdW5jdGlvbiAoX3JlZikge1xuICB2YXIgJCA9IF9yZWYuJDtcbiAgdmFyIF9yZWYkY29tbW9uID0gX3JlZi5jb21tb247XG4gIHZhciBjb21tb24gPSBfcmVmJGNvbW1vbiA9PT0gdW5kZWZpbmVkID8geyBpbml0OiBbXSB9IDogX3JlZiRjb21tb247XG5cblxuICBjb21tb24uZGlzcGxheVRlc3RSZXN1bHRzID0gZnVuY3Rpb24gZGlzcGxheVRlc3RSZXN1bHRzKCkge1xuICAgIHZhciBkYXRhID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gW10gOiBhcmd1bWVudHNbMF07XG5cbiAgICAkKCcjdGVzdFN1aXRlJykuY2hpbGRyZW4oKS5yZW1vdmUoKTtcbiAgICBkYXRhLmZvckVhY2goZnVuY3Rpb24gKF9yZWYyKSB7XG4gICAgICB2YXIgX3JlZjIkZXJyID0gX3JlZjIuZXJyO1xuICAgICAgdmFyIGVyciA9IF9yZWYyJGVyciA9PT0gdW5kZWZpbmVkID8gZmFsc2UgOiBfcmVmMiRlcnI7XG4gICAgICB2YXIgX3JlZjIkdGV4dCA9IF9yZWYyLnRleHQ7XG4gICAgICB2YXIgdGV4dCA9IF9yZWYyJHRleHQgPT09IHVuZGVmaW5lZCA/ICcnIDogX3JlZjIkdGV4dDtcblxuICAgICAgdmFyIGljb25DbGFzcyA9IGVyciA/ICdcImlvbi1jbG9zZS1jaXJjbGVkIGJpZy1lcnJvci1pY29uXCInIDogJ1wiaW9uLWNoZWNrbWFyay1jaXJjbGVkIGJpZy1zdWNjZXNzLWljb25cIic7XG5cbiAgICAgICQoJzxkaXY+PC9kaXY+JykuaHRtbCgnXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcJ3Jvd1xcJz5cXG4gICAgICAgICAgPGRpdiBjbGFzcz1cXCdjb2wteHMtMiB0ZXh0LWNlbnRlclxcJz5cXG4gICAgICAgICAgICA8aSBjbGFzcz0nICsgaWNvbkNsYXNzICsgJz48L2k+XFxuICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICA8ZGl2IGNsYXNzPVxcJ2NvbC14cy0xMCB0ZXN0LW91dHB1dFxcJz5cXG4gICAgICAgICAgICAnICsgdGV4dC5zcGxpdCgnbWVzc2FnZTogJykucG9wKCkucmVwbGFjZSgvXFwnXFwpOy9nLCAnJykgKyAnXFxuICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICA8ZGl2IGNsYXNzPVxcJ3Rlbi1waXhlbC1icmVha1xcJy8+XFxuICAgICAgICA8L2Rpdj5cXG4gICAgICAnKS5hcHBlbmRUbygkKCcjdGVzdFN1aXRlJykpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGRhdGE7XG4gIH07XG5cbiAgcmV0dXJuIGNvbW1vbjtcbn0od2luZG93KTsiLCIndXNlIHN0cmljdCc7XG5cbndpbmRvdy5jb21tb24gPSBmdW5jdGlvbiAoZ2xvYmFsKSB7XG4gIHZhciBnYSA9IGdsb2JhbC5nYTtcbiAgdmFyIF9nbG9iYWwkY29tbW9uID0gZ2xvYmFsLmNvbW1vbjtcbiAgdmFyIGNvbW1vbiA9IF9nbG9iYWwkY29tbW9uID09PSB1bmRlZmluZWQgPyB7IGluaXQ6IFtdIH0gOiBfZ2xvYmFsJGNvbW1vbjtcbiAgdmFyIGFkZExvb3BQcm90ZWN0ID0gY29tbW9uLmFkZExvb3BQcm90ZWN0O1xuICB2YXIgZ2V0SnNGcm9tSHRtbCA9IGNvbW1vbi5nZXRKc0Zyb21IdG1sO1xuICB2YXIgZGV0ZWN0VW5zYWZlQ29kZSQgPSBjb21tb24uZGV0ZWN0VW5zYWZlQ29kZSQ7XG4gIHZhciB1cGRhdGVQcmV2aWV3JCA9IGNvbW1vbi51cGRhdGVQcmV2aWV3JDtcbiAgdmFyIGNoYWxsZW5nZVR5cGUgPSBjb21tb24uY2hhbGxlbmdlVHlwZTtcbiAgdmFyIGNoYWxsZW5nZVR5cGVzID0gY29tbW9uLmNoYWxsZW5nZVR5cGVzO1xuXG5cbiAgY29tbW9uLmV4ZWN1dGVDaGFsbGVuZ2UkID0gZnVuY3Rpb24gZXhlY3V0ZUNoYWxsZW5nZSQoKSB7XG4gICAgdmFyIGNvZGUgPSBjb21tb24uZWRpdG9yLmdldFZhbHVlKCk7XG4gICAgdmFyIG9yaWdpbmFsQ29kZSA9IGNvZGU7XG4gICAgdmFyIGhlYWQgPSBjb21tb24uYXJyYXlUb05ld0xpbmVTdHJpbmcoY29tbW9uLmhlYWQpO1xuICAgIHZhciB0YWlsID0gY29tbW9uLmFycmF5VG9OZXdMaW5lU3RyaW5nKGNvbW1vbi50YWlsKTtcbiAgICB2YXIgY29tYmluZWRDb2RlID0gaGVhZCArIGNvZGUgKyB0YWlsO1xuXG4gICAgZ2EoJ3NlbmQnLCAnZXZlbnQnLCAnQ2hhbGxlbmdlJywgJ3Jhbi1jb2RlJywgY29tbW9uLmdhTmFtZSk7XG5cbiAgICAvLyBydW4gY2hlY2tzIGZvciB1bnNhZmUgY29kZVxuICAgIHJldHVybiBkZXRlY3RVbnNhZmVDb2RlJChjb2RlKVxuICAgIC8vIGFkZCBoZWFkIGFuZCB0YWlsIGFuZCBkZXRlY3QgbG9vcHNcbiAgICAubWFwKGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChjaGFsbGVuZ2VUeXBlICE9PSBjaGFsbGVuZ2VUeXBlcy5IVE1MKSB7XG4gICAgICAgIHJldHVybiAnPHNjcmlwdD47JyArIGFkZExvb3BQcm90ZWN0KGNvbWJpbmVkQ29kZSkgKyAnLyoqLzwvc2NyaXB0Pic7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhZGRMb29wUHJvdGVjdChjb21iaW5lZENvZGUpO1xuICAgIH0pLmZsYXRNYXAoZnVuY3Rpb24gKGNvZGUpIHtcbiAgICAgIHJldHVybiB1cGRhdGVQcmV2aWV3JChjb2RlKTtcbiAgICB9KS5mbGF0TWFwKGZ1bmN0aW9uIChjb2RlKSB7XG4gICAgICB2YXIgb3V0cHV0ID0gdm9pZCAwO1xuXG4gICAgICBpZiAoY2hhbGxlbmdlVHlwZSA9PT0gY2hhbGxlbmdlVHlwZXMuSFRNTCAmJiBjb21tb24uaGFzSnMoY29kZSkpIHtcbiAgICAgICAgb3V0cHV0ID0gY29tbW9uLmdldEpzT3V0cHV0KGdldEpzRnJvbUh0bWwoY29kZSkpO1xuICAgICAgfSBlbHNlIGlmIChjaGFsbGVuZ2VUeXBlICE9PSBjaGFsbGVuZ2VUeXBlcy5IVE1MKSB7XG4gICAgICAgIG91dHB1dCA9IGNvbW1vbi5nZXRKc091dHB1dChhZGRMb29wUHJvdGVjdChjb21iaW5lZENvZGUpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNvbW1vbi5ydW5QcmV2aWV3VGVzdHMkKHtcbiAgICAgICAgdGVzdHM6IGNvbW1vbi50ZXN0cy5zbGljZSgpLFxuICAgICAgICBvcmlnaW5hbENvZGU6IG9yaWdpbmFsQ29kZSxcbiAgICAgICAgb3V0cHV0OiBvdXRwdXRcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIHJldHVybiBjb21tb247XG59KHdpbmRvdyk7IiwiJ3VzZSBzdHJpY3QnO1xuXG53aW5kb3cuY29tbW9uID0gZnVuY3Rpb24gKGdsb2JhbCkge1xuICB2YXIgQ29kZU1pcnJvciA9IGdsb2JhbC5Db2RlTWlycm9yO1xuICB2YXIgZG9jID0gZ2xvYmFsLmRvY3VtZW50O1xuICB2YXIgX2dsb2JhbCRjb21tb24gPSBnbG9iYWwuY29tbW9uO1xuICB2YXIgY29tbW9uID0gX2dsb2JhbCRjb21tb24gPT09IHVuZGVmaW5lZCA/IHsgaW5pdDogW10gfSA6IF9nbG9iYWwkY29tbW9uO1xuICB2YXIgY2hhbGxlbmdlVHlwZXMgPSBjb21tb24uY2hhbGxlbmdlVHlwZXM7XG4gIHZhciBfY29tbW9uJGNoYWxsZW5nZVR5cGUgPSBjb21tb24uY2hhbGxlbmdlVHlwZTtcbiAgdmFyIGNoYWxsZW5nZVR5cGUgPSBfY29tbW9uJGNoYWxsZW5nZVR5cGUgPT09IHVuZGVmaW5lZCA/ICcwJyA6IF9jb21tb24kY2hhbGxlbmdlVHlwZTtcblxuXG4gIGlmICghQ29kZU1pcnJvciB8fCBjaGFsbGVuZ2VUeXBlICE9PSBjaGFsbGVuZ2VUeXBlcy5KUyAmJiBjaGFsbGVuZ2VUeXBlICE9PSBjaGFsbGVuZ2VUeXBlcy5CT05GSVJFKSB7XG4gICAgY29tbW9uLnVwZGF0ZU91dHB1dERpc3BsYXkgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICBjb21tb24uYXBwZW5kVG9PdXRwdXREaXNwbGF5ID0gZnVuY3Rpb24gKCkge307XG4gICAgcmV0dXJuIGNvbW1vbjtcbiAgfVxuXG4gIHZhciBjb2RlT3V0cHV0ID0gQ29kZU1pcnJvci5mcm9tVGV4dEFyZWEoZG9jLmdldEVsZW1lbnRCeUlkKCdjb2RlT3V0cHV0JyksIHtcbiAgICBsaW5lTnVtYmVyczogZmFsc2UsXG4gICAgbW9kZTogJ3RleHQnLFxuICAgIHRoZW1lOiAnbW9ub2thaScsXG4gICAgcmVhZE9ubHk6ICdub2N1cnNvcicsXG4gICAgbGluZVdyYXBwaW5nOiB0cnVlXG4gIH0pO1xuXG4gIGNvZGVPdXRwdXQuc2V0VmFsdWUoJy8qKlxcbiAgKiBZb3VyIG91dHB1dCB3aWxsIGdvIGhlcmUuXFxuICAqIEFueSBjb25zb2xlLmxvZygpIC10eXBlXFxuICAqIHN0YXRlbWVudHMgd2lsbCBhcHBlYXIgaW5cXG4gICogeW91ciBicm93c2VyXFwncyBEZXZUb29sc1xcbiAgKiBKYXZhU2NyaXB0IGNvbnNvbGUuXFxuICAqLycpO1xuXG4gIGNvZGVPdXRwdXQuc2V0U2l6ZSgnMTAwJScsICcxMDAlJyk7XG5cbiAgY29tbW9uLnVwZGF0ZU91dHB1dERpc3BsYXkgPSBmdW5jdGlvbiB1cGRhdGVPdXRwdXREaXNwbGF5KCkge1xuICAgIHZhciBzdHIgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyAnJyA6IGFyZ3VtZW50c1swXTtcblxuICAgIGlmICh0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJykge1xuICAgICAgc3RyID0gSlNPTi5zdHJpbmdpZnkoc3RyKTtcbiAgICB9XG4gICAgY29kZU91dHB1dC5zZXRWYWx1ZShzdHIpO1xuICAgIHJldHVybiBzdHI7XG4gIH07XG5cbiAgY29tbW9uLmFwcGVuZFRvT3V0cHV0RGlzcGxheSA9IGZ1bmN0aW9uIGFwcGVuZFRvT3V0cHV0RGlzcGxheSgpIHtcbiAgICB2YXIgc3RyID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gJycgOiBhcmd1bWVudHNbMF07XG5cbiAgICBjb2RlT3V0cHV0LnNldFZhbHVlKGNvZGVPdXRwdXQuZ2V0VmFsdWUoKSArIHN0cik7XG4gICAgcmV0dXJuIHN0cjtcbiAgfTtcblxuICByZXR1cm4gY29tbW9uO1xufSh3aW5kb3cpOyIsIid1c2Ugc3RyaWN0Jztcblxud2luZG93LmNvbW1vbiA9IGZ1bmN0aW9uIChfcmVmKSB7XG4gIHZhciBfcmVmJGNvbW1vbiA9IF9yZWYuY29tbW9uO1xuICB2YXIgY29tbW9uID0gX3JlZiRjb21tb24gPT09IHVuZGVmaW5lZCA/IHsgaW5pdDogW10gfSA6IF9yZWYkY29tbW9uO1xuXG5cbiAgY29tbW9uLmxvY2tUb3AgPSBmdW5jdGlvbiBsb2NrVG9wKCkge1xuICAgIHZhciBtYWdpVmFsO1xuXG4gICAgaWYgKCQod2luZG93KS53aWR0aCgpID49IDk5MCkge1xuICAgICAgaWYgKCQoJy5lZGl0b3JTY3JvbGxEaXYnKS5odG1sKCkpIHtcblxuICAgICAgICBtYWdpVmFsID0gJCh3aW5kb3cpLmhlaWdodCgpIC0gJCgnLm5hdmJhcicpLmhlaWdodCgpO1xuXG4gICAgICAgIGlmIChtYWdpVmFsIDwgMCkge1xuICAgICAgICAgIG1hZ2lWYWwgPSAwO1xuICAgICAgICB9XG4gICAgICAgICQoJy5lZGl0b3JTY3JvbGxEaXYnKS5jc3MoJ2hlaWdodCcsIG1hZ2lWYWwgLSA1MCArICdweCcpO1xuICAgICAgfVxuXG4gICAgICBtYWdpVmFsID0gJCh3aW5kb3cpLmhlaWdodCgpIC0gJCgnLm5hdmJhcicpLmhlaWdodCgpO1xuXG4gICAgICBpZiAobWFnaVZhbCA8IDApIHtcbiAgICAgICAgbWFnaVZhbCA9IDA7XG4gICAgICB9XG5cbiAgICAgICQoJy5zY3JvbGwtbG9ja2VyJykuY3NzKCdtaW4taGVpZ2h0JywgJCgnLmVkaXRvclNjcm9sbERpdicpLmhlaWdodCgpKS5jc3MoJ2hlaWdodCcsIG1hZ2lWYWwgLSA1MCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICQoJy5lZGl0b3JTY3JvbGxEaXYnKS5jc3MoJ21heC1oZWlnaHQnLCA1MDAgKyAncHgnKTtcblxuICAgICAgJCgnLnNjcm9sbC1sb2NrZXInKS5jc3MoJ3Bvc2l0aW9uJywgJ2luaGVyaXQnKS5jc3MoJ3RvcCcsICdpbmhlcml0JykuY3NzKCd3aWR0aCcsICcxMDAlJykuY3NzKCdtYXgtaGVpZ2h0JywgJzEwMCUnKTtcbiAgICB9XG4gIH07XG5cbiAgY29tbW9uLmluaXQucHVzaChmdW5jdGlvbiAoJCkge1xuICAgIC8vIGZha2VpcGhvbmUgcG9zaXRpb25pbmcgaG90Zml4XG4gICAgaWYgKCQoJy5pcGhvbmUtcG9zaXRpb24nKS5odG1sKCkgfHwgJCgnLmlwaG9uZScpLmh0bWwoKSkge1xuICAgICAgdmFyIHN0YXJ0SXBob25lUG9zaXRpb24gPSBwYXJzZUludCgkKCcuaXBob25lLXBvc2l0aW9uJykuY3NzKCd0b3AnKS5yZXBsYWNlKCdweCcsICcnKSwgMTApO1xuXG4gICAgICB2YXIgc3RhcnRJcGhvbmUgPSBwYXJzZUludCgkKCcuaXBob25lJykuY3NzKCd0b3AnKS5yZXBsYWNlKCdweCcsICcnKSwgMTApO1xuXG4gICAgICAkKHdpbmRvdykub24oJ3Njcm9sbCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNvdXJzZUhlaWdodCA9ICQoJy5jb3Vyc2V3YXJlLWhlaWdodCcpLmhlaWdodCgpO1xuICAgICAgICB2YXIgY291cnNlVG9wID0gJCgnLmNvdXJzZXdhcmUtaGVpZ2h0Jykub2Zmc2V0KCkudG9wO1xuICAgICAgICB2YXIgd2luZG93U2Nyb2xsVG9wID0gJCh3aW5kb3cpLnNjcm9sbFRvcCgpO1xuICAgICAgICB2YXIgcGhvbmVIZWlnaHQgPSAkKCcuaXBob25lLXBvc2l0aW9uJykuaGVpZ2h0KCk7XG5cbiAgICAgICAgaWYgKGNvdXJzZUhlaWdodCArIGNvdXJzZVRvcCAtIHdpbmRvd1Njcm9sbFRvcCAtIHBob25lSGVpZ2h0IDw9IDApIHtcbiAgICAgICAgICAkKCcuaXBob25lLXBvc2l0aW9uJykuY3NzKCd0b3AnLCBzdGFydElwaG9uZVBvc2l0aW9uICsgY291cnNlSGVpZ2h0ICsgY291cnNlVG9wIC0gd2luZG93U2Nyb2xsVG9wIC0gcGhvbmVIZWlnaHQpO1xuXG4gICAgICAgICAgJCgnLmlwaG9uZScpLmNzcygndG9wJywgc3RhcnRJcGhvbmVQb3NpdGlvbiArIGNvdXJzZUhlaWdodCArIGNvdXJzZVRvcCAtIHdpbmRvd1Njcm9sbFRvcCAtIHBob25lSGVpZ2h0ICsgMTIwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkKCcuaXBob25lLXBvc2l0aW9uJykuY3NzKCd0b3AnLCBzdGFydElwaG9uZVBvc2l0aW9uKTtcbiAgICAgICAgICAkKCcuaXBob25lJykuY3NzKCd0b3AnLCBzdGFydElwaG9uZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICgkKCcuc2Nyb2xsLWxvY2tlcicpLmh0bWwoKSkge1xuXG4gICAgICBpZiAoJCgnLnNjcm9sbC1sb2NrZXInKS5odG1sKCkpIHtcbiAgICAgICAgY29tbW9uLmxvY2tUb3AoKTtcbiAgICAgICAgJCh3aW5kb3cpLm9uKCdyZXNpemUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29tbW9uLmxvY2tUb3AoKTtcbiAgICAgICAgfSk7XG4gICAgICAgICQod2luZG93KS5vbignc2Nyb2xsJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbW1vbi5sb2NrVG9wKCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICB2YXIgZXhlY0luUHJvZ3Jlc3MgPSBmYWxzZTtcblxuICAgICAgLy8gd2h5IGlzIHRoaXMgbm90ICQ/Pz9cbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzY3JvbGwtbG9ja2VyJykuYWRkRXZlbnRMaXN0ZW5lcigncHJldmlld1VwZGF0ZVNweScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmIChleGVjSW5Qcm9ncmVzcykge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGV4ZWNJblByb2dyZXNzID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGlmICgkKCQoJy5zY3JvbGwtbG9ja2VyJykuY2hpbGRyZW4oKVswXSkuaGVpZ2h0KCkgLSA4MDAgPiBlLmRldGFpbCkge1xuICAgICAgICAgICAgJCgnLnNjcm9sbC1sb2NrZXInKS5zY3JvbGxUb3AoZS5kZXRhaWwpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgc2Nyb2xsVG9wID0gJCgkKCcuc2Nyb2xsLWxvY2tlcicpLmNoaWxkcmVuKClbMF0pLmhlaWdodCgpO1xuXG4gICAgICAgICAgICAkKCcuc2Nyb2xsLWxvY2tlcicpLmFuaW1hdGUoeyBzY3JvbGxUb3A6IHNjcm9sbFRvcCB9LCAxNzUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBleGVjSW5Qcm9ncmVzcyA9IGZhbHNlO1xuICAgICAgICB9LCA3NTApO1xuICAgICAgfSwgZmFsc2UpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGNvbW1vbjtcbn0od2luZG93KTsiLCIndXNlIHN0cmljdCc7XG5cbndpbmRvdy5jb21tb24gPSBmdW5jdGlvbiAoX3JlZikge1xuICB2YXIgX3JlZiRjb21tb24gPSBfcmVmLmNvbW1vbjtcbiAgdmFyIGNvbW1vbiA9IF9yZWYkY29tbW9uID09PSB1bmRlZmluZWQgPyB7IGluaXQ6IFtdIH0gOiBfcmVmJGNvbW1vbjtcblxuICBjb21tb24uaW5pdC5wdXNoKGZ1bmN0aW9uICgkKSB7XG4gICAgJCgnI3JlcG9ydC1pc3N1ZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciB0ZXh0TWVzc2FnZSA9IFsnQ2hhbGxlbmdlIFsnLCBjb21tb24uY2hhbGxlbmdlTmFtZSB8fCB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUsICddKCcsIHdpbmRvdy5sb2NhdGlvbi5ocmVmLCAnKSBoYXMgYW4gaXNzdWUuXFxuJywgJ1VzZXIgQWdlbnQgaXM6IDxjb2RlPicsIG5hdmlnYXRvci51c2VyQWdlbnQsICc8L2NvZGU+LlxcbicsICdQbGVhc2UgZGVzY3JpYmUgaG93IHRvIHJlcHJvZHVjZSB0aGlzIGlzc3VlLCBhbmQgaW5jbHVkZSAnLCAnbGlua3MgdG8gc2NyZWVuc2hvdHMgaWYgcG9zc2libGUuXFxuXFxuJ10uam9pbignJyk7XG5cbiAgICAgIGlmIChjb21tb24uZWRpdG9yICYmIHR5cGVvZiBjb21tb24uZWRpdG9yLmdldFZhbHVlID09PSAnZnVuY3Rpb24nICYmIGNvbW1vbi5lZGl0b3IuZ2V0VmFsdWUoKS50cmltKCkpIHtcbiAgICAgICAgdmFyIHR5cGU7XG4gICAgICAgIHN3aXRjaCAoY29tbW9uLmNoYWxsZW5nZVR5cGUpIHtcbiAgICAgICAgICBjYXNlIGNvbW1vbi5jaGFsbGVuZ2VUeXBlcy5IVE1MOlxuICAgICAgICAgICAgdHlwZSA9ICdodG1sJztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgY29tbW9uLmNoYWxsZW5nZVR5cGVzLkpTOlxuICAgICAgICAgIGNhc2UgY29tbW9uLmNoYWxsZW5nZVR5cGVzLkJPTkZJUkU6XG4gICAgICAgICAgICB0eXBlID0gJ2phdmFzY3JpcHQnO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHR5cGUgPSAnJztcbiAgICAgICAgfVxuXG4gICAgICAgIHRleHRNZXNzYWdlICs9IFsnTXkgY29kZTpcXG5gYGAnLCB0eXBlLCAnXFxuJywgY29tbW9uLmVkaXRvci5nZXRWYWx1ZSgpLCAnXFxuYGBgXFxuXFxuJ10uam9pbignJyk7XG4gICAgICB9XG5cbiAgICAgIHRleHRNZXNzYWdlID0gZW5jb2RlVVJJQ29tcG9uZW50KHRleHRNZXNzYWdlKTtcblxuICAgICAgJCgnI2lzc3VlLW1vZGFsJykubW9kYWwoJ2hpZGUnKTtcbiAgICAgIHdpbmRvdy5vcGVuKCdodHRwczovL2dpdGh1Yi5jb20vZnJlZWNvZGVjYW1wL2ZyZWVjb2RlY2FtcC9pc3N1ZXMvbmV3PyZib2R5PScgKyB0ZXh0TWVzc2FnZSwgJ19ibGFuaycpO1xuICAgIH0pO1xuICB9KTtcblxuICByZXR1cm4gY29tbW9uO1xufSh3aW5kb3cpOyIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9O1xuXG5mdW5jdGlvbiBfb2JqZWN0V2l0aG91dFByb3BlcnRpZXMob2JqLCBrZXlzKSB7IHZhciB0YXJnZXQgPSB7fTsgZm9yICh2YXIgaSBpbiBvYmopIHsgaWYgKGtleXMuaW5kZXhPZihpKSA+PSAwKSBjb250aW51ZTsgaWYgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBpKSkgY29udGludWU7IHRhcmdldFtpXSA9IG9ialtpXTsgfSByZXR1cm4gdGFyZ2V0OyB9XG5cbndpbmRvdy5jb21tb24gPSBmdW5jdGlvbiAoZ2xvYmFsKSB7XG4gIHZhciBPYnNlcnZhYmxlID0gZ2xvYmFsLlJ4Lk9ic2VydmFibGU7XG4gIHZhciBjaGFpID0gZ2xvYmFsLmNoYWk7XG4gIHZhciBfZ2xvYmFsJGNvbW1vbiA9IGdsb2JhbC5jb21tb247XG4gIHZhciBjb21tb24gPSBfZ2xvYmFsJGNvbW1vbiA9PT0gdW5kZWZpbmVkID8geyBpbml0OiBbXSB9IDogX2dsb2JhbCRjb21tb247XG5cblxuICBjb21tb24ucnVuVGVzdHMkID0gZnVuY3Rpb24gcnVuVGVzdHMkKF9yZWYpIHtcbiAgICB2YXIgY29kZSA9IF9yZWYuY29kZTtcbiAgICB2YXIgb3JpZ2luYWxDb2RlID0gX3JlZi5vcmlnaW5hbENvZGU7XG4gICAgdmFyIHVzZXJUZXN0cyA9IF9yZWYudXNlclRlc3RzO1xuXG4gICAgdmFyIHJlc3QgPSBfb2JqZWN0V2l0aG91dFByb3BlcnRpZXMoX3JlZiwgW1wiY29kZVwiLCBcIm9yaWdpbmFsQ29kZVwiLCBcInVzZXJUZXN0c1wiXSk7XG5cbiAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tKHVzZXJUZXN0cykubWFwKGZ1bmN0aW9uICh0ZXN0KSB7XG5cbiAgICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLXVudXNlZC12YXJzICovXG4gICAgICB2YXIgYXNzZXJ0ID0gY2hhaS5hc3NlcnQ7XG4gICAgICB2YXIgZWRpdG9yID0ge1xuICAgICAgICBnZXRWYWx1ZTogZnVuY3Rpb24gZ2V0VmFsdWUoKSB7XG4gICAgICAgICAgcmV0dXJuIG9yaWdpbmFsQ29kZTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIC8qIGVzbGludC1lbmFibGUgbm8tdW51c2VkLXZhcnMgKi9cblxuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHRlc3QpIHtcbiAgICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby1ldmFsICAqL1xuICAgICAgICAgIGV2YWwoY29tbW9uLnJlYXNzZW1ibGVUZXN0KGNvZGUsIHRlc3QpKTtcbiAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLWV2YWwgKi9cbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB0ZXN0LmVyciA9IGUubWVzc2FnZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRlc3Q7XG4gICAgfSkudG9BcnJheSgpLm1hcChmdW5jdGlvbiAodGVzdHMpIHtcbiAgICAgIHJldHVybiBfZXh0ZW5kcyh7fSwgcmVzdCwgeyB0ZXN0czogdGVzdHMgfSk7XG4gICAgfSk7XG4gIH07XG5cbiAgcmV0dXJuIGNvbW1vbjtcbn0od2luZG93KTsiLCIndXNlIHN0cmljdCc7XG5cbndpbmRvdy5jb21tb24gPSBmdW5jdGlvbiAoZ2xvYmFsKSB7XG4gIHZhciAkID0gZ2xvYmFsLiQ7XG4gIHZhciBtb21lbnQgPSBnbG9iYWwubW9tZW50O1xuICB2YXIgX2dsb2JhbCRnYSA9IGdsb2JhbC5nYTtcbiAgdmFyIGdhID0gX2dsb2JhbCRnYSA9PT0gdW5kZWZpbmVkID8gZnVuY3Rpb24gKCkge30gOiBfZ2xvYmFsJGdhO1xuICB2YXIgX2dsb2JhbCRjb21tb24gPSBnbG9iYWwuY29tbW9uO1xuICB2YXIgY29tbW9uID0gX2dsb2JhbCRjb21tb24gPT09IHVuZGVmaW5lZCA/IHsgaW5pdDogW10gfSA6IF9nbG9iYWwkY29tbW9uO1xuXG5cbiAgZnVuY3Rpb24gc3VibWl0Q2hhbGxlbmdlSGFuZGxlcihlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgdmFyIHNvbHV0aW9uID0gY29tbW9uLmVkaXRvci5nZXRWYWx1ZSgpO1xuXG4gICAgJCgnI3N1Ym1pdC1jaGFsbGVuZ2UnKS5hdHRyKCdkaXNhYmxlZCcsICd0cnVlJykucmVtb3ZlQ2xhc3MoJ2J0bi1wcmltYXJ5JykuYWRkQ2xhc3MoJ2J0bi13YXJuaW5nIGRpc2FibGVkJyk7XG5cbiAgICB2YXIgJGNoZWNrbWFya0NvbnRhaW5lciA9ICQoJyNjaGVja21hcmstY29udGFpbmVyJyk7XG4gICAgJGNoZWNrbWFya0NvbnRhaW5lci5jc3MoeyBoZWlnaHQ6ICRjaGVja21hcmtDb250YWluZXIuaW5uZXJIZWlnaHQoKSB9KTtcblxuICAgICQoJyNjaGFsbGVuZ2UtY2hlY2ttYXJrJykuYWRkQ2xhc3MoJ3pvb21PdXRVcCcpXG4gICAgLy8gLnJlbW92ZUNsYXNzKCd6b29tSW5Eb3duJylcbiAgICAuZGVsYXkoMTAwMCkucXVldWUoZnVuY3Rpb24gKG5leHQpIHtcbiAgICAgICQodGhpcykucmVwbGFjZVdpdGgoJzxkaXYgaWQ9XCJjaGFsbGVuZ2Utc3Bpbm5lclwiICcgKyAnY2xhc3M9XCJhbmltYXRlZCB6b29tSW5VcCBpbm5lci1jaXJjbGVzLWxvYWRlclwiPicgKyAnc3VibWl0dGluZy4uLjwvZGl2PicpO1xuICAgICAgbmV4dCgpO1xuICAgIH0pO1xuXG4gICAgdmFyIHRpbWV6b25lID0gJ1VUQyc7XG4gICAgdHJ5IHtcbiAgICAgIHRpbWV6b25lID0gbW9tZW50LnR6Lmd1ZXNzKCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBlcnIubWVzc2FnZSA9ICdcXG4gICAgICAgICAga25vd24gYnVnLCBzZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9tb21lbnQvbW9tZW50LXRpbWV6b25lL2lzc3Vlcy8yOTQ6XFxuICAgICAgICAgICcgKyBlcnIubWVzc2FnZSArICdcXG4gICAgICAgICc7XG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgfVxuICAgIHZhciBkYXRhID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgaWQ6IGNvbW1vbi5jaGFsbGVuZ2VJZCxcbiAgICAgIG5hbWU6IGNvbW1vbi5jaGFsbGVuZ2VOYW1lLFxuICAgICAgY2hhbGxlbmdlVHlwZTogK2NvbW1vbi5jaGFsbGVuZ2VUeXBlLFxuICAgICAgc29sdXRpb246IHNvbHV0aW9uLFxuICAgICAgdGltZXpvbmU6IHRpbWV6b25lXG4gICAgfSk7XG5cbiAgICAkLmFqYXgoe1xuICAgICAgdXJsOiAnL2NvbXBsZXRlZC1jaGFsbGVuZ2UvJyxcbiAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgIGRhdGE6IGRhdGEsXG4gICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgIH0pLnN1Y2Nlc3MoZnVuY3Rpb24gKHJlcykge1xuICAgICAgaWYgKHJlcykge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24gPSAnL2NoYWxsZW5nZXMvbmV4dC1jaGFsbGVuZ2U/aWQ9JyArIGNvbW1vbi5jaGFsbGVuZ2VJZDtcbiAgICAgIH1cbiAgICB9KS5mYWlsKGZ1bmN0aW9uICgpIHtcbiAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZXBsYWNlKHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcbiAgICB9KTtcbiAgfVxuXG4gIGNvbW1vbi5zaG93Q29tcGxldGlvbiA9IGZ1bmN0aW9uIHNob3dDb21wbGV0aW9uKCkge1xuXG4gICAgZ2EoJ3NlbmQnLCAnZXZlbnQnLCAnQ2hhbGxlbmdlJywgJ3NvbHZlZCcsIGNvbW1vbi5nYU5hbWUsIHRydWUpO1xuXG4gICAgJCgnI2NvbXBsZXRlLWNvdXJzZXdhcmUtZGlhbG9nJykubW9kYWwoJ3Nob3cnKTtcbiAgICAkKCcjY29tcGxldGUtY291cnNld2FyZS1kaWFsb2cgLm1vZGFsLWhlYWRlcicpLmNsaWNrKCk7XG5cbiAgICAkKCcjc3VibWl0LWNoYWxsZW5nZScpLm9mZignY2xpY2snKTtcbiAgICAkKCcjc3VibWl0LWNoYWxsZW5nZScpLm9uKCdjbGljaycsIHN1Ym1pdENoYWxsZW5nZUhhbmRsZXIpO1xuICB9O1xuXG4gIHJldHVybiBjb21tb247XG59KHdpbmRvdyk7IiwiJ3VzZSBzdHJpY3QnO1xuXG53aW5kb3cuY29tbW9uID0gZnVuY3Rpb24gKF9yZWYpIHtcbiAgdmFyICQgPSBfcmVmLiQ7XG4gIHZhciBfcmVmJGNvbW1vbiA9IF9yZWYuY29tbW9uO1xuICB2YXIgY29tbW9uID0gX3JlZiRjb21tb24gPT09IHVuZGVmaW5lZCA/IHsgaW5pdDogW10gfSA6IF9yZWYkY29tbW9uO1xuXG4gIHZhciBzdGVwQ2xhc3MgPSAnLmNoYWxsZW5nZS1zdGVwJztcbiAgdmFyIHByZXZCdG5DbGFzcyA9ICcuY2hhbGxlbmdlLXN0ZXAtYnRuLXByZXYnO1xuICB2YXIgbmV4dEJ0bkNsYXNzID0gJy5jaGFsbGVuZ2Utc3RlcC1idG4tbmV4dCc7XG4gIHZhciBhY3Rpb25CdG5DbGFzcyA9ICcuY2hhbGxlbmdlLXN0ZXAtYnRuLWFjdGlvbic7XG4gIHZhciBmaW5pc2hCdG5DbGFzcyA9ICcuY2hhbGxlbmdlLXN0ZXAtYnRuLWZpbmlzaCc7XG4gIHZhciBzdWJtaXRCdG5JZCA9ICcjY2hhbGxlbmdlLXN0ZXAtYnRuLXN1Ym1pdCc7XG4gIHZhciBzdWJtaXRNb2RhbElkID0gJyNjaGFsbGVuZ2Utc3RlcC1tb2RhbCc7XG5cbiAgZnVuY3Rpb24gZ2V0UHJldmlvdXNTdGVwKCRjaGFsbGVuZ2VTdGVwcykge1xuICAgIHZhciAkcHJldlN0ZXAgPSBmYWxzZTtcbiAgICB2YXIgcHJldlN0ZXBJbmRleCA9IDA7XG4gICAgJGNoYWxsZW5nZVN0ZXBzLmVhY2goZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICB2YXIgJHN0ZXAgPSAkKHRoaXMpO1xuICAgICAgaWYgKCEkc3RlcC5oYXNDbGFzcygnaGlkZGVuJykpIHtcbiAgICAgICAgcHJldlN0ZXBJbmRleCA9IGluZGV4IC0gMTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgICRwcmV2U3RlcCA9ICRjaGFsbGVuZ2VTdGVwc1twcmV2U3RlcEluZGV4XTtcblxuICAgIHJldHVybiAkcHJldlN0ZXA7XG4gIH1cblxuICBmdW5jdGlvbiBnZXROZXh0U3RlcCgkY2hhbGxlbmdlU3RlcHMpIHtcbiAgICB2YXIgbGVuZ3RoID0gJGNoYWxsZW5nZVN0ZXBzLmxlbmd0aDtcbiAgICB2YXIgJG5leHRTdGVwID0gZmFsc2U7XG4gICAgdmFyIG5leHRTdGVwSW5kZXggPSAwO1xuICAgICRjaGFsbGVuZ2VTdGVwcy5lYWNoKGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgdmFyICRzdGVwID0gJCh0aGlzKTtcbiAgICAgIGlmICghJHN0ZXAuaGFzQ2xhc3MoJ2hpZGRlbicpICYmIGluZGV4ICsgMSAhPT0gbGVuZ3RoKSB7XG4gICAgICAgIG5leHRTdGVwSW5kZXggPSBpbmRleCArIDE7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAkbmV4dFN0ZXAgPSAkY2hhbGxlbmdlU3RlcHNbbmV4dFN0ZXBJbmRleF07XG5cbiAgICByZXR1cm4gJG5leHRTdGVwO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlUHJldlN0ZXBDbGljayhlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHZhciBwcmV2U3RlcCA9IGdldFByZXZpb3VzU3RlcCgkKHN0ZXBDbGFzcykpO1xuICAgICQodGhpcykucGFyZW50KCkucGFyZW50KCkucmVtb3ZlQ2xhc3MoJ3NsaWRlSW5MZWZ0IHNsaWRlSW5SaWdodCcpLmFkZENsYXNzKCdhbmltYXRlZCBmYWRlT3V0UmlnaHQgZmFzdC1hbmltYXRpb24nKS5kZWxheSgyNTApLnF1ZXVlKGZ1bmN0aW9uIChwcmV2KSB7XG4gICAgICAkKHRoaXMpLmFkZENsYXNzKCdoaWRkZW4nKTtcbiAgICAgIGlmIChwcmV2U3RlcCkge1xuICAgICAgICAkKHByZXZTdGVwKS5yZW1vdmVDbGFzcygnaGlkZGVuJykucmVtb3ZlQ2xhc3MoJ2ZhZGVPdXRMZWZ0IGZhZGVPdXRSaWdodCcpLmFkZENsYXNzKCdhbmltYXRlZCBzbGlkZUluTGVmdCBmYXN0LWFuaW1hdGlvbicpLmRlbGF5KDUwMCkucXVldWUoZnVuY3Rpb24gKHByZXYpIHtcbiAgICAgICAgICBwcmV2KCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcHJldigpO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlTmV4dFN0ZXBDbGljayhlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHZhciBuZXh0U3RlcCA9IGdldE5leHRTdGVwKCQoc3RlcENsYXNzKSk7XG4gICAgJCh0aGlzKS5wYXJlbnQoKS5wYXJlbnQoKS5yZW1vdmVDbGFzcygnc2xpZGVJblJpZ2h0IHNsaWRlSW5MZWZ0JykuYWRkQ2xhc3MoJ2FuaW1hdGVkIGZhZGVPdXRMZWZ0IGZhc3QtYW5pbWF0aW9uJykuZGVsYXkoMjUwKS5xdWV1ZShmdW5jdGlvbiAobmV4dCkge1xuICAgICAgJCh0aGlzKS5hZGRDbGFzcygnaGlkZGVuJyk7XG4gICAgICBpZiAobmV4dFN0ZXApIHtcbiAgICAgICAgJChuZXh0U3RlcCkucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpLnJlbW92ZUNsYXNzKCdmYWRlT3V0UmlnaHQgZmFkZU91dExlZnQnKS5hZGRDbGFzcygnYW5pbWF0ZWQgc2xpZGVJblJpZ2h0IGZhc3QtYW5pbWF0aW9uJykuZGVsYXkoNTAwKS5xdWV1ZShmdW5jdGlvbiAobmV4dCkge1xuICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBuZXh0KCk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVBY3Rpb25DbGljayhlKSB7XG4gICAgdmFyIHByb3BzID0gY29tbW9uLmNoYWxsZW5nZVNlZWRbMF0gfHwgeyBzdGVwSW5kZXg6IFtdIH07XG5cbiAgICB2YXIgJGVsID0gJCh0aGlzKTtcbiAgICB2YXIgaW5kZXggPSArJGVsLmF0dHIoJ2lkJyk7XG4gICAgdmFyIHByb3BJbmRleCA9IHByb3BzLnN0ZXBJbmRleC5pbmRleE9mKGluZGV4KTtcblxuICAgIGlmIChwcm9wSW5kZXggPT09IC0xKSB7XG4gICAgICByZXR1cm4gJGVsLnBhcmVudCgpLmZpbmQoJy5kaXNhYmxlZCcpLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuICAgIH1cblxuICAgIC8vIGFuIEFQSSBhY3Rpb25cbiAgICAvLyBwcmV2ZW50IGxpbmsgZnJvbSBvcGVuaW5nXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHZhciBwcm9wID0gcHJvcHMucHJvcGVydGllc1twcm9wSW5kZXhdO1xuICAgIHZhciBhcGkgPSBwcm9wcy5hcGlzW3Byb3BJbmRleF07XG4gICAgaWYgKGNvbW1vbltwcm9wXSkge1xuICAgICAgcmV0dXJuICRlbC5wYXJlbnQoKS5maW5kKCcuZGlzYWJsZWQnKS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcbiAgICB9XG4gICAgcmV0dXJuICQucG9zdChhcGkpLmRvbmUoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgIC8vIGFzc3VtZSBhIGJvb2xlYW4gaW5kaWNhdGVzIHBhc3NpbmdcbiAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgIHJldHVybiAkZWwucGFyZW50KCkuZmluZCgnLmRpc2FibGVkJykucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICB9XG4gICAgICAvLyBhc3N1bWUgYXBpIHJldHVybnMgc3RyaW5nIHdoZW4gZmFpbHNcbiAgICAgIHJldHVybiAkZWwucGFyZW50KCkuZmluZCgnLmRpc2FibGVkJykucmVwbGFjZVdpdGgoJzxwIGNsYXNzPVwiY29sLXNtLTQgY29sLXhzLTEyXCI+JyArIGRhdGEgKyAnPC9wPicpO1xuICAgIH0pLmZhaWwoZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coJ2ZhaWxlZCcpO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlRmluaXNoQ2xpY2soZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAkKHN1Ym1pdE1vZGFsSWQpLm1vZGFsKCdzaG93Jyk7XG4gICAgJChzdWJtaXRNb2RhbElkICsgJy5tb2RhbC1oZWFkZXInKS5jbGljaygpO1xuICAgICQoc3VibWl0QnRuSWQpLmNsaWNrKGhhbmRsZVN1Ym1pdENsaWNrKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZVN1Ym1pdENsaWNrKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAkKCcjc3VibWl0LWNoYWxsZW5nZScpLmF0dHIoJ2Rpc2FibGVkJywgJ3RydWUnKS5yZW1vdmVDbGFzcygnYnRuLXByaW1hcnknKS5hZGRDbGFzcygnYnRuLXdhcm5pbmcgZGlzYWJsZWQnKTtcblxuICAgIHZhciAkY2hlY2ttYXJrQ29udGFpbmVyID0gJCgnI2NoZWNrbWFyay1jb250YWluZXInKTtcbiAgICAkY2hlY2ttYXJrQ29udGFpbmVyLmNzcyh7IGhlaWdodDogJGNoZWNrbWFya0NvbnRhaW5lci5pbm5lckhlaWdodCgpIH0pO1xuXG4gICAgJCgnI2NoYWxsZW5nZS1jaGVja21hcmsnKS5hZGRDbGFzcygnem9vbU91dFVwJykuZGVsYXkoMTAwMCkucXVldWUoZnVuY3Rpb24gKG5leHQpIHtcbiAgICAgICQodGhpcykucmVwbGFjZVdpdGgoJzxkaXYgaWQ9XCJjaGFsbGVuZ2Utc3Bpbm5lclwiICcgKyAnY2xhc3M9XCJhbmltYXRlZCB6b29tSW5VcCBpbm5lci1jaXJjbGVzLWxvYWRlclwiPicgKyAnc3VibWl0dGluZy4uLjwvZGl2PicpO1xuICAgICAgbmV4dCgpO1xuICAgIH0pO1xuXG4gICAgJC5hamF4KHtcbiAgICAgIHVybDogJy9jb21wbGV0ZWQtY2hhbGxlbmdlLycsXG4gICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIGlkOiBjb21tb24uY2hhbGxlbmdlSWQsXG4gICAgICAgIG5hbWU6IGNvbW1vbi5jaGFsbGVuZ2VOYW1lLFxuICAgICAgICBjaGFsbGVuZ2VUeXBlOiArY29tbW9uLmNoYWxsZW5nZVR5cGVcbiAgICAgIH0pLFxuICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICB9KS5zdWNjZXNzKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgIGlmIChyZXMpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uID0gJy9jaGFsbGVuZ2VzL25leHQtY2hhbGxlbmdlP2lkPScgKyBjb21tb24uY2hhbGxlbmdlSWQ7XG4gICAgICB9XG4gICAgfSkuZmFpbChmdW5jdGlvbiAoKSB7XG4gICAgICB3aW5kb3cubG9jYXRpb24ucmVwbGFjZSh3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gICAgfSk7XG4gIH1cblxuICBjb21tb24uaW5pdC5wdXNoKGZ1bmN0aW9uICgkKSB7XG4gICAgaWYgKGNvbW1vbi5jaGFsbGVuZ2VUeXBlICE9PSAnNycpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgICQocHJldkJ0bkNsYXNzKS5jbGljayhoYW5kbGVQcmV2U3RlcENsaWNrKTtcbiAgICAkKG5leHRCdG5DbGFzcykuY2xpY2soaGFuZGxlTmV4dFN0ZXBDbGljayk7XG4gICAgJChhY3Rpb25CdG5DbGFzcykuY2xpY2soaGFuZGxlQWN0aW9uQ2xpY2spO1xuICAgICQoZmluaXNoQnRuQ2xhc3MpLmNsaWNrKGhhbmRsZUZpbmlzaENsaWNrKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfSk7XG5cbiAgcmV0dXJuIGNvbW1vbjtcbn0od2luZG93KTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbmZ1bmN0aW9uIF9vYmplY3RXaXRob3V0UHJvcGVydGllcyhvYmosIGtleXMpIHsgdmFyIHRhcmdldCA9IHt9OyBmb3IgKHZhciBpIGluIG9iaikgeyBpZiAoa2V5cy5pbmRleE9mKGkpID49IDApIGNvbnRpbnVlOyBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGkpKSBjb250aW51ZTsgdGFyZ2V0W2ldID0gb2JqW2ldOyB9IHJldHVybiB0YXJnZXQ7IH1cblxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24gKCkge1xuICB2YXIgY29tbW9uID0gd2luZG93LmNvbW1vbjtcbiAgdmFyIE9ic2VydmFibGUgPSB3aW5kb3cuUnguT2JzZXJ2YWJsZTtcbiAgdmFyIGFkZExvb3BQcm90ZWN0ID0gY29tbW9uLmFkZExvb3BQcm90ZWN0O1xuICB2YXIgY2hhbGxlbmdlTmFtZSA9IGNvbW1vbi5jaGFsbGVuZ2VOYW1lO1xuICB2YXIgY2hhbGxlbmdlVHlwZSA9IGNvbW1vbi5jaGFsbGVuZ2VUeXBlO1xuICB2YXIgY2hhbGxlbmdlVHlwZXMgPSBjb21tb24uY2hhbGxlbmdlVHlwZXM7XG5cblxuICBjb21tb24uaW5pdC5mb3JFYWNoKGZ1bmN0aW9uIChpbml0KSB7XG4gICAgaW5pdCgkKTtcbiAgfSk7XG5cbiAgLy8gb25seSBydW4gaWYgZWRpdG9yIHByZXNlbnRcbiAgaWYgKGNvbW1vbi5lZGl0b3IuZ2V0VmFsdWUpIHtcbiAgICB2YXIgY29kZSQgPSBjb21tb24uZWRpdG9yS2V5VXAkLmRlYm91bmNlKDc1MCkubWFwKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBjb21tb24uZWRpdG9yLmdldFZhbHVlKCk7XG4gICAgfSkuZGlzdGluY3RVbnRpbENoYW5nZWQoKS5zaGFyZVJlcGxheSgpO1xuXG4gICAgLy8gdXBkYXRlIHN0b3JhZ2VcbiAgICBjb2RlJC5zdWJzY3JpYmUoZnVuY3Rpb24gKGNvZGUpIHtcbiAgICAgIGNvbW1vbi5jb2RlU3RvcmFnZS51cGRhdGVTdG9yYWdlKGNvbW1vbi5jaGFsbGVuZ2VOYW1lLCBjb2RlKTtcbiAgICAgIGNvbW1vbi5jb2RlVXJpLnF1ZXJpZnkoY29kZSk7XG4gICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICB9KTtcblxuICAgIGNvZGUkXG4gICAgLy8gb25seSBydW4gZm9yIEhUTUxcbiAgICAuZmlsdGVyKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBjb21tb24uY2hhbGxlbmdlVHlwZSA9PT0gY2hhbGxlbmdlVHlwZXMuSFRNTDtcbiAgICB9KS5mbGF0TWFwKGZ1bmN0aW9uIChjb2RlKSB7XG4gICAgICByZXR1cm4gY29tbW9uLmRldGVjdFVuc2FmZUNvZGUkKGNvZGUpLm1hcChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjb21iaW5lZENvZGUgPSBjb21tb24uaGVhZCArIGNvZGUgKyBjb21tb24udGFpbDtcblxuICAgICAgICByZXR1cm4gYWRkTG9vcFByb3RlY3QoY29tYmluZWRDb2RlKTtcbiAgICAgIH0pLmZsYXRNYXAoZnVuY3Rpb24gKGNvZGUpIHtcbiAgICAgICAgcmV0dXJuIGNvbW1vbi51cGRhdGVQcmV2aWV3JChjb2RlKTtcbiAgICAgIH0pLmZsYXRNYXAoZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gY29tbW9uLmNoZWNrUHJldmlldyQoeyBjb2RlOiBjb2RlIH0pO1xuICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5qdXN0KHsgZXJyOiBlcnIgfSk7XG4gICAgICB9KTtcbiAgICB9KS5zdWJzY3JpYmUoZnVuY3Rpb24gKF9yZWYpIHtcbiAgICAgIHZhciBlcnIgPSBfcmVmLmVycjtcblxuICAgICAgaWYgKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgIHJldHVybiBjb21tb24udXBkYXRlUHJldmlldyQoJ1xcbiAgICAgICAgICAgICAgPGgxPicgKyBlcnIgKyAnPC9oMT5cXG4gICAgICAgICAgICAnKS5zdWJzY3JpYmUoZnVuY3Rpb24gKCkge30pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICB9KTtcbiAgfVxuXG4gIGNvbW1vbi5yZXNldEJ0biQuZG9Pbk5leHQoZnVuY3Rpb24gKCkge1xuICAgIGNvbW1vbi5lZGl0b3Iuc2V0VmFsdWUoY29tbW9uLnJlcGxhY2VTYWZlVGFncyhjb21tb24uc2VlZCkpO1xuICB9KS5mbGF0TWFwKGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gY29tbW9uLmV4ZWN1dGVDaGFsbGVuZ2UkKCkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgcmV0dXJuIE9ic2VydmFibGUuanVzdCh7IGVycjogZXJyIH0pO1xuICAgIH0pO1xuICB9KS5zdWJzY3JpYmUoZnVuY3Rpb24gKF9yZWYyKSB7XG4gICAgdmFyIGVyciA9IF9yZWYyLmVycjtcbiAgICB2YXIgb3V0cHV0ID0gX3JlZjIub3V0cHV0O1xuICAgIHZhciBvcmlnaW5hbENvZGUgPSBfcmVmMi5vcmlnaW5hbENvZGU7XG5cbiAgICBpZiAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICByZXR1cm4gY29tbW9uLnVwZGF0ZU91dHB1dERpc3BsYXkoJycgKyBlcnIpO1xuICAgIH1cbiAgICBjb21tb24uY29kZVN0b3JhZ2UudXBkYXRlU3RvcmFnZShjaGFsbGVuZ2VOYW1lLCBvcmlnaW5hbENvZGUpO1xuICAgIGNvbW1vbi5jb2RlVXJpLnF1ZXJpZnkob3JpZ2luYWxDb2RlKTtcbiAgICBjb21tb24udXBkYXRlT3V0cHV0RGlzcGxheShvdXRwdXQpO1xuICAgIHJldHVybiBudWxsO1xuICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgIH1cbiAgICBjb21tb24udXBkYXRlT3V0cHV0RGlzcGxheSgnJyArIGVycik7XG4gIH0pO1xuXG4gIE9ic2VydmFibGUubWVyZ2UoY29tbW9uLmVkaXRvckV4ZWN1dGUkLCBjb21tb24uc3VibWl0QnRuJCkuZmxhdE1hcChmdW5jdGlvbiAoKSB7XG4gICAgY29tbW9uLmFwcGVuZFRvT3V0cHV0RGlzcGxheSgnXFxuLy8gdGVzdGluZyBjaGFsbGVuZ2UuLi4nKTtcbiAgICByZXR1cm4gY29tbW9uLmV4ZWN1dGVDaGFsbGVuZ2UkKCkubWFwKGZ1bmN0aW9uIChfcmVmMykge1xuICAgICAgdmFyIHRlc3RzID0gX3JlZjMudGVzdHM7XG5cbiAgICAgIHZhciByZXN0ID0gX29iamVjdFdpdGhvdXRQcm9wZXJ0aWVzKF9yZWYzLCBbJ3Rlc3RzJ10pO1xuXG4gICAgICB2YXIgc29sdmVkID0gdGVzdHMuZXZlcnkoZnVuY3Rpb24gKHRlc3QpIHtcbiAgICAgICAgcmV0dXJuICF0ZXN0LmVycjtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIF9leHRlbmRzKHt9LCByZXN0LCB7IHRlc3RzOiB0ZXN0cywgc29sdmVkOiBzb2x2ZWQgfSk7XG4gICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgcmV0dXJuIE9ic2VydmFibGUuanVzdCh7IGVycjogZXJyIH0pO1xuICAgIH0pO1xuICB9KS5zdWJzY3JpYmUoZnVuY3Rpb24gKF9yZWY0KSB7XG4gICAgdmFyIGVyciA9IF9yZWY0LmVycjtcbiAgICB2YXIgc29sdmVkID0gX3JlZjQuc29sdmVkO1xuICAgIHZhciBvdXRwdXQgPSBfcmVmNC5vdXRwdXQ7XG4gICAgdmFyIHRlc3RzID0gX3JlZjQudGVzdHM7XG5cbiAgICBpZiAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICBpZiAoY29tbW9uLmNoYWxsZW5nZVR5cGUgPT09IGNvbW1vbi5jaGFsbGVuZ2VUeXBlcy5IVE1MKSB7XG4gICAgICAgIHJldHVybiBjb21tb24udXBkYXRlUHJldmlldyQoJ1xcbiAgICAgICAgICAgICAgPGgxPicgKyBlcnIgKyAnPC9oMT5cXG4gICAgICAgICAgICAnKS5maXJzdCgpLnN1YnNjcmliZShmdW5jdGlvbiAoKSB7fSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY29tbW9uLnVwZGF0ZU91dHB1dERpc3BsYXkoJycgKyBlcnIpO1xuICAgIH1cbiAgICBjb21tb24udXBkYXRlT3V0cHV0RGlzcGxheShvdXRwdXQpO1xuICAgIGNvbW1vbi5kaXNwbGF5VGVzdFJlc3VsdHModGVzdHMpO1xuICAgIGlmIChzb2x2ZWQpIHtcbiAgICAgIGNvbW1vbi5zaG93Q29tcGxldGlvbigpO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfSwgZnVuY3Rpb24gKF9yZWY1KSB7XG4gICAgdmFyIGVyciA9IF9yZWY1LmVycjtcblxuICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICBjb21tb24udXBkYXRlT3V0cHV0RGlzcGxheSgnJyArIGVycik7XG4gIH0pO1xuXG4gIC8vIGluaXRpYWwgY2hhbGxlbmdlIHJ1biB0byBwb3B1bGF0ZSB0ZXN0c1xuICBpZiAoY2hhbGxlbmdlVHlwZSA9PT0gY2hhbGxlbmdlVHlwZXMuSFRNTCkge1xuICAgIHZhciAkcHJldmlldyA9ICQoJyNwcmV2aWV3Jyk7XG4gICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbUNhbGxiYWNrKCRwcmV2aWV3LnJlYWR5LCAkcHJldmlldykoKS5kZWxheSg1MDApLmZsYXRNYXAoZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGNvbW1vbi5leGVjdXRlQ2hhbGxlbmdlJCgpO1xuICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIHJldHVybiBPYnNlcnZhYmxlLmp1c3QoeyBlcnI6IGVyciB9KTtcbiAgICB9KS5zdWJzY3JpYmUoZnVuY3Rpb24gKF9yZWY2KSB7XG4gICAgICB2YXIgZXJyID0gX3JlZjYuZXJyO1xuICAgICAgdmFyIHRlc3RzID0gX3JlZjYudGVzdHM7XG5cbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICBpZiAoY29tbW9uLmNoYWxsZW5nZVR5cGUgPT09IGNvbW1vbi5jaGFsbGVuZ2VUeXBlcy5IVE1MKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbW1vbi51cGRhdGVQcmV2aWV3JCgnXFxuICAgICAgICAgICAgICAgIDxoMT4nICsgZXJyICsgJzwvaDE+XFxuICAgICAgICAgICAgICAnKS5zdWJzY3JpYmUoZnVuY3Rpb24gKCkge30pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb21tb24udXBkYXRlT3V0cHV0RGlzcGxheSgnJyArIGVycik7XG4gICAgICB9XG4gICAgICBjb21tb24uZGlzcGxheVRlc3RSZXN1bHRzKHRlc3RzKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0sIGZ1bmN0aW9uIChfcmVmNykge1xuICAgICAgdmFyIGVyciA9IF9yZWY3LmVycjtcblxuICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgIH0pO1xuICB9XG5cbiAgaWYgKGNoYWxsZW5nZVR5cGUgPT09IGNoYWxsZW5nZVR5cGVzLkJPTkZJUkUgfHwgY2hhbGxlbmdlVHlwZSA9PT0gY2hhbGxlbmdlVHlwZXMuSlMpIHtcbiAgICByZXR1cm4gT2JzZXJ2YWJsZS5qdXN0KHt9KS5kZWxheSg1MDApLmZsYXRNYXAoZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGNvbW1vbi5leGVjdXRlQ2hhbGxlbmdlJCgpO1xuICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIHJldHVybiBPYnNlcnZhYmxlLmp1c3QoeyBlcnI6IGVyciB9KTtcbiAgICB9KS5zdWJzY3JpYmUoZnVuY3Rpb24gKF9yZWY4KSB7XG4gICAgICB2YXIgZXJyID0gX3JlZjguZXJyO1xuICAgICAgdmFyIG9yaWdpbmFsQ29kZSA9IF9yZWY4Lm9yaWdpbmFsQ29kZTtcbiAgICAgIHZhciB0ZXN0cyA9IF9yZWY4LnRlc3RzO1xuXG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgcmV0dXJuIGNvbW1vbi51cGRhdGVPdXRwdXREaXNwbGF5KCcnICsgZXJyKTtcbiAgICAgIH1cbiAgICAgIGNvbW1vbi5jb2RlU3RvcmFnZS51cGRhdGVTdG9yYWdlKGNoYWxsZW5nZU5hbWUsIG9yaWdpbmFsQ29kZSk7XG4gICAgICBjb21tb24uZGlzcGxheVRlc3RSZXN1bHRzKHRlc3RzKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgIGNvbW1vbi51cGRhdGVPdXRwdXREaXNwbGF5KCcnICsgZXJyKTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn0pOyJdLCJzb3VyY2VSb290IjoiL2NvbW1vbkZyYW1ld29yayJ9
