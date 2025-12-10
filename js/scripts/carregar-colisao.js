AFRAME.registerComponent("auto-collider", {
  schema: {
    tipo: { type: "string", default: "hull" } 
  },

  init: function () {
    const el = this.el;
    
    const aplicarFisica = () => {
      if (el.body) return;

      el.setAttribute("static-body", `shape: ${this.data.tipo}`);
      console.log(`🛡️ Colisão (${this.data.tipo}) aplicada em:`, el.id || "modelo sem ID");
    };

    if (el.getObject3D('mesh')) {
      aplicarFisica();
    } else {
      el.addEventListener("model-loaded", aplicarFisica);
    }
  }
});