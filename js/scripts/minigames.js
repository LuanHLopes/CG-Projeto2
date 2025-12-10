/* ====================================================================
   REGISTRO DE SHADER
==================================================================== */
AFRAME.registerShader("gradient-beam", {
  schema: {
    colorBottom: { type: "color", is: "uniform", default: "#00FF00" },
    opacity: { type: "number", is: "uniform", default: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 colorBottom;
    varying vec2 vUv;
    uniform float opacity;
    void main() {
      float alphaGradient = pow(1.0 - vUv.y, 2.0);
      gl_FragColor = vec4(colorBottom, alphaGradient * opacity);
    }
  `,
});

/* ====================================================================
   COMPONENTE: RASTRO DE FOGO
==================================================================== */
AFRAME.registerComponent("rastro-fogo", {
  init: function () {
    this.tempo = 0;
    this.intervalo = 30;
  },
  tick: function (t, dt) {
    this.tempo += dt;
    if (this.tempo > this.intervalo) {
      this.tempo = 0;
      this.criarParticula();
    }
  },
  criarParticula: function () {
    if (!this.el.sceneEl) return;
    const pos = new THREE.Vector3();
    this.el.object3D.getWorldPosition(pos);
    const p = document.createElement("a-entity");
    p.setAttribute("geometry", "primitive: sphere; radius: 0.12");
    const cores = ["#FF4500", "#FFD700", "#FF0000"];
    const cor = cores[Math.floor(Math.random() * cores.length)];
    p.setAttribute(
      "material",
      `color: ${cor}; shader: flat; transparent: true; opacity: 0.8`
    );
    p.setAttribute("position", pos);
    p.setAttribute("animation__fade", {
      property: "material.opacity",
      to: 0,
      dur: 500,
      easing: "linear",
    });
    p.setAttribute("animation__scale", {
      property: "scale",
      to: "0.1 0.1 0.1",
      dur: 500,
      easing: "linear",
    });
    this.el.sceneEl.appendChild(p);
    setTimeout(() => {
      if (p.parentNode) p.parentNode.removeChild(p);
    }, 500);
  },
});

/* ====================================================================
   MINIGAMES - LÓGICA
==================================================================== */

const Desafios = {
  // === STREET 21 ===
  street21: {
    id: "street21",
    enumMode: window.GAME_MODE.STREET_21,
    nome: "Street 21",
    objetivo: "Faça exatamente 21 pontos.",
    regra: "Se estourar 21, você perde.",
    META_PONTOS: 21,
    _listenerPontos: null,
    _listenerTimer: null,
    usandoTimer: true,

    // Stats
    cestas2: 0,
    cestas3: 0,

    iniciar: function (usarTimer = true) {
      this.usandoTimer = usarTimer;
      this.cestas2 = 0;
      this.cestas3 = 0;

      if (this.usandoTimer && typeof window.iniciarCronometro === "function") {
        window.iniciarCronometro();
        this._listenerTimer = () => this.finalizar(false, "TEMPO ESGOTADO");
        window.addEventListener("cronometro-zerado", this._listenerTimer);
      } else {
        if (typeof window.pararCronometro === "function")
          window.pararCronometro();
      }

      this._listenerPontos = (e) => {
        const idEvento = parseInt(e.detail.idCesta);
        if (idEvento !== parseInt(window.cestaSelecionada)) return;

        // Contabiliza stats
        if (e.detail.pontosFeitos === 3) this.cestas3++;
        else this.cestas2++;

        this.verificarVitoria(e.detail.totalAcumulado);
      };
      window.addEventListener("pontuacao-registrada", this._listenerPontos);
    },
    verificarVitoria: function (total) {
      if (total === this.META_PONTOS) {
        this.finalizar(true, "VENCEU!");
      } else if (total > this.META_PONTOS) {
        this.finalizar(false, "PERDEU");
      }
    },
    finalizar: function (venceu, statusTexto) {
      this.limparListeners();

      // Captura dados para tela
      const timerEl = document.getElementById("timer-top-display");
      const tempoFinal = timerEl ? timerEl.innerText : "00:00";
      const hudId =
        window.cestaSelecionada === 1 ? "score-top-home" : "score-top-guest";
      const placarFinal = document.getElementById(hudId).innerText;

      Minigames._mostrarGameOver({
        titulo: this.nome,
        status: venceu ? "VENCEU!" : "PERDEU!",
        corStatus: venceu ? "#00FF00" : "#FF0000",
        labelPrincipal: "TEMPO RESTANTE",
        valPrincipal: this.usandoTimer ? tempoFinal : "--:--",
        total: placarFinal,
        c3: this.cestas3,
        c2: this.cestas2,
      });
    },
    limparListeners: function () {
      if (this._listenerPontos) {
        window.removeEventListener(
          "pontuacao-registrada",
          this._listenerPontos
        );
        this._listenerPontos = null;
      }
      if (this._listenerTimer) {
        window.removeEventListener("cronometro-zerado", this._listenerTimer);
        this._listenerTimer = null;
      }
    },
    parar: function () {
      this.limparListeners();
      if (typeof window.zerarCronometro === "function")
        window.zerarCronometro();
    },
  },

  // === VOLTA AO MUNDO ===
  voltaAoMundo: {
    id: "voltaAoMundo",
    enumMode: window.GAME_MODE.VOLTA_AO_MUNDO,
    nome: "Volta ao Mundo",
    objetivo: "Acerte 5 cestas.",
    regra: "Luz verde!",
    usandoTimer: true,
    _listenerPontos: null,
    _listenerTimer: null,
    cestasFeitas: 0,
    META_CESTAS: 5,
    historicoPosicoes: [],
    posicaoAtual: null,

    // Stats
    cestas2: 0,
    cestas3: 0,

    iniciar: function (usarTimer = true) {
      this.usandoTimer = usarTimer;
      this.cestasFeitas = 0;
      this.cestas2 = 0;
      this.cestas3 = 0;
      this.historicoPosicoes = [];
      this.posicaoAtual = null;

      this.gerarNovaPosicao();

      if (this.usandoTimer && typeof window.iniciarCronometro === "function") {
        window.iniciarCronometro();
        this._listenerTimer = () => this.finalizar(false, "TEMPO ESGOTADO");
        window.addEventListener("cronometro-zerado", this._listenerTimer);
      } else {
        if (typeof window.pararCronometro === "function")
          window.pararCronometro();
      }

      this._listenerPontos = (e) => {
        const idEvento = parseInt(e.detail.idCesta);
        if (idEvento !== parseInt(window.cestaSelecionada)) return;

        if (!this.validarPosicaoArremesso()) {
          window.notificar("FORA DA ZONA");
          Minigames._piscarMarcadorErro();
          this.reverterPontuacaoVisual(e.detail.pontosFeitos, e.detail.time);
          return;
        }

        // Stats
        if (e.detail.pontosFeitos === 3) this.cestas3++;
        else this.cestas2++;

        this.cestasFeitas++;
        if (this.cestasFeitas >= this.META_CESTAS) {
          this.finalizar(true, "VENCEU!");
        } else {
          this.gerarNovaPosicao();
        }
      };
      window.addEventListener("pontuacao-registrada", this._listenerPontos);
    },
    validarPosicaoArremesso: function () {
      if (!this.posicaoAtual) return true;
      const bola = document.getElementById("bola");
      if (!bola || !bola.object3D.userData.origemArremesso) return false;
      const origem = bola.object3D.userData.origemArremesso;
      const alvo = this.posicaoAtual;
      const dist = Math.sqrt(
        Math.pow(origem.x - alvo.x, 2) + Math.pow(origem.z - alvo.z, 2)
      );
      return dist <= 2.0;
    },
    reverterPontuacaoVisual: function (pontos, timeStr) {
      const idHud = timeStr === "HOME" ? "score-top-home" : "score-top-guest";
      const hud = document.getElementById(idHud);
      if (hud) {
        let v = parseInt(hud.innerText) - pontos;
        if (v < 0) v = 0;
        hud.innerText = v < 10 ? "0" + v : v;
        const idGrupo = timeStr === "HOME" ? "#grupo-home" : "#grupo-guest";
        const sensor = document.querySelector("[sensor]");
        if (sensor && sensor.components.sensor)
          sensor.components.sensor.atualizarLed(idGrupo, v);
      }
    },
    gerarNovaPosicao: function () {
      const idCesta = parseInt(window.cestaSelecionada);
      const zPosteAlvo = idCesta === 1 ? -7.1625 : 7.1625;
      const limiteX = 7.2;
      let minZ = idCesta === 1 ? -13.5 : -7.5;
      let maxZ = idCesta === 1 ? 7.5 : 13.5;

      let randX,
        randZ,
        valida = false,
        tentativas = 0;
      do {
        randX = Math.random() * (limiteX * 2) - limiteX;
        randZ = Math.random() * (maxZ - minZ) + minZ;
        const distAlvo = Math.sqrt(
          Math.pow(randX, 2) + Math.pow(randZ - zPosteAlvo, 2)
        );
        let longeHist = true;
        for (let pos of this.historicoPosicoes) {
          if (
            Math.sqrt(Math.pow(randX - pos.x, 2) + Math.pow(randZ - pos.z, 2)) <
            10
          )
            longeHist = false;
        }
        if (distAlvo > 4.0 && longeHist) valida = true;
        tentativas++;
      } while (!valida && tentativas < 500);

      this.posicaoAtual = { x: randX, z: randZ };
      this.historicoPosicoes.push(this.posicaoAtual);
      Minigames._moverMarcador(randX, 0.12, randZ, "#00FF00", "ring");
    },
    finalizar: function (venceu, statusTexto) {
      if (this.usandoTimer) window.pararCronometro();
      this.limparListeners();
      Minigames._esconderMarcador();

      const timerEl = document.getElementById("timer-top-display");
      const tempoFinal = timerEl ? timerEl.innerText : "00:00";
      const hudId =
        window.cestaSelecionada === 1 ? "score-top-home" : "score-top-guest";
      const placarFinal = document.getElementById(hudId).innerText;

      Minigames._mostrarGameOver({
        titulo: this.nome,
        status: venceu ? "VENCEU!" : "PERDEU!",
        corStatus: venceu ? "#00FF00" : "#FF0000",
        labelPrincipal: "TEMPO RESTANTE",
        valPrincipal: this.usandoTimer ? tempoFinal : "--:--",
        total: placarFinal,
        c3: this.cestas3,
        c2: this.cestas2,
      });
    },
    limparListeners: function () {
      if (this._listenerPontos) {
        window.removeEventListener(
          "pontuacao-registrada",
          this._listenerPontos
        );
        this._listenerPontos = null;
      }
      if (this._listenerTimer) {
        window.removeEventListener("cronometro-zerado", this._listenerTimer);
        this._listenerTimer = null;
      }
    },
    parar: function () {
      this.limparListeners();
      if (typeof window.zerarCronometro === "function")
        window.zerarCronometro();
      Minigames._esconderMarcador();
    },
  },

  // === ON FIRE ===
  onFire: {
    id: "onFire",
    enumMode: window.GAME_MODE.ON_FIRE,
    nome: "On Fire",
    objetivo: "Maior pontuação possível.",
    regra: "Combos: x1, x2, x4, x8! Mova-se!",

    _listenerPontos: null,
    _listenerTimer: null,
    _listenerInteracaoBola: null,
    _checkPosicaoInterval: null,

    combo: 0,
    multiplicador: 1,
    ultimaOrigem: null,
    RAIO_ZONA: 2.5, // Metade do lado (5m)
    LIMIT_X: 4.0, // Retangular 8m
    LIMIT_Z: 3.0, // Retangular 6m

    // Stats
    cestas2: 0,
    cestas3: 0,
    totalCestas: 0,

    iniciar: function (usarTimer = true) {
      this.combo = 0;
      this.multiplicador = 1;
      this.ultimaOrigem = null;
      this.cestas2 = 0;
      this.cestas3 = 0;
      this.totalCestas = 0;

      this.atualizarUI();
      Minigames._toggleComboUI(true);

      window.iniciarCronometro();
      this._listenerTimer = () => this.finalizar();
      window.addEventListener("cronometro-zerado", this._listenerTimer);

      this._checkPosicaoInterval = setInterval(() => {
        this.verificarPosicaoJogador();
      }, 200);

      this._listenerPontos = (e) => {
        const idCesta = parseInt(e.detail.idCesta);
        if (idCesta !== parseInt(window.cestaSelecionada)) return;

        const bola = document.getElementById("bola");
        const origem = bola.object3D.userData.origemArremesso;

        // Zona Morta
        if (this.ultimaOrigem) {
          const difX = Math.abs(origem.x - this.ultimaOrigem.x);
          const difZ = Math.abs(origem.z - this.ultimaOrigem.z);

          if (difX < this.LIMIT_X && difZ < this.LIMIT_Z) {
            window.notificar("CAMPER! PONTO ANULADO.");
            this.reverterPontos(e.detail.pontosFeitos, e.detail.time);
            Minigames._piscarMarcadorErro();
            this.resetarCombo("CAMPING");
            return;
          }
        }

        this.ultimaOrigem = { x: origem.x, z: origem.z };
        Minigames._moverMarcador(origem.x, 0.05, origem.z, "#FF0000", "square");

        this.combo++;
        this.calcularMultiplicador();
        this.atualizarUI();

        // Stats Base
        this.totalCestas++;
        if (e.detail.pontosFeitos === 3) this.cestas3++;
        else this.cestas2++;

        if (this.multiplicador > 1) {
          const pontosBase = e.detail.pontosFeitos;
          const pontosExtras = pontosBase * (this.multiplicador - 1);
          this.adicionarBonus(pontosExtras, e.detail.time);
        }
      };
      window.addEventListener("pontuacao-registrada", this._listenerPontos);

      this._listenerInteracaoBola = (e) => {
        const isTeclaT = e.type === "keydown" && e.code === "KeyT";
        const isClick = e.type === "click";

        if (isTeclaT || isClick) {
          const bola = document.getElementById("bola");
          if (bola && !bola.object3D.userData.jaPontou) {
            if (this.combo > 0) {
              window.notificar("ERROU! COMBO ZERADO");
              this.resetarCombo("ERRO");
            }
          }
        }
      };
      window.addEventListener("keydown", this._listenerInteracaoBola);
      const bolaEl = document.getElementById("bola");
      if (bolaEl) bolaEl.addEventListener("click", this._listenerInteracaoBola);
    },

    verificarPosicaoJogador: function () {
      if (!this.ultimaOrigem) {
        Minigames._toggleMoveAlert(false);
        return;
      }
      const camera = document.getElementById("camera-jogador");
      if (!camera) return;

      const pos = new THREE.Vector3();
      camera.object3D.getWorldPosition(pos);

      const difX = Math.abs(pos.x - this.ultimaOrigem.x);
      const difZ = Math.abs(pos.z - this.ultimaOrigem.z);

      if (difX < this.LIMIT_X && difZ < this.LIMIT_Z) {
        Minigames._toggleMoveAlert(true);
      } else {
        Minigames._toggleMoveAlert(false);
      }
    },

    calcularMultiplicador: function () {
      if (this.combo >= 5) this.multiplicador = 8;
      else if (this.combo >= 3) this.multiplicador = 4;
      else if (this.combo >= 2) this.multiplicador = 2;
      else this.multiplicador = 1;
    },

    atualizarUI: function () {
      const elValor = document.getElementById("valor-combo");
      const elBarra = document.getElementById("barra-combo-fill");
      elValor.classList.remove("nivel-x1", "nivel-x2", "nivel-x4", "nivel-x8");
      elValor.innerText = "x" + this.multiplicador;
      elValor.classList.add(`nivel-x${this.multiplicador}`);

      const bola = document.getElementById("bola");
      if (bola) {
        if (this.multiplicador === 8) {
          if (!bola.hasAttribute("rastro-fogo")) {
            bola.setAttribute("rastro-fogo", "");
            bola.setAttribute("material", "color", "#FF4500");
          }
        } else {
          bola.removeAttribute("rastro-fogo");
          bola.setAttribute("material", "color", "#000");
        }
      }

      let pct = 0;
      let cor = "#fff";
      if (this.combo === 0) pct = 5;
      else if (this.combo === 1) pct = 20;
      else if (this.combo === 2) {
        pct = 40;
        cor = "#ffd700";
      } else if (this.combo >= 3 && this.combo < 5) {
        pct = 70;
        cor = "#ff8c00";
      } else {
        pct = 100;
        cor = "#ff0000";
      }

      elBarra.style.width = pct + "%";
      elBarra.style.backgroundColor = cor;
    },

    resetarCombo: function (motivo) {
      this.combo = 0;
      this.multiplicador = 1;
      this.atualizarUI();
    },

    adicionarBonus: function (pontos, time) {
      const sensor = document.querySelector("[sensor]");
      if (sensor && sensor.components.sensor) {
        const idGrupo = time === "HOME" ? "#grupo-home" : "#grupo-guest";
        const idHud = time === "HOME" ? "score-top-home" : "score-top-guest";
        const hud = document.getElementById(idHud);
        if (hud) {
          let val = parseInt(hud.innerText) + pontos;
          hud.innerText = val < 10 ? "0" + val : val;
          sensor.components.sensor.atualizarLed(idGrupo, val);
        }
      }
    },

    reverterPontos: function (pontos, timeStr) {
      const idHud = timeStr === "HOME" ? "score-top-home" : "score-top-guest";
      const hud = document.getElementById(idHud);
      if (hud) {
        let v = parseInt(hud.innerText) - pontos;
        if (v < 0) v = 0;
        hud.innerText = v < 10 ? "0" + v : v;
        const idGrupo = timeStr === "HOME" ? "#grupo-home" : "#grupo-guest";
        const sensor = document.querySelector("[sensor]");
        if (sensor) sensor.components.sensor.atualizarLed(idGrupo, v);
      }
    },

    finalizar: function () {
      window.pararCronometro();
      this.resetarCombo("FIM");
      this.limpar();
      Minigames._esconderMarcador();
      Minigames._toggleComboUI(false);
      Minigames._toggleMoveAlert(false);

      const hudId =
        window.cestaSelecionada === 1 ? "score-top-home" : "score-top-guest";
      const placarFinal = document.getElementById(hudId).innerText;

      Minigames._mostrarGameOver({
        titulo: this.nome,
        status: "FIM DE JOGO",
        corStatus: "#ffaa00",
        labelPrincipal: "CESTAS FEITAS", // No On Fire mostra total de cestas
        valPrincipal: this.totalCestas,
        total: placarFinal,
        c3: this.cestas3,
        c2: this.cestas2,
      });
    },

    limpar: function () {
      if (this._checkPosicaoInterval) clearInterval(this._checkPosicaoInterval);
      window.removeEventListener("pontuacao-registrada", this._listenerPontos);
      window.removeEventListener("cronometro-zerado", this._listenerTimer);
      window.removeEventListener("keydown", this._listenerInteracaoBola);
      const bolaEl = document.getElementById("bola");
      if (bolaEl)
        bolaEl.removeEventListener("click", this._listenerInteracaoBola);
      this.ultimaOrigem = null;
    },

    parar: function () {
      this.limpar();
      this.resetarCombo("PARAR");
      this.ultimaOrigem = null;
      if (typeof window.zerarCronometro === "function")
        window.zerarCronometro();
      Minigames._esconderMarcador();
      Minigames._toggleComboUI(false);
      Minigames._toggleMoveAlert(false);
    },
  },
};

const Minigames = {
  desafioSelecionado: null,
  _listenerTeclas: null,
  _configUsarTimer: true,

  // ... (funções _getMarcador, _moverMarcador, _piscarMarcadorErro MANTIDAS) ...
  _getMarcador: function () {
    let marcador = document.getElementById("marcador-minigame");
    if (!marcador) {
      const scene = document.querySelector("a-scene");
      marcador = document.createElement("a-entity");
      marcador.id = "marcador-minigame";

      const ring = document.createElement("a-ring");
      ring.id = "marcador-anel";
      ring.setAttribute("radius-inner", "1.9");
      ring.setAttribute("radius-outer", "2.0");
      ring.setAttribute("rotation", "-90 0 0");
      ring.setAttribute("shader", "flat");
      ring.setAttribute("visible", "false");

      const square = document.createElement("a-plane");
      square.id = "marcador-quadrado";
      square.setAttribute("width", "8");
      square.setAttribute("height", "6");
      square.setAttribute("rotation", "-90 0 0");
      square.setAttribute(
        "material",
        "shader: flat; opacity: 0.3; transparent: true; side: double"
      );
      square.setAttribute("visible", "false");

      const beam = document.createElement("a-cylinder");
      beam.id = "marcador-feixe";
      beam.setAttribute("height", "2.0");
      beam.setAttribute("position", "0 1.0 0");
      beam.setAttribute("radius", "1.95");
      beam.setAttribute("open-ended", "true");
      beam.setAttribute("side", "double");
      beam.setAttribute("material", {
        shader: "gradient-beam",
        colorBottom: "#00FF00",
        opacity: 0.6,
        transparent: true,
        blending: "additive",
        depthWrite: false,
      });
      marcador.appendChild(ring);
      marcador.appendChild(square);
      marcador.appendChild(beam);
      scene.appendChild(marcador);
    }
    return marcador;
  },

  _moverMarcador: function (x, y, z, cor = "#00FF00", tipo = "ring") {
    const m = this._getMarcador();
    m.removeAttribute("animation");
    const ring = m.querySelector("#marcador-anel");
    const square = m.querySelector("#marcador-quadrado");
    const beam = m.querySelector("#marcador-feixe");

    if (tipo === "ring") {
      ring.setAttribute("visible", true);
      ring.setAttribute("color", cor);
      square.setAttribute("visible", false);
      beam.setAttribute("visible", true);
      beam.setAttribute("material", "colorBottom", cor);
    } else {
      ring.setAttribute("visible", false);
      beam.setAttribute("visible", false);
      square.setAttribute("visible", true);
      square.setAttribute("color", cor);
    }
    m.setAttribute("scale", "0.1 0.1 0.1");
    m.setAttribute("position", `${x} ${y} ${z}`);
    m.setAttribute("visible", true);
    setTimeout(() => {
      m.setAttribute(
        "animation",
        "property: scale; to: 1 1 1; dur: 500; easing: easeOutElastic"
      );
    }, 20);
  },

  _piscarMarcadorErro: function () {
    const m = this._getMarcador();
    if (!m) return;
    const ring = m.querySelector("#marcador-anel");
    const square = m.querySelector("#marcador-quadrado");
    const corErro = "#FFFFFF";

    if (ring.getAttribute("visible")) {
      const corOriginal = ring.getAttribute("color");
      ring.setAttribute("color", corErro);
      setTimeout(() => ring.setAttribute("color", corOriginal), 300);
    }
    if (square.getAttribute("visible")) {
      const corOriginal = square.getAttribute("color");
      square.setAttribute("color", corErro);
      setTimeout(() => square.setAttribute("color", corOriginal), 300);
    }
  },

  _esconderMarcador: function () {
    const m = document.getElementById("marcador-minigame");
    if (m) m.setAttribute("visible", false);
  },

  _atualizarEstado: function (novoStatus, novoModo = null) {
    window.estadoJogo.status = novoStatus;
    if (novoModo) window.estadoJogo.modo = novoModo;
  },

  _toggleResetUI: function (mostrar) {
    const el = document.getElementById("row-reset-placar");
    if (el) el.style.display = mostrar ? "flex" : "none";
  },

  _toggleMiraUI: function (mostrar) {
    const el = document.getElementById("row-btn-mira");
    if (el) el.style.display = mostrar ? "flex" : "none";
  },

  _togglePrompts: function (mostrar, apenasSair = false) {
    const prompts = document.getElementById("minigame-prompts");
    if (!prompts) return;
    if (mostrar) {
      prompts.classList.remove("oculto");
      const itens = prompts.querySelectorAll(".prompt-item");
      if (itens.length >= 2) {
        if (apenasSair) itens[0].style.display = "none";
        else itens[0].style.display = "flex";
      }
    } else {
      prompts.classList.add("oculto");
    }
  },

  _toggleInfo: function (mostrar, desafio = null) {
    const painel = document.getElementById("minigame-info");
    if (!painel) return;
    if (mostrar && desafio) {
      const elTitulo = document.getElementById("info-titulo");
      const elCesta = document.getElementById("info-cesta");
      let corTema, nomeCesta;
      if (window.cestaSelecionada === 1) {
        corTema = "#00aaff";
        nomeCesta = "HOME (AZUL)";
      } else {
        corTema = "#ffaa00";
        nomeCesta = "GUEST (AMARELA)";
      }
      elTitulo.innerText = desafio.nome;
      elCesta.innerText = nomeCesta;
      document.getElementById("info-objetivo").innerText =
        desafio.objetivo || "-";
      document.getElementById("info-regra").innerText = desafio.regra || "-";
      painel.style.borderRightColor = corTema;
      elTitulo.style.color = corTema;
      elCesta.style.color = corTema;
      painel.classList.remove("oculto");
    } else {
      painel.classList.add("oculto");
    }
  },

  atualizarInfo: function () {
    if (
      this.desafioSelecionado &&
      window.estadoJogo.status === window.GAME_STATUS.ESPERA
    ) {
      this._toggleInfo(true, this.desafioSelecionado);
    }
  },

  _iniciarContagem: function (callbackInicio) {
    const overlay = document.getElementById("countdown-overlay");
    const texto = document.getElementById("countdown-text");
    if (!overlay || !texto) {
      callbackInicio();
      return;
    }
    this._atualizarEstado(window.GAME_STATUS.CONTAGEM);
    overlay.classList.remove("oculto");
    let conta = 3;
    texto.innerText = conta;
    const intervalo = setInterval(() => {
      conta--;
      if (conta > 0) {
        texto.innerText = conta;
      } else {
        clearInterval(intervalo);
        texto.innerText = "VAI!";
        setTimeout(() => {
          overlay.classList.add("oculto");
          callbackInicio();
        }, 500);
      }
    }, 1000);
  },

  _setarTeclaT: function (permitido) {
    const bola = document.getElementById("bola");
    if (bola && bola.components["mecanica-arremesso"])
      bola.components["mecanica-arremesso"].podeUsarT = permitido;
    const btnT = document.getElementById("btn-t");
    if (btnT) {
      const linhaMenu = btnT.closest(".control-row");
      if (linhaMenu) linhaMenu.style.display = permitido ? "flex" : "none";
    }
  },

  _limparAmbiente: function () {
    if (typeof window.zerarCronometro === "function") window.zerarCronometro();
    if (typeof window.resetarPlacar === "function") window.resetarPlacar();
    console.log("🧹 Ambiente limpo.");
  },

  iniciar: function (idDesafio, usarTimer = true) {
    if (window.estadoJogo.status !== window.GAME_STATUS.DESATIVADO) {
      this.pararTotal();
    }
    const desafio = Desafios[idDesafio];
    if (desafio) {
      this.desafioSelecionado = desafio;
      this._configUsarTimer = usarTimer;
      this._atualizarEstado(window.GAME_STATUS.ESPERA, desafio.enumMode);
      this._configurarControles();
      this._togglePrompts(true, false);
      this._toggleInfo(true, desafio); // Mostra info na espera
      return `Aguardando start...`;
    } else {
      console.error(`❌ Desafio '${idDesafio}' não encontrado.`);
      return null;
    }
  },

  _configurarControles: function () {
    if (this._listenerTeclas)
      window.removeEventListener("keydown", this._listenerTeclas);
    this._listenerTeclas = (e) => {
      if (
        e.code === "KeyI" &&
        window.estadoJogo.status === window.GAME_STATUS.ESPERA
      ) {
        const placarEl = document.getElementById("placar-principal");
        if (placarEl && placarEl.components["menu-placar"]) {
          placarEl.components["menu-placar"].fecharMenuTotal();
        }
        this._setarTeclaT(true);
        this._toggleResetUI(false);
        this._togglePrompts(true, true);

        // Mira
        if (window.configMira === false) {
          this._toggleMiraUI(false);
          const bola = document.getElementById("bola");
          if (bola) {
            if (bola.components["mecanica-arremesso"])
              bola.components["mecanica-arremesso"].mostrarTrajetoria = false;
            if (bola.components["trajetoria-previsao"]) {
              bola.components["trajetoria-previsao"].mostrando = false;
              bola.components["trajetoria-previsao"].pontosEl.forEach((p) =>
                p.setAttribute("visible", "false")
              );
            }
            const txtMira = document.getElementById("txt-mira");
            if (txtMira) txtMira.innerText = "BLOQUEADA";
          }
        }
        this._limparAmbiente();
        this._iniciarContagem(() => {
          this._atualizarEstado(window.GAME_STATUS.ATIVO);

          // [MODIFICAÇÃO AQUI] Oculta as regras ao começar
          this._toggleInfo(false);

          this.desafioSelecionado.iniciar(this._configUsarTimer);
        });
      }
      if (e.code === "KeyO") {
        const overlay = document.getElementById("countdown-overlay");
        if (overlay) overlay.classList.add("oculto");

        // Game Over ao sair
        if (
          this.desafioSelecionado &&
          window.estadoJogo.status === window.GAME_STATUS.ATIVO
        ) {
          this.desafioSelecionado.finalizar(false);
        } else {
          this.pararTotal();
        }
      }
    };
    window.addEventListener("keydown", this._listenerTeclas);
  },

  // === FUNÇÕES DA TELA DE GAME OVER ===
  _mostrarGameOver: function (dados) {
    const overlay = document.getElementById("game-over-overlay");
    if (!overlay) return;

    document.getElementById("go-titulo").innerText = dados.titulo;
    const statusEl = document.getElementById("go-status");
    statusEl.innerText = dados.status;
    statusEl.style.color = dados.corStatus;

    document.getElementById("label-principal").innerText = dados.labelPrincipal;
    document.getElementById("val-principal").innerText = dados.valPrincipal;
    document.getElementById("val-total").innerText = dados.total;
    document.getElementById("val-3pts").innerText = dados.c3;
    document.getElementById("val-2pts").innerText = dados.c2;

    const btnReiniciar = document.getElementById("btn-reiniciar");
    const btnSair = document.getElementById("btn-sair");

    const novoBtnReiniciar = btnReiniciar.cloneNode(true);
    const novoBtnSair = btnSair.cloneNode(true);
    btnReiniciar.parentNode.replaceChild(novoBtnReiniciar, btnReiniciar);
    btnSair.parentNode.replaceChild(novoBtnSair, btnSair);

    novoBtnReiniciar.addEventListener("click", () => {
      Minigames.reiniciarDesafio();
    });

    novoBtnSair.addEventListener("click", () => {
      Minigames._ocultarGameOver();
      Minigames.pararTotal();
    });

    window.estadoJogo.status = window.GAME_STATUS.CONTAGEM;
    document.exitPointerLock();
    overlay.classList.remove("oculto");
  },

  _ocultarGameOver: function () {
    const overlay = document.getElementById("game-over-overlay");
    if (overlay) overlay.classList.add("oculto");
  },

  reiniciarDesafio: function () {
    this._ocultarGameOver();
    if (this.desafioSelecionado) {
      this.desafioSelecionado.parar();
    }
    this._limparAmbiente();
    this._atualizarEstado(
      window.GAME_STATUS.ESPERA,
      this.desafioSelecionado.enumMode
    );
    this._togglePrompts(true, false);
    this._toggleInfo(true, this.desafioSelecionado); // Mostra regras novamente na espera
    console.log("🔄 Desafio Reiniciado");
  },

  pararTotal: function () {
    this._ocultarGameOver();
    if (this.desafioSelecionado) {
      this.desafioSelecionado.parar();
      this.desafioSelecionado = null;

      if (this._listenerTeclas) {
        window.removeEventListener("keydown", this._listenerTeclas);
        this._listenerTeclas = null;
      }

      this._setarTeclaT(true);
      this._toggleResetUI(true);
      this._toggleMiraUI(true);
      this._togglePrompts(false);
      this._toggleInfo(false);

      if (typeof window.resetarPlacar === "function") window.resetarPlacar();

      const txtMira = document.getElementById("txt-mira");
      if (txtMira) txtMira.innerText = "Desativar Mira";

      const bola = document.getElementById("bola");
      if (bola && bola.components["mecanica-arremesso"]) {
        bola.components["mecanica-arremesso"].mostrarTrajetoria = true;
      }

      if (bola) {
        bola.removeAttribute("rastro-fogo");
        bola.setAttribute("material", "color", "#000");
      }

      Minigames._toggleMoveAlert(false);
      this._atualizarEstado(
        window.GAME_STATUS.DESATIVADO,
        window.GAME_MODE.LIVRE
      );
      console.log("✅ Modo Livre Restaurado e Placar Zerado.");
    }
  },
};

Minigames._toggleMoveAlert = function (show) {
  let alert = document.getElementById("alert-move");
  if (!alert) {
    alert = document.createElement("div");
    alert.id = "alert-move";
    alert.style.position = "fixed";
    alert.style.top = "30%";
    alert.style.left = "50%";
    alert.style.transform = "translate(-50%, -50%)";
    alert.style.color = "#ff3333";
    alert.style.fontFamily = "'Electrolize', sans-serif";
    alert.style.fontWeight = "bold";
    alert.style.fontSize = "26px";
    alert.style.textShadow = "0 0 10px black, 0 0 20px red";
    alert.style.display = "none";
    alert.style.zIndex = "99999";
    alert.style.textAlign = "center";
    alert.innerHTML =
      "⚠️ ZONA QUEIMADA! ⚠️<br><span style='font-size:18px; color:white'>MOVA-SE PARA ARREMESSAR</span>";

    const style = document.createElement("style");
    style.innerHTML = `
          @keyframes piscarAlerta { 
            0% {opacity:1; transform: translate(-50%, -50%) scale(1);} 
            50% {opacity:0.5; transform: translate(-50%, -50%) scale(1.05);} 
            100% {opacity:1; transform: translate(-50%, -50%) scale(1);} 
          }
        `;
    document.head.appendChild(style);
    alert.style.animation = "piscarAlerta 0.6s infinite";
    document.body.appendChild(alert);
  }
  alert.style.display = show ? "block" : "none";
};

Minigames._toggleComboUI = function (mostrar) {
  const hud = document.getElementById("hud-combo-container");
  if (!hud) return;
  if (mostrar) hud.classList.remove("oculto");
  else hud.classList.add("oculto");
};

window.Minigames = Minigames;