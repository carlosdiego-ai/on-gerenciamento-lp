/**
 * Dashboard da ON — automação da planilha
 *
 * Cola este arquivo inteiro em Extensões > Apps Script, dentro da planilha
 * "Dashboard - ON Gerenciamento de Obras". Depois:
 *
 *   1. Rode a função configurar() uma vez. Ela pede autorização na primeira vez.
 *   2. Implantar > Nova implantação > Tipo: App da Web
 *        Executar como: Eu
 *        Quem pode acessar: Qualquer pessoa
 *   3. Copie a URL que termina em /exec e mande para a Croma.
 *
 * O que ela faz:
 *   - Cria a aba "Respostas LP", onde cada envio do formulário vira uma linha.
 *   - Troca a coluna da etapa 1 de todos os meses por uma contagem automática
 *     dessa aba, dia a dia. Ninguém digita mais esse número.
 *   - Configura o painel para a ON e apaga os dados de teste que vieram do modelo.
 */

const ABA_RESPOSTAS = 'Respostas LP';
const FUSO = 'America/Sao_Paulo';

const CABECALHO = [
  'Data e hora', 'Nome', 'WhatsApp', 'Cidade da obra', 'Projeto',
  'Previsão de início', 'Investimento', 'Página de origem', 'Status', 'Observações',
];
const STATUS = ['Novo', 'Em contato', 'Reunião agendada', 'Análise realizada', 'Contrato fechado', 'Sem resposta', 'Descartado'];

// Nomes do funil da ON. Dá para mudar depois direto na aba CONFIG.
const PAINEL = {
  'CLIENTE': 'ON Gerenciamento de Obras',
  'ETAPA 1 DO FUNIL': 'Leads da LP',
  'ETAPA 2 DO FUNIL': 'Reuniões Agendadas',
  'ETAPA 3 DO FUNIL': 'Análises Realizadas',
  'ETAPA 4 DO FUNIL': 'Contratos Fechados',
  'MÉTRICA DE RECEITA': 'Valor Contratado',
};

/* ------------------------------------------------------------------------ */

function configurar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone(FUSO); // lead das 23h50 não pode cair no dia seguinte

  const aba = criarAbaRespostas_(ss);
  const campos = preencherPainel_(ss);
  const meses = ligarContagemAutomatica_(ss);

  const msg = [
    'Aba "' + aba.getName() + '" pronta.',
    'Painel configurado: ' + campos + ' campos.',
    'Contagem automática ligada em ' + meses.abas + ' meses (' + meses.dias + ' dias).',
    'Dados de teste apagados: ' + meses.limpas + ' células.',
  ].join('\n');
  console.log(msg);
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { /* rodando pelo editor sem UI */ }
}

function criarAbaRespostas_(ss) {
  let aba = ss.getSheetByName(ABA_RESPOSTAS);
  if (!aba) aba = ss.insertSheet(ABA_RESPOSTAS, 1);

  aba.getRange(1, 1, 1, CABECALHO.length)
    .setValues([CABECALHO])
    .setFontWeight('bold').setBackground('#1C1B19').setFontColor('#D9B877');
  aba.setFrozenRows(1);
  aba.getRange('A2:A').setNumberFormat('dd/MM/yyyy HH:mm');
  aba.getRange('C2:C').setNumberFormat('@');

  const validacao = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS, true).setAllowInvalid(false).build();
  aba.getRange(2, 9, aba.getMaxRows() - 1, 1).setDataValidation(validacao);

  [150, 200, 140, 170, 160, 150, 170, 220, 150, 260]
    .forEach(function (w, i) { aba.setColumnWidth(i + 1, w); });
  return aba;
}

function preencherPainel_(ss) {
  let feitos = 0;
  Object.keys(PAINEL).forEach(function (rotulo) {
    const celula = ss.createTextFinder(rotulo).matchEntireCell(true).findNext();
    if (!celula) {
      console.error('[painel] rótulo não encontrado na CONFIG:', rotulo);
      return;
    }
    celula.offset(0, 1).setValue(PAINEL[rotulo]);
    feitos++;
  });
  return feitos;
}

function ligarContagemAutomatica_(ss) {
  const resultado = { abas: 0, dias: 0, limpas: 0 };

  ss.getSheets().forEach(function (aba) {
    if (aba.getName() === ABA_RESPOSTAS) return;
    const marco = aba.createTextFinder('PREENCHIMENTO DIÁRIO').findNext();
    if (!marco) return;

    // Cabeçalho "Data" logo abaixo do título do bloco diário
    const cab = aba.getRange(marco.getRow() + 1, 1, 3, aba.getLastColumn())
      .createTextFinder('Data').matchEntireCell(true).findNext();
    if (!cab) {
      console.error('[meses] aba sem cabeçalho Data:', aba.getName());
      return;
    }

    const colData = cab.getColumn();
    const ini = cab.getRow() + 1;
    let fim = ini;
    while (aba.getRange(fim, colData).getValue() instanceof Date) fim++;
    const dias = fim - ini;
    if (dias < 28) {
      console.error('[meses] tabela diária curta demais em', aba.getName(), dias);
      return;
    }

    // Etapa 1: conta as linhas de Respostas LP daquele dia
    aba.getRange(ini, colData + 1, dias, 1).setFormulaR1C1(
      "=COUNTIFS('" + ABA_RESPOSTAS + "'!C1,\">=\"&RC[-1],'" + ABA_RESPOSTAS + "'!C1,\"<\"&(RC[-1]+1))"
    ).setBackground('#EFE7D6').setNote('Automático: vem da aba ' + ABA_RESPOSTAS + '. Não digite aqui.');

    // Apaga só valores digitados (nunca fórmula) nas outras colunas amarelas
    resultado.limpas += limparDigitados_(aba.getRange(ini, colData + 2, dias, 5));

    // Investimento semanal: só as colunas SEM 1 a SEM 5
    const inv = aba.createTextFinder('INVESTIMENTO').matchEntireCell(true).findNext();
    const indic = aba.createTextFinder('INDICADOR').matchEntireCell(true).findNext();
    if (inv && indic) {
      const rotulos = aba.getRange(indic.getRow(), 1, 1, aba.getLastColumn()).getDisplayValues()[0];
      rotulos.forEach(function (r, i) {
        if (/^SEM\s*\d/i.test(r)) resultado.limpas += limparDigitados_(aba.getRange(inv.getRow(), i + 1));
      });
    }

    resultado.abas++;
    resultado.dias += dias;
  });
  return resultado;
}

function limparDigitados_(range) {
  const formulas = range.getFormulas();
  const valores = range.getValues();
  let n = 0;
  for (let r = 0; r < valores.length; r++) {
    for (let c = 0; c < valores[r].length; c++) {
      if (!formulas[r][c] && valores[r][c] !== '') {
        range.getCell(r + 1, c + 1).clearContent();
        n++;
      }
    }
  }
  return n;
}

/* ------------------------------------------------------------------------
   RECEBE O FORMULÁRIO DA LP
   A LP manda o corpo como text/plain, porque o Apps Script não responde ao
   preflight de CORS que um application/json dispararia.
   ------------------------------------------------------------------------ */

function doPost(e) {
  const trava = LockService.getScriptLock();
  try {
    trava.waitLock(10000);
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    const nome = limpar_(d.nome, 120);
    const whats = String(d.whatsapp || '').replace(/\D/g, '');
    if (nome.length < 2 || whats.length < 10 || whats.length > 13) {
      console.error('[doPost] envio inválido:', JSON.stringify(d).slice(0, 300));
      return resposta_({ ok: false, erro: 'dados inválidos' });
    }

    // Duplo clique no botão não vira dois leads
    const cache = CacheService.getScriptCache();
    const chave = 'lead_' + whats;
    if (cache.get(chave)) return resposta_({ ok: true, duplicado: true });
    cache.put(chave, '1', 600);

    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_RESPOSTAS).appendRow([
      new Date(),
      nome,
      formatarWhats_(whats),
      limpar_(d.cidade, 80),
      limpar_(d.projeto, 80),
      limpar_(d.inicio, 80),
      limpar_(d.investimento, 80),
      limpar_(d.origem, 300),
      'Novo',
      '',
    ]);
    return resposta_({ ok: true });
  } catch (err) {
    console.error('[doPost] falhou:', err, e && e.postData && e.postData.contents);
    return resposta_({ ok: false, erro: 'falha interna' });
  } finally {
    try { trava.releaseLock(); } catch (x) { /* trava não chegou a ser pega */ }
  }
}

// Abrir a URL /exec no navegador confirma que a implantação está no ar
function doGet() {
  return resposta_({ ok: true, servico: 'Dashboard ON — Respostas LP' });
}

// Texto que começa com = + - @ vira fórmula na planilha. Um lead mal
// intencionado poderia injetar IMPORTRANGE ou HYPERLINK. O apóstrofo neutraliza.
function limpar_(v, max) {
  let s = String(v == null ? '' : v).replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function formatarWhats_(d) {
  if (d.length === 13 && d.indexOf('55') === 0) d = d.slice(2);
  if (d.length === 11) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  if (d.length === 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
  return d;
}

function resposta_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
