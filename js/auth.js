/* ========================================================
   AUTHENTICATION & FIRESTORE DATABASE + CHART INTEGRATION
   ======================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
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
  orderBy, 
  limit, 
  getDocs,
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

let currentUser = null;
let userChartInstance = null;

// Google Sign In
window.loginWithGoogle = async function() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Authentication error:", error);
  }
};

// Logout
window.logoutUser = async function() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign out error:", error);
  }
};

// Auth Listener
onAuthStateChanged(auth, async (user) => {
  const loggedOutUI = document.getElementById("auth-logged-out");
  const loggedInUI = document.getElementById("auth-logged-in");
  const overlay = document.getElementById("chart-logged-out-overlay");

  if (user) {
    currentUser = user;
    if (loggedOutUI) loggedOutUI.classList.add("hidden");
    if (loggedInUI) loggedInUI.classList.remove("hidden");

    document.getElementById("user-avatar").src = user.photoURL || "https://via.placeholder.com/150";
    document.getElementById("user-display-name").textContent = user.displayName || "User";
    document.getElementById("user-email").textContent = user.email || "";

    if (overlay) overlay.classList.add("hidden");

    await syncUserData(user);
    await loadUserDashboard(user.uid);
  } else {
    currentUser = null;
    if (loggedOutUI) loggedOutUI.classList.remove("hidden");
    if (loggedInUI) loggedInUI.classList.add("hidden");
    if (overlay) overlay.classList.remove("hidden");

    document.getElementById("stat-total-attempts").textContent = "—";
    document.getElementById("stat-best-score").textContent = "—";
    
    if (userChartInstance) {
      userChartInstance.destroy();
      userChartInstance = null;
    }
  }

  loadGlobalLeaderboard();
});

// Sync Profile to Firestore
async function syncUserData(user) {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      displayName: user.displayName || "Anonymous",
      photoURL: user.photoURL || "",
      email: user.email,
      bestScore: 0,
      bestPercentage: 0,
      totalAttempts: 0,
      scoresHistory: [],
      createdAt: serverTimestamp()
    });
  }
}

// Record Quiz Attempt
export async function saveQuizScore(score, totalQuestions) {
  if (!currentUser) return;

  const percentage = Math.round((score / totalQuestions) * 100);
  const userRef = doc(db, "users", currentUser.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const data = snap.data();
    const currentBest = data.bestPercentage || 0;
    const newBest = Math.max(currentBest, percentage);
    const newBestScore = Math.max(data.bestScore || 0, score);

    await updateDoc(userRef, {
      totalAttempts: (data.totalAttempts || 0) + 1,
      bestScore: newBestScore,
      bestPercentage: newBest,
      scoresHistory: arrayUnion({
        score,
        totalQuestions,
        percentage,
        date: new Date().toISOString()
      })
    });

    await loadUserDashboard(currentUser.uid);
    await loadGlobalLeaderboard();
  }
}

// Load Dashboard Data
async function loadUserDashboard(uid) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const data = snap.data();
    document.getElementById("stat-total-attempts").textContent = data.totalAttempts || 0;
    document.getElementById("stat-best-score").textContent = `${data.bestPercentage || 0}%`;

    renderChart(data.scoresHistory || []);
  }
}

// Render Performance Chart
function renderChart(history) {
  const ctx = document.getElementById("user-performance-chart").getContext("2d");

  if (userChartInstance) userChartInstance.destroy();

  const labels = history.map((_, i) => `Attempt ${i + 1}`);
  const scores = history.map(h => h.percentage);

  userChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.length ? labels : ['No Data'],
      datasets: [{
        label: 'Accuracy (%)',
        data: scores.length ? scores : [0],
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { min: 0, max: 100 }
      }
    }
  });
}

// Load Global Leaderboard
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
            <img src="${user.photoURL || 'https://via.placeholder.com/150'}" class="w-8 h-8 rounded-full border object-cover">
            <span class="font-semibold text-slate-900">${user.displayName || 'Anonymous'}</span>
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

// 2. INITIALIZE SERVICES
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: 'select_account' });

let currentUser = null;
let performanceChart = null;

/**
 * Handles Safari redirect completion
 */
getRedirectResult(auth)
  .then((result) => {
    if (result && result.user) {
      syncUserProfile(result.user);
    }
  })
  .catch((error) => console.error("Redirect Sign-in error:", error));

/**
 * Auth state change listener
 */
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = {
      uid: user.uid,
      displayName: user.displayName || 'Anonymous User',
      email: user.email || '',
      photoURL: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
    };
    await syncUserProfile(user);
    updateAuthUI(true);
  } else {
    currentUser = null;
    updateAuthUI(false);
  }
});

/**
 * Ensures user document exists in Firestore
 */
async function syncUserProfile(user) {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName || 'Anonymous User',
      email: user.email || '',
      photoURL: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      totalAttempts: 0,
      bestScore: 0,
      bestPercentage: 0,
      mistakenImageIds: [],
      createdAt: new Date().toISOString()
    });
  }
}

/**
 * Login function (Handles popup + redirect fallbacks)
 */
async function loginWithGoogle() {
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
      alert(`Authentication failed: ${error.message}`);
    }
  }
}

/**
 * Logout
 */
async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out:", error);
  }
}

/**
 * Update UI elements based on authentication state
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
    renderDemoChart();
  }
  loadGlobalLeaderboard();
}

/**
 * Save Quiz Attempt to Firestore Database
 */
async function saveQuizAttempt(score, total, percentage, mistakenIds = []) {
  const attemptData = {
    uid: currentUser ? currentUser.uid : 'guest',
    displayName: currentUser ? currentUser.displayName : 'Guest User',
    photoURL: currentUser ? currentUser.photoURL : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    score: score,
    total: total,
    percentage: percentage,
    mistakenIds: mistakenIds,
    timestamp: new Date().toISOString()
  };

  try {
    // 1. Store in attempts collection
    await addDoc(collection(db, "quiz_attempts"), attemptData);

    // 2. Update user profile document if signed in
    if (currentUser) {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const newBest = Math.max(userData.bestScore || 0, score);
        const newBestPercent = Math.max(userData.bestPercentage || 0, percentage);

        await updateDoc(userRef, {
          totalAttempts: increment(1),
          bestScore: newBest,
          bestPercentage: newBestPercent,
          mistakenImageIds: arrayUnion(...mistakenIds)
        });
      }
    }

    loadUserStats();
    loadGlobalLeaderboard();
  } catch (err) {
    console.error("Error saving quiz attempt to Cloud Firestore:", err);
  }
}

/**
 * Fetch and Render Real User Performance Chart from Firestore
 */
async function loadUserPerformanceChart() {
  const canvas = document.getElementById('user-performance-chart');
  const overlay = document.getElementById('chart-logged-out-overlay');

  if (!canvas || !currentUser) return;

  // Hide overlay for logged in users
  if (overlay) overlay.classList.add('hidden');

  try {
    // Query attempts by UID ordered chronologically
    const attemptsRef = collection(db, "quiz_attempts");
    const q = query(
      attemptsRef, 
      where("uid", "==", currentUser.uid), 
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

    // Render chart with user data or default flat start
    renderChartInstance(
      labels.length > 0 ? labels : ['Attempt 1'], 
      scores.length > 0 ? scores : [0]
    );

  } catch (error) {
    console.error("Error loading performance chart:", error);
    // If composite index error happens on first query, fall back gracefully
    if (error.message.includes('index')) {
      console.warn("Firestore requires a composite index. Follow the URL in the error above to construct it.");
    }
  }
}

/**
 * Render Demo Chart behind blur overlay when logged out
 */
function renderDemoChart() {
  const overlay = document.getElementById('chart-logged-out-overlay');
  if (overlay) overlay.classList.remove('hidden');

  const demoLabels = ['Attempt 1', 'Attempt 2', 'Attempt 3', 'Attempt 4', 'Attempt 5', 'Attempt 6'];
  const demoScores = [45, 55, 60, 75, 80, 95];

  renderChartInstance(demoLabels, demoScores);
}

/**
 * Universal Chart.js Renderer
 */
function renderChartInstance(labels, scores) {
  const canvas = document.getElementById('user-performance-chart');
  if (!canvas) return;

  if (performanceChart) {
    performanceChart.destroy();
  }

  const ctx = canvas.getContext('2d');
  
  // Gradient styling
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(79, 70, 229, 0.35)');
  gradient.addColorStop(1, 'rgba(79, 70, 229, 0.0)');

  performanceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Accuracy Score (%)',
        data: scores,
        borderColor: '#4f46e5',
        borderWidth: 3,
        backgroundColor: gradient,
        fill: true,
        tension: 0.35,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#4f46e5',
        pointBorderColor: '#ffffff',
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
          grid: { display: false }
        },
        y: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            callback: (val) => `${val}%`
          }
        }
      }
    }
  });
}

/**
 * Load Global Leaderboard from Cloud Firestore
 */
async function loadGlobalLeaderboard() {
  const leaderboardBody = document.getElementById('leaderboard-table-body');
  if (!leaderboardBody) return;

  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("bestPercentage", "desc"), limit(10));
    const querySnapshot = await getDocs(q);

    let html = '';
    let rank = 1;

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.totalAttempts > 0) {
        html += `
          <tr class="hover:bg-slate-50 border-b border-slate-100">
            <td class="py-3 px-4 font-bold text-indigo-600">#${rank}</td>
            <td class="py-3 px-4 flex items-center gap-3">
              <img src="${data.photoURL}" class="w-7 h-7 rounded-full object-cover border">
              <span class="font-semibold text-slate-800">${data.displayName}</span>
            </td>
            <td class="py-3 px-4 font-extrabold text-slate-900">${data.bestScore} / 20</td>
            <td class="py-3 px-4"><span class="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-xs">${data.bestPercentage}%</span></td>
            <td class="py-3 px-4 text-xs text-slate-400">${data.totalAttempts} attempts</td>
          </tr>
        `;
        rank++;
      }
    });

    if (html === '') {
      leaderboardBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-slate-400">No scores logged yet! Be the first.</td></tr>`;
    } else {
      leaderboardBody.innerHTML = html;
    }
  } catch (error) {
    console.error("Error loading leaderboard from Firestore:", error);
  }
}

/**
 * Load User Dashboard Stats from Cloud Firestore
 */
async function loadUserStats() {
  if (!currentUser) return;

  try {
    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();

      if (document.getElementById('stat-total-attempts')) {
        document.getElementById('stat-total-attempts').textContent = data.totalAttempts || 0;
      }
      if (document.getElementById('stat-best-score')) {
        document.getElementById('stat-best-score').textContent = `${data.bestPercentage || 0}%`;
      }
    }

    // Load actual performance chart for user
    loadUserPerformanceChart();

  } catch (error) {
    console.error("Error fetching user stats from Firestore:", error);
  }
}

// ATTACH TO WINDOW SCOPE FOR HTML ONCLICK HANDLERS
window.loginWithGoogle = loginWithGoogle;
window.logoutUser = logoutUser;
window.saveQuizAttempt = saveQuizAttempt;
window.loadGlobalLeaderboard = loadGlobalLeaderboard;
window.loadUserStats = loadUserStats;
window.loadUserPerformanceChart = loadUserPerformanceChart;