AFRAME.registerComponent("mecanica-arremesso", {
  init: function () {
    this.camera = document.getElementById("camera-jogador");
    this.refMao = document.getElementById("posicao-mao");
    this.scene = document.querySelector("a-scene");

    this.hudContainer = document.getElementById("hud-force-container");
    this.controlesBola = document.getElementById("controles-bola");
    this.txtMira = document.getElementById("txt-mira");

    this.segurando = false;
    this.mostrarTrajetoria = true;

    this.coresTrajetoria = { 1: "#00FF00", 2: "#FFFF00", 3: "#FF0000" };
    this.niveisForca = { 1: 6, 2: 8, 3: 10 };

    this.forcaAtual = 2;
    this.forcaTotal = this.niveisForca[2];
    this.ajudaVertical = 0.45;
    this.massaBola = 0.62;
    this.podeUsarT = true;

    this.processarAcao = this.processarAcao.bind(this);
    this.pegar = this.pegar.bind(this);
    this.mudarForca = this.mudarForca.bind(this);
    this.invocarBola = this.invocarBola.bind(this);
    this.alternarMira = this.alternarMira.bind(this);

    this.el.addEventListener("click", this.pegar);
    window.addEventListener("keydown", this.mudarForca);
    window.addEventListener("keydown", this.invocarBola);
    window.addEventListener("keydown", this.alternarMira);
    window.addEventListener("contextmenu", (e) => e.preventDefault());

    this.atualizarHudVisual();
  },

  salvarOrigem: function () {
    const pos = new THREE.Vector3();
    this.camera.object3D.getWorldPosition(pos);

    this.el.object3D.userData.origemArremesso = {
      x: pos.x,
      z: pos.z,
    };
  },

  alternarMira: function (e) {
    if (e.code === "KeyM") {
      if (
        window.estadoJogo &&
        window.estadoJogo.status === window.GAME_STATUS.ATIVO &&
        window.configMira === false
      ) {
        console.log("🚫 Mira bloqueada pelas regras do jogo.");
        return;
      }

      this.mostrarTrajetoria = !this.mostrarTrajetoria;

      if (this.txtMira) {
        this.txtMira.innerText = this.mostrarTrajetoria
          ? "DESATIVAR MIRA"
          : "ATIVAR MIRA";
      }
    }
  },

  invocarBola: function (e) {
    if (e.code === "KeyT") {
      if (!this.podeUsarT) {
        console.log("Tecla T desabilitada pelo sistema.");
        return;
      }

      if (
        window.estadoJogo &&
        window.estadoJogo.status === window.GAME_STATUS.ATIVO
      ) {
        const posBola = new THREE.Vector3();
        const posJogador = new THREE.Vector3();

        this.el.object3D.getWorldPosition(posBola);
        this.camera.object3D.getWorldPosition(posJogador);

        const distancia = posJogador.distanceTo(posBola);
        const DISTANCIA_MAXIMA = 8.0;

        if (distancia > DISTANCIA_MAXIMA) {
          console.log(
            `🚫 Você está muito longe! Chegue mais perto para pegar a bola. (Distância: ${distancia.toFixed(
              1
            )}m)`
          );
          return;
        }
      }

      if (this.segurando) return;

      if (this.el.body) {
        this.el.body.velocity.set(0, 0, 0);
        this.el.body.angularVelocity.set(0, 0, 0);
      }
      this.pegar();
    }
  },

  mudarForca: function (e) {
    if (!this.segurando) return;
    if (["1", "2", "3"].includes(e.key)) {
      this.forcaAtual = parseInt(e.key);
      this.forcaTotal = this.niveisForca[this.forcaAtual];
      this.atualizarHudVisual();

      const novaCor = this.coresTrajetoria[this.forcaAtual];
      const componenteTrajetoria = this.el.components["trajetoria-previsao"];
      if (componenteTrajetoria) componenteTrajetoria.atualizarCor(novaCor);
    }
  },

  atualizarHudVisual: function () {
    for (let i = 1; i <= 3; i++) {
      const btn = document.getElementById(`hud-btn-${i}`);
      if (!btn) continue;

      if (i === this.forcaAtual) {
        btn.style.border = `2px solid rgba(255, 255, 255, 1)`;
        btn.style.background = "rgba(255, 255, 255, 0.9)";
        btn.style.color = "black";
        btn.style.opacity = "1";
        btn.style.transform = "translateY(-3px) scale(1.1)";
        btn.style.boxShadow = "0 0 15px rgba(255, 255, 255, 0.6)";
      } else {
        btn.style.border = "2px solid rgba(255, 255, 255, 0.2)";
        btn.style.background = "rgba(255, 255, 255, 0.1)";
        btn.style.color = "rgba(255, 255, 255, 0.5)";
        btn.style.opacity = "0.8";
        btn.style.transform = "translateY(0) scale(1)";
        btn.style.boxShadow = "none";
      }
    }
  },

  tick: function () {
    if (this.segurando && this.refMao) {
      this.refMao.object3D.updateMatrixWorld(true);
      var pos = new THREE.Vector3();
      var rot = new THREE.Quaternion();

      this.refMao.object3D.getWorldPosition(pos);
      this.refMao.object3D.getWorldQuaternion(rot);

      if (this.el.object3D.parent)
        this.el.object3D.parent.worldToLocal(pos.clone());

      this.el.object3D.position.copy(pos);
      this.el.object3D.quaternion.copy(rot);
      this.el.object3D.rotateY(Math.PI / 2);

      if (this.el.body) {
        this.el.body.position.copy(pos);
        this.el.body.quaternion.copy(rot);
        this.el.body.velocity.set(0, 0, 0);
        this.el.body.angularVelocity.set(0, 0, 0);
      }
    }

    if (this.el.object3D.position.y < -10) {
      console.log("♻️ Bola caiu no infinito. Resetando posição...");

      const resetPos = { x: 0, y: 0.5, z: 0 };

      this.el.object3D.position.set(resetPos.x, resetPos.y, resetPos.z);

      if (this.el.body) {
        this.el.body.position.set(resetPos.x, resetPos.y, resetPos.z);
        this.el.body.velocity.set(0, 0, 0);
        this.el.body.angularVelocity.set(0, 0, 0);
      }

      if (this.segurando) {
        this.liberarBola();
      }
    }
  },

  pegar: function () {
    if (this.segurando) return;
    if (!this.refMao) this.refMao = document.getElementById("posicao-mao");

    this.el.removeAttribute("dynamic-body");
    this.el.classList.remove("interativo");
    this.segurando = true;

    if (this.hudContainer) this.hudContainer.style.display = "flex";
    if (this.controlesBola) this.controlesBola.style.display = "flex";

    const corAtual = this.coresTrajetoria[this.forcaAtual];
    const componenteTrajetoria = this.el.components["trajetoria-previsao"];
    if (componenteTrajetoria) componenteTrajetoria.atualizarCor(corAtual);

    setTimeout(() => {
      document.addEventListener("mousedown", this.processarAcao);
    }, 100);
  },

  processarAcao: function (e) {
    if (!this.segurando) return;
    if (e.button === 0) this.arremessar();
    else if (e.button === 2) this.soltar();
  },

  soltar: function () {
    this.liberarBola();
    this.salvarOrigem();

    setTimeout(() => {
      if (!this.el.body) return;
      this.el.body.velocity.set(0, 0, 0);
      this.el.body.angularVelocity.set(0, 0, 0);

      var direcao = new THREE.Vector3(0, 0, -1);
      direcao.applyQuaternion(this.camera.object3D.quaternion);
      direcao.y = 0.8;
      direcao.normalize();
      direcao.multiplyScalar(3);

      this.el.body.applyImpulse(direcao, new THREE.Vector3(0, 0, 0));
    }, 20);
  },

  arremessar: function () {
    this.liberarBola();
    this.salvarOrigem();

    setTimeout(() => {
      if (!this.el.body) return;
      this.el.body.velocity.set(0, 0, 0);
      this.el.body.angularVelocity.set(0, 0, 0);

      var direcao = new THREE.Vector3(0, 0, -1);
      direcao.applyQuaternion(this.camera.object3D.quaternion);
      direcao.y += this.ajudaVertical;
      direcao.normalize();
      direcao.multiplyScalar(this.forcaTotal);

      this.el.body.applyImpulse(direcao, new THREE.Vector3(0, 0, 0));
    }, 20);
  },

  liberarBola: function () {
    this.segurando = false;
    this.el.classList.add("interativo");

    if (this.hudContainer) this.hudContainer.style.display = "none";
    if (this.controlesBola) this.controlesBola.style.display = "none";

    this.el.setAttribute(
      "dynamic-body",
      `shape: sphere; mass: ${this.massaBola}; linearDamping: 0; angularDamping: 0.02`
    );

    this.el.object3D.userData.jaPontou = false;
    this.el.object3D.userData.entrouNoAro = false;
    this.el.object3D.userData.tempoEntrada = 0;

    document.removeEventListener("mousedown", this.processarAcao);
  },
});
