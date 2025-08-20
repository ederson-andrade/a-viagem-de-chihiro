# A Viagem de Chihiro — Landing (Gulp + SCSS + JS)

Projeto estático, responsivo e acessível, com microinterações suaves, metodologia **BEM** e pipeline de build em **Gulp**.

## Estrutura
```
src/
  assets/
    images/            # imagens (serão minificadas e geram .webp/.avif)
    js/                # JS modular (minificado)
    scss/              # SCSS (compilado e minificado)
  content/
    images.json        # lista de imagens para baixar (Wikimedia Commons)
  index.html
scripts/
  fetch-images.mjs     # script para baixar imagens remotas para src/assets/images
```

## Requisitos
- Node.js 18+
- pnpm **ou** npm (você escolhe)

## Setup express
```bash
# com npm
npm install
npm run init        # baixa as imagens listadas em src/content/images.json
npm run dev         # ambiente com BrowserSync (http://localhost:3000)

# build de produção (saída em dist/)
npm run build
```

### O que o Gulp faz
- Compila **SCSS → CSS** com Autoprefixer, gera sourcemap e minifica.
- Minifica **JS** (Terser).
- Otimiza **imagens jpg/png** e gera **.webp** e **.avif**.
- Minifica **HTML**.
- Servidor de dev com **BrowserSync** e live-reload.

## Licenças de imagens (resumo)
Os arquivos listados em `src/content/images.json` apontam para mídias do Wikimedia Commons com licenças compatíveis (CC0/CC BY/CC BY‑SA). As **atribuições** estão no rodapé da página.