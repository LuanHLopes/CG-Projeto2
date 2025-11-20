// script.js - Apenas configuração de materiais
AFRAME.registerComponent('config-fisica', {
  schema: {
    restituicao: { type: 'number', default: 0.5 }, // 0 = não quica, 1 = quica muito
    atrito: { type: 'number', default: 0.5 }       // 0 = gelo, 1 = lixa
  },
  init: function () {
    // Aguarda o objeto físico existir antes de configurar
    this.el.addEventListener('body-loaded', () => {
      if (this.el.body) {
        this.el.body.restitution = this.data.restituicao;
        this.el.body.friction = this.data.atrito;
        this.el.body.updateMassProperties();
      }
    });
  }
});