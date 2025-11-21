AFRAME.registerComponent("movimento-fps", {
  schema: {
    velocidadeAndar: { type: "number", default: 0.08 },
    velocidadeCorrer: { type: "number", default: 0.25 },
  },

  init: function () {
    this.teclas = { W: false, A: false, S: false, D: false, Shift: false };
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
    if (e.key === "Shift") this.teclas.Shift = true;
  },

  onKeyUp: function (e) {
    const k = e.code;
    if (k === "KeyW" || k === "ArrowUp") this.teclas.W = false;
    if (k === "KeyA" || k === "ArrowLeft") this.teclas.A = false;
    if (k === "KeyS" || k === "ArrowDown") this.teclas.S = false;
    if (k === "KeyD" || k === "ArrowRight") this.teclas.D = false;
    if (e.key === "Shift") this.teclas.Shift = false;
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

    const velocidadeBase = this.teclas.Shift
      ? this.data.velocidadeCorrer
      : this.data.velocidadeAndar;

    const vel = velocidadeBase * fatorTempo;

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