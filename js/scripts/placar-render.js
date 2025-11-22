AFRAME.registerComponent("digito-led", {
  schema: {
    corAtiva: { type: "color", default: "red" },
    corInativa: { type: "color", default: "#222222" },
    tamanho: { type: "number", default: 1 },
    espessura: { type: "number", default: 0.05 },
  },

  init: function () {
    const s = this.data.tamanho;
    const p = this.data.espessura;
    const corInativa = this.data.corInativa;
    const corAtiva = this.data.corAtiva;
    const gap = p * 0.2;
    const step = p + gap;

    function criarPixel(gridX, gridY, parent, color) {
      const el = document.createElement("a-plane");
      el.setAttribute("position", `${gridX * step} ${gridY * step} 0`);
      el.setAttribute("width", p);
      el.setAttribute("height", p);
      el.setAttribute("color", color);
      el.setAttribute("shader", "flat");
      el.setAttribute("side", "double");
      parent.appendChild(el);
      return el;
    }

    function criarSegmento(listaCoordenadas, color) {
      const container = document.createElement("a-entity");
      listaCoordenadas.forEach((coord) => {
        criarPixel(coord[0], coord[1], container, color);
      });
      this.el.appendChild(container);
      return container;
    }

    this.segmentos = [
      criarSegmento.call(
        this,
        [
          [-1.5, 3],
          [-0.5, 3],
          [0.5, 3],
          [1.5, 3],
        ],
        corInativa
      ), // A
      criarSegmento.call(
        this,
        [
          [1.5, 3],
          [1.5, 2],
          [1.5, 1],
          [1.5, 0],
        ],
        corInativa
      ), // B
      criarSegmento.call(
        this,
        [
          [1.5, 0],
          [1.5, -1],
          [1.5, -2],
          [1.5, -3],
        ],
        corInativa
      ), // C
      criarSegmento.call(
        this,
        [
          [-1.5, -3],
          [-0.5, -3],
          [0.5, -3],
          [1.5, -3],
        ],
        corInativa
      ), // D
      criarSegmento.call(
        this,
        [
          [-1.5, 0],
          [-1.5, -1],
          [-1.5, -2],
          [-1.5, -3],
        ],
        corInativa
      ), // E
      criarSegmento.call(
        this,
        [
          [-1.5, 0],
          [-1.5, 2],
          [-1.5, 1],
          [-1.5, 3],
        ],
        corInativa
      ), // F
      criarSegmento.call(
        this,
        [
          [-1.5, 0],
          [-0.5, 0],
          [0.5, 0],
          [1.5, 0],
        ],
        corInativa
      ), // G
    ];
    this.el.object3D.scale.set(s, s, 1);

    this.setNumero(0);
  },

  setNumero: function (num) {
    const segmentosPorNumero = [
      [1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 0, 0, 0, 0],
      [1, 1, 0, 1, 1, 0, 1],
      [1, 1, 1, 1, 0, 0, 1],
      [0, 1, 1, 0, 0, 1, 1],
      [1, 0, 1, 1, 0, 1, 1],
      [1, 0, 1, 1, 1, 1, 1],
      [1, 1, 1, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 0, 1, 1],
    ];
    const corAtiva = this.data.corAtiva;
    const corInativa = this.data.corInativa;
    num = Math.max(0, Math.min(9, Number(num) || 0));
    const ativos = segmentosPorNumero[num];
    this.segmentos.forEach((seg, idx) => {
      seg.setAttribute("visible", !!ativos[idx]);
      Array.from(seg.children).forEach((pixel) => {
        pixel.setAttribute("color", ativos[idx] ? corAtiva : corInativa);
      });
    });
  },
});
