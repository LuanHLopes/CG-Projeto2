AFRAME.registerComponent("radio-system", {
  init: function () {
    const nomesArquivos = ["Eu Acho Que Pirei.mp3", "Love Never Fails.mp3", "The Fate Of Ophelia.mp3"];

    this.playlist = nomesArquivos.map((nome) => `./radio/${nome}`);

    this.indexAtual = 0;
    this.audio = new Audio();
    this.audio.volume = 0.4;
    this.tocando = false;

    this.hudElement = document.getElementById("radio-mini-hud");
    this.trackNameElement = document.getElementById("radio-track-name");
    this.statusElement = document.getElementById("radio-status");

    // Auto-próxima
    this.audio.addEventListener("ended", () => {
      this.proxima();
    });

    window.Radio = this;
  },

  formatarNome: function (caminho) {
    const nomeArquivo = caminho.split("/").pop();
    return nomeArquivo.replace(".mp3", "").replace(/_/g, " ");
  },

  atualizarHUD: function () {
    if (!this.hudElement) return;

    // ID da barra de força (ajuste se seu ID for diferente)
    const hudArremesso = document.getElementById("hud-force-container");

    if (this.tocando) {
      // === MOSTRAR TUDO ===
      this.hudElement.classList.remove("oculto");
      this.hudElement.classList.add("tocando");

      // Empurra a barra de força para cima
      if (hudArremesso) hudArremesso.classList.add("hud-deslocado-cima");

      // Atualiza Textos
      const nomeAtual = this.formatarNome(this.playlist[this.indexAtual]);
      this.trackNameElement.innerText = nomeAtual;
      this.statusElement.innerText = "Tocando Agora";
      this.statusElement.style.color = "#1db954";
    } else {
      // === ESCONDER TUDO ===
      this.hudElement.classList.add("oculto");
      this.hudElement.classList.remove("tocando");

      // Devolve a barra de força para baixo
      if (hudArremesso) hudArremesso.classList.remove("hud-deslocado-cima");
    }
  },

  tocar: function () {
    if (this.playlist.length === 0) return;

    if (!this.audio.src || this.audio.src === "") {
      this.audio.src = this.playlist[this.indexAtual];
    }

    this.audio
      .play()
      .then(() => {
        this.tocando = true;
        this.atualizarHUD();
      })
      .catch((e) => {
        console.warn("Erro player:", e);
      });
  },

  pausar: function () {
    this.audio.pause();
    this.tocando = false;
    this.atualizarHUD(); // Isso agora vai esconder o HUD
  },

  proxima: function () {
    if (this.playlist.length === 0) return;

    this.indexAtual++;
    if (this.indexAtual >= this.playlist.length) {
      this.indexAtual = 0;
    }
    this.audio.src = this.playlist[this.indexAtual];
    this.tocar();
  },

  anterior: function () {
    if (this.playlist.length === 0) return;

    this.indexAtual--;
    if (this.indexAtual < 0) {
      this.indexAtual = this.playlist.length - 1;
    }
    this.audio.src = this.playlist[this.indexAtual];
    this.tocar();
  },
});
