/* ========================================================
   AUTHENTICATION & LOCAL STORAGE (FIREBASE OAUTH)
   ======================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// 1. YOUR FIREBASE CONFIGURATION (Paste your config from Step 1 here)
const firebaseConfig = {
  apiKey: "AIzaSyDA8mYm7gKRK-Geouey7BglXWVo2I-EVbs",
  authDomain: "veriface-ai.firebaseapp.com",
  projectId: "veriface-ai",
  storageBucket: "veriface-ai.firebasestorage.app",
  messagingSenderId: "540521994574",
  appId: "1:540521994574:web:f3b0da48a3d2d73e74e61f",
  measurementId: "G-E27H1ZCN27"
};

// 2. INITIALIZE FIREBASE & AUTH
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

let currentUser = null;

/**
 * Listen for Auth state change (Handles session persistence automatically)
 */
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = {
      uid: user.uid,
      displayName: user.displayName || 'Anonymous User',
      email: user.email || '',
      photoURL: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
    };
    updateAuthUI(true);
  } else {
    currentUser = null;
    updateAuthUI(false);
  }
});

/**
 * Sign in with Google Pop-up
 */
async function loginWithGoogle() {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Error signing in with Google:", error);
    alert(`Authentication failed: ${error.message}`);
  }
}

/**
 * Sign Out User
 */
async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out:", error);
  }
}

/**
 * Update Header UI based on login state
 */
function updateAuthUI(isLoggedIn) {
  const loggedOutBox = document.getElementById('auth-logged-out');
  const loggedInBox = document.getElementById('auth-logged-in');

  if (isLoggedIn && currentUser) {
    if (loggedOutBox) loggedOutBox.classList.add('hidden');
    if (loggedInBox) loggedInBox.classList.remove('hidden');

    const avatar = document.getElementById('user-avatar');
    const name = document.getElementById('user-display-name');
    const email = document.getElementById('user-email');

    if (avatar) avatar.src = currentUser.photoURL;
    if (name) name.textContent = currentUser.displayName;
    if (email) email.textContent = currentUser.email;

    loadUserStats();
  } else {
    if (loggedOutBox) loggedOutBox.classList.remove('hidden');
    if (loggedInBox) loggedInBox.classList.add('hidden');
  }
}

/**
 * Save Quiz Attempt to LocalStorage & Mock Leaderboard
 */
function saveQuizAttempt(score, total, percentage) {
  let history = JSON.parse(localStorage.getItem('veriface_quiz_history') || '[]');
  
  const attemptRecord = {
    uid: currentUser ? currentUser.uid : 'guest',
    displayName: currentUser ? currentUser.displayName : 'Guest User',
    photoURL: currentUser ? currentUser.photoURL : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    score: score,
    total: total,
    percentage: percentage,
    timestamp: new Date().toISOString()
  };

  history.push(attemptRecord);
  localStorage.setItem('veriface_quiz_history', JSON.stringify(history));

  const bestScore = Math.max(...history.map(h => h.score));
  localStorage.setItem('veriface_best_score', bestScore);
  localStorage.setItem('veriface_attempts_count', history.length);

  loadUserStats();
  loadGlobalLeaderboard();
}

/**
 * Load Global Leaderboard from LocalStorage
 */
function loadGlobalLeaderboard() {
  const leaderboardBody = document.getElementById('leaderboard-table-body');
  if (!leaderboardBody) return;

  let history = JSON.parse(localStorage.getItem('veriface_quiz_history') || '[]');

  if (history.length === 0) {
    history = [
      { displayName: 'Alex Rivera', photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', score: 20, total: 20, percentage: 100, timestamp: new Date().toISOString() },
      { displayName: 'Dr. Marcus Vance', photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', score: 19, total: 20, percentage: 95, timestamp: new Date().toISOString() },
      { displayName: 'Elena Rostova', photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80', score: 18, total: 20, percentage: 90, timestamp: new Date().toISOString() }
    ];
  }

  history.sort((a, b) => b.score - a.score);

  let html = '';
  let rank = 1;

  history.slice(0, 10).forEach((data) => {
    const dateStr = new Date(data.timestamp).toLocaleDateString();
    html += `
      <tr class="hover:bg-slate-50 border-b border-slate-100">
        <td class="py-3 px-4 font-bold text-indigo-600">#${rank}</td>
        <td class="py-3 px-4 flex items-center gap-3">
          <img src="${data.photoURL}" class="w-7 h-7 rounded-full object-cover border">
          <span class="font-semibold text-slate-800">${data.displayName}</span>
        </td>
        <td class="py-3 px-4 font-extrabold text-slate-900">${data.score} / ${data.total}</td>
        <td class="py-3 px-4"><span class="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-xs">${data.percentage}%</span></td>
        <td class="py-3 px-4 text-xs text-slate-400">${dateStr}</td>
      </tr>
    `;
    rank++;
  });

  leaderboardBody.innerHTML = html;
}

/**
 * Load user stats for dashboard
 */
function loadUserStats() {
  const attempts = localStorage.getItem('veriface_attempts_count') || '0';
  const best = localStorage.getItem('veriface_best_score') || '0';
  const bestPercent = Math.round((parseInt(best) / 20) * 100);

  if (document.getElementById('stat-total-attempts')) {
    document.getElementById('stat-total-attempts').textContent = attempts;
  }
  if (document.getElementById('stat-best-score')) {
    document.getElementById('stat-best-score').textContent = `${bestPercent}%`;
  }
}

// ATTACH TO WINDOW SCOPE FOR HTML ONCLICK HANDLERS
window.loginWithGoogle = loginWithGoogle;
window.logoutUser = logoutUser;
window.saveQuizAttempt = saveQuizAttempt;
window.loadGlobalLeaderboard = loadGlobalLeaderboard;