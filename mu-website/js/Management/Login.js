/**
 * Login.js
 * Nối DOM (Login.html) ↔ AuthenticationController.js ↔ Firebase
 *
 * Import cách dùng:
 *   <script type="module" src="../../js/Management/Login.js"></script>
 */

import {
  loginWithEmail,
  loginWithGoogle,
  loginWithFacebook,
  resetPassword,
  onAuthChange,
} from "../../controllers/AuthenticationController.js";

// ─── CONFIG ──────────────────────────────────────────────
const DEFAULT_REDIRECT = "/mu-website/pages/Management/dashboard.html";

// ─── DOM REFS ────────────────────────────────────────────
const emailInput    = document.getElementById("input-email");
const passwordInput = document.getElementById("input-password");
const eyeToggle     = document.getElementById("eye-toggle");
const eyeIcon       = document.getElementById("eye-icon");
const rememberWrap  = document.getElementById("remember-wrap");
const chkBox        = document.getElementById("chk-box");
const loginBtn      = document.getElementById("login-btn");
const googleBtn     = document.getElementById("google-btn");
const facebookBtn   = document.getElementById("facebook-btn");
const forgotBtn     = document.getElementById("forgot-btn");
const errorBanner   = document.getElementById("error-banner");

// ─── STATE ───────────────────────────────────────────────
let rememberMe = false;

// ─── REDIRECT HELPER — hỗ trợ returnUrl ─────────────────
function getRedirectUrl() {
  const params = new URLSearchParams(window.location.search);
  const returnUrl = params.get("returnUrl");
  // Chỉ chấp nhận relative URL (tránh open redirect attack)
  if (returnUrl && returnUrl.startsWith("/")) {
    return decodeURIComponent(returnUrl);
  }
  return DEFAULT_REDIRECT;
}

function onSuccess(user) {
  console.log("Đăng nhập thành công:", user.email);
  window.location.href = getRedirectUrl();
}

// ─── HELPERS ─────────────────────────────────────────────
function showError(msg, isSuccess = false) {
  errorBanner.removeAttribute("style");
  if (isSuccess) {
    errorBanner.style.borderLeftColor = "#4ade80";
    errorBanner.style.color           = "#4ade80";
    errorBanner.style.background      = "rgba(74,222,128,.08)";
  }
  errorBanner.textContent = msg;
  errorBanner.classList.add("visible");
}

function clearError() {
  errorBanner.textContent = "";
  errorBanner.classList.remove("visible");
  errorBanner.removeAttribute("style");
}

function setLoading(loading) {
  loginBtn.disabled    = loading;
  googleBtn.disabled   = loading;
  facebookBtn.disabled = loading;
  loginBtn.innerHTML   = loading
    ? '<span class="btn-spinner"></span>Đang xác thực...'
    : "Vào sân &nbsp;→";
}

// ─── VALIDATE ────────────────────────────────────────────
function validate() {
  const email = emailInput.value.trim();
  const pass  = passwordInput.value;

  if (!email) {
    showError("Vui lòng nhập email.");
    emailInput.focus();
    return false;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError("Email không đúng định dạng.");
    emailInput.focus();
    return false;
  }
  if (!pass) {
    showError("Vui lòng nhập mật khẩu.");
    passwordInput.focus();
    return false;
  }
  if (pass.length < 6) {
    showError("Mật khẩu phải có ít nhất 6 ký tự.");
    passwordInput.focus();
    return false;
  }
  return true;
}

// ─── ĐĂNG NHẬP EMAIL ─────────────────────────────────────
loginBtn.addEventListener("click", async () => {
  clearError();
  if (!validate()) return;

  setLoading(true);
  const { user, error } = await loginWithEmail(
    emailInput.value.trim(),
    passwordInput.value,
    rememberMe
  );
  setLoading(false);

  if (error) { showError(error); return; }
  onSuccess(user);
});

// Enter key trigger
[emailInput, passwordInput].forEach((el) => {
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter") loginBtn.click();
  });
});

// ─── ĐĂNG NHẬP GOOGLE ────────────────────────────────────
googleBtn.addEventListener("click", async () => {
  clearError();
  setLoading(true);
  const { user, error } = await loginWithGoogle();
  setLoading(false);

  if (error) { showError(error); return; }
  onSuccess(user);
});

// ─── ĐĂNG NHẬP FACEBOOK ──────────────────────────────────
facebookBtn.addEventListener("click", async () => {
  clearError();
  setLoading(true);
  const { user, error } = await loginWithFacebook();
  setLoading(false);

  if (error) { showError(error); return; }
  onSuccess(user);
});

// ─── QUÊN MẬT KHẨU ───────────────────────────────────────
forgotBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  clearError();

  const email = emailInput.value.trim();
  if (!email) {
    showError("Nhập email ở trên rồi nhấn 'Quên mật khẩu?' để đặt lại.");
    emailInput.focus();
    return;
  }

  const { success, error } = await resetPassword(email);
  if (error) { showError(error); return; }

  showError("Email đặt lại mật khẩu đã được gửi. Kiểm tra hộp thư nhé!", true);
  setTimeout(clearError, 5000);
});

// ─── TOGGLE REMEMBER ME ──────────────────────────────────
rememberWrap.addEventListener("click", () => {
  rememberMe = !rememberMe;
  chkBox.classList.toggle("checked", rememberMe);
});

// ─── TOGGLE SHOW/HIDE PASSWORD ───────────────────────────
eyeToggle.addEventListener("click", () => {
  const isHidden       = passwordInput.type === "password";
  passwordInput.type   = isHidden ? "text" : "password";
  eyeIcon.className    = isHidden ? "ti ti-eye-off" : "ti ti-eye";
});

// ─── AUTH OBSERVER — nếu đã đăng nhập thì redirect luôn ──
const unsubscribe = onAuthChange((user) => {
  if (user) {
    unsubscribe(); // dừng observer sau khi đã redirect
    window.location.href = getRedirectUrl();
  }
});