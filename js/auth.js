/* ========================================================
   MOCK AUTHENTICATION & LOCAL LEADERBOARD STORAGE
   ======================================================== */

let currentUser = null;

/**
 * Initialize cached session check on script execution
 */
function initAuth() {
  const cachedUser = localStorage.getItem('veriface_mock_user');
  if (cachedUser) {
    currentUser = JSON.parse(cachedUser);
    updateAuthUI(true);
  } else {
    updateAuthUI(false);
  }
}

/**
 * Simulate Google Login
 */
function loginWithGoogle() {
  currentUser = {
    uid: 'mock_user_123',
    displayName: 'Demo Expert',
    email: 'expert@veriface.ai',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
  };

  localStorage.setItem('veriface_mock_user', JSON.stringify(currentUser));
  updateAuthUI(true);
  loadUserStats();
}

/**
 * Simulate Logout
 */
function logoutUser() {
  currentUser = null;
  localStorage.removeItem('veriface_mock_user');
  updateAuthUI(false);
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

// ATTACH TO GLOBAL WINDOW SCOPE FOR HTML ONCLICK HANDLERS
window.loginWithGoogle = loginWithGoogle;
window.logoutUser = logoutUser;
window.saveQuizAttempt = saveQuizAttempt;
window.loadGlobalLeaderboard = loadGlobalLeaderboard;

// Run session check on load
document.addEventListener('DOMContentLoaded', initAuth);