/* ========================================================
   DATASET CONFIGURATION & IMAGE SOURCES
   ======================================================== */

const AI_IMAGE_DIR = 'images/ai/';
const REAL_IMAGE_DIR = 'images/real/';

/**
 * Formats filenames following the convention:
 * Even numbers -> 'M' (e.g., ai_2.M.png)
 * Odd numbers -> 'F' (e.g., ai_1.F.png)
 */
function getImageFilename(prefix, num) {
  const gender = (num % 2 === 0) ? 'M' : 'F';
  return `${prefix}_${num}.${gender}.png`;
}

// Generate the 400 Real image paths
const REAL_DATASET = Array.from({ length: 400 }, (_, i) => {
  const id = i + 1;
  return {
    id: `real_${id}`,
    src: `${REAL_IMAGE_DIR}${getImageFilename('real', id)}`,
    isAI: false
  };
});

// Generate the 400 AI image paths
const AI_DATASET = Array.from({ length: 400 }, (_, i) => {
  const id = i + 1;
  return {
    id: `ai_${id}`,
    src: `${AI_IMAGE_DIR}${getImageFilename('ai', id)}`,
    isAI: true
  };
});

/**
 * Helper function to pick `count` random elements from an array
 */
function getRandomSamples(array, count) {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Generates a randomized quiz set:
 * - 10 random images from real dataset
 * - 10 random images from AI dataset
 * - Shuffled order (50:50 split)
 */
function generateRandomQuizSet() {
  const randomReal = getRandomSamples(REAL_DATASET, 10);
  const randomAI = getRandomSamples(AI_DATASET, 10);

  // Combine and shuffle the 20 items
  return [...randomReal, ...randomAI].sort(() => Math.random() - 0.5);
}

// Legacy fallback array for legacy integrations
const QUIZ_DATASET = generateRandomQuizSet();

// Global Exports
window.QUIZ_DATASET = QUIZ_DATASET;
window.generateRandomQuizSet = generateRandomQuizSet;