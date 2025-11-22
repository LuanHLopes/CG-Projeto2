AFRAME.registerComponent("debug-zonas", {
  schema: {
    ativado: { type: "boolean", default: true },
    cor: { type: "color", default: "#FF0000" },
  },

  init: function () {
    if (!this.data.ativado) return;

    const zonas = ["zona-3pts-1", "zona-3pts-2"];

    zonas.forEach((id) => {
      const container = document.getElementById(id);
      if (!container) return;

      const partes = container.querySelectorAll(".molde-geometria");

      partes.forEach((pecaOriginal) => {
        const debugPeca = pecaOriginal.cloneNode(false);

        debugPeca.removeAttribute("id");
        debugPeca.removeAttribute("class");

        debugPeca.setAttribute("color", this.data.cor);
        debugPeca.setAttribute("opacity", "0.6");
        debugPeca.setAttribute(
          "material",
          "shader: flat; side: double; transparent: true"
        );

        const posAntiga = pecaOriginal.getAttribute("position");
        debugPeca.setAttribute("position", {
          x: posAntiga.x,
          y: posAntiga.y + 0.02,
          z: posAntiga.z,
        });

        container.appendChild(debugPeca);
      });

      console.log(`Debug gerado para ${id} com base na geometria original.`);
    });
  },
});