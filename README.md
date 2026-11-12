# Satou · Portfólio (Criador de Conteúdo Web3)

Site estático em HTML, CSS e JavaScript puro, sem framework e sem etapa de build. Hospedado na **Vercel**: cada push na `main` publica em produção, e cada branch gera uma URL de preview.

## Estrutura

```
├── index.html                 → página principal (PT/EN)
├── case-studies/              → uma página por case (+ case-template.html)
├── media-kit/
│   ├── index.html             → molde do media kit (2 folhas A4)
│   └── satou-media-kit-*.pdf  → PDFs gerados (botões "Media kit" do site)
├── assets/
│   ├── characters/            → personagem (hero e contato)
│   ├── logos/                 → logos das marcas
│   ├── og/                    → imagem de compartilhamento e ícone Apple (gerados)
│   └── testimonials/          → placeholder para depoimentos futuros
├── css/  style.css · case-study.css · animations.css · responsive.css
├── js/main.js                 → idioma, menu, animações, contadores, formulário
├── scripts/
│   ├── build-assets.js        → gera PDFs do media kit + imagem OG + ícone
│   └── og.html                → molde da imagem de compartilhamento
├── favicon.svg
└── vercel.json                → URLs limpas e cabeçalhos de cache
```

## Rodando localmente

```bash
python3 -m http.server 8080
```

## Atualizando as métricas (a cada ~3 meses)

1. Exporte os dados: **X** (Analytics → Overview → Export CSV, 90 dias), **Instagram** (Painel profissional → Insights, 90 dias), **TikTok** (TikTok Studio → Analytics → Overview, exportar).
2. Atualize os números em `index.html`:
   - `.hero-stats` (topo: impressões, engajamentos, respostas, marcas)
   - seção `#audience` (cards por plataforma, períodos e a data em `.audience-updated`)
3. Atualize os mesmos números em `media-kit/index.html` e a data no topo.
4. Gere de novo os PDFs: `node scripts/build-assets.js` (precisa de `npm i -D playwright`). O script avisa se alguma página do PDF estourar.
5. Faça commit dos PDFs gerados junto com o HTML.

## Formulário de contato

O formulário usa o [FormSubmit](https://formsubmit.co) e envia direto para `satoukibijusu@gmail.com`, sem backend e sem chave.
**Na primeira mensagem enviada pelo site, o FormSubmit manda um e-mail de ativação**: clique em *Activate Form* e, a partir daí, toda proposta chega na caixa de entrada (confira também o spam na primeira vez).

Os botões "Pedir orçamento" de cada formato já preenchem o campo "Formato de interesse".

## Formatos e preços

Cada formato é um `.service-card` na seção `#content`. Para mostrar preço, troque `Sob consulta` / `On request` em `.service-price-value` (ex.: `A partir de R$ 800`) e faça o mesmo em `media-kit/index.html`; depois gere os PDFs de novo.

## Idiomas (PT / EN)

Todo texto traduzível usa elementos irmãos com `data-lang="pt"` e `data-lang="en"`. O idioma escolhido fica salvo no navegador e vale para todas as páginas; `?lang=en` na URL força inglês.

## Novo case study

1. Duplique `case-studies/case-template.html` como `case-studies/<slug>.html` e preencha com dados reais.
2. Adicione um `<a class="case-card">` na grade `#case-studies` do `index.html`.
3. Se fizer sentido, inclua o case no media kit e gere os PDFs de novo.

## Convenções

- Nav e footer são duplicados em cada `.html` (não há includes). Ao mudar um, replique em todos.
- Classes `bloco-elemento`, modificadores com `--`, estados com `is-`.
- Animações respeitam `prefers-reduced-motion`.
