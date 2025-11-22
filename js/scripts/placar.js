AFRAME.registerComponent("sensor-boca", {
  init: function () {
    this.el.addEventListener("body-loaded", () => {
      if (this.el.body) this.el.body.collisionResponse = 0;
    });

    this.el.addEventListener("collide", (e) => {
      if (e.detail.body.el.id === "bola") {
        const bola = e.detail.body.el;

        if (!bola.object3D) return;
        if (!bola.object3D.userData) {
          bola.object3D.userData = {};
        }

        if (e.detail.body.velocity.y < 0) {
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
      if (isNaN(raioLimite)) raioLimite = 7.25;

      const pontoArremesso = new THREE.Vector3(origem.x, origem.y, origem.z);
      linhaElement.object3D.worldToLocal(pontoArremesso);

      const distanciaDoCentro = Math.sqrt(
        pontoArremesso.x ** 2 + pontoArremesso.y ** 2
      );

      if (distanciaDoCentro > raioLimite) {
        pontos = 3;
      }

      if (Math.abs(pontoArremesso.x) > 7.2) {
        pontos = 3;
      }

      console.log(`Cesta ${this.data.id} | Pontos: ${pontos}`);
    } else {
      console.error(`ERRO CRÍTICO: Elemento ${idLinha} não encontrado!`);
    }

    const elementoTexto = document.getElementById(`txt-score-${this.data.id}`);
    if (elementoTexto) {
      let valorAtual = parseInt(elementoTexto.innerText);
      valorAtual += pontos;
      if (valorAtual > 999) valorAtual = 0;
      elementoTexto.innerText = valorAtual;

      const seletorGrupo =
        this.data.id === "1" ? "#grupo-home" : "#grupo-guest";
      this.atualizarLed(seletorGrupo, valorAtual);
    }
  },

  atualizarLed: function (selectorId, valor) {
    const grupo = document.querySelector(selectorId);
    if (grupo) {
      const digitos = grupo.querySelectorAll("[digito-led]");
      const dezena = Math.floor((valor % 100) / 10);
      const unidade = valor % 10;
      if (digitos[0]) digitos[0].components["digito-led"].setNumero(dezena);
      if (digitos[1]) digitos[1].components["digito-led"].setNumero(unidade);
    }
  },
});

AFRAME.registerComponent("controle-placar", {
  init: function () {
    this.resetar = this.resetar.bind(this);
    window.addEventListener("keydown", this.resetar);
  },
  resetar: function (e) {
    if (e.code === "KeyR") {
      const s1 = document.getElementById("txt-score-1");
      const s2 = document.getElementById("txt-score-2");
      if (s1) s1.innerText = "0";
      if (s2) s2.innerText = "0";
      const resetLed = (sel) => {
        const g = document.querySelector(sel);
        if (g)
          g.querySelectorAll("[digito-led]").forEach((d) =>
            d.components["digito-led"].setNumero(0)
          );
      };
      resetLed("#grupo-home");
      resetLed("#grupo-guest");
    }
  },
  remove: function () {
    window.removeEventListener("keydown", this.resetar);
  },
});
