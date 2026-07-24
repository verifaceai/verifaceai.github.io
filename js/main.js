/* ========================================================
   GLOBAL NAVIGATION, TESTIMONIALS & CHART ENGINE
   ======================================================== */

let testimonialsList = [];
let currentTestimonialIndex = 0;
let animationFrameId = null;
let startTime = null;
const ROTATION_DURATION = 10000; // 5 Seconds

/**
 * Single Page Application Router
 */
function navigateTo(pageId) {
  document.querySelectorAll('.page-section').forEach(section => {
    section.classList.add('hidden');
  });

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('text-indigo-600', 'bg-indigo-50');
    btn.classList.add('text-slate-600');
  });

  const targetSection = document.getElementById(`page-${pageId}`);
  const targetNavBtn = document.getElementById(`nav-${pageId}`);

  if (targetSection) targetSection.classList.remove('hidden');
  if (targetNavBtn) {
    targetNavBtn.classList.remove('text-slate-600');
    targetNavBtn.classList.add('text-indigo-600', 'bg-indigo-50');
  }

  // Page-specific trigger hooks
  if (pageId === 'training' && typeof onEnterTrainingPage === 'function') {
    onEnterTrainingPage();
  } else if (pageId === 'quiz' && typeof startQuiz === 'function') {
    startQuiz();
  } else if (pageId === 'leaderboard' && typeof window.loadGlobalLeaderboard === 'function') {
    window.loadGlobalLeaderboard();
  } else if (pageId === 'dashboard') {
    renderPerformanceChart();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.navigateTo = navigateTo;

/**
 * Trigger Chart Rendering for Dashboard
 */
function renderPerformanceChart() {
  if (typeof window.loadUserPerformanceChart === 'function') {
    window.loadUserPerformanceChart();
  }
}
window.renderPerformanceChart = renderPerformanceChart;

/**
 * Fetch testimonials from testimonials.txt and start rotation loop
 */
async function initTestimonialsCarousel() {
  const textEl = document.getElementById('testimonial-text');
  if (!textEl) return;

  try {
    const response = await fetch('testimonials.txt');
    if (!response.ok) throw new Error('Could not fetch testimonials');

    const text = await response.text();
    testimonialsList = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    if (testimonialsList.length === 0) return;

    renderDots();
    displayTestimonial(0);
    startProgressBarLoop();

  } catch (err) {
    console.warn("Testimonials load failed (using fallback):", err);
    testimonialsList = [
      '"VeriFace AI provides essential visual awareness training for modern digital forensic assessment." - Research Team'
    ];
    renderDots();
    displayTestimonial(0);
    startProgressBarLoop();
  }
}

/**
 * Render indicator dots for testimonials
 */
function renderDots() {
  const dotsEl = document.getElementById('testimonial-dots');
  if (dotsEl && testimonialsList.length > 0) {
    dotsEl.innerHTML = testimonialsList.map((_, i) => 
      `<span id="t-dot-${i}" class="w-1.5 h-1.5 rounded-full bg-slate-700 transition-all"></span>`
    ).join('');
  }
}

/**
 * Smooth 60fps Thin Progress Line loop
 */
function startProgressBarLoop() {
  const progressBar = document.getElementById('testimonial-progress-bar');
  if (!progressBar) return;

  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  startTime = performance.now();

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progressPercent = Math.min((elapsed / ROTATION_DURATION) * 100, 100);

    progressBar.style.width = `${progressPercent}%`;

    if (elapsed < ROTATION_DURATION) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      currentTestimonialIndex = (currentTestimonialIndex + 1) % testimonialsList.length;
      displayTestimonial(currentTestimonialIndex);
      
      progressBar.style.width = '0%';
      startTime = performance.now();
      animationFrameId = requestAnimationFrame(animate);
    }
  }

  animationFrameId = requestAnimationFrame(animate);
}

/**
 * Swaps testimonial content with a smooth fade
 */
function displayTestimonial(index) {
  const textEl = document.getElementById('testimonial-text');
  if (!textEl || !testimonialsList[index]) return;

  textEl.style.opacity = '0';

  setTimeout(() => {
    textEl.textContent = testimonialsList[index];
    textEl.style.opacity = '1';

    testimonialsList.forEach((_, i) => {
      const dot = document.getElementById(`t-dot-${i}`);
      if (dot) {
        if (i === index) {
          dot.className = "w-4 h-1.5 rounded-full bg-amber-400 transition-all";
        } else {
          dot.className = "w-1.5 h-1.5 rounded-full bg-slate-700 transition-all";
        }
      }
    });
  }, 250);
}

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
  initTestimonialsCarousel();
});