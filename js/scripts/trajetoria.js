AFRAME.registerComponent("trajetoria-previsao", {
  schema: {
    pontos: { type: "int", default: 30 },
    intervalo: { type: "number", default: 0.05 },
    cor: { type: "string", default: "#FFFF00" },
  },

  init: function () {
    this.mostrando = false;
    this.compArremesso = this.el.components["mecanica-arremesso"];
    this.camera = document.getElementById("camera-jogador");

    this.pontosEl = [];
    for (let i = 0; i < this.data.pontos; i++) {
      const p = document.createElement("a-entity");
      p.setAttribute("geometry", "primitive: sphere; radius: 0.03");
      p.setAttribute(
        "material",
        `color: ${this.data.cor}; opacity: 0.6; transparent: true; shader: flat`
      );
      p.setAttribute("visible", "false");
      this.el.sceneEl.appendChild(p);
      this.pontosEl.push(p);
    }
  },

  atualizarCor: function (novaCor) {
    this.pontosEl.forEach((p) => {
      p.setAttribute("material", "color", novaCor);
    });
  },

  tick: function () {
    if (!this.compArremesso) return;

    // Verifica se a mira está ativada ou desativada (Tecla M)
    if (!this.compArremesso.mostrarTrajetoria) {
      if (this.mostrando) {
        this.mostrando = false;
        this.pontosEl.forEach((p) => p.setAttribute("visible", "false"));
      }
      return;
    }

    const segurando = this.compArremesso.segurando;

    if (segurando && !this.mostrando) this.mostrando = true;
    if (!segurando && this.mostrando) {
      this.mostrando = false;
      this.pontosEl.forEach((p) => p.setAttribute("visible", "false"));
      return;
    }

    if (!this.mostrando) return;

    const posInicial = this.el.object3D.position.clone();
    let velocidade;

    if (segurando) {
      velocidade = new THREE.Vector3(0, 0, -1);
      velocidade.applyQuaternion(this.camera.object3D.quaternion);
      velocidade.y += this.compArremesso.ajudaVertical;
      velocidade.normalize();

      const massa = this.compArremesso.massaBola || 0.62;
      const velocidadeReal = this.compArremesso.forcaTotal / massa;

      velocidade.multiplyScalar(velocidadeReal);
    } else if (this.el.body) {
      velocidade = this.el.body.velocity.clone();
    } else {
      return;
    }

    const g = -12;

    for (let i = 0; i < this.data.pontos; i++) {
      const t = i * this.data.intervalo;
      const x = posInicial.x + velocidade.x * t;
      const y = posInicial.y + velocidade.y * t + 0.5 * g * t * t;
      const z = posInicial.z + velocidade.z * t;

      const p = this.pontosEl[i];
      p.setAttribute("position", `${x} ${y} ${z}`);
      p.setAttribute("visible", "true");
    }
  },
});