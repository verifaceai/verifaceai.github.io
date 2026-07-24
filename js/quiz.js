/* ========================================================
   QUIZ ENGINE & FIRESTORE INTEGRATION
   ======================================================== */

// Global Quiz State
let quizQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = [];
let mistakenImageIds = [];

/**
 * Initialize Quiz with a dataset of questions
 * @param {Array} dataset Array of question objects: { id, image, isReal, explanation }
 */
function startQuiz(dataset) {
  if (!dataset || dataset.length === 0) {
    console.error("No dataset provided to start the quiz.");
    return;
  }

  // Shuffle and reset state
  quizQuestions = [...dataset].sort(() => Math.random() - 0.5).slice(0, 20); // Pick 20 questions
  currentQuestionIndex = 0;
  score = 0;
  userAnswers = [];
  mistakenImageIds = [];

  // Toggle screens
  const startScreen = document.getElementById('quiz-start-screen');
  const activeScreen = document.getElementById('quiz-active-screen');
  const resultScreen = document.getElementById('quiz-result-screen');

  if (startScreen) startScreen.classList.add('hidden');
  if (resultScreen) resultScreen.classList.add('hidden');
  if (activeScreen) activeScreen.classList.remove('hidden');

  renderQuestion();
}

/**
 * Render current question into HTML elements
 */
function renderQuestion() {
  const q = quizQuestions[currentQuestionIndex];
  if (!q) return;

  // Update progress UI
  const progressElem = document.getElementById('quiz-progress');
  const progressBar = document.getElementById('quiz-progress-bar');
  if (progressElem) progressElem.textContent = `Question ${currentQuestionIndex + 1} of ${quizQuestions.length}`;
  if (progressBar) progressBar.style.width = `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%`;

  // Render question image
  const imgElem = document.getElementById('quiz-image');
  if (imgElem) {
    imgElem.src = q.image;
    imgElem.alt = `Verification Image ${q.id}`;
  }

  // Reset feedback box if exists
  const feedbackBox = document.getElementById('quiz-feedback');
  if (feedbackBox) {
    feedbackBox.classList.add('hidden');
    feedbackBox.innerHTML = '';
  }

  // Enable buttons
  toggleChoiceButtons(true);
}

/**
 * Submit User Answer
 * @param {boolean} userChoiceTrue True if user thinks it's REAL, False if AI
 */
function submitAnswer(userChoiceTrue) {
  toggleChoiceButtons(false);

  const q = quizQuestions[currentQuestionIndex];
  const isCorrect = (userChoiceTrue === q.isReal);

  userAnswers.push({
    questionId: q.id,
    userChoice: userChoiceTrue,
    actualIsReal: q.isReal,
    isCorrect: isCorrect
  });

  if (isCorrect) {
    score++;
  } else {
    // Record mistaken image ID for Firestore logging
    mistakenImageIds.push(q.id);
  }

  showInstantFeedback(isCorrect, q.explanation);
}

/**
 * Display immediate feedback before moving to next question
 */
function showInstantFeedback(isCorrect, explanation) {
  const feedbackBox = document.getElementById('quiz-feedback');
  
  if (feedbackBox) {
    feedbackBox.classList.remove('hidden');
    feedbackBox.className = `p-4 rounded-lg my-4 text-center font-medium ${
      isCorrect ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
    }`;
    
    feedbackBox.innerHTML = `
      <p class="font-bold text-lg mb-1">${isCorrect ? 'Correct!' : 'Incorrect!'}</p>
      <p class="text-sm">${explanation || ''}</p>
    `;
  }

  // Delay before next question
  setTimeout(() => {
    currentQuestionIndex++;
    if (currentQuestionIndex < quizQuestions.length) {
      renderQuestion();
    } else {
      finishQuiz();
    }
  }, 1800);
}

/**
 * Enable / Disable answer choices during feedback
 */
function toggleChoiceButtons(enable) {
  const realBtn = document.getElementById('btn-answer-real');
  const aiBtn = document.getElementById('btn-answer-ai');

  if (realBtn) realBtn.disabled = !enable;
  if (aiBtn) aiBtn.disabled = !enable;
}

/**
 * Finish Quiz & Save Results to Firestore via auth.js
 */
function finishQuiz() {
  const total = quizQuestions.length;
  const percentage = Math.round((score / total) * 100);

  // 1. Hide quiz active screen & show results
  const activeScreen = document.getElementById('quiz-active-screen');
  const resultScreen = document.getElementById('quiz-result-screen');

  if (activeScreen) activeScreen.classList.add('hidden');
  if (resultScreen) resultScreen.classList.remove('hidden');

  // 2. Render Scoreboard elements
  const scoreText = document.getElementById('quiz-final-score');
  const percentText = document.getElementById('quiz-final-percentage');

  if (scoreText) scoreText.textContent = `${score} / ${total}`;
  if (percentText) percentText.textContent = `${percentage}%`;

  // 3. PERSIST TO CLOUD FIRESTORE
  if (typeof window.saveQuizAttempt === 'function') {
    window.saveQuizAttempt(score, total, percentage, mistakenImageIds);
  } else {
    console.warn("saveQuizAttempt function not found on window object.");
  }
}

// ATTACH TO WINDOW SCOPE FOR HTML CLICK HANDLERS
window.startQuiz = startQuiz;
window.submitAnswer = submitAnswer;