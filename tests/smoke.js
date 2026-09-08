/* Smoke test das Ferramentas KODAROS — roda o site em jsdom e valida
   fonte única, contagens, calculadoras e estados dinâmicos. */
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { JSDOM, VirtualConsole } = require('jsdom');

const base = path.resolve(__dirname, '..');
const scriptCode = fs.readFileSync(path.join(base, 'script.js'), 'utf-8');
const css = fs.readFileSync(path.join(base, 'style.css'), 'utf-8');
const html = fs.readFileSync(path.join(base, 'index.html'), 'utf-8');

const vc = new VirtualConsole();
const runtimeErrors = [];
vc.on('jsdomError', e => { if (!/Not implemented/.test(e.message)) runtimeErrors.push(String(e.message)); });

const dom = new JSDOM(html, {
  runScripts: 'outside-only',
  url: pathToFileURL(path.join(base, 'index.html')).href,
  pretendToBeVisual: true,
  virtualConsole: vc,
});
const { window } = dom;
const { document } = window;
window.eval(scriptCode);

let falhas = 0;
function check(nome, cond, detalhe) {
  if (cond) console.log('  ok  ' + nome + (detalhe ? ' — ' + detalhe : ''));
  else { falhas++; console.error('  FALHA  ' + nome + (detalhe ? ' — ' + detalhe : '')); }
}

setTimeout(function run() {
  console.log('== Smoke test Ferramentas KODAROS ==');

  check('KODAROS_TOOLS com 53 ferramentas', window.KODAROS_TOOLS && window.KODAROS_TOOLS.length === 53);
  check('IDs únicos', window.KODAROS_TOOLS && new Set(window.KODAROS_TOOLS.map(t => t.id)).size === 53);

  const badges = [...document.querySelectorAll('.tab-btn .tab-badge')];
  check('Badges nas 7 abas', badges.length === 7, badges.map(b => b.textContent).join('/'));

  const nums = [...document.querySelectorAll('.tool-num')];
  check('Fichas numeradas 01-53', nums.length === 53 && nums[0].textContent === '01' && nums[52].textContent === '53');
  check('Contagem viva na ficha', document.getElementById('ficha-count').textContent === '53');

  window.calcCAC();
  check('CAC calcula', document.getElementById('c1_ratio').textContent.includes(':1'));
  check('CAC sensibilidade 3 cenários', document.querySelectorAll('#c1_sens tbody tr').length === 3);

  window.calcPrecificacao();
  check('Precificação com markup', /%/.test(document.getElementById('pr_markup').textContent));

  window.calcMargem();
  check('Margem com markup', /%/.test(document.getElementById('ml_markup').textContent));

  window.calcFluxo();
  check('Fluxo projeta 6 meses', document.querySelectorAll('#fc_tbl tbody tr').length === 6);
  check('CSV disponível', typeof window.exportFluxoCSV === 'function');
  window.URL.createObjectURL = window.URL.createObjectURL || (() => 'blob:x');
  window.URL.revokeObjectURL = window.URL.revokeObjectURL || (() => {});
  let csvOk = true; try { window.exportFluxoCSV(); } catch (e) { csvOk = false; }
  check('CSV executa sem erro', csvOk);

  const input = document.getElementById('toolsSearch');
  input.value = 'xyznaoexiste';
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  check('Busca: estado vazio', /Nenhuma ferramenta/.test(document.getElementById('searchEmpty').textContent));
  if (document.getElementById('searchClear')) document.getElementById('searchClear').click();
  check('Busca: botão limpar funciona', input.value === '');

  check('Resultados copiáveis', document.querySelectorAll('.result .res .v.v-copy').length > 50);

  const star = document.querySelector('.tool .star-btn');
  star.click();
  check('Favorito liga com chip', star.classList.contains('on') && !!document.querySelector('#favBarFavs .chip'));
  star.click();

  check('Link principal = KodarosLanding', document.querySelector('.nav-cta').href.includes('KodarosLanding'));
  check('CSS Dossiê presente', css.includes('hero-ledger') && css.includes('.tool.fav .tool-num'));

  check('Sem erros de runtime', runtimeErrors.length === 0, runtimeErrors.join(' | ').slice(0, 200));

  if (falhas) { console.error('\n' + falhas + ' falha(s)'); process.exit(1); }
  console.log('\nTudo ok.');
}, 300);
