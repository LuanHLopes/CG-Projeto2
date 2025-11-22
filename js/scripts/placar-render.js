AFRAME.registerComponent("digito-led", {
  schema: {
    corAtiva: { type: "color", default: "#FF0000" },
    corInativa: { type: "color", default: "#222222" }, // Cinza escuro
    tamanho: { type: "number", default: 1 }, // Escala global do número
    espessura: { type: "number", default: 0.05 } // Tamanho do pixel
  },

  init: function () {
    const s = this.data.tamanho; // Scale factor
    const p = this.data.espessura; // Pixel size
    const cor = this.data.corInativa;
    
    // Espaço entre pixels (20% do tamanho do pixel)
    const gap = p * 0.2; 
    const step = p + gap; // Distância do centro de um pixel ao outro

    // Função auxiliar para criar UM pixel na posição X, Y (coordenadas da grade)
    const criarPixel = (gridX, gridY, parent) => {
      const el = document.createElement("a-plane");
      // Multiplicamos pela 'step' para posicionar na grade real
      el.setAttribute("position", `${gridX * step} ${gridY * step} 0`);
      el.setAttribute("width", p);
      el.setAttribute("height", p);
      el.setAttribute("color", cor);
      el.setAttribute("shader", "flat");
      el.setAttribute("side", "double");
      parent.appendChild(el);
    };

    // Função para criar um grupo de pixels (um segmento)
    const criarSegmento = (listaCoordenadas) => {
      const container = document.createElement("a-entity");
      listaCoordenadas.forEach(coord => {
        criarPixel(coord[0], coord[1], container);
      });
      this.el.appendChild(container);
      return container;
    };

    // --- MAPEAMENTO DA GRADE (4x7) ---
    // O centro é (0,0). As colunas X são: -1.5, -0.5, 0.5, 1.5
    // As linhas Y variam de 3 (topo) até -3 (base)

    // (A) TOPO: Linha Y = 3
    const segA = criarSegmento([[-1.5, 3], [-0.5, 3], [0.5, 3], [1.5, 3]]);

    // (B) TOPO DIR: Coluna X = 1.5, Linhas Y = 2, 1
    const segB = criarSegmento([[1.5, 2], [1.5, 1]]);

    // (C) BAIXO DIR: Coluna X = 1.5, Linhas Y = -1, -2
    const segC = criarSegmento([[1.5, -1], [1.5, -2]]);

    // (D) BASE: Linha Y = -3
    const segD = criarSegmento([[-1.5, -3], [-0.5, -3], [0.5, -3], [1.5, -3]]);

    // (E) BAIXO ESQ: Coluna X = -1.5, Linhas Y = -1, -2
    const segE = criarSegmento([[-1.5, -1], [-1.5, -2]]);

    // (F) TOPO ESQ: Coluna X = -1.5, Linhas Y = 2, 1
    const segF = criarSegmento([[-1.5, 2], [-1.5, 1]]);

    // (G) MEIO: Linha Y = 0
    const segG = criarSegmento([[-1.5, 0], [-0.5, 0], [0.5, 0], [1.5, 0]]);

    // Aplica a escala global no final para ajustar o tamanho no placar
    this.el.object3D.scale.set(s, s, 1);

    // Guarda referências
    this.segmentos = [segA, segB, segC, segD, segE, segF, segG];
  },
});