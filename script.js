/* =========================================================
   KODAROS FERRAMENTAS — Lógica das ferramentas (client-side)
   ========================================================= */

/* ---------- Helpers ---------- */
function brl(n){
  if(!isFinite(n)) return '–';
  return 'R$ ' + n.toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:2});
}
function num(n, d=1){
  if(!isFinite(n)) return '–';
  return n.toLocaleString('pt-BR',{minimumFractionDigits:0, maximumFractionDigits:d});
}
function pct(n){ return num(n,1) + '%'; }
function show(el){ document.getElementById(el).classList.add('show'); }
function val(id){ return document.getElementById(id).value; }
function numv(id){ return parseFloat(document.getElementById(id).value) || 0; }

/* ---------- Tabs + Deep linking ---------- */
function activateTab(id, pushHash){
  const btn = document.querySelector('.tab-btn[data-tab="'+id+'"]');
  const panel = document.getElementById(id);
  if(!btn || !panel) return;
  document.querySelectorAll('.tab-btn').forEach(function(b){
    const isActive = b === btn;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-selected', isActive ? 'true' : 'false');
    b.setAttribute('tabindex', isActive ? '0' : '-1');
  });
  document.querySelectorAll('.tab-panel').forEach(function(p){
    const isActive = p === panel;
    p.classList.toggle('active', isActive);
    if(isActive) p.removeAttribute('hidden');
    else p.setAttribute('hidden','');
  });
  if(pushHash){
    const toolHash = location.hash.includes('/') ? location.hash.split('/')[1] : '';
    const newHash = toolHash ? id + '/' + toolHash : id;
    if(location.hash.slice(1) !== newHash) history.pushState(null,'','#'+newHash);
  }
}
document.querySelectorAll('.tab-btn').forEach(function(btn){
  btn.addEventListener('click', function(){
    activateTab(btn.dataset.tab, true);
  });
  btn.addEventListener('keydown', function(e){
    if(e.key==='ArrowRight' || e.key==='ArrowLeft'){
      e.preventDefault();
      const all=[...document.querySelectorAll('.tab-btn')];
      const idx=all.indexOf(btn);
      const next = e.key==='ArrowRight' ? (idx+1)%all.length : (idx-1+all.length)%all.length;
      all[next].focus(); activateTab(all[next].dataset.tab, true);
    }
  });
});
// init from hash
(function initHash(){
  const raw = location.hash.slice(1).split('/')[0];
  const valid = ['aquisicao','lancamento','financeiro','vendas','suporte','operacao','conteudo'];
  const target = valid.includes(raw) ? raw : 'aquisicao';
  activateTab(target, false);
  // ensure correct initial aria
  document.querySelectorAll('.tab-panel').forEach(function(p){
    if(!p.classList.contains('active')) p.setAttribute('hidden','');
  });
})();
window.addEventListener('hashchange', function(){
  const raw = location.hash.slice(1).split('/')[0];
  if(raw) activateTab(raw, false);
  // scroll to tool if second part
  const parts = location.hash.slice(1).split('/');
  if(parts[1]){
    const el = document.getElementById(parts[1]);
    if(el) setTimeout(function(){ el.scrollIntoView({behavior:'smooth', block:'start'}); }, 250);
  }
});

/* ---------- Busca + Deep link por ferramenta ---------- */
(function initToolAnchorsAndSearch(){
  function slugify(s){
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40);
  }
  const tools = document.querySelectorAll('.tool');
  const seen = {};
  tools.forEach(function(tool){
    const h3 = tool.querySelector('h3');
    if(!h3) return;
    let base = 'tool-' + slugify(h3.textContent);
    let id = base;
    let n=1;
    while(document.getElementById(id) || seen[id]){ id = base + '-' + (++n); }
    seen[id]=true;
    tool.id = id;
    tool.style.position='relative';
    // anchor for offset
    const anc = document.createElement('span');
    anc.id = id + '-anc';
    anc.className='tool-anchor';
    anc.setAttribute('aria-hidden','true');
    tool.prepend(anc);
    // actions row if not exists at bottom
    if(!tool.querySelector('.tool-actions')){
      const actions = document.createElement('div');
      actions.className='tool-actions';
      const linkBtn = document.createElement('button');
      linkBtn.className='btn btn-ghost btn-sm';
      linkBtn.type='button';
      linkBtn.textContent='Copiar link';
      linkBtn.setAttribute('aria-label','Copiar link desta ferramenta');
      linkBtn.addEventListener('click', function(){ copyToolLink(id, linkBtn); });
      const waBtn = document.createElement('a');
      waBtn.className='btn btn-ghost btn-sm';
      waBtn.textContent='WhatsApp';
      waBtn.target='_blank';
      waBtn.rel='noopener';
      waBtn.setAttribute('aria-label','Compartilhar no WhatsApp');
      waBtn.href='#';
      waBtn.addEventListener('click', function(e){
        e.preventDefault();
        const tab = tool.closest('.tab-panel')?.id || 'aquisicao';
        const url = location.origin + location.pathname + '#' + tab + '/' + id;
        const text = encodeURIComponent(h3.textContent + ' — Ferramentas KODAROS ' + url);
        window.open('https://wa.me/?text=' + text, '_blank');
        trackEvent('share_whatsapp', {tool: id});
      });
      linkBtn.addEventListener('click', function(){ trackEvent('copy_link', {tool: id}); });
      actions.appendChild(linkBtn);
      actions.appendChild(waBtn);
      // export button (only if tool has result)
      if(tool.querySelector('.result')){
        const expBtn=document.createElement('button');
        expBtn.className='btn btn-ghost btn-sm';
        expBtn.type='button';
        expBtn.textContent='Exportar';
        expBtn.setAttribute('aria-label','Exportar resultado');
        expBtn.addEventListener('click', function(){ exportToolResult(id, expBtn); });
        actions.appendChild(expBtn);
      }
      tool.appendChild(actions);
    }
  });
  // handle initial tool hash
  const partsInit = location.hash.slice(1).split('/');
  if(partsInit[1]){
    const el = document.getElementById(partsInit[1]);
    if(el) setTimeout(function(){ el.scrollIntoView({behavior:'smooth', block:'start'}); }, 300);
  }
  // search
  const input = document.getElementById('toolsSearch');
  const meta = document.getElementById('searchMeta');
  if(!input) return;
  input.addEventListener('input', function(){
    const q = input.value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    let total=0, shown=0;
    tools.forEach(function(tool){
      total++;
      const txt = (tool.querySelector('h3')?.textContent + ' ' + (tool.querySelector('.tool-desc')?.textContent||'') + ' ' + (tool.querySelector('.tool-ebook')?.textContent||'')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      const match = !q || txt.includes(q);
      tool.classList.toggle('hidden-by-search', !match);
      if(match) shown++;
      // if searching, ensure parent tab is visible if any match inside
      if(match && q){
        const panel = tool.closest('.tab-panel');
        if(panel && !panel.classList.contains('active')){
          // don't auto-switch tab, just count; but highlight tab with badge
        }
      }
    });
    if(meta){
      if(!q) meta.textContent='';
      else meta.textContent = shown + ' de ' + total + ' ferramentas';
    }
    // if searching, show all panels to reveal matches; otherwise restore active tab only
    if(q){
      document.querySelectorAll('.tab-panel').forEach(function(p){
        p.classList.add('active');
        p.removeAttribute('hidden');
      });
    } else {
      // restore hash tab
      const raw = location.hash.slice(1).split('/')[0] || 'aquisicao';
      activateTab(raw, false);
    }
  });
})();
function copyToolLink(toolId, btn){
  const panel = document.getElementById(toolId)?.closest('.tab-panel');
  const tab = panel ? panel.id : 'aquisicao';
  const url = location.origin + location.pathname + '#' + tab + '/' + toolId;
  const trigger = btn;
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(function(){
      const orig = trigger.textContent;
      trigger.textContent='Link copiado!';
      setTimeout(function(){ trigger.textContent=orig; }, 1500);
    });
  } else {
    fallbackCopy(url, function(){
      const orig = trigger.textContent;
      trigger.textContent='Link copiado!';
      setTimeout(function(){ trigger.textContent=orig; }, 1500);
    });
  }
  history.pushState(null,'','#'+tab+'/'+toolId);
}
function trackEvent(name, props){
  try{
    const key='kodaros_events';
    const arr=JSON.parse(localStorage.getItem(key)||'[]');
    arr.push({name, props, ts: Date.now(), url: location.href});
    if(arr.length>200) arr.splice(0, arr.length-200);
    localStorage.setItem(key, JSON.stringify(arr));
    // Plausible / Umami hook if present
    if(window.plausible) window.plausible(name, {props});
  } catch(e){}
}
function exportToolResult(toolId, btn){
  const tool=document.getElementById(toolId);
  if(!tool) return;
  const h3=tool.querySelector('h3')?.textContent?.trim() || toolId;
  const resultEl=tool.querySelector('.result');
  if(!resultEl || !resultEl.classList.contains('show')){
    alert('Calcule primeiro para exportar.');
    return;
  }
  // collect visible result texts
  let lines=[h3,'', '— Ferramentas KODAROS —', ''];
  tool.querySelectorAll('.result .res').forEach(function(r){
    const v=r.querySelector('.v')?.textContent?.trim();
    const l=r.querySelector('.l')?.textContent?.trim();
    if(v && l) lines.push(l + ': ' + v);
  });
  tool.querySelectorAll('.result .answer-box').forEach(function(a){
    if(a.textContent.trim()) lines.push('', a.textContent.trim());
  });
  tool.querySelectorAll('.result table.tbl').forEach(function(tbl){
    lines.push('');
    const heads=[...tbl.querySelectorAll('thead th')].map(th=>th.textContent.trim()).join(' | ');
    if(heads) lines.push(heads);
    [...tbl.querySelectorAll('tbody tr')].forEach(tr=>{
      const row=[...tr.querySelectorAll('td')].map(td=>td.textContent.trim()).join(' | ');
      lines.push(row);
    });
  });
  lines.push('', location.origin + location.pathname + '#' + (tool.closest('.tab-panel')?.id||'') + '/' + toolId);
  // try PNG via canvas, fallback to TXT
  try{
    const c=document.createElement('canvas');
    const W=900, H= 220 + lines.length*26;
    c.width=W; c.height=Math.min(H, 1800);
    const x=c.getContext('2d');
    x.fillStyle='#0B0F1A'; x.fillRect(0,0,W,c.height);
    x.strokeStyle='rgba(255,255,255,0.08)'; x.strokeRect(16,16,W-32,c.height-32);
    x.fillStyle='#E6E8EE'; x.font='700 22px Figtree, Arial, sans-serif';
    x.fillText(h3, 32, 48);
    x.fillStyle='#9AA3B8'; x.font='500 13px Figtree, Arial, sans-serif';
    x.fillText('KODAROS • kodarosferramentas', 32, 70);
    x.fillStyle='#E6E8EE'; x.font='400 15px Figtree, Arial, sans-serif';
    let y=110;
    x.textBaseline='top';
    // wrap long lines
    lines.slice(3).forEach(function(line){
      if(!line){ y+=10; return; }
      // simple wrap at 85 chars
      const maxChars=78;
      if(line.length>maxChars){
        const words=line.split(' ');
        let cur='';
        words.forEach(function(w){
          const test=cur?cur+' '+w:w;
          if(test.length>maxChars){ x.fillText(cur,32,y); y+=20; cur=w; } else cur=test;
        });
        if(cur){ x.fillText(cur,32,y); y+=20; }
      } else { x.fillText(line,32,y); y+=20; }
      if(y>c.height-30) return;
    });
    const url=c.toDataURL('image/png');
    const a=document.createElement('a');
    a.download='kodaros-'+toolId+'.png';
    a.href=url; a.click();
    const orig=btn.textContent; btn.textContent='PNG baixado!'; setTimeout(function(){ btn.textContent=orig; }, 1500);
    trackEvent('export_png', {tool: toolId});
  } catch(e){
    // fallback TXT
    const blob=new Blob([lines.join('\n')], {type:'text/plain;charset=utf-8'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download='kodaros-'+toolId+'.txt'; a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
    trackEvent('export_txt', {tool: toolId});
  }
}

/* ---------- Recolher abas (removido — botão recolher não é mais necessário) ---------- */
(function(){
  const tabsEl = document.getElementById('tabs');
  if (!tabsEl) return;
  tabsEl.classList.remove('collapsed');
})();

/* ---------- Auto-cálculo + Validação + Persistência ---------- */
(function initAutoCalcAndPersist(){
  // harden number inputs
  document.querySelectorAll('.tool input[type="number"]').forEach(function(el){
    if(!el.hasAttribute('min')) el.setAttribute('min','0');
    if(!el.hasAttribute('step')) el.setAttribute('step','any');
    if(!el.hasAttribute('inputmode')) el.setAttribute('inputmode','decimal');
  });
  const STORAGE_KEY='kodaros_tools_v1';
  let store={};
  try{ store = JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'); } catch(e){ store={}; }
  function saveStore(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch(e){} }

  // restaura valores
  document.querySelectorAll('.tool input, .tool textarea, .tool select').forEach(function(el){
    if(!el.id) return;
    if(store[el.id] !== undefined){
      el.value = store[el.id];
    }
    el.addEventListener('input', function(){
      store[el.id]=el.value;
      saveStore();
      validateField(el);
    });
    el.addEventListener('change', function(){
      store[el.id]=el.value;
      saveStore();
    });
  });
  // checkboxes
  document.querySelectorAll('.tool input[type=checkbox]').forEach(function(el){
    if(!el.id) return;
    if(store[el.id] !== undefined) el.checked = store[el.id]==='true' || store[el.id]===true;
    el.addEventListener('change', function(){ store[el.id]=el.checked; saveStore(); });
  });

  function validateField(el){
    const v = el.value.trim();
    const field = el.closest('.field');
    if(!field) return true;
    // skip file inputs and empty optional text
    if(el.type==='file' || el.type==='checkbox') return true;
    if(el.type==='number'){
      const n = parseFloat(v);
      if(v!=='' && (!isFinite(n) || n < 0)){
        field.classList.add('has-error');
        let err = field.querySelector('.field-error');
        if(!err){ err=document.createElement('div'); err.className='field-error'; field.appendChild(err); }
        err.textContent = n < 0 ? 'Valor não pode ser negativo.' : 'Valor inválido.';
        return false;
      } else {
        field.classList.remove('has-error');
        const err = field.querySelector('.field-error');
        if(err) err.remove();
        return true;
      }
    }
    return true;
  }

  // debounce auto-calc
  const toolMap = [
    {ids:['c1_gasto','c1_cli','c1_ticket','c1_freq','c1_ret','c1_marg'], fn:'calcCAC'},
    {ids:['c2_cac','c2_ticket','c2_marg','c2_orc','c2_cresc','c2_sem'], fn:'calcEscala'},
    {ids:['c3_vis','c3_t1','c3_t2','c3_t3','c3_t4','c3_nomes'], fn:'calcFunil'},
    {ids:['r_inv','r_rec'], fn:'calcROAS'},
    {ids:['be_custo','be_ticket','be_cv'], fn:'calcBreakEven'},
    {ids:['m_imp','m_custo','m_cli','m_conv','m_lead'], fn:'calcMetrica'},
    {ids:['o_total','o_fb','o_gg','o_tk'], fn:'calcOrcamento'},
    {ids:['cpl_ticket','cpl_marg','cpl_conv'], fn:'calcCPL'},
    {ids:['ab_ctra','ab_ctrb','ab_imp'], fn:'simAB'},
    {ids:['cr_ini','cr_pre','cr_abre','cr_pico','cr_fecha'], fn:'calcCronograma'},
    {ids:['sr_leads','sr_conv','sr_preco'], fn:'calcReceita'},
    {ids:['of_preco','of_desc','of_parc','of_juros'], fn:'calcOferta'},
    {ids:['pr_custo','pr_fixo','pr_marg','pr_imp'], fn:'calcPrecificacao'},
    {ids:['ml_preco','ml_custo'], fn:'calcMargem'},
    {ids:['fc_ini','fc_ent','fc_sai','fc_mes'], fn:'calcFluxo'},
    {ids:['cg_custo','cg_est','cg_rec','cg_pag'], fn:'calcCapitalGiro'},
    {ids:['mt_meta','mt_ticket','mt_conv','mt_dias'], fn:'calcMetas'},
    {ids:['sd_preco','sd_desc','sd_custo','sd_vol'], fn:'calcDesconto'},
    {ids:['tm_meta','tm_cli'], fn:'calcTicket'},
    {ids:['n_prom','n_pass','n_det','n_total','n_rec'], fn:'calcNPS'},
    {ids:['s_vol','s_at','s_tmp','s_horas'], fn:'calcSLA'},
    {ids:['vr_cli','vr_ticket','vr_tx'], fn:'calcValorRec'},
    {ids:['pe_fixo','pe_preco','pe_cv'], fn:'calcEquilibrio'},
    {ids:['jc_aporte','jc_taxa','jc_mes'], fn:'calcJuros'},
    {ids:['pl_lucro','pl_pl'], fn:'calcProLabore'},
    {ids:['fv_lead','fv_prop','fv_fecha'], fn:'calcFunilVendas'},
    {ids:['fu_lead','fu_tx','fu_tent'], fn:'calcFollow'},
    {ids:['ce_sem','ce_semanas'], fn:'calcCalendario'},
    {ids:['rc_inv','rc_leads','rc_conv','rc_ticket'], fn:'calcROIConteudo'},
    {ids:['hf_meta','hf_horas','hf_marg'], fn:'calcHoraFat'},
    {ids:['ma_meta','ma_mes'], fn:'calcMetasAn'},
    {ids:['cpe_inv','cpe_ins'], fn:'calcCPE'}
  ];
  const debounceMap={};
  function debounce(fn, wait){ let t; return function(){ clearTimeout(t); t=setTimeout(fn, wait); }; }
  toolMap.forEach(function(entry){
    const handler = debounce(function(){
      // validate all fields first
      let ok=true;
      entry.ids.forEach(function(id){
        const el=document.getElementById(id);
        if(el && !validateField(el)) ok=false;
      });
      if(!ok) return;
      try{ window[entry.fn](); } catch(e){}
    }, 700);
    entry.ids.forEach(function(id){
      const el=document.getElementById(id);
      if(el) el.addEventListener('input', handler);
    });
  });
  // add reset per tool
  document.querySelectorAll('.tool').forEach(function(tool){
    const btnRow = tool.querySelector('.tool-actions');
    if(!btnRow) return;
    const resetBtn=document.createElement('button');
    resetBtn.className='btn btn-ghost btn-sm';
    resetBtn.type='button';
    resetBtn.textContent='Limpar';
    resetBtn.addEventListener('click', function(){
      tool.querySelectorAll('input, textarea, select').forEach(function(el){
        if(el.type==='checkbox') el.checked=false;
        else if(el.type!=='file') el.value='';
        if(el.id) delete store[el.id];
      });
      saveStore();
      const res=tool.querySelector('.result');
      if(res) res.classList.remove('show');
      tool.querySelectorAll('.field.has-error').forEach(function(f){ f.classList.remove('has-error'); });
    });
    btnRow.appendChild(resetBtn);
  });
})();

/* ---------- Helpers de segurança ---------- */
function escapeHTML(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* ---------- Copiar ---------- */
function copyText(id, trigger){
  const el = document.getElementById(id);
  if(!el) return;
  const isInput = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA';
  const text = isInput ? el.value : (el.innerText || el.textContent || '');
  const btn = trigger || (typeof event !== 'undefined' ? event.target : null);
  const orig = btn ? btn.textContent : '';
  function done(){
    if(btn){
      btn.textContent = 'Copiado!';
      setTimeout(function(){ btn.textContent = orig.includes('Copiar') ? orig : 'Copiar'; }, 1500);
    }
  }
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done).catch(function(){
      fallbackCopy(text, done);
    });
  } else {
    fallbackCopy(text, done);
  }
}
function fallbackCopy(text, cb){
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly','');
  ta.style.position='fixed'; ta.style.opacity='0';
  document.body.appendChild(ta);
  ta.select();
  try{ document.execCommand('copy'); } catch(e){}
  document.body.removeChild(ta);
  if(cb) cb();
}

/* =========================================================
   TAB 1 — AQUISIÇÃO & TRÁFEGO
   ========================================================= */

/* 1. CAC & LTV (portado) */
function calcCAC(){
  const gasto=numv('c1_gasto'), cli=numv('c1_cli'), ticket=numv('c1_ticket'),
        freq=numv('c1_freq'), ret=numv('c1_ret'), marg=numv('c1_marg')/100;
  if(!cli){ alert('Informe o número de clientes adquiridos.'); return; }
  const cac=gasto/cli;
  const ltv=ticket*freq*(ret/12);
  const ratio=ltv/cac;
  const lucroMensal=(ticket*freq/12)*marg;
  const pay=cac/lucroMensal;
  document.getElementById('c1_cac').textContent=num(cac);
  document.getElementById('c1_ltv').textContent=num(ltv);
  document.getElementById('c1_ratio').textContent=num(ratio,1)+':1';
  document.getElementById('c1_pay').textContent=num(pay);
  const box=document.getElementById('c1_ratio_box');
  box.className='res '+(ratio>=3?'good':(ratio<1?'bad':''));
  show('c1_res');
}

/* 2. Projetor de Escala (portado) */
function calcEscala(){
  const cac=numv('c2_cac'), ticket=numv('c2_ticket'), marg=numv('c2_marg')/100,
        orc0=numv('c2_orc'), cresc=numv('c2_cresc')/100, sem=Math.max(1,Math.round(numv('c2_sem')));
  let orc=orc0, tCli=0, tRec=0, tGasto=0, tLuc=0;
  const tb=document.querySelector('#c2_tbl tbody'); tb.innerHTML='';
  for(let i=1;i<=sem;i++){
    const clientes=orc/cac;
    const receita=clientes*ticket;
    const lucro=receita*marg;
    tCli+=clientes; tRec+=receita; tGasto+=orc; tLuc+=lucro;
    const tr=document.createElement('tr');
    const tds=[''+i, brl(orc), num(clientes), brl(receita), brl(lucro)];
    tds.forEach((v,idx)=>{
      const td=document.createElement('td');
      td.textContent=v;
      if(idx===0) td.style.textAlign='left';
      tr.appendChild(td);
    });
    tb.appendChild(tr);
    orc*=(1+cresc);
  }
  document.getElementById('c2_tcli').textContent=num(tCli);
  document.getElementById('c2_trec').textContent=brl(tRec);
  document.getElementById('c2_tluc').textContent=brl(tLuc);
  document.getElementById('c2_tgasto').textContent=brl(tGasto);
  show('c2_res');
}

/* 3. Auditor de Funil (portado) */
function calcFunil(){
  const vis=numv('c3_vis');
  const taxas=[numv('c3_t1')/100,numv('c3_t2')/100,numv('c3_t3')/100,numv('c3_t4')/100];
  const nomes=(val('c3_nomes').split(',').map(s=>s.trim())).concat(['Venda']);
  let entraram=vis, menor=1, gargaloIdx=0;
  const tb=document.querySelector('#c3_tbl tbody'); tb.innerHTML='';
  for(let i=0;i<taxas.length;i++){
    const conv=taxas[i];
    const sairam=entraram*(1-conv);
    const tr=document.createElement('tr');
    const label = (nomes[i]||('Etapa '+(i+1))) + ' → ' + (nomes[i+1]||'Venda');
    [label, num(entraram), pct(conv*100), num(sairam)].forEach((v,idx)=>{
      const td=document.createElement('td');
      td.textContent=v;
      if(idx===0) td.style.textAlign='left';
      else td.style.textAlign='right';
      tr.appendChild(td);
    });
    tb.appendChild(tr);
    if(conv<menor){ menor=conv; gargaloIdx=i; }
    entraram=entraram*conv;
  }
  if(tb.children[gargaloIdx]) tb.children[gargaloIdx].classList.add('gargalo');
  const trf=document.createElement('tr');
  trf.className='total';
  ['Vendas totais', num(entraram), '–', '–'].forEach((v,idx)=>{
    const td=document.createElement('td'); td.textContent=v;
    td.style.textAlign = idx===0 ? 'left' : 'right';
    trf.appendChild(td);
  });
  tb.appendChild(trf);
  show('c3_res');
}

/* 4. ROI / ROAS */
function calcROAS(){
  const inv=numv('r_inv'), rec=numv('r_rec');
  if(!inv){ alert('Informe o investimento.'); return; }
  const roas=rec/inv;
  const roi=(rec-inv)/inv*100;
  const lucro=rec-inv;
  document.getElementById('r_roas').textContent=num(roas,2)+'x';
  document.getElementById('r_roi').textContent=(roi>=0?'+':'')+pct(roi);
  document.getElementById('r_lucro').textContent=brl(lucro);
  const box=document.getElementById('r_roi_box');
  box.className='res '+(roi>=0?'good':(roi<0?'bad':''));
  show('r_res');
}

/* 5. Break-even */
function calcBreakEven(){
  const custo=numv('be_custo'), ticket=numv('be_ticket'), cv=numv('be_cv');
  const mc=ticket-cv;
  if(mc<=0){ alert('O ticket deve ser maior que o custo variável para haver margem.'); return; }
  const cli=custo/mc;
  const rec=cli*ticket;
  const beRoas=ticket/mc;
  document.getElementById('be_mc').textContent=brl(mc);
  document.getElementById('be_cli').textContent=num(cli);
  document.getElementById('be_rec').textContent=brl(rec);
  document.getElementById('be_roas').textContent=num(beRoas,2)+'x';
  document.getElementById('be_box').className='res '+(cli<=50?'good':'');
  show('be_res');
}

/* 6. Conversor de Métricas */
function calcMetrica(){
  const imp=numv('m_imp'), custo=numv('m_custo'), cli=numv('m_cli'),
        conv=numv('m_conv'), lead=numv('m_lead');
  document.getElementById('m_cpm').textContent=imp?brl(custo/imp*1000):'–';
  document.getElementById('m_cpc').textContent=cli?brl(custo/cli):'–';
  document.getElementById('m_ctr').textContent=imp?pct(cli/imp*100):'–';
  document.getElementById('m_cpa').textContent=conv?brl(custo/conv):'–';
  document.getElementById('m_cpl').textContent=lead?brl(custo/lead):'–';
  show('m_res');
}

/* 7. Planejador de Orçamento */
function calcOrcamento(){
  const total=numv('o_total');
  const fb=numv('o_fb'), gg=numv('o_gg'), tk=numv('o_tk');
  const soma=fb+gg+tk;
  const f=fb/(soma||1), g=gg/(soma||1), t=tk/(soma||1);
  document.getElementById('o_fbv').textContent=brl(total*f);
  document.getElementById('o_ggv').textContent=brl(total*g);
  document.getElementById('o_tkv').textContent=brl(total*t);
  document.getElementById('o_soma').textContent=pct(soma);
  show('o_res');
}

/* 8. UTM Builder */
function buildUTM(){
  let url=(val('u_url')||'').trim();
  if(!url){ alert('Informe a URL base.'); return; }
  try{ new URL(url); } catch(e){ alert('URL base inválida. Use https://...'); return; }
  const params={};
  const map={'u_source':'utm_source','u_medium':'utm_medium','u_camp':'utm_campaign','u_term':'utm_term','u_cont':'utm_content'};
  for(const k in map){ const v=(document.getElementById(k).value||'').trim(); if(v) params[map[k]]=v; }
  const keys=Object.keys(params);
  if(keys.length===0){ alert('Preencha ao menos um parâmetro UTM.'); return; }
  const qs=keys.map(k=>k+'='+encodeURIComponent(params[k])).join('&');
  let out=url;
  out += url.indexOf('?')>=0 ? (url.endsWith('?')||url.endsWith('&') ? '' : '&') : '?';
  out += qs;
  document.getElementById('u_out').value=out;
  show('u_res');
}

/* 9. Auditor CRO */
const CRO_ITEMS=[
  'Título principal com benefício claro',
  'Chamada para ação (CTA) visível acima da dobra',
  'Prova social (depoimentos/avaliações)',
  'Oferta ou garantia destacada',
  'Formulário curto (poucos campos)',
  'Carregamento rápido (<3s)',
  'Responsiva em mobile',
  'Urgência ou escassez legítima',
  'Texto focado em benefícios (não só características)',
  'Pixel de rastreamento/configurado'
];
(function(){
  const box=document.getElementById('cro_list');
  box.innerHTML=CRO_ITEMS.map((t,i)=>
    `<div class="check-item"><input type="checkbox" id="cro_${i}"><label for="cro_${i}">${t}</label></div>`).join('');
})();
function calcCRO(){
  let ok=0;
  for(let i=0;i<CRO_ITEMS.length;i++){ if(document.getElementById('cro_'+i).checked) ok++; }
  const score=Math.round(ok/CRO_ITEMS.length*100);
  document.getElementById('cro_score').textContent=score;
  document.getElementById('cro_chk').textContent=ok+'/'+CRO_ITEMS.length;
  document.getElementById('cro_bar').style.width=score+'%';
  let msg, cls;
  if(score>=80){ msg='Excelente! Sua página tem os principais elementos de conversão.'; cls='good'; }
  else if(score>=50){ msg='Razoável. Há itens importantes a ajustar para subir a conversão.'; cls=''; }
  else { msg='Atenção: faltam elementos críticos de conversão na sua página.'; cls='bad'; }
  const box=document.getElementById('cro_box');
  box.className='res '+(score>=80?'good':(score<50?'bad':''));
  document.getElementById('cro_msg').textContent=msg;
  document.getElementById('cro_msg').className='tool-desc '+(cls?('badge-'+cls):'');
  show('cro_res');
}

/* =========================================================
   TAB 2 — LANÇAMENTO
   ========================================================= */

/* 1. Cronograma */
function fmtDate(d){ return d.toLocaleDateString('pt-BR'); }
function addDays(date, days){ const d=new Date(date); d.setDate(d.getDate()+days); return d; }
function calcCronograma(){
  const ini=val('cr_ini');
  if(!ini){ alert('Escolha a data de início.'); return; }
  let d=new Date(ini+'T00:00:00');
  const fases=[['Pré-lançamento',numv('cr_pre')],['Abertura',numv('cr_abre')],['Pico',numv('cr_pico')],['Fechamento',numv('cr_fecha')]];
  const tb=document.querySelector('#cr_tbl tbody'); tb.innerHTML='';
  fases.forEach(function(f){
    const inicio=d;
    const fim=addDays(d, f[1]);
    const tr=document.createElement('tr');
    [f[0], fmtDate(inicio), fmtDate(fim)].forEach((v,idx)=>{
      const td=document.createElement('td'); td.textContent=v;
      td.style.textAlign = idx===0 ? 'left' : 'right';
      tr.appendChild(td);
    });
    tb.appendChild(tr);
    d=fim;
  });
  show('cr_res');
}

/* 2. Simulador de Receita */
function calcReceita(){
  const leads=numv('sr_leads'), conv=numv('sr_conv')/100, preco=numv('sr_preco');
  const calc=(mult)=>{ const L=leads*mult; const vendas=L*conv; return vendas*preco; };
  document.getElementById('sr_pess').textContent=brl(calc(0.7));
  document.getElementById('sr_real').textContent=brl(calc(1));
  document.getElementById('sr_otim').textContent=brl(calc(1.3));
  show('sr_res');
}

/* 3. Calculadora de Oferta */
function calcOferta(){
  const preco=numv('of_preco'), desc=numv('of_desc')/100, parc=Math.max(1,Math.round(numv('of_parc'))), juros=numv('of_juros')/100;
  const promo=preco*(1-desc);
  const parcela=promo*Math.pow(1+juros,parc)/parc;
  const total=parcela*parc;
  document.getElementById('of_promo').textContent=brl(promo);
  document.getElementById('of_parc_v').textContent=brl(parcela);
  document.getElementById('of_total').textContent=brl(total);
  show('of_res');
}

/* =========================================================
   TAB 3 — FINANCEIRO
   ========================================================= */

/* 1. Precificação */
function calcPrecificacao(){
  const custo=numv('pr_custo'), fixo=numv('pr_fixo'), marg=numv('pr_marg')/100, imp=numv('pr_imp')/100;
  const denom=1-(marg+imp);
  if(denom<=0){ alert('Margem + impostos não podem chegar a 100%.'); return; }
  const preco=(custo+fixo)/denom;
  document.getElementById('pr_preco').textContent=brl(preco);
  document.getElementById('pr_lucro').textContent=brl(preco-custo-fixo);
  show('pr_res');
}

/* 2. Margem de Lucro */
function calcMargem(){
  const preco=numv('ml_preco'), custo=numv('ml_custo');
  if(!preco){ alert('Informe o preço de venda.'); return; }
  const m=(preco-custo)/preco*100;
  document.getElementById('ml_marg').textContent=pct(m);
  document.getElementById('ml_lucro').textContent=brl(preco-custo);
  document.getElementById('ml_box').className='res '+(m>=30?'good':(m<0?'bad':''));
  show('ml_res');
}

/* 3. Fluxo de Caixa */
function calcFluxo(){
  let saldo=numv('fc_ini'), ent=numv('fc_ent'), sai=numv('fc_sai');
  const meses=Math.max(1,Math.round(numv('fc_mes')));
  const tb=document.querySelector('#fc_tbl tbody'); tb.innerHTML='';
  for(let i=1;i<=meses;i++){
    saldo=saldo+ent-sai;
    const tr=document.createElement('tr');
    [String(i), brl(ent), brl(sai), brl(saldo)].forEach((v,idx)=>{
      const td=document.createElement('td'); td.textContent=v;
      td.style.textAlign = idx===0 ? 'left' : 'right';
      tr.appendChild(td);
    });
    if(saldo<0) tr.classList.add('gargalo');
    tb.appendChild(tr);
  }
  show('fc_res');
}

/* 4. Capital de Giro */
function calcCapitalGiro(){
  const custoM=numv('cg_custo'), est=numv('cg_est'), rec=numv('cg_rec'), pag=numv('cg_pag');
  const diario=custoM/30;
  const ciclo=est+rec-pag;
  document.getElementById('cg_val').textContent=brl(diario*ciclo);
  document.getElementById('cg_ciclo').textContent=num(ciclo)+' dias';
  show('cg_res');
}

/* =========================================================
   TAB 4 — VENDAS
   ========================================================= */

/* 1. Metas */
function calcMetas(){
  const meta=numv('mt_meta'), ticket=numv('mt_ticket'), conv=numv('mt_conv')/100, dias=numv('mt_dias');
  if(!ticket||!conv){ alert('Informe ticket médio e conversão.'); return; }
  const unid=meta/ticket;
  const vis=unid/conv;
  document.getElementById('mt_unid').textContent=num(unid);
  document.getElementById('mt_dia').textContent=num(unid/dias);
  document.getElementById('mt_vis').textContent=num(vis/dias);
  show('mt_res');
}

/* 2. Simulador de Desconto */
function calcDesconto(){
  const preco=numv('sd_preco'), desc=numv('sd_desc')/100, custo=numv('sd_custo'), vol=numv('sd_vol');
  const p2=preco*(1-desc);
  const lucro=(p2-custo)*vol;
  const maxDesc=(preco-custo)/preco*100;
  document.getElementById('sd_preco2').textContent=brl(p2);
  document.getElementById('sd_lucro').textContent=brl(lucro);
  document.getElementById('sd_max').textContent=pct(maxDesc);
  document.getElementById('sd_box').className='res '+(lucro>0?'good':(lucro<0?'bad':''));
  show('sd_res');
}

/* 3. Ticket Médio */
function calcTicket(){
  const meta=numv('tm_meta'), cli=numv('tm_cli');
  if(!cli){ alert('Informe o número de clientes.'); return; }
  document.getElementById('tm_ticket').textContent=brl(meta/cli);
  document.getElementById('tm_check').textContent='R$ '+num(meta);
  show('tm_res');
}

/* =========================================================
   TAB 5 — SUPORTE
   ========================================================= */

/* 1. NPS / Índice de Reclamações */
function calcNPS(){
  const prom=numv('n_prom'), pass=numv('n_pass'), det=numv('n_det');
  const totalResp=prom+pass+det;
  const nps=totalResp?((prom-det)/totalResp*100):0;
  const total=numv('n_total'), rec=numv('n_rec');
  const idx=total?(rec/total*100):0;
  document.getElementById('n_nps').textContent=Math.round(nps);
  document.getElementById('n_idx').textContent=pct(idx);
  document.getElementById('n_ppm').textContent=num(total?rec/total*1000:0);
  document.getElementById('n_box').className='res '+(nps>=50?'good':(nps<0?'bad':''));
  show('n_res');
}

/* 2. Gerador de Resposta */
function gerarResposta(){
  const nome=val('gr_nome')||'Cliente', canal=val('gr_canal')||'', prob=val('gr_prob')||'',
        acao=val('gr_acao')||'', prazo=val('gr_prazo')||'', comp=val('gr_comp')||'';
  let txt=`Olá, ${nome}!\n\n`;
  txt+=`Agradecemos por nos acionar pelo ${canal} e lamento pelo ocorrido com relação a: ${prob}.\n\n`;
  txt+=`Entendemos a importância do seu tempo e já tomamos a seguinte atitude: ${acao}, no prazo de ${prazo}.`;
  if(comp) txt+=` Como forma de compensar, disponibilizamos: ${comp}.`;
  txt+=`\n\nSegueremos acompanhando até a resolução. Conte com a KODAROS.`;
  document.getElementById('gr_out').textContent=txt;
  show('gr_res');
}

/* 3. SLA */
function calcSLA(){
  const vol=numv('s_vol'), at=numv('s_at'), tmp=numv('s_tmp'), horas=numv('s_horas');
  const cap=at*horas*60/tmp;
  const backlog=vol-cap;
  document.getElementById('s_cap').textContent=num(cap);
  document.getElementById('s_fila').textContent=num(backlog>0?backlog:0);
  const ok=cap>=vol;
  document.getElementById('s_status').textContent=ok?'Dentro do SLA':'Abaixo do SLA';
  document.getElementById('s_box').className='res '+(ok?'good':'bad');
  show('s_res');
}

/* =========================================================
   TAB 6 — OPERAÇÃO
   ========================================================= */

/* 1. Checklist Semanal */
const CHK_ITEMS=[
  'Revisei números de receita e custos da semana',
  'Acompanhei pipeline de vendas e conversão',
  'Respondi reclamações e tickets de suporte',
  'Atualizei tarefas da equipe (ritual M3)',
  'Planejei a próxima semana (metas e prioridades)',
  'Analisei indicadores de tráfego/marketing',
  'Cuidei de finanças (contas a pagar/receber)',
  'Reservei tempo para melhoria de processo'
];
(function(){
  const box=document.getElementById('chk_list');
  box.innerHTML=CHK_ITEMS.map((t,i)=>
    `<div class="check-item"><input type="checkbox" id="chk_${i}"><label for="chk_${i}">${t}</label></div>`).join('');
})();
function calcChecklist(){
  let ok=0;
  for(let i=0;i<CHK_ITEMS.length;i++){ if(document.getElementById('chk_'+i).checked) ok++; }
  const score=Math.round(ok/CHK_ITEMS.length*100);
  document.getElementById('chk_score').textContent=score;
  document.getElementById('chk_ok').textContent=ok+'/'+CHK_ITEMS.length;
  document.getElementById('chk_bar').style.width=score+'%';
  document.getElementById('chk_box').className='res '+(score>=75?'good':(score<50?'bad':''));
  show('chk_res');
}

/* 2. OKR */
function calcOKR(){
  function p(c,t){ return t? c/t*100 : 0; }
  const p1=p(numv('ok1_c'),numv('ok1_t')), p2=p(numv('ok2_c'),numv('ok2_t')), p3=p(numv('ok3_c'),numv('ok3_t'));
  document.getElementById('ok_p1').textContent=pct(p1);
  document.getElementById('ok_p2').textContent=pct(p2);
  document.getElementById('ok_p3').textContent=pct(p3);
  document.getElementById('ok_media').textContent=pct((p1+p2+p3)/3);
  show('ok_res');
}

/* 3. Pareto */
function calcPareto(){
  const itens=[];
  for(let i=1;i<=4;i++){
    const n=document.getElementById('pa'+i+'_n').value.trim();
    const v=numv('pa'+i+'_v');
    if(n) itens.push({n:n, v:v});
  }
  const total=itens.reduce((s,x)=>s+x.v,0);
  itens.sort((a,b)=>b.v-a.v);
  let acum=0;
  const tb=document.querySelector('#pa_tbl tbody'); tb.innerHTML='';
  let vitalCount=0;
  let reached80=false;
  itens.forEach(function(x){
    acum+=x.v;
    const pctAcum = total? acum/total*100 : 0;
    // vital = itens que compõem até cruzar 80%
    const vital = !reached80 && total>0;
    if(vital) vitalCount++;
    if(pctAcum >= 80) reached80 = true;
    const tr=document.createElement('tr');
    [x.n, num(x.v), pct(pctAcum), vital?'⭐ Sim':'–'].forEach((v,idx)=>{
      const td=document.createElement('td'); td.textContent=v;
      td.style.textAlign = idx===0 ? 'left' : 'right';
      tr.appendChild(td);
    });
    if(vital) tr.classList.add('gargalo');
    tb.appendChild(tr);
  });
  document.getElementById('pa_msg').textContent='Princípio de Pareto: '+vitalCount+' de '+itens.length+' causa(s) respondem por até 80% do impacto. Foque nelas primeiro.';
  show('pa_res');
}

/* =========================================================
   NOVAS FERRAMENTAS (acrescentadas)
   ========================================================= */

/* ---- TAB 1 extras ---- */
function calcCPL(){
  const ticket=numv('cpl_ticket'), marg=numv('cpl_marg')/100, conv=numv('cpl_conv')/100;
  if(!conv){ alert('Informe a conversão lead→venda.'); return; }
  const cacMax=ticket*marg, cpl=cacMax*conv;
  document.getElementById('cpl_val').textContent=brl(cpl);
  document.getElementById('cpl_cac').textContent=brl(cacMax);
  show('cpl_res');
}
function gerarAdCopy(){
  const prod=val('ad_prod')||'Seu produto', pub=val('ad_pub')||'seu público',
        dor=val('ad_dor')||'', ben=val('ad_ben')||'', prova=val('ad_prova')||'';
  let t=`Para ${pub} que sofrem com ${dor}:\n\n${prod} entrega ${ben}.\n\nComprovado por ${prova}.\n\nClique e descubra como.`;
  document.getElementById('ad_out').textContent=t;
  show('ad_res');
}
function simAB(){
  const a=numv('ab_ctra'), b=numv('ab_ctrb'), imp=numv('ab_imp');
  if(!imp){ alert('Informe as impressões.'); return; }
  const cliA=imp*a/100, cliB=imp*b/100;
  document.getElementById('ab_win').textContent='Variação '+(b>=a?'B':'A');
  document.getElementById('ab_cli').textContent='+'+num(Math.abs(cliB-cliA));
  document.getElementById('ab_box').className='res '+(Math.abs(b-a)>0?'good':'');
  show('ab_res');
}

/* ---- TAB 2 extras ---- */
function calcCronInvertido(){
  const fim=val('ci_fim');
  if(!fim){ alert('Escolha a data de fechamento.'); return; }
  let d=new Date(fim+'T00:00:00');
  const fases=[['Fechamento',numv('ci_fecha')],['Pico',numv('ci_pico')],['Abertura',numv('ci_abre')],['Pré-lançamento',numv('ci_pre')]];
  const tb=document.querySelector('#ci_tbl tbody'); tb.innerHTML='';
  for(let i=fases.length-1;i>=0;i--){
    const dur=fases[i][1], termino=d, inicio=addDays(d, -dur);
    const tr=document.createElement('tr');
    [fases[i][0], fmtDate(inicio), fmtDate(termino)].forEach((v,idx)=>{
      const td=document.createElement('td'); td.textContent=v;
      td.style.textAlign = idx===0 ? 'left' : 'right';
      tr.appendChild(td);
    });
    tb.appendChild(tr); d=inicio;
  }
  show('ci_res');
}
function calcCPE(){
  const inv=numv('cpe_inv'), ins=numv('cpe_ins');
  if(!ins){ alert('Informe os inscritos.'); return; }
  document.getElementById('cpe_val').textContent=brl(inv/ins);
  show('cpe_res');
}
function gerarSeqEmail(){
  const nome=val('se_nome')||'Lançamento';
  const e=[
    `E-mail 1 — Aquecimento: conteúdo educativo sobre o problema que ${nome} resolve.`,
    `E-mail 2 — História: mostre a jornada e a transformação do seu método.`,
    `E-mail 3 — Abertura: divulgue que as inscrições abriram, com benefícios.`,
    `E-mail 4 — Pico: apresente depoimentos e a oferta principal.`,
    `E-mail 5 — Fechamento: último aviso de encerramento e bônus.`
  ];
  document.getElementById('se_out').textContent=e.join('\n\n');
  show('se_res');
}

/* ---- TAB 3 extras ---- */
function calcEquilibrio(){
  const fixo=numv('pe_fixo'), preco=numv('pe_preco'), cv=numv('pe_cv');
  const mc=preco-cv;
  if(mc<=0){ alert('O preço deve ser maior que o custo variável.'); return; }
  document.getElementById('pe_cli').textContent=num(fixo/mc);
  document.getElementById('pe_marg').textContent=brl(mc);
  show('pe_res');
}
function calcJuros(){
  const aporte=numv('jc_aporte'), taxa=numv('jc_taxa')/100, meses=Math.max(1,Math.round(numv('jc_mes')));
  let total=0;
  // aporte no fim do período: rende a partir do próximo mês
  for(let i=1;i<=meses;i++){ total = total*(1+taxa) + aporte; }
  document.getElementById('jc_total').textContent=brl(total);
  document.getElementById('jc_rend').textContent=brl(total-aporte*meses);
  show('jc_res');
}
function calcProLabore(){
  const lucro=numv('pl_lucro'), pl=numv('pl_pl')/100;
  document.getElementById('pl_pro').textContent=brl(lucro*pl);
  document.getElementById('pl_dist').textContent=brl(lucro*(1-pl));
  show('pl_res');
}

/* ---- TAB 4 extras ---- */
function gerarScript(){
  const obj=val('so_obj')||'objeção', prod=val('so_prod')||'produto', ben=val('so_ben')||'', prova=val('so_prova')||'';
  let t=`Cliente: "${obj}".\n\nEu entendo. Muitos sentem isso no início.\nO que o ${prod} entrega é justamente ${ben}.\nTemos ${prova} que comprovam o resultado.\nPosso te mostrar como fazer sentido para o seu caso?`;
  document.getElementById('so_out').textContent=t;
  show('so_res');
}
function calcFunilVendas(){
  const lead=numv('fv_lead'), prop=numv('fv_prop'), fecha=numv('fv_fecha');
  if(!lead){ alert('Informe os leads.'); return; }
  document.getElementById('fv_lp').textContent=pct(prop/lead*100);
  document.getElementById('fv_pf').textContent=pct(fecha/prop*100);
  document.getElementById('fv_geral').textContent=pct(fecha/lead*100);
  show('fv_res');
}
function calcFollow(){
  const lead=numv('fu_lead'), tx=numv('fu_tx')/100, tent=Math.max(1,Math.round(numv('fu_tent')));
  if(!lead){ alert('Informe os leads.'); return; }
  const resp=lead*(1-Math.pow(1-tx,tent)), base=lead*tx;
  document.getElementById('fu_resp').textContent=num(resp);
  document.getElementById('fu_extra').textContent='+'+num(resp-base);
  show('fu_res');
}

/* ---- TAB 5 extras ---- */
function gerarPesquisa(){
  const p=[
    'De 1 a 5, quão satisfeito você está com o atendimento?',
    'O problema relatado foi resolvido na primeira interação?',
    'O tempo de resposta atendeu sua expectativa?',
    'Você recomendaria a KODAROS para um colega? (0-10)',
    'O que poderíamos melhorar no suporte?'
  ];
  document.getElementById('ps_out').textContent=p.map((x,i)=>(i+1)+'. '+x).join('\n');
  show('ps_res');
}
function calcValorRec(){
  const cli=numv('vr_cli'), ticket=numv('vr_ticket'), tx=numv('vr_tx')/100;
  document.getElementById('vr_val').textContent=brl(cli*ticket*tx);
  show('vr_res');
}
function gerarRespostaPub(){
  const nome=val('rp_nome')||'Cliente', canal=val('rp_canal')||'', prob=val('rp_prob')||'';
  let t=`Oi, ${nome}! Obrigado por compartilhar isso no ${canal}.\nLamentamos o ocorrido com: ${prob}.\nJá identificamos a causa e vamos resolver. Pode nos chamar na DM para alinharmos a solução?`;
  document.getElementById('rp_out').textContent=t;
  show('rp_res');
}

/* ---- TAB 6 extras ---- */
function copiarSWOT(){
  const t=`SWOT\n\nForças:\n${val('sw_forcas')}\n\nFraquezas:\n${val('sw_fraquezas')}\n\nOportunidades:\n${val('sw_op')}\n\nAmeaças:\n${val('sw_am')}`;
  navigator.clipboard.writeText(t).then(function(){
    if(event && event.target){ event.target.textContent='Copiado!'; setTimeout(function(){ event.target.textContent='Copiar SWOT'; }, 1500); }
  });
}
function calcHoraFat(){
  const meta=numv('hf_meta'), horas=numv('hf_horas'), marg=numv('hf_marg')/100;
  if(!horas){ alert('Informe as horas faturáveis.'); return; }
  document.getElementById('hf_val').textContent=brl(meta/horas*(1+marg));
  show('hf_res');
}
function calcMetasAn(){
  const meta=numv('ma_meta'), mes=Math.max(1,Math.round(numv('ma_mes')));
  document.getElementById('ma_mensal').textContent=brl(meta/mes);
  document.getElementById('ma_semanal').textContent=brl(meta/mes/4.3);
  show('ma_res');
}

/* ---- TAB 7 ---- */
function calcCalendario(){
  const sem=numv('ce_sem'), semanas=numv('ce_semanas'), total=sem*semanas;
  document.getElementById('ce_total').textContent=num(total);
  document.getElementById('ce_mes').textContent=num(sem*4.33);
  show('ce_res');
}
function calcROIConteudo(){
  const inv=numv('rc_inv'), leads=numv('rc_leads'), conv=numv('rc_conv')/100, ticket=numv('rc_ticket');
  const rec=leads*conv*ticket, roi=inv?(rec-inv)/inv*100:0;
  document.getElementById('rc_roi').textContent=(roi>=0?'+':'')+pct(roi);
  document.getElementById('rc_rec').textContent=brl(rec);
  show('rc_res');
}
const SEO_ITEMS=[
  'Título da página com palavra-chave principal',
  'Meta description única e atrativa',
  'URL amigável (sem caracteres especiais)',
  'Imagens com atributo alt descritivo',
  'Estrutura de headings (H1/H2/H3)',
  'Conteúdo original e atualizado',
  'Links internos para páginas relevantes',
  'Velocidade de carregamento otimizada',
  'Sitemap e robots.txt configurados',
  'Dados estruturados (schema)'
];
(function(){
  const box=document.getElementById('seo_list');
  if(box) box.innerHTML=SEO_ITEMS.map((t,i)=>`<div class="check-item"><input type="checkbox" id="seo_${i}"><label for="seo_${i}">${t}</label></div>`).join('');
})();
function calcSEO(){
  let ok=0;
  for(let i=0;i<SEO_ITEMS.length;i++){ if(document.getElementById('seo_'+i).checked) ok++; }
  const score=Math.round(ok/SEO_ITEMS.length*100);
  document.getElementById('seo_score').textContent=score;
  document.getElementById('seo_chk').textContent=ok+'/'+SEO_ITEMS.length;
  document.getElementById('seo_bar').style.width=score+'%';
  document.getElementById('seo_box').className='res '+(score>=80?'good':(score<50?'bad':''));
  show('seo_res');
}

/* =========================================================
   MÓDULOS DE IDENTIDADE VISUAL (espelham o site principal)
   ========================================================= */
document.addEventListener('DOMContentLoaded', function() {
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  let isTabActive = true;
  document.addEventListener('visibilitychange', () => { isTabActive = !document.hidden; });

   /* ---- GALÁXIA ANIMADA ---- */
  (function initGalaxy() {
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let dpr = window.devicePixelRatio || 1, width = 0, height = 0;
    let stars = [], nebulas = [], shootingStars = [], time = 0, nextShootingStar = 400, animId = null;
    const galaxyCenter = { x: 0.72, y: 0.30 };
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const palette = ['#E6E8EE', '#9AA3B8', '#C5A46A'];
    function rand(a, b) { return a + Math.random() * (b - a); }
    function createStars() {
      stars = [];
      const cx = width * galaxyCenter.x, cy = height * galaxyCenter.y;
      const bgCount = Math.round((width * height) / 8500);
      for (let i = 0; i < bgCount; i++) stars.push({ x: Math.random()*width, y: Math.random()*height, size: rand(0.3,1.4), twinkle: rand(0.4,2.0), phase: rand(0,Math.PI*2), color: palette[(Math.random()*palette.length)|0], galaxy: false });
      const spiralCount = Math.round((width * height) / 15000), arms = 2, maxR = Math.min(width, height) * 0.42;
      for (let i = 0; i < spiralCount; i++) {
        const arm = i % arms, angle = arm * Math.PI + i * 0.22, radius = Math.pow(Math.random(), 0.6) * maxR, a = angle + radius * 0.006, spread = rand(0.4, 1.6) * maxR * 0.06, r = radius + (Math.random()-0.5)*spread;
        stars.push({ x: cx + Math.cos(a)*r, y: cy + Math.sin(a)*r*0.62, size: rand(0.5,2.1), twinkle: rand(0.3,1.6), phase: rand(0,Math.PI*2), color: palette[(Math.random()*palette.length)|0], galaxy: true, arm });
      }
    }
    function createNebulas() {
      nebulas = [];
      const defs = [{color:'59, 91, 254',alpha:0.05},{color:'197, 164, 106',alpha:0.03},{color:'59, 91, 254',alpha:0.04}];
      for (let i = 0; i < 6; i++) { const d = defs[i % defs.length]; nebulas.push({ x: rand(0,width), y: rand(0,height), radius: rand(Math.min(width,height)*0.28, Math.min(width,height)*0.55), color: d.color, alpha: d.alpha, pulse: rand(0.10,0.30), phase: rand(0,Math.PI*2) }); }
    }
    function drawNebulas() {
      ctx.globalCompositeOperation = 'lighter';
      for (const n of nebulas) {
        const pulse = 0.72 + 0.28 * Math.sin(time * n.pulse * 0.02 + n.phase);
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius);
        g.addColorStop(0, `rgba(${n.color}, ${(n.alpha*pulse).toFixed(3)})`); g.addColorStop(1, `rgba(${n.color}, 0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.x, n.y, n.radius, 0, Math.PI*2); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    function drawStars() {
      const cx = width*galaxyCenter.x, cy = height*galaxyCenter.y, offX = mouse.x*0.35, offY = mouse.y*0.35, rot = time*0.00011, cos = Math.cos(rot), sin = Math.sin(rot);
      for (const s of stars) {
        const tw = 0.55 + 0.45 * Math.sin(time*0.03*s.twinkle + s.phase);
        let x = s.x, y = s.y;
        if (s.galaxy) { const dx = s.x-cx, dy = s.y-cy; x = cx + dx*cos - dy*sin; y = cy + dx*sin + dy*cos; }
        ctx.globalAlpha = Math.min(1, tw*0.85 + 0.15); ctx.fillStyle = s.color;
        ctx.beginPath(); ctx.arc(x + offX, y + offY, s.size, 0, Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    function spawn() { const sx=rand(0,width), sy=rand(0,height), dir=Math.random()*Math.PI*2, spd=rand(5,9); shootingStars.push({ x:sx, y:sy, vx:Math.cos(dir)*spd, vy:Math.sin(dir)*spd, life:1, decay:rand(0.008,0.016), length:rand(60,130) }); }
    function drawShooting() {
      for (let i = shootingStars.length-1; i >= 0; i--) {
        const s = shootingStars[i]; s.x += s.vx; s.y += s.vy; s.life -= s.decay;
        if (s.life <= 0) { shootingStars.splice(i,1); continue; }
        const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx*5, s.y - s.vy*5);
        g.addColorStop(0, `rgba(255,255,255, ${(s.life*0.9).toFixed(3)})`); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx*5, s.y - s.vy*5); ctx.stroke();
      }
    }
    function resize() { dpr = window.devicePixelRatio || 1; width = window.innerWidth; height = window.innerHeight; canvas.width = width*dpr; canvas.height = height*dpr; canvas.style.width = width+'px'; canvas.style.height = height+'px'; ctx.setTransform(dpr,0,0,dpr,0,0); createStars(); createNebulas(); }
    function animate() {
      if (isTabActive) {
        time += 1; mouse.x += (mouse.tx - mouse.x)*0.05; mouse.y += (mouse.ty - mouse.y)*0.05;
        if (time > nextShootingStar) { spawn(); nextShootingStar = time + rand(260,640); }
        ctx.clearRect(0,0,width,height); drawNebulas(); drawShooting(); drawStars();
      }
      animId = requestAnimationFrame(animate);
    }
    window.addEventListener('resize', resize);
    if (!isTouch) document.addEventListener('mousemove', e => { mouse.tx = (e.clientX/window.innerWidth - 0.5)*60; mouse.ty = (e.clientY/window.innerHeight - 0.5)*60; });
    resize(); animate();
  })();

  /* ---- NAVBAR ---- */
  (function initNavbar() {
    const navbar = document.getElementById('navbar'); if (!navbar) return;
    function handle() {
      const cur = window.pageYOffset;
      if (cur > 30) navbar.classList.add('scrolled'); else navbar.classList.remove('scrolled');
      // mantém navbar sempre visível e fixa no topo (sem esconder no scroll)
      navbar.classList.remove('hidden');
      navbar.classList.add('visible');
    }
    window.addEventListener('scroll', handle, { passive: true });
    handle();
  })();

  /* ---- SMOOTH SCROLL ---- */
  (function initSmooth() {
    const navbar = document.getElementById('navbar');
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', function(e) {
      const href = this.getAttribute('href'); if (href === '#') return;
      const target = document.querySelector(href);
      if (target) { e.preventDefault(); const nh = navbar ? navbar.offsetHeight : 0; const pos = target.getBoundingClientRect().top + window.pageYOffset - nh - 20; window.scrollTo({ top: pos, behavior: 'smooth' }); }
    }));
  })();

  /* ---- SCROLL REVEAL ---- */
  (function initReveal() {
    const els = document.querySelectorAll('.panel-head, .tool');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          const p = en.target.parentElement;
          if (p) { const sibs = Array.from(p.children).filter(c => c.classList.contains('tool')); const idx = sibs.indexOf(en.target); en.target.style.transitionDelay = `${Math.min(idx, 6) * 0.07}s`; }
          en.target.classList.add('active'); obs.unobserve(en.target);
          setTimeout(() => en.target.classList.remove('reveal', 'active'), 1100);
        }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => { el.classList.add('reveal'); obs.observe(el); });
  })();

  /* ---- MAGNETIC BUTTONS ---- */
  (function initMagnetic() {
    if (isTouch) return;
    document.querySelectorAll('.btn, .nav-cta').forEach(btn => {
      btn.addEventListener('mousemove', e => { const r = btn.getBoundingClientRect(); btn.style.transform = `translate(${(e.clientX - r.left - r.width/2) * 0.15}px, ${(e.clientY - r.top - r.height/2) * 0.15}px)`; });
      btn.addEventListener('mouseleave', () => { btn.style.transform = 'translate(0,0)'; btn.style.transition = 'transform 0.5s cubic-bezier(0.22,1,0.36,1), background 0.3s, box-shadow 0.3s'; });
      btn.addEventListener('mouseenter', () => { btn.style.transition = 'transform 0.1s ease, background 0.3s, box-shadow 0.3s'; });
    });
  })();

  /* ---- CURSOR GLOW ---- */
  (function initGlow() {
    if (isTouch) return;
    const g = document.createElement('div'); g.className = 'cursor-glow'; document.body.appendChild(g);
    let gx = 0, gy = 0, cgx = 0, cgy = 0, inWin = false;
    document.addEventListener('mousemove', e => { gx = e.clientX; gy = e.clientY; inWin = true; g.style.opacity = '1'; });
    document.addEventListener('mouseleave', () => { inWin = false; g.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { inWin = true; });
    (function loop() { if (isTabActive && inWin) { cgx += (gx - cgx)*0.08; cgy += (gy - cgy)*0.08; g.style.left = cgx+'px'; g.style.top = cgy+'px'; } requestAnimationFrame(loop); })();
  })();
});

/* =========================================================
   TEMPLATES EDITÁVEIS (cartão, post, cupom) — baixar PNG
   ========================================================= */
(function initTemplates(){
  const imgs={cartao:null, post:null, cupom:null};
  function loadImg(input, key){
    const file=input.files && input.files[0];
    if(!file) return;
    const reader=new FileReader();
    reader.onload=function(e){ const img=new Image(); img.onload=function(){ imgs[key]=img; renderers[key](); }; img.src=e.target.result; };
    reader.readAsDataURL(file);
  }
  function wrapText(ctx, text, cx, cy, maxW, lh){
    const words=text.split(' '); let line='', lines=[];
    for(const w of words){ const test=line?line+' '+w:w; if(ctx.measureText(test).width>maxW && line){ lines.push(line); line=w; } else line=test; }
    if(line) lines.push(line);
    const startY=cy-(lines.length-1)*lh/2;
    lines.forEach((l,i)=>ctx.fillText(l, cx, startY+i*lh));
  }
  function renderCartao(){
    const c=document.getElementById('cartao_canvas'); if(!c) return; const x=c.getContext('2d');
    const W=c.width, H=c.height;
    x.fillStyle='#0A0A0A'; x.fillRect(0,0,W,H);
    x.strokeStyle='rgba(255,255,255,0.35)'; x.lineWidth=2; x.strokeRect(28,28,W-56,H-56);
    let lx=70;
    if(imgs.cartao){ const s=120; x.drawImage(imgs.cartao, lx, 95, s, s); lx=lx+s+34; }
    x.textBaseline='top'; x.textAlign='left';
    x.fillStyle='#FFFFFF'; x.font='700 52px Figtree, Arial, sans-serif'; x.fillText(val('cartao_nome')||'', lx, 110);
    x.fillStyle='#A3A3A3'; x.font='400 28px Figtree, Arial, sans-serif'; x.fillText(val('cartao_cargo')||'', lx, 178);
    x.strokeStyle='rgba(255,255,255,0.2)'; x.beginPath(); x.moveTo(70,285); x.lineTo(W-70,285); x.stroke();
    x.fillStyle='#F5F5F5'; x.font='400 24px Figtree, Arial, sans-serif';
    x.fillText(val('cartao_tel')||'', 70, 300);
    x.fillText(val('cartao_email')||'', 70, 340);
    x.fillText(val('cartao_site')||'', 70, 380);
  }
  function renderPost(){
    const c=document.getElementById('post_canvas'); if(!c) return; const x=c.getContext('2d');
    const W=c.width, H=c.height;
    x.fillStyle='#0A0A0A'; x.fillRect(0,0,W,H);
    x.strokeStyle='rgba(255,255,255,0.25)'; x.lineWidth=3; x.strokeRect(40,40,W-80,H-80);
    if(imgs.post){ const s=150; x.drawImage(imgs.post, W/2-s/2, 90, s, s); }
    x.fillStyle='#FFFFFF'; x.textAlign='center'; x.textBaseline='middle';
    x.font='700 64px Figtree, Arial, sans-serif';
    wrapText(x, val('post_frase')||'', W/2, H/2, W-260, 78);
    x.fillStyle='#A3A3A3'; x.font='500 34px Figtree, Arial, sans-serif';
    x.fillText(val('post_autor')||'', W/2, H-110);
    x.textAlign='left';
  }
  function renderCupom(){
    const c=document.getElementById('cupom_canvas'); if(!c) return; const x=c.getContext('2d');
    const W=c.width, H=c.height;
    x.fillStyle='#0A0A0A'; x.fillRect(0,0,W,H);
    x.strokeStyle='rgba(255,255,255,0.3)'; x.lineWidth=3; x.strokeRect(40,40,W-80,H-80);
    x.textAlign='center'; x.textBaseline='middle'; x.fillStyle='#FFFFFF';
    x.font='800 70px Figtree, Arial, sans-serif'; x.fillText(val('cupom_tit')||'', W/2, 230);
    x.font='800 130px Figtree, Arial, sans-serif'; x.fillText(val('cupom_desc')||'', W/2, 470);
    x.fillStyle='#A3A3A3'; x.font='500 40px Figtree, Arial, sans-serif'; x.fillText(val('cupom_val')||'', W/2, 660);
    x.fillStyle='#F5F5F5'; x.font='700 48px Figtree, Arial, sans-serif'; x.fillText('Cupom: '+(val('cupom_cod')||''), W/2, 820);
    x.textAlign='left';
  }
  const renderers={cartao:renderCartao, post:renderPost, cupom:renderCupom};
  ['cartao_nome','cartao_cargo','cartao_tel','cartao_email','cartao_site'].forEach(id=>{ const el=document.getElementById(id); if(el) el.addEventListener('input', renderCartao); });
  ['post_frase','post_autor'].forEach(id=>{ const el=document.getElementById(id); if(el) el.addEventListener('input', renderPost); });
  ['cupom_tit','cupom_desc','cupom_val','cupom_cod'].forEach(id=>{ const el=document.getElementById(id); if(el) el.addEventListener('input', renderCupom); });
  const ci=document.getElementById('cartao_img'); if(ci) ci.addEventListener('change', function(){ loadImg(ci,'cartao'); });
  const pi=document.getElementById('post_img'); if(pi) pi.addEventListener('change', function(){ loadImg(pi,'post'); });
  document.querySelectorAll('[data-tpl]').forEach(btn=>{
    btn.addEventListener('click', function(){
      const key=btn.dataset.tpl, c=document.getElementById(key+'_canvas');
      if(!c) return;
      const link=document.createElement('a');
      link.download='kodaros-'+key+'.png';
      link.href=c.toDataURL('image/png');
      link.click();
    });
  });
  renderCartao(); renderPost(); renderCupom();
})();
