/**
 * Simulador de Parcelamento PagBank - PbIntegracoes
 * Embeddable: inclua o script e chame PagBankSimulador.init({ container: '#pagbank-simulador' })
 */
(function (global) {
  'use strict';

  var TAXA_PIX = 0.0099;
  var TARIFA_BOLETO = 1.99;
  var TAXA_CARTAO_14 = 0.0397;
  var TAXA_CARTAO_30 = 0.0305;
  var TAXA_PARCELAMENTO_MENSAL = 0.0349;

  /**
   * Fator de valor presente de anuidade: a(n,i) = [(1+i)^n - 1] / [i*(1+i)^n]
   * Valor presente de n parcelas iguais de 1 = a(n,i).
   */
  function fatorVPAnuidade(i, n) {
    if (n <= 0) return 0;
    var factor = Math.pow(1 + i, n);
    return (factor - 1) / (i * factor);
  }

  /**
   * Tabela Price: PMT = PV * [i * (1 + i)^n] / [(1 + i)^n - 1]
   * (Usado quando o comprador paga juros; quando o lojista assume, o comprador paga PV/n.)
   */
  function pmt(pv, i, n) {
    if (n <= 0) return 0;
    var factor = Math.pow(1 + i, n);
    return pv * (i * factor) / (factor - 1);
  }

  function round2(value) {
    return Math.round(value * 100) / 100;
  }

  function formatBRL(value) {
    return 'R$ ' + value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function calcPix(valorVenda) {
    return round2(valorVenda * (1 - TAXA_PIX));
  }

  function calcBoleto(valorVenda) {
    return round2(valorVenda - TARIFA_BOLETO);
  }

  function calcCartaoVista(valorVenda, recebimento14Dias) {
    var taxa = recebimento14Dias ? TAXA_CARTAO_14 : TAXA_CARTAO_30;
    return round2(valorVenda * (1 - taxa));
  }

  /**
   * Valor com acréscimo (Excel): =IF(n>N, PMT(B8, n-N, -B3)*(n-N), B3)
   * n > N: PMT(i, n-N, PV) * (n-N). n <= N: PV.
   */
  function valorComAcrescimo(pv, n, N, i) {
    if (n > N) return round2(pmt(pv, i, n - N) * (n - N));
    return pv;
  }

  /**
   * Parcelado — réplica das fórmulas do Excel.
   * Tx Parcel: n=1 → 0. n>=2: =MIN(-(D22+PV($B$7;A22;D22/A22))-C22;0)
   * Ou seja: PV usa sempre D22/A22 (valor da venda / número de parcelas), em todas as parcelas.
   * No Excel, PV(rate;nper;pmt) retorna valor negativo; C22 (Tx Comprador) está na coluna "(-) Tx Comprador", ou seja, é armazenado como negativo (-3,49).
   * Então -C22 na fórmula = -(-3,49) = +3,49. Por isso: formulaMin = -(PV+PV_excel) + txComprador (somamos o valor da Tx Comprador).
   */
  function calcParcelado(valorVenda, n, N, taxaIntermed) {
    if (n <= 1) return null;
    var i = TAXA_PARCELAMENTO_MENSAL;
    var pv = valorVenda;
    var viComAcrescimo = valorComAcrescimo(pv, n, N, i);
    var txComprador = round2(viComAcrescimo - pv);
    var a = fatorVPAnuidade(i, n);
    var pmtUsadoVP = pv / n;
    var vpParcelas = round2(pmtUsadoVP * a);
    var pvExcel = -vpParcelas;
    var formulaMin = round2(-(pv + pvExcel) + txComprador);
    var excelCell = formulaMin;
    var txParcelCusto = n === 1 ? 0 : round2(excelCell <= 0 ? Math.abs(excelCell) : 0);
    if (N === 1 && n >= 2) txParcelCusto = 0;
    var intermed = round2(pv * taxaIntermed);
    var liquido = round2(pv - txParcelCusto - intermed);
    var parcelaExibir = N === 1 && n >= 2 ? round2(pmt(pv, i, n)) : (n <= N ? round2(pv / n) : round2(viComAcrescimo / n));
    return {
      liquido: liquido,
      parcela: parcelaExibir,
      txParcel: txParcelCusto,
      txComprador: txComprador,
      n: n
    };
  }

  function getStyles() {
    return [
      '.pb-sim { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0 auto; padding: 1rem; box-sizing: border-box; }',
      '.pb-sim * { box-sizing: border-box; }',
      '.pb-sim h2 { margin: 0 0 1rem; font-size: 1.25rem; }',
      '.pb-sim label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; }',
      '.pb-sim input[type="number"], .pb-sim input[type="text"], .pb-sim select { width: 100%; padding: 0.5rem; margin-bottom: 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; }',
      '.pb-sim .pb-sim-row { display: flex; gap: 1rem; flex-wrap: wrap; }',
      '.pb-sim .pb-sim-field { flex: 1; min-width: 120px; }',
      '.pb-sim .pb-sim-aviso { background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 0.75rem; border-radius: 4px; font-size: 0.8rem; margin-bottom: 1rem; }',
      '.pb-sim table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; font-size: 0.9rem; }',
      '.pb-sim th, .pb-sim td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #eee; }',
      '.pb-sim th { font-weight: 600; }',
      '.pb-sim .pb-sim-valor { text-align: right; font-variant-numeric: tabular-nums; }',
      '.pb-sim .pb-sim-receb { font-size: 0.75rem; color: #666; }',
      '.pb-sim-table.pb-sim-col-extra-hidden th.pb-sim-col-extra, .pb-sim-table.pb-sim-col-extra-hidden td.pb-sim-col-extra { display: none; }',
      '.pb-sim-toggle { font-size: 0.85rem; color: #666; cursor: pointer; user-select: none; margin-bottom: 0.25rem; }',
      '.pb-sim-toggle:hover { color: #000; }'
    ].join('\n');
  }

  /** Gera apenas as linhas da tabela (tbody) a partir do state. */
  function buildTableRows(state) {
    var valor = state.valorVenda;
    var receb14 = state.recebimento14Dias;
    var taxaIntermed = receb14 ? TAXA_CARTAO_14 : TAXA_CARTAO_30;
    var ateN = state.ateNxSemAcrescimo;
    var rows = [
      { label: 'PIX', liquido: calcPix(valor), receb: 'Na hora', parcela: null },
      { label: 'Boleto', liquido: calcBoleto(valor), receb: 'Em 2 dias', parcela: null },
      { label: 'Cartão à vista', liquido: calcCartaoVista(valor, receb14), receb: receb14 ? 'Em 14 dias' : 'Em 30 dias', parcela: null }
    ];
    for (var n = 2; n <= 12; n++) {
      var r = calcParcelado(valor, n, ateN, taxaIntermed);
      if (r) rows.push({ label: n + 'x', liquido: r.liquido, receb: receb14 ? 'Em 14 dias' : 'Em 30 dias', parcela: r.parcela, txParcel: r.txParcel, txComprador: r.txComprador });
    }
    return rows.map(function (row) {
      var parcelaCell = row.parcela != null ? '<td class="pb-sim-valor pb-sim-col-extra">' + formatBRL(row.parcela) + '</td>' : '<td class="pb-sim-valor pb-sim-col-extra">—</td>';
      var txParcelCell = row.txParcel != null ? '<td class="pb-sim-valor pb-sim-col-extra">' + formatBRL(row.txParcel) + '</td>' : '<td class="pb-sim-valor pb-sim-col-extra">—</td>';
      var txCompradorCell = row.txComprador != null ? '<td class="pb-sim-valor pb-sim-col-extra">' + formatBRL(row.txComprador) + '</td>' : '<td class="pb-sim-valor pb-sim-col-extra">—</td>';
      return '<tr><td>' + row.label + '</td><td class="pb-sim-receb">' + row.receb + '</td>' + parcelaCell + txParcelCell + txCompradorCell + '<td class="pb-sim-valor">' + formatBRL(row.liquido) + '</td></tr>';
    }).join('');
  }

  /** Atualiza só o tbody da tabela (não recria o input), para não perder o foco ao digitar. */
  function updateTableOnly(container, state) {
    var tbody = container.querySelector('#pb-sim-tbody');
    if (tbody) tbody.innerHTML = buildTableRows(state);
  }

  function parseValorInput(str) {
    if (str === '' || str === null || str === undefined) return NaN;
    var normalized = String(str).replace(/\s/g, '').replace(',', '.');
    return parseFloat(normalized, 10);
  }

  function render(container, state) {
    var tableRows = buildTableRows(state);
    var html =
      '<div class="pb-sim">' +
      '<style>' + getStyles() + '</style>' +
      '<div class="pb-sim-aviso">Estas taxas são exclusivas para transações realizadas com <a href="https://pbintegracoes.com/?utm_source=simulador">PagBank Integrações</a> e não são válidas para outras integrações ou para o mundo físico (Moderninhas).</div>' +
      '<div class="pb-sim-row">' +
        '<div class="pb-sim-field"><label>Valor da venda (R$)</label><input type="text" inputmode="decimal" id="pb-sim-valor" placeholder="100" value="' + (state.valorVenda) + '"></div>' +
        '<div class="pb-sim-field"><label>Recebimento no cartão</label><select id="pb-sim-receb">' +
          '<option value="14"' + (state.recebimento14Dias ? ' selected' : '') + '>Em 14 dias (3,97%)</option>' +
          '<option value="30"' + (!state.recebimento14Dias ? ' selected' : '') + '>Em 30 dias (3,05%)</option>' +
        '</select></div>' +
        '<div class="pb-sim-field"><label>Assumir juros até</label><select id="pb-sim-ate">' +
          [1,2,3,4,5,6,7,8,9,10,11,12].map(function (k) {
            return '<option value="' + k + '"' + (state.ateNxSemAcrescimo === k ? ' selected' : '') + '>' + k + 'x</option>';
          }).join('') +
        '</select></div>' +
      '</div>' +
      '<div class="pb-sim-toggle" id="pb-sim-toggle" title="Exibir ou ocultar Parcela, Tx Parcel. e Tx Comprador">' + (state.colunasDetalheVisivel ? '−' : '+') + '</div>' +
      '<table class="pb-sim-table' + (state.colunasDetalheVisivel ? '' : ' pb-sim-col-extra-hidden') + '"><thead><tr><th>Forma</th><th>Recebimento</th><th class="pb-sim-col-extra">Parcela</th><th class="pb-sim-col-extra">Tx Parcel.</th><th class="pb-sim-col-extra">Tx Comprador</th><th>Você recebe</th></tr></thead><tbody id="pb-sim-tbody">' + tableRows + '</tbody></table>' +
      '</div>';

    container.innerHTML = html;

    container.querySelector('#pb-sim-valor').addEventListener('input', function () {
      var v = parseValorInput(this.value);
      if (!isNaN(v) && v >= 0) state.valorVenda = v;
      updateTableOnly(container, state);
    });
    container.querySelector('#pb-sim-receb').addEventListener('change', function () {
      state.recebimento14Dias = this.value === '14';
      render(container, state);
    });
    container.querySelector('#pb-sim-ate').addEventListener('change', function () {
      state.ateNxSemAcrescimo = parseInt(this.value, 10);
      render(container, state);
    });
    container.querySelector('#pb-sim-toggle').addEventListener('click', function () {
      state.colunasDetalheVisivel = !state.colunasDetalheVisivel;
      var table = container.querySelector('.pb-sim-table');
      if (table) table.classList.toggle('pb-sim-col-extra-hidden', !state.colunasDetalheVisivel);
      this.textContent = state.colunasDetalheVisivel ? '−' : '+';
    });
  }

  function init(options) {
    options = options || {};
    var selector = options.container || '#pagbank-simulador';
    var container = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!container) return;
    var state = {
      valorVenda: 100,
      recebimento14Dias: false,
      ateNxSemAcrescimo: 3,
      colunasDetalheVisivel: false
    };
    render(container, state);
  }

  global.PagBankSimulador = {
    init: init,
    calcPix: calcPix,
    calcBoleto: calcBoleto,
    calcCartaoVista: calcCartaoVista,
    calcParcelado: calcParcelado,
    formatBRL: formatBRL
  };
})(typeof window !== 'undefined' ? window : this);
