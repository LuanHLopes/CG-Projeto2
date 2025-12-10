AFRAME.registerComponent("tela-loading", {
  init: function () {
    const scene = this.el;
    const tela = document.getElementById("tela-loading");
    const statusBox = document.getElementById("loading-status");
    const txt = document.getElementById("loading-text");
    const btn = document.getElementById("btn-iniciar");

    // Função para simular passos de carregamento
    const iniciarSequencia = () => {
      // Passo 1: Texto Inicial já está no HTML

      // Passo 2: 1.5s depois
      setTimeout(() => {
        txt.innerText = "CARREGANDO ASSETS...";
      }, 1500);

      // Passo 3: 3.0s depois
      setTimeout(() => {
        txt.innerText = "INICIALIZANDO...";
      }, 3000);

      // Passo 4: 4.0s - Libera o botão
      setTimeout(() => {
        statusBox.style.display = "none"; // Esconde spinner e texto
        btn.style.display = "block"; // Mostra botão
      }, 4000);
    };

    // Evento de Clique no Botão
    btn.addEventListener("click", () => {
      tela.classList.add("esconder");
      // Remove do DOM após a animação de fade-out (0.8s no CSS)
      setTimeout(() => {
        tela.style.display = "none";
      }, 800);
    });

    // Aguarda o A-Frame carregar a cena
    if (scene.hasLoaded) {
      iniciarSequencia();
    } else {
      scene.addEventListener("loaded", iniciarSequencia);
    }
  },
});
