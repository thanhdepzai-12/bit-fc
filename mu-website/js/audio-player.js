document.addEventListener("DOMContentLoaded", () => {
  // Determine if we are at the root level (index.html) or inside a subdirectory (pages/*)
  const isRoot = window.location.pathname.endsWith("index.html") || window.location.pathname.endsWith("Login.html") || window.location.pathname === "/" || !window.location.pathname.includes("/pages/");
  
  // Mute button logic
  let muteBtn = document.getElementById("mute-btn");
  if (!muteBtn) {
    muteBtn = document.createElement("button");
    muteBtn.id = "mute-btn";
    muteBtn.setAttribute("aria-label", "Bật/Tắt nhạc");
    
    // Default styling just in case style.css is not fully loaded or missing
    muteBtn.style.position = "fixed";
    muteBtn.style.bottom = "30px";
    muteBtn.style.left = "30px";
    muteBtn.style.zIndex = "999";
    muteBtn.style.width = "48px";
    muteBtn.style.height = "48px";
    muteBtn.style.borderRadius = "50%";
    muteBtn.style.background = "rgba(0, 0, 0, 0.6)";
    muteBtn.style.border = "1px solid rgba(255, 255, 255, 0.2)";
    muteBtn.style.color = "#fff";
    muteBtn.style.display = "flex";
    muteBtn.style.alignItems = "center";
    muteBtn.style.justifyContent = "center";
    muteBtn.style.fontSize = "1.2rem";
    muteBtn.style.cursor = "pointer";
    muteBtn.style.transition = "all 0.3s ease";
    
    // Insert into body
    document.body.appendChild(muteBtn);
  }

  // Audio element logic
  let audio = document.getElementById("global-bg-music");
  if (!audio) {
    audio = document.createElement("audio");
    audio.id = "global-bg-music";
    audio.loop = true;
    audio.preload = "auto";
    
    // Set the audio source to the file provided by the user
    const audioPath = isRoot ? "assessts/background-music.mp3?v=2" : "../assessts/background-music.mp3?v=2";
    audio.src = audioPath;
    
    document.body.appendChild(audio);
  }

  // Restore state from localStorage
  const savedTime = localStorage.getItem("bg_music_time");
  // Default to true (MUTED) on the very first visit
  const isMuted = localStorage.getItem("bg_music_muted") !== "false"; 

  audio.muted = isMuted;
  muteBtn.innerHTML = isMuted ? "🔇" : "🔊";

  if (savedTime && !isNaN(parseFloat(savedTime))) {
    audio.currentTime = parseFloat(savedTime);
  }

  // Muted audio is almost always allowed to autoplay by browsers
  audio.play().catch((e) => {
    console.log("Autoplay blocked by browser even when muted.", e);
  });

  // Handle mute/unmute
  muteBtn.addEventListener("click", (e) => {
    e.stopPropagation(); 
    audio.muted = !audio.muted;
    localStorage.setItem("bg_music_muted", audio.muted);
    
    if (audio.muted) {
      muteBtn.innerHTML = "🔇";
    } else {
      muteBtn.innerHTML = "🔊";
      // Ensure it is playing when unmuted
      if (audio.paused) {
        audio.play().catch(console.error);
      }
    }
  });

  // Save state before navigating away
  window.addEventListener("beforeunload", () => {
    localStorage.setItem("bg_music_time", audio.currentTime);
  });
});
