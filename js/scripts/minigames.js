/* MINIGAMES.JS
  Gerenciador de Desafios e Regras
  Integrado com Placar e Cronômetro
*/

const Desafios = {
  street21: {
    id: "street21",
    enumMode: window.GAME_MODE.STREET_21,
    nome: "Street 21",
    descricao: "Faça 21 pontos exatos.",
    iniciar: function () {
      console.log(`🏀 [LÓGICA] Iniciando loop do ${this.nome}...`);
      return this.nome;
    },
    parar: function () {
      console.log(`🛑 [LÓGICA] Parando loop do ${this.nome}...`);
    },
  },

  voltaAoMundo: {
    id: "voltaAoMundo",
    enumMode: window.GAME_MODE.VOLTA_AO_MUNDO,
    nome: "Volta ao Mundo",
    descricao: "Acerte cestas de 5 posições.",
    iniciar: function () {
      console.log(`🌍 [LÓGICA] Iniciando loop do ${this.nome}...`);
      return this.nome;
    },
    parar: function () {
      console.log(`🛑 [LÓGICA] Parando loop do ${this.nome}...`);
    },
  },

  onFire: {
    id: "onFire",
    enumMode: window.GAME_MODE.ON_FIRE,
    nome: "On Fire",
    descricao: "Modo Arcade 60s.",
    iniciar: function () {
      console.log(`🔥 [LÓGICA] Iniciando loop do ${this.nome}...`);
      return this.nome;
    },
    parar: function () {
      console.log(`🛑 [LÓGICA] Parando loop do ${this.nome}...`);
    },
  },
};

const Minigames = {
  desafioSelecionado: null,
  _listenerTeclas: null,

  _atualizarEstado: function (novoStatus, novoModo = null) {
    window.estadoJogo.status = novoStatus;
    if (novoModo) window.estadoJogo.modo = novoModo;

    console.log(
      `🔄 ESTADO: ${window.estadoJogo.modo} | ${window.estadoJogo.status}`
    );
  },

  _setarTeclaT: function (permitido) {
    const bola = document.getElementById("bola");
    if (bola && bola.components["mecanica-arremesso"]) {
      bola.components["mecanica-arremesso"].podeUsarT = permitido;
    }

    const btnT = document.getElementById("btn-t");
    if (btnT) {
      const linhaMenu = btnT.closest(".control-row");
      if (linhaMenu) linhaMenu.style.display = permitido ? "flex" : "none";
    }
  },

  // [NOVO] Limpa Placar e Timer ao preparar o jogo
  _limparAmbiente: function () {
    // Zera o Cronômetro (função do timer.js)
    if (typeof window.zerarCronometro === "function") {
      window.zerarCronometro();
    }

    // Zera o Placar (nova função global do placar.js)
    if (typeof window.resetarPlacar === "function") {
      window.resetarPlacar();
    }
  },

  listar: function () {
    console.table(
      Object.values(Desafios).map((d) => ({
        ID: d.id,
        Nome: d.nome,
        Modo: d.enumMode,
      }))
    );
    return "Use Minigames.iniciar('id')";
  },

  iniciar: function (idDesafio) {
    if (window.estadoJogo.status !== window.GAME_STATUS.DESATIVADO) {
      this.pararTotal();
    }

    const desafio = Desafios[idDesafio];

    if (desafio) {
      this.desafioSelecionado = desafio;

      // 1. Prepara o Ambiente (Zera tudo)
      this._limparAmbiente();

      // 2. Atualiza Estado
      this._atualizarEstado(window.GAME_STATUS.ESPERA, desafio.enumMode);
      this._setarTeclaT(false);
      this._configurarControles();

      console.log(`⚠️ PREPARADO: ${desafio.nome}`);
      console.log(`👉 Pressione "I" para INICIAR.`);
      console.log(`👉 Pressione "O" para CANCELAR.`);

      return `Aguardando start...`;
    } else {
      console.error(`❌ Desafio '${idDesafio}' não encontrado.`);
      return null;
    }
  },

  _configurarControles: function () {
    if (this._listenerTeclas) {
      window.removeEventListener("keydown", this._listenerTeclas);
    }

    this._listenerTeclas = (e) => {
      if (
        e.code === "KeyI" &&
        window.estadoJogo.status === window.GAME_STATUS.ESPERA
      ) {
        this._atualizarEstado(window.GAME_STATUS.ATIVO);
        this.desafioSelecionado.iniciar();
      }

      if (e.code === "KeyO") {
        this.pararTotal();
      }
    };

    window.addEventListener("keydown", this._listenerTeclas);
  },

  pararTotal: function () {
    if (this.desafioSelecionado) {
      if (window.estadoJogo.status === window.GAME_STATUS.ATIVO) {
        this.desafioSelecionado.parar();
      }

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