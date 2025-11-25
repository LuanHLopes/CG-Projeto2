AFRAME.registerComponent("debug-limites", {
  schema: {
    cor: { type: "color", default: "red" },
    ativado: { type: "boolean", default: true },
  },

  init: function () {
    if (!this.data.ativado) return;

    // Dimensões exatas baseadas no seu index.html (a-plane do chão)
    // Largura: 15.24 | Altura (Profundidade): 14.325
    const largura = 15.24;
    const profundidade = 14.325;
    const metadeLarg = largura / 2;
    const metadeProf = profundidade / 2;

    // Centros das quadras (baseado no position do index.html)
    const centroA = { x: 0, y: 0.05, z: -7.1625 }; // Quadra Home
    const centroB = { x: 0, y: 0.05, z: 7.1625 }; // Quadra Guest

    // Função para desenhar um retângulo de linhas
    const desenharRetangulo = (centro, nome) => {
      const parent = document.createElement("a-entity");
      parent.setAttribute("id", `debug-limites-${nome}`);

      // Coordenadas dos 4 cantos
      const p1 = {
        x: centro.x - metadeLarg,
        y: centro.y,
        z: centro.z - metadeProf,
      }; // Esquerda Trás
      const p2 = {
        x: centro.x + metadeLarg,
        y: centro.y,
        z: centro.z - metadeProf,
      }; // Direita Trás
      const p3 = {
        x: centro.x + metadeLarg,
        y: centro.y,
        z: centro.z + metadeProf,
      }; // Direita Frente
      const p4 = {
        x: centro.x - metadeLarg,
        y: centro.y,
        z: centro.z + metadeProf,
      }; // Esquerda Frente

      // Cria as 4 linhas conectando os pontos
      this.criarLinha(parent, p1, p2);
      this.criarLinha(parent, p2, p3);
      this.criarLinha(parent, p3, p4);
      this.criarLinha(parent, p4, p1);

      // Cria um X no meio para marcar o centro exato
      this.criarLinha(parent, p1, p3);
      this.criarLinha(parent, p2, p4);

      this.el.appendChild(parent);
      console.log(`📏 Limites desenhados para: ${nome}`);
    };

    desenharRetangulo(centroA, "quadra-a");
    desenharRetangulo(centroB, "quadra-b");
  },

  criarLinha: function (parent, start, end) {
    const linha = document.createElement("a-entity");
    linha.setAttribute("line", {
      start: `${start.x} ${start.y} ${start.z}`,
      end: `${end.x} ${end.y} ${end.z}`,
      color: this.data.cor,
      opacity: 1,
    });
    parent.appendChild(linha);
  },
});