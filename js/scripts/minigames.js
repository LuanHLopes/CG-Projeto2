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
   MINIGAMES.JS - Versão Final (Timer Opcional + Sem Blink no modo Livre)
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
        : "SEM LIMITE (TREINO)";

      console.log(
        `🏀 [STREET 21] INICIADO! Meta: ${this.META_PONTOS} | Tempo: ${modoTempo}`
      );

      if (this.usandoTimer && typeof window.iniciarCronometro === "function") {
        window.iniciarCronometro();
        this._listenerTimer = () => {
          this.finalizarComEfeito(false, "⏰ TEMPO ESGOTADO!");
        };
        window.addEventListener("cronometro-zerado", this._listenerTimer);
      } else {
        // Garante cronometro parado no modo treino
        if (typeof window.pararCronometro === "function")
          window.pararCronometro();
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

      // Para o cronômetro se estiver rodando
      if (this.usandoTimer && typeof window.pararCronometro === "function")
        window.pararCronometro();

      this.limparListeners();

      // [MODIFICAÇÃO] Só pisca o HUD se o timer estava sendo usado
      if (this.usandoTimer) {
        const timerEl = document.getElementById("grupo-tempo");
        if (timerEl && timerEl.components["cronometro-tempo"])
          timerEl.components["cronometro-tempo"].blinkHud();
      }

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
    descricao: "Acerte 5 cestas de locais diferentes.",

    usandoTimer: true,
    _listenerPontos: null,
    _listenerTimer: null,
    _timerDelay: null,

    cestasFeitas: 0,
    META_CESTAS: 5,
    historicoPosicoes: [],
    posicaoAtual: null,

    iniciar: function (usarTimer = true) {
      this.usandoTimer = usarTimer;
      this.cestasFeitas = 0;
      this.historicoPosicoes = [];
      this.posicaoAtual = null;

      const idAlvo = window.cestaSelecionada;
      const nomeCesta = idAlvo === 1 ? "HOME" : "GUEST";

      const textoTempo = this.usandoTimer
        ? `COM TIMER (${window.tempoCronometro}s)`
        : "SEM TIMER (LIVRE)";

      console.log(
        `🌍 [VOLTA AO MUNDO] Alvo: ${nomeCesta} | Modo: ${textoTempo}`
      );
      console.log("📍 Regra: Arremesse de DENTRO do feixe de luz.");

      this.gerarNovaPosicao();

      if (this.usandoTimer && typeof window.iniciarCronometro === "function") {
        window.iniciarCronometro();
        this._listenerTimer = () => {
          this.finalizarComEfeito(
            false,
            "⏰ TEMPO ESGOTADO! Tente ser mais rápido."
          );
        };
        window.addEventListener("cronometro-zerado", this._listenerTimer);
      } else {
        if (typeof window.pararCronometro === "function")
          window.pararCronometro();
      }

      this._listenerPontos = (e) => {
        const idEvento = parseInt(e.detail.idCesta);
        if (idEvento !== parseInt(window.cestaSelecionada)) return;

        if (!this.validarPosicaoArremesso()) {
          console.warn("🚫 PONTO INVALIDADO: Fora da zona!");
          Minigames._piscarMarcadorErro();
          this.reverterPontuacaoVisual(e.detail.pontosFeitos, e.detail.time);
          return;
        }

        this.cestasFeitas++;
        console.log(
          `✅ Cesta ${this.cestasFeitas}/${this.META_CESTAS} VÁLIDA!`
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

    validarPosicaoArremesso: function () {
      if (!this.posicaoAtual) return true;
      const bola = document.getElementById("bola");
      if (!bola || !bola.object3D.userData.origemArremesso) return false;
      const origem = bola.object3D.userData.origemArremesso;
      const alvo = this.posicaoAtual;
      const dist = Math.sqrt(
        Math.pow(origem.x - alvo.x, 2) + Math.pow(origem.z - alvo.z, 2)
      );
      const TOLERANCIA = 2.0;
      return dist <= TOLERANCIA;
    },

    reverterPontuacaoVisual: function (pontos, timeStr) {
      const idHud = timeStr === "HOME" ? "score-top-home" : "score-top-guest";
      const hudElement = document.getElementById(idHud);
      if (hudElement) {
        let valorAtual = parseInt(hudElement.innerText);
        let valorCorrigido = Math.max(0, valorAtual - pontos);
        hudElement.innerText =
          valorCorrigido < 10 ? "0" + valorCorrigido : valorCorrigido;
        const idGrupo3D = timeStr === "HOME" ? "#grupo-home" : "#grupo-guest";
        const sensor = document.querySelector("[sensor]");
        if (
          sensor &&
          sensor.components.sensor &&
          sensor.components.sensor.atualizarLed
        ) {
          sensor.components.sensor.atualizarLed(idGrupo3D, valorCorrigido);
        }
      }
    },

    gerarNovaPosicao: function () {
      const idCesta = parseInt(window.cestaSelecionada);
      const zPosteAlvo = idCesta === 1 ? -7.1625 : 7.1625;
      const limiteX = 7.2;
      let minZ, maxZ;
      if (idCesta === 1) {
        minZ = -13.5;
        maxZ = 7.5;
      } else {
        minZ = -7.5;
        maxZ = 13.5;
      }

      let randX, randZ;
      let valida = false;
      let tentativas = 0;

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
        if (distanciaAteAlvo > 4.0 && longeDoHistorico) valida = true;
        tentativas++;
      } while (!valida && tentativas < 500);

      if (!valida) {
        randX = Math.random() * (limiteX * 2) - limiteX;
        randZ = Math.random() * (maxZ - minZ) + minZ;
      }

      this.posicaoAtual = { x: randX, z: randZ };
      this.historicoPosicoes.push(this.posicaoAtual);
      Minigames._moverMarcador(randX, 0.12, randZ);
    },

    finalizarComEfeito: function (venceu, mensagem) {
      console.log(mensagem);

      if (this.usandoTimer && typeof window.pararCronometro === "function")
        window.pararCronometro();

      this.limparListeners();

      // [MODIFICAÇÃO] Só pisca HUD se timer estava sendo usado
      if (this.usandoTimer) {
        const timerEl = document.getElementById("grupo-tempo");
        if (timerEl && timerEl.components["cronometro-tempo"])
          timerEl.components["cronometro-tempo"].blinkHud();
      }

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

  // ... (MANTENHA AS FUNÇÕES _getMarcador, _moverMarcador, _piscarMarcadorErro, _esconderMarcador IGUAIS) ...
  // Vou omitir para economizar espaço, mas você NÃO deve apagá-las.
  _getMarcador: function () {
    let marcador = document.getElementById("marcador-minigame");
    if (!marcador) {
      const scene = document.querySelector("a-scene");
      marcador = document.createElement("a-entity");
      marcador.id = "marcador-minigame";
      const ring = document.createElement("a-ring");
      ring.id = "marcador-anel";
      ring.setAttribute("color", "#00FF00");
      ring.setAttribute("radius-inner", "1.9");
      ring.setAttribute("radius-outer", "2.0");
      ring.setAttribute("rotation", "-90 0 0");
      ring.setAttribute("shader", "flat");
      ring.setAttribute("opacity", "0.8");
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
      marcador.appendChild(beam);
      scene.appendChild(marcador);
    }
    return marcador;
  },
  _moverMarcador: function (x, y, z) {
    const m = this._getMarcador();
    m.removeAttribute("animation");
    const ring = m.querySelector("#marcador-anel");
    const beam = m.querySelector("#marcador-feixe");
    if (ring) ring.setAttribute("color", "#00FF00");
    if (beam) beam.setAttribute("material", "colorBottom", "#00FF00");
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
    const beam = m.querySelector("#marcador-feixe");
    const corErro = "#FF0000";
    const corNormal = "#00FF00";
    if (ring) ring.setAttribute("color", corErro);
    if (beam) beam.setAttribute("material", "colorBottom", corErro);
    setTimeout(() => {
      if (ring) ring.setAttribute("color", corNormal);
      if (beam) beam.setAttribute("material", "colorBottom", corNormal);
    }, 500);
  },
  _esconderMarcador: function () {
    const m = document.getElementById("marcador-minigame");
    if (m) m.setAttribute("visible", false);
  },
  // ... FIM DAS FUNÇÕES DE MARCADOR ...

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

  // [NOVO] Controla os prompts I/O no canto inferior
  _togglePrompts: function (mostrar, apenasSair = false) {
    const prompts = document.getElementById("minigame-prompts");
    const hintG = document.getElementById("hint-menu");

    if (!prompts) return;

    if (mostrar) {
      prompts.classList.remove("oculto");
      // Gerencia o conflito com o hint G
      if (hintG) hintG.classList.add("deslocado");

      // Se o jogo já começou, esconde o "I" e deixa só o "O"
      const itens = prompts.querySelectorAll(".prompt-item");
      if (itens.length >= 2) {
        if (apenasSair) {
          itens[0].style.display = "none"; // Esconde I
        } else {
          itens[0].style.display = "flex"; // Mostra I
        }
      }
    } else {
      prompts.classList.add("oculto");
      if (hintG) hintG.classList.remove("deslocado");
    }
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

      // [NOVO] Mostra os prompts de espera (I e O) e move o G
      this._togglePrompts(true, false);

      console.log(`⚠️ PREPARADO: ${desafio.nome}`);
      console.log(
        `⏱️ MODO TIMER: ${usarTimer ? "ATIVADO" : "DESATIVADO (LIVRE)"}`
      );
      console.log(`👉 'I' para INICIAR | 'O' para CANCELAR`);
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
        this._setarTeclaT(true);
        this._toggleResetUI(false);

        // [NOVO] Atualiza prompts: Esconde o "I" (já iniciou), mantém "O"
        this._togglePrompts(true, true);

        if (window.configMira === false) {
          console.log("🚫 Minigame Hardcore: Mira Desativada!");
          this._toggleMiraUI(false);
          const bola = document.getElementById("bola");
          if (bola) {
            if (bola.components["mecanica-arremesso"]) {
              bola.components["mecanica-arremesso"].mostrarTrajetoria = false;
            }
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
      this._toggleResetUI(true);
      this._toggleMiraUI(true);

      // [NOVO] Esconde todos os prompts e restaura posição do G
      this._togglePrompts(false);

      const txtMira = document.getElementById("txt-mira");
      if (txtMira) txtMira.innerText = "Desativar Mira";

      const bola = document.getElementById("bola");
      if (bola && bola.components["mecanica-arremesso"]) {
        bola.components["mecanica-arremesso"].mostrarTrajetoria = true;
      }

      this._atualizarEstado(
        window.GAME_STATUS.DESATIVADO,
        window.GAME_MODE.LIVRE
      );
      console.log("✅ Modo Livre Restaurado.");
    }
  },
};

window.Minigames = Minigames;