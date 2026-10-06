const header = document.querySelector("[data-header]");
const progress = document.querySelector(".scroll-progress span");
const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");
const journey = document.querySelector("[data-journey]");
const canvas = document.querySelector("[data-journey-canvas]");
const panels = [...document.querySelectorAll("[data-panel-index]")].sort(
  (a, b) => Number(a.dataset.panelIndex) - Number(b.dataset.panelIndex),
);
const journeyProgress = document.querySelector("[data-journey-progress]");
const currentPanelLabel = document.querySelector("[data-current-panel]");
const totalPanelsLabel = document.querySelector("[data-total-panels]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let frame = 0;
let lastPanelIndex = -1;

const panelPoints = panels.map((panel) => ({
  element: panel,
  x: Number(panel.dataset.x),
  y: Number(panel.dataset.y),
}));

totalPanelsLabel.textContent = String(panels.length).padStart(2, "0");

function setJourneyHeight() {
  journey.style.height = `${panels.length * window.innerHeight}px`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function smoothStep(value) {
  return value * value * (3 - 2 * value);
}

function animateNumber(element) {
  const target = Number(element.dataset.count);
  if (!Number.isFinite(target) || element.dataset.animated === "true") return;
  element.dataset.animated = "true";
  if (reduceMotion) {
    element.textContent = String(target);
    return;
  }
  const started = performance.now();
  const duration = 800;

  function draw(now) {
    const ratio = Math.min(1, (now - started) / duration);
    const eased = 1 - Math.pow(1 - ratio, 3);
    element.textContent = String(Math.round(target * eased));
    if (ratio < 1) requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

function updateJourney() {
  frame = 0;
  const viewportHeight = window.innerHeight;
  const maxStep = Math.max(0, panels.length - 1);
  const journeyTop = journey.getBoundingClientRect().top;
  const rawStep = clamp(-journeyTop / viewportHeight, 0, maxStep);
  const baseIndex = Math.min(Math.floor(rawStep), maxStep);
  const nextIndex = Math.min(baseIndex + 1, maxStep);
  const localProgress = reduceMotion ? Math.round(rawStep) - baseIndex : smoothStep(rawStep - baseIndex);
  const from = panelPoints[baseIndex];
  const to = panelPoints[nextIndex];
  const x = from.x + (to.x - from.x) * localProgress;
  const y = from.y + (to.y - from.y) * localProgress;

  const targetX = -x * window.innerWidth;
  const targetY = -y * viewportHeight;
  canvas.style.transform = `translate3d(${targetX.toFixed(2)}px, ${targetY.toFixed(2)}px, 0)`;

  const overall = maxStep > 0 ? rawStep / maxStep : 0;
  progress.style.transform = `scaleX(${overall})`;
  journeyProgress.style.transform = `scaleX(${overall})`;
  header.classList.toggle("is-scrolled", rawStep > 0.03);

  const activeIndex = clamp(Math.round(rawStep), 0, maxStep);
  if (activeIndex !== lastPanelIndex) {
    lastPanelIndex = activeIndex;
    currentPanelLabel.textContent = String(activeIndex + 1).padStart(2, "0");
    panels.forEach((panel, index) => panel.classList.toggle("is-active", index === activeIndex));
    if (activeIndex === 4) document.querySelectorAll("[data-count]").forEach(animateNumber);
  }
}

function requestJourneyUpdate() {
  if (frame) return;
  frame = requestAnimationFrame(updateJourney);
}

function scrollToPanel(panel, behavior = "smooth") {
  const index = Number(panel.dataset.panelIndex);
  window.scrollTo({ top: index * window.innerHeight, behavior });
}

document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  const id = link.getAttribute("href").slice(1);
  const panel = document.getElementById(id);
  if (!panel?.matches("[data-panel-index]")) return;
  event.preventDefault();
  history.replaceState(null, "", `#${id}`);
  scrollToPanel(panel);
  menuButton?.setAttribute("aria-expanded", "false");
  nav?.classList.remove("is-open");
});

menuButton?.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  nav.classList.toggle("is-open", !isOpen);
});

window.addEventListener("scroll", requestJourneyUpdate, { passive: true });
window.addEventListener("resize", () => {
  setJourneyHeight();
  requestJourneyUpdate();
}, { passive: true });

async function loadSiteData() {
  try {
    const response = await fetch("./data/site-data.json", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    document.querySelectorAll("[data-metric]").forEach((element) => {
      const value = data.metrics?.[element.dataset.metric];
      if (Number.isFinite(value)) {
        element.dataset.count = String(value);
        element.textContent = String(value);
      }
    });

    const updates = Array.isArray(data.approvedCandidates) ? data.approvedCandidates : [];
    const updateSection = document.querySelector("[data-approved-updates]");
    const updateList = document.querySelector("[data-approved-list]");
    if (updates.length && updateSection && updateList) {
      updates.forEach((item) => {
        const article = document.createElement("article");
        const time = document.createElement("time");
        const paragraph = document.createElement("p");
        time.dateTime = item.date;
        time.textContent = item.date;
        paragraph.textContent = item.sentence;
        article.append(time, paragraph);
        updateList.append(article);
      });
      updateSection.hidden = false;
    }
  } catch {
    // 정적 HTML의 기본 수치를 유지합니다.
  }
}

const copyEmailButton = document.querySelector("[data-copy-email]");
const copyEmailLabel = document.querySelector("[data-copy-label]");
const copyEmailNotice = document.querySelector("[data-copy-notice]");
let copyFeedbackTimer;

async function copyText(value) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // 브라우저가 클립보드 권한을 거부하면 아래 호환 방식을 시도합니다.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Clipboard copy failed");
}

copyEmailButton?.addEventListener("click", async () => {
  const email = copyEmailButton.dataset.email;
  if (!email || !copyEmailLabel) return;

  window.clearTimeout(copyFeedbackTimer);
  try {
    await copyText(email);
    copyEmailLabel.textContent = "복사되었습니다";
    copyEmailButton.classList.add("is-copied");
    if (copyEmailNotice) {
      copyEmailNotice.textContent = "이메일 주소를 복사했습니다.";
      copyEmailNotice.classList.add("is-visible");
    }
    copyFeedbackTimer = window.setTimeout(() => {
      copyEmailLabel.textContent = "이메일 복사";
      copyEmailButton.classList.remove("is-copied");
      copyEmailNotice?.classList.remove("is-visible");
    }, 2200);
  } catch {
    copyEmailLabel.textContent = "복사하지 못했습니다";
    copyEmailButton.classList.remove("is-copied");
    if (copyEmailNotice) {
      copyEmailNotice.textContent = "복사하지 못했습니다. 이메일 주소를 직접 선택해 주세요.";
      copyEmailNotice.classList.add("is-visible");
    }
    copyFeedbackTimer = window.setTimeout(() => {
      copyEmailLabel.textContent = "이메일 복사";
      copyEmailNotice?.classList.remove("is-visible");
    }, 3200);
  }
});

document.querySelector("[data-year]").textContent = String(new Date().getFullYear());
loadSiteData();
setJourneyHeight();
updateJourney();

if (location.hash) {
  const target = document.getElementById(location.hash.slice(1));
  if (target?.matches("[data-panel-index]")) {
    requestAnimationFrame(() => scrollToPanel(target, "auto"));
  }
}
