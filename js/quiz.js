/* ========================================================
   QUIZ ENGINE & TINDER-STYLE CARD SWIPE INTEGRATION
   ======================================================== */

let quizQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let mistakenImageIds = [];

// Drag State Management
let isDragging = false;
let startX = 0;
let currentX = 0;
const SWIPE_THRESHOLD = 100; // Pixels needed to register a swipe decision

/**
 * Initialize Quiz with a dataset of questions
 */
function startQuiz(dataset) {
  const sourceData = dataset || window.QUIZ_DATASET;
  if (!sourceData || sourceData.length === 0) {
    console.error("No dataset available to start quiz.");
    return;
  }

  // Pick 20 questions randomly from dataset
  quizQuestions = [...sourceData].sort(() => Math.random() - 0.5).slice(0, 20);
  currentQuestionIndex = 0;
  score = 0;
  mistakenImageIds = [];

  // Screen Toggle
  const startScreen = document.getElementById('quiz-start-screen');
  const activeScreen = document.getElementById('quiz-active-screen');
  const resultScreen = document.getElementById('quiz-result-screen');

  if (startScreen) startScreen.classList.add('hidden');
  if (resultScreen) resultScreen.classList.add('hidden');
  if (activeScreen) activeScreen.classList.remove('hidden');

  renderCardStack();
}

/**
 * Renders the top card and sets up drag/touch listeners
 */
function renderCardStack() {
  const q = quizQuestions[currentQuestionIndex];
  if (!q) {
    finishQuiz();
    return;
  }

  // Update progress UI
  const progressElem = document.getElementById('quiz-progress');
  const progressBar = document.getElementById('quiz-progress-bar');
  if (progressElem) progressElem.textContent = `Card ${currentQuestionIndex + 1} of ${quizQuestions.length}`;
  if (progressBar) progressBar.style.width = `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%`;

  // Render Image and Reset Overlay Badges
  const cardImg = document.getElementById('swipe-card-img');
  const realBadge = document.getElementById('badge-swipe-real');
  const aiBadge = document.getElementById('badge-swipe-ai');
  const card = document.getElementById('swipe-card');

  if (cardImg) {
    cardImg.src = q.src;
    cardImg.alt = `Verification Subject ${q.id || currentQuestionIndex + 1}`;
  }

  if (realBadge) realBadge.style.opacity = '0';
  if (aiBadge) aiBadge.style.opacity = '0';

  if (card) {
    card.style.transform = 'translateX(0px) rotate(0deg)';
    card.style.transition = 'none';
    attachCardListeners(card);
  }

  // Hide instant feedback box if visible
  const feedbackBox = document.getElementById('quiz-feedback');
  if (feedbackBox) feedbackBox.classList.add('hidden');
}

/**
 * Attach Mouse and Touch listeners for Tinder-style drag gesture
 */
function attachCardListeners(card) {
  // Remove prior listeners by cloning node or directly binding pointer events
  card.onmousedown = startDrag;
  card.ontouchstart = startDrag;
}

function startDrag(e) {
  isDragging = true;
  startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
  currentX = startX;

  document.onmousemove = onDrag;
  document.ontouchmove = onDrag;
  document.onmouseup = endDrag;
  document.ontouchend = endDrag;
}

function onDrag(e) {
  if (!isDragging) return;

  const x = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
  const deltaX = x - startX;
  currentX = x;

  const card = document.getElementById('swipe-card');
  const realBadge = document.getElementById('badge-swipe-real');
  const aiBadge = document.getElementById('badge-swipe-ai');

  if (card) {
    const rotate = deltaX * 0.08;
    card.style.transform = `translateX(${deltaX}px) rotate(${rotate}deg)`;
  }

  // Opacity of visual feedback overlays
  if (deltaX < 0) {
    // Left Swipe -> REAL
    if (realBadge) realBadge.style.opacity = Math.min(Math.abs(deltaX) / SWIPE_THRESHOLD, 1);
    if (aiBadge) aiBadge.style.opacity = '0';
  } else {
    // Right Swipe -> AI
    if (aiBadge) aiBadge.style.opacity = Math.min(Math.abs(deltaX) / SWIPE_THRESHOLD, 1);
    if (realBadge) realBadge.style.opacity = '0';
  }
}

function endDrag() {
  if (!isDragging) return;
  isDragging = false;

  document.onmousemove = null;
  document.ontouchmove = null;
  document.onmouseup = null;
  document.ontouchend = null;

  const deltaX = currentX - startX;

  if (deltaX < -SWIPE_THRESHOLD) {
    // Swiped Left -> User Guessed REAL (false for isAI)
    processChoice(false);
  } else if (deltaX > SWIPE_THRESHOLD) {
    // Swiped Right -> User Guessed AI (true for isAI)
    processChoice(true);
  } else {
    // Snap back to center
    const card = document.getElementById('swipe-card');
    if (card) {
      card.style.transition = 'transform 0.25s ease-out';
      card.style.transform = 'translateX(0px) rotate(0deg)';
    }
  }
}

/**
 * Handle user decision via drag OR manual buttons
 * @param {boolean} userGuessedAI True = User thinks AI, False = Real
 */
function processChoice(userGuessedAI) {
  const q = quizQuestions[currentQuestionIndex];
  if (!q) return;

  const isCorrect = (userGuessedAI === q.isAI);
  const card = document.getElementById('swipe-card');

  if (isCorrect) {
    score++;
  } else {
    mistakenImageIds.push(q.id || currentQuestionIndex);
  }

  // Animate card off screen
  if (card) {
    card.style.transition = 'transform 0.4s ease-in, opacity 0.4s ease-in';
    const direction = userGuessedAI ? 1000 : -1000;
    card.style.transform = `translateX(${direction}px) rotate(${direction * 0.05}deg)`;
    card.style.opacity = '0';
  }

  showInstantFeedback(isCorrect, q.isAI);

  setTimeout(() => {
    currentQuestionIndex++;
    if (currentQuestionIndex < quizQuestions.length) {
      if (card) card.style.opacity = '1';
      renderCardStack();
    } else {
      finishQuiz();
    }
  }, 600);
}

/**
 * Visual feedback ribbon under card
 */
function showInstantFeedback(isCorrect, actualIsAI) {
  const feedbackBox = document.getElementById('quiz-feedback');
  if (!feedbackBox) return;

  feedbackBox.classList.remove('hidden');
  const actualText = actualIsAI ? 'AI Synthetic' : 'Real Person';

  if (isCorrect) {
    feedbackBox.className = 'text-center font-bold p-3 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300';
    feedbackBox.innerHTML = `<i class="fa-solid fa-circle-check mr-1"></i> Correct! Subject is ${actualText}.`;
  } else {
    feedbackBox.className = 'text-center font-bold p-3 rounded-xl bg-rose-100 text-rose-800 border border-rose-300';
    feedbackBox.innerHTML = `<i class="fa-solid fa-circle-xmark mr-1"></i> Incorrect! Subject is ${actualText}.`;
  }
}

/**
 * Finish Quiz & Save Results to Firestore
 */
function finishQuiz() {
  const total = quizQuestions.length;
  const percentage = Math.round((score / total) * 100);

  const activeScreen = document.getElementById('quiz-active-screen');
  const resultScreen = document.getElementById('quiz-result-screen');

  if (activeScreen) activeScreen.classList.add('hidden');
  if (resultScreen) resultScreen.classList.remove('hidden');

  const scoreText = document.getElementById('quiz-final-score');
  const percentText = document.getElementById('quiz-final-percentage');

  if (scoreText) scoreText.textContent = `${score} / ${total}`;
  if (percentText) percentText.textContent = `${percentage}%`;

  if (typeof window.saveQuizAttempt === 'function') {
    window.saveQuizAttempt(score, total, percentage, mistakenImageIds);
  }
}

// Attach globally
window.startQuiz = startQuiz;
window.processChoice = processChoice;