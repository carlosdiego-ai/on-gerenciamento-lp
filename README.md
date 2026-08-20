# ON Gerenciamento de Obras — Landing Page

Landing page de captação para a ON Gerenciamento de Obras, de Adamantina/SP.
Site estático, sem build e sem dependências. Abre direto no navegador.

## Estrutura

```
index.html          página completa
assets/styles.css   design tokens e componentes
assets/app.js       máscara, validação, pixel e CTA fixo
assets/img/         logo oficial e retratos
HANDOFF.md          documentação, tokens e pendências
```

## Rodar localmente

```bash
python3 -m http.server 8000
```

Depois abra http://localhost:8000

## Deploy

O site está no ar em dois endereços, os dois servindo o mesmo conteúdo:

| Ambiente | Endereço | Atualiza |
|---|---|---|
| Vercel (principal) | https://on-gerenciamento-lp.vercel.app | `npx vercel deploy --prod` |
| GitHub Pages | https://carlosdiego-ai.github.io/on-gerenciamento-lp/ | sozinho a cada push na `main` |

O projeto na Vercel é `on-gerenciamento-lp`, sob o escopo
Carlos Diego - Formula Otica's projects. É site estático:
Framework Preset **Other**, sem build, output no diretório raiz.

Para publicar uma alteração:

```bash
git add -A && git commit -m "..." && git push
npx vercel deploy --prod --yes
```

O push sozinho já republica o GitHub Pages. O comando da Vercel é
o que atualiza o endereço principal.

## Antes de publicar

Veja a lista completa em `HANDOFF.md`. Os itens que travam a publicação são:

1. Número real do WhatsApp em `assets/app.js` (`CONFIG.whatsapp`)
2. Snippet do Pixel da Meta no `<head>` do `index.html`
3. Endpoint que recebe o lead (`CONFIG.endpoint`)
4. Vídeo da VSL no bloco `id="vsl"`
5. Confirmar nome e função do terceiro integrante da equipe

---

Croma · Estratégia, copy e desenvolvimento
