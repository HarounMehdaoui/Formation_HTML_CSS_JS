const $ = s => document.querySelector(s);
const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const store = {
  get(k){ try { return JSON.parse(localStorage.getItem('exo-'+k)); } catch(e){ return null; } },
  set(k,v){ try { localStorage.setItem('exo-'+k, JSON.stringify(v)); } catch(e){} }
};
let cur, tab = 'html', code = {html:'', css:''}, hintsShown = 0, mine = null;
function solOff(){ mine = null; $('#bSol').classList.remove('on'); $('#bSol').textContent = 'Correction'; $('#solnote').hidden = true; $('#sol').classList.remove('on'); }

function hlHTML(s){
  let out = '', re = /(<!--[\s\S]*?-->)|(<\/?[a-zA-Z][\w-]*)|(\/?>)|("[^"]*"?)|([a-zA-Z-:]+)(?==)/g, last = 0, m, inTag = false;
  while ((m = re.exec(s))){
    out += esc(s.slice(last, m.index)); last = re.lastIndex;
    if (m[1]) out += '<span class="t-com">'+esc(m[1])+'</span>';
    else if (m[2]) { inTag = true; out += '<span class="t-tag">'+esc(m[2])+'</span>'; }
    else if (m[3]) { inTag = false; out += '<span class="t-tag">'+esc(m[3])+'</span>'; }
    else if (m[4]) out += inTag ? '<span class="t-str">'+esc(m[4])+'</span>' : esc(m[4]);
    else if (m[5]) out += inTag ? '<span class="t-attr">'+esc(m[5])+'</span>' : esc(m[5]);
  }
  return out + esc(s.slice(last));
}
function hlCSS(s){
  let out = '', i = 0, depth = 0, buf = '';
  const flush = cls => { if (buf) { out += cls ? '<span class="'+cls+'">'+esc(buf)+'</span>' : esc(buf); buf=''; } };
  while (i < s.length){
    if (s.startsWith('/*', i)){ flush(depth ? '' : 't-sel'); let j = s.indexOf('*/', i+2); j = j<0 ? s.length : j+2; out += '<span class="t-com">'+esc(s.slice(i,j))+'</span>'; i = j; continue; }
    const c = s[i];
    if (c === '{'){ flush('t-sel'); out += '<span class="t-punc">{</span>'; depth++; i++; continue; }
    if (c === '}'){ flush(''); out += '<span class="t-punc">}</span>'; depth = Math.max(0, depth-1); i++; continue; }
    if (depth && c === ':'){ flush('t-prop'); out += '<span class="t-punc">:</span>'; let j = i+1; while (j < s.length && !';}'.includes(s[j]) && !s.startsWith('/*', j)) j++; out += '<span class="t-val">'+esc(s.slice(i+1,j))+'</span>'; i = j; continue; }
    if (depth && c === ';'){ flush(''); out += '<span class="t-punc">;</span>'; i++; continue; }
    buf += c; i++;
  }
  flush(depth ? '' : 't-sel');
  return out;
}
function doc(c, zoom){
  const html = c.html.replace(/(["'])atelier\.jpg\1/g, '"' + IMG + '"');
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:16px;font-family:Arial,sans-serif}</style><style>' + c.css + '</style>' + (zoom ? '<style>html{zoom:' + zoom + '}</style>' : '') + '</head><body>' + html + '</body></html>';
}
function paint(){
  const v = $('#ta').value;
  $('#hl').innerHTML = (tab === 'html' ? hlHTML(v) : hlCSS(v)) + '\n';
  const lines = v.split('\n');
  const old = mine ? new Set(mine[tab].split('\n').map(l => l.trim())) : null;
  const chg = lines.map(l => !!old && l.trim() !== '' && !old.has(l.trim()));
  $('#gutter').innerHTML = lines.map((_, i) => chg[i] ? '<span>' + (i+1) + '</span>' : (i+1)).join('\n');
  $('#bands').innerHTML = lines.map((l, i) => chg[i] ? '<span>' + esc(l || ' ') + '</span>' : esc(l)).join('\n') + '\n';
}
function render(){ $('#pv').srcdoc = doc(code); $('#state').textContent = 'À jour'; }
$('#ta').addEventListener('scroll', () => { $('#hl').scrollTop = $('#bands').scrollTop = $('#ta').scrollTop; $('#hl').scrollLeft = $('#bands').scrollLeft = $('#ta').scrollLeft; $('#gutter').scrollTop = $('#ta').scrollTop; });
$('#ta').addEventListener('input', () => { code[tab] = $('#ta').value; paint(); $('#state').textContent = '…'; clearTimeout(window._r); window._r = setTimeout(render, 250); store.set(cur.id, code); });
$('#ta').addEventListener('keydown', e => {
  const ta = e.target;
  if (e.key === 'Tab'){ e.preventDefault(); const a = ta.selectionStart; ta.value = ta.value.slice(0,a) + '  ' + ta.value.slice(ta.selectionEnd); ta.selectionStart = ta.selectionEnd = a+2; ta.dispatchEvent(new Event('input')); }
  if (e.key === 'Enter'){ e.preventDefault(); const a = ta.selectionStart; const line = ta.value.slice(0,a).split('\n').pop(); let ind = (line.match(/^\s*/)||[''])[0]; if (/[{>]\s*$/.test(line) && !/<\/[^>]*>\s*$/.test(line) && !/<(img|br|hr|input)\b[^>]*>\s*$/i.test(line)) ind += '  '; const ins = '\n' + ind; ta.value = ta.value.slice(0,a) + ins + ta.value.slice(ta.selectionEnd); ta.selectionStart = ta.selectionEnd = a + ins.length; ta.dispatchEvent(new Event('input')); }
});
$('#copy').onclick = async () => { try { await navigator.clipboard.writeText(code[tab]); $('#copy').textContent = 'Copié'; } catch(e){ $('#ta').select(); $('#copy').textContent = 'Ctrl+C'; } setTimeout(() => $('#copy').textContent = 'Copier', 1500); };
function setTab(t){ tab = t; document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t)); $('#ta').value = code[t]; $('#ta').scrollTop = 0; $('#ta').scrollLeft = 0; paint(); $('#ta').dispatchEvent(new Event('scroll')); if (mine) jumpChange(); }
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => setTab(b.dataset.tab));
function focusTodo(){
  const v = $('#ta').value, m = /\{\s*\n\s*\/\*/.exec(v); if (!m) return;
  const line = v.slice(0, m.index).split('\n').length;
  $('#ta').scrollTop = Math.max(0, line * 23 - 90); $('#ta').dispatchEvent(new Event('scroll'));
}
function twoStep(btn, label, fn){
  if (btn.dataset.armed){ delete btn.dataset.armed; btn.textContent = label; btn.classList.remove('warn'); fn(); return; }
  btn.dataset.armed = '1'; btn.textContent = 'Confirmer ?'; btn.classList.add('warn');
  clearTimeout(btn._t); btn._t = setTimeout(() => { delete btn.dataset.armed; btn.textContent = label; btn.classList.remove('warn'); }, 3000);
}
function hintLabel(){ const n = cur.hints.length; $('#bHint').textContent = hintsShown >= n ? 'Tous les indices affichés' : 'Indice (' + (hintsShown + 1) + '/' + n + ')'; $('#bHint').disabled = hintsShown >= n; }

$('#bHint').onclick = () => {
  if (hintsShown >= cur.hints.length) return;
  hintsShown++;
  $('#hints').innerHTML = cur.hints.slice(0, hintsShown).map((h, i) => '<p><b>Indice ' + (i+1) + '</b>' + h + '</p>').join('');
  hintLabel();
};
$('#bSol').onclick = () => {
  if (cur.kind !== 'code'){ const on = $('#sol').classList.toggle('on'); $('#bSol').classList.toggle('on', on); $('#bSol').textContent = on ? 'Masquer la correction' : 'Correction'; return; }
  if (mine){ code = mine; solOff(); }
  else { mine = {html: code.html, css: code.css}; code = {html: cur.sol.html, css: cur.sol.css}; $('#bSol').classList.add('on'); $('#bSol').textContent = 'Revenir à mon code'; $('#solnote').hidden = false; }
  store.set(cur.id, mine || code); setTab(tab); render(); jumpChange();
};
function jumpChange(){ const g = $('#gutter span'); if (!g) return; const n = +g.textContent; $('#ta').scrollTop = Math.max(0, (n - 3) * 23); $('#ta').dispatchEvent(new Event('scroll')); }
$('#bReset').onclick = e => twoStep(e.currentTarget, 'Réinitialiser', () => {
  hintsShown = 0; $('#hints').innerHTML = ''; hintLabel();
  solOff();
  if (cur.kind === 'code'){ code = {html: cur.start.html, css: cur.start.css}; store.set(cur.id, code); setTab(tab); focusTodo(); render(); }
});

function load(id){
  cur = EX.find(e => e.id === id); hintsShown = 0;
  try { history.replaceState(null, '', '#' + id); } catch(e){}
  $('#list').innerHTML = EX.map(e => '<li><button data-id="' + e.id + '"' + (e.id === id ? ' class="on"' : '') + '><span class="n">' + e.num + '</span><span><small>Exercice ' + e.num + ' · ' + e.time + '</small><span class="t">' + e.title + '</span></span></button></li>').join('');
  document.querySelectorAll('#list button').forEach(b => b.onclick = () => { load(b.dataset.id); $('#main').scrollTop = 0; });
  $('#label').textContent = 'Exercice ' + cur.num + ' · ' + cur.time;
  $('#title').textContent = cur.title;
  $('#intro').innerHTML = cur.intro;
  $('#client').innerHTML = cur.client ? '<p class="quote">' + cur.client + '</p>' : '';
  $('#steps').innerHTML = cur.steps.map(s => '<li><span>' + s + '</span></li>').join('');
  $('#hints').innerHTML = ''; hintLabel();
  solOff();
  if (cur.kind === 'code'){
    $('#goalbox').hidden = false; $('#goal').srcdoc = doc(cur.sol, 0.6);
    $('#work').hidden = false; $('#pg').hidden = true;
    code = store.get(cur.id) || {html: cur.start.html, css: cur.start.css};
    setTab(id === 'ex1' ? 'html' : 'css'); focusTodo(); render();
  } else {
    $('#goalbox').hidden = true;
    $('#sol').innerHTML = '<div class="sh"><span>Correction : dans le panneau Styles, sur l\'élément sélectionné</span></div><table>' + cur.solution_text.map(r => '<tr><td>' + r[0] + '</td><td>' + esc(r[1]) + '</td></tr>').join('') + '</table>';
    $('#work').hidden = true; $('#pg').hidden = false;
  }
}
const start = (location.hash || '').slice(1);
load(EX.some(e => e.id === start) ? start : EX[0].id);
