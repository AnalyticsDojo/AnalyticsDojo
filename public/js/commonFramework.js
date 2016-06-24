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
    var down = arguments[1];

    $('#testSuite').children().remove();
    $('#testSuite').fadeIn('slow');
    data.forEach(function (_ref2) {
      var _ref2$err = _ref2.err;
      var err = _ref2$err === undefined ? false : _ref2$err;
      var _ref2$text = _ref2.text;
      var text = _ref2$text === undefined ? '' : _ref2$text;

      var iconClass = err ? '"ion-close-circled big-error-icon"' : '"ion-checkmark-circled big-success-icon"';

      $('<div></div>').html('\n        <div class=\'row\'>\n          <div class=\'col-xs-2 text-center\'>\n            <i class=' + iconClass + '></i>\n          </div>\n          <div class=\'col-xs-10 test-output\'>\n            ' + text.split('message: ').pop().replace(/\'\);/g, '') + '\n          </div>\n          <div class=\'ten-pixel-break\'/>\n        </div>\n      ').appendTo($('#testSuite'));
    });
    if (down) {
      $('#scroll-locker').animate({ scrollTop: $(document).height() }, 'slow');
    }
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

    if (typeof str === 'function') {
      str = str.toString();
    }
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
    $('#testSuite').fadeOut('slow');
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
    common.displayTestResults(tests, true);
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
      common.displayTestResults(tests, false);
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
      common.displayTestResults(tests, false);
      return null;
    }, function (err) {
      console.error(err);
      common.updateOutputDisplay('' + err);
    });
  }
  return null;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluaXQuanMiLCJiaW5kaW5ncy5qcyIsImNvZGUtc3RvcmFnZS5qcyIsImNvZGUtdXJpLmpzIiwiYWRkLWxvb3AtcHJvdGVjdC5qcyIsImdldC1pZnJhbWUuanMiLCJ1cGRhdGUtcHJldmlldy5qcyIsImNyZWF0ZS1lZGl0b3IuanMiLCJkZXRlY3QtdW5zYWZlLWNvZGUtc3RyZWFtLmpzIiwiZGlzcGxheS10ZXN0LXJlc3VsdHMuanMiLCJleGVjdXRlLWNoYWxsZW5nZS1zdHJlYW0uanMiLCJvdXRwdXQtZGlzcGxheS5qcyIsInBob25lLXNjcm9sbC1sb2NrLmpzIiwicmVwb3J0LWlzc3VlLmpzIiwicnVuLXRlc3RzLXN0cmVhbS5qcyIsInNob3ctY29tcGxldGlvbi5qcyIsInN0ZXAtY2hhbGxlbmdlLmpzIiwiZW5kLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiY29tbW9uRnJhbWV3b3JrLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG53aW5kb3cuY29tbW9uID0gZnVuY3Rpb24gKGdsb2JhbCkge1xuICAvLyBjb21tb24gbmFtZXNwYWNlXG4gIC8vIGFsbCBjbGFzc2VzIHNob3VsZCBiZSBzdG9yZWQgaGVyZVxuICAvLyBjYWxsZWQgYXQgdGhlIGJlZ2lubmluZyBvZiBkb20gcmVhZHlcbiAgdmFyIF9nbG9iYWwkUnggPSBnbG9iYWwuUng7XG4gIHZhciBEaXNwb3NhYmxlID0gX2dsb2JhbCRSeC5EaXNwb3NhYmxlO1xuICB2YXIgT2JzZXJ2YWJsZSA9IF9nbG9iYWwkUnguT2JzZXJ2YWJsZTtcbiAgdmFyIGNvbmZpZyA9IF9nbG9iYWwkUnguY29uZmlnO1xuICB2YXIgX2dsb2JhbCRjb21tb24gPSBnbG9iYWwuY29tbW9uO1xuICB2YXIgY29tbW9uID0gX2dsb2JhbCRjb21tb24gPT09IHVuZGVmaW5lZCA/IHsgaW5pdDogW10gfSA6IF9nbG9iYWwkY29tbW9uO1xuXG5cbiAgY29uZmlnLmxvbmdTdGFja1N1cHBvcnQgPSB0cnVlO1xuICBjb21tb24uaGVhZCA9IGNvbW1vbi5oZWFkIHx8IFtdO1xuICBjb21tb24udGFpbCA9IGNvbW1vbi50YWlsIHx8IFtdO1xuICBjb21tb24uc2FsdCA9IE1hdGgucmFuZG9tKCk7XG5cbiAgY29tbW9uLmNoYWxsZW5nZVR5cGVzID0ge1xuICAgIEhUTUw6ICcwJyxcbiAgICBKUzogJzEnLFxuICAgIFZJREVPOiAnMicsXG4gICAgWklQTElORTogJzMnLFxuICAgIEJBU0VKVU1QOiAnNCcsXG4gICAgQk9ORklSRTogJzUnLFxuICAgIEhJS0VTOiAnNicsXG4gICAgU1RFUDogJzcnXG4gIH07XG5cbiAgY29tbW9uLmFycmF5VG9OZXdMaW5lU3RyaW5nID0gZnVuY3Rpb24gYXJyYXlUb05ld0xpbmVTdHJpbmcoc2VlZERhdGEpIHtcbiAgICBzZWVkRGF0YSA9IEFycmF5LmlzQXJyYXkoc2VlZERhdGEpID8gc2VlZERhdGEgOiBbc2VlZERhdGFdO1xuICAgIHJldHVybiBzZWVkRGF0YS5yZWR1Y2UoZnVuY3Rpb24gKHNlZWQsIGxpbmUpIHtcbiAgICAgIHJldHVybiAnJyArIHNlZWQgKyBsaW5lICsgJ1xcbic7XG4gICAgfSwgJ1xcbicpO1xuICB9O1xuXG4gIGNvbW1vbi5zZWVkID0gY29tbW9uLmFycmF5VG9OZXdMaW5lU3RyaW5nKGNvbW1vbi5jaGFsbGVuZ2VTZWVkKTtcblxuICBjb21tb24ucmVwbGFjZVNjcmlwdFRhZ3MgPSBmdW5jdGlvbiByZXBsYWNlU2NyaXB0VGFncyh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZS5yZXBsYWNlKC88c2NyaXB0Pi9naSwgJ2ZjY3NzJykucmVwbGFjZSgvPFxcL3NjcmlwdD4vZ2ksICdmY2NlcycpO1xuICB9O1xuXG4gIGNvbW1vbi5yZXBsYWNlU2FmZVRhZ3MgPSBmdW5jdGlvbiByZXBsYWNlU2FmZVRhZ3ModmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUucmVwbGFjZSgvZmNjc3MvZ2ksICc8c2NyaXB0PicpLnJlcGxhY2UoL2ZjY2VzL2dpLCAnPC9zY3JpcHQ+Jyk7XG4gIH07XG5cbiAgY29tbW9uLnJlcGxhY2VGb3JtQWN0aW9uQXR0ciA9IGZ1bmN0aW9uIHJlcGxhY2VGb3JtQWN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoLzxmb3JtW14+XSo+LywgZnVuY3Rpb24gKHZhbCkge1xuICAgICAgcmV0dXJuIHZhbC5yZXBsYWNlKC9hY3Rpb24oXFxzKj8pPS8sICdmY2NmYWEkMT0nKTtcbiAgICB9KTtcbiAgfTtcblxuICBjb21tb24ucmVwbGFjZUZjY2ZhYUF0dHIgPSBmdW5jdGlvbiByZXBsYWNlRmNjZmFhQXR0cih2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZS5yZXBsYWNlKC88Zm9ybVtePl0qPi8sIGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgIHJldHVybiB2YWwucmVwbGFjZSgvZmNjZmFhKFxccyo/KT0vLCAnYWN0aW9uJDE9Jyk7XG4gICAgfSk7XG4gIH07XG5cbiAgY29tbW9uLnNjb3BlalF1ZXJ5ID0gZnVuY3Rpb24gc2NvcGVqUXVlcnkoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXCQvZ2ksICdqJCcpLnJlcGxhY2UoL2RvY3VtZW50L2dpLCAnamRvY3VtZW50JykucmVwbGFjZSgvalF1ZXJ5L2dpLCAnampRdWVyeScpO1xuICB9O1xuXG4gIGNvbW1vbi51blNjb3BlSlF1ZXJ5ID0gZnVuY3Rpb24gdW5TY29wZUpRdWVyeShzdHIpIHtcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoL2pcXCQvZ2ksICckJykucmVwbGFjZSgvamRvY3VtZW50L2dpLCAnZG9jdW1lbnQnKS5yZXBsYWNlKC9qalF1ZXJ5L2dpLCAnalF1ZXJ5Jyk7XG4gIH07XG5cbiAgdmFyIGNvbW1lbnRSZWdleCA9IC8oXFwvXFwqW14oXFwqXFwvKV0qXFwqXFwvKXwoWyBcXG5dXFwvXFwvW15cXG5dKikvZztcbiAgY29tbW9uLnJlbW92ZUNvbW1lbnRzID0gZnVuY3Rpb24gcmVtb3ZlQ29tbWVudHMoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKGNvbW1lbnRSZWdleCwgJycpO1xuICB9O1xuXG4gIHZhciBsb2dSZWdleCA9IC8oY29uc29sZVxcLltcXHddK1xccypcXCguKlxcOykvZztcbiAgY29tbW9uLnJlbW92ZUxvZ3MgPSBmdW5jdGlvbiByZW1vdmVMb2dzKHN0cikge1xuICAgIHJldHVybiBzdHIucmVwbGFjZShsb2dSZWdleCwgJycpO1xuICB9O1xuXG4gIGNvbW1vbi5yZWFzc2VtYmxlVGVzdCA9IGZ1bmN0aW9uIHJlYXNzZW1ibGVUZXN0KCkge1xuICAgIHZhciBjb2RlID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gJycgOiBhcmd1bWVudHNbMF07XG4gICAgdmFyIF9yZWYgPSBhcmd1bWVudHNbMV07XG4gICAgdmFyIGxpbmUgPSBfcmVmLmxpbmU7XG4gICAgdmFyIHRleHQgPSBfcmVmLnRleHQ7XG5cbiAgICB2YXIgcmVnZXhwID0gbmV3IFJlZ0V4cCgnLy8nICsgbGluZSArIGNvbW1vbi5zYWx0KTtcbiAgICByZXR1cm4gY29kZS5yZXBsYWNlKHJlZ2V4cCwgdGV4dCk7XG4gIH07XG5cbiAgY29tbW9uLmdldFNjcmlwdENvbnRlbnQkID0gZnVuY3Rpb24gZ2V0U2NyaXB0Q29udGVudCQoc2NyaXB0KSB7XG4gICAgcmV0dXJuIE9ic2VydmFibGUuY3JlYXRlKGZ1bmN0aW9uIChvYnNlcnZlcikge1xuICAgICAgdmFyIGpxWEhSID0gJC5nZXQoc2NyaXB0LCBudWxsLCBudWxsLCAndGV4dCcpLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgb2JzZXJ2ZXIub25OZXh0KGRhdGEpO1xuICAgICAgICBvYnNlcnZlci5vbkNvbXBsZXRlZCgpO1xuICAgICAgfSkuZmFpbChmdW5jdGlvbiAoZSkge1xuICAgICAgICByZXR1cm4gb2JzZXJ2ZXIub25FcnJvcihlKTtcbiAgICAgIH0pLmFsd2F5cyhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBvYnNlcnZlci5vbkNvbXBsZXRlZCgpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBuZXcgRGlzcG9zYWJsZShmdW5jdGlvbiAoKSB7XG4gICAgICAgIGpxWEhSLmFib3J0KCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICB2YXIgb3BlblNjcmlwdCA9IC9cXDxcXHM/c2NyaXB0XFxzP1xcPi9naTtcbiAgdmFyIGNsb3NpbmdTY3JpcHQgPSAvXFw8XFxzP1xcL1xccz9zY3JpcHRcXHM/XFw+L2dpO1xuXG4gIC8vIGRldGVjdHMgaWYgdGhlcmUgaXMgSmF2YVNjcmlwdCBpbiB0aGUgZmlyc3Qgc2NyaXB0IHRhZ1xuICBjb21tb24uaGFzSnMgPSBmdW5jdGlvbiBoYXNKcyhjb2RlKSB7XG4gICAgcmV0dXJuICEhY29tbW9uLmdldEpzRnJvbUh0bWwoY29kZSk7XG4gIH07XG5cbiAgLy8gZ3JhYnMgdGhlIGNvbnRlbnQgZnJvbSB0aGUgZmlyc3Qgc2NyaXB0IHRhZyBpbiB0aGUgY29kZVxuICBjb21tb24uZ2V0SnNGcm9tSHRtbCA9IGZ1bmN0aW9uIGdldEpzRnJvbUh0bWwoY29kZSkge1xuICAgIC8vIGdyYWIgdXNlciBqYXZhU2NyaXB0XG4gICAgcmV0dXJuIChjb2RlLnNwbGl0KG9wZW5TY3JpcHQpWzFdIHx8ICcnKS5zcGxpdChjbG9zaW5nU2NyaXB0KVswXSB8fCAnJztcbiAgfTtcblxuICByZXR1cm4gY29tbW9uO1xufSh3aW5kb3cpOyIsIid1c2Ugc3RyaWN0Jztcblxud2luZG93LmNvbW1vbiA9IGZ1bmN0aW9uIChnbG9iYWwpIHtcbiAgdmFyICQgPSBnbG9iYWwuJDtcbiAgdmFyIE9ic2VydmFibGUgPSBnbG9iYWwuUnguT2JzZXJ2YWJsZTtcbiAgdmFyIF9nbG9iYWwkY29tbW9uID0gZ2xvYmFsLmNvbW1vbjtcbiAgdmFyIGNvbW1vbiA9IF9nbG9iYWwkY29tbW9uID09PSB1bmRlZmluZWQgPyB7IGluaXQ6IFtdIH0gOiBfZ2xvYmFsJGNvbW1vbjtcbiAgdmFyIE1vdXNldHJhcCA9IGdsb2JhbC5Nb3VzZXRyYXA7XG5cblxuICBjb21tb24uY3RybEVudGVyQ2xpY2tIYW5kbGVyID0gZnVuY3Rpb24gY3RybEVudGVyQ2xpY2tIYW5kbGVyKGUpIHtcbiAgICAvLyBjdHJsICsgZW50ZXIgb3IgY21kICsgZW50ZXJcbiAgICBpZiAoZS5rZXlDb2RlID09PSAxMyAmJiAoZS5tZXRhS2V5IHx8IGUuY3RybEtleSkpIHtcbiAgICAgICQoJyNjb21wbGV0ZS1jb3Vyc2V3YXJlLWRpYWxvZycpLm9mZigna2V5ZG93bicsIGN0cmxFbnRlckNsaWNrSGFuZGxlcik7XG4gICAgICBpZiAoJCgnI3N1Ym1pdC1jaGFsbGVuZ2UnKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICQoJyNzdWJtaXQtY2hhbGxlbmdlJykuY2xpY2soKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9ICcvY2hhbGxlbmdlcy9uZXh0LWNoYWxsZW5nZT9pZD0nICsgY29tbW9uLmNoYWxsZW5nZUlkO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBjb21tb24uaW5pdC5wdXNoKGZ1bmN0aW9uICgkKSB7XG5cbiAgICB2YXIgJG1hcmdpbkZpeCA9ICQoJy5pbm5lck1hcmdpbkZpeCcpO1xuICAgICRtYXJnaW5GaXguY3NzKCdtaW4taGVpZ2h0JywgJG1hcmdpbkZpeC5oZWlnaHQoKSk7XG5cbiAgICBjb21tb24uc3VibWl0QnRuJCA9IE9ic2VydmFibGUuZnJvbUV2ZW50KCQoJyNzdWJtaXRCdXR0b24nKSwgJ2NsaWNrJyk7XG5cbiAgICBjb21tb24ucmVzZXRCdG4kID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQoJCgnI3Jlc2V0LWJ1dHRvbicpLCAnY2xpY2snKTtcblxuICAgIC8vIGluaXQgbW9kYWwga2V5YmluZGluZ3Mgb24gb3BlblxuICAgICQoJyNjb21wbGV0ZS1jb3Vyc2V3YXJlLWRpYWxvZycpLm9uKCdzaG93bi5icy5tb2RhbCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICQoJyNjb21wbGV0ZS1jb3Vyc2V3YXJlLWRpYWxvZycpLmtleWRvd24oY29tbW9uLmN0cmxFbnRlckNsaWNrSGFuZGxlcik7XG4gICAgfSk7XG5cbiAgICAvLyByZW1vdmUgbW9kYWwga2V5YmluZHMgb24gY2xvc2VcbiAgICAkKCcjY29tcGxldGUtY291cnNld2FyZS1kaWFsb2cnKS5vbignaGlkZGVuLmJzLm1vZGFsJywgZnVuY3Rpb24gKCkge1xuICAgICAgJCgnI2NvbXBsZXRlLWNvdXJzZXdhcmUtZGlhbG9nJykub2ZmKCdrZXlkb3duJywgY29tbW9uLmN0cmxFbnRlckNsaWNrSGFuZGxlcik7XG4gICAgfSk7XG5cbiAgICAvLyBzZXQgZm9jdXMga2V5YmluZFxuICAgIE1vdXNldHJhcC5iaW5kKFsnY29tbWFuZCtzaGlmdCtlJywgJ2N0cmwrc2hpZnQrZSddLCBmdW5jdGlvbiAoKSB7XG4gICAgICBjb21tb24uZWRpdG9yLmZvY3VzKCk7XG4gICAgfSk7XG5cbiAgICAvLyB2aWRlbyBjaGVja2xpc3QgYmluZGluZ1xuICAgICQoJy5jaGFsbGVuZ2UtbGlzdC1jaGVja2JveCcpLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgY2hlY2tib3hJZCA9ICQodGhpcykucGFyZW50KCkucGFyZW50KCkuYXR0cignaWQnKTtcbiAgICAgIGlmICgkKHRoaXMpLmlzKCc6Y2hlY2tlZCcpKSB7XG4gICAgICAgICQodGhpcykucGFyZW50KCkuc2libGluZ3MoKS5jaGlsZHJlbigpLmFkZENsYXNzKCdmYWRlZCcpO1xuICAgICAgICBpZiAoIWxvY2FsU3RvcmFnZSB8fCAhbG9jYWxTdG9yYWdlW2NoZWNrYm94SWRdKSB7XG4gICAgICAgICAgbG9jYWxTdG9yYWdlW2NoZWNrYm94SWRdID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoISQodGhpcykuaXMoJzpjaGVja2VkJykpIHtcbiAgICAgICAgJCh0aGlzKS5wYXJlbnQoKS5zaWJsaW5ncygpLmNoaWxkcmVuKCkucmVtb3ZlQ2xhc3MoJ2ZhZGVkJyk7XG4gICAgICAgIGlmIChsb2NhbFN0b3JhZ2VbY2hlY2tib3hJZF0pIHtcbiAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShjaGVja2JveElkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgJCgnLmNoZWNrbGlzdC1lbGVtZW50JykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgY2hlY2tsaXN0RWxlbWVudElkID0gJCh0aGlzKS5hdHRyKCdpZCcpO1xuICAgICAgaWYgKGxvY2FsU3RvcmFnZVtjaGVja2xpc3RFbGVtZW50SWRdKSB7XG4gICAgICAgICQodGhpcykuY2hpbGRyZW4oKS5jaGlsZHJlbignbGknKS5hZGRDbGFzcygnZmFkZWQnKTtcbiAgICAgICAgJCh0aGlzKS5jaGlsZHJlbigpLmNoaWxkcmVuKCdpbnB1dCcpLnRyaWdnZXIoJ2NsaWNrJyk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyB2aWRlbyBjaGFsbGVuZ2Ugc3VibWl0XG4gICAgJCgnI25leHQtY291cnNld2FyZS1idXR0b24nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcjbmV4dC1jb3Vyc2V3YXJlLWJ1dHRvbicpLnVuYmluZCgnY2xpY2snKTtcbiAgICAgIGlmICgkKCcuc2lnbnVwLWJ0bi1uYXYnKS5sZW5ndGggPCAxKSB7XG4gICAgICAgIHZhciBkYXRhO1xuICAgICAgICB2YXIgc29sdXRpb24gPSAkKCcjcHVibGljLXVybCcpLnZhbCgpIHx8IG51bGw7XG4gICAgICAgIHZhciBnaXRodWJMaW5rID0gJCgnI2dpdGh1Yi11cmwnKS52YWwoKSB8fCBudWxsO1xuICAgICAgICBzd2l0Y2ggKGNvbW1vbi5jaGFsbGVuZ2VUeXBlKSB7XG4gICAgICAgICAgY2FzZSBjb21tb24uY2hhbGxlbmdlVHlwZXMuVklERU86XG4gICAgICAgICAgICBkYXRhID0ge1xuICAgICAgICAgICAgICBpZDogY29tbW9uLmNoYWxsZW5nZUlkLFxuICAgICAgICAgICAgICBuYW1lOiBjb21tb24uY2hhbGxlbmdlTmFtZSxcbiAgICAgICAgICAgICAgY2hhbGxlbmdlVHlwZTogK2NvbW1vbi5jaGFsbGVuZ2VUeXBlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgdXJsOiAnL2NvbXBsZXRlZC1jaGFsbGVuZ2UvJyxcbiAgICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShkYXRhKSxcbiAgICAgICAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgICAgICAgfSkuc3VjY2VzcyhmdW5jdGlvbiAocmVzKSB7XG4gICAgICAgICAgICAgIGlmICghcmVzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gJy9jaGFsbGVuZ2VzL25leHQtY2hhbGxlbmdlP2lkPScgKyBjb21tb24uY2hhbGxlbmdlSWQ7XG4gICAgICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlcGxhY2Uod2luZG93LmxvY2F0aW9uLmhyZWYpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgY29tbW9uLmNoYWxsZW5nZVR5cGVzLkJBU0VKVU1QOlxuICAgICAgICAgIGNhc2UgY29tbW9uLmNoYWxsZW5nZVR5cGVzLlpJUExJTkU6XG4gICAgICAgICAgICBkYXRhID0ge1xuICAgICAgICAgICAgICBpZDogY29tbW9uLmNoYWxsZW5nZUlkLFxuICAgICAgICAgICAgICBuYW1lOiBjb21tb24uY2hhbGxlbmdlTmFtZSxcbiAgICAgICAgICAgICAgY2hhbGxlbmdlVHlwZTogK2NvbW1vbi5jaGFsbGVuZ2VUeXBlLFxuICAgICAgICAgICAgICBzb2x1dGlvbjogc29sdXRpb24sXG4gICAgICAgICAgICAgIGdpdGh1Ykxpbms6IGdpdGh1YkxpbmtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgIHVybDogJy9jb21wbGV0ZWQtemlwbGluZS1vci1iYXNlanVtcC8nLFxuICAgICAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KGRhdGEpLFxuICAgICAgICAgICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nXG4gICAgICAgICAgICB9KS5zdWNjZXNzKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSAnL2NoYWxsZW5nZXMvbmV4dC1jaGFsbGVuZ2U/aWQ9JyArIGNvbW1vbi5jaGFsbGVuZ2VJZDtcbiAgICAgICAgICAgIH0pLmZhaWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVwbGFjZSh3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBjb21tb24uY2hhbGxlbmdlVHlwZXMuQk9ORklSRTpcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gJy9jaGFsbGVuZ2VzL25leHQtY2hhbGxlbmdlP2lkPScgKyBjb21tb24uY2hhbGxlbmdlSWQ7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnSGFwcHkgQ29kaW5nIScpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChjb21tb24uY2hhbGxlbmdlTmFtZSkge1xuICAgICAgd2luZG93LmdhKCdzZW5kJywgJ2V2ZW50JywgJ0NoYWxsZW5nZScsICdsb2FkJywgY29tbW9uLmdhTmFtZSk7XG4gICAgfVxuXG4gICAgJCgnLm1vZGFsJykub24oJ3Nob3cuYnMubW9kYWwnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcuZ2l0dGVyLWNoYXQtZW1iZWQsIC53aWtpLWFzaWRlLCAubWFwLWFzaWRlJykuYWRkQ2xhc3MoJ2lzLWNvbGxhcHNlZCcpO1xuICAgIH0pO1xuXG4gICAgJCgnI2NvbXBsZXRlLWNvdXJzZXdhcmUtZGlhbG9nJykub24oJ2hpZGRlbi5icy5tb2RhbCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChjb21tb24uZWRpdG9yLmZvY3VzKSB7XG4gICAgICAgIGNvbW1vbi5lZGl0b3IuZm9jdXMoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgICQoJyN0cmlnZ2VyLWlzc3VlLW1vZGFsJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgJCgnI2lzc3VlLW1vZGFsJykubW9kYWwoJ3Nob3cnKTtcbiAgICB9KTtcblxuICAgICQoJyN0cmlnZ2VyLWhlbHAtbW9kYWwnKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcjaGVscC1tb2RhbCcpLm1vZGFsKCdzaG93Jyk7XG4gICAgfSk7XG5cbiAgICAkKCcjdHJpZ2dlci1yZXNldC1tb2RhbCcpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICQoJyNyZXNldC1tb2RhbCcpLm1vZGFsKCdzaG93Jyk7XG4gICAgfSk7XG5cbiAgICAkKCcjdHJpZ2dlci1wYWlyLW1vZGFsJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgJCgnI3BhaXItbW9kYWwnKS5tb2RhbCgnc2hvdycpO1xuICAgIH0pO1xuXG4gICAgJCgnI2NvbXBsZXRlZC1jb3Vyc2V3YXJlJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgJCgnI2NvbXBsZXRlLWNvdXJzZXdhcmUtZGlhbG9nJykubW9kYWwoJ3Nob3cnKTtcbiAgICB9KTtcblxuICAgICQoJyNzaG93LXNvbHV0aW9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgJCgnI2NvbXBsZXRlLWNvdXJzZXdhcmUtZGlhbG9nJykubW9kYWwoJ2hpZGUnKTtcbiAgICAgICQoJyNuYXYtd2lraS1idG4nKS5jbGljaygpO1xuICAgIH0pO1xuXG4gICAgJCgnI2NoYWxsZW5nZS1oZWxwLWJ0bicpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICQoJy53aWtpLWFzaWRlLCAubWFwLWFzaWRlLCAjY2hhdC1lbWJlZC1tYWluJykuYWRkQ2xhc3MoJ2lzLWNvbGxhcHNlZCcpO1xuICAgIH0pO1xuXG4gICAgJCgnI2hlbHAtaXZlLWZvdW5kLWEtYnVnLXdpa2ktYXJ0aWNsZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHdpbmRvdy5vcGVuKCdodHRwczovL2dpdGh1Yi5jb20vRnJlZUNvZGVDYW1wL0ZyZWVDb2RlQ2FtcC93aWtpLycgKyAnRnJlZUNvZGVDYW1wLVJlcG9ydC1CdWdzJywgJ19ibGFuaycpO1xuICAgIH0pO1xuXG4gICAgJCgnI3NlYXJjaC1pc3N1ZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBxdWVyeUlzc3VlID0gd2luZG93LmxvY2F0aW9uLmhyZWYudG9TdHJpbmcoKS5zcGxpdCgnPycpWzBdLnJlcGxhY2UoLygjKikkLywgJycpO1xuICAgICAgd2luZG93Lm9wZW4oJ2h0dHBzOi8vZ2l0aHViLmNvbS9GcmVlQ29kZUNhbXAvRnJlZUNvZGVDYW1wL2lzc3Vlcz9xPScgKyAnaXM6aXNzdWUgaXM6YWxsICcgKyBjb21tb24uY2hhbGxlbmdlTmFtZSArICcgT1IgJyArIHF1ZXJ5SXNzdWUuc3Vic3RyKHF1ZXJ5SXNzdWUubGFzdEluZGV4T2YoJ2NoYWxsZW5nZXMvJykgKyAxMSkucmVwbGFjZSgnLycsICcnKSwgJ19ibGFuaycpO1xuICAgIH0pO1xuICB9KTtcblxuICByZXR1cm4gY29tbW9uO1xufSh3aW5kb3cpOyIsIid1c2Ugc3RyaWN0JztcblxuLy8gZGVwZW5kcyBvbjogY29kZVVyaVxud2luZG93LmNvbW1vbiA9IGZ1bmN0aW9uIChnbG9iYWwpIHtcbiAgdmFyIGxvY2FsU3RvcmFnZSA9IGdsb2JhbC5sb2NhbFN0b3JhZ2U7XG4gIHZhciBfZ2xvYmFsJGNvbW1vbiA9IGdsb2JhbC5jb21tb247XG4gIHZhciBjb21tb24gPSBfZ2xvYmFsJGNvbW1vbiA9PT0gdW5kZWZpbmVkID8geyBpbml0OiBbXSB9IDogX2dsb2JhbCRjb21tb247XG5cblxuICB2YXIgY2hhbGxlbmdlUHJlZml4ID0gWydCb25maXJlOiAnLCAnV2F5cG9pbnQ6ICcsICdaaXBsaW5lOiAnLCAnQmFzZWp1bXA6ICcsICdDaGVja3BvaW50OiAnXSxcbiAgICAgIGl0ZW07XG5cbiAgdmFyIGNvZGVTdG9yYWdlID0ge1xuICAgIGdldFN0b3JlZFZhbHVlOiBmdW5jdGlvbiBnZXRTdG9yZWRWYWx1ZShrZXkpIHtcbiAgICAgIGlmICghbG9jYWxTdG9yYWdlIHx8IHR5cGVvZiBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSAhPT0gJ2Z1bmN0aW9uJyB8fCAha2V5IHx8IHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCd1bmFibGUgdG8gcmVhZCBmcm9tIHN0b3JhZ2UnKTtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgICAgfVxuICAgICAgaWYgKGxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSArICdWYWwnKSkge1xuICAgICAgICByZXR1cm4gJycgKyBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkgKyAnVmFsJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBjaGFsbGVuZ2VQcmVmaXgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpdGVtID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oY2hhbGxlbmdlUHJlZml4W2ldICsga2V5ICsgJ1ZhbCcpO1xuICAgICAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gJycgKyBpdGVtO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcblxuXG4gICAgaXNBbGl2ZTogZnVuY3Rpb24gaXNBbGl2ZShrZXkpIHtcbiAgICAgIHZhciB2YWwgPSB0aGlzLmdldFN0b3JlZFZhbHVlKGtleSk7XG4gICAgICByZXR1cm4gdmFsICE9PSAnbnVsbCcgJiYgdmFsICE9PSAndW5kZWZpbmVkJyAmJiB2YWwgJiYgdmFsLmxlbmd0aCA+IDA7XG4gICAgfSxcblxuICAgIHVwZGF0ZVN0b3JhZ2U6IGZ1bmN0aW9uIHVwZGF0ZVN0b3JhZ2Uoa2V5LCBjb2RlKSB7XG4gICAgICBpZiAoIWxvY2FsU3RvcmFnZSB8fCB0eXBlb2YgbG9jYWxTdG9yYWdlLnNldEl0ZW0gIT09ICdmdW5jdGlvbicgfHwgIWtleSB8fCB0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJykge1xuICAgICAgICBjb25zb2xlLmxvZygndW5hYmxlIHRvIHNhdmUgdG8gc3RvcmFnZScpO1xuICAgICAgICByZXR1cm4gY29kZTtcbiAgICAgIH1cbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSArICdWYWwnLCBjb2RlKTtcbiAgICAgIHJldHVybiBjb2RlO1xuICAgIH1cbiAgfTtcblxuICBjb21tb24uY29kZVN0b3JhZ2UgPSBjb2RlU3RvcmFnZTtcblxuICByZXR1cm4gY29tbW9uO1xufSh3aW5kb3csIHdpbmRvdy5jb21tb24pOyIsIid1c2Ugc3RyaWN0JztcblxuLy8gc3RvcmUgY29kZSBpbiB0aGUgVVJMXG53aW5kb3cuY29tbW9uID0gZnVuY3Rpb24gKGdsb2JhbCkge1xuICB2YXIgX2VuY29kZSA9IGdsb2JhbC5lbmNvZGVVUklDb21wb25lbnQ7XG4gIHZhciBfZGVjb2RlID0gZ2xvYmFsLmRlY29kZVVSSUNvbXBvbmVudDtcbiAgdmFyIGxvY2F0aW9uID0gZ2xvYmFsLmxvY2F0aW9uO1xuICB2YXIgaGlzdG9yeSA9IGdsb2JhbC5oaXN0b3J5O1xuICB2YXIgX2dsb2JhbCRjb21tb24gPSBnbG9iYWwuY29tbW9uO1xuICB2YXIgY29tbW9uID0gX2dsb2JhbCRjb21tb24gPT09IHVuZGVmaW5lZCA/IHsgaW5pdDogW10gfSA6IF9nbG9iYWwkY29tbW9uO1xuICB2YXIgcmVwbGFjZVNjcmlwdFRhZ3MgPSBjb21tb24ucmVwbGFjZVNjcmlwdFRhZ3M7XG4gIHZhciByZXBsYWNlU2FmZVRhZ3MgPSBjb21tb24ucmVwbGFjZVNhZmVUYWdzO1xuICB2YXIgcmVwbGFjZUZvcm1BY3Rpb25BdHRyID0gY29tbW9uLnJlcGxhY2VGb3JtQWN0aW9uQXR0cjtcbiAgdmFyIHJlcGxhY2VGY2NmYWFBdHRyID0gY29tbW9uLnJlcGxhY2VGY2NmYWFBdHRyO1xuXG5cbiAgdmFyIHF1ZXJ5UmVnZXggPSAvXihcXD98I1xcPykvO1xuICBmdW5jdGlvbiBlbmNvZGVGY2ModmFsKSB7XG4gICAgcmV0dXJuIHJlcGxhY2VTY3JpcHRUYWdzKHJlcGxhY2VGb3JtQWN0aW9uQXR0cih2YWwpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlY29kZUZjYyh2YWwpIHtcbiAgICByZXR1cm4gcmVwbGFjZVNhZmVUYWdzKHJlcGxhY2VGY2NmYWFBdHRyKHZhbCkpO1xuICB9XG5cbiAgdmFyIGNvZGVVcmkgPSB7XG4gICAgZW5jb2RlOiBmdW5jdGlvbiBlbmNvZGUoY29kZSkge1xuICAgICAgcmV0dXJuIF9lbmNvZGUoY29kZSk7XG4gICAgfSxcbiAgICBkZWNvZGU6IGZ1bmN0aW9uIGRlY29kZShjb2RlKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gX2RlY29kZShjb2RlKTtcbiAgICAgIH0gY2F0Y2ggKGlnbm9yZSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9LFxuICAgIGlzSW5RdWVyeTogZnVuY3Rpb24gaXNJblF1ZXJ5KHF1ZXJ5KSB7XG4gICAgICB2YXIgZGVjb2RlZCA9IGNvZGVVcmkuZGVjb2RlKHF1ZXJ5KTtcbiAgICAgIGlmICghZGVjb2RlZCB8fCB0eXBlb2YgZGVjb2RlZC5zcGxpdCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gZGVjb2RlZC5yZXBsYWNlKHF1ZXJ5UmVnZXgsICcnKS5zcGxpdCgnJicpLnJlZHVjZShmdW5jdGlvbiAoZm91bmQsIHBhcmFtKSB7XG4gICAgICAgIHZhciBrZXkgPSBwYXJhbS5zcGxpdCgnPScpWzBdO1xuICAgICAgICBpZiAoa2V5ID09PSAnc29sdXRpb24nKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZvdW5kO1xuICAgICAgfSwgZmFsc2UpO1xuICAgIH0sXG4gICAgaXNBbGl2ZTogZnVuY3Rpb24gaXNBbGl2ZSgpIHtcbiAgICAgIHJldHVybiBjb2RlVXJpLmVuYWJsZWQgJiYgY29kZVVyaS5pc0luUXVlcnkobG9jYXRpb24uc2VhcmNoKSB8fCBjb2RlVXJpLmlzSW5RdWVyeShsb2NhdGlvbi5oYXNoKTtcbiAgICB9LFxuICAgIGdldEtleUluUXVlcnk6IGZ1bmN0aW9uIGdldEtleUluUXVlcnkocXVlcnkpIHtcbiAgICAgIHZhciBrZXlUb0ZpbmQgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDEgfHwgYXJndW1lbnRzWzFdID09PSB1bmRlZmluZWQgPyAnJyA6IGFyZ3VtZW50c1sxXTtcblxuICAgICAgcmV0dXJuIHF1ZXJ5LnNwbGl0KCcmJykucmVkdWNlKGZ1bmN0aW9uIChvbGRWYWx1ZSwgcGFyYW0pIHtcbiAgICAgICAgdmFyIGtleSA9IHBhcmFtLnNwbGl0KCc9JylbMF07XG4gICAgICAgIHZhciB2YWx1ZSA9IHBhcmFtLnNwbGl0KCc9Jykuc2xpY2UoMSkuam9pbignPScpO1xuXG4gICAgICAgIGlmIChrZXkgPT09IGtleVRvRmluZCkge1xuICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb2xkVmFsdWU7XG4gICAgICB9LCBudWxsKTtcbiAgICB9LFxuICAgIGdldFNvbHV0aW9uRnJvbVF1ZXJ5OiBmdW5jdGlvbiBnZXRTb2x1dGlvbkZyb21RdWVyeSgpIHtcbiAgICAgIHZhciBxdWVyeSA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/ICcnIDogYXJndW1lbnRzWzBdO1xuXG4gICAgICByZXR1cm4gZGVjb2RlRmNjKGNvZGVVcmkuZGVjb2RlKGNvZGVVcmkuZ2V0S2V5SW5RdWVyeShxdWVyeSwgJ3NvbHV0aW9uJykpKTtcbiAgICB9LFxuXG4gICAgcGFyc2U6IGZ1bmN0aW9uIHBhcnNlKCkge1xuICAgICAgaWYgKCFjb2RlVXJpLmVuYWJsZWQpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICB2YXIgcXVlcnk7XG4gICAgICBpZiAobG9jYXRpb24uc2VhcmNoICYmIGNvZGVVcmkuaXNJblF1ZXJ5KGxvY2F0aW9uLnNlYXJjaCkpIHtcbiAgICAgICAgcXVlcnkgPSBsb2NhdGlvbi5zZWFyY2gucmVwbGFjZSgvXlxcPy8sICcnKTtcblxuICAgICAgICBpZiAoaGlzdG9yeSAmJiB0eXBlb2YgaGlzdG9yeS5yZXBsYWNlU3RhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBoaXN0b3J5LnJlcGxhY2VTdGF0ZShoaXN0b3J5LnN0YXRlLCBudWxsLCBsb2NhdGlvbi5ocmVmLnNwbGl0KCc/JylbMF0pO1xuICAgICAgICAgIGxvY2F0aW9uLmhhc2ggPSAnIz8nICsgZW5jb2RlRmNjKHF1ZXJ5KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcXVlcnkgPSBsb2NhdGlvbi5oYXNoLnJlcGxhY2UoL15cXCNcXD8vLCAnJyk7XG4gICAgICB9XG5cbiAgICAgIGlmICghcXVlcnkpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLmdldFNvbHV0aW9uRnJvbVF1ZXJ5KHF1ZXJ5KTtcbiAgICB9LFxuICAgIHF1ZXJpZnk6IGZ1bmN0aW9uIHF1ZXJpZnkoc29sdXRpb24pIHtcbiAgICAgIGlmICghY29kZVVyaS5lbmFibGVkKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKGhpc3RvcnkgJiYgdHlwZW9mIGhpc3RvcnkucmVwbGFjZVN0YXRlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIGdyYWIgdGhlIHVybCB1cCB0byB0aGUgcXVlcnlcbiAgICAgICAgLy8gZGVzdHJveSBhbnkgaGFzaCBzeW1ib2xzIHN0aWxsIGNsaW5naW5nIHRvIGxpZmVcbiAgICAgICAgdmFyIHVybCA9IGxvY2F0aW9uLmhyZWYuc3BsaXQoJz8nKVswXS5yZXBsYWNlKC8oIyopJC8sICcnKTtcbiAgICAgICAgaGlzdG9yeS5yZXBsYWNlU3RhdGUoaGlzdG9yeS5zdGF0ZSwgbnVsbCwgdXJsICsgJyM/JyArIChjb2RlVXJpLnNob3VsZFJ1bigpID8gJycgOiAncnVuPWRpc2FibGVkJicpICsgJ3NvbHV0aW9uPScgKyBjb2RlVXJpLmVuY29kZShlbmNvZGVGY2Moc29sdXRpb24pKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsb2NhdGlvbi5oYXNoID0gJz9zb2x1dGlvbj0nICsgY29kZVVyaS5lbmNvZGUoZW5jb2RlRmNjKHNvbHV0aW9uKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzb2x1dGlvbjtcbiAgICB9LFxuICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgc2hvdWxkUnVuOiBmdW5jdGlvbiBzaG91bGRSdW4oKSB7XG4gICAgICByZXR1cm4gIXRoaXMuZ2V0S2V5SW5RdWVyeSgobG9jYXRpb24uc2VhcmNoIHx8IGxvY2F0aW9uLmhhc2gpLnJlcGxhY2UocXVlcnlSZWdleCwgJycpLCAncnVuJyk7XG4gICAgfVxuICB9O1xuXG4gIGNvbW1vbi5pbml0LnB1c2goZnVuY3Rpb24gKCkge1xuICAgIGNvZGVVcmkucGFyc2UoKTtcbiAgfSk7XG5cbiAgY29tbW9uLmNvZGVVcmkgPSBjb2RlVXJpO1xuICBjb21tb24uc2hvdWxkUnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBjb2RlVXJpLnNob3VsZFJ1bigpO1xuICB9O1xuXG4gIHJldHVybiBjb21tb247XG59KHdpbmRvdyk7IiwiJ3VzZSBzdHJpY3QnO1xuXG53aW5kb3cuY29tbW9uID0gZnVuY3Rpb24gKGdsb2JhbCkge1xuICB2YXIgbG9vcFByb3RlY3QgPSBnbG9iYWwubG9vcFByb3RlY3Q7XG4gIHZhciBfZ2xvYmFsJGNvbW1vbiA9IGdsb2JhbC5jb21tb247XG4gIHZhciBjb21tb24gPSBfZ2xvYmFsJGNvbW1vbiA9PT0gdW5kZWZpbmVkID8geyBpbml0OiBbXSB9IDogX2dsb2JhbCRjb21tb247XG5cblxuICBsb29wUHJvdGVjdC5oaXQgPSBmdW5jdGlvbiBoaXQobGluZSkge1xuICAgIHZhciBlcnIgPSAnRXJyb3I6IEV4aXRpbmcgcG90ZW50aWFsIGluZmluaXRlIGxvb3AgYXQgbGluZSAnICsgbGluZSArICcuIFRvIGRpc2FibGUgbG9vcCBwcm90ZWN0aW9uLCB3cml0ZTogXFxuXFxcXC9cXFxcLyBub3Byb3RlY3RcXG5hcyB0aGUgZmlyc3QnICsgJ2xpbmUuIEJld2FyZSB0aGF0IGlmIHlvdSBkbyBoYXZlIGFuIGluZmluaXRlIGxvb3AgaW4geW91ciBjb2RlJyArICd0aGlzIHdpbGwgY3Jhc2ggeW91ciBicm93c2VyLic7XG4gICAgY29uc29sZS5lcnJvcihlcnIpO1xuICB9O1xuXG4gIGNvbW1vbi5hZGRMb29wUHJvdGVjdCA9IGZ1bmN0aW9uIGFkZExvb3BQcm90ZWN0KCkge1xuICAgIHZhciBjb2RlID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gJycgOiBhcmd1bWVudHNbMF07XG5cbiAgICByZXR1cm4gbG9vcFByb3RlY3QoY29kZSk7XG4gIH07XG5cbiAgcmV0dXJuIGNvbW1vbjtcbn0od2luZG93KTsiLCIndXNlIHN0cmljdCc7XG5cbndpbmRvdy5jb21tb24gPSBmdW5jdGlvbiAoZ2xvYmFsKSB7XG4gIHZhciBfZ2xvYmFsJGNvbW1vbiA9IGdsb2JhbC5jb21tb247XG4gIHZhciBjb21tb24gPSBfZ2xvYmFsJGNvbW1vbiA9PT0gdW5kZWZpbmVkID8geyBpbml0OiBbXSB9IDogX2dsb2JhbCRjb21tb247XG4gIHZhciBkb2MgPSBnbG9iYWwuZG9jdW1lbnQ7XG5cblxuICBjb21tb24uZ2V0SWZyYW1lID0gZnVuY3Rpb24gZ2V0SWZyYW1lKCkge1xuICAgIHZhciBpZCA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/ICdwcmV2aWV3JyA6IGFyZ3VtZW50c1swXTtcblxuICAgIHZhciBwcmV2aWV3RnJhbWUgPSBkb2MuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuXG4gICAgLy8gY3JlYXRlIGFuZCBhcHBlbmQgYSBoaWRkZW4gcHJldmlldyBmcmFtZVxuICAgIGlmICghcHJldmlld0ZyYW1lKSB7XG4gICAgICBwcmV2aWV3RnJhbWUgPSBkb2MuY3JlYXRlRWxlbWVudCgnaWZyYW1lJyk7XG4gICAgICBwcmV2aWV3RnJhbWUuaWQgPSBpZDtcbiAgICAgIHByZXZpZXdGcmFtZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgJ2Rpc3BsYXk6IG5vbmUnKTtcbiAgICAgIGRvYy5ib2R5LmFwcGVuZENoaWxkKHByZXZpZXdGcmFtZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByZXZpZXdGcmFtZS5jb250ZW50RG9jdW1lbnQgfHwgcHJldmlld0ZyYW1lLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQ7XG4gIH07XG5cbiAgcmV0dXJuIGNvbW1vbjtcbn0od2luZG93KTsiLCIndXNlIHN0cmljdCc7XG5cbndpbmRvdy5jb21tb24gPSBmdW5jdGlvbiAoZ2xvYmFsKSB7XG4gIHZhciBfZ2xvYmFsJFJ4ID0gZ2xvYmFsLlJ4O1xuICB2YXIgQmVoYXZpb3JTdWJqZWN0ID0gX2dsb2JhbCRSeC5CZWhhdmlvclN1YmplY3Q7XG4gIHZhciBPYnNlcnZhYmxlID0gX2dsb2JhbCRSeC5PYnNlcnZhYmxlO1xuICB2YXIgX2dsb2JhbCRjb21tb24gPSBnbG9iYWwuY29tbW9uO1xuICB2YXIgY29tbW9uID0gX2dsb2JhbCRjb21tb24gPT09IHVuZGVmaW5lZCA/IHsgaW5pdDogW10gfSA6IF9nbG9iYWwkY29tbW9uO1xuXG4gIC8vIHRoZSBmaXJzdCBzY3JpcHQgdGFnIGhlcmUgaXMgdG8gcHJveHkgalF1ZXJ5XG4gIC8vIFdlIHVzZSB0aGUgc2FtZSBqUXVlcnkgb24gdGhlIG1haW4gd2luZG93IGJ1dCB3ZSBjaGFuZ2UgdGhlXG4gIC8vIGNvbnRleHQgdG8gdGhhdCBvZiB0aGUgaWZyYW1lLlxuXG4gIHZhciBsaWJyYXJ5SW5jbHVkZXMgPSAnXFxuPHNjcmlwdD5cXG4gIHdpbmRvdy5sb29wUHJvdGVjdCA9IHBhcmVudC5sb29wUHJvdGVjdDtcXG4gIHdpbmRvdy5fX2VyciA9IG51bGw7XFxuICB3aW5kb3cubG9vcFByb3RlY3QuaGl0ID0gZnVuY3Rpb24obGluZSkge1xcbiAgICB3aW5kb3cuX19lcnIgPSBuZXcgRXJyb3IoXFxuICAgICAgXFwnUG90ZW50aWFsIGluZmluaXRlIGxvb3AgYXQgbGluZSBcXCcgK1xcbiAgICAgIGxpbmUgK1xcbiAgICAgIFxcJy4gVG8gZGlzYWJsZSBsb29wIHByb3RlY3Rpb24sIHdyaXRlOlxcJyArXFxuICAgICAgXFwnIFxcXFxuXFxcXC9cXFxcLyBub3Byb3RlY3RcXFxcbmFzIHRoZSBmaXJzdFxcJyArXFxuICAgICAgXFwnIGxpbmUuIEJld2FyZSB0aGF0IGlmIHlvdSBkbyBoYXZlIGFuIGluZmluaXRlIGxvb3AgaW4geW91ciBjb2RlXFwnICtcXG4gICAgICBcXCcgdGhpcyB3aWxsIGNyYXNoIHlvdXIgYnJvd3Nlci5cXCdcXG4gICAgKTtcXG4gIH07XFxuPC9zY3JpcHQ+XFxuPGxpbmtcXG4gIHJlbD1cXCdzdHlsZXNoZWV0XFwnXFxuICBocmVmPVxcJy8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL2FuaW1hdGUuY3NzLzMuMi4wL2FuaW1hdGUubWluLmNzc1xcJ1xcbiAgLz5cXG48bGlua1xcbiAgcmVsPVxcJ3N0eWxlc2hlZXRcXCdcXG4gIGhyZWY9XFwnLy9tYXhjZG4uYm9vdHN0cmFwY2RuLmNvbS9ib290c3RyYXAvMy4zLjEvY3NzL2Jvb3RzdHJhcC5taW4uY3NzXFwnXFxuICAvPlxcblxcbjxsaW5rXFxuICByZWw9XFwnc3R5bGVzaGVldFxcJ1xcbiAgaHJlZj1cXCcvL21heGNkbi5ib290c3RyYXBjZG4uY29tL2ZvbnQtYXdlc29tZS80LjIuMC9jc3MvZm9udC1hd2Vzb21lLm1pbi5jc3NcXCdcXG4gIC8+XFxuPHN0eWxlPlxcbiAgYm9keSB7IHBhZGRpbmc6IDBweCAzcHggMHB4IDNweDsgfVxcbiAgLyogRk9STSBSRVNFVDogKi9cXG4gIHRleHRhcmVhLFxcbiAgc2VsZWN0LFxcbiAgaW5wdXRbdHlwZT1cImRhdGVcIl0sXFxuICBpbnB1dFt0eXBlPVwiZGF0ZXRpbWVcIl0sXFxuICBpbnB1dFt0eXBlPVwiZGF0ZXRpbWUtbG9jYWxcIl0sXFxuICBpbnB1dFt0eXBlPVwiZW1haWxcIl0sXFxuICBpbnB1dFt0eXBlPVwibW9udGhcIl0sXFxuICBpbnB1dFt0eXBlPVwibnVtYmVyXCJdLFxcbiAgaW5wdXRbdHlwZT1cInBhc3N3b3JkXCJdLFxcbiAgaW5wdXRbdHlwZT1cInNlYXJjaFwiXSxcXG4gIGlucHV0W3R5cGU9XCJ0ZWxcIl0sXFxuICBpbnB1dFt0eXBlPVwidGV4dFwiXSxcXG4gIGlucHV0W3R5cGU9XCJ0aW1lXCJdLFxcbiAgaW5wdXRbdHlwZT1cInVybFwiXSxcXG4gIGlucHV0W3R5cGU9XCJ3ZWVrXCJdIHtcXG4gICAgLXdlYmtpdC1ib3gtc2l6aW5nOiBib3JkZXItYm94O1xcbiAgICAtbW96LWJveC1zaXppbmc6IGJvcmRlci1ib3g7XFxuICAgIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XFxuICAgIC13ZWJraXQtYmFja2dyb3VuZC1jbGlwOiBwYWRkaW5nO1xcbiAgICAtbW96LWJhY2tncm91bmQtY2xpcDogcGFkZGluZztcXG4gICAgYmFja2dyb3VuZC1jbGlwOnBhZGRpbmctYm94O1xcbiAgICAtd2Via2l0LWJvcmRlci1yYWRpdXM6MDtcXG4gICAgLW1vei1ib3JkZXItcmFkaXVzOjA7XFxuICAgIC1tcy1ib3JkZXItcmFkaXVzOjA7XFxuICAgIC1vLWJvcmRlci1yYWRpdXM6MDtcXG4gICAgYm9yZGVyLXJhZGl1czowO1xcbiAgICAtd2Via2l0LWFwcGVhcmFuY2U6bm9uZTtcXG4gICAgYmFja2dyb3VuZC1jb2xvcjojZmZmO1xcbiAgICBjb2xvcjojMDAwO1xcbiAgICBvdXRsaW5lOjA7XFxuICAgIG1hcmdpbjowO1xcbiAgICBwYWRkaW5nOjA7XFxuICAgIHRleHQtYWxpZ246IGxlZnQ7XFxuICAgIGZvbnQtc2l6ZToxZW07XFxuICAgIGhlaWdodDogMS44ZW07XFxuICAgIHZlcnRpY2FsLWFsaWduOiBtaWRkbGU7XFxuICB9XFxuICBzZWxlY3QsIHNlbGVjdCwgc2VsZWN0IHtcXG4gICAgYmFja2dyb3VuZDojZmZmXFxuICAgIHVybChcXCdkYXRhOmltYWdlL3BuZztiYXNlNjQsUjBsR09EbGhEUUFFQUlBQUFBQUFBUDhBL3lINUJBRUhBQUVBTEFBQUFBQU5BQVFBQUFJTGhBK2hHNWpNRHB4dmhnSUFPdz09XFwnKTtcXG4gICAgYmFja2dyb3VuZC1yZXBlYXQ6IG5vLXJlcGVhdDtcXG4gICAgYmFja2dyb3VuZC1wb3NpdGlvbjogOTclIGNlbnRlcjtcXG4gICAgcGFkZGluZzowIDI1cHggMCA4cHg7XFxuICAgIGZvbnQtc2l6ZTogLjg3NWVtO1xcbiAgfVxcblxcbi8vICEgRk9STSBSRVNFVFxcbjwvc3R5bGU+XFxuICAnO1xuICB2YXIgY29kZURpc2FibGVkRXJyb3IgPSAnXFxuICAgIDxzY3JpcHQ+XFxuICAgICAgd2luZG93Ll9fZXJyID0gbmV3IEVycm9yKFxcJ2NvZGUgaGFzIGJlZW4gZGlzYWJsZWRcXCcpO1xcbiAgICA8L3NjcmlwdD5cXG4gICc7XG5cbiAgdmFyIGlGcmFtZVNjcmlwdCQgPSBjb21tb24uZ2V0U2NyaXB0Q29udGVudCQoJy9qcy9pRnJhbWVTY3JpcHRzLmpzJykuc2hhcmVSZXBsYXkoKTtcbiAgdmFyIGpRdWVyeVNjcmlwdCQgPSBjb21tb24uZ2V0U2NyaXB0Q29udGVudCQoJy9ib3dlcl9jb21wb25lbnRzL2pxdWVyeS9kaXN0L2pxdWVyeS5qcycpLnNoYXJlUmVwbGF5KCk7XG5cbiAgLy8gYmVoYXZpb3Igc3ViamVjdCBhbGx3YXlzIHJlbWVtYmVycyB0aGUgbGFzdCB2YWx1ZVxuICAvLyB3ZSB1c2UgdGhpcyB0byBkZXRlcm1pbmUgaWYgcnVuUHJldmlld1Rlc3QkIGlzIGRlZmluZWRcbiAgLy8gYW5kIHByaW1lIGl0IHdpdGggZmFsc2VcbiAgY29tbW9uLnByZXZpZXdSZWFkeSQgPSBuZXcgQmVoYXZpb3JTdWJqZWN0KGZhbHNlKTtcblxuICAvLyBUaGVzZSBzaG91bGQgYmUgc2V0IHVwIGluIHRoZSBwcmV2aWV3IHdpbmRvd1xuICAvLyBpZiB0aGlzIGVycm9yIGlzIHNlZW4gaXQgaXMgYmVjYXVzZSB0aGUgZnVuY3Rpb24gdHJpZWQgdG8gcnVuXG4gIC8vIGJlZm9yZSB0aGUgaWZyYW1lIGhhcyBjb21wbGV0ZWx5IGxvYWRlZFxuICBjb21tb24ucnVuUHJldmlld1Rlc3RzJCA9IGNvbW1vbi5jaGVja1ByZXZpZXckID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBPYnNlcnZhYmxlLnRocm93KG5ldyBFcnJvcignUHJldmlldyBub3QgZnVsbHkgbG9hZGVkJykpO1xuICB9O1xuXG4gIGNvbW1vbi51cGRhdGVQcmV2aWV3JCA9IGZ1bmN0aW9uIHVwZGF0ZVByZXZpZXckKCkge1xuICAgIHZhciBjb2RlID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gJycgOiBhcmd1bWVudHNbMF07XG5cbiAgICB2YXIgcHJldmlldyA9IGNvbW1vbi5nZXRJZnJhbWUoJ3ByZXZpZXcnKTtcblxuICAgIHJldHVybiBPYnNlcnZhYmxlLmNvbWJpbmVMYXRlc3QoaUZyYW1lU2NyaXB0JCwgalF1ZXJ5U2NyaXB0JCwgZnVuY3Rpb24gKGlmcmFtZSwgalF1ZXJ5KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBpZnJhbWVTY3JpcHQ6ICc8c2NyaXB0PicgKyBpZnJhbWUgKyAnPC9zY3JpcHQ+JyxcbiAgICAgICAgalF1ZXJ5OiAnPHNjcmlwdD4nICsgalF1ZXJ5ICsgJzwvc2NyaXB0PidcbiAgICAgIH07XG4gICAgfSkuZmlyc3QoKS5mbGF0TWFwKGZ1bmN0aW9uIChfcmVmKSB7XG4gICAgICB2YXIgaWZyYW1lU2NyaXB0ID0gX3JlZi5pZnJhbWVTY3JpcHQ7XG4gICAgICB2YXIgalF1ZXJ5ID0gX3JlZi5qUXVlcnk7XG5cbiAgICAgIC8vIHdlIG1ha2Ugc3VyZSB0byBvdmVycmlkZSB0aGUgbGFzdCB2YWx1ZSBpbiB0aGVcbiAgICAgIC8vIHN1YmplY3QgdG8gZmFsc2UgaGVyZS5cbiAgICAgIGNvbW1vbi5wcmV2aWV3UmVhZHkkLm9uTmV4dChmYWxzZSk7XG4gICAgICBwcmV2aWV3Lm9wZW4oKTtcbiAgICAgIHByZXZpZXcud3JpdGUobGlicmFyeUluY2x1ZGVzICsgalF1ZXJ5ICsgKGNvbW1vbi5zaG91bGRSdW4oKSA/IGNvZGUgOiBjb2RlRGlzYWJsZWRFcnJvcikgKyAnPCEtLSAtLT4nICsgaWZyYW1lU2NyaXB0KTtcbiAgICAgIHByZXZpZXcuY2xvc2UoKTtcbiAgICAgIC8vIG5vdyB3ZSBmaWx0ZXIgZmFsc2UgdmFsdWVzIGFuZCB3YWl0IGZvciB0aGUgZmlyc3QgdHJ1ZVxuICAgICAgcmV0dXJuIGNvbW1vbi5wcmV2aWV3UmVhZHkkLmZpbHRlcihmdW5jdGlvbiAocmVhZHkpIHtcbiAgICAgICAgcmV0dXJuIHJlYWR5O1xuICAgICAgfSkuZmlyc3QoKVxuICAgICAgLy8gdGhlIGRlbGF5IGhlcmUgaXMgdG8gZ2l2ZSBjb2RlIHdpdGhpbiB0aGUgaWZyYW1lXG4gICAgICAvLyBjb250cm9sIHRvIHJ1blxuICAgICAgLmRlbGF5KDQwMCk7XG4gICAgfSkubWFwKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBjb2RlO1xuICAgIH0pO1xuICB9O1xuXG4gIHJldHVybiBjb21tb247XG59KHdpbmRvdyk7IiwiJ3VzZSBzdHJpY3QnO1xuXG53aW5kb3cuY29tbW9uID0gZnVuY3Rpb24gKGdsb2JhbCkge1xuICB2YXIgX2dsb2JhbCRSeCA9IGdsb2JhbC5SeDtcbiAgdmFyIFN1YmplY3QgPSBfZ2xvYmFsJFJ4LlN1YmplY3Q7XG4gIHZhciBPYnNlcnZhYmxlID0gX2dsb2JhbCRSeC5PYnNlcnZhYmxlO1xuICB2YXIgQ29kZU1pcnJvciA9IGdsb2JhbC5Db2RlTWlycm9yO1xuICB2YXIgZW1tZXRDb2RlTWlycm9yID0gZ2xvYmFsLmVtbWV0Q29kZU1pcnJvcjtcbiAgdmFyIF9nbG9iYWwkY29tbW9uID0gZ2xvYmFsLmNvbW1vbjtcbiAgdmFyIGNvbW1vbiA9IF9nbG9iYWwkY29tbW9uID09PSB1bmRlZmluZWQgPyB7IGluaXQ6IFtdIH0gOiBfZ2xvYmFsJGNvbW1vbjtcbiAgdmFyIF9jb21tb24kY2hhbGxlbmdlVHlwZSA9IGNvbW1vbi5jaGFsbGVuZ2VUeXBlO1xuICB2YXIgY2hhbGxlbmdlVHlwZSA9IF9jb21tb24kY2hhbGxlbmdlVHlwZSA9PT0gdW5kZWZpbmVkID8gJzAnIDogX2NvbW1vbiRjaGFsbGVuZ2VUeXBlO1xuICB2YXIgY2hhbGxlbmdlVHlwZXMgPSBjb21tb24uY2hhbGxlbmdlVHlwZXM7XG5cblxuICBpZiAoIUNvZGVNaXJyb3IgfHwgY2hhbGxlbmdlVHlwZSA9PT0gY2hhbGxlbmdlVHlwZXMuQkFTRUpVTVAgfHwgY2hhbGxlbmdlVHlwZSA9PT0gY2hhbGxlbmdlVHlwZXMuWklQTElORSB8fCBjaGFsbGVuZ2VUeXBlID09PSBjaGFsbGVuZ2VUeXBlcy5WSURFTyB8fCBjaGFsbGVuZ2VUeXBlID09PSBjaGFsbGVuZ2VUeXBlcy5TVEVQIHx8IGNoYWxsZW5nZVR5cGUgPT09IGNoYWxsZW5nZVR5cGVzLkhJS0VTKSB7XG4gICAgY29tbW9uLmVkaXRvciA9IHt9O1xuICAgIHJldHVybiBjb21tb247XG4gIH1cblxuICB2YXIgZWRpdG9yID0gQ29kZU1pcnJvci5mcm9tVGV4dEFyZWEoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvZGVFZGl0b3InKSwge1xuICAgIGxpbnQ6IHRydWUsXG4gICAgbGluZU51bWJlcnM6IHRydWUsXG4gICAgbW9kZTogJ2phdmFzY3JpcHQnLFxuICAgIHRoZW1lOiAnbW9ub2thaScsXG4gICAgcnVubmFibGU6IHRydWUsXG4gICAgbWF0Y2hCcmFja2V0czogdHJ1ZSxcbiAgICBhdXRvQ2xvc2VCcmFja2V0czogdHJ1ZSxcbiAgICBzY3JvbGxiYXJTdHlsZTogJ251bGwnLFxuICAgIGxpbmVXcmFwcGluZzogdHJ1ZSxcbiAgICBndXR0ZXJzOiBbJ0NvZGVNaXJyb3ItbGludC1tYXJrZXJzJ11cbiAgfSk7XG5cbiAgZWRpdG9yLnNldFNpemUoJzEwMCUnLCAnYXV0bycpO1xuXG4gIGNvbW1vbi5lZGl0b3JFeGVjdXRlJCA9IG5ldyBTdWJqZWN0KCk7XG4gIGNvbW1vbi5lZGl0b3JLZXlVcCQgPSBPYnNlcnZhYmxlLmZyb21FdmVudFBhdHRlcm4oZnVuY3Rpb24gKGhhbmRsZXIpIHtcbiAgICByZXR1cm4gZWRpdG9yLm9uKCdrZXl1cCcsIGhhbmRsZXIpO1xuICB9LCBmdW5jdGlvbiAoaGFuZGxlcikge1xuICAgIHJldHVybiBlZGl0b3Iub2ZmKCdrZXl1cCcsIGhhbmRsZXIpO1xuICB9KTtcblxuICBlZGl0b3Iuc2V0T3B0aW9uKCdleHRyYUtleXMnLCB7XG4gICAgVGFiOiBmdW5jdGlvbiBUYWIoY20pIHtcbiAgICAgIGlmIChjbS5zb21ldGhpbmdTZWxlY3RlZCgpKSB7XG4gICAgICAgIGNtLmluZGVudFNlbGVjdGlvbignYWRkJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgc3BhY2VzID0gQXJyYXkoY20uZ2V0T3B0aW9uKCdpbmRlbnRVbml0JykgKyAxKS5qb2luKCcgJyk7XG4gICAgICAgIGNtLnJlcGxhY2VTZWxlY3Rpb24oc3BhY2VzKTtcbiAgICAgIH1cbiAgICB9LFxuICAgICdTaGlmdC1UYWInOiBmdW5jdGlvbiBTaGlmdFRhYihjbSkge1xuICAgICAgaWYgKGNtLnNvbWV0aGluZ1NlbGVjdGVkKCkpIHtcbiAgICAgICAgY20uaW5kZW50U2VsZWN0aW9uKCdzdWJ0cmFjdCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHNwYWNlcyA9IEFycmF5KGNtLmdldE9wdGlvbignaW5kZW50VW5pdCcpICsgMSkuam9pbignICcpO1xuICAgICAgICBjbS5yZXBsYWNlU2VsZWN0aW9uKHNwYWNlcyk7XG4gICAgICB9XG4gICAgfSxcbiAgICAnQ3RybC1FbnRlcic6IGZ1bmN0aW9uIEN0cmxFbnRlcigpIHtcbiAgICAgIGNvbW1vbi5lZGl0b3JFeGVjdXRlJC5vbk5leHQoKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuICAgICdDbWQtRW50ZXInOiBmdW5jdGlvbiBDbWRFbnRlcigpIHtcbiAgICAgIGNvbW1vbi5lZGl0b3JFeGVjdXRlJC5vbk5leHQoKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0pO1xuXG4gIHZhciBpbmZvID0gZWRpdG9yLmdldFNjcm9sbEluZm8oKTtcblxuICB2YXIgYWZ0ZXIgPSBlZGl0b3IuY2hhckNvb3Jkcyh7XG4gICAgbGluZTogZWRpdG9yLmdldEN1cnNvcigpLmxpbmUgKyAxLFxuICAgIGNoOiAwXG4gIH0sICdsb2NhbCcpLnRvcDtcblxuICBpZiAoaW5mby50b3AgKyBpbmZvLmNsaWVudEhlaWdodCA8IGFmdGVyKSB7XG4gICAgZWRpdG9yLnNjcm9sbFRvKG51bGwsIGFmdGVyIC0gaW5mby5jbGllbnRIZWlnaHQgKyAzKTtcbiAgfVxuXG4gIGlmIChlbW1ldENvZGVNaXJyb3IpIHtcbiAgICBlbW1ldENvZGVNaXJyb3IoZWRpdG9yLCB7XG4gICAgICAnQ21kLUUnOiAnZW1tZXQuZXhwYW5kX2FiYnJldmlhdGlvbicsXG4gICAgICBUYWI6ICdlbW1ldC5leHBhbmRfYWJicmV2aWF0aW9uX3dpdGhfdGFiJyxcbiAgICAgIEVudGVyOiAnZW1tZXQuaW5zZXJ0X2Zvcm1hdHRlZF9saW5lX2JyZWFrX29ubHknXG4gICAgfSk7XG4gIH1cbiAgY29tbW9uLmluaXQucHVzaChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGVkaXRvclZhbHVlID0gdm9pZCAwO1xuICAgIGlmIChjb21tb24uY29kZVVyaS5pc0FsaXZlKCkpIHtcbiAgICAgIGVkaXRvclZhbHVlID0gY29tbW9uLmNvZGVVcmkucGFyc2UoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWRpdG9yVmFsdWUgPSBjb21tb24uY29kZVN0b3JhZ2UuaXNBbGl2ZShjb21tb24uY2hhbGxlbmdlTmFtZSkgPyBjb21tb24uY29kZVN0b3JhZ2UuZ2V0U3RvcmVkVmFsdWUoY29tbW9uLmNoYWxsZW5nZU5hbWUpIDogY29tbW9uLnNlZWQ7XG4gICAgfVxuXG4gICAgZWRpdG9yLnNldFZhbHVlKGNvbW1vbi5yZXBsYWNlU2FmZVRhZ3MoZWRpdG9yVmFsdWUpKTtcbiAgICBlZGl0b3IucmVmcmVzaCgpO1xuICB9KTtcblxuICBjb21tb24uZWRpdG9yID0gZWRpdG9yO1xuXG4gIHJldHVybiBjb21tb247XG59KHdpbmRvdyk7IiwiJ3VzZSBzdHJpY3QnO1xuXG53aW5kb3cuY29tbW9uID0gZnVuY3Rpb24gKGdsb2JhbCkge1xuICB2YXIgT2JzZXJ2YWJsZSA9IGdsb2JhbC5SeC5PYnNlcnZhYmxlO1xuICB2YXIgX2dsb2JhbCRjb21tb24gPSBnbG9iYWwuY29tbW9uO1xuICB2YXIgY29tbW9uID0gX2dsb2JhbCRjb21tb24gPT09IHVuZGVmaW5lZCA/IHsgaW5pdDogW10gfSA6IF9nbG9iYWwkY29tbW9uO1xuXG5cbiAgdmFyIGRldGVjdEZ1bmN0aW9uQ2FsbCA9IC9mdW5jdGlvblxccyo/XFwofGZ1bmN0aW9uXFxzK1xcdytcXHMqP1xcKC9naTtcbiAgdmFyIGRldGVjdFVuc2FmZUpRID0gL1xcJFxccyo/XFwoXFxzKj9cXCRcXHMqP1xcKS9naTtcbiAgdmFyIGRldGVjdFVuc2FmZUNvbnNvbGVDYWxsID0gL2lmXFxzXFwobnVsbFxcKVxcc2NvbnNvbGVcXC5sb2dcXCgxXFwpOy9naTtcblxuICBjb21tb24uZGV0ZWN0VW5zYWZlQ29kZSQgPSBmdW5jdGlvbiBkZXRlY3RVbnNhZmVDb2RlJChjb2RlKSB7XG4gICAgdmFyIG9wZW5pbmdDb21tZW50cyA9IGNvZGUubWF0Y2goL1xcL1xcKi9naSk7XG4gICAgdmFyIGNsb3NpbmdDb21tZW50cyA9IGNvZGUubWF0Y2goL1xcKlxcLy9naSk7XG5cbiAgICAvLyBjaGVja3MgaWYgdGhlIG51bWJlciBvZiBvcGVuaW5nIGNvbW1lbnRzKC8qKSBtYXRjaGVzIHRoZSBudW1iZXIgb2ZcbiAgICAvLyBjbG9zaW5nIGNvbW1lbnRzKCovKVxuICAgIGlmIChvcGVuaW5nQ29tbWVudHMgJiYgKCFjbG9zaW5nQ29tbWVudHMgfHwgb3BlbmluZ0NvbW1lbnRzLmxlbmd0aCA+IGNsb3NpbmdDb21tZW50cy5sZW5ndGgpKSB7XG5cbiAgICAgIHJldHVybiBPYnNlcnZhYmxlLnRocm93KG5ldyBFcnJvcignU3ludGF4RXJyb3I6IFVuZmluaXNoZWQgbXVsdGktbGluZSBjb21tZW50JykpO1xuICAgIH1cblxuICAgIGlmIChjb2RlLm1hdGNoKGRldGVjdFVuc2FmZUpRKSkge1xuICAgICAgcmV0dXJuIE9ic2VydmFibGUudGhyb3cobmV3IEVycm9yKCdVbnNhZmUgJCgkKScpKTtcbiAgICB9XG5cbiAgICBpZiAoY29kZS5tYXRjaCgvZnVuY3Rpb24vZykgJiYgIWNvZGUubWF0Y2goZGV0ZWN0RnVuY3Rpb25DYWxsKSkge1xuICAgICAgcmV0dXJuIE9ic2VydmFibGUudGhyb3cobmV3IEVycm9yKCdTeW50YXhFcnJvcjogVW5zYWZlIG9yIHVuZmluaXNoZWQgZnVuY3Rpb24gZGVjbGFyYXRpb24nKSk7XG4gICAgfVxuXG4gICAgaWYgKGNvZGUubWF0Y2goZGV0ZWN0VW5zYWZlQ29uc29sZUNhbGwpKSB7XG4gICAgICByZXR1cm4gT2JzZXJ2YWJsZS50aHJvdyhuZXcgRXJyb3IoJ0ludmFsaWQgaWYgKG51bGwpIGNvbnNvbGUubG9nKDEpOyBkZXRlY3RlZCcpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gT2JzZXJ2YWJsZS5qdXN0KGNvZGUpO1xuICB9O1xuXG4gIHJldHVybiBjb21tb247XG59KHdpbmRvdyk7IiwiJ3VzZSBzdHJpY3QnO1xuXG53aW5kb3cuY29tbW9uID0gZnVuY3Rpb24gKF9yZWYpIHtcbiAgdmFyICQgPSBfcmVmLiQ7XG4gIHZhciBfcmVmJGNvbW1vbiA9IF9yZWYuY29tbW9uO1xuICB2YXIgY29tbW9uID0gX3JlZiRjb21tb24gPT09IHVuZGVmaW5lZCA/IHsgaW5pdDogW10gfSA6IF9yZWYkY29tbW9uO1xuXG5cbiAgY29tbW9uLmRpc3BsYXlUZXN0UmVzdWx0cyA9IGZ1bmN0aW9uIGRpc3BsYXlUZXN0UmVzdWx0cygpIHtcbiAgICB2YXIgZGF0YSA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IFtdIDogYXJndW1lbnRzWzBdO1xuICAgIHZhciBkb3duID0gYXJndW1lbnRzWzFdO1xuXG4gICAgJCgnI3Rlc3RTdWl0ZScpLmNoaWxkcmVuKCkucmVtb3ZlKCk7XG4gICAgJCgnI3Rlc3RTdWl0ZScpLmZhZGVJbignc2xvdycpO1xuICAgIGRhdGEuZm9yRWFjaChmdW5jdGlvbiAoX3JlZjIpIHtcbiAgICAgIHZhciBfcmVmMiRlcnIgPSBfcmVmMi5lcnI7XG4gICAgICB2YXIgZXJyID0gX3JlZjIkZXJyID09PSB1bmRlZmluZWQgPyBmYWxzZSA6IF9yZWYyJGVycjtcbiAgICAgIHZhciBfcmVmMiR0ZXh0ID0gX3JlZjIudGV4dDtcbiAgICAgIHZhciB0ZXh0ID0gX3JlZjIkdGV4dCA9PT0gdW5kZWZpbmVkID8gJycgOiBfcmVmMiR0ZXh0O1xuXG4gICAgICB2YXIgaWNvbkNsYXNzID0gZXJyID8gJ1wiaW9uLWNsb3NlLWNpcmNsZWQgYmlnLWVycm9yLWljb25cIicgOiAnXCJpb24tY2hlY2ttYXJrLWNpcmNsZWQgYmlnLXN1Y2Nlc3MtaWNvblwiJztcblxuICAgICAgJCgnPGRpdj48L2Rpdj4nKS5odG1sKCdcXG4gICAgICAgIDxkaXYgY2xhc3M9XFwncm93XFwnPlxcbiAgICAgICAgICA8ZGl2IGNsYXNzPVxcJ2NvbC14cy0yIHRleHQtY2VudGVyXFwnPlxcbiAgICAgICAgICAgIDxpIGNsYXNzPScgKyBpY29uQ2xhc3MgKyAnPjwvaT5cXG4gICAgICAgICAgPC9kaXY+XFxuICAgICAgICAgIDxkaXYgY2xhc3M9XFwnY29sLXhzLTEwIHRlc3Qtb3V0cHV0XFwnPlxcbiAgICAgICAgICAgICcgKyB0ZXh0LnNwbGl0KCdtZXNzYWdlOiAnKS5wb3AoKS5yZXBsYWNlKC9cXCdcXCk7L2csICcnKSArICdcXG4gICAgICAgICAgPC9kaXY+XFxuICAgICAgICAgIDxkaXYgY2xhc3M9XFwndGVuLXBpeGVsLWJyZWFrXFwnLz5cXG4gICAgICAgIDwvZGl2PlxcbiAgICAgICcpLmFwcGVuZFRvKCQoJyN0ZXN0U3VpdGUnKSk7XG4gICAgfSk7XG4gICAgaWYgKGRvd24pIHtcbiAgICAgICQoJyNzY3JvbGwtbG9ja2VyJykuYW5pbWF0ZSh7IHNjcm9sbFRvcDogJChkb2N1bWVudCkuaGVpZ2h0KCkgfSwgJ3Nsb3cnKTtcbiAgICB9XG4gICAgcmV0dXJuIGRhdGE7XG4gIH07XG5cbiAgcmV0dXJuIGNvbW1vbjtcbn0od2luZG93KTsiLCIndXNlIHN0cmljdCc7XG5cbndpbmRvdy5jb21tb24gPSBmdW5jdGlvbiAoZ2xvYmFsKSB7XG4gIHZhciBnYSA9IGdsb2JhbC5nYTtcbiAgdmFyIF9nbG9iYWwkY29tbW9uID0gZ2xvYmFsLmNvbW1vbjtcbiAgdmFyIGNvbW1vbiA9IF9nbG9iYWwkY29tbW9uID09PSB1bmRlZmluZWQgPyB7IGluaXQ6IFtdIH0gOiBfZ2xvYmFsJGNvbW1vbjtcbiAgdmFyIGFkZExvb3BQcm90ZWN0ID0gY29tbW9uLmFkZExvb3BQcm90ZWN0O1xuICB2YXIgZ2V0SnNGcm9tSHRtbCA9IGNvbW1vbi5nZXRKc0Zyb21IdG1sO1xuICB2YXIgZGV0ZWN0VW5zYWZlQ29kZSQgPSBjb21tb24uZGV0ZWN0VW5zYWZlQ29kZSQ7XG4gIHZhciB1cGRhdGVQcmV2aWV3JCA9IGNvbW1vbi51cGRhdGVQcmV2aWV3JDtcbiAgdmFyIGNoYWxsZW5nZVR5cGUgPSBjb21tb24uY2hhbGxlbmdlVHlwZTtcbiAgdmFyIGNoYWxsZW5nZVR5cGVzID0gY29tbW9uLmNoYWxsZW5nZVR5cGVzO1xuXG5cbiAgY29tbW9uLmV4ZWN1dGVDaGFsbGVuZ2UkID0gZnVuY3Rpb24gZXhlY3V0ZUNoYWxsZW5nZSQoKSB7XG4gICAgdmFyIGNvZGUgPSBjb21tb24uZWRpdG9yLmdldFZhbHVlKCk7XG4gICAgdmFyIG9yaWdpbmFsQ29kZSA9IGNvZGU7XG4gICAgdmFyIGhlYWQgPSBjb21tb24uYXJyYXlUb05ld0xpbmVTdHJpbmcoY29tbW9uLmhlYWQpO1xuICAgIHZhciB0YWlsID0gY29tbW9uLmFycmF5VG9OZXdMaW5lU3RyaW5nKGNvbW1vbi50YWlsKTtcbiAgICB2YXIgY29tYmluZWRDb2RlID0gaGVhZCArIGNvZGUgKyB0YWlsO1xuXG4gICAgZ2EoJ3NlbmQnLCAnZXZlbnQnLCAnQ2hhbGxlbmdlJywgJ3Jhbi1jb2RlJywgY29tbW9uLmdhTmFtZSk7XG5cbiAgICAvLyBydW4gY2hlY2tzIGZvciB1bnNhZmUgY29kZVxuICAgIHJldHVybiBkZXRlY3RVbnNhZmVDb2RlJChjb2RlKVxuICAgIC8vIGFkZCBoZWFkIGFuZCB0YWlsIGFuZCBkZXRlY3QgbG9vcHNcbiAgICAubWFwKGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChjaGFsbGVuZ2VUeXBlICE9PSBjaGFsbGVuZ2VUeXBlcy5IVE1MKSB7XG4gICAgICAgIHJldHVybiAnPHNjcmlwdD47JyArIGFkZExvb3BQcm90ZWN0KGNvbWJpbmVkQ29kZSkgKyAnLyoqLzwvc2NyaXB0Pic7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhZGRMb29wUHJvdGVjdChjb21iaW5lZENvZGUpO1xuICAgIH0pLmZsYXRNYXAoZnVuY3Rpb24gKGNvZGUpIHtcbiAgICAgIHJldHVybiB1cGRhdGVQcmV2aWV3JChjb2RlKTtcbiAgICB9KS5mbGF0TWFwKGZ1bmN0aW9uIChjb2RlKSB7XG4gICAgICB2YXIgb3V0cHV0ID0gdm9pZCAwO1xuXG4gICAgICBpZiAoY2hhbGxlbmdlVHlwZSA9PT0gY2hhbGxlbmdlVHlwZXMuSFRNTCAmJiBjb21tb24uaGFzSnMoY29kZSkpIHtcbiAgICAgICAgb3V0cHV0ID0gY29tbW9uLmdldEpzT3V0cHV0KGdldEpzRnJvbUh0bWwoY29kZSkpO1xuICAgICAgfSBlbHNlIGlmIChjaGFsbGVuZ2VUeXBlICE9PSBjaGFsbGVuZ2VUeXBlcy5IVE1MKSB7XG4gICAgICAgIG91dHB1dCA9IGNvbW1vbi5nZXRKc091dHB1dChhZGRMb29wUHJvdGVjdChjb21iaW5lZENvZGUpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNvbW1vbi5ydW5QcmV2aWV3VGVzdHMkKHtcbiAgICAgICAgdGVzdHM6IGNvbW1vbi50ZXN0cy5zbGljZSgpLFxuICAgICAgICBvcmlnaW5hbENvZGU6IG9yaWdpbmFsQ29kZSxcbiAgICAgICAgb3V0cHV0OiBvdXRwdXRcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIHJldHVybiBjb21tb247XG59KHdpbmRvdyk7IiwiJ3VzZSBzdHJpY3QnO1xuXG53aW5kb3cuY29tbW9uID0gZnVuY3Rpb24gKGdsb2JhbCkge1xuICB2YXIgQ29kZU1pcnJvciA9IGdsb2JhbC5Db2RlTWlycm9yO1xuICB2YXIgZG9jID0gZ2xvYmFsLmRvY3VtZW50O1xuICB2YXIgX2dsb2JhbCRjb21tb24gPSBnbG9iYWwuY29tbW9uO1xuICB2YXIgY29tbW9uID0gX2dsb2JhbCRjb21tb24gPT09IHVuZGVmaW5lZCA/IHsgaW5pdDogW10gfSA6IF9nbG9iYWwkY29tbW9uO1xuICB2YXIgY2hhbGxlbmdlVHlwZXMgPSBjb21tb24uY2hhbGxlbmdlVHlwZXM7XG4gIHZhciBfY29tbW9uJGNoYWxsZW5nZVR5cGUgPSBjb21tb24uY2hhbGxlbmdlVHlwZTtcbiAgdmFyIGNoYWxsZW5nZVR5cGUgPSBfY29tbW9uJGNoYWxsZW5nZVR5cGUgPT09IHVuZGVmaW5lZCA/ICcwJyA6IF9jb21tb24kY2hhbGxlbmdlVHlwZTtcblxuXG4gIGlmICghQ29kZU1pcnJvciB8fCBjaGFsbGVuZ2VUeXBlICE9PSBjaGFsbGVuZ2VUeXBlcy5KUyAmJiBjaGFsbGVuZ2VUeXBlICE9PSBjaGFsbGVuZ2VUeXBlcy5CT05GSVJFKSB7XG4gICAgY29tbW9uLnVwZGF0ZU91dHB1dERpc3BsYXkgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICBjb21tb24uYXBwZW5kVG9PdXRwdXREaXNwbGF5ID0gZnVuY3Rpb24gKCkge307XG4gICAgcmV0dXJuIGNvbW1vbjtcbiAgfVxuXG4gIHZhciBjb2RlT3V0cHV0ID0gQ29kZU1pcnJvci5mcm9tVGV4dEFyZWEoZG9jLmdldEVsZW1lbnRCeUlkKCdjb2RlT3V0cHV0JyksIHtcbiAgICBsaW5lTnVtYmVyczogZmFsc2UsXG4gICAgbW9kZTogJ3RleHQnLFxuICAgIHRoZW1lOiAnbW9ub2thaScsXG4gICAgcmVhZE9ubHk6ICdub2N1cnNvcicsXG4gICAgbGluZVdyYXBwaW5nOiB0cnVlXG4gIH0pO1xuXG4gIGNvZGVPdXRwdXQuc2V0VmFsdWUoJy8qKlxcbiAgKiBZb3VyIG91dHB1dCB3aWxsIGdvIGhlcmUuXFxuICAqIEFueSBjb25zb2xlLmxvZygpIC10eXBlXFxuICAqIHN0YXRlbWVudHMgd2lsbCBhcHBlYXIgaW5cXG4gICogeW91ciBicm93c2VyXFwncyBEZXZUb29sc1xcbiAgKiBKYXZhU2NyaXB0IGNvbnNvbGUuXFxuICAqLycpO1xuXG4gIGNvZGVPdXRwdXQuc2V0U2l6ZSgnMTAwJScsICcxMDAlJyk7XG5cbiAgY29tbW9uLnVwZGF0ZU91dHB1dERpc3BsYXkgPSBmdW5jdGlvbiB1cGRhdGVPdXRwdXREaXNwbGF5KCkge1xuICAgIHZhciBzdHIgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyAnJyA6IGFyZ3VtZW50c1swXTtcblxuICAgIGlmICh0eXBlb2Ygc3RyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBzdHIgPSBzdHIudG9TdHJpbmcoKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSB7XG4gICAgICBzdHIgPSBKU09OLnN0cmluZ2lmeShzdHIpO1xuICAgIH1cbiAgICBjb2RlT3V0cHV0LnNldFZhbHVlKHN0cik7XG4gICAgcmV0dXJuIHN0cjtcbiAgfTtcblxuICBjb21tb24uYXBwZW5kVG9PdXRwdXREaXNwbGF5ID0gZnVuY3Rpb24gYXBwZW5kVG9PdXRwdXREaXNwbGF5KCkge1xuICAgIHZhciBzdHIgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyAnJyA6IGFyZ3VtZW50c1swXTtcblxuICAgIGNvZGVPdXRwdXQuc2V0VmFsdWUoY29kZU91dHB1dC5nZXRWYWx1ZSgpICsgc3RyKTtcbiAgICByZXR1cm4gc3RyO1xuICB9O1xuXG4gIHJldHVybiBjb21tb247XG59KHdpbmRvdyk7IiwiJ3VzZSBzdHJpY3QnO1xuXG53aW5kb3cuY29tbW9uID0gZnVuY3Rpb24gKF9yZWYpIHtcbiAgdmFyIF9yZWYkY29tbW9uID0gX3JlZi5jb21tb247XG4gIHZhciBjb21tb24gPSBfcmVmJGNvbW1vbiA9PT0gdW5kZWZpbmVkID8geyBpbml0OiBbXSB9IDogX3JlZiRjb21tb247XG5cblxuICBjb21tb24ubG9ja1RvcCA9IGZ1bmN0aW9uIGxvY2tUb3AoKSB7XG4gICAgdmFyIG1hZ2lWYWw7XG5cbiAgICBpZiAoJCh3aW5kb3cpLndpZHRoKCkgPj0gOTkwKSB7XG4gICAgICBpZiAoJCgnLmVkaXRvclNjcm9sbERpdicpLmh0bWwoKSkge1xuXG4gICAgICAgIG1hZ2lWYWwgPSAkKHdpbmRvdykuaGVpZ2h0KCkgLSAkKCcubmF2YmFyJykuaGVpZ2h0KCk7XG5cbiAgICAgICAgaWYgKG1hZ2lWYWwgPCAwKSB7XG4gICAgICAgICAgbWFnaVZhbCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgJCgnLmVkaXRvclNjcm9sbERpdicpLmNzcygnaGVpZ2h0JywgbWFnaVZhbCAtIDUwICsgJ3B4Jyk7XG4gICAgICB9XG5cbiAgICAgIG1hZ2lWYWwgPSAkKHdpbmRvdykuaGVpZ2h0KCkgLSAkKCcubmF2YmFyJykuaGVpZ2h0KCk7XG5cbiAgICAgIGlmIChtYWdpVmFsIDwgMCkge1xuICAgICAgICBtYWdpVmFsID0gMDtcbiAgICAgIH1cblxuICAgICAgJCgnLnNjcm9sbC1sb2NrZXInKS5jc3MoJ21pbi1oZWlnaHQnLCAkKCcuZWRpdG9yU2Nyb2xsRGl2JykuaGVpZ2h0KCkpLmNzcygnaGVpZ2h0JywgbWFnaVZhbCAtIDUwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgJCgnLmVkaXRvclNjcm9sbERpdicpLmNzcygnbWF4LWhlaWdodCcsIDUwMCArICdweCcpO1xuXG4gICAgICAkKCcuc2Nyb2xsLWxvY2tlcicpLmNzcygncG9zaXRpb24nLCAnaW5oZXJpdCcpLmNzcygndG9wJywgJ2luaGVyaXQnKS5jc3MoJ3dpZHRoJywgJzEwMCUnKS5jc3MoJ21heC1oZWlnaHQnLCAnMTAwJScpO1xuICAgIH1cbiAgfTtcblxuICBjb21tb24uaW5pdC5wdXNoKGZ1bmN0aW9uICgkKSB7XG4gICAgLy8gZmFrZWlwaG9uZSBwb3NpdGlvbmluZyBob3RmaXhcbiAgICBpZiAoJCgnLmlwaG9uZS1wb3NpdGlvbicpLmh0bWwoKSB8fCAkKCcuaXBob25lJykuaHRtbCgpKSB7XG4gICAgICB2YXIgc3RhcnRJcGhvbmVQb3NpdGlvbiA9IHBhcnNlSW50KCQoJy5pcGhvbmUtcG9zaXRpb24nKS5jc3MoJ3RvcCcpLnJlcGxhY2UoJ3B4JywgJycpLCAxMCk7XG5cbiAgICAgIHZhciBzdGFydElwaG9uZSA9IHBhcnNlSW50KCQoJy5pcGhvbmUnKS5jc3MoJ3RvcCcpLnJlcGxhY2UoJ3B4JywgJycpLCAxMCk7XG5cbiAgICAgICQod2luZG93KS5vbignc2Nyb2xsJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY291cnNlSGVpZ2h0ID0gJCgnLmNvdXJzZXdhcmUtaGVpZ2h0JykuaGVpZ2h0KCk7XG4gICAgICAgIHZhciBjb3Vyc2VUb3AgPSAkKCcuY291cnNld2FyZS1oZWlnaHQnKS5vZmZzZXQoKS50b3A7XG4gICAgICAgIHZhciB3aW5kb3dTY3JvbGxUb3AgPSAkKHdpbmRvdykuc2Nyb2xsVG9wKCk7XG4gICAgICAgIHZhciBwaG9uZUhlaWdodCA9ICQoJy5pcGhvbmUtcG9zaXRpb24nKS5oZWlnaHQoKTtcblxuICAgICAgICBpZiAoY291cnNlSGVpZ2h0ICsgY291cnNlVG9wIC0gd2luZG93U2Nyb2xsVG9wIC0gcGhvbmVIZWlnaHQgPD0gMCkge1xuICAgICAgICAgICQoJy5pcGhvbmUtcG9zaXRpb24nKS5jc3MoJ3RvcCcsIHN0YXJ0SXBob25lUG9zaXRpb24gKyBjb3Vyc2VIZWlnaHQgKyBjb3Vyc2VUb3AgLSB3aW5kb3dTY3JvbGxUb3AgLSBwaG9uZUhlaWdodCk7XG5cbiAgICAgICAgICAkKCcuaXBob25lJykuY3NzKCd0b3AnLCBzdGFydElwaG9uZVBvc2l0aW9uICsgY291cnNlSGVpZ2h0ICsgY291cnNlVG9wIC0gd2luZG93U2Nyb2xsVG9wIC0gcGhvbmVIZWlnaHQgKyAxMjApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICQoJy5pcGhvbmUtcG9zaXRpb24nKS5jc3MoJ3RvcCcsIHN0YXJ0SXBob25lUG9zaXRpb24pO1xuICAgICAgICAgICQoJy5pcGhvbmUnKS5jc3MoJ3RvcCcsIHN0YXJ0SXBob25lKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKCQoJy5zY3JvbGwtbG9ja2VyJykuaHRtbCgpKSB7XG5cbiAgICAgIGlmICgkKCcuc2Nyb2xsLWxvY2tlcicpLmh0bWwoKSkge1xuICAgICAgICBjb21tb24ubG9ja1RvcCgpO1xuICAgICAgICAkKHdpbmRvdykub24oJ3Jlc2l6ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb21tb24ubG9ja1RvcCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgJCh3aW5kb3cpLm9uKCdzY3JvbGwnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29tbW9uLmxvY2tUb3AoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHZhciBleGVjSW5Qcm9ncmVzcyA9IGZhbHNlO1xuXG4gICAgICAvLyB3aHkgaXMgdGhpcyBub3QgJD8/P1xuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Njcm9sbC1sb2NrZXInKS5hZGRFdmVudExpc3RlbmVyKCdwcmV2aWV3VXBkYXRlU3B5JywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKGV4ZWNJblByb2dyZXNzKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZXhlY0luUHJvZ3Jlc3MgPSB0cnVlO1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgaWYgKCQoJCgnLnNjcm9sbC1sb2NrZXInKS5jaGlsZHJlbigpWzBdKS5oZWlnaHQoKSAtIDgwMCA+IGUuZGV0YWlsKSB7XG4gICAgICAgICAgICAkKCcuc2Nyb2xsLWxvY2tlcicpLnNjcm9sbFRvcChlLmRldGFpbCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBzY3JvbGxUb3AgPSAkKCQoJy5zY3JvbGwtbG9ja2VyJykuY2hpbGRyZW4oKVswXSkuaGVpZ2h0KCk7XG5cbiAgICAgICAgICAgICQoJy5zY3JvbGwtbG9ja2VyJykuYW5pbWF0ZSh7IHNjcm9sbFRvcDogc2Nyb2xsVG9wIH0sIDE3NSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGV4ZWNJblByb2dyZXNzID0gZmFsc2U7XG4gICAgICAgIH0sIDc1MCk7XG4gICAgICB9LCBmYWxzZSk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gY29tbW9uO1xufSh3aW5kb3cpOyIsIid1c2Ugc3RyaWN0Jztcblxud2luZG93LmNvbW1vbiA9IGZ1bmN0aW9uIChfcmVmKSB7XG4gIHZhciBfcmVmJGNvbW1vbiA9IF9yZWYuY29tbW9uO1xuICB2YXIgY29tbW9uID0gX3JlZiRjb21tb24gPT09IHVuZGVmaW5lZCA/IHsgaW5pdDogW10gfSA6IF9yZWYkY29tbW9uO1xuXG4gIGNvbW1vbi5pbml0LnB1c2goZnVuY3Rpb24gKCQpIHtcbiAgICAkKCcjcmVwb3J0LWlzc3VlJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHRleHRNZXNzYWdlID0gWydDaGFsbGVuZ2UgWycsIGNvbW1vbi5jaGFsbGVuZ2VOYW1lIHx8IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSwgJ10oJywgd2luZG93LmxvY2F0aW9uLmhyZWYsICcpIGhhcyBhbiBpc3N1ZS5cXG4nLCAnVXNlciBBZ2VudCBpczogPGNvZGU+JywgbmF2aWdhdG9yLnVzZXJBZ2VudCwgJzwvY29kZT4uXFxuJywgJ1BsZWFzZSBkZXNjcmliZSBob3cgdG8gcmVwcm9kdWNlIHRoaXMgaXNzdWUsIGFuZCBpbmNsdWRlICcsICdsaW5rcyB0byBzY3JlZW5zaG90cyBpZiBwb3NzaWJsZS5cXG5cXG4nXS5qb2luKCcnKTtcblxuICAgICAgaWYgKGNvbW1vbi5lZGl0b3IgJiYgdHlwZW9mIGNvbW1vbi5lZGl0b3IuZ2V0VmFsdWUgPT09ICdmdW5jdGlvbicgJiYgY29tbW9uLmVkaXRvci5nZXRWYWx1ZSgpLnRyaW0oKSkge1xuICAgICAgICB2YXIgdHlwZTtcbiAgICAgICAgc3dpdGNoIChjb21tb24uY2hhbGxlbmdlVHlwZSkge1xuICAgICAgICAgIGNhc2UgY29tbW9uLmNoYWxsZW5nZVR5cGVzLkhUTUw6XG4gICAgICAgICAgICB0eXBlID0gJ2h0bWwnO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBjb21tb24uY2hhbGxlbmdlVHlwZXMuSlM6XG4gICAgICAgICAgY2FzZSBjb21tb24uY2hhbGxlbmdlVHlwZXMuQk9ORklSRTpcbiAgICAgICAgICAgIHR5cGUgPSAnamF2YXNjcmlwdCc7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdHlwZSA9ICcnO1xuICAgICAgICB9XG5cbiAgICAgICAgdGV4dE1lc3NhZ2UgKz0gWydNeSBjb2RlOlxcbmBgYCcsIHR5cGUsICdcXG4nLCBjb21tb24uZWRpdG9yLmdldFZhbHVlKCksICdcXG5gYGBcXG5cXG4nXS5qb2luKCcnKTtcbiAgICAgIH1cblxuICAgICAgdGV4dE1lc3NhZ2UgPSBlbmNvZGVVUklDb21wb25lbnQodGV4dE1lc3NhZ2UpO1xuXG4gICAgICAkKCcjaXNzdWUtbW9kYWwnKS5tb2RhbCgnaGlkZScpO1xuICAgICAgd2luZG93Lm9wZW4oJ2h0dHBzOi8vZ2l0aHViLmNvbS9mcmVlY29kZWNhbXAvZnJlZWNvZGVjYW1wL2lzc3Vlcy9uZXc/JmJvZHk9JyArIHRleHRNZXNzYWdlLCAnX2JsYW5rJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiBjb21tb247XG59KHdpbmRvdyk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbmZ1bmN0aW9uIF9vYmplY3RXaXRob3V0UHJvcGVydGllcyhvYmosIGtleXMpIHsgdmFyIHRhcmdldCA9IHt9OyBmb3IgKHZhciBpIGluIG9iaikgeyBpZiAoa2V5cy5pbmRleE9mKGkpID49IDApIGNvbnRpbnVlOyBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGkpKSBjb250aW51ZTsgdGFyZ2V0W2ldID0gb2JqW2ldOyB9IHJldHVybiB0YXJnZXQ7IH1cblxud2luZG93LmNvbW1vbiA9IGZ1bmN0aW9uIChnbG9iYWwpIHtcbiAgdmFyIE9ic2VydmFibGUgPSBnbG9iYWwuUnguT2JzZXJ2YWJsZTtcbiAgdmFyIGNoYWkgPSBnbG9iYWwuY2hhaTtcbiAgdmFyIF9nbG9iYWwkY29tbW9uID0gZ2xvYmFsLmNvbW1vbjtcbiAgdmFyIGNvbW1vbiA9IF9nbG9iYWwkY29tbW9uID09PSB1bmRlZmluZWQgPyB7IGluaXQ6IFtdIH0gOiBfZ2xvYmFsJGNvbW1vbjtcblxuXG4gIGNvbW1vbi5ydW5UZXN0cyQgPSBmdW5jdGlvbiBydW5UZXN0cyQoX3JlZikge1xuICAgIHZhciBjb2RlID0gX3JlZi5jb2RlO1xuICAgIHZhciBvcmlnaW5hbENvZGUgPSBfcmVmLm9yaWdpbmFsQ29kZTtcbiAgICB2YXIgdXNlclRlc3RzID0gX3JlZi51c2VyVGVzdHM7XG5cbiAgICB2YXIgcmVzdCA9IF9vYmplY3RXaXRob3V0UHJvcGVydGllcyhfcmVmLCBbXCJjb2RlXCIsIFwib3JpZ2luYWxDb2RlXCIsIFwidXNlclRlc3RzXCJdKTtcblxuICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb20odXNlclRlc3RzKS5tYXAoZnVuY3Rpb24gKHRlc3QpIHtcblxuICAgICAgLyogZXNsaW50LWRpc2FibGUgbm8tdW51c2VkLXZhcnMgKi9cbiAgICAgIHZhciBhc3NlcnQgPSBjaGFpLmFzc2VydDtcbiAgICAgIHZhciBlZGl0b3IgPSB7XG4gICAgICAgIGdldFZhbHVlOiBmdW5jdGlvbiBnZXRWYWx1ZSgpIHtcbiAgICAgICAgICByZXR1cm4gb3JpZ2luYWxDb2RlO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgLyogZXNsaW50LWVuYWJsZSBuby11bnVzZWQtdmFycyAqL1xuXG4gICAgICB0cnkge1xuICAgICAgICBpZiAodGVzdCkge1xuICAgICAgICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLWV2YWwgICovXG4gICAgICAgICAgZXZhbChjb21tb24ucmVhc3NlbWJsZVRlc3QoY29kZSwgdGVzdCkpO1xuICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgbm8tZXZhbCAqL1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHRlc3QuZXJyID0gZS5tZXNzYWdlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGVzdDtcbiAgICB9KS50b0FycmF5KCkubWFwKGZ1bmN0aW9uICh0ZXN0cykge1xuICAgICAgcmV0dXJuIF9leHRlbmRzKHt9LCByZXN0LCB7IHRlc3RzOiB0ZXN0cyB9KTtcbiAgICB9KTtcbiAgfTtcblxuICByZXR1cm4gY29tbW9uO1xufSh3aW5kb3cpOyIsIid1c2Ugc3RyaWN0Jztcblxud2luZG93LmNvbW1vbiA9IGZ1bmN0aW9uIChnbG9iYWwpIHtcbiAgdmFyICQgPSBnbG9iYWwuJDtcbiAgdmFyIG1vbWVudCA9IGdsb2JhbC5tb21lbnQ7XG4gIHZhciBfZ2xvYmFsJGdhID0gZ2xvYmFsLmdhO1xuICB2YXIgZ2EgPSBfZ2xvYmFsJGdhID09PSB1bmRlZmluZWQgPyBmdW5jdGlvbiAoKSB7fSA6IF9nbG9iYWwkZ2E7XG4gIHZhciBfZ2xvYmFsJGNvbW1vbiA9IGdsb2JhbC5jb21tb247XG4gIHZhciBjb21tb24gPSBfZ2xvYmFsJGNvbW1vbiA9PT0gdW5kZWZpbmVkID8geyBpbml0OiBbXSB9IDogX2dsb2JhbCRjb21tb247XG5cblxuICBmdW5jdGlvbiBzdWJtaXRDaGFsbGVuZ2VIYW5kbGVyKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICB2YXIgc29sdXRpb24gPSBjb21tb24uZWRpdG9yLmdldFZhbHVlKCk7XG5cbiAgICAkKCcjc3VibWl0LWNoYWxsZW5nZScpLmF0dHIoJ2Rpc2FibGVkJywgJ3RydWUnKS5yZW1vdmVDbGFzcygnYnRuLXByaW1hcnknKS5hZGRDbGFzcygnYnRuLXdhcm5pbmcgZGlzYWJsZWQnKTtcblxuICAgIHZhciAkY2hlY2ttYXJrQ29udGFpbmVyID0gJCgnI2NoZWNrbWFyay1jb250YWluZXInKTtcbiAgICAkY2hlY2ttYXJrQ29udGFpbmVyLmNzcyh7IGhlaWdodDogJGNoZWNrbWFya0NvbnRhaW5lci5pbm5lckhlaWdodCgpIH0pO1xuXG4gICAgJCgnI2NoYWxsZW5nZS1jaGVja21hcmsnKS5hZGRDbGFzcygnem9vbU91dFVwJylcbiAgICAvLyAucmVtb3ZlQ2xhc3MoJ3pvb21JbkRvd24nKVxuICAgIC5kZWxheSgxMDAwKS5xdWV1ZShmdW5jdGlvbiAobmV4dCkge1xuICAgICAgJCh0aGlzKS5yZXBsYWNlV2l0aCgnPGRpdiBpZD1cImNoYWxsZW5nZS1zcGlubmVyXCIgJyArICdjbGFzcz1cImFuaW1hdGVkIHpvb21JblVwIGlubmVyLWNpcmNsZXMtbG9hZGVyXCI+JyArICdzdWJtaXR0aW5nLi4uPC9kaXY+Jyk7XG4gICAgICBuZXh0KCk7XG4gICAgfSk7XG5cbiAgICB2YXIgdGltZXpvbmUgPSAnVVRDJztcbiAgICB0cnkge1xuICAgICAgdGltZXpvbmUgPSBtb21lbnQudHouZ3Vlc3MoKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGVyci5tZXNzYWdlID0gJ1xcbiAgICAgICAgICBrbm93biBidWcsIHNlZTogaHR0cHM6Ly9naXRodWIuY29tL21vbWVudC9tb21lbnQtdGltZXpvbmUvaXNzdWVzLzI5NDpcXG4gICAgICAgICAgJyArIGVyci5tZXNzYWdlICsgJ1xcbiAgICAgICAgJztcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICB9XG4gICAgdmFyIGRhdGEgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICBpZDogY29tbW9uLmNoYWxsZW5nZUlkLFxuICAgICAgbmFtZTogY29tbW9uLmNoYWxsZW5nZU5hbWUsXG4gICAgICBjaGFsbGVuZ2VUeXBlOiArY29tbW9uLmNoYWxsZW5nZVR5cGUsXG4gICAgICBzb2x1dGlvbjogc29sdXRpb24sXG4gICAgICB0aW1lem9uZTogdGltZXpvbmVcbiAgICB9KTtcblxuICAgICQuYWpheCh7XG4gICAgICB1cmw6ICcvY29tcGxldGVkLWNoYWxsZW5nZS8nLFxuICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgZGF0YTogZGF0YSxcbiAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICBkYXRhVHlwZTogJ2pzb24nXG4gICAgfSkuc3VjY2VzcyhmdW5jdGlvbiAocmVzKSB7XG4gICAgICBpZiAocmVzKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9ICcvY2hhbGxlbmdlcy9uZXh0LWNoYWxsZW5nZT9pZD0nICsgY29tbW9uLmNoYWxsZW5nZUlkO1xuICAgICAgfVxuICAgIH0pLmZhaWwoZnVuY3Rpb24gKCkge1xuICAgICAgd2luZG93LmxvY2F0aW9uLnJlcGxhY2Uod2luZG93LmxvY2F0aW9uLmhyZWYpO1xuICAgIH0pO1xuICB9XG5cbiAgY29tbW9uLnNob3dDb21wbGV0aW9uID0gZnVuY3Rpb24gc2hvd0NvbXBsZXRpb24oKSB7XG5cbiAgICBnYSgnc2VuZCcsICdldmVudCcsICdDaGFsbGVuZ2UnLCAnc29sdmVkJywgY29tbW9uLmdhTmFtZSwgdHJ1ZSk7XG5cbiAgICAkKCcjY29tcGxldGUtY291cnNld2FyZS1kaWFsb2cnKS5tb2RhbCgnc2hvdycpO1xuICAgICQoJyNjb21wbGV0ZS1jb3Vyc2V3YXJlLWRpYWxvZyAubW9kYWwtaGVhZGVyJykuY2xpY2soKTtcblxuICAgICQoJyNzdWJtaXQtY2hhbGxlbmdlJykub2ZmKCdjbGljaycpO1xuICAgICQoJyNzdWJtaXQtY2hhbGxlbmdlJykub24oJ2NsaWNrJywgc3VibWl0Q2hhbGxlbmdlSGFuZGxlcik7XG4gIH07XG5cbiAgcmV0dXJuIGNvbW1vbjtcbn0od2luZG93KTsiLCIndXNlIHN0cmljdCc7XG5cbndpbmRvdy5jb21tb24gPSBmdW5jdGlvbiAoX3JlZikge1xuICB2YXIgJCA9IF9yZWYuJDtcbiAgdmFyIF9yZWYkY29tbW9uID0gX3JlZi5jb21tb247XG4gIHZhciBjb21tb24gPSBfcmVmJGNvbW1vbiA9PT0gdW5kZWZpbmVkID8geyBpbml0OiBbXSB9IDogX3JlZiRjb21tb247XG5cbiAgdmFyIHN0ZXBDbGFzcyA9ICcuY2hhbGxlbmdlLXN0ZXAnO1xuICB2YXIgcHJldkJ0bkNsYXNzID0gJy5jaGFsbGVuZ2Utc3RlcC1idG4tcHJldic7XG4gIHZhciBuZXh0QnRuQ2xhc3MgPSAnLmNoYWxsZW5nZS1zdGVwLWJ0bi1uZXh0JztcbiAgdmFyIGFjdGlvbkJ0bkNsYXNzID0gJy5jaGFsbGVuZ2Utc3RlcC1idG4tYWN0aW9uJztcbiAgdmFyIGZpbmlzaEJ0bkNsYXNzID0gJy5jaGFsbGVuZ2Utc3RlcC1idG4tZmluaXNoJztcbiAgdmFyIHN1Ym1pdEJ0bklkID0gJyNjaGFsbGVuZ2Utc3RlcC1idG4tc3VibWl0JztcbiAgdmFyIHN1Ym1pdE1vZGFsSWQgPSAnI2NoYWxsZW5nZS1zdGVwLW1vZGFsJztcblxuICBmdW5jdGlvbiBnZXRQcmV2aW91c1N0ZXAoJGNoYWxsZW5nZVN0ZXBzKSB7XG4gICAgdmFyICRwcmV2U3RlcCA9IGZhbHNlO1xuICAgIHZhciBwcmV2U3RlcEluZGV4ID0gMDtcbiAgICAkY2hhbGxlbmdlU3RlcHMuZWFjaChmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgIHZhciAkc3RlcCA9ICQodGhpcyk7XG4gICAgICBpZiAoISRzdGVwLmhhc0NsYXNzKCdoaWRkZW4nKSkge1xuICAgICAgICBwcmV2U3RlcEluZGV4ID0gaW5kZXggLSAxO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgJHByZXZTdGVwID0gJGNoYWxsZW5nZVN0ZXBzW3ByZXZTdGVwSW5kZXhdO1xuXG4gICAgcmV0dXJuICRwcmV2U3RlcDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldE5leHRTdGVwKCRjaGFsbGVuZ2VTdGVwcykge1xuICAgIHZhciBsZW5ndGggPSAkY2hhbGxlbmdlU3RlcHMubGVuZ3RoO1xuICAgIHZhciAkbmV4dFN0ZXAgPSBmYWxzZTtcbiAgICB2YXIgbmV4dFN0ZXBJbmRleCA9IDA7XG4gICAgJGNoYWxsZW5nZVN0ZXBzLmVhY2goZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICB2YXIgJHN0ZXAgPSAkKHRoaXMpO1xuICAgICAgaWYgKCEkc3RlcC5oYXNDbGFzcygnaGlkZGVuJykgJiYgaW5kZXggKyAxICE9PSBsZW5ndGgpIHtcbiAgICAgICAgbmV4dFN0ZXBJbmRleCA9IGluZGV4ICsgMTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgICRuZXh0U3RlcCA9ICRjaGFsbGVuZ2VTdGVwc1tuZXh0U3RlcEluZGV4XTtcblxuICAgIHJldHVybiAkbmV4dFN0ZXA7XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVQcmV2U3RlcENsaWNrKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgdmFyIHByZXZTdGVwID0gZ2V0UHJldmlvdXNTdGVwKCQoc3RlcENsYXNzKSk7XG4gICAgJCh0aGlzKS5wYXJlbnQoKS5wYXJlbnQoKS5yZW1vdmVDbGFzcygnc2xpZGVJbkxlZnQgc2xpZGVJblJpZ2h0JykuYWRkQ2xhc3MoJ2FuaW1hdGVkIGZhZGVPdXRSaWdodCBmYXN0LWFuaW1hdGlvbicpLmRlbGF5KDI1MCkucXVldWUoZnVuY3Rpb24gKHByZXYpIHtcbiAgICAgICQodGhpcykuYWRkQ2xhc3MoJ2hpZGRlbicpO1xuICAgICAgaWYgKHByZXZTdGVwKSB7XG4gICAgICAgICQocHJldlN0ZXApLnJlbW92ZUNsYXNzKCdoaWRkZW4nKS5yZW1vdmVDbGFzcygnZmFkZU91dExlZnQgZmFkZU91dFJpZ2h0JykuYWRkQ2xhc3MoJ2FuaW1hdGVkIHNsaWRlSW5MZWZ0IGZhc3QtYW5pbWF0aW9uJykuZGVsYXkoNTAwKS5xdWV1ZShmdW5jdGlvbiAocHJldikge1xuICAgICAgICAgIHByZXYoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBwcmV2KCk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVOZXh0U3RlcENsaWNrKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgdmFyIG5leHRTdGVwID0gZ2V0TmV4dFN0ZXAoJChzdGVwQ2xhc3MpKTtcbiAgICAkKHRoaXMpLnBhcmVudCgpLnBhcmVudCgpLnJlbW92ZUNsYXNzKCdzbGlkZUluUmlnaHQgc2xpZGVJbkxlZnQnKS5hZGRDbGFzcygnYW5pbWF0ZWQgZmFkZU91dExlZnQgZmFzdC1hbmltYXRpb24nKS5kZWxheSgyNTApLnF1ZXVlKGZ1bmN0aW9uIChuZXh0KSB7XG4gICAgICAkKHRoaXMpLmFkZENsYXNzKCdoaWRkZW4nKTtcbiAgICAgIGlmIChuZXh0U3RlcCkge1xuICAgICAgICAkKG5leHRTdGVwKS5yZW1vdmVDbGFzcygnaGlkZGVuJykucmVtb3ZlQ2xhc3MoJ2ZhZGVPdXRSaWdodCBmYWRlT3V0TGVmdCcpLmFkZENsYXNzKCdhbmltYXRlZCBzbGlkZUluUmlnaHQgZmFzdC1hbmltYXRpb24nKS5kZWxheSg1MDApLnF1ZXVlKGZ1bmN0aW9uIChuZXh0KSB7XG4gICAgICAgICAgbmV4dCgpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIG5leHQoKTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZUFjdGlvbkNsaWNrKGUpIHtcbiAgICB2YXIgcHJvcHMgPSBjb21tb24uY2hhbGxlbmdlU2VlZFswXSB8fCB7IHN0ZXBJbmRleDogW10gfTtcblxuICAgIHZhciAkZWwgPSAkKHRoaXMpO1xuICAgIHZhciBpbmRleCA9ICskZWwuYXR0cignaWQnKTtcbiAgICB2YXIgcHJvcEluZGV4ID0gcHJvcHMuc3RlcEluZGV4LmluZGV4T2YoaW5kZXgpO1xuXG4gICAgaWYgKHByb3BJbmRleCA9PT0gLTEpIHtcbiAgICAgIHJldHVybiAkZWwucGFyZW50KCkuZmluZCgnLmRpc2FibGVkJykucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgfVxuXG4gICAgLy8gYW4gQVBJIGFjdGlvblxuICAgIC8vIHByZXZlbnQgbGluayBmcm9tIG9wZW5pbmdcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgdmFyIHByb3AgPSBwcm9wcy5wcm9wZXJ0aWVzW3Byb3BJbmRleF07XG4gICAgdmFyIGFwaSA9IHByb3BzLmFwaXNbcHJvcEluZGV4XTtcbiAgICBpZiAoY29tbW9uW3Byb3BdKSB7XG4gICAgICByZXR1cm4gJGVsLnBhcmVudCgpLmZpbmQoJy5kaXNhYmxlZCcpLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuICAgIH1cbiAgICByZXR1cm4gJC5wb3N0KGFwaSkuZG9uZShmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgLy8gYXNzdW1lIGEgYm9vbGVhbiBpbmRpY2F0ZXMgcGFzc2luZ1xuICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgcmV0dXJuICRlbC5wYXJlbnQoKS5maW5kKCcuZGlzYWJsZWQnKS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgIH1cbiAgICAgIC8vIGFzc3VtZSBhcGkgcmV0dXJucyBzdHJpbmcgd2hlbiBmYWlsc1xuICAgICAgcmV0dXJuICRlbC5wYXJlbnQoKS5maW5kKCcuZGlzYWJsZWQnKS5yZXBsYWNlV2l0aCgnPHAgY2xhc3M9XCJjb2wtc20tNCBjb2wteHMtMTJcIj4nICsgZGF0YSArICc8L3A+Jyk7XG4gICAgfSkuZmFpbChmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZygnZmFpbGVkJyk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVGaW5pc2hDbGljayhlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICQoc3VibWl0TW9kYWxJZCkubW9kYWwoJ3Nob3cnKTtcbiAgICAkKHN1Ym1pdE1vZGFsSWQgKyAnLm1vZGFsLWhlYWRlcicpLmNsaWNrKCk7XG4gICAgJChzdWJtaXRCdG5JZCkuY2xpY2soaGFuZGxlU3VibWl0Q2xpY2spO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlU3VibWl0Q2xpY2soZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICQoJyNzdWJtaXQtY2hhbGxlbmdlJykuYXR0cignZGlzYWJsZWQnLCAndHJ1ZScpLnJlbW92ZUNsYXNzKCdidG4tcHJpbWFyeScpLmFkZENsYXNzKCdidG4td2FybmluZyBkaXNhYmxlZCcpO1xuXG4gICAgdmFyICRjaGVja21hcmtDb250YWluZXIgPSAkKCcjY2hlY2ttYXJrLWNvbnRhaW5lcicpO1xuICAgICRjaGVja21hcmtDb250YWluZXIuY3NzKHsgaGVpZ2h0OiAkY2hlY2ttYXJrQ29udGFpbmVyLmlubmVySGVpZ2h0KCkgfSk7XG5cbiAgICAkKCcjY2hhbGxlbmdlLWNoZWNrbWFyaycpLmFkZENsYXNzKCd6b29tT3V0VXAnKS5kZWxheSgxMDAwKS5xdWV1ZShmdW5jdGlvbiAobmV4dCkge1xuICAgICAgJCh0aGlzKS5yZXBsYWNlV2l0aCgnPGRpdiBpZD1cImNoYWxsZW5nZS1zcGlubmVyXCIgJyArICdjbGFzcz1cImFuaW1hdGVkIHpvb21JblVwIGlubmVyLWNpcmNsZXMtbG9hZGVyXCI+JyArICdzdWJtaXR0aW5nLi4uPC9kaXY+Jyk7XG4gICAgICBuZXh0KCk7XG4gICAgfSk7XG5cbiAgICAkLmFqYXgoe1xuICAgICAgdXJsOiAnL2NvbXBsZXRlZC1jaGFsbGVuZ2UvJyxcbiAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgaWQ6IGNvbW1vbi5jaGFsbGVuZ2VJZCxcbiAgICAgICAgbmFtZTogY29tbW9uLmNoYWxsZW5nZU5hbWUsXG4gICAgICAgIGNoYWxsZW5nZVR5cGU6ICtjb21tb24uY2hhbGxlbmdlVHlwZVxuICAgICAgfSksXG4gICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgIH0pLnN1Y2Nlc3MoZnVuY3Rpb24gKHJlcykge1xuICAgICAgaWYgKHJlcykge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24gPSAnL2NoYWxsZW5nZXMvbmV4dC1jaGFsbGVuZ2U/aWQ9JyArIGNvbW1vbi5jaGFsbGVuZ2VJZDtcbiAgICAgIH1cbiAgICB9KS5mYWlsKGZ1bmN0aW9uICgpIHtcbiAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZXBsYWNlKHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcbiAgICB9KTtcbiAgfVxuXG4gIGNvbW1vbi5pbml0LnB1c2goZnVuY3Rpb24gKCQpIHtcbiAgICBpZiAoY29tbW9uLmNoYWxsZW5nZVR5cGUgIT09ICc3Jykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgJChwcmV2QnRuQ2xhc3MpLmNsaWNrKGhhbmRsZVByZXZTdGVwQ2xpY2spO1xuICAgICQobmV4dEJ0bkNsYXNzKS5jbGljayhoYW5kbGVOZXh0U3RlcENsaWNrKTtcbiAgICAkKGFjdGlvbkJ0bkNsYXNzKS5jbGljayhoYW5kbGVBY3Rpb25DbGljayk7XG4gICAgJChmaW5pc2hCdG5DbGFzcykuY2xpY2soaGFuZGxlRmluaXNoQ2xpY2spO1xuICAgIHJldHVybiBudWxsO1xuICB9KTtcblxuICByZXR1cm4gY29tbW9uO1xufSh3aW5kb3cpOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxuZnVuY3Rpb24gX29iamVjdFdpdGhvdXRQcm9wZXJ0aWVzKG9iaiwga2V5cykgeyB2YXIgdGFyZ2V0ID0ge307IGZvciAodmFyIGkgaW4gb2JqKSB7IGlmIChrZXlzLmluZGV4T2YoaSkgPj0gMCkgY29udGludWU7IGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgaSkpIGNvbnRpbnVlOyB0YXJnZXRbaV0gPSBvYmpbaV07IH0gcmV0dXJuIHRhcmdldDsgfVxuXG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbiAoKSB7XG4gIHZhciBjb21tb24gPSB3aW5kb3cuY29tbW9uO1xuICB2YXIgT2JzZXJ2YWJsZSA9IHdpbmRvdy5SeC5PYnNlcnZhYmxlO1xuICB2YXIgYWRkTG9vcFByb3RlY3QgPSBjb21tb24uYWRkTG9vcFByb3RlY3Q7XG4gIHZhciBjaGFsbGVuZ2VOYW1lID0gY29tbW9uLmNoYWxsZW5nZU5hbWU7XG4gIHZhciBjaGFsbGVuZ2VUeXBlID0gY29tbW9uLmNoYWxsZW5nZVR5cGU7XG4gIHZhciBjaGFsbGVuZ2VUeXBlcyA9IGNvbW1vbi5jaGFsbGVuZ2VUeXBlcztcblxuXG4gIGNvbW1vbi5pbml0LmZvckVhY2goZnVuY3Rpb24gKGluaXQpIHtcbiAgICBpbml0KCQpO1xuICB9KTtcblxuICAvLyBvbmx5IHJ1biBpZiBlZGl0b3IgcHJlc2VudFxuICBpZiAoY29tbW9uLmVkaXRvci5nZXRWYWx1ZSkge1xuICAgIHZhciBjb2RlJCA9IGNvbW1vbi5lZGl0b3JLZXlVcCQuZGVib3VuY2UoNzUwKS5tYXAoZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGNvbW1vbi5lZGl0b3IuZ2V0VmFsdWUoKTtcbiAgICB9KS5kaXN0aW5jdFVudGlsQ2hhbmdlZCgpLnNoYXJlUmVwbGF5KCk7XG5cbiAgICAvLyB1cGRhdGUgc3RvcmFnZVxuICAgIGNvZGUkLnN1YnNjcmliZShmdW5jdGlvbiAoY29kZSkge1xuICAgICAgY29tbW9uLmNvZGVTdG9yYWdlLnVwZGF0ZVN0b3JhZ2UoY29tbW9uLmNoYWxsZW5nZU5hbWUsIGNvZGUpO1xuICAgICAgY29tbW9uLmNvZGVVcmkucXVlcmlmeShjb2RlKTtcbiAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICByZXR1cm4gY29uc29sZS5lcnJvcihlcnIpO1xuICAgIH0pO1xuXG4gICAgY29kZSRcbiAgICAvLyBvbmx5IHJ1biBmb3IgSFRNTFxuICAgIC5maWx0ZXIoZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGNvbW1vbi5jaGFsbGVuZ2VUeXBlID09PSBjaGFsbGVuZ2VUeXBlcy5IVE1MO1xuICAgIH0pLmZsYXRNYXAoZnVuY3Rpb24gKGNvZGUpIHtcbiAgICAgIHJldHVybiBjb21tb24uZGV0ZWN0VW5zYWZlQ29kZSQoY29kZSkubWFwKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNvbWJpbmVkQ29kZSA9IGNvbW1vbi5oZWFkICsgY29kZSArIGNvbW1vbi50YWlsO1xuXG4gICAgICAgIHJldHVybiBhZGRMb29wUHJvdGVjdChjb21iaW5lZENvZGUpO1xuICAgICAgfSkuZmxhdE1hcChmdW5jdGlvbiAoY29kZSkge1xuICAgICAgICByZXR1cm4gY29tbW9uLnVwZGF0ZVByZXZpZXckKGNvZGUpO1xuICAgICAgfSkuZmxhdE1hcChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBjb21tb24uY2hlY2tQcmV2aWV3JCh7IGNvZGU6IGNvZGUgfSk7XG4gICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmp1c3QoeyBlcnI6IGVyciB9KTtcbiAgICAgIH0pO1xuICAgIH0pLnN1YnNjcmliZShmdW5jdGlvbiAoX3JlZikge1xuICAgICAgdmFyIGVyciA9IF9yZWYuZXJyO1xuXG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgcmV0dXJuIGNvbW1vbi51cGRhdGVQcmV2aWV3JCgnXFxuICAgICAgICAgICAgICA8aDE+JyArIGVyciArICc8L2gxPlxcbiAgICAgICAgICAgICcpLnN1YnNjcmliZShmdW5jdGlvbiAoKSB7fSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICByZXR1cm4gY29uc29sZS5lcnJvcihlcnIpO1xuICAgIH0pO1xuICB9XG5cbiAgY29tbW9uLnJlc2V0QnRuJC5kb09uTmV4dChmdW5jdGlvbiAoKSB7XG4gICAgY29tbW9uLmVkaXRvci5zZXRWYWx1ZShjb21tb24ucmVwbGFjZVNhZmVUYWdzKGNvbW1vbi5zZWVkKSk7XG4gIH0pLmZsYXRNYXAoZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBjb21tb24uZXhlY3V0ZUNoYWxsZW5nZSQoKS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICByZXR1cm4gT2JzZXJ2YWJsZS5qdXN0KHsgZXJyOiBlcnIgfSk7XG4gICAgfSk7XG4gIH0pLnN1YnNjcmliZShmdW5jdGlvbiAoX3JlZjIpIHtcbiAgICB2YXIgZXJyID0gX3JlZjIuZXJyO1xuICAgIHZhciBvdXRwdXQgPSBfcmVmMi5vdXRwdXQ7XG4gICAgdmFyIG9yaWdpbmFsQ29kZSA9IF9yZWYyLm9yaWdpbmFsQ29kZTtcblxuICAgIGlmIChlcnIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgIHJldHVybiBjb21tb24udXBkYXRlT3V0cHV0RGlzcGxheSgnJyArIGVycik7XG4gICAgfVxuICAgIGNvbW1vbi5jb2RlU3RvcmFnZS51cGRhdGVTdG9yYWdlKGNoYWxsZW5nZU5hbWUsIG9yaWdpbmFsQ29kZSk7XG4gICAgY29tbW9uLmNvZGVVcmkucXVlcmlmeShvcmlnaW5hbENvZGUpO1xuICAgIGNvbW1vbi51cGRhdGVPdXRwdXREaXNwbGF5KG91dHB1dCk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgfVxuICAgIGNvbW1vbi51cGRhdGVPdXRwdXREaXNwbGF5KCcnICsgZXJyKTtcbiAgfSk7XG5cbiAgT2JzZXJ2YWJsZS5tZXJnZShjb21tb24uZWRpdG9yRXhlY3V0ZSQsIGNvbW1vbi5zdWJtaXRCdG4kKS5mbGF0TWFwKGZ1bmN0aW9uICgpIHtcbiAgICAkKCcjdGVzdFN1aXRlJykuZmFkZU91dCgnc2xvdycpO1xuICAgIGNvbW1vbi5hcHBlbmRUb091dHB1dERpc3BsYXkoJ1xcbi8vIHRlc3RpbmcgY2hhbGxlbmdlLi4uJyk7XG4gICAgcmV0dXJuIGNvbW1vbi5leGVjdXRlQ2hhbGxlbmdlJCgpLm1hcChmdW5jdGlvbiAoX3JlZjMpIHtcbiAgICAgIHZhciB0ZXN0cyA9IF9yZWYzLnRlc3RzO1xuXG4gICAgICB2YXIgcmVzdCA9IF9vYmplY3RXaXRob3V0UHJvcGVydGllcyhfcmVmMywgWyd0ZXN0cyddKTtcblxuICAgICAgdmFyIHNvbHZlZCA9IHRlc3RzLmV2ZXJ5KGZ1bmN0aW9uICh0ZXN0KSB7XG4gICAgICAgIHJldHVybiAhdGVzdC5lcnI7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBfZXh0ZW5kcyh7fSwgcmVzdCwgeyB0ZXN0czogdGVzdHMsIHNvbHZlZDogc29sdmVkIH0pO1xuICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIHJldHVybiBPYnNlcnZhYmxlLmp1c3QoeyBlcnI6IGVyciB9KTtcbiAgICB9KTtcbiAgfSkuc3Vic2NyaWJlKGZ1bmN0aW9uIChfcmVmNCkge1xuICAgIHZhciBlcnIgPSBfcmVmNC5lcnI7XG4gICAgdmFyIHNvbHZlZCA9IF9yZWY0LnNvbHZlZDtcbiAgICB2YXIgb3V0cHV0ID0gX3JlZjQub3V0cHV0O1xuICAgIHZhciB0ZXN0cyA9IF9yZWY0LnRlc3RzO1xuXG4gICAgaWYgKGVycikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgaWYgKGNvbW1vbi5jaGFsbGVuZ2VUeXBlID09PSBjb21tb24uY2hhbGxlbmdlVHlwZXMuSFRNTCkge1xuICAgICAgICByZXR1cm4gY29tbW9uLnVwZGF0ZVByZXZpZXckKCdcXG4gICAgICAgICAgICAgIDxoMT4nICsgZXJyICsgJzwvaDE+XFxuICAgICAgICAgICAgJykuZmlyc3QoKS5zdWJzY3JpYmUoZnVuY3Rpb24gKCkge30pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNvbW1vbi51cGRhdGVPdXRwdXREaXNwbGF5KCcnICsgZXJyKTtcbiAgICB9XG4gICAgY29tbW9uLnVwZGF0ZU91dHB1dERpc3BsYXkob3V0cHV0KTtcbiAgICBjb21tb24uZGlzcGxheVRlc3RSZXN1bHRzKHRlc3RzLCB0cnVlKTtcbiAgICBpZiAoc29sdmVkKSB7XG4gICAgICBjb21tb24uc2hvd0NvbXBsZXRpb24oKTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH0sIGZ1bmN0aW9uIChfcmVmNSkge1xuICAgIHZhciBlcnIgPSBfcmVmNS5lcnI7XG5cbiAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgY29tbW9uLnVwZGF0ZU91dHB1dERpc3BsYXkoJycgKyBlcnIpO1xuICB9KTtcblxuICAvLyBpbml0aWFsIGNoYWxsZW5nZSBydW4gdG8gcG9wdWxhdGUgdGVzdHNcbiAgaWYgKGNoYWxsZW5nZVR5cGUgPT09IGNoYWxsZW5nZVR5cGVzLkhUTUwpIHtcbiAgICB2YXIgJHByZXZpZXcgPSAkKCcjcHJldmlldycpO1xuICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb21DYWxsYmFjaygkcHJldmlldy5yZWFkeSwgJHByZXZpZXcpKCkuZGVsYXkoNTAwKS5mbGF0TWFwKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBjb21tb24uZXhlY3V0ZUNoYWxsZW5nZSQoKTtcbiAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICByZXR1cm4gT2JzZXJ2YWJsZS5qdXN0KHsgZXJyOiBlcnIgfSk7XG4gICAgfSkuc3Vic2NyaWJlKGZ1bmN0aW9uIChfcmVmNikge1xuICAgICAgdmFyIGVyciA9IF9yZWY2LmVycjtcbiAgICAgIHZhciB0ZXN0cyA9IF9yZWY2LnRlc3RzO1xuXG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgaWYgKGNvbW1vbi5jaGFsbGVuZ2VUeXBlID09PSBjb21tb24uY2hhbGxlbmdlVHlwZXMuSFRNTCkge1xuICAgICAgICAgIHJldHVybiBjb21tb24udXBkYXRlUHJldmlldyQoJ1xcbiAgICAgICAgICAgICAgICA8aDE+JyArIGVyciArICc8L2gxPlxcbiAgICAgICAgICAgICAgJykuc3Vic2NyaWJlKGZ1bmN0aW9uICgpIHt9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29tbW9uLnVwZGF0ZU91dHB1dERpc3BsYXkoJycgKyBlcnIpO1xuICAgICAgfVxuICAgICAgY29tbW9uLmRpc3BsYXlUZXN0UmVzdWx0cyh0ZXN0cywgZmFsc2UpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSwgZnVuY3Rpb24gKF9yZWY3KSB7XG4gICAgICB2YXIgZXJyID0gX3JlZjcuZXJyO1xuXG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgfSk7XG4gIH1cblxuICBpZiAoY2hhbGxlbmdlVHlwZSA9PT0gY2hhbGxlbmdlVHlwZXMuQk9ORklSRSB8fCBjaGFsbGVuZ2VUeXBlID09PSBjaGFsbGVuZ2VUeXBlcy5KUykge1xuICAgIHJldHVybiBPYnNlcnZhYmxlLmp1c3Qoe30pLmRlbGF5KDUwMCkuZmxhdE1hcChmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gY29tbW9uLmV4ZWN1dGVDaGFsbGVuZ2UkKCk7XG4gICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgcmV0dXJuIE9ic2VydmFibGUuanVzdCh7IGVycjogZXJyIH0pO1xuICAgIH0pLnN1YnNjcmliZShmdW5jdGlvbiAoX3JlZjgpIHtcbiAgICAgIHZhciBlcnIgPSBfcmVmOC5lcnI7XG4gICAgICB2YXIgb3JpZ2luYWxDb2RlID0gX3JlZjgub3JpZ2luYWxDb2RlO1xuICAgICAgdmFyIHRlc3RzID0gX3JlZjgudGVzdHM7XG5cbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICByZXR1cm4gY29tbW9uLnVwZGF0ZU91dHB1dERpc3BsYXkoJycgKyBlcnIpO1xuICAgICAgfVxuICAgICAgY29tbW9uLmNvZGVTdG9yYWdlLnVwZGF0ZVN0b3JhZ2UoY2hhbGxlbmdlTmFtZSwgb3JpZ2luYWxDb2RlKTtcbiAgICAgIGNvbW1vbi5kaXNwbGF5VGVzdFJlc3VsdHModGVzdHMsIGZhbHNlKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgIGNvbW1vbi51cGRhdGVPdXRwdXREaXNwbGF5KCcnICsgZXJyKTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn0pOyJdLCJzb3VyY2VSb290IjoiL2NvbW1vbkZyYW1ld29yayJ9
