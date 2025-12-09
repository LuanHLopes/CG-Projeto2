AFRAME.registerComponent("cronometro-tempo", {
  schema: {
    rodando: { type: "boolean", default: false },
    tempoInicial: { type: "int", default: window.tempoCronometro },
  },

  init: function () {
    this.restanteMs = this.data.tempoInicial * 1000;
    this.lastTick = null;

    this.digitos = {
      sdez: document.getElementById("cron-s-dezena"),
      sun: document.getElementById("cron-s-unidade"),
      msdez: document.getElementById("cron-ms-dezena"),
      msun: document.getElementById("cron-ms-unidade"),
    };

    this.hudTopo = document.getElementById("timer-top-display");

    this.atualizarVisuais(this.data.tempoInicial, 0);

    // Torna a função de piscar acessível globalmente através do componente
    this.blinkHud = this.blinkHud.bind(this);

    window.iniciarCronometro = this.iniciarCronometro.bind(this);
    window.pararCronometro = this.pararCronometro.bind(this);
    window.zerarCronometro = this.zerarCronometro.bind(this);
    window.setarTempoCronometro = this.setarTempo.bind(this);
  },

  tick: function (time, dt) {
    if (!this.data.rodando) {
      this.lastTick = null;
      return;
    }

    if (this.lastTick === null) this.lastTick = time;
    const elapsed = time - this.lastTick;
    this.lastTick = time;

    this.restanteMs -= elapsed;

    if (this.restanteMs <= 0) {
      this.restanteMs = 0;
      this.data.rodando = false;

      this.blinkHud();

      // [NOVO] Avisa o sistema que o tempo acabou
      window.dispatchEvent(new CustomEvent("cronometro-zerado"));
    }

    const segundos = Math.floor(this.restanteMs / 1000);
    const centesimos = Math.floor((this.restanteMs % 1000) / 10);

    this.atualizarVisuais(segundos, centesimos);
  },

  // ... (atualizarVisuais mantém igual) ...
  atualizarVisuais: function (segundos, centesimos) {
    if (this.digitos.sdez && this.digitos.sdez.components["digito-led"])
      this.digitos.sdez.components["digito-led"].setNumero(
        Math.floor(segundos / 10)
      );
    if (this.digitos.sun && this.digitos.sun.components["digito-led"])
      this.digitos.sun.components["digito-led"].setNumero(segundos % 10);
    if (this.digitos.msdez && this.digitos.msdez.components["digito-led"])
      this.digitos.msdez.components["digito-led"].setNumero(
        Math.floor(centesimos / 10)
      );
    if (this.digitos.msun && this.digitos.msun.components["digito-led"])
      this.digitos.msun.components["digito-led"].setNumero(centesimos % 10);

    if (this.hudTopo) {
      const sStr = segundos < 10 ? "0" + segundos : segundos;
      const msStr = centesimos < 10 ? "0" + centesimos : centesimos;
      this.hudTopo.innerText = `${sStr}:${msStr}`;
      if (segundos < 10) {
        this.hudTopo.style.color = "#ff3333";
        this.hudTopo.style.textShadow = "0 0 15px rgba(255, 0, 0, 0.8)";
      } else {
        this.hudTopo.style.color = "#ff4444";
        this.hudTopo.style.textShadow = "0 0 10px rgba(255, 0, 0, 0.5)";
      }
    }
  },

  blinkHud: function () {
    if (!this.hudTopo) return;

    let count = 0;
    const maxToggles = 6;
    const velocidadePisca = 600;

    this.hudTopo.style.visibility = "visible";

    const interval = setInterval(() => {
      this.hudTopo.style.visibility =
        this.hudTopo.style.visibility === "hidden" ? "visible" : "hidden";
      count++;

      if (count >= maxToggles) {
        clearInterval(interval);
        this.hudTopo.style.visibility = "visible";
      }
    }, velocidadePisca);
  },

  iniciarCronometro: function () {
    if (this.restanteMs > 0) {
      this.data.rodando = true;
      this.lastTick = null;
    }
  },

  pararCronometro: function () {
    this.data.rodando = false;
    this.lastTick = null;
  },

  zerarCronometro: function () {
    this.data.rodando = false;
    this.lastTick = null;
    this.restanteMs = this.data.tempoInicial * 1000;

    if (this.hudTopo) {
      this.hudTopo.style.visibility = "visible";
      this.hudTopo.style.color = "#ff4444";
    }

    this.atualizarVisuais(this.data.tempoInicial, 0);
  },

  setarTempo: function (segundos) {
    if (typeof segundos !== "number" || isNaN(segundos) || segundos < 0) return;
    window.tempoCronometro = segundos;
    this.data.tempoInicial = window.tempoCronometro;
    this.zerarCronometro();
    console.log(`Tempo definido para: ${segundos}s`);
  },
});