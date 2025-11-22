// cronometro-tempo.js

AFRAME.registerComponent("cronometro-tempo", {
  schema: {
    rodando: { type: "boolean", default: false },
    tempoInicial: { type: "int", default: 90 }, // segundos iniciais
  },

  init: function () {
    this.restanteMs = this.data.tempoInicial * 1000;
    this.lastTick = null;
    this.piscando = false;
    this.piscaInterval = null;

    // Referências aos dígitos do display LED da cena
    this.digitos = {
      sdez: document.getElementById("cron-s-dezena"),
      sun: document.getElementById("cron-s-unidade"),
      msdez: document.getElementById("cron-ms-dezena"),
      msun: document.getElementById("cron-ms-unidade"),
    };

    this.setDisplay(this.data.tempoInicial, 0);

    // HUD no canto esquerdo
    this.hudSdez = document.getElementById("hud-cron-sdez");
    this.hudSun = document.getElementById("hud-cron-sun");
    this.hudMsdez = document.getElementById("hud-cron-msdez");
    this.hudMsun = document.getElementById("hud-cron-msun");
    this.hudBox = document.getElementById("hud-cronometro");
    this.hideHud();

    // Métodos globais para controle externo
    window.iniciarCronometro = this.iniciarCronometro.bind(this);
    window.pararCronometro = this.pararCronometro.bind(this);
    window.zerarCronometro = this.zerarCronometro.bind(this);
    window.setarTempoCronometro = this.setarTempo.bind(this);
  },

  tick: function (time, dt) {
    if (!this.data.rodando) return;

    if (this.lastTick === null) this.lastTick = time;
    const elapsed = time - this.lastTick;
    this.lastTick = time;
    this.restanteMs -= elapsed;

    if (this.restanteMs <= 0) {
      this.restanteMs = 0;
      this.data.rodando = false;
    }

    const segundos = Math.floor(this.restanteMs / 1000);
    const centesimos = Math.floor((this.restanteMs % 1000) / 10);

    this.setDisplay(segundos, centesimos);
    this.updateHud(segundos, centesimos);

    // Lógica para início da piscada
    if (
      !this.data.rodando &&
      segundos === 0 &&
      centesimos === 0 &&
      !this.piscando
    ) {
      this.startHudBlink();
    } else if ((segundos > 0 || centesimos > 0) && this.piscando) {
      this.stopHudBlink();
    }
  },

  setDisplay: function (segundos, centesimos) {
    // Atualiza o placar LED do painel do jogo
    if (this.digitos.sdez)
      this.digitos.sdez.components["digito-led"].setNumero(
        Math.floor(segundos / 10)
      );
    if (this.digitos.sun)
      this.digitos.sun.components["digito-led"].setNumero(segundos % 10);
    if (this.digitos.msdez)
      this.digitos.msdez.components["digito-led"].setNumero(
        Math.floor(centesimos / 10)
      );
    if (this.digitos.msun)
      this.digitos.msun.components["digito-led"].setNumero(centesimos % 10);
  },

  updateHud: function (segundos, centesimos) {
    // Atualiza o HUD lateral
    if (
      this.hudSdez &&
      this.hudSun &&
      this.hudMsdez &&
      this.hudMsun &&
      this.hudBox
    ) {
      this.hudSdez.innerText = Math.floor(segundos / 10);
      this.hudSun.innerText = segundos % 10;
      this.hudMsdez.innerText = Math.floor(centesimos / 10);
      this.hudMsun.innerText = centesimos % 10;
      this.hudBox.style.opacity = "1";
      this.hudBox.style.display = "flex";
    }
  },

  hideHud: function () {
    if (this.hudBox) this.hudBox.style.display = "none";
  },

  startHudBlink: function () {
    this.piscando = true;
    let visible = true;
    if (this.hudBox) {
      this.piscaInterval = setInterval(() => {
        this.hudBox.style.opacity = visible ? "1" : "0.3";
        visible = !visible;
      }, 350);
    }
  },

  stopHudBlink: function () {
    this.piscando = false;
    if (this.piscaInterval) {
      clearInterval(this.piscaInterval);
      this.piscaInterval = null;
    }
    if (this.hudBox) this.hudBox.style.opacity = "1";
  },

  iniciarCronometro: function () {
    if (!this.data.rodando && this.restanteMs > 0) {
      this.data.rodando = true;
      this.lastTick = null;
      this.hideHud();
      this.updateHud(
        Math.floor(this.restanteMs / 1000),
        Math.floor((this.restanteMs % 1000) / 10)
      );
      if (this.piscando) this.stopHudBlink();
    }
  },

  pararCronometro: function () {
    if (this.data.rodando) {
      this.data.rodando = false;
    }
    // Opcional: this.hideHud();
  },

  zerarCronometro: function () {
    this.data.rodando = false;
    this.lastTick = null;
    this.restanteMs = this.data.tempoInicial * 1000;
    this.setDisplay(this.data.tempoInicial, 0);
    this.updateHud(this.data.tempoInicial, 0);
    this.hideHud();
    if (this.piscando) this.stopHudBlink();
  },

  setarTempo: function (segundos) {
    if (
      typeof segundos !== "number" ||
      isNaN(segundos) ||
      segundos < 0 ||
      segundos > 99
    )
      return;
    this.data.tempoInicial = segundos;
    this.zerarCronometro();
  },
});