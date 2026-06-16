/* ============================================================
   Bubble Support Widget  —  self-hosted, zero-dependency
   Embed: <script src="/.../bubble.js"
             data-api-url="https://your-ncpl-backend.vercel.app"
             data-api-key="your_widget_key"
             data-app="HR Portal"></script>
   ============================================================ */
(function () {
  'use strict';

  /* ── Read config from the script tag ─────────────────────── */
  const _script = document.currentScript || (function () {
    const s = document.getElementsByTagName('script');
    return s[s.length - 1];
  })();

    const CFG = {
    apiUrl:      (_script.getAttribute('data-api-url') || '').replace(/\/$/, ''),
    apiKey:      _script.getAttribute('data-api-key') || '',
    app:         _script.getAttribute('data-app') || 'Support',
    departments: (_script.getAttribute('data-departments') || 'IT,HR,Finance,Operations,Admin')
                   .split(',').map(function(d){ return d.trim(); }).filter(Boolean),
  };

  if (!CFG.apiUrl) {
    console.warn('[Bubble] data-api-url is required. Widget not loaded.');
    return;
  }

  /* ── localStorage helpers ─────────────────────────────────── */
  const LS_KEY = 'bbl_email';
  function getEmail()  { try { return localStorage.getItem(LS_KEY) || ''; } catch { return ''; } }
  function saveEmail(e){ try { localStorage.setItem(LS_KEY, e); } catch {} }

  /* ── API helpers ──────────────────────────────────────────── */
  function apiFetch(method, path, body) {
    const opts = {
      method,
      headers: { 'X-Widget-Key': CFG.apiKey },
    };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    return fetch(CFG.apiUrl + path, opts).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.detail || 'HTTP ' + res.status);
        return data;
      });
    });
  }

  /* ── HTML helpers ─────────────────────────────────────────── */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  /* ── Styles ───────────────────────────────────────────────── */
  var CSS = [
    '#bbl-wrap *{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}',

    /* floating button */
    '#bbl-btn{position:fixed;bottom:24px;right:24px;z-index:2147483646;',
    'width:56px;height:56px;border-radius:50%;background:#4f46e5;color:#fff;',
    'display:flex;align-items:center;justify-content:center;cursor:pointer;',
    'box-shadow:0 4px 18px rgba(79,70,229,.5);transition:transform .2s,box-shadow .2s;',
    'user-select:none;border:none;padding:0}',
    '#bbl-btn:hover{transform:scale(1.08);box-shadow:0 6px 22px rgba(79,70,229,.6)}',

    /* badge on button */
    '#bbl-badge{position:absolute;top:3px;right:3px;background:#ef4444;color:#fff;',
    'font-size:10px;font-weight:700;min-width:16px;height:16px;border-radius:8px;',
    'padding:0 4px;display:none;align-items:center;justify-content:center;pointer-events:none}',

    /* panel */
    '#bbl-panel{position:fixed;bottom:92px;right:24px;z-index:2147483647;',
    'width:360px;max-height:550px;background:#fff;border-radius:16px;',
    'box-shadow:0 8px 40px rgba(0,0,0,.18);display:flex;flex-direction:column;',
    'opacity:0;transform:translateY(12px) scale(.97);pointer-events:none;',
    'transition:opacity .22s,transform .22s;overflow:hidden}',
    '#bbl-panel.bbl-open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}',

    /* header */
    '#bbl-hdr{background:#4f46e5;color:#fff;padding:14px 16px;',
    'display:flex;align-items:center;justify-content:space-between;',
    'font-weight:600;font-size:15px;flex-shrink:0;gap:8px}',
    '#bbl-hdr-title{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '#bbl-close{background:none;border:none;color:rgba(255,255,255,.75);cursor:pointer;',
    'font-size:20px;line-height:1;padding:2px 4px;border-radius:6px;transition:color .15s,background .15s}',
    '#bbl-close:hover{color:#fff;background:rgba(255,255,255,.15)}',

    /* tabs */
    '#bbl-tabs{display:flex;border-bottom:1px solid #e2e8f0;padding:0 8px;',
    'gap:2px;flex-shrink:0;background:#f8fafc}',
    '.bbl-tab{flex:1;padding:10px 6px;border:none;background:none;cursor:pointer;',
    'font-size:13px;font-weight:500;color:#64748b;border-bottom:2px solid transparent;',
    'margin-bottom:-1px;transition:color .15s,border-color .15s;white-space:nowrap}',
    '.bbl-tab:hover{color:#4f46e5}',
    '.bbl-tab.bbl-active{color:#4f46e5;border-bottom-color:#4f46e5}',
    '#bbl-mine-badge{background:#4f46e5;color:#fff;font-size:10px;font-weight:700;',
    'padding:1px 5px;border-radius:8px;margin-left:4px;display:none}',

    /* body */
    '#bbl-body{overflow-y:auto;flex:1;scroll-behavior:smooth}',
    '.bbl-pane{padding:16px;display:none}',
    '.bbl-pane.bbl-active{display:block}',

    /* form fields */
    '.bbl-field{margin-bottom:12px}',
    '.bbl-label{display:block;font-size:11px;font-weight:700;color:#475569;',
    'margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px}',
    '.bbl-input{width:100%;padding:8px 10px;border:1.5px solid #e2e8f0;',
    'border-radius:8px;font-size:13px;color:#1e293b;outline:none;',
    'transition:border-color .15s,box-shadow .15s;background:#fff}',
    '.bbl-input:focus{border-color:#4f46e5;box-shadow:0 0 0 3px rgba(79,70,229,.1)}',
    '.bbl-input.bbl-err{border-color:#ef4444}',
    'textarea.bbl-input{resize:vertical;min-height:80px;line-height:1.5}',
    'select.bbl-input{cursor:pointer}',

    /* submit button */
    '#bbl-submit{width:100%;padding:10px;background:#4f46e5;color:#fff;border:none;',
    'border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;',
    'transition:background .15s;margin-top:4px}',
    '#bbl-submit:hover{background:#4338ca}',
    '#bbl-submit:disabled{background:#94a3b8;cursor:not-allowed}',

    /* form message */
    '#bbl-msg{margin-top:10px;font-size:13px;border-radius:8px;',
    'padding:8px 12px;display:none;text-align:center}',
    '#bbl-msg.bbl-ok{background:#f0fdf4;color:#16a34a}',
    '#bbl-msg.bbl-fail{background:#fef2f2;color:#dc2626}',

    /* mine tab — email prompt */
    '#bbl-mine-prompt{margin-bottom:12px}',
    '#bbl-mine-hint{font-size:13px;color:#64748b;margin:0 0 8px}',
    '#bbl-mine-go{width:100%;padding:8px;background:#f1f5f9;color:#4f46e5;',
    'border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;',
    'font-weight:600;cursor:pointer;transition:background .15s;margin-top:6px}',
    '#bbl-mine-go:hover{background:#e0e7ff;border-color:#c7d2fe}',

    /* ticket cards */
    '.bbl-card{padding:12px;border:1.5px solid #e2e8f0;border-radius:10px;margin-bottom:8px}',
    '.bbl-card:last-child{margin-bottom:0}',
    '.bbl-card-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}',
    '.bbl-code{font-size:11px;color:#94a3b8;font-weight:600}',
    '.bbl-card-title{font-size:13px;font-weight:500;color:#1e293b;line-height:1.4;word-break:break-word}',
    '.bbl-card-foot{font-size:11px;color:#94a3b8;margin-top:5px;',
    'display:flex;align-items:center;gap:8px}',

    /* status pills */
    '.bbl-pill{font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;',
    'text-transform:uppercase;letter-spacing:.4px;white-space:nowrap}',
    '.bbl-open{background:#eff6ff;color:#2563eb}',
    '.bbl-inprogress{background:#fffbeb;color:#d97706}',
    '.bbl-pending{background:#f8f9fa;color:#6b7280}',
    '.bbl-resolved{background:#f0fdf4;color:#16a34a}',
    '.bbl-closed{background:#f1f5f9;color:#94a3b8}',

    /* priority dot */
    '.bbl-pri{width:7px;height:7px;border-radius:50%;flex-shrink:0}',
    '.bbl-pri-low{background:#94a3b8}',
    '.bbl-pri-medium{background:#3b82f6}',
    '.bbl-pri-high{background:#f97316}',
    '.bbl-pri-urgent{background:#ef4444}',

        /* department tag */
    '.bbl-dept{font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;',
    'background:#f0f4ff;color:#4f46e5;white-space:nowrap}',

    /* loading / empty states */
    '.bbl-loading,.bbl-empty{text-align:center;color:#94a3b8;padding:28px 16px;font-size:13px;line-height:1.6}',
    '.bbl-spinner{width:24px;height:24px;border:3px solid #e2e8f0;border-top-color:#4f46e5;',
    'border-radius:50%;animation:bbl-spin .7s linear infinite;margin:0 auto 10px}',
    '@keyframes bbl-spin{to{transform:rotate(360deg)}}',

    /* responsive */
    '@media(max-width:420px){',
    '#bbl-panel{width:calc(100vw - 24px);right:12px;bottom:80px}',
    '#bbl-btn{right:12px;bottom:12px}',
    '}',
  ].join('');

  /* ── Status helpers ───────────────────────────────────────── */
  function pillClass(status) {
    var m = {'Open':'open','In Progress':'inprogress','Pending':'pending',
             'Resolved':'resolved','Closed':'closed'};
    return 'bbl-pill bbl-' + (m[status] || 'open');
  }
  function priClass(p) {
    var m = {'Low':'low','Medium':'medium','High':'high','Urgent':'urgent'};
    return 'bbl-pri bbl-pri-' + (m[p] || 'medium');
  }
  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleDateString(undefined, {month:'short',day:'numeric',year:'numeric'});
    } catch(e) { return iso || ''; }
  }

  /* ── DOM elements (set after init) ──────────────────────────*/
  var btn, panel, closeBtn, tabs, paneNew, paneMine;
  var form, submitBtn, msgEl, badge;
  var mineBadge, minePrompt, mineEmailEl, mineGoBtn, ticketList;

  var isOpen = false;
  var currentTab = 'new';
  var mineEmail = '';       // the email currently shown in Mine tab
  var mineLoaded = false;

  /* ── Open / close ─────────────────────────────────────────── */
  function open() {
    isOpen = true;
    panel.classList.add('bbl-open');
    if (currentTab === 'mine' && mineEmail && !mineLoaded) loadTickets(mineEmail);
  }
  function close() {
    isOpen = false;
    panel.classList.remove('bbl-open');
  }

  /* ── Tab switch ───────────────────────────────────────────── */
  function switchTab(t) {
    currentTab = t;
    tabs.forEach(function(el){ el.classList.toggle('bbl-active', el.dataset.tab === t); });
    paneNew.classList.toggle('bbl-active', t === 'new');
    paneMine.classList.toggle('bbl-active', t === 'mine');
    if (t === 'mine' && mineEmail && !mineLoaded) loadTickets(mineEmail);
  }

  /* ── Render ticket list ───────────────────────────────────── */
  function renderTickets(list) {
    mineLoaded = true;
    if (!list.length) {
      ticketList.innerHTML = '<div class="bbl-empty">No tickets yet.<br>Submit one from the <b>New Ticket</b> tab.</div>';
      return;
    }
    ticketList.innerHTML = list.map(function(t) {
      return [
        '<div class="bbl-card">',
          '<div class="bbl-card-top">',
            '<span class="bbl-code">', esc(t.code), '</span>',
            '<span class="', esc(pillClass(t.status)), '">', esc(t.status), '</span>',
          '</div>',
          '<div class="bbl-card-title">', esc(t.title), '</div>',
          '<div class="bbl-card-foot">',
            '<span class="', esc(priClass(t.priority)), '" title="', esc(t.priority), ' priority"></span>',
            '<span>', esc(t.priority), '</span>',
                        t.department ? '<span>·</span><span class="bbl-dept">' + esc(t.department) + '</span>' : '',
            '<span>·</span>',
            '<span>', esc(fmtDate(t.created_at)), '</span>',
          '</div>',
        '</div>',
      ].join('');
    }).join('');
  }

  function updateCounts(list) {
    var active = list.filter(function(t){
      return t.status === 'Open' || t.status === 'In Progress' || t.status === 'Pending';
    }).length;
    badge.textContent = active;
    badge.style.display = active ? 'flex' : 'none';
    mineBadge.textContent = active;
    mineBadge.style.display = active ? 'inline' : 'none';
  }

  /* ── Load tickets from API ────────────────────────────────── */
  function loadTickets(email) {
    mineLoaded = false;
    mineEmail = email;
    saveEmail(email);
    minePrompt.style.display = 'none';
    ticketList.innerHTML = '<div class="bbl-loading"><div class="bbl-spinner"></div>Loading tickets…</div>';

    var params = '?email=' + encodeURIComponent(email) + '&app=' + encodeURIComponent(CFG.app);
    apiFetch('GET', '/api/widget/tickets' + params)
      .then(function(list) {
        renderTickets(list);
        updateCounts(list);
      })
      .catch(function(err) {
        mineLoaded = false;
        ticketList.innerHTML = '<div class="bbl-empty">Could not load tickets.<br><small>' + esc(err.message) + '</small></div>';
        minePrompt.style.display = '';
      });
  }

  /* ── Silently refresh counts (runs on open) ──────────────── */
  function refreshCounts(email) {
    if (!email) return;
    var params = '?email=' + encodeURIComponent(email) + '&app=' + encodeURIComponent(CFG.app);
    apiFetch('GET', '/api/widget/tickets' + params)
      .then(updateCounts)
      .catch(function(){});
  }

  /* ── Form submit ──────────────────────────────────────────── */
  function handleSubmit(e) {
    e.preventDefault();
        var email      = form.querySelector('[name=email]').value.trim();
    var deptEl     = form.querySelector('[name=department]');
    var department = deptEl.value;
    var title      = form.querySelector('[name=title]').value.trim();
    var descr      = form.querySelector('[name=description]').value.trim();
    var priority   = form.querySelector('[name=priority]').value;

    if (!department) {
      deptEl.classList.add('bbl-err');
      deptEl.focus();
      return;
    }
    deptEl.classList.remove('bbl-err');

    msgEl.className = '';
    msgEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';

    apiFetch('POST', '/api/widget/tickets', {
      email: email, title: title, description: descr,
      priority: priority, department: department, app: CFG.app,    }).then(function(result) {
      saveEmail(email);
      mineEmail = email;
      mineEmailEl.value = email;
      mineLoaded = false;
      form.querySelector('[name=title]').value = '';
      form.querySelector('[name=description]').value = '';
      msgEl.textContent = '✓ Ticket ' + result.code + ' submitted! We’ll be in touch.';
      msgEl.className = 'bbl-ok';
      msgEl.style.display = 'block';
      refreshCounts(email);
    }).catch(function(err) {
      msgEl.textContent = '✗ ' + (err.message || 'Submission failed. Please try again.');
      msgEl.className = 'bbl-fail';
      msgEl.style.display = 'block';
    }).finally(function() {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Ticket';
    });
  }

  /* ── Build DOM ─────────────────────────────────────────────── */
  function init() {
    /* styles */
    var styleEl = document.createElement('style');
    styleEl.id  = 'bbl-styles';
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);

    /* root wrapper */
        var wrap = document.createElement('div');
    wrap.id  = 'bbl-wrap';
    var deptHtml = CFG.departments.map(function(d){
      return '<option value="' + esc(d) + '">' + esc(d) + '</option>';
    }).join('');
    wrap.innerHTML = [
      /* floating button */
      '<button id="bbl-btn" title="Support">',
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"',
            ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
          '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
        '</svg>',
        '<span id="bbl-badge"></span>',
      '</button>',

      /* panel */
      '<div id="bbl-panel">',

        /* header */
        '<div id="bbl-hdr">',
          '<span id="bbl-hdr-title">', esc(CFG.app), ' Support</span>',
          '<button id="bbl-close" title="Close">&times;</button>',
        '</div>',

        /* tabs */
        '<div id="bbl-tabs">',
          '<button class="bbl-tab bbl-active" data-tab="new">New Ticket</button>',
          '<button class="bbl-tab" data-tab="mine">',
            'My Tickets<span id="bbl-mine-badge"></span>',
          '</button>',
        '</div>',

        /* body */
        '<div id="bbl-body">',

          /* ─ New Ticket pane ─ */
          '<div id="bbl-pane-new" class="bbl-pane bbl-active">',
            '<form id="bbl-form" novalidate>',

              '<div class="bbl-field">',
                '<label class="bbl-label">Email *</label>',
                '<input class="bbl-input" type="email" name="email"',
                    ' placeholder="you@company.com" required autocomplete="email">',
              '</div>',

                            '<div class="bbl-field">',
                '<label class="bbl-label">Department *</label>',
                '<select class="bbl-input" name="department" required>',
                  '<option value="">Select department…</option>',
                  deptHtml,
                '</select>',
              '</div>',

              '<div class="bbl-field">',
                '<label class="bbl-label">Title *</label>',
                '<input class="bbl-input" type="text" name="title"',
                    ' placeholder="Brief summary of the issue" required>',
              '</div>',

              '<div class="bbl-field">',
                '<label class="bbl-label">Description *</label>',
                '<textarea class="bbl-input" name="description" rows="4"',
                    ' placeholder="Describe the issue in detail…" required></textarea>',
              '</div>',

              '<div class="bbl-field">',
                '<label class="bbl-label">Priority</label>',
                '<select class="bbl-input" name="priority">',
                  '<option value="Low">Low</option>',
                  '<option value="Medium" selected>Medium</option>',
                  '<option value="High">High</option>',
                  '<option value="Urgent">Urgent</option>',
                '</select>',
              '</div>',

              '<button type="submit" id="bbl-submit">Submit Ticket</button>',
              '<div id="bbl-msg"></div>',
            '</form>',
          '</div>',

          /* ─ Mine pane ─ */
          '<div id="bbl-pane-mine" class="bbl-pane">',
            '<div id="bbl-mine-prompt">',
              '<p id="bbl-mine-hint">Enter your email to see your tickets</p>',
              '<input class="bbl-input" type="email" id="bbl-mine-email"',
                  ' placeholder="you@company.com" autocomplete="email">',
              '<button type="button" id="bbl-mine-go">Load My Tickets</button>',
            '</div>',
            '<div id="bbl-ticket-list"></div>',
          '</div>',

        '</div>', /* #bbl-body */
      '</div>',   /* #bbl-panel */
    ].join('');

    document.body.appendChild(wrap);

    /* grab refs */
    btn        = document.getElementById('bbl-btn');
    panel      = document.getElementById('bbl-panel');
    closeBtn   = document.getElementById('bbl-close');
    tabs       = Array.prototype.slice.call(document.querySelectorAll('.bbl-tab'));
    paneNew    = document.getElementById('bbl-pane-new');
    paneMine   = document.getElementById('bbl-pane-mine');
    form       = document.getElementById('bbl-form');
    submitBtn  = document.getElementById('bbl-submit');
    msgEl      = document.getElementById('bbl-msg');
    badge      = document.getElementById('bbl-badge');
    mineBadge  = document.getElementById('bbl-mine-badge');
    minePrompt = document.getElementById('bbl-mine-prompt');
    mineEmailEl= document.getElementById('bbl-mine-email');
    mineGoBtn  = document.getElementById('bbl-mine-go');
    ticketList = document.getElementById('bbl-ticket-list');

    /* pre-fill saved email */
    var saved = getEmail();
    if (saved) {
      form.querySelector('[name=email]').value = saved;
      mineEmailEl.value = saved;
      mineEmail = saved;
    }

    /* events */
    btn.addEventListener('click', function(){ isOpen ? close() : open(); });
    closeBtn.addEventListener('click', close);

    tabs.forEach(function(t){
      t.addEventListener('click', function(){ switchTab(t.dataset.tab); });
    });

    form.addEventListener('submit', handleSubmit);

    mineGoBtn.addEventListener('click', function(){
      var e = mineEmailEl.value.trim();
      if (!e || !e.includes('@')) {
        mineEmailEl.classList.add('bbl-err');
        return;
      }
      mineEmailEl.classList.remove('bbl-err');
      loadTickets(e);
    });
    mineEmailEl.addEventListener('keydown', function(e){
      if (e.key === 'Enter') mineGoBtn.click();
    });
        form.querySelector('[name=department]').addEventListener('change', function(){
      this.classList.remove('bbl-err');
    });

    mineEmailEl.addEventListener('input', function(){
      mineEmailEl.classList.remove('bbl-err');
    });

    /* silently load counts for the badge on first load */
    if (saved) refreshCounts(saved);
  }

  /* ── Bootstrap ─────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
