/* ========================================================
   3-BLOCK TRAINING ENGINE WITH VARIED FEEDBACK
   ======================================================== */

let currentBlockIndex = 0;
let currentImageIndexInBlock = 0;
let isAnswerSubmitted = false;
let isBlockModalOpen = false;

// Dynamic feedback phrase variations per feature
const FEEDBACK_TEMPLATES = {
  proportionality: {
    correctAI: [
      "Spot on! This face displayed high levels of artificial proportionality, which is strongly indicative of AI generated faces.",
      "Correct! Noticeable spatial and mathematical proportionality anomalies were present here, pointing to synthetic generation.",
      "Great eye! The unnatural geometric proportionality in this render reveals its AI origins."
    ],
    correctReal: [
      "Correct! This authentic portrait displays natural optical physics and organic facial asymmetry rather than rigid artificial proportionality.",
      "Well done! This is a real person—lacking the forced geometric symmetry typical of AI models.",
      "Exact answer! The subtle, organic proportion variations confirm this photograph is genuine."
    ],
    incorrectAI: [
      "Incorrect. This face was actually high in artificial proportionality, a key visual marker of AI generated faces.",
      "Not quite. Look closer at the eye spacing and ear heights—the mathematical proportionality indicates AI synthesis.",
      "Missed this one! The rigid structural proportionality in this subject is characteristic of generative models."
    ],
    incorrectReal: [
      "Incorrect. This subject is actually a real human, exhibiting genuine asymmetrical features rather than synthetic proportionality.",
      "Ah, not quite! Despite symmetrical lighting, this portrait possesses real skin micro-textures and natural proportions.",
      "Incorrect answer. This is an authentic photo with natural human facial proportions."
    ]
  },
  familiarity: {
    correctAI: [
      "Correct! This image scored high in familiarity, presenting an 'averaged' composite face typical of AI diffusion models.",
      "Right on! The generic, overly familiar appearance of this subject is a hallmark of generative AI training datasets.",
      "Spot on! This synthetic portrait carries that uncanny 'familiar yet non-existent' face structure."
    ],
    correctReal: [
      "Correct! This is a real person possessing distinct, unique features rather than generalized synthetic familiarity.",
      "Well identified! Genuine human features stand out here without the uncanny smoothness of AI familiarity blending.",
      "Great work! Natural lighting and organic details set this authentic face apart from synthetic renders."
    ],
    incorrectAI: [
      "Incorrect. This face was high in artificial familiarity, reflecting how GANs blend thousands of stock faces into synthetic composites.",
      "Not quite! The strangely familiar, generic blend of features here is actually a classic sign of AI generation.",
      "Missed this one. High feature familiarity without distinct character marks this portrait as synthetic AI."
    ],
    incorrectReal: [
      "Incorrect. This is a real photograph—while the subject may look approachable, the fine details confirm authentic photography.",
      "Ah, not quite. This person is genuine; real photography often captures natural warmth that shouldn't be mistaken for AI averaging.",
      "Incorrect choice. This subject is authentic, backed by natural light catchlights and unblended hair strands."
    ]
  },
  memorability: {
    correctAI: [
      "Correct! The low organic memorability and hyper-smoothed skin render here are indicative of AI generated faces.",
      "Spot on! Generative renders often suffer from low distinct memorability due to over-polished facial features.",
      "Great catch! This face lacks the distinct personal quirks that give real human faces memorable character."
    ],
    correctReal: [
      "Correct! High organic memorability—driven by unique micro-features and genuine expression—marks this as a real human.",
      "Well done! This real photo contains memorable, unrepeated skin imperfections and natural asymmetry.",
      "Exact answer! The authentic detail and expressive character give this subject high genuine memorability."
    ],
    incorrectAI: [
      "Incorrect. This face exhibited artificial smoothing and low organic memorability, characteristic of AI generated portraits.",
      "Not quite. The synthetic smoothness reduces distinct memorability, a key visual flaw in diffusion model outputs.",
      "Missed this one. High plastic uniformity and low memorability point directly to AI generation."
    ],
    incorrectReal: [
      "Incorrect. This subject is actually a real human with memorable organic details and natural skin pores.",
      "Ah, not quite! The distinct features and natural depth of field make this an authentic photograph.",
      "Incorrect choice. This is a real photograph with high human expression memorability."
    ]
  }
};

/**
 * Returns a randomized feedback string based on answer, correctness, and feature
 */
function getRandomFeedback(feature, isAI, isCorrect) {
  const templates = FEEDBACK_TEMPLATES[feature] || FEEDBACK_TEMPLATES['proportionality'];
  let pool = isCorrect ? (isAI ? templates.correctAI : templates.correctReal) : (isAI ? templates.incorrectAI : templates.incorrectReal);
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

/**
 * Prepares the training state cleanly and ensures the modal is hidden
 */
function prepareTrainingModule() {
  currentBlockIndex = 0;
  currentImageIndexInBlock = 0;
  isAnswerSubmitted = false;
  isBlockModalOpen = false;

  const modal = document.getElementById('block-instruction-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

/**
 * Displays the modal instruction prior to starting a block
 */
function showBlockInstructionModal() {
  const blocks = window.TRAINING_BLOCKS_DATA || [];
  const block = blocks[currentBlockIndex];
  if (!block) return;

  const modal = document.getElementById('block-instruction-modal');
  const tag = document.getElementById('block-modal-tag');
  const title = document.getElementById('block-modal-title');
  const desc = document.getElementById('block-modal-description');
  const icon = document.getElementById('block-modal-icon');

  if (tag) tag.textContent = `Block ${currentBlockIndex + 1} of 3`;
  if (title) title.textContent = `${block.title} Analysis`;
  if (desc) desc.textContent = block.description;
  if (icon) icon.className = `fa-solid ${block.icon}`;

  if (modal) {
    modal.classList.remove('hidden');
    isBlockModalOpen = true;
  }
}

/**
 * Called specifically when user switches tabs to Training Module
 */
function onEnterTrainingPage() {
  const modal = document.getElementById('block-instruction-modal');
  if (modal && currentImageIndexInBlock === 0 && !isAnswerSubmitted && !isBlockModalOpen) {
    showBlockInstructionModal();
  } else {
    renderTrainingCase();
  }
}

/**
 * Triggered when user clicks "Start Block Exercises" in the modal
 */
function startCurrentBlock() {
  const modal = document.getElementById('block-instruction-modal');
  if (modal) {
    modal.classList.add('hidden');
    isBlockModalOpen = false;
  }

  renderTrainingCase();
  updateProgressBar();
}

/**
 * Renders the current image case within the active block
 */
function renderTrainingCase() {
  const blocks = window.TRAINING_BLOCKS_DATA || [];
  const block = blocks[currentBlockIndex];
  if (!block) return;

  const currentCase = block.images[currentImageIndexInBlock];
  if (!currentCase) return;

  isAnswerSubmitted = false;

  // Update image with fallback loading
  const imgElement = document.getElementById('training-img');
  if (imgElement) {
    imgElement.src = currentCase.src;
    imgElement.onerror = function() {
      if (currentCase.fallbackSrc && this.src !== currentCase.fallbackSrc) {
        this.src = currentCase.fallbackSrc;
      } else {
        const label = currentCase.isAI ? 'AI Synthetic' : 'Real Person';
        this.src = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1024' height='1024' viewBox='0 0 1024 1024'><rect width='1024' height='1024' fill='%23f1f5f9'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='28' font-weight='bold' fill='%23475569'>${label}</text></svg>`;
      }
    };
  }

  // Update headers and badge
  const badge = document.getElementById('training-block-badge');
  if (badge) {
    badge.textContent = block.badgeText;
    badge.className = `px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${block.badgeClass}`;
  }

  const subtitle = document.getElementById('training-case-subtitle');
  if (subtitle) {
    subtitle.textContent = `Block ${currentBlockIndex + 1} • Image ${currentImageIndexInBlock + 1} of ${block.images.length}`;
  }

  const featureTag = document.getElementById('training-feature-tag');
  if (featureTag) {
    featureTag.textContent = `${block.title} Focus`;
  }

  const feedbackBox = document.getElementById('training-feedback');
  const buttonsBox = document.getElementById('training-buttons');
  if (feedbackBox) feedbackBox.classList.add('hidden');
  if (buttonsBox) buttonsBox.classList.remove('hidden');

  updateProgressBar();
}

/**
 * Processes user guess
 */
function submitTrainingGuess(guessedAI) {
  if (isAnswerSubmitted) return;
  isAnswerSubmitted = true;

  const blocks = window.TRAINING_BLOCKS_DATA || [];
  const block = blocks[currentBlockIndex];
  const currentCase = block.images[currentImageIndexInBlock];
  const isCorrect = (guessedAI === currentCase.isAI);

  const feedbackBox = document.getElementById('training-feedback');
  const buttonsBox = document.getElementById('training-buttons');
  const header = document.getElementById('feedback-header');
  const text = document.getElementById('feedback-text');

  if (buttonsBox) buttonsBox.classList.add('hidden');

  if (feedbackBox && header && text) {
    feedbackBox.classList.remove('hidden', 'bg-emerald-50', 'bg-rose-50', 'border-emerald-200', 'border-rose-200');

    if (isCorrect) {
      feedbackBox.classList.add('bg-emerald-50', 'border', 'border-emerald-200');
      header.className = 'font-bold flex items-center gap-2 mb-2 text-emerald-800 text-base';
      header.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-600"></i> Correct Assessment!`;
    } else {
      feedbackBox.classList.add('bg-rose-50', 'border', 'border-rose-200');
      header.className = 'font-bold flex items-center gap-2 mb-2 text-rose-800 text-base';
      header.innerHTML = `<i class="fa-solid fa-circle-xmark text-rose-600"></i> Incorrect Assessment`;
    }

    text.textContent = getRandomFeedback(block.id, currentCase.isAI, isCorrect);
    text.className = isCorrect ? 'text-sm text-emerald-900 leading-relaxed' : 'text-sm text-rose-900 leading-relaxed';
  }
}

/**
 * Advances to next image or next block
 */
function nextTrainingCase() {
  const blocks = window.TRAINING_BLOCKS_DATA || [];
  const block = blocks[currentBlockIndex];

  if (currentImageIndexInBlock < block.images.length - 1) {
    currentImageIndexInBlock++;
    renderTrainingCase();
  } else {
    if (currentBlockIndex < blocks.length - 1) {
      currentBlockIndex++;
      currentImageIndexInBlock = 0;
      showBlockInstructionModal();
    } else {
      showTrainingCompletionMessage();
    }
  }
}

/**
 * Updates 3-segment progress bar across all 36 images
 */
function updateProgressBar() {
  const totalCompletedInPreviousBlocks = currentBlockIndex * 12;
  const overallImageNum = totalCompletedInPreviousBlocks + currentImageIndexInBlock + 1;

  const countText = document.getElementById('training-overall-count');
  if (countText) {
    countText.textContent = `Image ${overallImageNum} / 36`;
  }

  const b1 = document.getElementById('progress-bar-block-1');
  if (b1) {
    if (currentBlockIndex > 0) b1.style.width = '100%';
    else if (currentBlockIndex === 0) b1.style.width = `${((currentImageIndexInBlock + 1) / 12) * 100}%`;
    else b1.style.width = '0%';
  }

  const b2 = document.getElementById('progress-bar-block-2');
  if (b2) {
    if (currentBlockIndex > 1) b2.style.width = '100%';
    else if (currentBlockIndex === 1) b2.style.width = `${((currentImageIndexInBlock + 1) / 12) * 100}%`;
    else b2.style.width = '0%';
  }

  const b3 = document.getElementById('progress-bar-block-3');
  if (b3) {
    if (currentBlockIndex === 2) b3.style.width = `${((currentImageIndexInBlock + 1) / 12) * 100}%`;
    else b3.style.width = '0%';
  }
}

/**
 * Final completion state when user finishes all 36 images
 */
function showTrainingCompletionMessage() {
  const feedbackBox = document.getElementById('training-feedback');
  const header = document.getElementById('feedback-header');
  const text = document.getElementById('feedback-text');
  const btn = document.getElementById('next-training-btn');

  if (feedbackBox && header && text && btn) {
    feedbackBox.classList.remove('hidden', 'bg-rose-50', 'border-rose-200');
    feedbackBox.classList.add('bg-indigo-50', 'border', 'border-indigo-200');

    header.className = 'font-bold flex items-center gap-2 mb-2 text-indigo-900 text-lg';
    header.innerHTML = `<i class="fa-solid fa-graduation-cap text-indigo-600"></i> All 3 Blocks Completed!`;

    text.textContent = "Congratulations! You have finished all 36 training exercises across Proportionality, Familiarity, and Memorability. You are now ready for the 20-Card Swipe Challenge.";
    text.className = 'text-sm text-indigo-900 leading-relaxed';

    btn.textContent = 'Take 20-Card Quiz Challenge';
    btn.onclick = () => { navigateTo('quiz'); };
  }
}

// Global functions
window.submitTrainingGuess = submitTrainingGuess;
window.nextTrainingCase = nextTrainingCase;
window.startCurrentBlock = startCurrentBlock;
window.onEnterTrainingPage = onEnterTrainingPage;

document.addEventListener('DOMContentLoaded', () => {
  prepareTrainingModule();
});