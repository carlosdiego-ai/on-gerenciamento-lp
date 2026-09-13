/**
 * Dashboard da ON — automação da planilha
 *
 * Cola este arquivo inteiro em Extensões > Apps Script, dentro da planilha
 * "Dashboard - ON Gerenciamento de Obras", substituindo o que houver lá.
 *
 *   1. Salve e rode a função configurar(). Na primeira vez o Google pede
 *      autorização: Revisar permissões > sua conta > Avançado > Acessar.
 *   2. O App da Web PRECISA estar com "Quem pode acessar: Qualquer pessoa".
 *      Para mudar sem trocar a URL: Implantar > Gerenciar implantações >
 *      lápis > Quem pode acessar: Qualquer pessoa > Implantar.
 *      Com "Somente eu" ou "Qualquer pessoa com Conta do Google", o Google
 *      devolve 401 para o site e nenhum lead chega.
 *
 * O que ela faz, e pode rodar quantas vezes quiser:
 *   - Cria a aba "Respostas LP", onde cada envio do formulário vira uma linha.
 *   - Troca a coluna da etapa 1 de todos os meses por uma contagem automática
 *     dessa aba, dia a dia.
 *
 * O que ela NÃO faz: não mexe nos nomes do funil nem apaga nenhum valor.
 * Nomes do funil e cliente ficam na aba CONFIG, preenchidos por quem usa.
 */

const ABA_RESPOSTAS = 'Respostas LP';
const FUSO = 'America/Sao_Paulo';

const CABECALHO = [
  'Data e hora', 'Nome', 'WhatsApp', 'Cidade da obra', 'Projeto',
  'Previsão de início', 'Investimento', 'Página de origem', 'Status', 'Observações',
];

// Acompanha o funil que está na CONFIG: Cadastros > Negociação > Proposta Feita > Vendas
const STATUS = ['Novo', 'Em negociação', 'Proposta feita', 'Venda fechada', 'Sem resposta', 'Descartado'];

/* ------------------------------------------------------------------------ */

function configurar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone(FUSO); // lead das 23h50 não pode cair no dia seguinte

  const aba = criarAbaRespostas_(ss);
  const meses = ligarContagemAutomatica_(ss);

  const msg = [
    'Aba "' + aba.getName() + '" pronta.',
    'Contagem automática ligada em ' + meses.abas + ' meses (' + meses.dias + ' dias)' +
      (meses.separador ? ', separador "' + meses.separador + '".' : '.'),
    meses.erros ? 'ERRO: ' + meses.erros + ' células ficaram com fórmula quebrada. Mande um print do registro de execução para a Croma.'
      : meses.abas === 12 ? 'Tudo certo, sem nenhuma célula com erro.'
      : 'ATENÇÃO: eram esperados 12 meses. Veja o registro de execução.',
  ].join('\n');
  console.log(msg);
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { /* rodando sem interface */ }
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
    .requireValueInList(STATUS, true).setAllowInvalid(true).build();
  aba.getRange(2, 9, aba.getMaxRows() - 1, 1).setDataValidation(validacao);

  [150, 200, 140, 170, 160, 150, 170, 220, 150, 260]
    .forEach(function (w, i) { aba.setColumnWidth(i + 1, w); });
  return aba;
}

function ligarContagemAutomatica_(ss) {
  const resultado = { abas: 0, dias: 0, erros: 0, separador: '' };

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

    // Etapa 1: conta as linhas de Respostas LP daquele dia.
    //
    // A fórmula entra como texto e quem interpreta é a planilha, no idioma
    // dela. Em português do Brasil o separador de argumentos é ponto e
    // vírgula; em inglês é vírgula. Com o separador errado, todas as células
    // viram #ERROR! e o erro contamina o total do mês e o dashboard anual.
    // Por isso tenta vírgula, confere, e se quebrar refaz com ponto e vírgula.
    const letra = aba.getRange(ini, colData).getA1Notation().replace(/\d+/g, '');
    const col = "'" + ABA_RESPOSTAS + "'!$A:$A";
    const alvo = aba.getRange(ini, colData + 1, dias, 1);

    const tentativa = function (sep) {
      const formulas = [];
      for (let r = ini; r < fim; r++) {
        const dia = letra + r;
        formulas.push(['=COUNTIFS(' + col + sep + '">="&' + dia + sep + col + sep + '"<"&(' + dia + '+1))']);
      }
      alvo.setFormulas(formulas);
      SpreadsheetApp.flush();
      const vistos = alvo.getDisplayValues();
      const quebradas = vistos.filter(function (l) { return String(l[0]).charAt(0) === '#'; }).length;
      return { sep: sep, quebradas: quebradas, exemplo: formulas[0][0], valor: vistos[0][0] };
    };

    let t = tentativa(',');
    if (t.quebradas) t = tentativa(';');

    alvo.setBackground('#EFE7D6')
      .setNote('Automático: vem da aba ' + ABA_RESPOSTAS + '. Não digite aqui.');

    if (t.quebradas) {
      console.error('[meses] fórmula com erro em', aba.getName(), t.quebradas, 'células com os dois separadores.',
        'Mostra:', t.valor, 'Fórmula:', t.exemplo, 'Idioma da planilha:', ss.getSpreadsheetLocale());
      resultado.erros += t.quebradas;
    } else {
      resultado.separador = t.sep;
    }

    resultado.abas++;
    resultado.dias += dias;
  });
  return resultado;
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

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    // Se alguém esquecer de rodar configurar(), o lead não se perde
    const aba = ss.getSheetByName(ABA_RESPOSTAS) || criarAbaRespostas_(ss);
    aba.appendRow([
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
    cache.put(chave, '1', 600); // só marca depois de gravar
    return resposta_({ ok: true });
  } catch (err) {
    console.error('[doPost] falhou:', err, e && e.postData && e.postData.contents);
    return resposta_({ ok: false, erro: 'falha interna' });
  } finally {
    try { trava.releaseLock(); } catch (x) { /* trava não chegou a ser pega */ }
  }
}

// Abrir a URL /exec no navegador confirma que a implantação está pública
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
