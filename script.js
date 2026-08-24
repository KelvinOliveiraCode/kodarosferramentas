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

/* ---------- Tabs ---------- */
document.querySelectorAll('.tab-btn').forEach(function(btn){
  btn.addEventListener('click', function(){
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

/* ---------- Copiar ---------- */
function copyText(id){
  const t = document.getElementById(id).innerText || document.getElementById(id).value || '';
  const text = document.getElementById(id).tagName === 'INPUT' ? document.getElementById(id).value : t;
  navigator.clipboard.writeText(text).then(function(){
    event.target.textContent = 'Copiado!';
    setTimeout(function(){ event.target.textContent = 'Copiar'; }, 1500);
  });
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
  let orc=orc0, tCli=0, tRec=0, tGasto=0;
  const tb=document.querySelector('#c2_tbl tbody'); tb.innerHTML='';
  for(let i=1;i<=sem;i++){
    const clientes=orc/cac;
    const receita=clientes*ticket;
    const lucro=receita*marg;
    tCli+=clientes; tRec+=receita; tGasto+=orc;
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${i}</td><td>${brl(orc)}</td><td>${num(clientes)}</td><td>${brl(receita)}</td><td>${brl(lucro)}</td>`;
    tb.appendChild(tr);
    orc*=(1+cresc);
  }
  document.getElementById('c2_tcli').textContent=num(tCli);
  document.getElementById('c2_trec').textContent=brl(tRec);
  document.getElementById('c2_tluc').textContent=brl(tRec-tGasto);
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
    tr.innerHTML=`<td>${nomes[i]||('Etapa '+(i+1))} → ${nomes[i+1]||'Venda'}</td><td>${num(entraram)}</td><td>${pct(conv*100)}</td><td>${num(sairam)}</td>`;
    tb.appendChild(tr);
    if(conv<menor){ menor=conv; gargaloIdx=i; }
    entraram=entraram*conv;
  }
  tb.children[gargaloIdx].classList.add('gargalo');
  const trf=document.createElement('tr');
  trf.className='total';
  trf.innerHTML=`<td>Vendas totais</td><td>${num(entraram)}</td><td>–</td><td>–</td>`;
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
  const url=val('u_url')||'';
  const params={};
  const map={'u_source':'utm_source','u_medium':'utm_medium','u_camp':'utm_campaign','u_term':'utm_term','u_cont':'utm_content'};
  for(const k in map){ const v=(document.getElementById(k).value||'').trim(); if(v) params[map[k]]=v; }
  let out=url.indexOf('?')>=0?url+'&':url+'?';
  out+=Object.keys(params).map(k=>k+'='+encodeURIComponent(params[k])).join('&');
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
    tr.innerHTML=`<td>${f[0]}</td><td>${fmtDate(inicio)}</td><td>${fmtDate(fim)}</td>`;
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
    tr.innerHTML=`<td>${i}</td><td>${brl(ent)}</td><td>${brl(sai)}</td><td>${brl(saldo)}</td>`;
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
  itens.forEach(function(x){
    acum+=x.v;
    const vital=acum/total<=0.8 && total>0;
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${x.n}</td><td>${num(x.v)}</td><td>${pct(total?acum/total*100:0)}</td><td>${vital?'⭐ Sim':'–'}</td>`;
    if(vital) tr.classList.add('gargalo');
    tb.appendChild(tr);
  });
  const vitalCount=itens.filter((x,i)=>{
    let a=0; for(let j=0;j<=i;j++) a+=itens[j].v; return total? a/total<=0.8:false;
  }).length;
  document.getElementById('pa_msg').textContent='Princípio de Pareto: '+vitalCount+' de '+itens.length+' causa(s) respondem por até 80% do impacto. Foque nelas primeiro.';
  show('pa_res');
}
