# ON Gerenciamento de Obras — Landing Page

Versão local, agosto de 2026. Abra o `index.html` no navegador, não precisa de servidor nem de build.

```
index.html              página completa
assets/styles.css       design tokens e componentes
assets/app.js           máscara, validação, pixel e CTA fixo
assets/img/             logo oficial e retratos otimizados
```

---

## 1. Onde entra a VSL

O espaço está no hero, na `div` com `id="vsl"`.

1. Apague o bloco `<div class="vsl__placeholder">` inteiro.
2. Descomente **uma** das opções já prontas no arquivo:
   - **A**, arquivo local: vídeo em `assets/vsl.mp4` e capa em `assets/img/vsl-capa.jpg`.
   - **B**, YouTube ou Vimeo não listado: troque `ID_DO_VIDEO`.
3. O quadro volta sozinho para 16:9 no celular e o evento `ViewContent` dispara na metade do vídeo.

Enquanto o vídeo não chega, o play leva ao formulário. A página já converte hoje.

---

## 2. Rastreamento

O **pixel da Meta, ID `2072411560304254`**, está instalado no `<head>` e dispara o `PageView`. O `<noscript>` correspondente fica no início do `<body>`, não no `<head>`, porque dentro do head só valem `link`, `style` e `meta`.

Todo o resto sai do `app.js` pela função `track()`, que chama `fbq` quando ele existe e escreve no console quando não existe. Nenhum evento fica preso a HTML.

| Evento | Quando dispara | Parâmetro |
|---|---|---|
| `PageView` | Carga da página | — |
| `ViewContent` | VSL iniciada, aos 50% e ao terminar | `content_name` |
| `InitiateCheckout` | Clique em qualquer CTA e primeiro toque no formulário | `origem` |
| `Lead` | Envio do formulário | `content_name`, `cidade` |
| `Contact` | Clique no WhatsApp depois do envio | `origem` |

`InitiateCheckout` mede intenção, não uma etapa única, então o mesmo visitante pode gerar mais de um. É de propósito. Para otimização de campanha use `Lead`, que é um por envio.

Validado com o `fbevents.js` trocado por um stub, para a fila do `fbq` ficar intacta e ser lida depois. A sequência observada foi `init`, `PageView`, `InitiateCheckout {origem: header}`, `ViewContent {content_name: VSL iniciada}` e `InitiateCheckout {origem: formulario}`.

**Não há aviso de cookies na página.** Se a ON quiser cobrir a LGPD com um banner de consentimento, é preciso decidir se o pixel só carrega depois do aceite, o que muda a instalação.

---

## 2. A VSL

Hospedada no **Wistia**, media-id `c3tgrzrn39`, 5min57s. Para trocar o vídeo, mude o media-id em dois lugares: na tag `<wistia-player>` e no `<script src="https://fast.wistia.com/embed/{id}.js">` no fim do `index.html`.

### Abre mudo e pede o som

O player abre com `autoplay` e `muted`, e a camada `.vsl__som` cobre tudo com o ícone dourado pulsando e o texto "Seu vídeo já começou / Toque para ouvir". O toque liga o áudio e volta ao início, para o lead ouvir o gancho desde a primeira palavra.

A ordem dentro do clique importa: `play()` sai **antes** do `currentTime = 0`, porque o iOS exige que o play aconteça ainda dentro do gesto do usuário. Inverter isso quebra no iPhone.

### Controles que tiram o visitante da página

Desligados por atributo: `settings-control`, `fullscreen-button`, `small-play-button` e `copy-link-and-thumbnail-enabled`. Sobram a barra de progresso e o volume, que aparecem no hover.

### Duas coisas medidas neste player, e que contrariam o esperado

1. **A legenda não liga por atributo.** `captions-visible-on-load` não faz nada aqui. Liga pela propriedade `captionsEnabled = true`, e só depois do evento `api-ready`.
2. **Dos eventos, só `api-ready` dispara.** Nem `play`, nem `timeupdate`, nem `secondchange` chegam ao elemento. Por isso o progresso é lido de `currentTime` num `setInterval` de 2s, que só começa depois que o som liga e se encerra no fim do vídeo. A antiga rede de segurança pelo `window._wq` foi removida: ela nunca disparava, o `onReady` não é chamado com o web component.

O idioma da legenda vem como objeto, com `wistiaLanguageCode` (`por`) e `bcp47LanguageTag` (`pt`). Hoje só existe português, então o código só escolhe explicitamente quando houver mais de uma faixa.

### Eventos de audiência

| Evento | Quando |
|---|---|
| `ViewContent` · VSL com som | Toque na camada, ou tirar o mudo pelo controle do player |
| `ViewContent` · VSL 50% | Metade do vídeo, contada só depois do som ligado |
| `ViewContent` · VSL concluida | Fim do vídeo |

**Autoplay mudo não dispara evento nenhum.** Se disparasse, o pixel receberia um `ViewContent` em toda visita e o dado não valeria nada.

**Não confirmado em headless:** a retomada da reprodução depois do toque. O Chrome headless desta máquina não sobe o display link do macOS e não decodifica vídeo, então `paused` fica `true` mesmo sem o `play()` ser recusado. Conferir em aparelho real.

**Pendente no painel do Wistia:** o botão de play grande ainda é o retângulo arredondado padrão. Dá para trocar por um círculo em Customize.

---

## 3. Pendências que travam a publicação

| Item | Onde | Situação |
|---|---|---|
| Número do WhatsApp | `assets/app.js`, `CONFIG.whatsapp` | Está `5518000000000`, precisa do real |
| Pixel da Meta | `index.html`, comentário no `<head>` | Colar o snippet com o id da conta |
| Endpoint do lead | `assets/app.js`, `CONFIG.endpoint` | Vazio. Sem ele o lead só vai para o pixel e o WhatsApp |
| **Nome e função do terceiro** | seção `#equipe` | Está como "Rafael, acompanhamento técnico", vindo da apresentação. **Confirmar antes de publicar** |
| Fotos das obras | seção `#obras` | Quatro placeholders, com metragem e prazo a informar |
| CAU (arquitetura) | rodapé | A informar. O CREA 2331836-SP já está publicado |
| Política de privacidade | rodapé e formulário | Link aponta para âncora vazia |
| Número de obras entregues | vários | Se a ON confirmar, entra na faixa de credenciais |

CNPJ 38.405.442/0001-90 já está no rodapé, veio do registro público.

---

## 4. Design system

### Cores, extraídas da logo oficial

Amostrei o arquivo da marca. O anel do monograma é bronze e a letra N é grafite. A paleta inteira sai daí.

| Token | Valor | Uso |
|---|---|---|
| `--bronze` | `#736146` | Cor real do anel do logo. Detalhes e bordas |
| `--graphite` | `#4D4D4D` | Cor real da letra N |
| `--gold` | `#D9B877` | Ação. Único tom saturado da página |
| `--ink` | `#1C1B19` | Fundo mais escuro, rodapé, botão escuro |
| `--dark` | `#2A2926` | Seções âncora |
| `--paper` | `#F5F2EC` | Fundo claro, quente para combinar com o bronze |
| `--sand` | `#EBE5D8` | Seção alternada e badges |

O dourado aparece só em elementos de ação e em números. Quando existe uma única cor saturada, ela vira o ponto focal e o olho vai direto para o botão.

### Contraste, medido

| Combinação | Razão | Nível |
|---|---|---|
| Texto do botão sobre dourado | 9,1:1 | AAA |
| Dourado sobre grafite | 7,7:1 | AAA |
| Branco sobre grafite | 14,6:1 | AAA |
| Corpo sobre paper | 10,5:1 | AAA |
| Apoio sobre paper | 6,3:1 | AA |
| Bronze como texto sobre paper | 5,3:1 | AA |

### Tipografia

**Fraunces** nos títulos, uma serifada com eixo óptico variável que dá o tom de patrimônio e alto padrão sem parecer antiquada. O itálico dela carrega os destaques em bronze.
**Inter** no corpo, 16 a 18px, porque o público tem de 35 a 55 anos e lê no celular.

### Componentes vindos da referência que você enviou

- Página como um cartão, com cantos arredondados sobre o fundo escuro.
- Pill de rótulo antes de cada título, com ponto colorido.
- Título com a segunda metade em itálico e em cor de acento.
- Cards com numeração em badge quadrado (01 a 04) no Método ON.
- Fotos da equipe com legenda sobreposta em gradiente.
- Botões pill com o ícone de seta diagonal no círculo.
- Card escuro de destaque dentro do mosaico, no lugar do contador de projetos da referência.

### Espaço e forma

Base de 4px. Raio de 8 a 30px. O raio grande é o que dá o ar contemporâneo da referência sem perder a sobriedade.

---

## 5. Acessibilidade e qualidade, verificado

- Sem rolagem horizontal em 375, 768, 1024 e 1440.
- Todos os alvos de toque com 44px ou mais.
- Todo campo tem label associado, e o erro é anunciado por `aria-describedby` e `aria-invalid`.
- Nenhuma imagem sem alt. A logo decorativa do header está marcada como `aria-hidden`.
- Foco visível em tudo que é navegável por teclado.
- `prefers-reduced-motion` respeitado.
- Ícones em SVG, nenhum emoji.
- O conteúdo aparece mesmo se o JavaScript falhar.
- Formulário testado: envio vazio bloqueia com seis erros, a máscara formata telefone colado de qualquer jeito, o envio válido mostra a confirmação e monta a mensagem do WhatsApp.
- Fotos otimizadas: os retratos saíram de 16 MB para cerca de 110 KB cada.

---

## 6. Antes de subir para produção

1. Preencher as pendências da seção 3.
2. Trocar os placeholders do portfólio por fotos reais, em WebP e abaixo de 300 KB.
3. Testar o pixel no Gerenciador de Eventos da Meta.
4. Conferir que a página abre em menos de 3 segundos no 4G.
5. Fazer um envio de teste e cronometrar quanto tempo o aviso leva para chegar em quem atende. A página promete resposta em 1 hora útil.

---

Estratégia, copy e construção: Croma.

---

## 7. O fundo que se constrói

O fundo não é chapado: tem duas camadas.

**Malha técnica.** O `.shell` recebe um papel milimetrado de 56px em bronze a 4,5% de opacidade, mais um brilho radial no topo. Dá textura de prancheta sem competir com o texto.

**A planta progressiva.** Uma elevação arquitetônica em traço de blueprint, fixa no fundo da viewport, que vai sendo desenhada conforme a pessoa rola a página. São 8 etapas na ordem real de uma obra:

| Etapa | O que aparece | Faixa da rolagem |
|---|---|---|
| 1 | Terreno, linha do solo e eixos | 4% a 15% |
| 2 | Sapatas e baldrame, com hachura | 15% a 26% |
| 3 | Pilares do térreo | 26% a 37% |
| 4 | Laje do térreo | 37% a 48% |
| 5 | Pavimento superior | 48% a 59% |
| 6 | Cobertura com beiral | 59% a 70% |
| 7 | Esquadrias e vãos de vidro | 70% a 81% |
| 8 | Cotas, norte e paisagismo | 81% a 92% |

Quem chega no formulário vê a casa pronta. É a promessa da página contada em desenho.

**Como funciona:** cada traço tem `stroke-dasharray` igual ao próprio comprimento e o `stroke-dashoffset` é interpolado pelo progresso da rolagem, dentro do `requestAnimationFrame` que já controlava o header e a barra de progresso. Nenhum listener novo.

**Para ajustar sem rolar a página**, abra o console e chame:

```js
ONPlanta.desenhar(0)     // terreno limpo
ONPlanta.desenhar(0.5)   // metade da obra
ONPlanta.desenhar(1)     // casa pronta
```

**Para editar o desenho:** o SVG está inline no `index.html`, logo depois de `<div class="shell">`. Cada etapa é um `<g data-etapa="...">`. Acrescentar ou remover grupos muda automaticamente o número de faixas, o JS se adapta.

No celular a planta cai para 16% de opacidade e alarga, para virar textura em vez de desenho. Com `prefers-reduced-motion` ela aparece inteira, sem animar. Na impressão, some.


---

## 8. Refino de densidade, agosto de 2026

A primeira versão tinha texto demais para uma página de captação. Medi e cortei.

| Métrica | Antes | Depois |
|---|---|---|
| Palavras na página | 1.267 | 965 |
| Tempo de leitura | 6,3 min | 4,8 min |
| Seções | 12 | 11 |
| Parágrafos acima de 28 palavras | 4 (um com 47) | 0 |
| Densidade da seção Sobre | 18,0 palavras por 100px | 11,3 |

**O que saiu:**

- A seção Resultado foi fundida em Diferenciais. As duas respondiam a mesma pergunta com 10 cards no total; hoje são 4, e cada um junta o diferencial com o ganho que ele gera.
- A seção Sobre repetia literalmente, em uma lista, o que os cards ao lado já diziam sobre não vender material e não receber comissão. A duplicação saiu.
- Para quem é passou de 5 para 4 itens na coluna afirmativa.
- Todos os textos de apoio foram reescritos para caber em uma ou duas linhas.

**O que ganhou ar:**

- Espaçamento vertical das seções subiu um degrau na escala, de 4rem para 5,5rem no celular e de 5,5rem para 7rem no desktop.
- A medida de leitura dos textos de apoio caiu de 60 para 46 caracteres, e a dos títulos de 20 para 16.
- Texto dentro de card limitado a 34 caracteres por linha.
- Mais respiro entre o cabeçalho de cada seção e o conteúdo dela.

Critério usado para decidir o que cortar: se a frase não muda a decisão de preencher o formulário, ela sai. O que sobrou é específico e verificável, no lugar de adjetivo.

---

## 9. Carrossel de obras e Instagram

A seção de portfólio virou um carrossel que passa sozinho.

### As fotos vêm do Instagram

As seis imagens do carrossel são posts reais de @ongerenciamento, baixados e servidos localmente em `assets/img/obra-01.jpg` até `obra-06.jpg`.

Servir local em vez de apontar para o Instagram é intencional: as URLs do CDN da Meta carregam token de expiração e quebrariam em poucos dias se usadas direto na página.

**Para atualizar quando a ON postar coisa nova:**

```bash
bash ferramentas/atualizar-instagram.sh
```

O script busca os posts mais recentes, baixa, corta em 4:5, otimiza e substitui os arquivos. Depois é só ajustar título, texto e link de cada card em `CONFIG.instagram` no `assets/app.js` e fazer commit.

Para trocar uma foto pontualmente, basta salvar o arquivo por cima com o mesmo nome. Se algum arquivo faltar, aquele card mostra a moldura de espera em vez de imagem quebrada.

### Como trocar os textos

Abra `assets/app.js` e edite a lista `CONFIG.instagram`. Cada item aceita:

| Campo | Para que serve |
|---|---|
| `foto` | Caminho da imagem em `assets/img/`. Vazio mostra a moldura de espera com o nome da foto que falta |
| `titulo` | Nome da obra ou do conteúdo |
| `texto` | Uma linha de contexto |
| `tipo` | Rótulo do canto: Obra entregue, Bastidor, Reels |
| `link` | Endereço do post no Instagram. Com link, o card vira clicável |

Para publicar uma foto real: coloque o arquivo em `assets/img/`, de preferência em 4:5 e abaixo de 300 KB, e aponte o campo `foto`.

### Comportamento

Rolagem nativa com scroll-snap, então **arrastar com o dedo funciona mesmo sem JavaScript**. O JavaScript acrescenta as setas, os indicadores, a navegação por teclado com as setas do teclado e o avanço automático a cada 5,2 segundos.

O avanço pausa sozinho quando o ponteiro entra, quando algum elemento recebe foco, ao tocar na tela e quando a aba fica em segundo plano. Com `prefers-reduced-motion` o avanço não liga.

Os indicadores seguem as **posições de parada**, não a quantidade de slides. Com 6 slides e 3 visíveis no desktop existem 4 paradas reais, então aparecem 4 indicadores. No tablet aparecem 5. Eles se refazem sozinhos quando a janela muda de largura.

Para ajustar ou desligar o avanço automático, mude `CONFIG.feedAutoplay`. O valor é em milissegundos e `0` desliga.

### Sobre puxar o Instagram automaticamente

Não é possível hoje sem credencial. A Basic Display API foi desligada pela Meta no fim de 2024, e a Graph API exige conta Instagram Business vinculada a uma página do Facebook, um app no Meta for Developers e um token de longa duração renovado a cada 60 dias. Raspar o site quebra em semanas e arrisca bloqueio.

O código já está preparado. Quando existir um endereço que devolva os posts em JSON, basta acrescentar em `CONFIG`:

```js
feedEndpoint: 'https://seu-endpoint/instagram'
```

A função `carregarFeed()` consome o formato padrão da Graph API, com os campos `media_url`, `thumbnail_url`, `caption`, `media_type` e `permalink`. Se o endereço falhar ou devolver vazio, ela cai de volta na lista local sem quebrar a página.

O endereço precisa ser um intermediário seu, não a Meta direto, porque o token nunca pode ficar exposto no navegador.

### Para inspecionar

```js
ONCarrossel.total()      // quantos slides
ONCarrossel.atual()      // posição atual
ONCarrossel.irPara(2)    // vai para a terceira parada
ONCarrossel.parar()      // desliga o avanço automático
```


---

## 10. O ano da ON

A página diz **desde 2020**, e é assim que fica em toda a comunicação.

A dupla passou a atuar como ON em 2020. O CNPJ só foi aberto em 2021, o que explica a divergência: o formulário de entrada registrava a data de abertura da empresa, não a data em que a ON começou a operar. Fernando esclareceu isso em 18 de agosto de 2026.

Por isso a credencial abaixo do hero diz "Atuando em Adamantina" em vez de "Fundada em Adamantina": o verbo acompanha o fato. Fundação jurídica é 2021, atuação é 2020, e o que interessa para quem vai contratar é há quanto tempo a ON toca obra.

Os roteiros da VSL e dos anúncios já usavam 2020 e não precisaram de ajuste.


---

## 11. Cache dos arquivos

Em 20 de agosto de 2026 o site aparecia quebrado no navegador mesmo com a versão certa publicada. A causa era a política de cache original, que marcava todos os assets como `immutable` por um ano.

`immutable` diz ao navegador para nunca revalidar, nem com F5. Como os arquivos têm nome fixo, quem já tinha visitado o site ficava preso na versão antiga do CSS e do JS, enquanto o HTML vinha novo. Resultado: layout sem estilo e carrossel vazio.

**Como está agora:**

| Arquivo | Cache | Motivo |
|---|---|---|
| `index.html` | sempre revalida | precisa entregar as URLs novas dos assets |
| `styles.css`, `app.js` | 1 ano, immutable | seguro, porque levam `?v=<hash>` na URL |
| `assets/img/` | 1 hora + revalidação em segundo plano | as fotos são substituídas com o mesmo nome quando o feed é atualizado |

**Antes de cada deploy, rode:**

```bash
bash ferramentas/versionar-assets.sh
```

Ele calcula o hash do conteúdo de `styles.css` e `app.js` e injeta na referência dentro do `index.html`. Se o conteúdo mudou, a URL muda e o navegador busca de novo sozinho. Se não mudou, nada acontece.

Esquecer esse passo não quebra o site, mas faz visitantes antigos continuarem vendo a versão anterior do CSS e do JS.
