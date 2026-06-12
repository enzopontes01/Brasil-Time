const CHAVE_ARMAZENAMENTO = "estadoTemporizador";
const DURACAO_PADRAO = 5 * 60 * 1000;

let intervalo;
let contextoAudio;
let estado = {
  duracaoTotal: DURACAO_PADRAO,
  tempoRestante: DURACAO_PADRAO,
  timestampFim: null,
  emExecucao: false,
  status: "parado",
};

const visorTemporizador = document.getElementById("visorTemporizador");
const statusTemporizador = document.getElementById("statusTemporizador");
const notaTemporizador = document.getElementById("notaTemporizador");
const tempoDefinido = document.getElementById("tempoDefinido");
const rotuloStatus = document.getElementById("rotuloStatus");
const inputHoras = document.getElementById("inputHoras");
const inputMinutos = document.getElementById("inputMinutos");
const inputSegundos = document.getElementById("inputSegundos");
const btnIniciarPausar = document.getElementById("btnIniciarPausar");
const btnAplicar = document.getElementById("btnAplicar");
const btnRedefinir = document.getElementById("btnRedefinir");
const botoesPreset = document.querySelectorAll(".btn-preset");

function completar(valor) {
  return String(valor).padStart(2, "0");
}

function limitar(valor, min, max) {
  return Math.min(Math.max(valor, min), max);
}

function formatarDuracao(ms, arredondamento = "ceil") {
  const arred =
    arredondamento === "floor"
      ? Math.floor
      : arredondamento === "round"
        ? Math.round
        : Math.ceil;
  const totalSegundos = Math.max(0, arred(ms / 1000));
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;

  return `${completar(horas)}:${completar(minutos)}:${completar(segundos)}`;
}

function obterDuracaoInput() {
  const horas = limitar(Number(inputHoras.value) || 0, 0, 99);
  const minutos = limitar(Number(inputMinutos.value) || 0, 0, 59);
  const segundos = limitar(Number(inputSegundos.value) || 0, 0, 59);

  return ((horas * 60 + minutos) * 60 + segundos) * 1000;
}

function definirInputsDeDuracao(ms) {
  const totalSegundos = Math.max(0, Math.floor(ms / 1000));
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;

  inputHoras.value = horas;
  inputMinutos.value = minutos;
  inputSegundos.value = segundos;
}

function salvarEstado() {
  localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(estado));
}

function obterContextoAudio() {
  if (!contextoAudio) {
    const ClasseAudioContext = window.AudioContext || window.webkitAudioContext;
    if (!ClasseAudioContext) return null;
    contextoAudio = new ClasseAudioContext();
  }
  if (contextoAudio.state === "suspended") {
    contextoAudio.resume().catch(() => {});
  }
  return contextoAudio;
}

function tocarAlarme() {
  const contexto = obterContextoAudio();
  if (!contexto) return;

  const padrao = [
    { offset: 0, frequencia: 880, duracao: 0.18 },
    { offset: 0.24, frequencia: 740, duracao: 0.18 },
    { offset: 0.48, frequencia: 880, duracao: 0.28 },
  ];
  const inicio = contexto.currentTime + 0.05;

  padrao.forEach((tom) => {
    const oscilador = contexto.createOscillator();
    const ganho = contexto.createGain();

    oscilador.type = "triangle";
    oscilador.frequency.setValueAtTime(tom.frequencia, inicio + tom.offset);

    ganho.gain.setValueAtTime(0.0001, inicio + tom.offset);
    ganho.gain.exponentialRampToValueAtTime(0.18, inicio + tom.offset + 0.01);
    ganho.gain.exponentialRampToValueAtTime(
      0.0001,
      inicio + tom.offset + tom.duracao,
    );

    oscilador.connect(ganho);
    ganho.connect(contexto.destination);
    oscilador.start(inicio + tom.offset);
    oscilador.stop(inicio + tom.offset + tom.duracao + 0.02);
  });
}

function limparIntervalo() {
  clearInterval(intervalo);
  intervalo = null;
}

function desabilitarInputs(desabilitar) {
  [inputHoras, inputMinutos, inputSegundos].forEach((input) => {
    input.disabled = desabilitar;
  });
  botoesPreset.forEach((botao) => {
    botao.disabled = desabilitar;
  });
}

function temMudancaPendente() {
  return obterDuracaoInput() !== estado.duracaoTotal;
}

function obterTempoDecorrido() {
  return Math.max(0, estado.duracaoTotal - estado.tempoRestante);
}

function sincronizarContagem() {
  if (!estado.emExecucao || !estado.timestampFim) return;

  estado.tempoRestante = Math.max(0, estado.timestampFim - Date.now());

  if (estado.tempoRestante === 0) {
    encerrar();
  }
}

function definirStatusVisual(classeEstado) {
  statusTemporizador.classList.remove("em-execucao", "pausado", "encerrado");
  rotuloStatus.classList.remove("em-execucao", "pausado", "encerrado");

  if (classeEstado) {
    statusTemporizador.classList.add(classeEstado);
    rotuloStatus.classList.add(classeEstado);
  }
}

function renderizar() {
  if (estado.emExecucao) {
    sincronizarContagem();
  }

  const tempoDecorrido = obterTempoDecorrido();
  const duracaoInput = obterDuracaoInput();
  const mudancaPendente = temMudancaPendente();

  visorTemporizador.textContent = formatarDuracao(estado.tempoRestante);
  tempoDefinido.textContent = formatarDuracao(estado.duracaoTotal);
  desabilitarInputs(estado.emExecucao);
  btnAplicar.disabled = estado.emExecucao || duracaoInput <= 0 || !mudancaPendente;

  if (estado.emExecucao) {
    statusTemporizador.textContent = `Tempo decorrido: ${formatarDuracao(tempoDecorrido, "floor")}`;
    rotuloStatus.textContent = "Em andamento";
    notaTemporizador.textContent = "O temporizador está rodando. Pause para fazer ajustes.";
    btnIniciarPausar.textContent = "Pausar";
    btnRedefinir.disabled = false;
    definirStatusVisual("em-execucao");
  } else if (estado.status === "pausado") {
    statusTemporizador.textContent = `Tempo decorrido: ${formatarDuracao(tempoDecorrido, "floor")}`;
    rotuloStatus.textContent = "Pausado";
    notaTemporizador.textContent = mudancaPendente
      ? "Há um novo tempo preenchido. Clique em Aplicar para trocar a duração ou em Continuar para retomar a contagem atual."
      : "Clique em Continuar para retomar de onde parou.";
    btnIniciarPausar.textContent = "Continuar";
    btnRedefinir.disabled = false;
    definirStatusVisual("pausado");
  } else if (estado.status === "encerrado") {
    statusTemporizador.textContent = "Tempo encerrado";
    rotuloStatus.textContent = "Concluído";
    notaTemporizador.textContent = mudancaPendente
      ? "Há um novo tempo preenchido. Clique em Aplicar para preparar a próxima contagem."
      : "O tempo acabou. Clique em Iniciar para repetir a mesma duração ou em Redefinir para voltar ao início.";
    btnIniciarPausar.textContent = "Iniciar";
    btnRedefinir.disabled = estado.duracaoTotal <= 0;
    definirStatusVisual("encerrado");
  } else if (estado.status === "vazio") {
    statusTemporizador.textContent = mudancaPendente
      ? `Novo tempo preenchido: ${formatarDuracao(duracaoInput)}`
      : "Defina um tempo para começar";
    rotuloStatus.textContent = mudancaPendente ? "Pendente" : "Aguardando";
    notaTemporizador.textContent = mudancaPendente
      ? "Clique em Aplicar para salvar essa duração ou em Iniciar para aplicar e começar."
      : "Escolha uma duração maior que zero para iniciar.";
    btnIniciarPausar.textContent = "Iniciar";
    btnRedefinir.disabled = true;
    definirStatusVisual("");
  } else {
    statusTemporizador.textContent = mudancaPendente
      ? `Novo tempo preenchido: ${formatarDuracao(duracaoInput)}`
      : "Pronto para iniciar";
    rotuloStatus.textContent = mudancaPendente ? "Pendente" : "Parado";
    notaTemporizador.textContent = mudancaPendente
      ? "Clique em Aplicar para atualizar o temporizador sem iniciar, ou em Iniciar para aplicar e começar."
      : "Ajuste a duração e use Aplicar para definir uma nova contagem.";
    btnIniciarPausar.textContent = "Iniciar";
    btnRedefinir.disabled = estado.duracaoTotal <= 0;
    definirStatusVisual("");
  }

  if (estado.emExecucao) {
    btnIniciarPausar.disabled = false;
    return;
  }

  if (estado.status === "pausado") {
    btnIniciarPausar.disabled = estado.tempoRestante <= 0;
    return;
  }

  if (mudancaPendente) {
    btnIniciarPausar.disabled = duracaoInput <= 0;
    return;
  }

  btnIniciarPausar.disabled =
    estado.tempoRestante <= 0 && estado.duracaoTotal <= 0;
}

function sincronizarComInputs() {
  estado.duracaoTotal = obterDuracaoInput();
  estado.tempoRestante = estado.duracaoTotal;
  estado.timestampFim = null;
  estado.emExecucao = false;
  estado.status = estado.duracaoTotal > 0 ? "parado" : "vazio";
  limparIntervalo();
  salvarEstado();
  renderizar();
}

function aplicarNovaDuracao() {
  sincronizarComInputs();
}

function iniciarLoop() {
  if (intervalo) return;

  intervalo = setInterval(() => {
    sincronizarContagem();
    renderizar();
  }, 250);
}

function iniciarOuPausar() {
  if (estado.emExecucao) {
    estado.tempoRestante = Math.max(0, estado.timestampFim - Date.now());
    estado.timestampFim = null;
    estado.emExecucao = false;
    estado.status = estado.tempoRestante > 0 ? "pausado" : "encerrado";
    limparIntervalo();
    salvarEstado();
    renderizar();
    return;
  }

  if (estado.status !== "pausado" && temMudancaPendente()) {
    sincronizarComInputs();
  } else if (estado.status === "vazio" || estado.status === "encerrado") {
    sincronizarComInputs();
  }

  if (estado.tempoRestante <= 0) return;

  obterContextoAudio();
  estado.timestampFim = Date.now() + estado.tempoRestante;
  estado.emExecucao = true;
  estado.status = "rodando";
  salvarEstado();
  renderizar();
  iniciarLoop();
}

function redefinir() {
  limparIntervalo();
  estado.tempoRestante = estado.duracaoTotal;
  estado.timestampFim = null;
  estado.emExecucao = false;
  estado.status = estado.duracaoTotal > 0 ? "parado" : "vazio";
  definirInputsDeDuracao(estado.duracaoTotal);
  salvarEstado();
  renderizar();
}

function encerrar(tocarSom = true) {
  limparIntervalo();
  estado.tempoRestante = 0;
  estado.timestampFim = null;
  estado.emExecucao = false;
  estado.status = "encerrado";
  salvarEstado();

  if (tocarSom) {
    tocarAlarme();
  }

  renderizar();
}

function aoMudarInput() {
  inputHoras.value = limitar(Number(inputHoras.value) || 0, 0, 99);
  inputMinutos.value = limitar(Number(inputMinutos.value) || 0, 0, 59);
  inputSegundos.value = limitar(Number(inputSegundos.value) || 0, 0, 59);

  renderizar();
}

function aplicarPreset(minutos) {
  definirInputsDeDuracao(minutos * 60 * 1000);
  renderizar();
}

function carregarEstado() {
  const estadoSalvo = localStorage.getItem(CHAVE_ARMAZENAMENTO);

  if (!estadoSalvo) {
    definirInputsDeDuracao(DURACAO_PADRAO);
    sincronizarComInputs();
    return;
  }

  try {
    const estadoParsed = JSON.parse(estadoSalvo);
    const duracaoTotal = Number(estadoParsed.duracaoTotal);
    const tempoRestante = Number(estadoParsed.tempoRestante);

    // Mapear status antigos (inglês) para novos (português)
    const mapaStatus = {
      idle: "parado",
      running: "rodando",
      paused: "pausado",
      finished: "encerrado",
      empty: "vazio",
    };
    let statusSalvo = estadoParsed.status || "parado";
    statusSalvo = mapaStatus[statusSalvo] || statusSalvo;

    estado = {
      duracaoTotal: Number.isFinite(duracaoTotal) ? duracaoTotal : DURACAO_PADRAO,
      tempoRestante: Number.isFinite(tempoRestante) ? tempoRestante : DURACAO_PADRAO,
      timestampFim: estadoParsed.timestampFim || null,
      emExecucao: Boolean(estadoParsed.emExecucao),
      status: statusSalvo,
    };

    definirInputsDeDuracao(estado.duracaoTotal);

    if (estado.emExecucao && estado.timestampFim) {
      estado.tempoRestante = Math.max(0, estado.timestampFim - Date.now());

      if (estado.tempoRestante === 0) {
        encerrar(false);
        return;
      } else {
        estado.status = "rodando";
        iniciarLoop();
      }
    }

    if (!estado.emExecucao && estado.tempoRestante <= 0) {
      estado.status = estado.duracaoTotal > 0 ? "encerrado" : "vazio";
    }

    renderizar();
  } catch (erro) {
    definirInputsDeDuracao(DURACAO_PADRAO);
    sincronizarComInputs();
  }
}

btnIniciarPausar.addEventListener("click", iniciarOuPausar);
btnAplicar.addEventListener("click", aplicarNovaDuracao);
btnRedefinir.addEventListener("click", redefinir);

[inputHoras, inputMinutos, inputSegundos].forEach((input) => {
  input.addEventListener("input", aoMudarInput);
  input.addEventListener("change", aoMudarInput);
});

botoesPreset.forEach((botao) => {
  botao.addEventListener("click", () => {
    aplicarPreset(Number(botao.dataset.minutes));
  });
});

carregarEstado();
