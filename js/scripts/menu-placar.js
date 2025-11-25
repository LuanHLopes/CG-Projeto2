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
    // Garante que a configMira existe
    if (typeof window.configMira === "undefined") window.configMira = true;

    // === 2. ESTRUTURA VISUAL ===
    const container = document.createElement("a-entity");
    container.setAttribute("position", "4.35 10.0 -8.3");
    container.setAttribute("rotation", "0 -10 0");

    // Começa invisível para só aparecer quando entrar na área
    container.setAttribute("visible", false);

    this.el.appendChild(container);
    this.container = container;

    // Decoração (Linhas e Bolinha)
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

    // Título "Placar"
    const titulo = document.createElement("a-text");
    titulo.setAttribute("value", "Placar");
    titulo.setAttribute("font", "roboto");
    titulo.setAttribute("color", "white");
    titulo.setAttribute("align", "left");
    titulo.setAttribute("width", "10");
    titulo.setAttribute("position", `0.9 0.5 ${profundidade}`);
    container.appendChild(titulo);

    // Prompt "F Interagir"
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

    const criarItem = (parent, texto, yOffset, temCirculo) => {
      const itemGroup = document.createElement("a-entity");
      itemGroup.setAttribute("position", `0.85 ${yOffset} 0`);
      parent.appendChild(itemGroup);

      const bgItem = document.createElement("a-plane");
      bgItem.setAttribute("src", "#tex-menu-item-white");
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
      textoItem.setAttribute("position", "-0.95 0 0.01");
      itemGroup.appendChild(textoItem);

      let fundo = null;
      if (temCirculo) {
        fundo = document.createElement("a-circle");
        fundo.setAttribute("radius", "0.09");
        fundo.setAttribute("color", "black");
        fundo.setAttribute("opacity", "0");
        fundo.setAttribute("position", "0.86 0 0.01");
        itemGroup.appendChild(fundo);

        const borda = document.createElement("a-torus");
        borda.setAttribute("radius", "0.1");
        borda.setAttribute("radius-tubular", "0.005");
        borda.setAttribute("position", "0.86 0 0.012");
        itemGroup.appendChild(borda);
      }
      return { bgItem, itemGroup, fundo };
    };

    // --- LISTA DE ITENS (ATUALIZADA COM MIRA) ---
    const principalItens = [];

    // Index 0: Cesta
    principalItens.push(criarItem(menuPrincipal, "Selecionar Cesta", 1.225));

    // Index 1: Timer
    principalItens.push(criarItem(menuPrincipal, "Definir Timer", 0.775));

    // Index 2: Mira [NOVO]
    const textoMira = window.configMira ? "Mira: ATIVADA" : "Mira: DESATIVADA";
    principalItens.push(criarItem(menuPrincipal, textoMira, 0.325));

    // Index 3: Street 21
    principalItens.push(criarItem(menuPrincipal, "Desafio Street 21", -0.125));

    // Index 4: Volta ao Mundo
    principalItens.push(
      criarItem(menuPrincipal, "Desafio Volta ao Mundo", -0.575)
    );

    // Index 5: On Fire
    principalItens.push(criarItem(menuPrincipal, "Desafio On Fire", -1.025));

    // === 4. SUBMENUS ===
    const submenuTimer = document.createElement("a-entity");
    submenuTimer.setAttribute("position", `5.4 0.8 ${profundidade}`);
    submenuTimer.setAttribute("visible", false);
    submenuTimer.setAttribute("scale", "0 0 0");
    container.appendChild(submenuTimer);
    this.submenuTimer = submenuTimer;

    const bgSubTimer = document.createElement("a-plane");
    bgSubTimer.setAttribute("src", "#tex-submenu-bg-square");
    bgSubTimer.setAttribute("width", "2.4");
    bgSubTimer.setAttribute("height", "1.5");
    bgSubTimer.setAttribute("transparent", "true");
    bgSubTimer.setAttribute("opacity", "1");
    bgSubTimer.setAttribute("color", "#222222");
    bgSubTimer.setAttribute("position", "0.85 -0.45 -0.01");
    submenuTimer.appendChild(bgSubTimer);

    const submenuCesta = document.createElement("a-entity");
    submenuCesta.setAttribute("position", `5.4 1.25 ${profundidade}`);
    submenuCesta.setAttribute("visible", false);
    submenuCesta.setAttribute("scale", "0 0 0");
    container.appendChild(submenuCesta);
    this.submenuCesta = submenuCesta;

    const bgSubCesta = document.createElement("a-plane");
    bgSubCesta.setAttribute("src", "#tex-submenu-bg-square");
    bgSubCesta.setAttribute("width", "2.4");
    bgSubCesta.setAttribute("height", "1.0");
    bgSubCesta.setAttribute("transparent", "true");
    bgSubCesta.setAttribute("opacity", "1");
    bgSubCesta.setAttribute("color", "#222222");
    bgSubCesta.setAttribute("position", "0.85 -0.225 -0.01");
    submenuCesta.appendChild(bgSubCesta);

    const linhaConexao = document.createElement("a-plane");
    linhaConexao.setAttribute("color", "#222222");
    linhaConexao.setAttribute("opacity", "0.9");
    linhaConexao.setAttribute("width", "0.22");
    linhaConexao.setAttribute("height", "0.035");
    linhaConexao.setAttribute("visible", false);
    container.appendChild(linhaConexao);
    this.linhaConexao = linhaConexao;

    // === LÓGICA DE ITENS DOS SUBMENUS ===
    const valoresTimer = [30, 60, 90];
    const subItensTimer = [
      criarItem(submenuTimer, "30s", 0, true),
      criarItem(submenuTimer, "60s", -0.45, true),
      criarItem(submenuTimer, "90s", -0.9, true),
    ];

    const valoresCesta = [1, 2];
    const subItensCesta = [
      criarItem(submenuCesta, "Cesta Home", 0, true),
      criarItem(submenuCesta, "Cesta Guest", -0.45, true),
    ];

    const marcarSelecionado = (itens, valorAtual, listaValores) => {
      itens.forEach((ref, idx) => {
        if (ref.fundo)
          ref.fundo.setAttribute(
            "opacity",
            listaValores[idx] === valorAtual ? "1" : "0"
          );
        if (ref.fundo && listaValores[idx] === valorAtual)
          ref.fundo.setAttribute("color", "green");
      });
    };

    marcarSelecionado(subItensTimer, window.tempoCronometro, valoresTimer);
    marcarSelecionado(subItensCesta, window.cestaSelecionada, valoresCesta);

    const fecharSubmenusInterno = () => {
      submenuTimer.setAttribute("scale", "0 0 0");
      submenuTimer.setAttribute("visible", false);
      submenuCesta.setAttribute("scale", "0 0 0");
      submenuCesta.setAttribute("visible", false);
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

    this.itemSelecionado = null;

    // === LÓGICA DE CLIQUE MENU PRINCIPAL (MODIFICADA) ===
    principalItens.forEach((ref, idx) => {
      ref.bgItem.addEventListener("click", () => {
        // Se clicar em qualquer item que não abre submenu (0 ou 1), fecha os submenus
        // Nota: O Item 2 (Mira) não abre submenu, então também deve fechar
        if (idx !== 0 && idx !== 1) {
          fecharSubmenusInterno();
        }

        const yLinhaAbsoluta =
          ref.itemGroup.getAttribute("position").y + menuPrincipalY;

        // INDEX 0: Cesta
        if (idx === 0) {
          fecharSubmenusInterno(); // Garante reset visual
          this.itemSelecionado = ref;
          ref.bgItem.removeAttribute("animation__color_in");
          ref.bgItem.removeAttribute("animation__color_out");
          ref.bgItem.setAttribute("color", "#666666");

          submenuCesta.setAttribute("visible", true);
          submenuCesta.setAttribute("scale", "1 1 1");
          linhaConexao.setAttribute(
            "position",
            `4.95 ${yLinhaAbsoluta} ${profundidade - 0.001}`
          );
          linhaConexao.setAttribute("visible", true);

          // INDEX 1: Timer
        } else if (idx === 1) {
          fecharSubmenusInterno();
          this.itemSelecionado = ref;
          ref.bgItem.removeAttribute("animation__color_in");
          ref.bgItem.removeAttribute("animation__color_out");
          ref.bgItem.setAttribute("color", "#666666");

          submenuTimer.setAttribute("visible", true);
          submenuTimer.setAttribute("scale", "1 1 1");
          linhaConexao.setAttribute(
            "position",
            `4.95 ${yLinhaAbsoluta} ${profundidade - 0.001}`
          );
          linhaConexao.setAttribute("visible", true);

          // INDEX 2: Mira (Toggle) [NOVO]
        } else if (idx === 2) {
          window.configMira = !window.configMira;
          const novoTexto = window.configMira
            ? "Mira: ATIVADA"
            : "Mira: DESATIVADA";
          ref.itemGroup
            .querySelector("a-text")
            .setAttribute("value", novoTexto);

          // Feedback visual de clique
          ref.bgItem.setAttribute("color", "#444444");
          setTimeout(() => ref.bgItem.setAttribute("color", "#222222"), 150);

          // INDEX 3: Street 21 (Minigame)
        } else if (idx === 3) {
          this.fecharMenuTotal();
          if (window.Minigames) window.Minigames.iniciar("street21", true);

          // INDEX 4: Volta ao Mundo (Minigame)
        } else if (idx === 4) {
          this.fecharMenuTotal();
          if (window.Minigames) window.Minigames.iniciar("voltaAoMundo", true);

          // INDEX 5: On Fire (Minigame)
        } else if (idx === 5) {
          console.log("On Fire em breve...");
        }
      });
    });

    // BIND METHODS
    this.toggleMenu = this.toggleMenu.bind(this);
    this.fecharMenuTotal = this.fecharMenuTotal.bind(this);

    window.addEventListener("keydown", this.toggleMenu);
  },

  // === LOOP DE VERIFICAÇÃO (RODA SEMPRE) ===
  tick: function () {
    // Calcula a distância atual
    const dist = this.calcularDistancia();
    if (dist === null) return;

    // Estado atual de visibilidade
    const estaVisivel = this.container.getAttribute("visible");

    // LÓGICA DE ENTRADA/SAÍDA
    if (dist <= 4.5) {
      // Entrou na área: Mostra o prompt (Linhas, Texto, F)
      if (!estaVisivel) {
        this.container.setAttribute("visible", true);
      }
    } else {
      // Saiu da área: Esconde tudo
      if (estaVisivel) {
        this.container.setAttribute("visible", false);
        // Se o menu estava aberto, fecha e reseta ele
        if (this.menuAberto) {
          this.fecharMenuTotal();
        }
      }
    }
  },

  // === HELPER: CALCULAR DISTÂNCIA ===
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

  // === HELPER: FECHAR TUDO (RESETA MENU) ===
  fecharMenuTotal: function () {
    this.menuAberto = false;
    this.menuPrincipal.setAttribute("scale", "0 0 0");
    this.submenuTimer.setAttribute("scale", "0 0 0");
    this.submenuTimer.setAttribute("visible", false);
    this.submenuCesta.setAttribute("scale", "0 0 0");
    this.submenuCesta.setAttribute("visible", false);
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

  // === INTERAÇÃO TECLA F ===
  toggleMenu: function (e) {
    if (e.code === "KeyF") {
      const dist = this.calcularDistancia();

      // Se tiver longe, ou se o container estiver invisível, ignora
      if (
        dist === null ||
        dist > 4.5 ||
        !this.container.getAttribute("visible")
      ) {
        return;
      }

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