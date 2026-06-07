document.addEventListener("DOMContentLoaded", () => {
  const bgVideo = document.getElementById("bg-video");

  if (bgVideo) {
    // Nếu video không autoplay được thì cố gắng play
    bgVideo.play().catch(e => {
      console.log("Autoplay blocked by browser", e);
    });
  }
});
