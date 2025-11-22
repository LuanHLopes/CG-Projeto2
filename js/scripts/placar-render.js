AFRAME.registerComponent("digito-led", {
  schema: {
    corAtiva: { type: "color", default: "#FF0000" },
    corInativa: { type: "color", default: "#222222" },
    tamanho: { type: "number", default: 1 }, 
    espessura: { type: "number", default: 0.05 } 
  },

  init: function () {
    const s = this.data.tamanho; 
    const p = this.data.espessura; 
    const cor = this.data.corInativa;
    
    const gap = p * 0.2; 
    const step = p + gap; 

    const criarPixel = (gridX, gridY, parent) => {
      const el = document.createElement("a-plane");
      el.setAttribute("position", `${gridX * step} ${gridY * step} 0`);
      el.setAttribute("width", p);
      el.setAttribute("height", p);
      el.setAttribute("color", cor);
      el.setAttribute("shader", "flat");
      el.setAttribute("side", "double");
      parent.appendChild(el);
    };

    const criarSegmento = (listaCoordenadas) => {
      const container = document.createElement("a-entity");
      listaCoordenadas.forEach(coord => {
        criarPixel(coord[0], coord[1], container);
      });
      this.el.appendChild(container);
      return container;
    };

    const segA = criarSegmento([[-1.5, 3], [-0.5, 3], [0.5, 3], [1.5, 3]]);

    const segB = criarSegmento([[1.5, 2], [1.5, 1]]);

    const segC = criarSegmento([[1.5, -1], [1.5, -2]]);

    const segD = criarSegmento([[-1.5, -3], [-0.5, -3], [0.5, -3], [1.5, -3]]);

    const segE = criarSegmento([[-1.5, -1], [-1.5, -2]]);

    const segF = criarSegmento([[-1.5, 2], [-1.5, 1]]);

    const segG = criarSegmento([[-1.5, 0], [-0.5, 0], [0.5, 0], [1.5, 0]]);

    this.el.object3D.scale.set(s, s, 1);

    this.segmentos = [segA, segB, segC, segD, segE, segF, segG];
  },
});