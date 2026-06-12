const FUSO_HORARIO_BRASIL = "America/Sao_Paulo";
const URL_CALENDARIO_OFICIAL_2026 =
  "https://www.gov.br/gestao/pt-br/assuntos/noticias/2025/dezembro/confira-o-calendario-oficial-de-feriados-nacionais-e-pontos-facultativos-em-2026";

const listaFeriadosEl = document.getElementById("listaFeriados");
const anoFeriadoEl = document.getElementById("anoFeriado");
const contadorVisiveisEl = document.getElementById("contadorVisiveis");
const contadorPassadosEl = document.getElementById("contadorPassados");
const proximoFeriadoLabelEl = document.getElementById("proximoFeriadoLabel");
const tituloFeriadosEl = document.getElementById("tituloFeriados");
const descricaoFeriadosEl = document.getElementById("descricaoFeriados");
const feriadosAtualizadoEl = document.getElementById("feriadosAtualizado");
const filtrosFeriadosEl = document.getElementById("filtrosFeriados");

const OPCOES_FILTRO = [
  { chave: "all", rotulo: "Todos" },
  { chave: "national", rotulo: "Nacionais" },
  { chave: "optional", rotulo: "Facultativos" },
  { chave: "partial", rotulo: "Parciais" },
];

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "full",
  timeZone: FUSO_HORARIO_BRASIL,
});

const formatadorDataCurta = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  timeZone: FUSO_HORARIO_BRASIL,
});

const formatadorDataMetrica = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: FUSO_HORARIO_BRASIL,
});

const formatadorPartes = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO_HORARIO_BRASIL,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

let filtroAtivo = "all";

function capitalizarTexto(texto) {
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : "";
}

function criarData(ano, mesIndice, dia) {
  return new Date(Date.UTC(ano, mesIndice, dia, 12, 0, 0));
}

function criarFabricaDataFixa(mesIndice, dia) {
  return (ano) => criarData(ano, mesIndice, dia);
}

function adicionarDias(data, quantidade) {
  const resultado = new Date(data);
  resultado.setUTCDate(resultado.getUTCDate() + quantidade);
  return resultado;
}

function calcularPascoa(ano) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;

  return criarData(ano, mes - 1, dia);
}

function obterHojeBrasil() {
  const agora = new Date();
  const partes = formatadorPartes.formatToParts(agora);
  const ano = Number(partes.find((parte) => parte.type === "year")?.value);
  const mes = Number(partes.find((parte) => parte.type === "month")?.value);
  const dia = Number(partes.find((parte) => parte.type === "day")?.value);

  return criarData(ano, mes - 1, dia);
}

function obterDiferencaDias(dataAlvo, dataReferencia) {
  const utcAlvo = Date.UTC(
    dataAlvo.getUTCFullYear(),
    dataAlvo.getUTCMonth(),
    dataAlvo.getUTCDate(),
  );
  const utcReferencia = Date.UTC(
    dataReferencia.getUTCFullYear(),
    dataReferencia.getUTCMonth(),
    dataReferencia.getUTCDate(),
  );

  return Math.round((utcAlvo - utcReferencia) / 86400000);
}

const DEFINICOES_FERIADOS = [
  {
    id: "new-year",
    name: "Confraternização Universal",
    filterKey: "national",
    typeLabel: "Feriado nacional",
    detail: "Ano-novo civil",
    getDate: criarFabricaDataFixa(0, 1),
    sourceUrl: "https://pt.wikipedia.org/wiki/Ano-novo",
  },
  {
    id: "carnival-monday",
    name: "Carnaval",
    filterKey: "optional",
    typeLabel: "Ponto facultativo",
    detail: "Segunda-feira de Carnaval",
    getDate: (ano) => adicionarDias(calcularPascoa(ano), -48),
    sourceUrl: "https://pt.wikipedia.org/wiki/Carnaval",
  },
  {
    id: "carnival-tuesday",
    name: "Carnaval",
    filterKey: "optional",
    typeLabel: "Ponto facultativo",
    detail: "Terça-feira de Carnaval",
    getDate: (ano) => adicionarDias(calcularPascoa(ano), -47),
    sourceUrl: "https://pt.wikipedia.org/wiki/Carnaval",
  },
  {
    id: "ash-wednesday",
    name: "Quarta-feira de Cinzas",
    filterKey: "partial",
    typeLabel: "Ponto facultativo parcial",
    detail: "Até as 14h",
    getDate: (ano) => adicionarDias(calcularPascoa(ano), -46),
    sourceUrl: "https://pt.wikipedia.org/wiki/Quarta-feira_de_Cinzas",
  },
  {
    id: "good-friday",
    name: "Paixão de Cristo",
    filterKey: "national",
    typeLabel: "Feriado nacional",
    detail: "Sexta-feira Santa",
    getDate: (ano) => adicionarDias(calcularPascoa(ano), -2),
    sourceUrl: "https://pt.wikipedia.org/wiki/Sexta-feira_Santa",
  },
  {
    id: "april-20",
    name: "Ponto facultativo de 20 de abril",
    filterKey: "optional",
    typeLabel: "Ponto facultativo",
    detail: "Data extra prevista na portaria oficial de 2026",
    getDate: (ano) => (ano === 2026 ? criarData(ano, 3, 20) : null),
    sourceUrl: URL_CALENDARIO_OFICIAL_2026,
  },
  {
    id: "tiradentes",
    name: "Tiradentes",
    filterKey: "national",
    typeLabel: "Feriado nacional",
    detail: "Memória de Joaquim José da Silva Xavier",
    getDate: criarFabricaDataFixa(3, 21),
    sourceUrl: "https://pt.wikipedia.org/wiki/Tiradentes",
  },
  {
    id: "labor-day",
    name: "Dia do Trabalho",
    filterKey: "national",
    typeLabel: "Feriado nacional",
    detail: "Dia Mundial do Trabalho",
    getDate: criarFabricaDataFixa(4, 1),
    sourceUrl: "https://pt.wikipedia.org/wiki/Dia_do_Trabalhador",
  },
  {
    id: "corpus-christi",
    name: "Corpus Christi",
    filterKey: "optional",
    typeLabel: "Ponto facultativo",
    detail: "Quinta-feira após a Santíssima Trindade",
    getDate: (ano) => adicionarDias(calcularPascoa(ano), 60),
    sourceUrl: "https://pt.wikipedia.org/wiki/Corpus_Christi",
  },
  {
    id: "june-5",
    name: "Ponto facultativo de 5 de junho",
    filterKey: "optional",
    typeLabel: "Ponto facultativo",
    detail: "Data extra prevista na portaria oficial de 2026",
    getDate: (ano) => (ano === 2026 ? criarData(ano, 5, 5) : null),
    sourceUrl: URL_CALENDARIO_OFICIAL_2026,
  },
  {
    id: "independence",
    name: "Independência do Brasil",
    filterKey: "national",
    typeLabel: "Feriado nacional",
    detail: "Celebração do 7 de Setembro",
    getDate: criarFabricaDataFixa(8, 7),
    sourceUrl: "https://pt.wikipedia.org/wiki/Independ%C3%AAncia_do_Brasil",
  },
  {
    id: "our-lady-aparecida",
    name: "Nossa Senhora Aparecida",
    filterKey: "national",
    typeLabel: "Feriado nacional",
    detail: "Padroeira do Brasil",
    getDate: criarFabricaDataFixa(9, 12),
    sourceUrl: "https://pt.wikipedia.org/wiki/Nossa_Senhora_Aparecida",
  },
  {
    id: "public-servant",
    name: "Dia do Servidor Público",
    filterKey: "optional",
    typeLabel: "Ponto facultativo",
    detail: "Observado pela administração pública federal",
    getDate: criarFabricaDataFixa(9, 28),
    sourceUrl: URL_CALENDARIO_OFICIAL_2026,
  },
  {
    id: "finados",
    name: "Finados",
    filterKey: "national",
    typeLabel: "Feriado nacional",
    detail: "Dia dos Fiéis Defuntos",
    getDate: criarFabricaDataFixa(10, 2),
    sourceUrl: "https://pt.wikipedia.org/wiki/Dia_dos_Fi%C3%A9is_Defuntos",
  },
  {
    id: "republic-proclamation",
    name: "Proclamação da República",
    filterKey: "national",
    typeLabel: "Feriado nacional",
    detail: "Celebração do 15 de Novembro",
    getDate: criarFabricaDataFixa(10, 15),
    sourceUrl:
      "https://pt.wikipedia.org/wiki/Proclama%C3%A7%C3%A3o_da_Rep%C3%BAblica_do_Brasil",
  },
  {
    id: "black-awareness",
    name: "Dia Nacional de Zumbi e da Consciência Negra",
    filterKey: "national",
    typeLabel: "Feriado nacional",
    detail: "Feriado nacional desde 2023",
    getDate: criarFabricaDataFixa(10, 20),
    sourceUrl:
      "https://pt.wikipedia.org/wiki/Dia_Nacional_de_Zumbi_e_da_Consci%C3%AAncia_Negra",
  },
  {
    id: "christmas-eve",
    name: "Véspera de Natal",
    filterKey: "partial",
    typeLabel: "Ponto facultativo parcial",
    detail: "Após as 13h",
    getDate: criarFabricaDataFixa(11, 24),
    sourceUrl: URL_CALENDARIO_OFICIAL_2026,
  },
  {
    id: "christmas",
    name: "Natal",
    filterKey: "national",
    typeLabel: "Feriado nacional",
    detail: "Celebração de Natal",
    getDate: criarFabricaDataFixa(11, 25),
    sourceUrl: "https://pt.wikipedia.org/wiki/Natal",
  },
  {
    id: "new-years-eve",
    name: "Véspera de Ano Novo",
    filterKey: "partial",
    typeLabel: "Ponto facultativo parcial",
    detail: "Após as 13h",
    getDate: criarFabricaDataFixa(11, 31),
    sourceUrl: URL_CALENDARIO_OFICIAL_2026,
  },
];

const definicaoPorId = new Map(
  DEFINICOES_FERIADOS.map((definicao) => [definicao.id, definicao]),
);

function construirFeriado(definicao, ano) {
  const data = definicao.getDate(ano);

  if (!data) return null;

  return {
    ...definicao,
    data,
    ano,
  };
}

function obterCalendarioFeriados(ano) {
  return DEFINICOES_FERIADOS.map((definicao) => construirFeriado(definicao, ano))
    .filter(Boolean)
    .sort((a, b) => a.data - b.data);
}

function filtrarFeriados(feriados, chaveFiltro) {
  if (chaveFiltro === "all") return feriados;

  return feriados.filter((feriado) => feriado.filterKey === chaveFiltro);
}

function obterContagemFiltro(feriados, chaveFiltro) {
  return filtrarFeriados(feriados, chaveFiltro).length;
}

function obterStatusRelativo(diffDias) {
  if (diffDias === 0) {
    return { texto: "É hoje", classe: "is-today" };
  }

  if (diffDias > 0) {
    return {
      texto: `Faltam ${diffDias} dia${diffDias === 1 ? "" : "s"}`,
      classe: "is-future",
    };
  }

  const diasPassados = Math.abs(diffDias);
  return {
    texto: `Passou há ${diasPassados} dia${diasPassados === 1 ? "" : "s"}`,
    classe: "is-past",
  };
}

function obterOcorrenciasAdjacentes(feriado, hoje) {
  const diffDias = obterDiferencaDias(feriado.data, hoje);
  const definicao = definicaoPorId.get(feriado.id);

  if (diffDias === 0) {
    return {
      ocorrenciaAnterior: feriado,
      proximaOcorrencia: feriado,
    };
  }

  if (diffDias > 0) {
    return {
      ocorrenciaAnterior: construirFeriado(definicao, feriado.ano - 1),
      proximaOcorrencia: feriado,
    };
  }

  return {
    ocorrenciaAnterior: feriado,
    proximaOcorrencia: construirFeriado(definicao, feriado.ano + 1),
  };
}

function formatarValorOcorrencia(ocorrencia, hoje, direcao) {
  if (!ocorrencia) {
    return direcao === "past"
      ? "Sem data oficial anterior"
      : "Sem data oficial futura";
  }

  const diffDias = Math.abs(obterDiferencaDias(ocorrencia.data, hoje));

  if (diffDias === 0) return "É hoje";

  if (direcao === "past") {
    return `Há ${diffDias} dia${diffDias === 1 ? "" : "s"}`;
  }

  return `Faltam ${diffDias} dia${diffDias === 1 ? "" : "s"}`;
}

function formatarDataOcorrencia(ocorrencia) {
  return ocorrencia
    ? capitalizarTexto(formatadorDataMetrica.format(ocorrencia.data))
    : "";
}

function criarCartaoFeriado(feriado, hoje) {
  const diffDias = obterDiferencaDias(feriado.data, hoje);
  const relativo = obterStatusRelativo(diffDias);
  const { ocorrenciaAnterior, proximaOcorrencia } = obterOcorrenciasAdjacentes(
    feriado,
    hoje,
  );
  const cartao = document.createElement("article");
  const valorAnterior = formatarValorOcorrencia(ocorrenciaAnterior, hoje, "past");
  const valorProximo = formatarValorOcorrencia(proximaOcorrencia, hoje, "future");
  const dataAnterior = formatarDataOcorrencia(ocorrenciaAnterior);
  const dataProxima = formatarDataOcorrencia(proximaOcorrencia);
  const rotuloBotaoFonte =
    feriado.sourceUrl === URL_CALENDARIO_OFICIAL_2026
      ? "Ver calendário oficial"
      : "Saber mais";

  cartao.className = "cartao-feriado";
  cartao.innerHTML = `
    <div class="topo-feriado">
      <div class="titulo-feriado">
        <span class="tipo-feriado">${feriado.typeLabel}</span>
        <h3 class="nome-feriado">${feriado.name}</h3>
        <p class="nota-feriado">${feriado.detail}</p>
      </div>
      <span class="status-feriado ${relativo.classe}">${relativo.texto}</span>
    </div>
    <p class="data-feriado">${capitalizarTexto(formatadorData.format(feriado.data))}</p>
    <div class="metricas-feriado">
      <div class="metrica-feriado">
        <span class="label-metrica">Desde a última vez</span>
        <strong class="valor-metrica">${valorAnterior}</strong>
        ${dataAnterior ? `<span class="data-metrica">${dataAnterior}</span>` : ""}
      </div>
      <div class="metrica-feriado">
        <span class="label-metrica">Até a próxima</span>
        <strong class="valor-metrica">${valorProximo}</strong>
        ${dataProxima ? `<span class="data-metrica">${dataProxima}</span>` : ""}
      </div>
    </div>
    <div class="acoes-feriado">
      <a
        class="btn btn-secondary link-feriado"
        href="${feriado.sourceUrl}"
        target="_blank"
        rel="noopener noreferrer"
      >
        ${rotuloBotaoFonte}
      </a>
    </div>
  `;

  return cartao;
}

function renderizarBotosFiltro(feriados) {
  filtrosFeriadosEl.innerHTML = "";

  OPCOES_FILTRO.forEach((opcao) => {
    const botao = document.createElement("button");
    const contagem = obterContagemFiltro(feriados, opcao.chave);
    const ativo = opcao.chave === filtroAtivo;

    botao.type = "button";
    botao.className = `btn-filtro${ativo ? " is-active" : ""}`;
    botao.setAttribute("aria-pressed", String(ativo));
    botao.innerHTML = `
      <span>${opcao.rotulo}</span>
      <span class="contagem-filtro">${contagem}</span>
    `;

    botao.addEventListener("click", () => {
      filtroAtivo = opcao.chave;
      renderizarFeriados();
    });

    filtrosFeriadosEl.appendChild(botao);
  });
}

function atualizarTextosFeriados(anoAtual) {
  tituloFeriadosEl.textContent = `Feriados e pontos facultativos do Brasil em ${anoAtual}`;

  if (anoAtual === 2026) {
    descricaoFeriadosEl.textContent =
      "Calendário oficial federal de 2026 com feriados nacionais, pontos facultativos e datas parciais. Feriados estaduais e municipais variam conforme a localidade.";
    return;
  }

  descricaoFeriadosEl.textContent =
    "Calendário nacional com feriados fixos, datas móveis e pontos facultativos recorrentes. Emendas administrativas extras dependem da portaria oficial de cada ano.";
}

function renderizarEstadoVazio() {
  listaFeriadosEl.innerHTML = `
    <div class="vazio-feriados">
      Nenhuma data encontrada para esse filtro no calendário atual.
    </div>
  `;
}

function renderizarFeriados() {
  const hoje = obterHojeBrasil();
  const anoAtual = hoje.getUTCFullYear();
  const feriados = obterCalendarioFeriados(anoAtual);
  const feriadosVisiveis = filtrarFeriados(feriados, filtroAtivo);
  const feriadosPassados = feriadosVisiveis.filter(
    (feriado) => obterDiferencaDias(feriado.data, hoje) < 0,
  );
  const proximoFeriado = feriadosVisiveis.find(
    (feriado) => obterDiferencaDias(feriado.data, hoje) >= 0,
  );

  atualizarTextosFeriados(anoAtual);
  renderizarBotosFiltro(feriados);

  feriadosAtualizadoEl.textContent = `Hoje em Brasília: ${capitalizarTexto(formatadorData.format(hoje))}`;
  anoFeriadoEl.textContent = String(anoAtual);
  contadorVisiveisEl.textContent = String(feriadosVisiveis.length);
  contadorPassadosEl.textContent = String(feriadosPassados.length);
  proximoFeriadoLabelEl.textContent = proximoFeriado
    ? `${capitalizarTexto(formatadorDataCurta.format(proximoFeriado.data))} - ${proximoFeriado.name}`
    : "Nenhuma restante neste filtro";

  listaFeriadosEl.innerHTML = "";

  if (!feriadosVisiveis.length) {
    renderizarEstadoVazio();
    return;
  }

  feriadosVisiveis.forEach((feriado) => {
    listaFeriadosEl.appendChild(criarCartaoFeriado(feriado, hoje));
  });
}

renderizarFeriados();
