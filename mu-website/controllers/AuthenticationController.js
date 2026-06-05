import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { auth, db } from "../firebaseConfig.js";

// ─── PROVIDERS ───────────────────────────────────────────
const googleProvider   = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// ─── ERROR MESSAGE (Tiếng Việt) ──────────────────────────
const ERROR_MAP = {
  "auth/invalid-email":          "Email không hợp lệ.",
  "auth/user-disabled":          "Tài khoản đã bị vô hiệu hoá.",
  "auth/user-not-found":         "Không tìm thấy tài khoản này.",
  "auth/wrong-password":         "Sai mật khẩu, thử lại nhé.",
  "auth/invalid-credential":     "Thông tin đăng nhập không đúng.",
  "auth/too-many-requests":      "Quá nhiều lần thử. Vui lòng thử lại sau.",
  "auth/network-request-failed": "Lỗi mạng. Kiểm tra kết nối internet.",
  "auth/popup-closed-by-user":   "Bạn đã đóng cửa sổ đăng nhập.",
  "auth/account-exists-with-different-credential":
    "Email đã được dùng với phương thức đăng nhập khác.",
};

function getErrorMessage(code) {
  return ERROR_MAP[code] || "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

// ─── LƯU / CẬP NHẬT USER VÀO FIRESTORE ──────────────────
async function upsertUserRecord(firebaseUser) {
  const ref  = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      uid:         firebaseUser.uid,
      email:       firebaseUser.email,
      displayName: firebaseUser.displayName ?? "",
      photoURL:    firebaseUser.photoURL    ?? "",
      role:        "member",
      createdAt:   serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  } else {
    await setDoc(ref, { lastLoginAt: serverTimestamp() }, { merge: true });
  }

  const updated = await getDoc(ref);
  return updated.data();
}

// ─── ĐĂNG NHẬP EMAIL / PASSWORD ──────────────────────────
/**
 * @param {string}  email
 * @param {string}  password
 * @param {boolean} rememberMe  — true → giữ session, false → xoá khi đóng tab
 * @returns {{ user, profile } | { error: string }}
 */
export async function loginWithEmail(email, password, rememberMe = false) {
  try {
    await setPersistence(
      auth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence
    );

    const cred    = await signInWithEmailAndPassword(auth, email, password);
    const profile = await upsertUserRecord(cred.user);
    return { user: cred.user, profile };
  } catch (err) {
    return { error: getErrorMessage(err.code) };
  }
}

// ─── ĐĂNG NHẬP GOOGLE ────────────────────────────────────
export async function loginWithGoogle() {
  try {
    const cred    = await signInWithPopup(auth, googleProvider);
    const profile = await upsertUserRecord(cred.user);
    return { user: cred.user, profile };
  } catch (err) {
    return { error: getErrorMessage(err.code) };
  }
}

// ─── ĐĂNG NHẬP FACEBOOK ──────────────────────────────────
export async function loginWithFacebook() {
  try {
    const cred    = await signInWithPopup(auth, facebookProvider);
    const profile = await upsertUserRecord(cred.user);
    return { user: cred.user, profile };
  } catch (err) {
    return { error: getErrorMessage(err.code) };
  }
}

// ─── ĐĂNG XUẤT ───────────────────────────────────────────
export async function logout() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (err) {
    return { error: getErrorMessage(err.code) };
  }
}

// ─── QUÊN MẬT KHẨU ───────────────────────────────────────
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (err) {
    return { error: getErrorMessage(err.code) };
  }
}

// ─── THEO DÕI TRẠNG THÁI AUTH (observer) ─────────────────
/**
 * Gọi callback mỗi khi trạng thái đăng nhập thay đổi.
 * @param {(user: import("firebase/auth").User | null) => void} callback
 * @returns unsubscribe function
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ─── LẤY USER HIỆN TẠI ───────────────────────────────────
export function getCurrentUser() {
  return auth.currentUser;
}