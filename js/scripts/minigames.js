/* ====================================================================
   REGISTRO DE SHADER (MANTIDO)
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
   MINIGAMES.JS (FINAL)
==================================================================== */

const Desafios = {
  // === STREET 21 ===
  street21: {
    id: "street21",
    enumMode: window.GAME_MODE.STREET_21,
    nome: "Street 21",
    // [NOVO] Textos para o Painel
    objetivo: "Faça exatamente 21 pontos.",
    regra: "Se estourar 21, você perde.",

    META_PONTOS: 21,
    _listenerPontos: null,
    _listenerTimer: null,
    _timerDelay: null,
    usandoTimer: true,

    iniciar: function (usarTimer = true) {
      this.usandoTimer = usarTimer;
      const modoTempo = this.usandoTimer
        ? `${window.tempoCronometro}s`
        : "SEM LIMITE";
      console.log(`🏀 [STREET 21] INICIADO! Tempo: ${modoTempo}`);

      if (this.usandoTimer && typeof window.iniciarCronometro === "function") {
        window.iniciarCronometro();
        this._listenerTimer = () => {
          this.finalizarComEfeito(false, "⏰ TEMPO ESGOTADO!");
        };
        window.addEventListener("cronometro-zerado", this._listenerTimer);
      } else {
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
        this.finalizarComEfeito(true, `🏆 VITÓRIA! CRAVOU 21 PONTOS!`);
      } else if (total > this.META_PONTOS) {
        this.finalizarComEfeito(false, `💀 DERROTA! Fez ${total} e estourou.`);
      }
    },
    finalizarComEfeito: function (venceu, mensagem) {
      console.log(mensagem);
      if (this.usandoTimer && typeof window.pararCronometro === "function")
        window.pararCronometro();
      this.limparListeners();
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
    // [NOVO] Textos para o Painel
    objetivo: "Acerte 5 cestas das zonas marcadas.",
    regra: "Arremesse de DENTRO da luz verde.",

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

      const textoTempo = this.usandoTimer ? `COM TIMER` : "SEM TIMER";
      console.log(`🌍 [VOLTA AO MUNDO] Modo: ${textoTempo}`);

      this.gerarNovaPosicao();

      if (this.usandoTimer && typeof window.iniciarCronometro === "function") {
        window.iniciarCronometro();
        this._listenerTimer = () => {
          this.finalizarComEfeito(false, "⏰ TEMPO ESGOTADO!");
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
          window.notificar("PONTO INVÁLIDO: FORA DA ZONA");
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
            "🏆 PARABÉNS! COMPLETOU A VOLTA AO MUNDO!"
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
          Math.pow(randX, 2) + Math.pow(randZ - zPosteAlvo, 2)
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
    objetivo: "Faça o máximo de pontos.",
    regra: "Acerte cestas consecutivas.",
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
      ring.setAttribute("segments-theta", "128");
      ring.setAttribute("rotation", "-90 0 0");
      ring.setAttribute("shader", "flat");
      ring.setAttribute("opacity", "0.8");
      const beam = document.createElement("a-cylinder");
      beam.id = "marcador-feixe";
      beam.setAttribute("height", "2.0");
      beam.setAttribute("position", "0 1.0 0");
      beam.setAttribute("radius", "1.95");
      beam.setAttribute("segments-radial", "128");
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
    const hintG = document.getElementById("hint-menu");
    if (!prompts) return;
    if (mostrar) {
      prompts.classList.remove("oculto");
      if (hintG) hintG.classList.add("deslocado");
      const itens = prompts.querySelectorAll(".prompt-item");
      if (itens.length >= 2) {
        if (apenasSair) {
          itens[0].style.display = "none";
        } else {
          itens[0].style.display = "flex";
        }
      }
    } else {
      prompts.classList.add("oculto");
      if (hintG) hintG.classList.remove("deslocado");
    }
  },

  _toggleInfo: function (mostrar, desafio = null) {
    const painel = document.getElementById("minigame-info");
    if (!painel) return;

    if (mostrar && desafio) {
      const elTitulo = document.getElementById("info-titulo");
      const elCesta = document.getElementById("info-cesta");

      // Define cor e texto baseados na cesta selecionada
      let corTema, nomeCesta;

      if (window.cestaSelecionada === 1) {
        corTema = "#00aaff"; // Azul (Home)
        nomeCesta = "HOME (AZUL)";
      } else {
        corTema = "#ffaa00"; // Laranja (Guest)
        nomeCesta = "GUEST (AMARELA)";
      }

      // Aplica os textos
      elTitulo.innerText = desafio.nome;
      elCesta.innerText = nomeCesta;
      document.getElementById("info-objetivo").innerText =
        desafio.objetivo || "-";
      document.getElementById("info-regra").innerText = desafio.regra || "-";

      // Aplica a cor dinâmica aos elementos visuais
      painel.style.borderRightColor = corTema; // Muda a borda lateral
      elTitulo.style.color = corTema; // Muda o título
      elCesta.style.color = corTema; // Muda o texto da cesta

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
      this._toggleInfo(true, desafio);

      console.log(`⚠️ ESPERA: ${desafio.nome}`);
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
      // TECLA I (Iniciar)
      if (
        e.code === "KeyI" &&
        window.estadoJogo.status === window.GAME_STATUS.ESPERA
      ) {
        // [NOVO] Força o fechamento do Menu F (Placar) se estiver aberto
        const placarEl = document.getElementById("placar-principal");
        if (placarEl && placarEl.components["menu-placar"]) {
          placarEl.components["menu-placar"].fecharMenuTotal();
        }

        this._setarTeclaT(true);
        this._toggleResetUI(false);
        this._togglePrompts(true, true);

        // Lógica da Mira Global
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
          console.log("🚀 VAI! Jogo Iniciado.");
          this._atualizarEstado(window.GAME_STATUS.ATIVO);
          this.desafioSelecionado.iniciar(this._configUsarTimer);
        });
      }

      // TECLA O (Sair)
      if (e.code === "KeyO") {
        const overlay = document.getElementById("countdown-overlay");
        if (overlay) overlay.classList.add("oculto");
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
      this._togglePrompts(false);
      this._toggleInfo(false); // Esconde info ao sair

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
