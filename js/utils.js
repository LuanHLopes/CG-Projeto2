window.configMira = true;

window.addEventListener("contextmenu", (e) => e.preventDefault(), false);

const ICONE_ALERTA = `
<svg class="toast-icon" viewBox="0 0 24 24">
  <path d="M12 2L1 21h22L12 2zm0 3.45l8.27 14.28H3.73L12 5.45zM11 10v6h2v-6h-2zm0 8v2h2v-2h-2z"/>
</svg>`;

window.notificar = function(texto) {
    const container = document.getElementById("notification-container");
    if (!container) return;

    const el = document.createElement("div");
    el.className = "toast-alert";
    el.innerHTML = `${ICONE_ALERTA} <span>${texto}</span>`;
    
    if (window.cestaSelecionada === 1) {
        el.style.borderLeftColor = "#00aaff"; // Azul
    } else {
        el.style.borderLeftColor = "#ffaa00"; // Laranja
    }

    container.appendChild(el);

    // Remove após 3 segundos
    setTimeout(() => {
        el.classList.add("saindo");
        el.addEventListener("animationend", () => {
            if(el.parentElement) el.remove();
        });
    }, 3000);
};

window.cestaSelecionada = 1;
window.tempoCronometro = 90;

window.GAME_MODE = Object.freeze({
  LIVRE: "LIVRE",
  STREET_21: "STREET_21",
  VOLTA_AO_MUNDO: "VOLTA_AO_MUNDO",
  ON_FIRE: "ON_FIRE",
});

window.GAME_STATUS = Object.freeze({
  DESATIVADO: "DESATIVADO",
  ESPERA: "ESPERA",
  CONTAGEM: "CONTAGEM",
  ATIVO: "ATIVO",
});

window.estadoJogo = {
  modo: window.GAME_MODE.LIVRE,
  status: window.GAME_STATUS.DESATIVADO,
};

document.addEventListener("fullscreenchange", () => {
  const txtFullscreen = document.getElementById("txt-fullscreen");

  if (txtFullscreen) {
    if (document.fullscreenElement) {
      txtFullscreen.innerText = "SAIR TELA CHEIA";
    } else {
      txtFullscreen.innerText = "TELA CHEIA";
    }
  }
});

window.addEventListener("keydown", (e) => {
  if (e.code === "F11") {
    e.preventDefault();
    if (!document.fullscreenElement) {
      document.body.requestFullscreen().catch((err) => {
        console.warn("Erro ao tentar tela cheia:", err);
      });
    } else {
      document.exitFullscreen();
    }
  }

  if (e.code === "Escape") {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }
});

AFRAME.registerComponent("controle-ui", {
  init: function () {
    this.hudTopo = document.getElementById("hud-topo-container");
    this.hudLateral = document.getElementById("hud-controls");
    this.txtPlacar = document.getElementById("txt-placar");
    this.hintMenu = document.getElementById("hint-menu");

    this.placarVisivel = true;
    this.menuVisivel = true;

    this.onKeyDown = this.onKeyDown.bind(this);
    window.addEventListener("keydown", this.onKeyDown);
  },

  onKeyDown: function (e) {
    if (e.code === "KeyP") {
      this.placarVisivel = !this.placarVisivel;

      if (this.hudTopo) {
        if (this.placarVisivel) this.hudTopo.classList.remove("oculto");
        else this.hudTopo.classList.add("oculto");
      }

      if (this.txtPlacar) {
        this.txtPlacar.innerText = this.placarVisivel
          ? "Ocultar Placar"
          : "Mostrar Placar";
      }
    }

    if (e.code === "KeyG") {
      this.menuVisivel = !this.menuVisivel;

      if (this.hudLateral) {
        if (this.menuVisivel) {
          this.hudLateral.classList.remove("oculto-lateral");
        } else {
          this.hudLateral.classList.add("oculto-lateral");
        }
      }

      if (this.hintMenu) {
        if (this.menuVisivel) {
          this.hintMenu.classList.add("oculto");
        } else {
          this.hintMenu.classList.remove("oculto");
        }
      }
    }
  },

  remove: function () {
    window.removeEventListener("keydown", this.onKeyDown);
  },
});
