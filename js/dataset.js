/* ========================================================
   DATASET CONFIGURATION & IMAGE SOURCES
   ======================================================== */

// File path options for directory structures
const AI_IMAGE_DIR = 'images/AI/';
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

/**
 * Generates path with root or subfolder options
 */
function getImagePath(type, num) {
  const filename = getImageFilename(type, num);
  const subfolderDir = type === 'ai' ? AI_IMAGE_DIR : REAL_IMAGE_DIR;
  return `${subfolderDir}${filename}`;
}


// Generate the 400 Real image paths
const REAL_DATASET = Array.from({ length: 400 }, (_, i) => {
  const id = i + 1;
  const filename = getImageFilename('real', id);
  return {
    id: `real_${id}`,
    src: getImagePath('real', id),
    fallbackSrc: `${REAL_IMAGE_DIR}${filename}`, // ✅ Fixed: 'images/real/real_1.F.png'
    isAI: false
  };
});

// Generate the 400 AI image paths
const AI_DATASET = Array.from({ length: 400 }, (_, i) => {
  const id = i + 1;
  const filename = getImageFilename('ai', id);
  return {
    id: `ai_${id}`,
    src: getImagePath('AI', id),
    fallbackSrc: `${AI_IMAGE_DIR}${filename}`,   // ✅ Fixed: 'images/ai/ai_2.M.png'
    isAI: true
  };
});


// // Generate the 400 Real image paths
// const REAL_DATASET = Array.from({ length: 400 }, (_, i) => {
//   const id = i + 1;
//   return {
//     id: `real_${id}`,
//     src: getImagePath('real', id),
//     fallbackSrc: `${getImageFilename('real', id)}`,
//     isAI: false
//   };
// });

// // Generate the 400 AI image paths
// const AI_DATASET = Array.from({ length: 400 }, (_, i) => {
//   const id = i + 1;
//   return {
//     id: `ai_${id}`,
//     src: getImagePath('ai', id),
//     fallbackSrc: `${getImageFilename('ai', id)}`,
//     isAI: true
//   };
// });

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

// Build 3 Training Blocks (12 images each = 36 total)
const TRAINING_BLOCKS_DATA = [
  {
    id: "proportionality",
    title: "Geometric Proportionality",
    badgeText: "Block 1 • Proportionality",
    badgeClass: "bg-indigo-100 text-indigo-700 border-indigo-300",
    icon: "fa-draw-polygon",
    description: "Learn to detect unnatural mathematical symmetry, misaligned eyes, and distorted ear proportions caused by diffusion models.",
    images: [
      ...REAL_DATASET.slice(0, 6),
      ...AI_DATASET.slice(0, 6)
    ].sort(() => Math.random() - 0.5)
  },
  {
    id: "familiarity",
    title: "Composite Familiarity",
    badgeText: "Block 2 • Familiarity",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-300",
    icon: "fa-users-viewfinder",
    description: "Focus on identifying overly generic 'averaged' synthetic faces that look familiar yet eerie due to dataset blending.",
    images: [
      ...REAL_DATASET.slice(6, 12),
      ...AI_DATASET.slice(6, 12)
    ].sort(() => Math.random() - 0.5)
  },
  {
    id: "memorability",
    title: "Organic Memorability",
    badgeText: "Block 3 • Memorability",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-300",
    icon: "fa-brain",
    description: "Analyze micro-textures, skin pore realism, asymmetric light reflections, and unique personal character features.",
    images: [
      ...REAL_DATASET.slice(12, 18),
      ...AI_DATASET.slice(12, 18)
    ].sort(() => Math.random() - 0.5)
  }
];

// Fallback dataset array
const QUIZ_DATASET = generateRandomQuizSet();

// Global Exports
window.REAL_DATASET = REAL_DATASET;
window.AI_DATASET = AI_DATASET;
window.QUIZ_DATASET = QUIZ_DATASET;
window.TRAINING_BLOCKS_DATA = TRAINING_BLOCKS_DATA;
window.generateRandomQuizSet = generateRandomQuizSet;
window.getImageFilename = getImageFilename;
window.getImagePath = getImagePath;