// script.js - Configuração de propriedades físicas para entidades A-Frame usando Physijs
AFRAME.registerComponent('config-fisica', {
  schema: {
    restituicao: { type: 'number', default: 0.5 },
    atrito: { type: 'number', default: 0.5 }      
  },
  init: function () {
    this.el.addEventListener('body-loaded', () => {
      if (this.el.body) {
        this.el.body.restitution = this.data.restituicao;
        this.el.body.friction = this.data.atrito;
        this.el.body.updateMassProperties();
      }
    });
  }
});

AFRAME.registerComponent("add-body-when-ready", {
  init() {
    this.el.addEventListener("model-loaded", () => {
      this.el.setAttribute("dynamic-body", {
        shape: "sphere",
        mass: 0.62,
        linearDamping: 0.01,
        angularDamping: 0.02
      });
    });
  }
});


AFRAME.registerComponent('mecanica-arremesso', {
  init: function () {
    this.camera = document.getElementById('camera-jogador');
    this.refMao = document.getElementById('posicao-mao'); 
    this.scene = document.querySelector('a-scene');
    
    this.segurando = false;
    
    // Configurações da Física (Parábola)
    this.forcaFrente = 6;  // Força para frente
    this.forcaCima = 6;    // Força para cima (gera o arco)

    this.arremessar = this.arremessar.bind(this);
    this.pegar = this.pegar.bind(this);

    this.el.addEventListener('click', this.pegar);
  },

  tick: function () {
    // Mantém a bola grudada na mão visualmente
    if (this.segurando && this.refMao) {
      this.refMao.object3D.updateMatrixWorld(true);

      var posicaoMundialMao = new THREE.Vector3();
      var rotacaoMundialMao = new THREE.Quaternion();
      this.refMao.object3D.getWorldPosition(posicaoMundialMao);
      this.refMao.object3D.getWorldQuaternion(rotacaoMundialMao);

      // Ajustes de coordenadas locais/globais
      if (this.el.object3D.parent) {
        this.el.object3D.parent.worldToLocal(posicaoMundialMao.clone());
      }
      
      this.el.object3D.position.copy(posicaoMundialMao);
      this.el.object3D.quaternion.copy(rotacaoMundialMao);

      if (this.el.object3D.parent && this.el.object3D.parent.type !== 'Scene') {
         this.el.object3D.parent.worldToLocal(this.el.object3D.position);
      }

      // Trava física enquanto segura
      if (this.el.body) {
        this.el.body.position.copy(posicaoMundialMao);
        this.el.body.quaternion.copy(rotacaoMundialMao);
        this.el.body.velocity.set(0,0,0);
        this.el.body.angularVelocity.set(0,0,0);
      }
    }
  },

  pegar: function () {
    if (this.segurando) return;
    if (!this.refMao) this.refMao = document.getElementById('posicao-mao');

    this.el.removeAttribute('dynamic-body');
    this.el.classList.remove('interativo');
    this.segurando = true;

    setTimeout(() => {
      document.addEventListener('mousedown', this.arremessar);
    }, 100);
  },

  arremessar: function () {
    if (!this.segurando) return;
    this.segurando = false;

    this.el.classList.add('interativo');
    this.el.setAttribute('dynamic-body', 'shape: sphere; mass: 0.62; linearDamping: 0.01; angularDamping: 0.02');

    setTimeout(() => {
      if (!this.el.body) return;
      
      // Zera movimentos anteriores
      this.el.body.velocity.set(0, 0, 0);
      this.el.body.angularVelocity.set(0, 0, 0);

      // --- CÁLCULO DO IMPULSO (PARÁBOLA) ---
      var direcao = new THREE.Vector3(0, 0, -1);
      direcao.applyQuaternion(this.camera.object3D.quaternion);
      
      // Remove inclinação vertical da câmera para controlar o arco manualmente
      direcao.y = 0; 
      direcao.normalize(); 
      
      // Aplica força horizontal
      direcao.multiplyScalar(this.forcaFrente);
      
      // Adiciona força vertical fixa para o arco
      direcao.y = this.forcaCima; 

      this.el.body.applyImpulse(direcao, new THREE.Vector3(0, 0, 0));
    }, 20);

    document.removeEventListener('mousedown', this.arremessar);
  }
});