AFRAME.registerComponent("movimento-fps", {
  schema: {
    velocidadeAndar: { type: "number", default: 0.08 },
    velocidadeCorrer: { type: "number", default: 0.25 },
  },

  init: function () {
    this.teclas = { W: false, A: false, S: false, D: false, Shift: false };
    this.camera = document.getElementById("camera-jogador");

    // Variáveis auxiliares para não criar lixo na memória (Garbage Collection)
    this.quat = new THREE.Quaternion();
    this.euler = new THREE.Euler(0, 0, 0, "YXZ"); // Ordem YXZ isola o Yaw corretamente
    this.vecFrente = new THREE.Vector3();
    this.vecLado = new THREE.Vector3();

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

    if (window.estadoJogo.status === window.GAME_STATUS.CONTAGEM) return;

    if (!this.teclas.W && !this.teclas.A && !this.teclas.S && !this.teclas.D)
      return;

    // 1. Pega a rotação do mundo da câmera (Quaternion)
    this.camera.object3D.getWorldQuaternion(this.quat);

    // 2. Converte para Euler ignorando o Pitch (X) e Roll (Z) para o movimento
    this.euler.setFromQuaternion(this.quat, "YXZ");
    const yaw = this.euler.y; // Esse é o ângulo horizontal puro

    // 3. Calcula o vetor FRENTE baseado apenas no seno/cosseno do ângulo Y
    // No Three.js, "Frente" é geralmente -Z
    this.vecFrente.set(-Math.sin(yaw), 0, -Math.cos(yaw));

    // 4. Calcula o vetor LADO (Cross product com UP ou rotação de 90 graus)
    // Cross product de (Frente, Up) resulta na Direita
    this.vecLado
      .copy(this.vecFrente)
      .cross(this.camera.object3D.up)
      .normalize();

    const movimento = new THREE.Vector3(0, 0, 0);
    const fatorTempo = dt / 16.6;

    const velocidadeBase = this.teclas.Shift
      ? this.data.velocidadeCorrer
      : this.data.velocidadeAndar;

    const vel = velocidadeBase * fatorTempo;

    // Aplica o movimento nos vetores calculados (que agora são estáveis)
    if (this.teclas.W) movimento.add(this.vecFrente);
    if (this.teclas.S) movimento.sub(this.vecFrente);

    // Nota: Inverti a lógica aqui para corrigir padrão WASD se necessário,
    // mas geralmente D é direita (subtrai do cross product dependendo da ordem)
    // Se D estiver indo para esquerda, inverta o .add e .sub abaixo
    if (this.teclas.D) movimento.add(this.vecLado);
    if (this.teclas.A) movimento.sub(this.vecLado);

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
    if (window.estadoJogo.status === window.GAME_STATUS.CONTAGEM) return;

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
