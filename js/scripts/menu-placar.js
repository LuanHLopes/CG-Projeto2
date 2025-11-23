AFRAME.registerComponent("menu-placar", {
  init: function () {
    // TEXTURAS -------------------------------------------------------------
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

    const canvasBg = document.createElement("canvas");
    canvasBg.width = 256;
    canvasBg.height = 512;
    const ctxBg = canvasBg.getContext("2d");
    ctxBg.clearRect(0, 0, canvasBg.width, canvasBg.height);
    ctxBg.strokeStyle = "rgba(255,255,255,0.9)";
    ctxBg.lineWidth = 2;
    ctxBg.beginPath();
    ctxBg.rect(2, 2, 252, 508);
    ctxBg.stroke();
    const texBgId = "tex-submenu-bg-square";
    if (!document.getElementById(texBgId)) {
      const imgBg = document.createElement("img");
      imgBg.id = texBgId;
      imgBg.src = canvasBg.toDataURL();
      document.querySelector("a-assets").appendChild(imgBg);
    }

    // Variáveis globais para seleção
    window.tempoCronometro = window.tempoCronometro || 60; // Timer inicial
    window.cestaSelecionada = window.cestaSelecionada || 1; // Cesta inicial

    // ESTRUTURA FIXA -------------------------------------------------------
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

    // GERADOR DE ITENS -----------------------------------------------------
    const criarItem = (parentContainer, texto, yOffset, adicionarCirculo) => {
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

      let fundo = null;
      let borda = null;
      if (adicionarCirculo) {
        const raioBorda = 0.1;
        const raioFundo = 0.09;

        // Círculo preto (fundo)
        fundo = document.createElement("a-circle");
        fundo.setAttribute("radius", raioFundo);
        fundo.setAttribute("color", "black");
        fundo.setAttribute("opacity", "0"); // inicia invisível
        fundo.setAttribute("side", "double");
        fundo.setAttribute("segments", "128");
        fundo.setAttribute("position", "0.86 0 0.01");
        itemGroup.appendChild(fundo);

        // Tarus branco (borda)
        borda = document.createElement("a-torus");
        borda.setAttribute("radius", raioBorda);
        borda.setAttribute("radius-tubular", "0.005");
        borda.setAttribute("color", "white");
        borda.setAttribute("opacity", "0.5");
        borda.setAttribute("segments-radial", "128");
        borda.setAttribute("side", "double");
        borda.setAttribute("position", "0.86 0 0.012");
        itemGroup.appendChild(borda);
      }

      return { bgItem, itemGroup, fundo, borda };
    };

    // MENU PRINCIPAL ------------------------------------------------------
    const menuPrincipal = document.createElement("a-entity");
    menuPrincipal.setAttribute("id", "menu-principal");
    menuPrincipal.setAttribute("position", `2.9 0.025 ${profundidade}`);
    container.appendChild(menuPrincipal);

    const principalItens = [];
    principalItens.push(criarItem(menuPrincipal, "Selecionar Cesta", 1.225));
    principalItens.push(criarItem(menuPrincipal, "Definir Timer", 0.775));
    principalItens.push(criarItem(menuPrincipal, "Desafio 21 Pontos", 0.325));
    principalItens.push(criarItem(menuPrincipal, "Desafio Sem Mira", -0.125));
    principalItens.push(criarItem(menuPrincipal, "Desafio 5 Cestas", -0.575));

    // SUBMENU TIMER
    const submenuTimer = document.createElement("a-entity");
    submenuTimer.setAttribute("id", "submenu-timer");
    submenuTimer.setAttribute("position", `5.4 0.8 ${profundidade}`);
    container.appendChild(submenuTimer);

    const bgSubmenu = document.createElement("a-plane");
    bgSubmenu.setAttribute("src", `#${texBgId}`);
    bgSubmenu.setAttribute("width", "2.4");
    bgSubmenu.setAttribute("height", "1.5");
    bgSubmenu.setAttribute("transparent", "true");
    bgSubmenu.setAttribute("shader", "flat");
    bgSubmenu.setAttribute("color", "#222222");
    bgSubmenu.setAttribute("opacity", "1");
    bgSubmenu.setAttribute("position", "0.85 -0.45 -0.01");
    submenuTimer.appendChild(bgSubmenu);

    // SUBMENU CESTA
    const submenuCesta = document.createElement("a-entity");
    submenuCesta.setAttribute("id", "submenu-cesta");
    const parentPos = principalItens[0].itemGroup.getAttribute("position");
    const yParent = parentPos.y;

    submenuCesta.setAttribute("position", `5.4 ${yParent} ${profundidade}`);

    container.appendChild(submenuCesta);

    const bgSubmenuCesta = document.createElement("a-plane");
    bgSubmenuCesta.setAttribute("src", `#${texBgId}`);
    bgSubmenuCesta.setAttribute("width", "2.4");
    bgSubmenuCesta.setAttribute("height", "1.0");
    bgSubmenuCesta.setAttribute("transparent", "true");
    bgSubmenuCesta.setAttribute("shader", "flat");
    bgSubmenuCesta.setAttribute("color", "#222222");
    bgSubmenuCesta.setAttribute("opacity", "1");
    bgSubmenuCesta.setAttribute("position", "0.85 -0.225 -0.01");
    submenuCesta.appendChild(bgSubmenuCesta);

    const valoresTimer = [30, 60, 90];
    const subItens = [
      criarItem(submenuTimer, "30s", 0, true),
      criarItem(submenuTimer, "60s", -0.45, true),
      criarItem(submenuTimer, "90s", -0.9, true),
    ];

    const valoresCesta = [1, 2];
    const subItensCesta = [
      criarItem(submenuCesta, "Cesta 1", 0, true),
      criarItem(submenuCesta, "Cesta 2", -0.45, true),
    ];

    // Seleção visual:
    function marcarFundoSelecionado(ref, selecionado) {
      if (ref.fundo) {
        if (selecionado) {
          ref.fundo.setAttribute("color", "green");
          ref.fundo.setAttribute("opacity", "1");
        } else {
          ref.fundo.setAttribute("opacity", "0");
        }
      }
    }

    // Clique timer:
    subItens.forEach((ref, idx) => {
      ref.bgItem.addEventListener("click", () => {
        window.setarTempoCronometro(valoresTimer[idx]);
        subItens.forEach((r) => marcarFundoSelecionado(r, false));
        marcarFundoSelecionado(ref, true);
        fecharSubmenu();
      });
    });

    // Clique cesta:
    subItensCesta.forEach((ref, idx) => {
      ref.bgItem.addEventListener("click", () => {
        window.cestaSelecionada = valoresCesta[idx];
        console.log("Cesta selecionada:", window.cestaSelecionada);
        subItensCesta.forEach((r) => marcarFundoSelecionado(r, false));
        marcarFundoSelecionado(ref, true);
        fecharSubmenu();
      });
    });

    // LINHA DE CONEXÃO
    const linhaConexao = document.createElement("a-plane");
    linhaConexao.setAttribute("color", "#222222");
    linhaConexao.setAttribute("opacity", "0.9");
    linhaConexao.setAttribute("shader", "flat");
    linhaConexao.setAttribute("position", `4.95 0.775 ${profundidade - 0.001}`);
    linhaConexao.setAttribute("width", "0.22");
    linhaConexao.setAttribute("height", "0.035");
    linhaConexao.setAttribute("visible", false);
    container.appendChild(linhaConexao);

    this.menuContainer = container;
    let submenuAberto = null;
    let itemSelecionado = null;
    submenuTimer.setAttribute("visible", false);
    submenuCesta.setAttribute("visible", false);

    // Cor sem animação
    function fixaCorSelecionado(ref) {
      ref.bgItem.removeAttribute("animation__color_in");
      ref.bgItem.removeAttribute("animation__color_out");
      ref.bgItem.setAttribute("color", "#666666");
    }

    // Cor normal
    function restauraCorNormal(ref) {
      ref.bgItem.setAttribute("animation__color_in", {
        property: "color",
        to: "#666666",
        dur: 150,
        startEvents: "mouseenter",
      });
      ref.bgItem.setAttribute("animation__color_out", {
        property: "color",
        to: "#222222",
        dur: 150,
        startEvents: "mouseleave",
      });
      ref.bgItem.setAttribute("color", "#222222");
    }

    function abrirSubmenu(idxSubmenu) {
      // Fecha anterior
      if (submenuAberto) submenuAberto.setAttribute("visible", false);
      if (itemSelecionado && itemSelecionado !== principalItens[idxSubmenu]) {
        restauraCorNormal(itemSelecionado);
      }

      itemSelecionado = principalItens[idxSubmenu];

      linhaConexao.setAttribute("visible", true); // LINHA SEMPRE APARECE NO ITEM CLICADO

      if (idxSubmenu === 1) {
        submenuTimer.setAttribute("visible", true);
        submenuTimer.setAttribute("pointer-events", "auto"); // ATIVADO
        submenuTimer.setAttribute("scale", "1 1 1"); // ATIVO
        submenuAberto = submenuTimer;
        fixaCorSelecionado(itemSelecionado);
        subItens.forEach((ref, i) => {
          const valor = valoresTimer[i];
          marcarFundoSelecionado(ref, window.tempoCronometro === valor);
        });
        submenuCesta.setAttribute("visible", false);
        submenuCesta.setAttribute("pointer-events", "none"); // DESATIVADO
        submenuCesta.setAttribute("scale", "0 0 0"); // DESATIVADO
      } else if (idxSubmenu === 0) {
        const parentPos = principalItens[0].itemGroup.getAttribute("position");
        const yParent = parentPos.y;
        submenuCesta.setAttribute("position", `5.4 ${yParent} ${profundidade}`);
        submenuCesta.setAttribute("visible", true);
        submenuCesta.setAttribute("pointer-events", "auto"); // ATIVADO
        submenuCesta.setAttribute("scale", "1 1 1"); // ATIVO
        submenuAberto = submenuCesta;
        fixaCorSelecionado(itemSelecionado);
        subItensCesta.forEach((ref, i) => {
          const valor = valoresCesta[i];
          marcarFundoSelecionado(ref, window.cestaSelecionada === valor);
        });
        submenuTimer.setAttribute("visible", false);
        submenuTimer.setAttribute("pointer-events", "none"); // DESATIVADO
        submenuTimer.setAttribute("scale", "0 0 0"); // DESATIVADO
      } else {
        submenuAberto = null;
        submenuTimer.setAttribute("visible", false);
        submenuTimer.setAttribute("pointer-events", "none"); // DESATIVADO
        submenuTimer.setAttribute("scale", "0 0 0"); // DESATIVADO
        submenuCesta.setAttribute("visible", false);
        submenuCesta.setAttribute("pointer-events", "none"); // DESATIVADO
        submenuCesta.setAttribute("scale", "0 0 0"); // DESATIVADO
        linhaConexao.setAttribute("visible", false); // DESLIGA SE NÃO ESTIVER EM SUBMENU
        fixaCorSelecionado(itemSelecionado);
      }
    }

    function fecharSubmenu() {
      submenuTimer.setAttribute("visible", false);
      submenuTimer.setAttribute("pointer-events", "none"); // DESATIVA
      submenuCesta.setAttribute("visible", false);
      submenuCesta.setAttribute("pointer-events", "none"); // DESATIVA
      linhaConexao.setAttribute("visible", false);
      if (itemSelecionado) {
        restauraCorNormal(itemSelecionado);
      }
      submenuAberto = null;
    }

    principalItens.forEach((ref, idx) => {
      ref.bgItem.addEventListener("click", () => {
        abrirSubmenu(idx);

        if (idx === 0 || idx === 1) {
          const itemPos = ref.itemGroup.getAttribute("position");
          let yLinha = itemPos.y;

          linhaConexao.setAttribute(
            "position",
            `4.95 ${yLinha} ${profundidade - 0.001}`
          );
          linhaConexao.setAttribute("visible", true);
        } else {
          linhaConexao.setAttribute("visible", false);
        }
      });
      ref.bgItem.addEventListener("mouseleave", () => {
        const submenuAtivo = submenuAberto && itemSelecionado === ref;
        if (!submenuAtivo && itemSelecionado !== ref) {
          ref.bgItem.setAttribute("color", "#222222");
        }
      });
    });
  },
});
