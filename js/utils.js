window.addEventListener("contextmenu", (e) => e.preventDefault(), false);

document.addEventListener("fullscreenchange", () => {
  const txtFullscreen = document.getElementById("txt-fullscreen");
  
  if (txtFullscreen) {
    if (document.fullscreenElement) {
      txtFullscreen.innerText = "SAIR TELA CHEIA";
    } else {
      txtFullscreen.innerText = "TELA CHEIA";
    }
  }
});

window.addEventListener("keydown", (e) => {
  if (e.code === "F11") {
    e.preventDefault();

    if (!document.fullscreenElement) {
      document.body.requestFullscreen().catch((err) => {
        console.warn("Erro ao tentar tela cheia:", err);
      });
    } else {
      document.exitFullscreen();
    }
  }

  if (e.code === "Escape") {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }
});