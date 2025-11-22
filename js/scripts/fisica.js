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