AFRAME.registerComponent("sensor-boca", {
  init: function () {
    this.el.addEventListener("body-loaded", () => {
      if (this.el.body) this.el.body.collisionResponse = 0;
    });

    this.el.addEventListener("collide", (e) => {
      if (e.detail.body.el.id === "bola") {
        const bola = e.detail.body.el;
        if (e.detail.body.velocity.y < 0) {
          if (!bola.object3D.userData) bola.object3D.userData = {};

          bola.object3D.userData.entrouNoAro = true;
          bola.object3D.userData.tempoEntrada = Date.now();
        }
      }
    });
  },
});

AFRAME.registerComponent("sensor", {
  schema: { id: { type: "string", default: "1" } },

  init: function () {
    this.ultimoPonto = 0;
    this.detectar = this.detectar.bind(this);
    this.el.addEventListener("body-loaded", () => {
      if (this.el.body) this.el.body.collisionResponse = 0;
    });
    this.el.addEventListener("collide", this.detectar);
  },

  detectar: function (e) {
    if (e.detail.body.el.id === "bola") {
      const bolaEl = e.detail.body.el;
      const tempoAtual = Date.now();

      if (!bolaEl.object3D) return;
      const dadosBola = bolaEl.object3D.userData || {};

      if (dadosBola.jaPontou) return;

      const passouPelaBoca = dadosBola.entrouNoAro;
      const tempoDesdeEntrada = tempoAtual - (dadosBola.tempoEntrada || 0);

      if (!passouPelaBoca || tempoDesdeEntrada > 800) {
        return;
      }

      if (e.detail.body.velocity.y < 0) {
        if (!bolaEl.object3D.userData) bolaEl.object3D.userData = {};
        bolaEl.object3D.userData.jaPontou = true;
        bolaEl.object3D.userData.entrouNoAro = false;

        this.registrarCesta();

        this.el.setAttribute(
          "material",
          "color: #00FF00; opacity: 0.5; transparent: true; visible: true"
        );
        setTimeout(
          () => this.el.setAttribute("material", "visible: false"),
          200
        );
      }
    }
  },

  registrarCesta: function () {
    if (
      window.estadoJogo &&
      window.estadoJogo.status === window.GAME_STATUS.ATIVO
    ) {
      const idAtual = parseInt(this.data.id);
      const idAlvo = parseInt(window.cestaSelecionada);

      if (idAtual !== idAlvo) {
        window.notificar("CESTA INCORRETA");
        return;
      }
    }
    const bolaEl = document.getElementById("bola");

    let origem = { x: 0, z: 0 };
    if (
      bolaEl.object3D &&
      bolaEl.object3D.userData &&
      bolaEl.object3D.userData.origemArremesso
    ) {
      origem = bolaEl.object3D.userData.origemArremesso;
    }

    let pontos = 2;

    const idLinha = this.data.id === "1" ? "linha-3-a" : "linha-3-b";
    const linhaElement = document.getElementById(idLinha);

    if (linhaElement) {
      let raioLimite = parseFloat(linhaElement.getAttribute("radius-outer"));
      if (isNaN(raioLimite)) raioLimite = 7.265;

      const pontoArremesso = new THREE.Vector3(origem.x, origem.y, origem.z);
      linhaElement.object3D.worldToLocal(pontoArremesso);

      const distanciaDoCentro = Math.sqrt(
        pontoArremesso.x ** 2 + pontoArremesso.y ** 2
      );

      if (distanciaDoCentro > raioLimite || Math.abs(pontoArremesso.x) > 7.2) {
        pontos = 3;
      }
    } else {
      console.warn("Linha de referência não encontrada. Usando 2 pontos.");
    }

    const idHud = this.data.id === "1" ? "score-top-home" : "score-top-guest";
    const idGrupo3D = this.data.id === "1" ? "#grupo-home" : "#grupo-guest";

    const hudElement = document.getElementById(idHud);
    let novoValor = 0;

    if (hudElement) {
      let valorAtual = parseInt(hudElement.innerText);
      if (isNaN(valorAtual)) valorAtual = 0;

      novoValor = valorAtual + pontos;
      if (novoValor > 999) novoValor = 0;

      hudElement.innerText = novoValor < 10 ? "0" + novoValor : novoValor;
    }

    this.atualizarLed(idGrupo3D, novoValor);

    window.dispatchEvent(
      new CustomEvent("pontuacao-registrada", {
        detail: {
          pontosFeitos: pontos,
          totalAcumulado: novoValor,
          idCesta: this.data.id,
          time: this.data.id === "1" ? "HOME" : "GUEST",
        },
      })
    );
  },

  atualizarLed: function (selectorId, valor) {
    const grupo = document.querySelector(selectorId);
    if (grupo) {
      const digitos = grupo.querySelectorAll("[digito-led]");
      const dezena = Math.floor((valor % 100) / 10);
      const unidade = valor % 10;
      if (digitos[0] && digitos[0].components["digito-led"])
        digitos[0].components["digito-led"].setNumero(dezena);
      if (digitos[1] && digitos[1].components["digito-led"])
        digitos[1].components["digito-led"].setNumero(unidade);
    }
  },
});

AFRAME.registerComponent("controle-placar", {
  init: function () {
    this.onKeyDown = this.onKeyDown.bind(this);
    this.resetarLogica = this.resetarLogica.bind(this);
    window.addEventListener("keydown", this.onKeyDown);
    window.resetarPlacar = this.resetarLogica;
  },
  resetarLogica: function () {
    const hudH = document.getElementById("score-top-home");
    const hudG = document.getElementById("score-top-guest");
    if (hudH) hudH.innerText = "00";
    if (hudG) hudG.innerText = "00";

    const resetLed = (sel) => {
      const g = document.querySelector(sel);
      if (g)
        g.querySelectorAll("[digito-led]").forEach((d) => {
          if (d.components["digito-led"])
            d.components["digito-led"].setNumero(0);
        });
    };
    resetLed("#grupo-home");
    resetLed("#grupo-guest");
  },
  onKeyDown: function (e) {
    if (e.code === "KeyR") {
      if (
        window.estadoJogo &&
        window.estadoJogo.status === window.GAME_STATUS.ATIVO
      ) {
        window.notificar("REINICIO BLOQUEADO DURANTE JOGO");
        return;
      }
      this.resetarLogica();
    }
  },
  remove: function () {
    window.removeEventListener("keydown", this.onKeyDown);
    if (window.resetarPlacar === this.resetarLogica)
      window.resetarPlacar = null;
  },
});
