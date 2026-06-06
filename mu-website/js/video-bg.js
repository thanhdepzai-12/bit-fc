document.addEventListener("DOMContentLoaded", () => {
  const muteBtn = document.getElementById("mute-btn");
  const bgVideo = document.getElementById("bg-video");

  if (muteBtn && bgVideo) {
    // Nếu video không autoplay được thì cố gắng play
    bgVideo.play().catch(e => {
      console.log("Autoplay blocked by browser", e);
    });

    muteBtn.addEventListener("click", () => {
      bgVideo.muted = !bgVideo.muted;
      if (bgVideo.muted) {
        muteBtn.textContent = "🔇";
        muteBtn.setAttribute("aria-label", "Bật âm thanh");
      } else {
        muteBtn.textContent = "🔊";
        muteBtn.setAttribute("aria-label", "Tắt âm thanh");
      }
    });
  }
});
