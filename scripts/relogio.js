class Relogio {
  constructor(config = {}) {
    this.fusoHorario = config.fusoHorario || "America/Sao_Paulo";
    this.intervaloAtualizacao = config.intervaloAtualizacao || 1000;
    this.idIntervalo = null;

    this.elementoHora = document.getElementById(
      config.idElementoHora || "hora",
    );
    this.elementoData = document.getElementById(
      config.idElementoData || "data",
    );
    this.elementoFuso = document.getElementById(
      config.idElementoFuso || "fusoHorario",
    );

    if (!this.elementoHora) {
      throw new Error("Elemento de hora não encontrado");
    }

    this.configurarFormatadores();
    this.iniciar();
  }

  configurarFormatadores() {
    this.formatadorHora = new Intl.DateTimeFormat("pt-BR", {
      timeZone: this.fusoHorario,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    this.formatadorData = new Intl.DateTimeFormat("pt-BR", {
      timeZone: this.fusoHorario,
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    this.formatadorFuso = new Intl.DateTimeFormat("pt-BR", {
      timeZone: this.fusoHorario,
      timeZoneName: "short",
    });
  }

  capitalizarPrimeira(texto) {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  atualizarHora() {
    try {
      const agora = new Date();
      this.elementoHora.textContent = this.formatadorHora.format(agora);

      if (this.elementoData) {
        this.elementoData.textContent = this.capitalizarPrimeira(
          this.formatadorData.format(agora),
        );
      }

      if (this.elementoFuso) {
        const partesFuso = this.formatadorFuso.formatToParts(agora);
        const nomeFuso = partesFuso.find((parte) => parte.type === "timeZoneName");
        this.elementoFuso.textContent = nomeFuso?.value || this.fusoHorario;
      }
    } catch (erro) {
      console.error("Erro ao atualizar relógio:", erro);
    }
  }

  iniciar() {
    this.atualizarHora();
    this.idIntervalo = setInterval(() => this.atualizarHora(), this.intervaloAtualizacao);
  }

  parar() {
    if (this.idIntervalo) {
      clearInterval(this.idIntervalo);
      this.idIntervalo = null;
    }
  }

  destruir() {
    this.parar();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    try {
      new Relogio();
    } catch (erro) {
      console.error("Erro ao inicializar relógio:", erro);
    }
  });
} else {
  try {
    new Relogio();
  } catch (erro) {
    console.error("Erro ao inicializar relógio:", erro);
  }
}
