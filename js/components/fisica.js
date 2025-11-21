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