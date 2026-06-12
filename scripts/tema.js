const CHAVE_TEMA = "brasilTimeTheme";

class GerenciadorTema {
  constructor() {
    this.btnAlternarTema = document.getElementById("themeToggleBtn");
    this.inicializar();
  }

  aplicarTema(tema) {
    try {
      const temaResolvido = tema === "dark" ? "dark" : "light";
      const temEscuro = temaResolvido === "dark";

      document.documentElement.dataset.theme = temaResolvido;

      if (!this.btnAlternarTema) return;

      this.btnAlternarTema.setAttribute("aria-pressed", String(temEscuro));
      const rotulo = temEscuro ? "Ativar tema claro" : "Ativar tema escuro";
      this.btnAlternarTema.setAttribute("aria-label", rotulo);
      this.btnAlternarTema.setAttribute("title", rotulo);
    } catch (erro) {
      console.error("Erro ao aplicar tema:", erro);
    }
  }

  alternarTema() {
    try {
      const proximoTema =
        document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      localStorage.setItem(CHAVE_TEMA, proximoTema);
      this.aplicarTema(proximoTema);
    } catch (erro) {
      console.error("Erro ao alternar tema:", erro);
    }
  }

  detectarPreferencia() {
    try {
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        return "dark";
      }
    } catch (erro) {
      console.warn("Erro ao detectar preferência do sistema:", erro);
    }
    return "light";
  }

  configurarListenerStorage() {
    try {
      window.addEventListener("storage", (evento) => {
        if (evento.key === CHAVE_TEMA && evento.newValue) {
          this.aplicarTema(evento.newValue);
        }
      });
    } catch (erro) {
      console.error("Erro ao configurar listener de storage:", erro);
    }
  }

  configurarListenerSistema() {
    try {
      if (window.matchMedia) {
        window
          .matchMedia("(prefers-color-scheme: dark)")
          .addEventListener("change", (e) => {
            const temaSalvo = localStorage.getItem(CHAVE_TEMA);
            if (!temaSalvo) {
              const novoTema = e.matches ? "dark" : "light";
              this.aplicarTema(novoTema);
            }
          });
      }
    } catch (erro) {
      console.warn("Erro ao configurar listener de preferência do sistema:", erro);
    }
  }

  inicializar() {
    const temaSalvo = localStorage.getItem(CHAVE_TEMA);
    const temaAplicar = temaSalvo || this.detectarPreferencia();

    this.aplicarTema(temaAplicar);

    if (this.btnAlternarTema) {
      this.btnAlternarTema.addEventListener("click", () => this.alternarTema());
    }

    this.configurarListenerStorage();
    this.configurarListenerSistema();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new GerenciadorTema();
  });
} else {
  new GerenciadorTema();
}
