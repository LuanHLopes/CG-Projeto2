AFRAME.registerComponent("menu-placar", {
  init: function () {
    // === 1. TEXTURAS (MANTIDO) ===
    const criarTextura = (id, width, height, drawFn) => {
      if (!document.getElementById(id)) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        drawFn(ctx, width, height);
        const img = document.createElement("img");
        img.id = id;
        img.src = canvas.toDataURL();
        document.querySelector("a-assets").appendChild(img);
      }
    };

    criarTextura("tex-tecla-f-glass", 128, 128, (ctx, w, h) => {
      ctx.fillStyle = "rgba(30, 30, 30, 0.85)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(2, 2, w - 4, h - 4, 35);
      ctx.fill();
      ctx.stroke();
    });

    criarTextura("tex-menu-item-white", 512, 120, (ctx, w, h) => {
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(2, 2, w - 4, h - 4, 35);
      ctx.fill();
      ctx.stroke();
    });

    criarTextura("tex-submenu-bg-square", 256, 512, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(2, 2, w - 4, h - 4);
      ctx.stroke();
    });

    window.tempoCronometro = window.tempoCronometro || 90;
    window.cestaSelecionada = window.cestaSelecionada || 1;
    if (typeof window.configMira === "undefined") window.configMira = true;

    // === 2. ESTRUTURA VISUAL ===
    const container = document.createElement("a-entity");
    container.setAttribute("position", "4.35 10.0 -8.3");
    container.setAttribute("rotation", "0 -10 0");
    container.setAttribute("visible", false);

    this.el.appendChild(container);
    this.container = container;

    // Decoração
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

    // Título e Prompt
    const titulo = document.createElement("a-text");
    titulo.setAttribute("value", "Placar");
    titulo.setAttribute("font", "roboto");
    titulo.setAttribute("color", "white");
    titulo.setAttribute("align", "left");
    titulo.setAttribute("width", "10");
    titulo.setAttribute("position", `0.9 0.5 ${profundidade}`);
    container.appendChild(titulo);

    const grupoF = document.createElement("a-entity");
    grupoF.setAttribute("position", `1.2 0.15 ${profundidade}`);
    container.appendChild(grupoF);

    const bgTecla = document.createElement("a-plane");
    bgTecla.setAttribute("src", "#tex-tecla-f-glass");
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
    letraTecla.setAttribute("width", "10");
    letraTecla.setAttribute("scale", "0.3 0.3 1");
    letraTecla.setAttribute("position", "0 0 0.01");
    bgTecla.appendChild(letraTecla);

    const textoInteragir = document.createElement("a-text");
    textoInteragir.setAttribute("value", "Interagir");
    textoInteragir.setAttribute("font", "roboto");
    textoInteragir.setAttribute("color", "white");
    textoInteragir.setAttribute("width", "5");
    textoInteragir.setAttribute("opacity", "0.8");
    textoInteragir.setAttribute("position", "0.26 0 0");
    grupoF.appendChild(textoInteragir);

    // === 3. MENU PRINCIPAL ===
    this.menuAberto = false;
    const menuPrincipalY = 0.025;

    const menuPrincipal = document.createElement("a-entity");
    menuPrincipal.setAttribute("id", "menu-principal");
    menuPrincipal.setAttribute(
      "position",
      `2.9 ${menuPrincipalY} ${profundidade}`
    );
    menuPrincipal.setAttribute("scale", "0 0 0");
    container.appendChild(menuPrincipal);
    this.menuPrincipal = menuPrincipal;

    const criarItem = (parent, texto, yOffset, temCirculo, largura = 2.2) => {
      const itemGroup = document.createElement("a-entity");
      itemGroup.setAttribute("position", `0.85 ${yOffset} 0`);
      parent.appendChild(itemGroup);

      const bgItem = document.createElement("a-plane");
      bgItem.setAttribute("src", "#tex-menu-item-white");
      bgItem.setAttribute("width", largura.toString());
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

      // Lógica de posição do texto
      const textX = -(largura / 2) + 0.2;

      const textoItem = document.createElement("a-text");
      textoItem.setAttribute("value", texto);
      textoItem.setAttribute("font", "roboto");
      textoItem.setAttribute("position", `${textX} 0 0.01`);
      itemGroup.appendChild(textoItem);

      let fundo = null;
      if (temCirculo) {
        // Lógica de posição do círculo
        const offset = largura > 2.5 ? 0.15 : 0.25;
        const circleX = largura / 2 - offset;

        fundo = document.createElement("a-circle");
        fundo.setAttribute("radius", "0.09");
        fundo.setAttribute("color", "black");
        fundo.setAttribute("opacity", "0");
        fundo.setAttribute("position", `${circleX} 0 0.01`);
        itemGroup.appendChild(fundo);

        const borda = document.createElement("a-torus");
        borda.setAttribute("radius", "0.1");
        borda.setAttribute("radius-tubular", "0.005");
        borda.setAttribute("position", `${circleX} 0 0.012`);
        itemGroup.appendChild(borda);
      }
      return { bgItem, itemGroup, fundo };
    };

    // --- ITENS MENU PRINCIPAL (Largura 2.7) ---
    const W_MAIN = 2.7;
    const principalItens = [];
    principalItens.push(
      criarItem(menuPrincipal, "Selecionar Cesta", 1.225, false, W_MAIN)
    );
    principalItens.push(
      criarItem(menuPrincipal, "Definir Timer", 0.775, false, W_MAIN)
    );
    principalItens.push(
      criarItem(menuPrincipal, "Trajetoria da Bola", 0.325, false, W_MAIN)
    );
    principalItens.push(
      criarItem(menuPrincipal, "Desafio Street 21", -0.125, false, W_MAIN)
    );
    principalItens.push(
      criarItem(menuPrincipal, "Desafio Volta ao Mundo", -0.575, false, W_MAIN)
    );
    principalItens.push(
      criarItem(menuPrincipal, "Desafio On Fire", -1.025, false, W_MAIN)
    );

    // === 4. SUBMENUS (Posição Ajustada para 5.7) ===
    const SUBMENU_X = 5.7;

    // Submenu Timer
    const submenuTimer = document.createElement("a-entity");
    submenuTimer.setAttribute("position", `${SUBMENU_X} 0.8 ${profundidade}`);
    submenuTimer.setAttribute("visible", false);
    submenuTimer.setAttribute("scale", "0 0 0");
    container.appendChild(submenuTimer);
    this.submenuTimer = submenuTimer;

    const bgSubTimer = document.createElement("a-plane");
    bgSubTimer.setAttribute("src", "#tex-submenu-bg-square");
    bgSubTimer.setAttribute("width", "2.3"); // [AJUSTADO PARA 2.3]
    bgSubTimer.setAttribute("height", "1.5");
    bgSubTimer.setAttribute("transparent", "true");
    bgSubTimer.setAttribute("opacity", "1");
    bgSubTimer.setAttribute("color", "#222222");
    bgSubTimer.setAttribute("position", "0.85 -0.45 -0.01");
    submenuTimer.appendChild(bgSubTimer);

    // Submenu Cesta
    const submenuCesta = document.createElement("a-entity");
    submenuCesta.setAttribute("position", `${SUBMENU_X} 1.25 ${profundidade}`);
    submenuCesta.setAttribute("visible", false);
    submenuCesta.setAttribute("scale", "0 0 0");
    container.appendChild(submenuCesta);
    this.submenuCesta = submenuCesta;

    const bgSubCesta = document.createElement("a-plane");
    bgSubCesta.setAttribute("src", "#tex-submenu-bg-square");
    bgSubCesta.setAttribute("width", "2.3"); // [AJUSTADO PARA 2.3]
    bgSubCesta.setAttribute("height", "1.0");
    bgSubCesta.setAttribute("transparent", "true");
    bgSubCesta.setAttribute("opacity", "1");
    bgSubCesta.setAttribute("color", "#222222");
    bgSubCesta.setAttribute("position", "0.85 -0.225 -0.01");
    submenuCesta.appendChild(bgSubCesta);

    // Submenu Mira
    const submenuMira = document.createElement("a-entity");
    submenuMira.setAttribute("position", `${SUBMENU_X} 0.35 ${profundidade}`);
    submenuMira.setAttribute("visible", false);
    submenuMira.setAttribute("scale", "0 0 0");
    container.appendChild(submenuMira);
    this.submenuMira = submenuMira;

    const bgSubMira = document.createElement("a-plane");
    bgSubMira.setAttribute("src", "#tex-submenu-bg-square");
    bgSubMira.setAttribute("width", "2.3"); // [AJUSTADO PARA 2.3]
    bgSubMira.setAttribute("height", "1.0");
    bgSubMira.setAttribute("transparent", "true");
    bgSubMira.setAttribute("opacity", "1");
    bgSubMira.setAttribute("color", "#222222");
    bgSubMira.setAttribute("position", "0.85 -0.225 -0.01");
    submenuMira.appendChild(bgSubMira);

    // Submenu Street 21
    const submenuStreet = document.createElement("a-entity");
    submenuStreet.setAttribute(
      "position",
      `${SUBMENU_X} -0.125 ${profundidade}`
    );
    submenuStreet.setAttribute("visible", false);
    submenuStreet.setAttribute("scale", "0 0 0");
    container.appendChild(submenuStreet);
    this.submenuStreet = submenuStreet;

    const bgSubStreet = document.createElement("a-plane");
    bgSubStreet.setAttribute("src", "#tex-submenu-bg-square");
    bgSubStreet.setAttribute("width", "2.3"); // [AJUSTADO PARA 2.3]
    bgSubStreet.setAttribute("height", "1.0");
    bgSubStreet.setAttribute("transparent", "true");
    bgSubStreet.setAttribute("opacity", "1");
    bgSubStreet.setAttribute("color", "#222222");
    bgSubStreet.setAttribute("position", "0.85 -0.225 -0.01");
    submenuStreet.appendChild(bgSubStreet);

    // Submenu Volta ao Mundo
    const submenuVolta = document.createElement("a-entity");
    submenuVolta.setAttribute(
      "position",
      `${SUBMENU_X} -0.575 ${profundidade}`
    );
    submenuVolta.setAttribute("visible", false);
    submenuVolta.setAttribute("scale", "0 0 0");
    container.appendChild(submenuVolta);
    this.submenuVolta = submenuVolta;

    const bgSubVolta = document.createElement("a-plane");
    bgSubVolta.setAttribute("src", "#tex-submenu-bg-square");
    bgSubVolta.setAttribute("width", "2.3"); // [AJUSTADO PARA 2.3]
    bgSubVolta.setAttribute("height", "1.0");
    bgSubVolta.setAttribute("transparent", "true");
    bgSubVolta.setAttribute("opacity", "1");
    bgSubVolta.setAttribute("color", "#222222");
    bgSubVolta.setAttribute("position", "0.85 -0.225 -0.01");
    submenuVolta.appendChild(bgSubVolta);

    // Linha de Conexão
    const linhaConexao = document.createElement("a-plane");
    linhaConexao.setAttribute("color", "#222222");
    linhaConexao.setAttribute("opacity", "0.9");
    linhaConexao.setAttribute("width", "0.3");
    linhaConexao.setAttribute("height", "0.035");
    linhaConexao.setAttribute("visible", false);
    container.appendChild(linhaConexao);
    this.linhaConexao = linhaConexao;

    // === LÓGICA DE ITENS DOS SUBMENUS (Largura 2.1) ===
    const W_SUB = 2.1; // [AJUSTADO PARA 2.1]

    const valoresTimer = [30, 60, 90];
    const subItensTimer = [
      criarItem(submenuTimer, "30s", 0, true, W_SUB),
      criarItem(submenuTimer, "60s", -0.45, true, W_SUB),
      criarItem(submenuTimer, "90s", -0.9, true, W_SUB),
    ];

    const valoresCesta = [1, 2];
    const subItensCesta = [
      criarItem(submenuCesta, "Cesta Home", 0, true, W_SUB),
      criarItem(submenuCesta, "Cesta Guest", -0.45, true, W_SUB),
    ];

    const valoresMira = [true, false];
    const subItensMira = [
      criarItem(submenuMira, "Ativado", 0, true, W_SUB),
      criarItem(submenuMira, "Desativado", -0.45, true, W_SUB),
    ];

    const subItensStreet = [
      criarItem(submenuStreet, "Jogar Com Timer", 0, false, W_SUB),
      criarItem(submenuStreet, "Jogar Sem Timer", -0.45, false, W_SUB),
    ];

    const subItensVolta = [
      criarItem(submenuVolta, "Jogar Com Timer", 0, false, W_SUB),
      criarItem(submenuVolta, "Jogar Sem Timer", -0.45, false, W_SUB),
    ];

    const marcarSelecionado = (itens, valorAtual, listaValores) => {
      itens.forEach((ref, idx) => {
        if (ref.fundo) {
          const selecionado = listaValores[idx] === valorAtual;
          ref.fundo.setAttribute("opacity", selecionado ? "1" : "0");
          if (selecionado) ref.fundo.setAttribute("color", "green");
        }
      });
    };

    marcarSelecionado(subItensTimer, window.tempoCronometro, valoresTimer);
    marcarSelecionado(subItensCesta, window.cestaSelecionada, valoresCesta);
    marcarSelecionado(subItensMira, window.configMira, valoresMira);

    const fecharSubmenusInterno = () => {
      submenuTimer.setAttribute("scale", "0 0 0");
      submenuTimer.setAttribute("visible", false);
      submenuCesta.setAttribute("scale", "0 0 0");
      submenuCesta.setAttribute("visible", false);
      submenuMira.setAttribute("scale", "0 0 0");
      submenuMira.setAttribute("visible", false);
      submenuStreet.setAttribute("scale", "0 0 0");
      submenuStreet.setAttribute("visible", false);
      submenuVolta.setAttribute("scale", "0 0 0");
      submenuVolta.setAttribute("visible", false);
      linhaConexao.setAttribute("visible", false);

      if (this.itemSelecionado) {
        this.itemSelecionado.bgItem.setAttribute("color", "#222222");
        this.itemSelecionado.bgItem.setAttribute(
          "animation__color_in",
          "property: color; to: #666666; dur: 150; startEvents: mouseenter"
        );
        this.itemSelecionado.bgItem.setAttribute(
          "animation__color_out",
          "property: color; to: #222222; dur: 150; startEvents: mouseleave"
        );
      }
      this.itemSelecionado = null;
    };

    subItensTimer.forEach((ref, idx) => {
      ref.bgItem.addEventListener("click", () => {
        window.setarTempoCronometro(valoresTimer[idx]);
        marcarSelecionado(subItensTimer, valoresTimer[idx], valoresTimer);
        fecharSubmenusInterno();
      });
    });

    subItensCesta.forEach((ref, idx) => {
      ref.bgItem.addEventListener("click", () => {
        window.cestaSelecionada = valoresCesta[idx];
        marcarSelecionado(subItensCesta, valoresCesta[idx], valoresCesta);
        fecharSubmenusInterno();
      });
    });

    subItensMira.forEach((ref, idx) => {
      ref.bgItem.addEventListener("click", () => {
        window.configMira = valoresMira[idx];
        marcarSelecionado(subItensMira, valoresMira[idx], valoresMira);
        fecharSubmenusInterno();
      });
    });

    subItensStreet.forEach((ref, idx) => {
      ref.bgItem.addEventListener("click", () => {
        const usarTimer = idx === 0;
        if (window.Minigames) window.Minigames.iniciar("street21", usarTimer);
         fecharSubmenusInterno();
      });
    });

    subItensVolta.forEach((ref, idx) => {
      ref.bgItem.addEventListener("click", () => {
        const usarTimer = idx === 0;
        if (window.Minigames)
          window.Minigames.iniciar("voltaAoMundo", usarTimer);
         fecharSubmenusInterno();
      });
    });

    this.itemSelecionado = null;

    // === LÓGICA DE CLIQUE MENU PRINCIPAL ===
    principalItens.forEach((ref, idx) => {
      ref.bgItem.addEventListener("click", () => {
        fecharSubmenusInterno();

        const yLinhaAbsoluta =
          ref.itemGroup.getAttribute("position").y + menuPrincipalY;

        // Posição X da Linha (5.25)
        const xLinha = 5.25;

        const abrirSubmenu = (submenuEl) => {
          this.itemSelecionado = ref;
          ref.bgItem.setAttribute("color", "#666666");
          ref.bgItem.removeAttribute("animation__color_in");
          ref.bgItem.removeAttribute("animation__color_out");

          submenuEl.setAttribute("visible", true);
          submenuEl.setAttribute("scale", "1 1 1");
          linhaConexao.setAttribute(
            "position",
            `${xLinha} ${yLinhaAbsoluta} ${profundidade - 0.001}`
          );
          linhaConexao.setAttribute("visible", true);
        };

        if (idx === 0) {
          abrirSubmenu(submenuCesta);
        } else if (idx === 1) {
          abrirSubmenu(submenuTimer);
        } else if (idx === 2) {
          abrirSubmenu(submenuMira);
        } else if (idx === 3) {
          abrirSubmenu(submenuStreet);
        } else if (idx === 4) {
          abrirSubmenu(submenuVolta);
        } else if (idx === 5) {
          console.log("On Fire em breve...");
        }
      });
    });

    this.toggleMenu = this.toggleMenu.bind(this);
    this.fecharMenuTotal = this.fecharMenuTotal.bind(this);
    window.addEventListener("keydown", this.toggleMenu);
  },

  tick: function () {
    const dist = this.calcularDistancia();
    if (dist === null) return;
    const estaVisivel = this.container.getAttribute("visible");

    if (dist <= 4.5) {
      if (!estaVisivel) this.container.setAttribute("visible", true);
    } else {
      if (estaVisivel) {
        this.container.setAttribute("visible", false);
        if (this.menuAberto) this.fecharMenuTotal();
      }
    }
  },

  calcularDistancia: function () {
    const camera = document.getElementById("camera-jogador");
    const zonaInteracao = document.getElementById("zona-interacao-player");
    if (!camera || !zonaInteracao) return null;
    const playerPos = new THREE.Vector3();
    const zonaPos = new THREE.Vector3();
    camera.object3D.getWorldPosition(playerPos);
    zonaInteracao.object3D.getWorldPosition(zonaPos);
    return Math.sqrt(
      Math.pow(playerPos.x - zonaPos.x, 2) +
        Math.pow(playerPos.z - zonaPos.z, 2)
    );
  },

  fecharMenuTotal: function () {
    this.menuAberto = false;
    this.menuPrincipal.setAttribute("scale", "0 0 0");
    this.submenuTimer.setAttribute("scale", "0 0 0");
    this.submenuTimer.setAttribute("visible", false);
    this.submenuCesta.setAttribute("scale", "0 0 0");
    this.submenuCesta.setAttribute("visible", false);
    this.submenuMira.setAttribute("scale", "0 0 0");
    this.submenuMira.setAttribute("visible", false);
    this.submenuStreet.setAttribute("scale", "0 0 0");
    this.submenuStreet.setAttribute("visible", false);
    this.submenuVolta.setAttribute("scale", "0 0 0");
    this.submenuVolta.setAttribute("visible", false);
    this.linhaConexao.setAttribute("visible", false);

    if (this.itemSelecionado) {
      this.itemSelecionado.bgItem.setAttribute("color", "#222222");
      this.itemSelecionado.bgItem.setAttribute(
        "animation__color_in",
        "property: color; to: #666666; dur: 150; startEvents: mouseenter"
      );
      this.itemSelecionado.bgItem.setAttribute(
        "animation__color_out",
        "property: color; to: #222222; dur: 150; startEvents: mouseleave"
      );
      this.itemSelecionado = null;
    }
  },

  toggleMenu: function (e) {
    if (e.code === "KeyF") {
      const dist = this.calcularDistancia();
      if (
        dist === null ||
        dist > 4.5 ||
        !this.container.getAttribute("visible")
      )
        return;

      this.menuAberto = !this.menuAberto;
      if (this.menuAberto) {
        this.menuPrincipal.setAttribute("scale", "1 1 1");
      } else {
        this.fecharMenuTotal();
      }
    }
  },

  remove: function () {
    window.removeEventListener("keydown", this.toggleMenu);
  },
});