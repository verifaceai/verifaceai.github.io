/* ========================================================
   DATASET CONFIGURATION & IMAGE SOURCES
   ======================================================== */

// Base directories for image assets
const AI_IMAGE_DIR = 'images/AI/';
const REAL_IMAGE_DIR = 'images/real/';

/**
 * Helper function ensuring strict gender labeling rule:
 * Odd numbers -> 'F' (e.g., ai_1.F.png, real_3.F.png)
 * Even numbers -> 'M' (e.g., ai_2.M.png, real_4.M.png)
 */
function getImageFilename(prefix, num) {
  const gender = (num % 2 === 0) ? 'M' : 'F';
  return `${prefix}_${num}.${gender}.png`;
}

/**
 * 3-Block Training Dataset Definition
 * Exactly 12 images per block (6 AI, 6 Real) = 36 Total Drills
 */
const TRAINING_BLOCKS_DATA = [
  {
    id: 'proportionality',
    title: 'Proportionality',
    subtitle: 'Block 1 of 3: Proportionality Analysis',
    badgeText: 'Block 1: Proportionality',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: 'fa-scale-balanced',
    description: 'AI generation models often struggle with strict facial symmetry and spatial proportions. Pay close attention to pupil alignment, ear positions, nose-to-lip distance, and jaw symmetry.',
    images: [
      { src: `${AI_IMAGE_DIR}${getImageFilename('ai', 1)}`, isAI: true, feature: 'proportionality' },     // ai_1.F.png
      { src: `${REAL_IMAGE_DIR}${getImageFilename('real', 1)}`, isAI: false, feature: 'proportionality' }, // real_1.F.png
      { src: `${AI_IMAGE_DIR}${getImageFilename('ai', 2)}`, isAI: true, feature: 'proportionality' },     // ai_2.M.png
      { src: `${REAL_IMAGE_DIR}${getImageFilename('real', 2)}`, isAI: false, feature: 'proportionality' }, // real_2.M.png
      { src: `${AI_IMAGE_DIR}${getImageFilename('ai', 3)}`, isAI: true, feature: 'proportionality' },     // ai_3.F.png
      { src: `${REAL_IMAGE_DIR}${getImageFilename('real', 3)}`, isAI: false, feature: 'proportionality' }, // real_3.F.png
      { src: `${AI_IMAGE_DIR}${getImageFilename('ai', 4)}`, isAI: true, feature: 'proportionality' },     // ai_4.M.png
      { src: `${REAL_IMAGE_DIR}${getImageFilename('real', 4)}`, isAI: false, feature: 'proportionality' }, // real_4.M.png
      { src: `${AI_IMAGE_DIR}${getImageFilename('ai', 5)}`, isAI: true, feature: 'proportionality' },     // ai_5.F.png
      { src: `${REAL_IMAGE_DIR}${getImageFilename('real', 5)}`, isAI: false, feature: 'proportionality' }, // real_5.F.png
      { src: `${AI_IMAGE_DIR}${getImageFilename('ai', 6)}`, isAI: true, feature: 'proportionality' },     // ai_6.M.png
      { src: `${REAL_IMAGE_DIR}${getImageFilename('real', 6)}`, isAI: false, feature: 'proportionality' }  // real_6.M.png
    ]
  },
  {
    id: 'familiarity',
    title: 'Familiarity',
    subtitle: 'Block 2 of 3: Familiarity Analysis',
    badgeText: 'Block 2: Familiarity',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: 'fa-users-viewfinder',
    description: 'AI portraits frequently exhibit an "average face" effect. The faces look strangely familiar yet unspecific, as if synthesized from thousands of merged stock images. Look out for generic feature blending.',
    images: [
      { src: `${AI_IMAGE_DIR}${getImageFilename('ai', 7)}`, isAI: true, feature: 'familiarity' },     // ai_7.F.png
      { src: `${REAL_IMAGE_DIR}${getImageFilename('real', 7)}`, isAI: false, feature: 'familiarity' }, // real_7.F.png
      { src: `${AI_IMAGE_DIR}${getImageFilename('ai', 8)}`, isAI: true, feature: 'familiarity' },     // ai_8.M.png
      { src: `${REAL_IMAGE_DIR}${getImageFilename('real', 8)}`, isAI: false, feature: 'familiarity' }, // real_8.M.png
      { src: `${AI_IMAGE_DIR}${getImageFilename('ai', 9)}`, isAI: true, feature: 'familiarity' },     // ai_9.F.png
      { src: `${REAL_IMAGE_DIR}${getImageFilename('real', 9)}`, isAI: false, feature: 'familiarity' }, // real_9.F.png
      { src: `${AI_IMAGE_DIR}${getImageFilename('ai', 10)}`, isAI: true, feature: 'familiarity' },   // ai_10.M.png
      { src: `${REAL_IMAGE_DIR}${getImageFilename('real', 10)}`, isAI: false, feature: 'familiarity' },// real_10.M.png
      { src: `${AI_IMAGE_DIR}${getImageFilename('ai', 11)}`, isAI: true, feature: 'familiarity' },   // ai_11.F.png
      { src: `${REAL_IMAGE_DIR}${getImageFilename('real', 11)}`, isAI: false, feature: 'familiarity' },// real_11.F.png
      { src: `${AI_IMAGE_DIR}${getImageFilename('ai', 12)}`, isAI: true, feature: 'familiarity' },   // ai_12.M.png
      { src: `${REAL_IMAGE_DIR}${getImageFilename('real', 12)}`, isAI: false, feature: 'familiarity' } // real_12.M.png
    ]
  },
  {
    id: 'memorability',
    title: 'Memorability',
    subtitle: 'Block 3 of 3: Memorability Analysis',
    badgeText: 'Block 3: Memorability',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: 'fa-brain',
    description: 'Human faces carry unique imperfections—moles, asymmetrical micro-wrinkles, or unique expressions—making them memorable. AI models often yield hyper-polished, forgettable, or unnaturally smooth features.',
    images: [
      { src: `${AI_IMAGE_DIR}${getImageFilename('ai', 13)}`, isAI: true, feature: 'memorability' },   // ai_13.F.png
      { src: `${REAL_IMAGE_DIR}${getImageFilename('real', 13)}`, isAI: false, feature: 'memorability' },// real_13.F.png
      { src: `${AI_IMAGE_DIR}${getImageFilename('ai', 14)}`, isAI: true, feature: 'memorability' },   // ai_14.M.png
      { src: `${REAL_IMAGE_DIR}${getImageFilename('real', 14)}`, isAI: false, feature: 'memorability' },// real_14.M.png
      { src: `${AI_IMAGE_DIR}${getImageFilename('ai', 15)}`, isAI: true, feature: 'memorability' },   // ai_15.F.png
      { src: `${REAL_IMAGE_DIR}${getImageFilename('real', 15)}`, isAI: false, feature: 'memorability' },// real_15.F.png
      { src: `${AI_IMAGE_DIR}${getImageFilename('ai', 16)}`, isAI: true, feature: 'memorability' },   // ai_16.M.png
      { src: `${REAL_IMAGE_DIR}${getImageFilename('real', 16)}`, isAI: false, feature: 'memorability' },// real_16.M.png
      { src: `${AI_IMAGE_DIR}${getImageFilename('ai', 17)}`, isAI: true, feature: 'memorability' },   // ai_17.F.png
      { src: `${REAL_IMAGE_DIR}${getImageFilename('real', 17)}`, isAI: false, feature: 'memorability' },// real_17.F.png
      { src: `${AI_IMAGE_DIR}${getImageFilename('ai', 18)}`, isAI: true, feature: 'memorability' },   // ai_18.M.png
      { src: `${REAL_IMAGE_DIR}${getImageFilename('real', 18)}`, isAI: false, feature: 'memorability' } // real_18.M.png
    ]
  }
];

/**
 * 20-Image General Quiz Dataset
 */
const QUIZ_DATASET = Array.from({ length: 10 }, (_, i) => {
  const num = i + 1;
  return [
    { src: `${AI_IMAGE_DIR}${getImageFilename('ai', num)}`, isAI: true },
    { src: `${REAL_IMAGE_DIR}${getImageFilename('real', num)}`, isAI: false }
  ];
}).flat();