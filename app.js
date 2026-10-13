/*
 * Web Basics Workshop: navigation, editor, live preview and auto-checking.
 * All lesson and lab content comes from labs.js (window.WORKSHOP).
 */
(function () {
  'use strict';

  var WORKSHOP = window.WORKSHOP;
  var STEPS = WORKSHOP.steps;
  var STORE_KEY = 'web-basics-workshop:v1';
  var UPDATE_DELAY = 400;
  var TABS = {
    html: { label: 'HTML', mode: 'htmlmixed' },
    css: { label: 'CSS', mode: 'css' },
    js: { label: 'JS', mode: 'javascript' }
  };
  // Languages for read-only code blocks in lessons and pages.
  var CODE_LANGS = {
    html: TABS.html,
    css: TABS.css,
    js: TABS.js,
    jsx: { label: 'React · JSX', mode: 'jsx' }
  };
  var PAGES = { intro: WORKSHOP.intro, beyond: WORKSHOP.beyond };

  // Default look of the preview page. Learner CSS comes after, so it wins.
  var PREVIEW_BASE_CSS = 'body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }';
  // The checker reads computed styles right after a click: no transitions allowed.
  var CHECKER_CSS = '*, *::before, *::after { transition: none !important; animation: none !important; }';

  var ICON_CHECK = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_START = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M5 3.5l7 4.5-7 4.5z" fill="currentColor"/></svg>';
  var ICON_ARROW = '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M5 11l6-6M6 5h5v5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_LOCK ='<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';

  function $(id) { return document.getElementById(id); }

  var el = {
    stepList: $('step-list'),
    progressText: $('progress-text'),
    progressTrack: $('progress-track'),
    progressFill: $('progress-fill'),
    main: $('main'),
    viewStep: $('view-step'),
    viewLocked: $('view-locked'),
    viewFinish: $('view-finish'),
    viewPage: $('view-page'),
    pageEyebrow: $('page-eyebrow'),
    pageTitle: $('page-title'),
    pageBody: $('page-body'),
    pageNext: $('page-next'),
    stepEyebrow: $('step-eyebrow'),
    stepTitle: $('step-title'),
    lesson: $('lesson'),
    goal: $('lab-goal'),
    btnReset: $('btn-reset'),
    btnHint: $('btn-hint'),
    btnSolution: $('btn-solution'),
    hints: $('hints'),
    tabs: $('tabs'),
    editor: $('editor'),
    preview: $('preview'),
    previewStatus: $('preview-status'),
    errorBar: $('error-bar'),
    checklist: $('checklist'),
    resultsCount: $('results-count'),
    resultsNote: $('results-note'),
    complete: $('complete'),
    completeTitle: $('complete-title'),
    completeText: $('complete-text'),
    completeNext: $('complete-next'),
    lockedEyebrow: $('locked-eyebrow'),
    lockedTitle: $('locked-title'),
    lockedText: $('locked-text'),
    lockedGo: $('locked-go'),
    lockedSkip: $('locked-skip'),
    finishTitle: $('finish-title'),
    finishIntro: $('finish-intro'),
    finishNote: $('finish-note'),
    finishLearned: $('finish-learned'),
    finishLinks: $('finish-links'),
    resetAll: $('reset-all'),
    dialog: $('dialog'),
    dialogTitle: $('dialog-title'),
    dialogBody: $('dialog-body'),
    dialogCancel: $('dialog-cancel'),
    dialogConfirm: $('dialog-confirm'),
    announcer: $('announcer')
  };

  /* =========================================================
     Saved progress (localStorage, never trusted to work)
     ========================================================= */

  function emptyState() {
    return { code: {}, done: {}, skipped: {}, hints: {}, tab: {}, flags: {} };
  }

  function loadState() {
    var s = emptyState();
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      var saved = raw ? JSON.parse(raw) : null;
      if (saved && typeof saved === 'object') {
        Object.keys(s).forEach(function (k) {
          if (saved[k] && typeof saved[k] === 'object') s[k] = saved[k];
        });
      }
    } catch (e) { /* storage unavailable or corrupted: start fresh */ }
    return s;
  }

  function saveState() {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) { /* private mode, quota, blocked storage: keep going */ }
  }

  var state = loadState();

  /* =========================================================
     Small helpers
     ========================================================= */

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // `code`, **bold**, *italic* and [links](#step-1). Everything is escaped first.
  function inline(s) {
    return String(s).split(/(`[^`]+`)/).map(function (part) {
      if (part.length > 1 && part.charAt(0) === '`' && part.charAt(part.length - 1) === '`') {
        return '<code>' + escapeHtml(part.slice(1, -1)) + '</code>';
      }
      return escapeHtml(part)
        .replace(/\[([^\]]+)\]\((#[\w-]+|https:\/\/[^)\s]+)\)/g, function (m, label, href) {
          return href.charAt(0) === '#'
            ? '<a href="' + href + '">' + label + '</a>'
            : '<a href="' + href + '" target="_blank" rel="noopener">' + label + '<span class="sr-only"> (opens in a new tab)</span></a>';
        })
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');
    }).join('');
  }

  function codeBlock(lang, code) {
    var info = CODE_LANGS[lang] || CODE_LANGS.html;
    return '<pre class="code-block cm-s-default" data-lang="' + escapeHtml(info.label) + '">' +
      '<code data-mode="' + escapeHtml(info.mode) + '">' + escapeHtml(code) + '</code></pre>';
  }

  // Live demos are only loaded when the learner asks for them.
  var demoSources = [];

  function renderBlocks(blocks) {
    return blocks.map(function (b) {
      if (b.p) return '<p>' + inline(b.p) + '</p>';
      if (b.h) return '<h3>' + inline(b.h) + '</h3>';
      if (b.h2) return '<h2>' + inline(b.h2) + '</h2>';
      if (b.ul) return '<ul>' + b.ul.map(function (li) { return '<li>' + inline(li) + '</li>'; }).join('') + '</ul>';
      if (b.ol) return '<ol>' + b.ol.map(function (li) { return '<li>' + inline(li) + '</li>'; }).join('') + '</ol>';
      if (b.code !== undefined) return codeBlock(b.lang || 'html', b.code);
      if (b.table) {
        return '<div class="table-wrap"><table class="lesson-table"><thead><tr>' +
          b.table.head.map(function (h) { return '<th scope="col">' + inline(h) + '</th>'; }).join('') +
          '</tr></thead><tbody>' +
          b.table.rows.map(function (row) {
            return '<tr>' + row.map(function (cell) { return '<td>' + inline(cell) + '</td>'; }).join('') + '</tr>';
          }).join('') +
          '</tbody></table></div>';
      }
      if (b.compare) {
        return '<div class="compare">' + b.compare.map(function (side) {
          return '<div class="compare-side"><p class="compare-label">' + inline(side.label) + '</p>' +
            side.parts.map(function (part) { return codeBlock(part.lang, part.code); }).join('') + '</div>';
        }).join('') + '</div>';
      }
      if (b.demo) {
        var id = demoSources.push(b.demo) - 1;
        return '<div class="demo">' +
          '<div class="demo-bar"><div><p class="demo-title">' + escapeHtml(b.demo.title) + '</p>' +
          (b.demo.note ? '<p class="demo-note">' + escapeHtml(b.demo.note) + '</p>' : '') + '</div>' +
          '<button type="button" class="btn btn-primary demo-run" data-demo="' + id + '">Run the live demo</button></div>' +
          '<div class="demo-body" id="demo-body-' + id + '" hidden></div></div>';
      }
      if (b.html) return b.html;
      return '';
    }).join('\n');
  }

  function runDemo(button) {
    var demo = demoSources[parseInt(button.getAttribute('data-demo'), 10)];
    if (!demo) return;
    var body = $('demo-body-' + button.getAttribute('data-demo'));
    var frame = document.createElement('iframe');
    frame.className = 'demo-frame';
    frame.title = demo.title;
    frame.setAttribute('sandbox', 'allow-scripts allow-popups');
    frame.style.height = (demo.height || 240) + 'px';
    frame.srcdoc = demo.html;
    body.innerHTML = '';
    body.appendChild(frame);
    body.hidden = false;
    button.textContent = 'Reload the demo';
  }

  function highlightCode(container) {
    if (!window.CodeMirror || !window.CodeMirror.runMode) return;
    Array.prototype.forEach.call(container.querySelectorAll('code[data-mode]'), function (code) {
      var mode = code.getAttribute('data-mode');
      if (!mode) return;
      var source = code.textContent;
      code.textContent = '';
      try { window.CodeMirror.runMode(source, mode, code); } catch (e) { code.textContent = source; }
    });
  }

  function announce(message) {
    el.announcer.textContent = '';
    window.setTimeout(function () { el.announcer.textContent = message; }, 50);
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  var tokenCounter = 0;
  function newToken() {
    tokenCounter += 1;
    return 'w' + Date.now().toString(36) + '-' + tokenCounter;
  }

  // Runs async jobs one at a time (the checker iframe can only do one thing at once).
  var queue = Promise.resolve();
  function serial(job) {
    var run = queue.then(job, job);
    queue = run.then(null, function () {});
    return run;
  }

  /* =========================================================
     Progress & locking
     ========================================================= */

  function isDone(i) { return !!state.done[STEPS[i].id]; }

  function firstUnfinished() {
    for (var i = 0; i < STEPS.length; i++) if (!isDone(i)) return i;
    return STEPS.length;
  }

  function isLocked(i) {
    return i > firstUnfinished() && !state.skipped[STEPS[i].id];
  }

  function finishUnlocked() { return isDone(STEPS.length - 1); }

  function doneCount() {
    return STEPS.filter(function (s) { return state.done[s.id]; }).length;
  }

  /* =========================================================
     Routing: #step-1 … #step-7, #finish
     ========================================================= */

  var route = null;

  function parseHash() {
    var h = window.location.hash.replace(/^#/, '');
    if (h === 'finish') return { view: 'finish' };
    if (PAGES[h]) return { view: 'page', page: h };
    var m = /^step-(\d+)$/.exec(h);
    if (m) {
      var i = parseInt(m[1], 10) - 1;
      if (i >= 0 && i < STEPS.length) return { view: 'step', index: i };
    }
    return null;
  }

  function defaultHash() {
    if (doneCount() === 0 && !state.flags.introSeen) return 'intro';
    var i = firstUnfinished();
    return i >= STEPS.length ? 'finish' : 'step-' + (i + 1);
  }

  function render(fromNavigation) {
    flushSave();
    route = parseHash();
    if (!route) {
      try { window.history.replaceState(null, '', '#' + defaultHash()); } catch (e) { window.location.hash = defaultHash(); return; }
      route = parseHash();
    }

    el.viewStep.hidden = el.viewLocked.hidden = el.viewFinish.hidden = el.viewPage.hidden = true;
    var heading;

    if (route.view === 'finish') {
      if (finishUnlocked()) { showFinish(); heading = el.finishTitle; }
      else { showLocked('finish'); heading = el.lockedTitle; }
    } else if (route.view === 'page') {
      if (route.page === 'beyond' && !finishUnlocked()) { showLocked('beyond'); heading = el.lockedTitle; }
      else { showPage(route.page); heading = el.pageTitle; }
    } else if (isLocked(route.index)) {
      showLocked(route.index);
      heading = el.lockedTitle;
    } else {
      showStep(route.index);
      heading = el.stepTitle;
    }

    renderNav();

    if (fromNavigation) {
      window.scrollTo(0, 0);
      try { heading.focus({ preventScroll: true }); } catch (e) { heading.focus(); }
    }
  }

  /* =========================================================
     Sidebar
     ========================================================= */

  function renderNav() {
    var done = doneCount();
    el.progressText.textContent = done + ' of ' + STEPS.length + ' labs complete';
    el.progressTrack.setAttribute('aria-valuenow', String(done));
    el.progressFill.style.width = (done / STEPS.length * 100) + '%';

    var items = STEPS.map(function (step, i) {
      var status = isDone(i) ? 'done' : isLocked(i) ? 'locked' : 'open';
      var current = route && route.view === 'step' && route.index === i;
      var marker = status === 'done' ? ICON_CHECK : status === 'locked' ? ICON_LOCK : String(i + 1);
      var statusText = status === 'done' ? ' (completed)' : status === 'locked' ? ' (locked)' : '';
      return '<li><a class="step-link is-' + status + (current ? ' is-current' : '') + '" href="#step-' + (i + 1) + '"' +
        (current ? ' aria-current="step"' : '') + '>' +
        '<span class="step-num" aria-hidden="true">' + marker + '</span>' +
        '<span class="step-name"><span class="step-kicker">Step ' + (i + 1) + '</span>' + escapeHtml(step.short) + '</span>' +
        '<span class="sr-only">' + statusText + '</span></a></li>';
    });

    function extraLink(hash, kicker, name, open, marker, isCurrent) {
      return '<li><a class="step-link is-' + (open ? 'open' : 'locked') + (isCurrent ? ' is-current' : '') +
        '" href="#' + hash + '"' + (isCurrent ? ' aria-current="step"' : '') + '>' +
        '<span class="step-num" aria-hidden="true">' + (open ? marker : ICON_LOCK) + '</span>' +
        '<span class="step-name"><span class="step-kicker">' + kicker + '</span>' + escapeHtml(name) + '</span>' +
        '<span class="sr-only">' + (open ? '' : ' (locked)') + '</span></a></li>';
    }

    var finishOpen = finishUnlocked();
    var onPage = function (key) { return !!route && route.view === 'page' && route.page === key; };
    items.unshift(extraLink('intro', 'Start here', PAGES.intro.short, true, ICON_START, onPage('intro')));
    items.push(extraLink('beyond', 'Bonus', PAGES.beyond.short, finishOpen, ICON_ARROW, onPage('beyond')));
    items.push(extraLink('finish', 'The end', 'Wrap-up', finishOpen, '★', !!route && route.view === 'finish'));

    el.stepList.innerHTML = items.join('');

    var currentLink = el.stepList.querySelector('.is-current');
    if (currentLink && el.stepList.scrollWidth > el.stepList.clientWidth) {
      el.stepList.scrollLeft = currentLink.offsetLeft - 16;
    }
  }

  /* =========================================================
     Locked & finish views
     ========================================================= */

  // `index` is a step index, or 'finish' / 'beyond' for the pages after Step 7.
  function showLocked(index) {
    var need = firstUnfinished();
    var needStep = STEPS[need];
    var isFinish = typeof index === 'string';
    var pageName = index === 'beyond' ? PAGES.beyond.short : 'Wrap-up';

    el.lockedEyebrow.textContent = isFinish ? pageName : 'Step ' + (index + 1) + ' of ' + STEPS.length;
    el.lockedTitle.textContent = isFinish ? pageName + ' is locked' : STEPS[index].title;

    if (isFinish) {
      el.lockedText.textContent = index === 'beyond'
        ? 'Finish the lab in Step ' + STEPS.length + ' to unlock Tailwind, Bootstrap and React.'
        : 'Finish the lab in Step ' + STEPS.length + ' to see your wrap-up.';
      el.lockedGo.textContent = 'Go to Step ' + STEPS.length;
      el.lockedGo.href = '#step-' + STEPS.length;
      el.lockedSkip.hidden = true;
    } else {
      el.lockedText.innerHTML = 'This step is locked. It unlocks when you finish <strong>Step ' + (need + 1) + ': ' +
        escapeHtml(needStep.title) + '</strong>. Each step builds on the ones before it, but if you already know the basics you can skip ahead.';
      el.lockedGo.textContent = 'Go to Step ' + (need + 1);
      el.lockedGo.href = '#step-' + (need + 1);
      el.lockedSkip.hidden = false;
      el.lockedSkip.onclick = function () {
        state.skipped[STEPS[index].id] = true;
        saveState();
        render(true);
      };
    }
    el.viewLocked.hidden = false;
    document.title = 'Locked · Web Basics Workshop';
  }

  function showPage(key) {
    var page = PAGES[key];
    if (el.viewPage.getAttribute('data-page') !== key) {
      el.viewPage.setAttribute('data-page', key);
      el.pageEyebrow.textContent = page.eyebrow;
      el.pageTitle.textContent = page.title;
      demoSources = [];
      el.pageBody.innerHTML = renderBlocks(page.lesson);
      highlightCode(el.pageBody);
      el.pageNext.textContent = page.next.label;
      el.pageNext.href = page.next.href;
    }
    if (key === 'intro' && !state.flags.introSeen) {
      state.flags.introSeen = true;
      saveState();
    }
    el.viewPage.hidden = false;
    document.title = page.short + ' · Web Basics Workshop';
  }

  el.pageBody.addEventListener('click', function (e) {
    var button = e.target.closest && e.target.closest('.demo-run');
    if (button) runDemo(button);
  });

  function showFinish() {
    var f = WORKSHOP.finish;
    el.finishTitle.textContent = f.title;
    el.finishIntro.textContent = f.intro;
    el.finishLearned.innerHTML = STEPS.map(function (s, i) {
      return '<li><strong>' + escapeHtml(s.title) + '.</strong> ' + inline(s.learned) +
        (isDone(i) ? '' : ' <a href="#step-' + (i + 1) + '">(skipped, try it)</a>') + '</li>';
    }).join('');
    el.finishLinks.innerHTML = f.links.map(function (l) {
      return '<li><a href="' + escapeHtml(l.url) + '" target="_blank" rel="noopener">' + escapeHtml(l.title) +
        '<span class="sr-only"> (opens in a new tab)</span></a><span>' + escapeHtml(l.text) + '</span></li>';
    }).join('');

    var skipped = STEPS.length - doneCount();
    el.finishNote.hidden = skipped === 0;
    el.finishNote.textContent = skipped === 1
      ? 'You skipped 1 lab. It’s waiting for you whenever you want to try it.'
      : 'You skipped ' + skipped + ' labs. They’re waiting for you whenever you want to try them.';

    el.viewFinish.hidden = false;
    document.title = 'Well done! · Web Basics Workshop';
  }

  /* =========================================================
     Code editor (CodeMirror 5, with a plain textarea fallback)
     ========================================================= */

  function createEditor(host, onChange, onEscape) {
    var docs = {};
    var active = null;

    if (window.CodeMirror) {
      var CM = window.CodeMirror;
      var cm = CM(host, {
        lineNumbers: true,
        lineWrapping: true,
        tabSize: 2,
        indentUnit: 2,
        matchBrackets: true,
        extraKeys: {
          Tab: function (c) {
            if (c.somethingSelected()) c.indentSelection('add');
            else c.replaceSelection('  ', 'end');
          },
          'Shift-Tab': function (c) { c.indentSelection('subtract'); },
          Esc: function () { onEscape(); }
        }
      });
      cm.on('change', function (instance, change) {
        if (change.origin !== 'setValue') onChange();
      });

      return {
        load: function (files) {
          docs = {};
          Object.keys(files).forEach(function (t) { docs[t] = CM.Doc(files[t], TABS[t].mode); });
          active = null;
        },
        show: function (tab) {
          active = tab;
          cm.swapDoc(docs[tab]);
          cm.getInputField().setAttribute('aria-label', TABS[tab].label + ' code');
        },
        get: function (tab) { return docs[tab] ? docs[tab].getValue() : ''; },
        set: function (tab, value) { if (docs[tab]) docs[tab].setValue(value); },
        refresh: function () { cm.refresh(); },
        focus: function () { cm.focus(); }
      };
    }

    // Fallback when the CDN is unreachable: a plain textarea still works.
    var values = {};
    var ta = document.createElement('textarea');
    ta.className = 'fallback-editor';
    ta.spellcheck = false;
    ta.setAttribute('autocapitalize', 'off');
    host.appendChild(ta);
    ta.addEventListener('input', function () { values[active] = ta.value; onChange(); });
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { onEscape(); return; }
      if (e.key !== 'Tab' || e.shiftKey) return;
      e.preventDefault();
      var start = ta.selectionStart;
      ta.value = ta.value.slice(0, start) + '  ' + ta.value.slice(ta.selectionEnd);
      ta.selectionStart = ta.selectionEnd = start + 2;
      values[active] = ta.value;
      onChange();
    });

    return {
      load: function (files) { values = Object.assign({}, files); active = null; },
      show: function (tab) { active = tab; ta.value = values[tab] || ''; ta.setAttribute('aria-label', TABS[tab].label + ' code'); },
      get: function (tab) { return values[tab] || ''; },
      set: function (tab, value) { values[tab] = value; if (tab === active) ta.value = value; },
      refresh: function () {},
      focus: function () { ta.focus(); }
    };
  }

  /* =========================================================
     Current step
     ========================================================= */

  var current = { index: -1, tab: null };
  var editor = createEditor(el.editor, onEditorChange, function () {
    var tab = el.tabs.querySelector('[aria-selected="true"]');
    if (tab) tab.focus();
  });

  function currentLab() { return STEPS[current.index].lab; }

  function starterFiles(lab) {
    var files = {};
    lab.tabs.forEach(function (t) { files[t] = lab.starter[t] || ''; });
    return files;
  }

  function currentFiles() {
    var files = {};
    currentLab().tabs.forEach(function (t) { files[t] = editor.get(t); });
    return files;
  }

  function sameFiles(a, b) {
    return Object.keys(a).every(function (k) { return a[k] === b[k]; });
  }

  function saveCode() {
    if (current.index < 0) return;
    var step = STEPS[current.index];
    var files = currentFiles();
    if (sameFiles(files, starterFiles(step.lab))) delete state.code[step.id];
    else state.code[step.id] = files;
    saveState();
  }

  function flushSave() {
    if (updateTimer) {
      window.clearTimeout(updateTimer);
      updateTimer = null;
      saveCode();
    }
  }

  function showStep(index) {
    var step = STEPS[index];
    var lab = step.lab;

    if (current.index !== index) {
      current.index = index;
      el.stepEyebrow.textContent = 'Step ' + (index + 1) + ' of ' + STEPS.length;
      el.stepTitle.textContent = step.title;
      el.lesson.innerHTML = renderBlocks(step.lesson);
      highlightCode(el.lesson);
      el.goal.innerHTML = inline(lab.goal);

      var saved = state.code[step.id] || {};
      var files = {};
      lab.tabs.forEach(function (t) {
        files[t] = typeof saved[t] === 'string' ? saved[t] : (lab.starter[t] || '');
      });
      editor.load(files);
      var tab = lab.tabs.indexOf(state.tab[step.id]) !== -1 ? state.tab[step.id] : defaultTab(lab);
      renderTabs();
      selectTab(tab, false);

      renderHints();
      renderChecklist(null);
      el.complete.hidden = true;
      el.resultsNote.hidden = true;
      lastPassCount = null;
      previewErrors = [];
      testErrors = [];
      renderErrors();
    }

    el.viewStep.hidden = false;
    editor.refresh();
    document.title = 'Step ' + (index + 1) + ': ' + step.title + ' · Web Basics Workshop';
    updatePreview();
  }

  // Open the tab the learner is asked to work in.
  function defaultTab(lab) {
    if (lab.tabs.indexOf('js') !== -1) return 'js';
    if (lab.tabs.indexOf('css') !== -1) return 'css';
    return lab.tabs[0];
  }

  /* ---------- Tabs ---------- */

  function renderTabs() {
    el.tabs.innerHTML = '';
    currentLab().tabs.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tab';
      b.id = 'tab-' + t;
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', 'editor');
      b.dataset.tab = t;
      b.textContent = TABS[t].label;
      b.addEventListener('click', function () { selectTab(t, true); });
      b.addEventListener('keydown', onTabKeydown);
      el.tabs.appendChild(b);
    });
  }

  function selectTab(tab, focusEditor) {
    current.tab = tab;
    Array.prototype.forEach.call(el.tabs.children, function (b) {
      var on = b.dataset.tab === tab;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    el.editor.setAttribute('aria-labelledby', 'tab-' + tab);
    editor.show(tab);
    var step = STEPS[current.index];
    if (state.tab[step.id] !== tab) { state.tab[step.id] = tab; saveState(); }
    if (focusEditor) editor.focus();
  }

  function onTabKeydown(e) {
    var tabs = Array.prototype.slice.call(el.tabs.children);
    var i = tabs.indexOf(e.currentTarget);
    var next = null;
    if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
    else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
    else if (e.key === 'Home') next = tabs[0];
    else if (e.key === 'End') next = tabs[tabs.length - 1];
    if (!next) return;
    e.preventDefault();
    selectTab(next.dataset.tab, false);
    next.focus();
  }

  /* ---------- Hints, reset, solution ---------- */

  function renderHints() {
    var step = STEPS[current.index];
    var hints = step.lab.hints;
    var shown = Math.min(state.hints[step.id] || 0, hints.length);
    el.hints.innerHTML = hints.slice(0, shown).map(function (h, i) {
      return '<li><span class="hint-num">Hint ' + (i + 1) + '</span> ' + inline(h) + '</li>';
    }).join('');
    el.hints.hidden = shown === 0;
    if (shown >= hints.length) {
      el.btnHint.textContent = 'No more hints';
      el.btnHint.disabled = true;
    } else {
      el.btnHint.textContent = (shown === 0 ? 'Show hint' : 'Next hint') + ' (' + (shown + 1) + '/' + hints.length + ')';
      el.btnHint.disabled = false;
    }
  }

  el.btnHint.addEventListener('click', function () {
    var step = STEPS[current.index];
    state.hints[step.id] = Math.min((state.hints[step.id] || 0) + 1, step.lab.hints.length);
    saveState();
    renderHints();
    announce(el.hints.lastElementChild ? el.hints.lastElementChild.textContent : '');
    if (el.btnHint.disabled) el.btnSolution.focus();
  });

  function setFiles(files) {
    var lab = currentLab();
    lab.tabs.forEach(function (t) {
      editor.set(t, typeof files[t] === 'string' ? files[t] : (lab.starter[t] || ''));
    });
    updatePreview();
  }

  el.btnReset.addEventListener('click', function () {
    var lab = currentLab();
    if (sameFiles(currentFiles(), starterFiles(lab))) {
      announce('The code is already the starter code.');
      return;
    }
    confirmDialog({
      title: 'Reset the code?',
      body: 'This brings back the starter code for this lab. Your changes in this lab will be lost.',
      confirm: 'Reset code',
      cancel: 'Keep my code'
    }).then(function (ok) {
      if (!ok) return;
      setFiles(lab.starter);
      announce('Starter code restored.');
    });
  });

  el.btnSolution.addEventListener('click', function () {
    confirmDialog({
      title: 'Show the solution?',
      body: 'This replaces your code in this lab with a working solution, and your current code will be lost. Stuck? A hint might be enough to get you going.',
      confirm: 'Show solution',
      cancel: 'Keep trying'
    }).then(function (ok) {
      if (!ok) return;
      setFiles(currentLab().solution);
      announce('Solution loaded. Read it carefully, then try changing it!');
    });
  });

  /* =========================================================
     Live preview + checks
     ========================================================= */

  var updateTimer = null;
  var renderSeq = 0;
  var previewToken = null;
  var previewJsStart = 0;
  var testJsStart = 0;
  var previewErrors = [];
  var testErrors = [];
  var lastPassCount = null;

  function onEditorChange() {
    el.previewStatus.textContent = 'Typing…';
    window.clearTimeout(updateTimer);
    updateTimer = window.setTimeout(updatePreview, UPDATE_DELAY);
  }

  // Script injected at the top of every preview: reports errors and readiness.
  function bridgeScript(token, forChecker) {
    var lines = [
      '(function () {',
      '  var TOKEN = ' + JSON.stringify(token) + ';',
      '  var log = window.__workshopErrors = [];',
      '  window.__workshopToken = TOKEN;',
      '  function send(kind, data) { try { parent.postMessage({ __workshop: TOKEN, kind: kind, data: data }, "*"); } catch (e) {} }',
      '  function report(message, line) { var d = { message: String(message), line: line || 0 }; log.push(d); send("error", d); }',
      '  window.onerror = function (message, source, line, col, error) {',
      '    report(error && error.name ? error.name + ": " + error.message : message, line);',
      '  };',
      '  window.addEventListener("unhandledrejection", function (e) {',
      '    var r = e.reason; report(r && r.name ? r.name + ": " + r.message : r, 0);',
      '  });',
      '  document.addEventListener("DOMContentLoaded", function () { setTimeout(function () { send("ready"); }, 0); });'
    ];
    if (forChecker) {
      // Checks run unattended: popups would block them.
      lines.push('  window.alert = window.confirm = window.prompt = function () {};');
    } else {
      // Links open in a new tab instead of replacing the preview.
      lines.push(
        '  document.addEventListener("click", function (e) {',
        '    if (e.defaultPrevented || !e.target.closest) return;',
        '    var a = e.target.closest("a[href]"); if (!a) return;',
        '    var href = a.getAttribute("href").trim();',
        '    if (!href || href.charAt(0) === "#" || /^javascript:/i.test(href)) return;',
        '    e.preventDefault(); window.open(a.href, "_blank", "noopener");',
        '  });'
      );
    }
    lines.push('})();');
    return lines.join('\n');
  }

  // Combines the learner's HTML, CSS and JS into one document.
  function composeDocument(files, token, forChecker) {
    var doc = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '<script>\n' + bridgeScript(token, forChecker) + '\n<\/script>',
      '<style>' + PREVIEW_BASE_CSS + (forChecker ? '\n' + CHECKER_CSS : '') + '</style>'
    ];
    if (typeof files.css === 'string') doc.push('<style>\n' + files.css + '\n</style>');
    doc.push('</head>', '<body>', files.html || '');
    var html = doc.join('\n') + '\n';
    var jsStartLine = 0;
    if (typeof files.js === 'string') {
      html += '<script>\n';
      jsStartLine = html.split('\n').length;
      html += files.js + '\n<\/script>\n';
    }
    html += '</body>\n</html>\n';
    return { html: html, jsStartLine: jsStartLine };
  }

  function updatePreview() {
    window.clearTimeout(updateTimer);
    updateTimer = null;
    if (current.index < 0) return;

    var index = current.index;
    var files = currentFiles();
    saveCode();

    var seq = ++renderSeq;
    previewToken = newToken();
    var composed = composeDocument(files, previewToken, false);
    previewJsStart = composed.jsStartLine;
    previewErrors = [];
    renderErrors();
    el.preview.srcdoc = composed.html;
    el.previewStatus.textContent = 'Up to date';

    serial(function () {
      if (seq !== renderSeq) return null; // a newer version is already waiting
      return runChecks(STEPS[index], files);
    }).then(function (result) {
      if (!result || seq !== renderSeq || index !== current.index) return;
      applyResults(index, result);
    }, function () { /* never let the checker break the page */ });
  }

  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || typeof d !== 'object' || !d.__workshop) return;
    if (d.__workshop === previewToken && d.kind === 'error') {
      previewErrors.push(d.data || {});
      renderErrors();
    } else if (d.kind === 'ready' && checkerWaiters[d.__workshop]) {
      checkerWaiters[d.__workshop]();
    }
  });

  /* ---------- The checker: a hidden copy of the preview ----------
     Checks click buttons and change the page, so they run in a hidden
     iframe. The visible preview always shows the learner's untouched page. */

  var checker = document.createElement('iframe');
  checker.className = 'checker-frame';
  checker.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  checker.setAttribute('aria-hidden', 'true');
  checker.setAttribute('tabindex', '-1');
  checker.title = 'Checker (hidden)';
  document.body.appendChild(checker);

  var checkerWaiters = {};

  function loadChecker(files) {
    return new Promise(function (resolve) {
      var token = newToken();
      var composed = composeDocument(files, token, true);
      var settled = false;
      var timer;

      function finish() {
        if (settled) return;
        settled = true;
        delete checkerWaiters[token];
        checker.onload = null;
        window.clearTimeout(timer);
        var win = null;
        var doc = null;
        try { win = checker.contentWindow; doc = checker.contentDocument; } catch (e) { /* blocked */ }
        resolve({ doc: doc, win: win, jsStartLine: composed.jsStartLine });
      }

      checkerWaiters[token] = finish;
      checker.onload = function () {
        try { if (checker.contentWindow.__workshopToken !== token) return; } catch (e) { /* fall through */ }
        finish();
      };
      timer = window.setTimeout(finish, 4000);
      checker.style.width = Math.max(320, el.preview.clientWidth || 600) + 'px';
      checker.srcdoc = composed.html;
    });
  }

  function runChecks(step, files) {
    var criteria = step.lab.criteria;
    var fresh = !!step.lab.freshPageForEachCheck;
    var passed = [];
    var errors = [];
    var page = null;
    var jsStartLine = 0;
    var i = 0;

    function next() {
      if (i >= criteria.length) return Promise.resolve({ passed: passed, errors: errors, jsStartLine: jsStartLine });
      var ready = (!page || fresh) ? loadChecker(files) : Promise.resolve(page);
      return ready.then(function (p) {
        page = p;
        jsStartLine = p.jsStartLine;
        var log = [];
        try { log = (p.win && p.win.__workshopErrors) || []; } catch (e) { /* ignore */ }
        var before = log.length;
        var ok = false;
        try {
          ok = !!(p.doc && p.win) && criteria[i].check(p.doc, p.win) === true;
        } catch (e) {
          ok = false; // a learner error must never crash the page
        }
        passed.push(ok);
        log.slice(before).forEach(function (err) { errors.push(err); });
        i += 1;
        return next();
      });
    }

    return next();
  }

  function applyResults(index, result) {
    var step = STEPS[index];
    var total = result.passed.length;
    var count = result.passed.filter(Boolean).length;
    var all = count === total;

    renderChecklist(result.passed);
    testErrors = result.errors;
    testJsStart = result.jsStartLine;
    renderErrors();

    var newlyDone = all && !state.done[step.id];
    if (newlyDone) {
      state.done[step.id] = true;
      saveState();
      renderNav();
    }

    el.resultsNote.hidden = all || !state.done[step.id];
    el.resultsNote.textContent = 'You already completed this lab, so keep experimenting as much as you like.';

    showComplete(index, all, newlyDone);

    if (newlyDone) announce('Lab complete! ' + step.lab.success);
    else if (lastPassCount !== null && count !== lastPassCount) announce(count + ' of ' + total + ' goals done.');
    lastPassCount = count;
  }

  function renderChecklist(passed) {
    var criteria = currentLab().criteria;
    el.checklist.innerHTML = criteria.map(function (c, i) {
      var ok = passed ? passed[i] : false;
      return '<li class="check-item' + (ok ? ' is-pass' : '') + '">' +
        '<span class="check-icon" aria-hidden="true">' + (ok ? '✓' : '○') + '</span>' +
        '<span class="check-label">' + inline(c.label) +
        '<span class="sr-only">' + (ok ? ' (done)' : ' (not done yet)') + '</span></span></li>';
    }).join('');
    var count = passed ? passed.filter(Boolean).length : 0;
    el.resultsCount.textContent = passed ? count + ' / ' + criteria.length : 'Checking…';
  }

  function showComplete(index, all, newlyDone) {
    var step = STEPS[index];
    el.complete.hidden = !all;
    if (!all) return;

    el.completeText.textContent = step.lab.success;
    if (index + 1 < STEPS.length) {
      el.completeNext.textContent = 'Next: ' + STEPS[index + 1].short + ' →';
      el.completeNext.href = '#step-' + (index + 2);
    } else {
      el.completeNext.textContent = 'Next: Going further →';
      el.completeNext.href = '#beyond';
    }

    if (newlyDone) {
      el.complete.classList.remove('is-new');
      void el.complete.offsetWidth; // restart the animation
      el.complete.classList.add('is-new');
      var rect = el.complete.getBoundingClientRect();
      if (rect.bottom > window.innerHeight) {
        el.complete.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      }
    }
  }

  /* ---------- Friendly JavaScript errors ---------- */

  function friendlyTip(message) {
    if (/SyntaxError/.test(message)) {
      return 'The browser can’t read part of your code. Look for a missing bracket <code>)</code> or <code>}</code>, a missing quote, or a typo near that line.';
    }
    if (/is not defined/.test(message)) {
      return 'You used a name that doesn’t exist. Check the spelling: JavaScript cares about capital letters, so <code>btn</code> and <code>Btn</code> are different.';
    }
    if (/null|undefined/.test(message) && /TypeError/.test(message)) {
      return 'Something you used is empty. Usually <code>querySelector</code> found nothing: make sure the selector matches your HTML, with <code>#</code> for an id and <code>.</code> for a class.';
    }
    if (/is not a function/.test(message)) {
      return 'You called something that isn’t a function. Check the spelling of the method, like <code>addEventListener</code> or <code>querySelector</code>.';
    }
    return 'Read the message carefully and look at the line it mentions.';
  }

  function renderErrors() {
    var seen = {};
    var items = [];

    function add(err, jsStart, duringTest) {
      var message = String(err.message || 'Unknown error').replace(/^Uncaught\s+/, '');
      var key = message + '|' + (err.line || 0);
      if (seen[key]) return;
      seen[key] = true;
      var where = '';
      if (err.line && jsStart && err.line >= jsStart) where = 'Line ' + (err.line - jsStart + 1) + ' of the JS tab';
      items.push(
        '<li>' +
        (duringTest ? '<p class="error-context">This happened when the checker clicked on your page:</p>' : '') +
        '<p class="error-message"><code>' + escapeHtml(message) + '</code>' +
        (where ? ' <span class="error-where">' + where + '</span>' : '') + '</p>' +
        '<p class="error-tip">' + friendlyTip(message) + '</p>' +
        '</li>'
      );
    }

    previewErrors.forEach(function (e) { add(e, previewJsStart, false); });
    testErrors.forEach(function (e) { add(e, testJsStart, true); });

    if (!items.length) {
      el.errorBar.hidden = true;
      el.errorBar.innerHTML = '';
      return;
    }
    el.errorBar.hidden = false;
    el.errorBar.innerHTML = '<p class="error-title">Oops! Your JavaScript hit an error</p><ul>' + items.slice(0, 3).join('') + '</ul>';
  }

  /* =========================================================
     Confirmation dialog
     ========================================================= */

  function confirmDialog(opts) {
    var d = el.dialog;
    if (!d || typeof d.showModal !== 'function') {
      return Promise.resolve(window.confirm(opts.title + '\n\n' + opts.body));
    }
    el.dialogTitle.textContent = opts.title;
    el.dialogBody.textContent = opts.body;
    el.dialogConfirm.textContent = opts.confirm || 'OK';
    el.dialogCancel.textContent = opts.cancel || 'Cancel';
    var opener = document.activeElement;
    return new Promise(function (resolve) {
      function onClose() {
        d.removeEventListener('close', onClose);
        resolve(d.returnValue === 'confirm');
        if (opener && opener.focus) opener.focus();
      }
      d.addEventListener('close', onClose);
      d.returnValue = '';
      d.showModal();
      el.dialogCancel.focus();
    });
  }

  // Click on the backdrop closes the dialog.
  el.dialog.addEventListener('click', function (e) {
    if (e.target === el.dialog) el.dialog.close('cancel');
  });

  el.resetAll.addEventListener('click', function () {
    confirmDialog({
      title: 'Reset all progress?',
      body: 'This erases your code, hints and completed labs for all 7 steps, and takes you back to Step 1.',
      confirm: 'Reset everything',
      cancel: 'Cancel'
    }).then(function (ok) {
      if (!ok) return;
      window.clearTimeout(updateTimer);
      updateTimer = null;
      state = emptyState();
      saveState();
      current.index = -1;
      if (window.location.hash === '#step-1') render(true);
      else window.location.hash = 'step-1';
    });
  });

  /* =========================================================
     Start
     ========================================================= */

  window.addEventListener('hashchange', function () { render(true); });
  window.addEventListener('pagehide', flushSave);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flushSave();
  });

  render(false);

  // Small hook for automated testing of the labs.
  window.__workshop = {
    steps: STEPS,
    runChecks: function (index, files) {
      return serial(function () { return runChecks(STEPS[index], files); });
    }
  };
})();
