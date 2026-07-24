/* ========================================================
   AUTHENTICATION & FIRESTORE DATABASE + CHART INTEGRATION
   ======================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  addDoc,
  increment,
  arrayUnion,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyDA8mYm7gKRK-Geouey7BglXWVo2I-EVbs",
  authDomain: "veriface-ai.firebaseapp.com",
  projectId: "veriface-ai",
  storageBucket: "veriface-ai.firebasestorage.app",
  messagingSenderId: "540521994574",
  appId: "1:540521994574:web:f3b0da48a3d2d73e74e61f",
  measurementId: "G-E27H1ZCN27"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

let currentUser = null;
let currentUsername = null;
let userChartInstance = null;

/**
 * Handle Safari / Mobile Redirect completion
 */
getRedirectResult(auth)
  .then((result) => {
    if (result && result.user) {
      handleUserLogin(result.user);
    }
  })
  .catch((error) => console.error("Redirect Sign-in error:", error));

/**
 * Auth state change listener
 */
onAuthStateChanged(auth, async (user) => {
  const loggedOutUI = document.getElementById("auth-logged-out");
  const loggedInUI = document.getElementById("auth-logged-in");
  const overlay = document.getElementById("chart-logged-out-overlay");

  if (user) {
    currentUser = user;
    if (loggedOutUI) loggedOutUI.classList.add("hidden");
    if (loggedInUI) loggedInUI.classList.remove("hidden");
    if (overlay) overlay.classList.add("hidden");

    await handleUserLogin(user);
  } else {
    currentUser = null;
    currentUsername = null;
    if (loggedOutUI) loggedOutUI.classList.remove("hidden");
    if (loggedInUI) loggedInUI.classList.add("hidden");
    if (overlay) overlay.classList.remove("hidden");

    const statAttempts = document.getElementById("stat-total-attempts");
    const statBest = document.getElementById("stat-best-score");
    if (statAttempts) statAttempts.textContent = "—";
    if (statBest) statBest.textContent = "—";

    renderDemoChart();
  }

  loadGlobalLeaderboard();
});

/**
 * Manages user profile & unique username prompting
 */
async function handleUserLogin(user) {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists() && snap.data().username) {
    // User already exists and has a unique username
    currentUsername = snap.data().username;
    updateUserProfileUI(snap.data().username, user.photoURL, user.email);
    await loadUserStats();
  } else {
    // First time user or missing username: prompt modal
    showUsernameModal(user);
  }
}

/**
 * Displays Username Selection Modal
 */
function showUsernameModal(user) {
  const modal = document.getElementById("username-modal");
  if (modal) modal.classList.remove("hidden");
}

/**
 * Saves and validates unique username in Firestore
 */
window.submitUsernameSelection = async function() {
  const input = document.getElementById("username-input");
  const errorEl = document.getElementById("username-error");

  if (!input || !errorEl || !currentUser) return;

  const rawUsername = input.value.trim();
  const sanitizedUsername = rawUsername.toLowerCase().replace(/[^a-z0-9_]/g, '');

  if (sanitizedUsername.length < 3 || sanitizedUsername.length > 20) {
    errorEl.textContent = "Username must be between 3 and 20 alphanumeric characters.";
    errorEl.classList.remove("hidden");
    return;
  }

  try {
    // 1. Check if username is already taken in 'usernames' collection
    const usernameRef = doc(db, "usernames", sanitizedUsername);
    const usernameSnap = await getDoc(usernameRef);

    if (usernameSnap.exists()) {
      errorEl.textContent = "This username is already taken";
      errorEl.classList.remove("hidden");
      return;
    }

    // 2. Claim username in 'usernames' collection
    await setDoc(usernameRef, { uid: currentUser.uid });

    // 3. Save user doc with selected username
    const userRef = doc(db, "users", currentUser.uid);
    await setDoc(userRef, {
      uid: currentUser.uid,
      username: sanitizedUsername,
      displayName: currentUser.displayName || sanitizedUsername,
      email: currentUser.email || "",
      photoURL: currentUser.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
      bestScore: 0,
      bestPercentage: 0,
      totalAttempts: 0,
      mistakenImageIds: [],
      createdAt: serverTimestamp()
    }, { merge: true });

    currentUsername = sanitizedUsername;
    errorEl.classList.add("hidden");
    
    const modal = document.getElementById("username-modal");
    if (modal) modal.classList.add("hidden");

    updateUserProfileUI(sanitizedUsername, currentUser.photoURL, currentUser.email);
    await loadUserStats();

  } catch (err) {
    console.error("Error setting username:", err);
    errorEl.textContent = "Failed to reserve username. Please try again.";
    errorEl.classList.remove("hidden");
  }
};

/**
 * Updates UI with current account information
 */
function updateUserProfileUI(username, photoURL, email) {
  const avatar = document.getElementById("user-avatar");
  const name = document.getElementById("user-display-name");
  const emailEl = document.getElementById("user-email");

  if (avatar) avatar.src = photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80";
  if (name) name.textContent = `@${username}`;
  if (emailEl) emailEl.textContent = email || "";
}

/**
 * Google Sign In Handler
 */
window.loginWithGoogle = async function() {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  if (isSafari || isIOS) {
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      alert(`Authentication failed: ${error.message}`);
    }
    return;
  }

  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    if (['auth/popup-blocked', 'auth/popup-closed-by-user'].includes(error.code)) {
      await signInWithRedirect(auth, googleProvider);
    } else {
      console.error("Authentication error:", error);
    }
  }
};

/**
 * Logout User
 */
window.logoutUser = async function() {
  try {
    await signOut(auth);
    const menu = document.getElementById("user-menu");
    if (menu) menu.classList.add("hidden");
  } catch (error) {
    console.error("Sign out error:", error);
  }
};

/**
 * Toggle Settings Dropdown Menu
 */
window.toggleUserMenu = function() {
  const menu = document.getElementById("user-menu");
  if (menu) menu.classList.toggle("hidden");
};

// Close dropdown on outside clicks
window.addEventListener("click", (e) => {
  const menu = document.getElementById("user-menu");
  const avatarBtn = document.getElementById("user-avatar-btn");
  if (menu && avatarBtn && !avatarBtn.contains(e.target) && !menu.contains(e.target)) {
    menu.classList.add("hidden");
  }
});

/**
 * Save Quiz Attempt to Firestore bound to user's UNIQUE USERNAME
 */
export async function saveQuizAttempt(score, total, percentage, mistakenIds = []) {
  if (!currentUsername) {
    console.warn("Attempt saved as guest: No username bound.");
  }

  const attemptData = {
    uid: currentUser ? currentUser.uid : "guest",
    username: currentUsername || "guest",
    displayName: currentUsername ? `@${currentUsername}` : "Guest User",
    photoURL: currentUser ? currentUser.photoURL : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
    score: score,
    total: total,
    percentage: percentage,
    mistakenIds: mistakenIds,
    timestamp: new Date().toISOString()
  };

  try {
    await addDoc(collection(db, "quiz_attempts"), attemptData);

    if (currentUser && currentUsername) {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const newBestScore = Math.max(userData.bestScore || 0, score);
        const newBestPercent = Math.max(userData.bestPercentage || 0, percentage);

        await updateDoc(userRef, {
          totalAttempts: increment(1),
          bestScore: newBestScore,
          bestPercentage: newBestPercent,
          mistakenImageIds: arrayUnion(...mistakenIds)
        });
      }
    }

    await loadUserStats();
    await loadGlobalLeaderboard();
  } catch (err) {
    console.error("Error saving quiz attempt:", err);
  }
}

/**
 * Load User Dashboard Stats from Cloud Firestore
 */
async function loadUserStats() {
  if (!currentUser) return;

  try {
    const userRef = doc(db, "users", currentUser.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data();
      const attemptsEl = document.getElementById("stat-total-attempts");
      const bestEl = document.getElementById("stat-best-score");

      if (attemptsEl) attemptsEl.textContent = data.totalAttempts || 0;
      if (bestEl) bestEl.textContent = `${data.bestPercentage || 0}%`;
    }

    await loadUserPerformanceChart();
  } catch (error) {
    console.error("Error fetching user stats:", error);
  }
}

/**
 * Fetch and Render Performance Chart from Firestore BY USERNAME
 * Queries quiz_attempts collection where username == currentUsername
 */
async function loadUserPerformanceChart() {
  const canvas = document.getElementById("user-performance-chart") || document.getElementById("performanceChart");
  const overlay = document.getElementById("chart-logged-out-overlay");

  if (!canvas || !currentUsername) return;
  if (overlay) overlay.classList.add("hidden");

  try {
    const attemptsRef = collection(db, "quiz_attempts");
    // Search specifically for attempts matching the distinct username
    const q = query(
      attemptsRef, 
      where("username", "==", currentUsername), 
      orderBy("timestamp", "asc")
    );

    const querySnapshot = await getDocs(q);
    const labels = [];
    const scores = [];

    let attemptNum = 1;
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      labels.push(`Attempt ${attemptNum}`);
      scores.push(data.percentage);
      attemptNum++;
    });

    renderChartInstance(
      canvas,
      labels.length > 0 ? labels : ["Attempt 1"], 
      scores.length > 0 ? scores : [0]
    );
  } catch (error) {
    console.error("Error loading performance chart by username:", error);
  }
}

/**
 * Render Demo Chart when logged out
 */
function renderDemoChart() {
  const canvas = document.getElementById("user-performance-chart") || document.getElementById("performanceChart");
  const overlay = document.getElementById("chart-logged-out-overlay");
  if (overlay) overlay.classList.remove("hidden");

  const demoLabels = ['Attempt 1', 'Attempt 2', 'Attempt 3', 'Attempt 4', 'Attempt 5'];
  const demoScores = [45, 60, 75, 80, 90];

  if (canvas) {
    renderChartInstance(canvas, demoLabels, demoScores);
  }
}

/**
 * Universal Chart.js Renderer
 */
function renderChartInstance(canvas, labels, scores) {
  if (!canvas || typeof Chart === "undefined") return;

  if (userChartInstance) {
    userChartInstance.destroy();
  }

  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, "rgba(79, 70, 229, 0.35)");
  gradient.addColorStop(1, "rgba(79, 70, 229, 0.0)");

  userChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Accuracy Score (%)",
        data: scores,
        borderColor: "#4f46e5",
        borderWidth: 3,
        backgroundColor: gradient,
        fill: true,
        tension: 0.35,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: "#4f46e5",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `Accuracy: ${context.parsed.y}%`
          }
        }
      },
      scales: {
        x: { 
          grid: { display: false },
          title: { display: true, text: 'Quiz Attempts' }
        },
        y: {
          min: 0,
          max: 100,
          title: { display: true, text: 'Performance (%)' },
          ticks: {
            stepSize: 20,
            callback: (val) => `${val}%`
          },
          grid: { color: '#f1f5f9' }
        }
      }
    }
  });
}

/**
 * Load Global Leaderboard from Cloud Firestore displaying Usernames
 */
async function loadGlobalLeaderboard() {
  const tbody = document.getElementById("leaderboard-table-body");
  if (!tbody) return;

  try {
    const q = query(collection(db, "users"), orderBy("bestPercentage", "desc"), limit(10));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-slate-400">No attempts recorded yet. Be the first!</td></tr>`;
      return;
    }

    let rows = "";
    let rank = 1;

    snapshot.forEach((docSnap) => {
      const user = docSnap.data();
      rows += `
        <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
          <td class="py-3 px-4 font-bold text-slate-700">#${rank++}</td>
          <td class="py-3 px-4 flex items-center gap-3">
            <img src="${user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}" class="w-8 h-8 rounded-full border object-cover">
            <span class="font-semibold text-slate-900">@${user.username || 'anonymous'}</span>
          </td>
          <td class="py-3 px-4 font-bold text-indigo-600">${user.bestScore || 0}</td>
          <td class="py-3 px-4 font-bold text-emerald-600">${user.bestPercentage || 0}%</td>
          <td class="py-3 px-4 text-slate-500">${user.totalAttempts || 0}</td>
        </tr>
      `;
    });

    tbody.innerHTML = rows;
  } catch (err) {
    console.error("Leaderboard error:", err);
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-rose-500">Failed to load leaderboard data.</td></tr>`;
  }
}

// Global exports
window.saveQuizAttempt = saveQuizAttempt;
window.saveQuizScore = saveQuizAttempt;
window.loadGlobalLeaderboard = loadGlobalLeaderboard;
window.loadUserStats = loadUserStats;
window.loadUserPerformanceChart = loadUserPerformanceChart;