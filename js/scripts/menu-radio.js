/* ====================================================================
   MENU 3D DO RÁDIO (AJUSTE FINAL DE POSIÇÃO)
==================================================================== */
AFRAME.registerComponent("menu-radio", {
  init: function () {
    // TEXTURAS
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

    // === ESTRUTURA VISUAL ===
    const container = document.createElement("a-entity");

    // [AJUSTE DE ALTURA] Mude o valor do meio (Y) para subir ou descer
    container.setAttribute("position", "0 -0.1 0.2"); // <--- AJUSTE A ALTURA AQUI

    // [AJUSTE DE ESCALA] Reduzi para 0.2 (Era 0.25)
    container.setAttribute("scale", "0.2 0.2 0.2");

    container.setAttribute("visible", false);

    // [AJUSTE DE ROTAÇÃO] Virado para 0 graus
    container.setAttribute("rotation", "0 -25 0");

    this.el.appendChild(container);
    this.container = container;

    // PONTO DE ANCORAGEM
    const bolaAncora = document.createElement("a-circle");
    bolaAncora.setAttribute("radius", "0.05");
    bolaAncora.setAttribute("color", "white");
    bolaAncora.setAttribute("shader", "flat");
    container.appendChild(bolaAncora);

    const profundidade = 0.05;

    // LINHAS DE CONEXÃO
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
      end: `1.0 0.5 ${profundidade}`,
      color: "white",
      opacity: 0.8,
    });
    container.appendChild(linhaHorizontal);

    // TÍTULO "RADIO"
    const titulo = document.createElement("a-text");
    titulo.setAttribute("value", "RADIO");
    titulo.setAttribute("font", "roboto");
    titulo.setAttribute("color", "white");
    titulo.setAttribute("align", "left");
    titulo.setAttribute("width", "10"); // Largura 10 (Igual Placar)
    titulo.setAttribute("position", `0.9 0.5 ${profundidade}`); // Posição exata do Placar
    container.appendChild(titulo);

    // Prompt "F"
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

    // === MENU PRINCIPAL ===
    this.menuAberto = false;

    const menuPrincipal = document.createElement("a-entity");
    // Posição lateral dos botões
    menuPrincipal.setAttribute("position", "4 0.2 0");
    menuPrincipal.setAttribute("scale", "0 0 0");
    container.appendChild(menuPrincipal);
    this.menuPrincipal = menuPrincipal;

    const criarItem = (parent, texto, yOffset) => {
      const itemGroup = document.createElement("a-entity");
      itemGroup.setAttribute("position", `0 ${yOffset} 0`);
      parent.appendChild(itemGroup);

      const bgItem = document.createElement("a-plane");
      bgItem.setAttribute("src", "#tex-menu-item-white");
      bgItem.setAttribute("width", "3.0");
      bgItem.setAttribute("height", "0.6");
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
      textoItem.setAttribute("align", "left");
      textoItem.setAttribute("color", "white");
      textoItem.setAttribute("width", "6.5");
      textoItem.setAttribute("position", "-1.3 0 0.01");
      itemGroup.appendChild(textoItem);

      return { bg: bgItem, txt: textoItem, group: itemGroup };
    };

    // BOTÕES
    this.btnAcao = criarItem(menuPrincipal, "Tocar Musica", 0.35);
    this.btnProxima = criarItem(menuPrincipal, "Proxima Musica", -0.35);
    this.btnProxima.group.setAttribute("visible", false);

    // LISTENERS
    this.btnAcao.bg.addEventListener("click", () => {
      if (!window.Radio) return;
      if (window.Radio.tocando) window.Radio.pausar();
      else window.Radio.tocar();
      this.atualizarInterface();
      this.fecharMenu();
    });

    this.btnProxima.bg.addEventListener("click", () => {
      if (window.Radio) window.Radio.proxima();
      this.fecharMenu();
    });

    this.toggleMenu = this.toggleMenu.bind(this);
    window.addEventListener("keydown", this.toggleMenu);
  },

  atualizarInterface: function () {
    if (!window.Radio) return;
    const tocando = window.Radio.tocando;
    if (tocando) {
      this.btnAcao.txt.setAttribute("value", "Parar Musica");
      this.btnProxima.group.setAttribute("visible", true);
      this.btnAcao.group.setAttribute("position", "0 0.35 0");
    } else {
      this.btnAcao.txt.setAttribute("value", "Tocar Musica");
      this.btnProxima.group.setAttribute("visible", false);
      this.btnAcao.group.setAttribute("position", "0 0 0");
    }
  },

  tick: function () {
    const dist = this.calcularDistancia();
    if (dist === null) return;
    const DISTANCIA_ATIVACAO = 5.0;

    if (dist <= DISTANCIA_ATIVACAO) {
      if (!this.container.getAttribute("visible")) {
        this.container.setAttribute("visible", true);
        this.atualizarInterface();
      }
    } else {
      if (this.container.getAttribute("visible")) {
        this.container.setAttribute("visible", false);
        this.fecharMenu();
      }
    }
  },

  calcularDistancia: function () {
    const camera = document.getElementById("camera-jogador");
    if (!camera) return null;
    const playerPos = new THREE.Vector3();
    const radioPos = new THREE.Vector3();
    camera.object3D.getWorldPosition(playerPos);
    this.el.object3D.getWorldPosition(radioPos);
    return playerPos.distanceTo(radioPos);
  },

  fecharMenu: function () {
    this.menuAberto = false;
    this.menuPrincipal.setAttribute("scale", "0 0 0");
  },

  toggleMenu: function (e) {
    if (e.code === "KeyF") {
      if (!this.container.getAttribute("visible")) return;
      this.menuAberto = !this.menuAberto;
      if (this.menuAberto) {
        this.atualizarInterface();
        this.menuPrincipal.setAttribute("scale", "1 1 1");
      } else {
        this.fecharMenu();
      }
    }
  },

  remove: function () {
    window.removeEventListener("keydown", this.toggleMenu);
  },
});