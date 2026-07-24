/* ========================================================
   20-CARD SWIPE QUIZ ENGINE
   ======================================================== */

let currentQuizIndex = 0;
let quizScore = 0;
let isSwiping = false;
let startX = 0;
let currentX = 0;
let cardElement = null;

/**
 * Resets and initializes the 20-Card Quiz
 */
function resetQuiz() {
  currentQuizIndex = 0;
  quizScore = 0;
  isSwiping = false;

  const cardContainer = document.getElementById('quiz-card-container');
  const quizControls = document.getElementById('quiz-controls');
  const resultsBox = document.getElementById('quiz-results');

  if (cardContainer) cardContainer.classList.remove('hidden');
  if (quizControls) quizControls.classList.remove('hidden');
  if (resultsBox) resultsBox.classList.add('hidden');

  setupSwipeCard();
  renderQuizCard();
}
window.resetQuiz = resetQuiz;

/**
 * Binds mouse and touch drag listeners to the card element
 */
function setupSwipeCard() {
  cardElement = document.getElementById('quiz-card');
  if (!cardElement) return;

  // Reset transforms
  cardElement.style.transform = 'none';
  cardElement.style.transition = 'none';

  // Mouse Events
  cardElement.onmousedown = startDrag;
  window.onmousemove = drag;
  window.onmouseup = endDrag;

  // Touch Events (Mobile)
  cardElement.ontouchstart = (e) => startDrag(e.touches[0]);
  window.ontouchmove = (e) => {
    if (isSwiping) drag(e.touches[0]);
  };
  window.ontouchend = endDrag;
}

function startDrag(e) {
  isSwiping = true;
  startX = e.clientX;
  if (cardElement) cardElement.style.transition = 'none';
}

function drag(e) {
  if (!isSwiping || !cardElement) return;

  currentX = e.clientX - startX;
  const rotate = currentX * 0.05; // Gentle rotation while dragging

  cardElement.style.transform = `translateX(${currentX}px) rotate(${rotate}deg)`;

  // Show "REAL" or "AI" overlays dynamically based on drag direction
  const overlayReal = document.getElementById('overlay-real');
  const overlayAI = document.getElementById('overlay-ai');

  if (currentX > 30) {
    // Dragging Right -> REAL
    if (overlayReal) overlayReal.style.opacity = Math.min(currentX / 100, 1);
    if (overlayAI) overlayAI.style.opacity = '0';
  } else if (currentX < -30) {
    // Dragging Left -> AI
    if (overlayAI) overlayAI.style.opacity = Math.min(Math.abs(currentX) / 100, 1);
    if (overlayReal) overlayReal.style.opacity = '0';
  } else {
    if (overlayReal) overlayReal.style.opacity = '0';
    if (overlayAI) overlayAI.style.opacity = '0';
  }
}

function endDrag() {
  if (!isSwiping) return;
  isSwiping = false;

  const threshold = 100; // Drag threshold to register decision

  if (currentX > threshold) {
    // Swiped Right -> Picked Real (false)
    processQuizAnswer(false, 'right');
  } else if (currentX < -threshold) {
    // Swiped Left -> Picked AI (true)
    processQuizAnswer(true, 'left');
  } else {
    // Snap back to center
    if (cardElement) {
      cardElement.style.transition = 'transform 0.3s ease';
      cardElement.style.transform = 'none';
    }
    resetOverlays();
  }
  currentX = 0;
}

/**
 * Handles choice made via bottom action buttons
 */
function handleSwipeChoice(guessedAI) {
  const direction = guessedAI ? 'left' : 'right';
  processQuizAnswer(guessedAI, direction);
}
window.handleSwipeChoice = handleSwipeChoice;

/**
 * Evaluates user's guess and animates card exit
 */
function processQuizAnswer(guessedAI, direction) {
  if (currentQuizIndex >= QUIZ_DATASET.length) return;

  const currentCard = QUIZ_DATASET[currentQuizIndex];
  const isCorrect = (guessedAI === currentCard.isAI);

  if (isCorrect) quizScore++;

  // Animate card off screen
  if (cardElement) {
    cardElement.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
    const xFly = direction === 'right' ? 600 : -600;
    const rotateFly = direction === 'right' ? 25 : -25;
    cardElement.style.transform = `translateX(${xFly}px) rotate(${rotateFly}deg)`;
    cardElement.style.opacity = '0';
  }

  // Advance to next card after animation finishes
  setTimeout(() => {
    currentQuizIndex++;
    if (currentQuizIndex < QUIZ_DATASET.length) {
      renderQuizCard();
    } else {
      finishQuiz();
    }
  }, 300);
}

/**
 * Renders the next card in the dataset
 */
function renderQuizCard() {
  const currentCard = QUIZ_DATASET[currentQuizIndex];
  if (!currentCard) return;

  const imgEl = document.getElementById('quiz-card-img');
  const numEl = document.getElementById('card-num');
  const progressText = document.getElementById('quiz-progress-text');
  const progressBar = document.getElementById('quiz-progress-bar');

  if (numEl) numEl.textContent = currentQuizIndex + 1;
  if (progressText) progressText.textContent = `${currentQuizIndex + 1} / ${QUIZ_DATASET.length}`;
  if (progressBar) progressBar.style.width = `${((currentQuizIndex + 1) / QUIZ_DATASET.length) * 100}%`;

  if (imgEl) {
    imgEl.src = currentCard.src;
    imgEl.onerror = function() {
      const label = currentCard.isAI ? 'AI Synthetic' : 'Real Person';
      this.src = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1024' height='1024' viewBox='0 0 1024 1024'><rect width='1024' height='1024' fill='%23f1f5f9'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='32' font-weight='bold' fill='%23475569'>${label}</text></svg>`;
    };
  }

  resetOverlays();

  // Reset card element position for new card
  if (cardElement) {
    cardElement.style.transition = 'none';
    cardElement.style.transform = 'none';
    cardElement.style.opacity = '1';
  }
}

function resetOverlays() {
  const overlayReal = document.getElementById('overlay-real');
  const overlayAI = document.getElementById('overlay-ai');
  if (overlayReal) overlayReal.style.opacity = '0';
  if (overlayAI) overlayAI.style.opacity = '0';
}

/**
 * Quiz completed: Calculates percentage and saves attempt to leaderboard
 */
function finishQuiz() {
  const cardContainer = document.getElementById('quiz-card-container');
  const quizControls = document.getElementById('quiz-controls');
  const resultsBox = document.getElementById('quiz-results');

  if (cardContainer) cardContainer.classList.add('hidden');
  if (quizControls) quizControls.classList.add('hidden');
  if (resultsBox) resultsBox.classList.remove('hidden');

  const total = QUIZ_DATASET.length;
  const percentage = Math.round((quizScore / total) * 100);

  const scoreEl = document.getElementById('final-score');
  const percentEl = document.getElementById('final-percentage');

  if (scoreEl) scoreEl.textContent = `${quizScore} / ${total}`;
  if (percentEl) percentEl.textContent = `${percentage}%`;

  // Save score to local storage & leaderboard table
  if (typeof window.saveQuizAttempt === 'function') {
    window.saveQuizAttempt(quizScore, total, percentage);
  }
}

// Auto-initialize when navigating or page load
document.addEventListener('DOMContentLoaded', () => {
  resetQuiz();
});