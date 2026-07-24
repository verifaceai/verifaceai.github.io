/* ========================================================
   TINDER-STYLE SWIPE QUIZ ENGINE (NO PER-IMAGE FEEDBACK)
   ======================================================== */

let quizQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let mistakenImageIds = [];

// Drag & Touch Gesture Tracking
let isDragging = false;
let startX = 0;
let currentX = 0;
const SWIPE_THRESHOLD = 90;

/**
 * Starts or restarts the 20-card swipe quiz
 */
function startQuiz() {
  let sourceData = window.QUIZ_DATASET;
  
  if (!sourceData || sourceData.length === 0) {
    if (typeof window.generateRandomQuizSet === 'function') {
      sourceData = window.generateRandomQuizSet();
    } else {
      console.error("QUIZ_DATASET is missing or empty.");
      return;
    }
  }

  // Shuffle and select 20 items
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

  renderCard();
}

/**
 * Render current card in stack
 */
function renderCard() {
  const q = quizQuestions[currentQuestionIndex];
  if (!q) {
    finishQuiz();
    return;
  }

  // Update progress
  const progressElem = document.getElementById('quiz-progress');
  const progressBar = document.getElementById('quiz-progress-bar');
  if (progressElem) progressElem.textContent = `Card ${currentQuestionIndex + 1} of ${quizQuestions.length}`;
  if (progressBar) progressBar.style.width = `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%`;

  // Render Image & Badges
  const cardImg = document.getElementById('swipe-card-img');
  const realBadge = document.getElementById('badge-swipe-real');
  const aiBadge = document.getElementById('badge-swipe-ai');
  const card = document.getElementById('swipe-card');

  if (cardImg) {
    cardImg.src = q.src;
    cardImg.onerror = function() {
      if (q.fallbackSrc && this.src !== q.fallbackSrc) {
        this.src = q.fallbackSrc;
      } else {
        this.src = `https://picsum.photos/500?random=${currentQuestionIndex}`;
      }
    };
  }

  if (realBadge) realBadge.style.opacity = '0';
  if (aiBadge) aiBadge.style.opacity = '0';

  if (card) {
    card.style.transform = 'translateX(0px) rotate(0deg)';
    card.style.transition = 'none';
    card.style.opacity = '1';
    attachSwipeEvents(card);
  }

  const feedbackBox = document.getElementById('quiz-feedback');
  if (feedbackBox) feedbackBox.classList.add('hidden');
}

/**
 * Mouse & Touch Bindings
 */
function attachSwipeEvents(card) {
  card.onmousedown = handleDragStart;
  card.ontouchstart = handleDragStart;
}

function handleDragStart(e) {
  isDragging = true;
  startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
  currentX = startX;

  document.onmousemove = handleDragMove;
  document.ontouchmove = handleDragMove;
  document.onmouseup = handleDragEnd;
  document.ontouchend = handleDragEnd;
}

function handleDragMove(e) {
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

  // Visual Overlays during drag
  if (deltaX < 0) {
    // Left Drag -> REAL
    if (realBadge) realBadge.style.opacity = Math.min(Math.abs(deltaX) / SWIPE_THRESHOLD, 1);
    if (aiBadge) aiBadge.style.opacity = '0';
  } else if (deltaX > 0) {
    // Right Drag -> AI
    if (aiBadge) aiBadge.style.opacity = Math.min(Math.abs(deltaX) / SWIPE_THRESHOLD, 1);
    if (realBadge) realBadge.style.opacity = '0';
  }
}

function handleDragEnd() {
  if (!isDragging) return;
  isDragging = false;

  document.onmousemove = null;
  document.ontouchmove = null;
  document.onmouseup = null;
  document.ontouchend = null;

  const deltaX = currentX - startX;

  if (deltaX < -SWIPE_THRESHOLD) {
    processChoice(false); // Left = Real
  } else if (deltaX > SWIPE_THRESHOLD) {
    processChoice(true);  // Right = AI
  } else {
    // Reset position
    const card = document.getElementById('swipe-card');
    if (card) {
      card.style.transition = 'transform 0.2s ease-out';
      card.style.transform = 'translateX(0px) rotate(0deg)';
    }
  }
}

/**
 * Process User Answer
 * @param {boolean} userGuessedAI True = Right (AI), False = Left (Real)
 */
function processChoice(userGuessedAI) {
  const q = quizQuestions[currentQuestionIndex];
  if (!q) return;

  const isCorrect = (userGuessedAI === q.isAI);
  const card = document.getElementById('swipe-card');

  if (isCorrect) {
    score++;
  } else {
    mistakenImageIds.push(q.id);
  }

  // Swipe Card Offscreen Animation
  if (card) {
    card.style.transition = 'transform 0.25s ease-in, opacity 0.25s ease-in';
    const flyOut = userGuessedAI ? 800 : -800;
    card.style.transform = `translateX(${flyOut}px) rotate(${flyOut * 0.04}deg)`;
    card.style.opacity = '0';
  }

  // Advance immediately after swipe animation
  setTimeout(() => {
    currentQuestionIndex++;
    if (currentQuestionIndex < quizQuestions.length) {
      renderCard();
    } else {
      finishQuiz();
    }
  }, 250);
}

/**
 * Quiz Completion Handler
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

  // Push score to Firestore via auth.js wrapper
  if (typeof window.saveQuizAttempt === 'function') {
    window.saveQuizAttempt(score, total, percentage, mistakenImageIds);
  }
}

// Global Exports
window.startQuiz = startQuiz;
window.resetQuiz = startQuiz;
window.processChoice = processChoice;