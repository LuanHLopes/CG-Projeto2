// script.js - Configuração de propriedades físicas para entidades A-Frame usando Physijs

window.addEventListener(
  "contextmenu",
  function (e) {
    e.preventDefault();
  },
  false
);

AFRAME.registerComponent("config-fisica", {
  schema: {
    restituicao: { type: "number", default: 0.5 },
    atrito: { type: "number", default: 0.5 },
  },
  init: function () {
    this.el.addEventListener("body-loaded", () => {
      if (this.el.body) {
        this.el.body.restitution = this.data.restituicao;
        this.el.body.friction = this.data.atrito;
        this.el.body.updateMassProperties();
      }
    });
  },
});

AFRAME.registerComponent("add-body-when-ready", {
  init() {
    this.el.addEventListener("model-loaded", () => {
      this.el.setAttribute("dynamic-body", {
        shape: "sphere",
        mass: 0.62,
        linearDamping: 0.01,
        angularDamping: 0.02,
      });

      setTimeout(() => {
        if (this.el.body) {
          this.el.body.updateMassProperties();
          this.el.body.wakeUp();
          this.el.body.position.y += 0.001;
        }
      }, 50);
    });
  },
});

AFRAME.registerComponent("mecanica-arremesso", {
  init: function () {
    this.camera = document.getElementById("camera-jogador");
    this.refMao = document.getElementById("posicao-mao");
    this.scene = document.querySelector("a-scene");

    this.hudContainer = document.getElementById("hud-container"); 
    this.controlesBola = document.getElementById("controles-bola"); 

    this.segurando = false;

    this.coresTrajetoria = { 1: "#00FF00", 2: "#FFFF00", 3: "#FF0000" };
    this.niveisForca = { 1: 4, 2: 8, 3: 12 };

    this.forcaAtual = 2;
    this.forcaTotal = this.niveisForca[2];
    this.ajudaVertical = 0.45;
    this.massaBola = 0.62;

    this.processarAcao = this.processarAcao.bind(this);
    this.pegar = this.pegar.bind(this);
    this.mudarForca = this.mudarForca.bind(this);
    this.invocarBola = this.invocarBola.bind(this);

    this.el.addEventListener("click", this.pegar);
    window.addEventListener("keydown", this.mudarForca);
    window.addEventListener("keydown", this.invocarBola);
    window.addEventListener("contextmenu", (e) => e.preventDefault());

    this.atualizarHudVisual();
  },

  invocarBola: function (e) {
    if (e.code === "KeyP") {
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
        btn.style.border = `2px solid rgba(255,255,255, 1)`;
        btn.style.background = "rgba(255, 255, 255, 0.9)";
        btn.style.color = "black";
        btn.style.opacity = "1";
        btn.style.transform = "translateY(-3px) scale(1.1)";
        btn.style.boxShadow = "0 0 10px rgba(255,255,255,0.5)";
      } else {
        btn.style.border = "2px solid rgba(255, 255, 255, 0.2)";
        btn.style.background = "rgba(255, 255, 255, 0.05)";
        btn.style.color = "rgba(255, 255, 255, 0.4)";
        btn.style.opacity = "1";
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
      if (this.el.body) {
        this.el.body.position.copy(pos);
        this.el.body.quaternion.copy(rot);
        this.el.body.velocity.set(0, 0, 0);
        this.el.body.angularVelocity.set(0, 0, 0);
      }
    }
  },

  pegar: function () {
    if (this.segurando) return;
    if (!this.refMao) this.refMao = document.getElementById("posicao-mao");

    this.el.removeAttribute("dynamic-body");
    this.el.classList.remove("interativo");
    this.segurando = true;

    // MOSTRAR HUDs
    if (this.hudContainer) this.hudContainer.style.display = "flex";
    if (this.controlesBola) this.controlesBola.style.display = "flex"; // <--- Mostra mouse

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

    // ESCONDER HUDs
    if (this.hudContainer) this.hudContainer.style.display = "none";
    if (this.controlesBola) this.controlesBola.style.display = "none"; // <--- Esconde mouse

    this.el.setAttribute(
      "dynamic-body",
      `shape: sphere; mass: ${this.massaBola}; linearDamping: 0; angularDamping: 0.02`
    );
    document.removeEventListener("mousedown", this.processarAcao);
  },
});

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

AFRAME.registerComponent("controle-pulo", {
  schema: {
    forca: { type: "number", default: 8 },
    gravidade: { type: "number", default: -15 },
  },

  init: function () {
    this.velocidadeY = 0;
    this.noChao = true;

    this.pular = this.pular.bind(this);

    window.addEventListener("keydown", this.pular);
  },

  pular: function (e) {
    if (e.code === "Space" && this.noChao) {
      this.velocidadeY = this.data.forca;
      this.noChao = false;
    }
  },

  tick: function (time, timeDelta) {
    if (this.noChao) return;

    var delta = timeDelta / 1000;

    this.velocidadeY += this.data.gravidade * delta;

    var rig = this.el.object3D;
    rig.position.y += this.velocidadeY * delta;

    if (rig.position.y <= 0) {
      rig.position.y = 0;
      this.velocidadeY = 0;
      this.noChao = true;
    }
  },

  remove: function () {
    window.removeEventListener("keydown", this.pular);
  },
});

AFRAME.registerComponent("movimento-fps", {
  schema: {
    velocidade: { type: "number", default: 0.1 },
  },

  init: function () {
    this.teclas = { W: false, A: false, S: false, D: false };
    this.camera = document.getElementById("camera-jogador");

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  },

  onKeyDown: function (e) {
    const k = e.code;
    if (k === "KeyW" || k === "ArrowUp") this.teclas.W = true;
    if (k === "KeyA" || k === "ArrowLeft") this.teclas.A = true;
    if (k === "KeyS" || k === "ArrowDown") this.teclas.S = true;
    if (k === "KeyD" || k === "ArrowRight") this.teclas.D = true;
  },

  onKeyUp: function (e) {
    const k = e.code;
    if (k === "KeyW" || k === "ArrowUp") this.teclas.W = false;
    if (k === "KeyA" || k === "ArrowLeft") this.teclas.A = false;
    if (k === "KeyS" || k === "ArrowDown") this.teclas.S = false;
    if (k === "KeyD" || k === "ArrowRight") this.teclas.D = false;
  },

  tick: function (t, dt) {
    if (!this.camera) return;
    if (!this.teclas.W && !this.teclas.A && !this.teclas.S && !this.teclas.D)
      return;

    const direcao = new THREE.Vector3();
    this.camera.object3D.getWorldDirection(direcao);

    direcao.multiplyScalar(-1);

    direcao.y = 0;
    direcao.normalize();

    const lateral = new THREE.Vector3();
    lateral.crossVectors(this.camera.object3D.up, direcao).normalize();

    const movimento = new THREE.Vector3(0, 0, 0);
    const fatorTempo = dt / 16.6;
    const vel = this.data.velocidade * fatorTempo;

    if (this.teclas.W) movimento.add(direcao);
    if (this.teclas.S) movimento.sub(direcao);
    if (this.teclas.D) movimento.sub(lateral);
    if (this.teclas.A) movimento.add(lateral);

    this.el.object3D.position.x += movimento.x * vel;
    this.el.object3D.position.z += movimento.z * vel;
  },

  remove: function () {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  },
});
