# kodarosferramentas — 53 ferramentas de negócio em um PWA offline-first

![HTML5](https://img.shields.io/badge/HTML5-e34f26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572b6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-f7df1e?style=flat-square&logo=javascript&logoColor=black)
![PWA](https://img.shields.io/badge/PWA-5a0fc8?style=flat-square&logo=pwa&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/Live-GitHub_Pages-121013?style=flat-square&logo=githubpages&logoColor=white)

**Ferramentas KODAROS** é um PWA com 53 calculadoras e geradores gratuitos para negócios, 100% client-side e sem uma linha de IA — tudo é matemática e lógica roteiro no navegador. O `manifest.json` configura o app como standalone (tema `#070709`, ícones 192/512 e maskable), e o service worker `sw.js` entrega offline-first com cache `CORE`, versão `kodaros-tools-v5`, `skipWaiting` e limpeza de caches antigos no evento `activate`. As 53 ferramentas se distribuem em 7 categorias com navegação por tabs acessíveis. Ao vivo em [kelvinoliveiracode.github.io/kodarosferramentas](https://kelvinoliveiracode.github.io/kodarosferramentas/).

---

## 🇧🇷 Português

### O que é

Uma suíte de 53 calculadoras e geradores para quem opera negócios: métricas de aquisição, finanças, vendas, operação, lançamentos, suporte e conteúdo. Cada ferramenta é uma página de ficha que calcula direto no navegador, sem requíduo de servidor e sem inteligência artificial — o valor está nas fórmulas e nos fluxos de raciocínio, não em modelos.

### Categorias e ferramentas

As 53 ferramentas estão organizadas em 7 categorias, com navegação por tabs e badges de contagem alimentadas dinamicamente da fonte `KODAROS_TOOLS`:

| Categoria | Ferramentas |
|---|---|
| Aquisição & Tráfego | 13 |
| Financeiro | 8 |
| Vendas | 7 |
| Operação & Gestão | 7 |
| Lançamento | 6 |
| Suporte & Transformação | 6 |
| Conteúdo & Marketing | 6 |

Alguns exemplos de ferramentas por categoria:

- **Aquisição & Tráfego** — CAC/LTV, ROI/ROAS de tráfego pago, CPL ideal baseado no LTV, conversor de métricas de mídia, planejador de orçamento por canal, UTM builder.
- **Vendas** — auditor de funil, recuperação de carrinho.
- **Lançamento** — cronograma de lançamento, simulador de receita de lançamento.
- **Conteúdo & Marketing** — gerador de ad copy, simulador A/B de criativos, auditor de landing page/CRO.
- **Financeiro** — ponto de equilíbrio de campanha.
- **Operação & Gestão** — projetor de escala.

### Arquitetura

```
kodarosferramentas/
├── index.html      # 1.295 linhas — shell, tabs ARIA, containers das fichas
├── script.js       # 1.845 linhas — KODAROS_TOOLS (fonte única) + render dinâmico
├── style.css       # 305 linhas
├── manifest.json   # standalone, theme #070709, ícones 192/512/maskable
├── sw.js           # offline-first: cache CORE, versão kodaros-tools-v5
├── tests/smoke.js  # jsdom, 85 linhas
└── ícones e assets
```

O núcleo da arquitetura é o array `KODAROS_TOOLS` no `script.js`: ele é a fonte única de verdade das 53 ferramentas. Tabs, badges de contagem e fichas completas são renderizadas dinamicamente a partir dele — adicionar ou editar uma ferramenta é editar um objeto no array, e a interface inteira se atualiza.

Acessibilidade: a navegação por categorias usa os roles ARIA `tablist`, `tab` e `tabpanel`, com `aria-selected` refletindo a tab ativa.

PWA: `manifest.json` declara modo standalone, tema `#070709` e ícones 192px, 512px e maskable. O `sw.js` faz offline-first com cache `CORE`, versão `kodaros-tools-v5`, estratégia `skipWaiting` e limpeza de caches antigos no `activate` — atualizar o service worker invalida caches obsoletos sem deixar lixo para trás.

### Testes

`tests/smoke.js` roda em jsdom (85 linhas) e valida o essencial: as 53 ferramentas presentes na fonte, IDs únicos entre elas, badges de contagem corretas nas 7 abas, e o funcionamento das calculadoras e estados dinâmicos.

### Como rodar

Arquivos estáticos com service worker — sirva por HTTP (não `file://`) para o SW registrar:

```bash
npx serve .
```

O app está deployado no GitHub Pages: [kelvinoliveiracode.github.io/kodarosferramentas](https://kelvinoliveiracode.github.io/kodarosferramentas/).

Para rodar o smoke test:

```bash
node tests/smoke.js
```

### Decisões técnicas

- **`KODAROS_TOOLS` como fonte única** — UI inteira renderizada dinamicamente do array: uma mudança no dado propaga para tabs, badges e fichas sem código extra.
- **Sem IA por opção** — as ferramentas entregam valor por fórmula e estrutura, não por geração; nada depende de API paga ou modelo externo.
- **Service worker versionado com cleanup** — a versão `kodaros-tools-v5` com limpeza no `activate` evita o problema clássico de caches zumbis em PWAs hospedados em Pages.
- **ARIA nas tabs** — navegação de categoria é teclado-acessível e anunciada corretamente a leitores de tela.

---

## 🇺🇸 English

### What it is

A suite of 53 calculators and generators for people running businesses: acquisition metrics, finance, sales, operations, launches, support, and content. Each tool is a card page that computes directly in the browser — no server round-trips and no artificial intelligence: the value lives in the formulas and the reasoning flows, not in models.

### Categories and tools

The 53 tools are organized into 7 categories, with tab navigation and count badges fed dynamically from the `KODAROS_TOOLS` source:

| Category | Tools |
|---|---|
| Acquisition & Traffic | 13 |
| Finance | 8 |
| Sales | 7 |
| Operations & Management | 7 |
| Launch | 6 |
| Support & Transformation | 6 |
| Content & Marketing | 6 |

Some tool examples per category:

- **Acquisition & Traffic** — CAC/LTV, paid traffic ROI/ROAS, ideal CPL based on LTV, media metrics converter, per-channel budget planner, UTM builder.
- **Sales** — funnel auditor, cart recovery.
- **Launch** — launch timeline, launch revenue simulator.
- **Content & Marketing** — ad copy generator, creative A/B simulator, landing page/CRO auditor.
- **Finance** — campaign break-even point.
- **Operations & Management** — scale projector.

### Architecture

```
kodarosferramentas/
├── index.html      # 1,295 lines — shell, ARIA tabs, tool card containers
├── script.js       # 1,845 lines — KODAROS_TOOLS (single source) + dynamic rendering
├── style.css       # 305 lines
├── manifest.json   # standalone, theme #070709, icons 192/512/maskable
├── sw.js           # offline-first: CORE cache, version kodaros-tools-v5
├── tests/smoke.js  # jsdom, 85 lines
└── icons and assets
```

The architecture's core is the `KODAROS_TOOLS` array in `script.js`: it is the single source of truth for the 53 tools. Tabs, count badges, and full tool cards are rendered dynamically from it — adding or editing a tool means editing an object in the array, and the entire interface updates.

Accessibility: category navigation uses the ARIA roles `tablist`, `tab`, and `tabpanel`, with `aria-selected` reflecting the active tab.

PWA: `manifest.json` declares standalone mode, theme `#070709`, and 192px, 512px, and maskable icons. The `sw.js` implements offline-first with a `CORE` cache, version `kodaros-tools-v5`, `skipWaiting` strategy, and old-cache cleanup on `activate` — updating the service worker invalidates stale caches without leaving garbage behind.

### Tests

`tests/smoke.js` runs on jsdom (85 lines) and validates the essentials: all 53 tools present in the source, unique IDs across them, correct count badges on the 7 tabs, and working calculators and dynamic states.

### Running it

Static files with a service worker — serve over HTTP (not `file://`) so the SW registers:

```bash
npx serve .
```

The app is deployed on GitHub Pages: [kelvinoliveiracode.github.io/kodarosferramentas](https://kelvinoliveiracode.github.io/kodarosferramentas/).

To run the smoke test:

```bash
node tests/smoke.js
```

### Technical decisions

- **`KODAROS_TOOLS` as single source** — the whole UI renders dynamically from the array: one data change propagates to tabs, badges, and cards with no extra code.
- **No AI by choice** — the tools deliver value through formulas and structure, not generation; nothing depends on a paid API or external model.
- **Versioned service worker with cleanup** — version `kodaros-tools-v5` with `activate` cleanup avoids the classic zombie-cache problem in Pages-hosted PWAs.
- **ARIA on tabs** — category navigation is keyboard-accessible and correctly announced to screen readers.

---

## Autor

**Kelvin Oliveira**

- GitHub: [KelvinOliveiraCode](https://github.com/KelvinOliveiraCode)
- LinkedIn: [kelvin-oliveira-0282033b4](https://www.linkedin.com/in/kelvin-oliveira-0282033b4/)

## Licença

Distribuído sob a licença MIT. Consulte o arquivo de licença do repositório para detalhes.
