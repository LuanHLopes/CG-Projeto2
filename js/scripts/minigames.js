/* ====================================================================
   REGISTRO DE SHADER (FEIXE DE LUZ COM DEGRADÊ)
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
   MINIGAMES.JS - Street 21 + Volta ao Mundo (Ajuste Final: Zona 6m + Altura 2m)
==================================================================== */

const Desafios = {
  // === STREET 21 ===
  street21: {
    id: "street21",
    enumMode: window.GAME_MODE.STREET_21,
    nome: "Street 21",
    META_PONTOS: 21,
    get descricao() {
      return `Faça exatamente ${this.META_PONTOS} pontos.`;
    },
    _listenerPontos: null,
    _listenerTimer: null,
    _timerDelay: null,
    usandoTimer: true,

    iniciar: function (usarTimer = true) {
      this.usandoTimer = usarTimer;
      const alvo =
        window.cestaSelecionada === 1 ? "HOME (Azul)" : "GUEST (Amarela)";
      const modoTempo = this.usandoTimer
        ? `${window.tempoCronometro}s`
        : "SEM LIMITE";

      console.log(
        `🏀 [STREET 21] INICIADO! Meta: ${this.META_PONTOS} | Tempo: ${modoTempo}`
      );

      if (this.usandoTimer && typeof window.iniciarCronometro === "function") {
        window.iniciarCronometro();
        this._listenerTimer = () => {
          this.finalizarComEfeito(false, "⏰ TEMPO ESGOTADO!");
        };
        window.addEventListener("cronometro-zerado", this._listenerTimer);
      }

      this._listenerPontos = (e) => {
        const idEvento = parseInt(e.detail.idCesta);
        const idAlvo = parseInt(window.cestaSelecionada);
        if (idEvento !== idAlvo) return;
        const total = e.detail.totalAcumulado;
        this.verificarVitoria(total);
      };
      window.addEventListener("pontuacao-registrada", this._listenerPontos);
    },
    verificarVitoria: function (total) {
      if (total === this.META_PONTOS) {
        this.finalizarComEfeito(
          true,
          `🏆 VITÓRIA! CRAVOU ${this.META_PONTOS} PONTOS!`
        );
      } else if (total > this.META_PONTOS) {
        this.finalizarComEfeito(false, `💀 DERROTA! Fez ${total} e estourou.`);
      }
    },
    finalizarComEfeito: function (venceu, mensagem) {
      console.log(mensagem);
      if (this.usandoTimer && typeof window.pararCronometro === "function")
        window.pararCronometro();
      this.limparListeners();
      const timerEl = document.getElementById("grupo-tempo");
      if (timerEl && timerEl.components["cronometro-tempo"])
        timerEl.components["cronometro-tempo"].blinkHud();
      this._timerDelay = setTimeout(() => {
        Minigames.pararTotal();
      }, 3500);
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
      if (this._timerDelay) {
        clearTimeout(this._timerDelay);
        this._timerDelay = null;
      }
      if (typeof window.zerarCronometro === "function")
        window.zerarCronometro();
      console.log(`🛑 [STREET 21] finalizado.`);
    },
  },

  // === VOLTA AO MUNDO ===
  voltaAoMundo: {
    id: "voltaAoMundo",
    enumMode: window.GAME_MODE.VOLTA_AO_MUNDO,
    nome: "Volta ao Mundo",
    descricao: "Acerte 5 cestas espalhadas (min 10m de distância entre elas).",

    usandoTimer: true,
    _listenerPontos: null,
    _listenerTimer: null,
    _timerDelay: null,

    cestasFeitas: 0,
    META_CESTAS: 5,
    historicoPosicoes: [],

    iniciar: function (usarTimer = true) {
      this.usandoTimer = usarTimer;
      this.cestasFeitas = 0;
      this.historicoPosicoes = [];

      const idAlvo = window.cestaSelecionada;
      const nomeCesta = idAlvo === 1 ? "HOME" : "GUEST";

      console.log(`🌍 [VOLTA AO MUNDO] Alvo: ${nomeCesta}`);
      console.log("📍 Regra: 10m de distância + Zona Morta Oposta 6m.");

      this.gerarNovaPosicao();

      if (this.usandoTimer && typeof window.iniciarCronometro === "function") {
        window.iniciarCronometro();
        this._listenerTimer = () => {
          this.finalizarComEfeito(false, "⏰ TEMPO ESGOTADO!");
        };
        window.addEventListener("cronometro-zerado", this._listenerTimer);
      }

      this._listenerPontos = (e) => {
        const idEvento = parseInt(e.detail.idCesta);
        if (idEvento !== parseInt(window.cestaSelecionada)) return;

        this.cestasFeitas++;
        console.log(
          `✅ Cesta ${this.cestasFeitas}/${this.META_CESTAS} convertida!`
        );

        if (this.cestasFeitas >= this.META_CESTAS) {
          this.finalizarComEfeito(
            true,
            "🏆 PARABÉNS! VOCÊ COMPLETOU A VOLTA AO MUNDO!"
          );
        } else {
          this.gerarNovaPosicao();
        }
      };
      window.addEventListener("pontuacao-registrada", this._listenerPontos);
    },

    gerarNovaPosicao: function () {
      const idCesta = parseInt(window.cestaSelecionada);
      const zPosteAlvo = idCesta === 1 ? -7.1625 : 7.1625;

      const limiteX = 7.2;

      // [MODIFICADO] Zona Morta retornou para 6m
      let minZ, maxZ;

      if (idCesta === 1) {
        // Alvo: HOME (Negativo)
        // Evita o fundo extremo do Guest (+13.5 - 6m = +7.5)
        minZ = -13.5;
        maxZ = 7.5;
      } else {
        // Alvo: GUEST (Positivo)
        // Evita o fundo extremo do Home (-13.5 + 6m = -7.5)
        minZ = -7.5;
        maxZ = 13.5;
      }

      let randX, randZ;
      let valida = false;
      let tentativas = 0;

      // console.log(`🎲 Gerando Posição (Z entre ${minZ} e ${maxZ})...`);

      do {
        randX = Math.random() * (limiteX * 2) - limiteX;
        randZ = Math.random() * (maxZ - minZ) + minZ;

        const distanciaAteAlvo = Math.sqrt(
          Math.pow(randX - 0, 2) + Math.pow(randZ - zPosteAlvo, 2)
        );

        let longeDoHistorico = true;
        for (let pos of this.historicoPosicoes) {
          const distHist = Math.sqrt(
            Math.pow(randX - pos.x, 2) + Math.pow(randZ - pos.z, 2)
          );
          if (distHist < 10.0) {
            longeDoHistorico = false;
            break;
          }
        }

        if (distanciaAteAlvo > 4.0 && longeDoHistorico) {
          valida = true;
        }
        tentativas++;
      } while (!valida && tentativas < 500);

      if (!valida) {
        console.warn("⚠️ Fallback: Gerando posição de emergência.");
        randX = Math.random() * (limiteX * 2) - limiteX;
        randZ = Math.random() * (maxZ - minZ) + minZ;
      }

      this.historicoPosicoes.push({ x: randX, z: randZ });

      // Mantendo Y = 0.12 (altura do anel no chão)
      Minigames._moverMarcador(randX, 0.12, randZ);
    },

    finalizarComEfeito: function (venceu, mensagem) {
      console.log(mensagem);
      if (this.usandoTimer && typeof window.pararCronometro === "function")
        window.pararCronometro();
      this.limparListeners();
      const timerEl = document.getElementById("grupo-tempo");
      if (timerEl && timerEl.components["cronometro-tempo"])
        timerEl.components["cronometro-tempo"].blinkHud();
      Minigames._esconderMarcador();
      this._timerDelay = setTimeout(() => {
        Minigames.pararTotal();
      }, 3500);
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
      if (this._timerDelay) {
        clearTimeout(this._timerDelay);
        this._timerDelay = null;
      }
      if (typeof window.zerarCronometro === "function")
        window.zerarCronometro();
      Minigames._esconderMarcador();
      console.log(`🛑 [VOLTA AO MUNDO] finalizado.`);
    },
  },

  onFire: {
    id: "onFire",
    enumMode: window.GAME_MODE.ON_FIRE,
    nome: "On Fire",
    descricao: "Modo Arcade 60s.",
    iniciar: function () {
      console.log("Em breve...");
    },
    parar: function () {
      console.log("Parando...");
    },
  },
};

const Minigames = {
  desafioSelecionado: null,
  _listenerTeclas: null,
  _configUsarTimer: true,

  // === MARCADOR VISUAL (ANEL + FEIXE DE LUZ) ===
  _getMarcador: function () {
    let marcador = document.getElementById("marcador-minigame");
    if (!marcador) {
      const scene = document.querySelector("a-scene");
      marcador = document.createElement("a-entity");
      marcador.id = "marcador-minigame";

      // 1. Anel no chão
      const ring = document.createElement("a-ring");
      ring.setAttribute("color", "#00FF00");
      ring.setAttribute("radius-inner", "1.9");
      ring.setAttribute("radius-outer", "2.0");
      ring.setAttribute("rotation", "-90 0 0");
      ring.setAttribute("shader", "flat");
      ring.setAttribute("opacity", "0.8");

      // 2. [ATUALIZADO] Feixe Vertical (Altura 2.0m)
      const beam = document.createElement("a-cylinder");
      // Altura 2.0m. Posição Y deve ser metade da altura (1.0)
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
      marcador.appendChild(beam);

      scene.appendChild(marcador);
    }
    return marcador;
  },

  _moverMarcador: function (x, y, z) {
    const m = this._getMarcador();
    m.removeAttribute("animation");

    m.setAttribute("scale", "0.1 0.1 0.1");
    // Posiciona (Y = 0.12 para o anel no chão, o feixe sobe a partir daí)
    m.setAttribute("position", `${x} ${y} ${z}`);
    m.setAttribute("visible", true);

    setTimeout(() => {
      m.setAttribute(
        "animation",
        "property: scale; to: 1 1 1; dur: 500; easing: easeOutElastic"
      );
    }, 20);
  },

  _esconderMarcador: function () {
    const m = document.getElementById("marcador-minigame");
    if (m) m.setAttribute("visible", false);
  },
  _atualizarEstado: function (novoStatus, novoModo = null) {
    window.estadoJogo.status = novoStatus;
    if (novoModo) window.estadoJogo.modo = novoModo;
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
    console.log("🧹 Ambiente limpo para novo jogo.");
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
      console.log(`⚠️ PREPARADO: ${desafio.nome}`);
      console.log(`⏱️ MODO TIMER: ${usarTimer ? "ATIVADO" : "DESATIVADO"}`);
      console.log(`👉 'I' para INICIAR (Bloqueia T) | 'O' para CANCELAR`);
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
        this._setarTeclaT(false);
        this._limparAmbiente();
        this._atualizarEstado(window.GAME_STATUS.ATIVO);
        this.desafioSelecionado.iniciar(this._configUsarTimer);
      }
      if (e.code === "KeyO") {
        this.pararTotal();
      }
    };
    window.addEventListener("keydown", this._listenerTeclas);
  },
  pararTotal: function () {
    if (this.desafioSelecionado) {
      this.desafioSelecionado.parar();
      this.desafioSelecionado = null;
      if (this._listenerTeclas) {
        window.removeEventListener("keydown", this._listenerTeclas);
        this._listenerTeclas = null;
      }
      this._setarTeclaT(true);
      this._atualizarEstado(
        window.GAME_STATUS.DESATIVADO,
        window.GAME_MODE.LIVRE
      );
      console.log("✅ Modo Livre Restaurado.");
    }
  },
};

window.Minigames = Minigames;