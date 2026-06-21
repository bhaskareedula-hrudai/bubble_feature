/* ============================================================
   Bubble Support Widget  —  self-hosted, zero-dependency
   ============================================================ */
(function () {
  'use strict';

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
    staffEmail:  (_script.getAttribute('data-staff-email') || '').trim().toLowerCase(),
  };

  if (!CFG.apiUrl) {
    console.warn('[Bubble] data-api-url is required. Widget not loaded.');
    return;
  }

  const LS_KEY = 'bbl_email';
  function getEmail()  { try { return localStorage.getItem(LS_KEY) || ''; } catch { return ''; } }
  function saveEmail(e){ try { localStorage.setItem(LS_KEY, e); } catch {} }

  function apiFetch(method, path, body) {
    const opts = { method, headers: { 'X-Widget-Key': CFG.apiKey } };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    return fetch(CFG.apiUrl + path, opts).then(function(res) {
      return res.json().then(function(data) {
        if (!res.ok) throw new Error(data.detail || 'HTTP ' + res.status);
        return data;
      });
    });
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  var CSS = [
    '#bbl-wrap *{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}',
    '#bbl-btn{position:fixed;bottom:24px;right:24px;z-index:2147483646;',
    'width:56px;height:56px;border-radius:50%;background:#4f46e5;color:#fff;',
    'display:flex;align-items:center;justify-content:center;cursor:pointer;',
    'box-shadow:0 4px 18px rgba(79,70,229,.5);transition:transform .2s,box-shadow .2s;',
    'user-select:none;border:none;padding:0}',
    '#bbl-btn:hover{transform:scale(1.08);box-shadow:0 6px 22px rgba(79,70,229,.6)}',
    '#bbl-badge{position:absolute;top:3px;right:3px;background:#ef4444;color:#fff;',
    'font-size:10px;font-weight:700;min-width:16px;height:16px;border-radius:8px;',
    'padding:0 4px;display:none;align-items:center;justify-content:center;pointer-events:none}',
    '#bbl-panel{position:fixed;bottom:92px;right:24px;z-index:2147483647;',
    'width:360px;max-height:580px;background:#fff;border-radius:16px;',
    'box-shadow:0 8px 40px rgba(0,0,0,.18);display:flex;flex-direction:column;',
    'opacity:0;transform:translateY(12px) scale(.97);pointer-events:none;',
    'transition:opacity .22s,transform .22s;overflow:hidden}',
    '#bbl-panel.bbl-open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}',
    '#bbl-hdr{background:#4f46e5;color:#fff;padding:14px 16px;',
    'display:flex;align-items:center;justify-content:space-between;',
    'font-weight:600;font-size:15px;flex-shrink:0;gap:8px}',
    '#bbl-hdr-title{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '#bbl-close{background:none;border:none;color:rgba(255,255,255,.75);cursor:pointer;',
    'font-size:20px;line-height:1;padding:2px 4px;border-radius:6px;transition:color .15s,background .15s}',
    '#bbl-close:hover{color:#fff;background:rgba(255,255,255,.15)}',
    '#bbl-tabs{display:flex;border-bottom:1px solid #e2e8f0;padding:0 8px;',
    'gap:2px;flex-shrink:0;background:#f8fafc}',
    '.bbl-tab{flex:1;padding:10px 6px;border:none;background:none;cursor:pointer;',
    'font-size:13px;font-weight:500;color:#64748b;border-bottom:2px solid transparent;',
    'margin-bottom:-1px;transition:color .15s,border-color .15s;white-space:nowrap}',
    '.bbl-tab:hover{color:#4f46e5}',
    '.bbl-tab.bbl-active{color:#4f46e5;border-bottom-color:#4f46e5}',
    '#bbl-mine-badge{background:#4f46e5;color:#fff;font-size:10px;font-weight:700;',
    'padding:1px 5px;border-radius:8px;margin-left:4px;display:none}',
    '#bbl-inbox-badge{background:#ef4444;color:#fff;font-size:10px;font-weight:700;',
    'padding:1px 5px;border-radius:8px;margin-left:4px;display:none}',
    '#bbl-assigned-badge{background:#8b5cf6;color:#fff;font-size:10px;font-weight:700;',
    'padding:1px 5px;border-radius:8px;margin-left:4px;display:none}',
    '#bbl-body{overflow-y:auto;flex:1;scroll-behavior:smooth}',
    '.bbl-pane{padding:16px;display:none}',
    '.bbl-pane.bbl-active{display:block}',
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
    '#bbl-submit{width:100%;padding:10px;background:#4f46e5;color:#fff;border:none;',
    'border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;',
    'transition:background .15s;margin-top:4px}',
    '#bbl-submit:hover{background:#4338ca}',
    '#bbl-submit:disabled{background:#94a3b8;cursor:not-allowed}',
    '#bbl-msg{margin-top:10px;font-size:13px;border-radius:8px;',
    'padding:8px 12px;display:none;text-align:center}',
    '#bbl-msg.bbl-ok{background:#f0fdf4;color:#16a34a}',
    '#bbl-msg.bbl-fail{background:#fef2f2;color:#dc2626}',
    '#bbl-mine-prompt{margin-bottom:12px}',
    '#bbl-mine-hint{font-size:13px;color:#64748b;margin:0 0 8px}',
    '#bbl-mine-go{width:100%;padding:8px;background:#f1f5f9;color:#4f46e5;',
    'border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;',
    'font-weight:600;cursor:pointer;transition:background .15s;margin-top:6px}',
    '#bbl-mine-go:hover{background:#e0e7ff;border-color:#c7d2fe}',
    '.bbl-card{padding:12px;border:1.5px solid #e2e8f0;border-radius:10px;margin-bottom:8px}',
    '.bbl-card:last-child{margin-bottom:0}',
    '.bbl-card-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}',
    '.bbl-code{font-size:11px;color:#94a3b8;font-weight:600}',
    '.bbl-card-title{font-size:13px;font-weight:500;color:#1e293b;line-height:1.4;word-break:break-word}',
    '.bbl-card-foot{font-size:11px;color:#94a3b8;margin-top:5px;display:flex;align-items:center;gap:8px}',
    '.bbl-card-sub{font-size:11px;color:#64748b;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.bbl-pill{font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;',
    'text-transform:uppercase;letter-spacing:.4px;white-space:nowrap}',
    '.bbl-open{background:#eff6ff;color:#2563eb}',
    '.bbl-inprogress{background:#fffbeb;color:#d97706}',
    '.bbl-pending{background:#f8f9fa;color:#6b7280}',
    '.bbl-resolved{background:#f0fdf4;color:#16a34a}',
    '.bbl-closed{background:#f1f5f9;color:#94a3b8}',
    '.bbl-pri{width:7px;height:7px;border-radius:50%;flex-shrink:0}',
    '.bbl-pri-low{background:#94a3b8}',
    '.bbl-pri-medium{background:#3b82f6}',
    '.bbl-pri-high{background:#f97316}',
    '.bbl-pri-urgent{background:#ef4444}',
    '.bbl-dept{font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;',
    'background:#f0f4ff;color:#4f46e5;white-space:nowrap}',
    '.bbl-assignee-tag{font-size:10px;font-weight:600;padding:2px 7px;border-radius:10px;',
    'background:#f0fdf4;color:#16a34a;white-space:nowrap}',
    '.bbl-loading,.bbl-empty{text-align:center;color:#94a3b8;padding:28px 16px;font-size:13px;line-height:1.6}',
    '.bbl-spinner{width:24px;height:24px;border:3px solid #e2e8f0;border-top-color:#4f46e5;',
    'border-radius:50%;animation:bbl-spin .7s linear infinite;margin:0 auto 10px}',
    '@keyframes bbl-spin{to{transform:rotate(360deg)}}',
    '.bbl-actions{margin-top:8px;display:flex;gap:5px;flex-wrap:wrap}',
    '.bbl-act{padding:3px 10px;border-radius:6px;border:1.5px solid;font-size:11px;font-weight:600;cursor:pointer;transition:background .15s;background:none}',
    '.bbl-act:disabled{opacity:.5;cursor:not-allowed}',
    '.bbl-act-start{color:#2563eb;border-color:#bfdbfe;background:#eff6ff}',
    '.bbl-act-start:hover:not(:disabled){background:#dbeafe}',
    '.bbl-act-resolve{color:#16a34a;border-color:#bbf7d0;background:#f0fdf4}',
    '.bbl-act-resolve:hover:not(:disabled){background:#dcfce7}',
    '.bbl-act-close{color:#64748b;border-color:#e2e8f0;background:#f8fafc}',
    '.bbl-act-close:hover:not(:disabled){background:#f1f5f9}',
    '.bbl-act-escalate{color:#ea580c;border-color:#fed7aa;background:#fff7ed}',
    '.bbl-act-escalate:hover:not(:disabled){background:#ffedd5}',
    '@media(max-width:420px){',
    '#bbl-panel{width:calc(100vw - 24px);right:12px;bottom:80px}',
    '#bbl-btn{right:12px;bottom:12px}',
    '}',
  ].join('');

  function pillClass(s) {
    var m = {'Open':'open','In Progress':'inprogress','Pending':'pending','Resolved':'resolved','Closed':'closed'};
    return 'bbl-pill bbl-' + (m[s] || 'open');
  }
  function priClass(p) {
    var m = {'Low':'low','Medium':'medium','High':'high','Urgent':'urgent'};
    return 'bbl-pri bbl-pri-' + (m[p] || 'medium');
  }
  function fmtDate(iso) {
    try { return new Date(iso).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}); }
    catch(e){ return iso||''; }
  }

  var btn, panel, closeBtn, tabs, paneNew, paneMine;
  var form, submitBtn, msgEl, badge;
  var mineBadge, minePrompt, mineEmailEl, mineGoBtn, ticketList;
  var inboxBadge, paneInbox, inboxList;
  var assignedBadge, paneAssigned, assignedList, assignedPrompt, assignedNameEl, assignedDeptEl, assignedGoBtn;

  var isOpen = false, currentTab = 'new', mineEmail = '', mineLoaded = false, inboxLoaded = false;
  var assignedName = '', assignedDept = '', assignedLoaded = false;

  function open() {
    isOpen = true;
    panel.classList.add('bbl-open');
    if (currentTab === 'mine' && mineEmail && !mineLoaded) loadTickets(mineEmail);
    if (currentTab === 'assigned' && assignedDept && !assignedLoaded) loadAssigned(assignedDept, assignedName);
  }
  function close() { isOpen = false; panel.classList.remove('bbl-open'); }

  function switchTab(t) {
    currentTab = t;
    tabs.forEach(function(el){ el.classList.toggle('bbl-active', el.dataset.tab === t); });
    paneNew.classList.toggle('bbl-active', t === 'new');
    paneMine.classList.toggle('bbl-active', t === 'mine');
    paneAssigned.classList.toggle('bbl-active', t === 'assigned');
    if (paneInbox) paneInbox.classList.toggle('bbl-active', t === 'inbox');
    if (t === 'mine' && mineEmail && !mineLoaded) loadTickets(mineEmail);
    if (t === 'assigned' && assignedDept && !assignedLoaded) loadAssigned(assignedDept, assignedName);
    if (t === 'inbox' && !inboxLoaded) loadInbox();
  }

  function updateTicketStatus(ticketId, action, btn, onSuccess, opts) {
    opts = opts || {};
    btn.disabled = true;
    var orig = btn.textContent;
    btn.textContent = '…';
    var payload = { action: action };
    if (opts.email)      payload.email              = opts.email;
    if (opts.actingDept) payload.acting_department  = opts.actingDept;
    if (opts.actingName) payload.acting_name        = opts.actingName;
    apiFetch('PATCH', '/api/widget/tickets/' + encodeURIComponent(ticketId) + '/status', payload)
      .then(function() { onSuccess(); })
      .catch(function(err) {
        btn.disabled = false;
        btn.textContent = orig;
        var errEl = document.createElement('span');
        errEl.style.cssText = 'color:#dc2626;font-size:11px;margin-left:6px';
        errEl.textContent = err.message || 'Failed';
        btn.parentNode.appendChild(errEl);
        setTimeout(function(){ if (errEl.parentNode) errEl.parentNode.removeChild(errEl); }, 3000);
      });
  }

  function myTicketActions(t) {
    var btns = [], s = t.status;
    if (s === 'Open' || s === 'Pending' || s === 'In Progress') {
      btns.push('<button class="bbl-act bbl-act-escalate" data-action="escalate" data-id="' + esc(t.id) + '">Escalate</button>');
    }
    if (s === 'Resolved') {
      btns.push('<button class="bbl-act bbl-act-escalate" data-action="reopen" data-id="' + esc(t.id) + '">Not Resolved</button>');
      btns.push('<button class="bbl-act bbl-act-close" data-action="close" data-id="' + esc(t.id) + '">Close Ticket</button>');
    }
    return btns.length ? '<div class="bbl-actions">' + btns.join('') + '</div>' : '';
  }

  function assignedActions(t) {
    var btns = [], s = t.status;
    if (s === 'Open') {
      btns.push('<button class="bbl-act bbl-act-start" data-action="start" data-id="' + esc(t.id) + '">In Progress</button>');
    }
    if (s === 'Open' || s === 'In Progress' || s === 'Pending') {
      btns.push('<button class="bbl-act bbl-act-resolve" data-action="resolve" data-id="' + esc(t.id) + '">Resolved</button>');
      btns.push('<button class="bbl-act bbl-act-close" data-action="close" data-id="' + esc(t.id) + '">Closed</button>');
    }
    return btns.length ? '<div class="bbl-actions">' + btns.join('') + '</div>' : '';
  }

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
            t.assignee_name ? '<span>·</span><span class="bbl-assignee-tag">→ ' + esc(t.assignee_name) + '</span>' : '',
            '<span>·</span><span>', esc(fmtDate(t.created_at)), '</span>',
          '</div>',
          myTicketActions(t),
        '</div>',
      ].join('');
    }).join('');
  }

  function updateCounts(list) {
    var active = list.filter(function(t){ return t.status==='Open'||t.status==='In Progress'||t.status==='Pending'; }).length;
    badge.textContent = active; badge.style.display = active ? 'flex' : 'none';
    mineBadge.textContent = active; mineBadge.style.display = active ? 'inline' : 'none';
  }

  function loadTickets(email) {
    mineLoaded = false; mineEmail = email; saveEmail(email);
    minePrompt.style.display = 'none';
    ticketList.innerHTML = '<div class="bbl-loading"><div class="bbl-spinner"></div>Loading tickets…</div>';
    apiFetch('GET', '/api/widget/tickets?email=' + encodeURIComponent(email) + '&app=' + encodeURIComponent(CFG.app))
      .then(function(list){ renderTickets(list); updateCounts(list); })
      .catch(function(err){
        mineLoaded = false;
        ticketList.innerHTML = '<div class="bbl-empty">Could not load tickets.<br><small>' + esc(err.message) + '</small></div>';
        minePrompt.style.display = '';
      });
  }

  function refreshCounts(email) {
    if (!email) return;
    apiFetch('GET', '/api/widget/tickets?email=' + encodeURIComponent(email) + '&app=' + encodeURIComponent(CFG.app))
      .then(updateCounts).catch(function(){});
  }

  function updateAssignedCounts(list) {
    var active = list.filter(function(t){ return t.status==='Open'||t.status==='In Progress'||t.status==='Pending'; }).length;
    if (assignedBadge) { assignedBadge.textContent = active; assignedBadge.style.display = active ? 'inline' : 'none'; }
  }

  function renderAssignedTickets(list) {
    assignedLoaded = true;
    if (!list.length) {
      assignedList.innerHTML = '<div class="bbl-empty">No tickets found for this department.</div>';
      return;
    }
    assignedList.innerHTML = list.map(function(t) {
      return [
        '<div class="bbl-card">',
          '<div class="bbl-card-top">',
            '<span class="bbl-code">', esc(t.code), '</span>',
            '<span class="', esc(pillClass(t.status)), '">', esc(t.status), '</span>',
          '</div>',
          '<div class="bbl-card-title">', esc(t.title), '</div>',
          '<div class="bbl-card-sub">from: ', esc(t.created_by_email || t.created_by_name || ''), '</div>',
          '<div class="bbl-card-foot">',
            '<span class="', esc(priClass(t.priority)), '" title="', esc(t.priority), ' priority"></span>',
            '<span>', esc(t.priority), '</span>',
            t.department ? '<span>·</span><span class="bbl-dept">' + esc(t.department) + '</span>' : '',
            '<span>·</span><span>', esc(fmtDate(t.created_at)), '</span>',
          '</div>',
          assignedActions(t),
        '</div>',
      ].join('');
    }).join('');
  }

  function loadAssigned(dept, name) {
    assignedLoaded = false; assignedDept = dept; assignedName = name || '';
    assignedPrompt.style.display = 'none';
    assignedList.innerHTML = '<div class="bbl-loading"><div class="bbl-spinner"></div>Loading department tickets…</div>';
    apiFetch('GET', '/api/widget/assigned-by-dept?department=' + encodeURIComponent(dept) + '&app=' + encodeURIComponent(CFG.app))
      .then(function(list){ renderAssignedTickets(list); updateAssignedCounts(list); })
      .catch(function(err){
        assignedLoaded = false;
        assignedList.innerHTML = '<div class="bbl-empty">Could not load tickets.<br><small>' + esc(err.message) + '</small></div>';
        assignedPrompt.style.display = '';
      });
  }

  function loadDepartments() {
    var formSel = form ? form.querySelector('[name=department]') : null;
    var assignedSel = document.getElementById('bbl-assigned-dept');
    function setOpts(opts) {
      if (formSel) formSel.innerHTML = '<option value="">Select department…</option>' + opts;
      if (assignedSel) assignedSel.innerHTML = '<option value="">Select department…</option>' + opts;
    }
    apiFetch('GET', '/api/widget/departments')
      .then(function(depts) {
        if (!depts || !depts.length) throw new Error('empty');
        setOpts(depts.map(function(d){ return '<option value="' + esc(d.name) + '">' + esc(d.name) + '</option>'; }).join(''));
      })
      .catch(function() {
        setOpts(CFG.departments.map(function(d){ return '<option value="' + esc(d) + '">' + esc(d) + '</option>'; }).join(''));
      });
  }

  function loadAssignees(dept) {
    var field = document.getElementById('bbl-assignee-field');
    var sel = form ? form.querySelector('[name=assignee]') : null;
    if (!field || !sel) return;
    if (!dept) { field.style.display = 'none'; sel.innerHTML = '<option value="">Unassigned</option>'; return; }
    field.style.display = 'block';
    sel.innerHTML = '<option value="">Loading members…</option>';
    apiFetch('GET', '/api/widget/department-members?department=' + encodeURIComponent(dept))
      .then(function(members) {
        sel.innerHTML = '<option value="">Unassigned</option>' +
          members.map(function(m){
            return '<option value="' + esc(m.id) + '" data-name="' + esc(m.name) + '" data-email="' + esc(m.email) + '">' + esc(m.name || m.email) + '</option>';
          }).join('');
      })
      .catch(function() { sel.innerHTML = '<option value="">Unassigned</option>'; });
  }

  function loadInbox() {
    if (!CFG.staffEmail || !inboxList) return;
    inboxLoaded = false;
    inboxList.innerHTML = '<div class="bbl-loading"><div class="bbl-spinner"></div>Loading inbox…</div>';
    apiFetch('GET', '/api/widget/department-tickets?staff_email=' + encodeURIComponent(CFG.staffEmail) + '&app=' + encodeURIComponent(CFG.app))
      .then(function(list){ renderInboxTickets(list); updateInboxCounts(list); })
      .catch(function(err){
        inboxLoaded = false;
        inboxList.innerHTML = '<div class="bbl-empty">Could not load inbox.<br><small>' + esc(err.message) + '</small></div>';
      });
  }

  function renderInboxTickets(list) {
    inboxLoaded = true;
    if (!list.length) { inboxList.innerHTML = '<div class="bbl-empty">No tickets in your department yet.</div>'; return; }
    inboxList.innerHTML = list.map(function(t) {
      return [
        '<div class="bbl-card">',
          '<div class="bbl-card-top">',
            '<span class="bbl-code">', esc(t.code), '</span>',
            '<span class="', esc(pillClass(t.status)), '">', esc(t.status), '</span>',
          '</div>',
          '<div class="bbl-card-title">', esc(t.title), '</div>',
          '<div class="bbl-card-sub">from: ', esc(t.created_by_email || t.created_by_name || ''), '</div>',
          t.assignee_name ? '<div class="bbl-card-sub">assigned to: <b>' + esc(t.assignee_name) + '</b></div>' : '',
          '<div class="bbl-card-foot">',
            '<span class="', esc(priClass(t.priority)), '" title="', esc(t.priority), ' priority"></span>',
            '<span>', esc(t.priority), '</span>',
            '<span>·</span><span>', esc(fmtDate(t.created_at)), '</span>',
          '</div>',
        '</div>',
      ].join('');
    }).join('');
  }

  function updateInboxCounts(list) {
    var open = list.filter(function(t){ return t.status==='Open'||t.status==='In Progress'||t.status==='Pending'; }).length;
    if (inboxBadge) { inboxBadge.textContent = open; inboxBadge.style.display = open ? 'inline' : 'none'; }
    badge.textContent = open; badge.style.display = open ? 'flex' : 'none';
  }

  function refreshInboxCounts() {
    if (!CFG.staffEmail) return;
    apiFetch('GET', '/api/widget/department-tickets?staff_email=' + encodeURIComponent(CFG.staffEmail) + '&app=' + encodeURIComponent(CFG.app))
      .then(updateInboxCounts).catch(function(){});
  }

  function handleSubmit(e) {
    e.preventDefault();
    var email      = form.querySelector('[name=email]').value.trim();
    var deptEl     = form.querySelector('[name=department]');
    var department = deptEl.value;
    var title      = form.querySelector('[name=title]').value.trim();
    var descr      = form.querySelector('[name=description]').value.trim();
    var priority   = form.querySelector('[name=priority]').value;
    var assigneeEl = form.querySelector('[name=assignee]');
    var assigneeId   = assigneeEl ? (assigneeEl.value || null) : null;
    var assigneeName = assigneeEl && assigneeEl.selectedIndex > 0
      ? (assigneeEl.options[assigneeEl.selectedIndex].getAttribute('data-name') || null) : null;
    var assigneeEmail = assigneeEl && assigneeEl.selectedIndex > 0
      ? (assigneeEl.options[assigneeEl.selectedIndex].getAttribute('data-email') || null) : null;

    if (!department) { deptEl.classList.add('bbl-err'); deptEl.focus(); return; }
    deptEl.classList.remove('bbl-err');

    msgEl.className = ''; msgEl.style.display = 'none';
    submitBtn.disabled = true; submitBtn.textContent = 'Submitting…';

    apiFetch('POST', '/api/widget/tickets', {
      email, title, description: descr, priority, department,
      app: CFG.app, assignee_id: assigneeId, assignee_name: assigneeName, assignee_email: assigneeEmail,
    }).then(function(result) {
      saveEmail(email); mineEmail = email; mineEmailEl.value = email; mineLoaded = false;
      form.querySelector('[name=title]').value = '';
      form.querySelector('[name=description]').value = '';
      if (assigneeEl) { assigneeEl.value = ''; }
      var successMsg = '✓ Ticket ' + result.code + ' submitted!';
      if (assigneeName) successMsg += ' Assigned to ' + assigneeName + '.';
      msgEl.textContent = successMsg;
      msgEl.className = 'bbl-ok'; msgEl.style.display = 'block';
      refreshCounts(email);
    }).catch(function(err) {
      msgEl.textContent = '✗ ' + (err.message || 'Submission failed. Please try again.');
      msgEl.className = 'bbl-fail'; msgEl.style.display = 'block';
    }).finally(function() {
      submitBtn.disabled = false; submitBtn.textContent = 'Submit Ticket';
    });
  }

  function init() {
    var styleEl = document.createElement('style');
    styleEl.id = 'bbl-styles'; styleEl.textContent = CSS;
    document.head.appendChild(styleEl);

    var wrap = document.createElement('div');
    wrap.id = 'bbl-wrap';
    var deptHtml = CFG.departments.map(function(d){ return '<option value="' + esc(d) + '">' + esc(d) + '</option>'; }).join('');
    wrap.innerHTML = [
      '<button id="bbl-btn" title="Support">',
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"',
            ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
          '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
        '</svg>',
        '<span id="bbl-badge"></span>',
      '</button>',
      '<div id="bbl-panel">',
        '<div id="bbl-hdr">',
          '<span id="bbl-hdr-title">', esc(CFG.app), ' Support</span>',
          '<button id="bbl-close" title="Close">&times;</button>',
        '</div>',
        '<div id="bbl-tabs">',
          '<button class="bbl-tab bbl-active" data-tab="new">New Ticket</button>',
          '<button class="bbl-tab" data-tab="mine">My Tickets<span id="bbl-mine-badge"></span></button>',
          '<button class="bbl-tab" data-tab="assigned">Assigned<span id="bbl-assigned-badge"></span></button>',
          CFG.staffEmail ? '<button class="bbl-tab" data-tab="inbox">Inbox<span id="bbl-inbox-badge"></span></button>' : '',
        '</div>',
        '<div id="bbl-body">',

          '<div id="bbl-pane-new" class="bbl-pane bbl-active">',
            '<form id="bbl-form" novalidate>',

              '<div class="bbl-field">',
                '<label class="bbl-label">Email *</label>',
                '<input class="bbl-input" type="email" name="email" placeholder="you@company.com" required autocomplete="email">',
              '</div>',

              '<div class="bbl-field">',
                '<label class="bbl-label">Department *</label>',
                '<select class="bbl-input" name="department" required>',
                  '<option value="">Select department…</option>',
                  deptHtml,
                '</select>',
              '</div>',

              '<div class="bbl-field" id="bbl-assignee-field" style="display:none">',
                '<label class="bbl-label">Assign To</label>',
                '<select class="bbl-input" name="assignee">',
                  '<option value="">Unassigned</option>',
                '</select>',
              '</div>',

              '<div class="bbl-field">',
                '<label class="bbl-label">Title *</label>',
                '<input class="bbl-input" type="text" name="title" placeholder="Brief summary of the issue" required>',
              '</div>',

              '<div class="bbl-field">',
                '<label class="bbl-label">Description *</label>',
                '<textarea class="bbl-input" name="description" rows="4" placeholder="Describe the issue in detail…" required></textarea>',
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

          '<div id="bbl-pane-mine" class="bbl-pane">',
            '<div id="bbl-mine-prompt">',
              '<p id="bbl-mine-hint">Enter your email to see your tickets</p>',
              '<input class="bbl-input" type="email" id="bbl-mine-email" placeholder="you@company.com" autocomplete="email">',
              '<button type="button" id="bbl-mine-go">Load My Tickets</button>',
            '</div>',
            '<div id="bbl-ticket-list"></div>',
          '</div>',

          '<div id="bbl-pane-assigned" class="bbl-pane">',
            '<div id="bbl-assigned-prompt">',
              '<p style="font-size:13px;color:#64748b;margin:0 0 8px">Select your department and enter your name</p>',
              '<select class="bbl-input" id="bbl-assigned-dept" style="margin-bottom:8px">',
                '<option value="">Select department…</option>',
              '</select>',
              '<input class="bbl-input" type="text" id="bbl-assigned-name" placeholder="Your name (e.g. Kalpana)" autocomplete="name" style="margin-bottom:6px">',
              '<button type="button" id="bbl-assigned-go" style="width:100%;padding:8px;background:#f1f5f9;color:#8b5cf6;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;margin-top:2px">Load Department Tickets</button>',
            '</div>',
            '<div id="bbl-assigned-list"></div>',
          '</div>',

          CFG.staffEmail ? [
            '<div id="bbl-pane-inbox" class="bbl-pane">',
              '<div id="bbl-inbox-list">',
                '<div class="bbl-loading"><div class="bbl-spinner"></div>Loading inbox…</div>',
              '</div>',
            '</div>',
          ].join('') : '',

        '</div>',
      '</div>',
    ].join('');

    document.body.appendChild(wrap);

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
    if (CFG.staffEmail) {
      inboxBadge = document.getElementById('bbl-inbox-badge');
      paneInbox  = document.getElementById('bbl-pane-inbox');
      inboxList  = document.getElementById('bbl-inbox-list');
    }
    assignedBadge  = document.getElementById('bbl-assigned-badge');
    paneAssigned   = document.getElementById('bbl-pane-assigned');
    assignedList   = document.getElementById('bbl-assigned-list');
    assignedPrompt = document.getElementById('bbl-assigned-prompt');
    assignedNameEl = document.getElementById('bbl-assigned-name');
    assignedDeptEl = document.getElementById('bbl-assigned-dept');
    assignedGoBtn  = document.getElementById('bbl-assigned-go');

    var saved = getEmail();
    if (saved) {
      form.querySelector('[name=email]').value = saved;
      mineEmailEl.value = saved;
      mineEmail = saved;
    }

    btn.addEventListener('click', function(){ isOpen ? close() : open(); });
    closeBtn.addEventListener('click', close);
    tabs.forEach(function(t){ t.addEventListener('click', function(){ switchTab(t.dataset.tab); }); });
    form.addEventListener('submit', handleSubmit);

    mineGoBtn.addEventListener('click', function(){
      var e = mineEmailEl.value.trim();
      if (!e || !e.includes('@')) { mineEmailEl.classList.add('bbl-err'); return; }
      mineEmailEl.classList.remove('bbl-err');
      loadTickets(e);
    });
    mineEmailEl.addEventListener('keydown', function(e){ if (e.key === 'Enter') mineGoBtn.click(); });
    mineEmailEl.addEventListener('input', function(){ mineEmailEl.classList.remove('bbl-err'); });

    assignedGoBtn.addEventListener('click', function(){
      var dept = assignedDeptEl ? assignedDeptEl.value : '';
      var n = assignedNameEl ? assignedNameEl.value.trim() : '';
      if (!dept) { assignedDeptEl.classList.add('bbl-err'); return; }
      assignedDeptEl.classList.remove('bbl-err');
      loadAssigned(dept, n);
    });
    if (assignedDeptEl) assignedDeptEl.addEventListener('change', function(){ assignedDeptEl.classList.remove('bbl-err'); });
    if (assignedNameEl) assignedNameEl.addEventListener('keydown', function(e){ if (e.key === 'Enter') assignedGoBtn.click(); });

    ticketList.addEventListener('click', function(e) {
      var b = e.target.closest('.bbl-act');
      if (!b || b.disabled) return;
      updateTicketStatus(b.dataset.id, b.dataset.action, b, function() {
        mineLoaded = false;
        loadTickets(mineEmail);
      }, { email: mineEmail });
    });

    assignedList.addEventListener('click', function(e) {
      var b = e.target.closest('.bbl-act');
      if (!b || b.disabled) return;
      updateTicketStatus(b.dataset.id, b.dataset.action, b, function() {
        assignedLoaded = false;
        loadAssigned(assignedDept, assignedName);
      }, { actingDept: assignedDept, actingName: assignedName });
    });

    form.querySelector('[name=department]').addEventListener('change', function(){
      this.classList.remove('bbl-err');
      loadAssignees(this.value);
    });

    loadDepartments();
    if (CFG.staffEmail) { loadInbox(); setInterval(refreshInboxCounts, 30000); }
    if (saved) refreshCounts(saved);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();