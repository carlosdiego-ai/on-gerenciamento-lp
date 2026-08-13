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

## 2. Correções de conteúdo feitas nesta versão

O formulário de entrada preenchido pelo Fernando corrigiu dados que estavam errados na versão anterior:

| Antes | Agora | Fonte |
|---|---|---|
| Fundada em 2020 | **Abril de 2021** | Formulário de entrada |
| Mais de 30 obras entregues | **Removido** | Número nunca foi confirmado |
| Ana Flora | **Ana Flora Nalfal**, arquiteta e sócia | Formulário de entrada |
| Equipe genérica | **Oliveira + Nalfal**, origem do nome ON | Formulário de entrada |
| Só residencial | **Residencial e comercial** de alto padrão | Formulário de entrada |
| Adamantina e região | **Região oeste paulista** | Formulário de entrada |

A frase "não competimos por volume, competimos por valor" e a origem do nome vieram direto das palavras do Fernando. São os dois argumentos mais fortes da página e nenhum concorrente da região pode copiar.

---

## 3. Pendências que travam a publicação

| Item | Onde | Situação |
|---|---|---|
| Número do WhatsApp | `assets/app.js`, `CONFIG.whatsapp` | Está `5518000000000`, precisa do real |
| Pixel da Meta | `index.html`, comentário no `<head>` | Colar o snippet com o id da conta |
| Endpoint do lead | `assets/app.js`, `CONFIG.endpoint` | Vazio. Sem ele o lead só vai para o pixel e o WhatsApp |
| **Nome e função do terceiro** | seção `#equipe` | Está como "Rafael, acompanhamento técnico", vindo da apresentação. **Confirmar antes de publicar** |
| Fotos das obras | seção `#obras` | Quatro placeholders, com metragem e prazo a informar |
| CREA e CAU | rodapé | Consta como a informar |
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
