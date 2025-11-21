window.addEventListener("contextmenu", (e) => e.preventDefault(), false);

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