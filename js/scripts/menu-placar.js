AFRAME.registerComponent("menu-placar", {
  init: function () {
    // =================================================================
    // 1. TEXTURAS (CANVAS)
    // =================================================================

    // --- Textura Tecla F ---
    const canvasF = document.createElement("canvas");
    canvasF.width = 128;
    canvasF.height = 128;
    const ctxF = canvasF.getContext("2d");
    ctxF.fillStyle = "rgba(30, 30, 30, 0.85)";
    ctxF.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctxF.lineWidth = 4;
    ctxF.beginPath();
    ctxF.roundRect(2, 2, 124, 124, 35);
    ctxF.fill();
    ctxF.stroke();

    const texFId = "tex-tecla-f-glass";
    if (!document.getElementById(texFId)) {
      const imgF = document.createElement("img");
      imgF.id = texFId;
      imgF.src = canvasF.toDataURL();
      document.querySelector("a-assets").appendChild(imgF);
    }

    // --- Textura Item Menu (Horizontal) ---
    const canvasItem = document.createElement("canvas");
    canvasItem.width = 512;
    canvasItem.height = 120;
    const ctxItem = canvasItem.getContext("2d");
    ctxItem.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctxItem.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctxItem.lineWidth = 4;
    ctxItem.beginPath();
    ctxItem.roundRect(2, 2, 508, 116, 35);
    ctxItem.fill();
    ctxItem.stroke();

    const texItemId = "tex-menu-item-white";
    if (!document.getElementById(texItemId)) {
      const imgItem = document.createElement("img");
      imgItem.id = texItemId;
      imgItem.src = canvasItem.toDataURL();
      document.querySelector("a-assets").appendChild(imgItem);
    }

    // --- NOVA TEXTURA: Fundo do Submenu (RETO / QUADRADO) ---
    const canvasBg = document.createElement("canvas");
    canvasBg.width = 256;
    canvasBg.height = 512;
    const ctxBg = canvasBg.getContext("2d");
    ctxBg.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctxBg.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctxBg.lineWidth = 4;
    ctxBg.beginPath();

    // ALTERAÇÃO: Usando rect() em vez de roundRect() para cantos vivos
    ctxBg.rect(2, 2, 252, 508);

    ctxBg.fill();
    ctxBg.stroke();

    const texBgId = "tex-submenu-bg-square"; // ID novo
    if (!document.getElementById(texBgId)) {
      const imgBg = document.createElement("img");
      imgBg.id = texBgId;
      imgBg.src = canvasBg.toDataURL();
      document.querySelector("a-assets").appendChild(imgBg);
    }

    // =================================================================
    // 2. ESTRUTURA FIXA (ESQUERDA)
    // =================================================================
    const container = document.createElement("a-entity");
    container.setAttribute("position", "4.35 10.0 -8.3");
    container.setAttribute("rotation", "0 -10 0");
    this.el.appendChild(container);

    const bolaAncora = document.createElement("a-circle");
    bolaAncora.setAttribute("radius", "0.03");
    bolaAncora.setAttribute("color", "white");
    bolaAncora.setAttribute("shader", "flat");
    container.appendChild(bolaAncora);

    const profundidade = 0.05;

    const linhaDiagonal = document.createElement("a-entity");
    linhaDiagonal.setAttribute("line", {
      start: "0 0 0",
      end: `0.5 0.5 ${profundidade}`,
      color: "white",
      opacity: 0.8,
    });
    container.appendChild(linhaDiagonal);

    const linhaHorizontal = document.createElement("a-entity");
    linhaHorizontal.setAttribute("line", {
      start: `0.5 0.5 ${profundidade}`,
      end: `0.8 0.5 ${profundidade}`,
      color: "white",
      opacity: 0.8,
    });
    container.appendChild(linhaHorizontal);

    const titulo = document.createElement("a-text");
    titulo.setAttribute("value", "Placar");
    titulo.setAttribute("font", "roboto");
    titulo.setAttribute("color", "white");
    titulo.setAttribute("align", "left");
    titulo.setAttribute("baseline", "center");
    titulo.setAttribute("width", "10");
    titulo.setAttribute("position", `0.9 0.5 ${profundidade}`);
    titulo.setAttribute("side", "double");
    container.appendChild(titulo);

    const grupoF = document.createElement("a-entity");
    grupoF.setAttribute("position", `1.2 0.15 ${profundidade}`);
    container.appendChild(grupoF);

    const bgTecla = document.createElement("a-plane");
    bgTecla.setAttribute("src", `#${texFId}`);
    bgTecla.setAttribute("width", "0.22");
    bgTecla.setAttribute("height", "0.22");
    bgTecla.setAttribute("transparent", "true");
    bgTecla.setAttribute("shader", "flat");
    bgTecla.setAttribute("position", "0.11 0 0");
    grupoF.appendChild(bgTecla);

    const letraTecla = document.createElement("a-text");
    letraTecla.setAttribute("value", "F");
    letraTecla.setAttribute("font", "roboto");
    letraTecla.setAttribute("align", "center");
    letraTecla.setAttribute("baseline", "center");
    letraTecla.setAttribute("color", "white");
    letraTecla.setAttribute("scale", "0.3 0.3 1");
    letraTecla.setAttribute("width", "10");
    letraTecla.setAttribute("position", "0 0 0.01");
    bgTecla.appendChild(letraTecla);

    const textoInteragir = document.createElement("a-text");
    textoInteragir.setAttribute("value", "Interagir");
    textoInteragir.setAttribute("font", "roboto");
    textoInteragir.setAttribute("color", "white");
    textoInteragir.setAttribute("align", "left");
    textoInteragir.setAttribute("baseline", "center");
    textoInteragir.setAttribute("width", "5");
    textoInteragir.setAttribute("opacity", "0.8");
    textoInteragir.setAttribute("position", "0.26 0 0");
    grupoF.appendChild(textoInteragir);

    // =================================================================
    // 3. FUNÇÃO GERADORA DE ITENS
    // =================================================================
    const criarItem = (parentContainer, texto, yOffset) => {
      const itemGroup = document.createElement("a-entity");
      itemGroup.setAttribute("position", `0.85 ${yOffset} 0`);
      parentContainer.appendChild(itemGroup);

      const bgItem = document.createElement("a-plane");
      bgItem.setAttribute("src", `#${texItemId}`);
      bgItem.setAttribute("width", "2.2");
      bgItem.setAttribute("height", "0.4");
      bgItem.setAttribute("transparent", "true");
      bgItem.setAttribute("shader", "flat");

      bgItem.classList.add("interativo");
      bgItem.setAttribute("color", "#222222");
      bgItem.setAttribute("opacity", "0.9");

      bgItem.setAttribute("animation__color_in", {
        property: "color",
        to: "#666666",
        dur: 150,
        startEvents: "mouseenter",
      });
      bgItem.setAttribute("animation__color_out", {
        property: "color",
        to: "#222222",
        dur: 150,
        startEvents: "mouseleave",
      });

      itemGroup.appendChild(bgItem);

      const textoItem = document.createElement("a-text");
      textoItem.setAttribute("value", texto);
      textoItem.setAttribute("font", "roboto");
      textoItem.setAttribute("color", "white");
      textoItem.setAttribute("align", "left");
      textoItem.setAttribute("baseline", "center");
      textoItem.setAttribute("width", "5");
      textoItem.setAttribute("position", "-0.95 0 0.01");
      itemGroup.appendChild(textoItem);
    };

    // =================================================================
    // 4. MENU PRINCIPAL
    // =================================================================
    const menuPrincipal = document.createElement("a-entity");
    menuPrincipal.setAttribute("id", "menu-principal");
    menuPrincipal.setAttribute("position", `2.9 0.025 ${profundidade}`);
    container.appendChild(menuPrincipal);

    criarItem(menuPrincipal, "Selecionar Cesta", 1.225);
    criarItem(menuPrincipal, "Definir Timer", 0.775);
    criarItem(menuPrincipal, "Desafio 21 Pontos", 0.325);
    criarItem(menuPrincipal, "Desafio Sem Mira", -0.125);
    criarItem(menuPrincipal, "Desafio 5 Cestas", -0.575);

    // =================================================================
    // 5. SUBMENU (COM FUNDO QUADRADO)
    // =================================================================
    const submenuTimer = document.createElement("a-entity");
    submenuTimer.setAttribute("id", "submenu-timer");
    submenuTimer.setAttribute("position", `5.4 0.8 ${profundidade}`);
    container.appendChild(submenuTimer);

    // Fundo Geral do Submenu (Agora usa a textura quadrada)
    const bgSubmenu = document.createElement("a-plane");
    bgSubmenu.setAttribute("src", `#${texBgId}`);
    bgSubmenu.setAttribute("width", "2.4");
    bgSubmenu.setAttribute("height", "1.5");
    bgSubmenu.setAttribute("transparent", "true");
    bgSubmenu.setAttribute("shader", "flat");
    bgSubmenu.setAttribute("color", "#222222");
    bgSubmenu.setAttribute("opacity", "0.9");
    bgSubmenu.setAttribute("position", "0.85 -0.45 -0.01");
    submenuTimer.appendChild(bgSubmenu);

    // Itens do Submenu
    criarItem(submenuTimer, "30s", 0);
    criarItem(submenuTimer, "60s", -0.45);
    criarItem(submenuTimer, "90s", -0.9);

    // =================================================================
    // 6. LINHA CONECTORA (GROSSA E SÓLIDA)
    // =================================================================
    const linhaConexao = document.createElement("a-plane");

    linhaConexao.setAttribute("color", "#222222");
    linhaConexao.setAttribute("opacity", "0.9");
    linhaConexao.setAttribute("shader", "flat");

    // Posicionamento da conexão entre Menu e Submenu
    linhaConexao.setAttribute("position", `4.95 0.775 ${profundidade}`);

    linhaConexao.setAttribute("width", "0.22");
    linhaConexao.setAttribute("height", "0.1");

    // Z-index para ficar atrás dos menus
    linhaConexao.setAttribute("position", `4.95 0.775 ${profundidade - 0.001}`);

    container.appendChild(linhaConexao);

    this.menuContainer = container;
  },
});