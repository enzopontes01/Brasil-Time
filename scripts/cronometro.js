class Cronometro {
  constructor(config = {}) {
    this.chaveArmazenamento = config.chaveArmazenamento || "cronometro";
    this.intervaloAtualizacao = config.intervaloAtualizacao || 10;

    this.btnIniciarPausar = document.getElementById(
      config.idBtnIniciarPausar || "btnIniciarPausar",
    );
    this.btnVolta = document.getElementById(config.idBtnVolta || "btnVolta");
    this.btnRedefinir = document.getElementById(
      config.idBtnRedefinir || "btnRedefinir",
    );
    this.elementoVisor = document.getElementById(
      config.idVisor || "cronometro",
    );
    this.listaVoltas = document.getElementById(
      config.idListaVoltas || "listaVoltas",
    );

    if (!this.elementoVisor) {
      throw new Error("Elemento de visor não encontrado");
    }

    this.tempo = 0;
    this.emExecucao = false;
    this.voltas = [];
    this.idIntervalo = null;

    this.inicializar();
  }

  inicializar() {
    this.carregarDados();
    this.configurarEventos();
    this.atualizarVisor();
    this.renderizarVoltas();
  }

  configurarEventos() {
    if (this.btnIniciarPausar) {
      this.btnIniciarPausar.addEventListener("click", () => this.alternarInicio());
    }
    if (this.btnVolta) {
      this.btnVolta.addEventListener("click", () => this.adicionarVolta());
    }
    if (this.btnRedefinir) {
      this.btnRedefinir.addEventListener("click", () => this.redefinir());
    }
  }

  formatarTempo(ms) {
    try {
      const minutos = Math.floor(ms / 60000);
      const segundos = Math.floor((ms % 60000) / 1000);
      const centesimos = Math.floor((ms % 1000) / 10);

      return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}.${String(centesimos).padStart(2, "0")}`;
    } catch (erro) {
      console.error("Erro ao formatar tempo:", erro);
      return "00:00.00";
    }
  }

  atualizarVisor() {
    try {
      this.elementoVisor.textContent = this.formatarTempo(this.tempo);
    } catch (erro) {
      console.error("Erro ao atualizar visor:", erro);
    }
  }

  alternarInicio() {
    if (this.emExecucao) {
      this.pausar();
    } else {
      this.iniciar();
    }
  }

  iniciar() {
    try {
      if (this.emExecucao) return;

      this.emExecucao = true;
      const inicioTimestamp = Date.now() - this.tempo;

      if (this.btnIniciarPausar) {
        this.btnIniciarPausar.textContent = "Pausar";
        this.btnIniciarPausar.classList.add("paused");
      }
      if (this.btnVolta) {
        this.btnVolta.disabled = false;
      }

      this.idIntervalo = setInterval(() => {
        this.tempo = Date.now() - inicioTimestamp;
        this.atualizarVisor();
      }, this.intervaloAtualizacao);
    } catch (erro) {
      console.error("Erro ao iniciar cronômetro:", erro);
    }
  }

  pausar() {
    try {
      this.emExecucao = false;
      if (this.idIntervalo) {
        clearInterval(this.idIntervalo);
        this.idIntervalo = null;
      }

      if (this.btnIniciarPausar) {
        this.btnIniciarPausar.textContent = "Continuar";
        this.btnIniciarPausar.classList.remove("paused");
      }
      if (this.btnRedefinir) {
        this.btnRedefinir.disabled = false;
      }

      this.salvarDados();
    } catch (erro) {
      console.error("Erro ao pausar cronômetro:", erro);
    }
  }

  adicionarVolta() {
    try {
      if (!this.emExecucao) return;
      this.voltas.push(this.tempo);
      this.renderizarVoltas();
      this.salvarDados();
    } catch (erro) {
      console.error("Erro ao adicionar volta:", erro);
    }
  }

  redefinir() {
    try {
      this.tempo = 0;
      this.voltas = [];
      this.emExecucao = false;

      if (this.idIntervalo) {
        clearInterval(this.idIntervalo);
        this.idIntervalo = null;
      }

      this.atualizarVisor();
      this.renderizarVoltas();

      if (this.btnIniciarPausar) {
        this.btnIniciarPausar.textContent = "Iniciar";
        this.btnIniciarPausar.classList.remove("paused");
      }
      if (this.btnVolta) {
        this.btnVolta.disabled = true;
      }
      if (this.btnRedefinir) {
        this.btnRedefinir.disabled = true;
      }

      this.limparArmazenamento();
    } catch (erro) {
      console.error("Erro ao redefinir cronômetro:", erro);
    }
  }

  renderizarVoltas() {
    try {
      if (!this.listaVoltas) return;

      this.listaVoltas.innerHTML = "";

      if (this.voltas.length === 0) return;

      const cabecalho = document.createElement("div");
      cabecalho.className = "cabecalho-voltas";
      cabecalho.innerHTML = "<span>Volta</span><span>Tempo</span>";
      this.listaVoltas.appendChild(cabecalho);

      this.voltas.forEach((volta, indice) => {
        const tempoVolta = indice === 0 ? volta : volta - this.voltas[indice - 1];
        const itemVolta = document.createElement("div");
        itemVolta.className = "item-volta";
        itemVolta.innerHTML = `<span>#${indice + 1}</span><span>${this.formatarTempo(tempoVolta)}</span>`;
        this.listaVoltas.appendChild(itemVolta);
      });
    } catch (erro) {
      console.error("Erro ao renderizar voltas:", erro);
    }
  }

  salvarDados() {
    try {
      localStorage.setItem(
        this.chaveArmazenamento,
        JSON.stringify({
          tempo: this.tempo,
          voltas: this.voltas,
        }),
      );
    } catch (erro) {
      console.warn("Erro ao salvar dados do cronômetro:", erro);
    }
  }

  carregarDados() {
    try {
      const salvo = localStorage.getItem(this.chaveArmazenamento);
      if (salvo) {
        const dados = JSON.parse(salvo);
        this.tempo = dados.tempo || 0;
        this.voltas = dados.voltas || [];
      }
    } catch (erro) {
      console.warn("Erro ao carregar dados do cronômetro:", erro);
    }
  }

  limparArmazenamento() {
    try {
      localStorage.removeItem(this.chaveArmazenamento);
    } catch (erro) {
      console.warn("Erro ao limpar armazenamento:", erro);
    }
  }

  destruir() {
    if (this.idIntervalo) {
      clearInterval(this.idIntervalo);
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    try {
      new Cronometro();
    } catch (erro) {
      console.error("Erro ao inicializar cronômetro:", erro);
    }
  });
} else {
  try {
    new Cronometro();
  } catch (erro) {
    console.error("Erro ao inicializar cronômetro:", erro);
  }
}
