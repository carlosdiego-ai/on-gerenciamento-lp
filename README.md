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

Site estático. Na Vercel, importe o repositório e use:

- Framework Preset: **Other**
- Build Command: vazio
- Output Directory: `.`

## Antes de publicar

Veja a lista completa em `HANDOFF.md`. Os itens que travam a publicação são:

1. Número real do WhatsApp em `assets/app.js` (`CONFIG.whatsapp`)
2. Snippet do Pixel da Meta no `<head>` do `index.html`
3. Endpoint que recebe o lead (`CONFIG.endpoint`)
4. Vídeo da VSL no bloco `id="vsl"`
5. Confirmar nome e função do terceiro integrante da equipe

---

Croma · Estratégia, copy e desenvolvimento
