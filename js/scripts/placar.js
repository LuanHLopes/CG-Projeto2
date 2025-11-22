AFRAME.registerComponent("sensor", {
  schema: {
    id: { type: "string", default: "1" },
  },

  init: function () {
    this.ultimoPonto = 0;
    this.detectar = this.detectar.bind(this);

    this.el.addEventListener("body-loaded", () => {
      if (this.el.body) {
        this.el.body.collisionResponse = 0;
      }
    });

    this.el.addEventListener("collide", this.detectar);
  },

  detectar: function (e) {
    if (e.detail.body.el.id === "bola") {
      const tempoAtual = Date.now();

      const velY = e.detail.body.velocity.y;

      if (velY < 0 && tempoAtual - this.ultimoPonto > 1000) {
        this.registrarCesta();
        this.ultimoPonto = tempoAtual;

        // DEBUG VISUAL
        this.el.setAttribute(
          "material",
          "color: #00FF00; opacity: 0.5; transparent: true; visible: true"
        );
        setTimeout(() => {
          this.el.setAttribute("material", "visible: false");
        }, 200);
      }
    }
  },

  registrarCesta: function () {
    const elementoTexto = document.getElementById(`txt-score-${this.data.id}`);
    if (elementoTexto) {
      let valorAtual = parseInt(elementoTexto.innerText);
      valorAtual++;
      elementoTexto.innerText = valorAtual;
      console.log(`Cesta ${this.data.id} convertida!`);
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
      const score1 = document.getElementById("txt-score-1");
      const score2 = document.getElementById("txt-score-2");

      if (score1) score1.innerText = "0";
      if (score2) score2.innerText = "0";

      console.log("Placar Resetado pelo Jogador!");

      const debugDiv = document.getElementById("debug-placar");
      if (debugDiv) {
        debugDiv.style.borderColor = "red";
        setTimeout(() => (debugDiv.style.borderColor = "#00FF00"), 200);
      }
    }
  },

  remove: function () {
    window.removeEventListener("keydown", this.resetar);
  },
});
