AFRAME.registerComponent("tela-loading", {
  init: function () {
    const scene = this.el;
    const telaLoading = document.getElementById("tela-loading");
    const btnJogar = document.getElementById("btn-iniciar-jogo");

    const finalizarCarregamento = () => {
      setTimeout(() => {
        telaLoading.classList.add("esconder");
        
        setTimeout(() => {
          telaLoading.style.display = "none";
        }, 1000);
      }, 1500); 
    };

    if (scene.hasLoaded) {
      finalizarCarregamento();
    } else {
      scene.addEventListener("loaded", finalizarCarregamento);
    }
  },
});