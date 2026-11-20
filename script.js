const projects = [
  {
    title: "SILICON BLOOM",
    year: "2026",
    scope: "AIGC Art Direction · CGI",
    image: "./assets/silicon-bloom.svg",
    alt: "硅基花卉概念视觉",
    lede: "当自然形态由硅基逻辑重新生长，花朵成为计算、欲望与生命之间的一次视觉实验。",
  },
  {
    title: "CHROME MEMORY",
    year: "2025",
    scope: "Campaign Visual · 3D",
    image: "./assets/chrome-memory.svg",
    alt: "液态金属与记忆概念视觉",
    lede: "以液态金属模拟记忆的反射与变形，让品牌叙事在柔软和锋利之间保持张力。",
  },
  {
    title: "BODY / SIGNAL",
    year: "2025",
    scope: "AI Film · Visual Identity",
    image: "./assets/body-signal.svg",
    alt: "人体信号与数字身份概念视觉",
    lede: "一次关于数字身份的视觉研究：身体被转译成信号，情绪则在噪点与红光之间被感知。",
  },
  {
    title: "SOFT MACHINE",
    year: "2024",
    scope: "Product World · Art Direction",
    image: "./assets/soft-machine.svg",
    alt: "柔软机械概念视觉",
    lede: "让工业感退后一步，把精密机械放进柔软、明亮、带有生命感的产品世界。",
  },
];

const body = document.body;
const loader = document.querySelector("#loader");
const loaderCount = document.querySelector("#loader-count");
const pageProgress = document.querySelector("#page-progress");
const header = document.querySelector("#site-header");
const menuButton = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector("#mobile-nav");
const stage = document.querySelector("#stage");
const track = document.querySelector("#horizontal-track");
const modal = document.querySelector("#project-modal");
const modalClose = document.querySelector(".modal-close");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobileQuery = window.matchMedia("(max-width: 900px)");
const heroCopy = document.querySelector(".hero-copy");
const foldTargets = [...document.querySelectorAll(".hero-copy h1")];
let foldChars = [];
let foldPlayed = false;
let heroInView = true;

function prepareFoldText() {
  if (!window.gsap || reduceMotion) return;

  foldTargets.forEach((target) => {
    const text = target.textContent;
    const fragment = document.createDocumentFragment();

    Array.from(text).forEach((character) => {
      const span = document.createElement("span");
      span.className = "fold-char";
      span.setAttribute("aria-hidden", "true");
      span.textContent = character === " " ? "\u00a0" : character;
      fragment.append(span);
      foldChars.push(span);
    });

    target.setAttribute("aria-label", text);
    target.replaceChildren(fragment);
  });

  window.gsap.set(foldChars, {
    rotationX: -92,
    opacity: 0,
    transformOrigin: "50% 0%",
    transformPerspective: 700,
  });
}

function playFoldText() {
  if (!window.gsap || reduceMotion || foldPlayed || foldChars.length === 0) return;

  foldPlayed = true;
  window.gsap.to(foldChars, {
    rotationX: 0,
    opacity: 1,
    duration: 0.65,
    stagger: 0.045,
    ease: "power3.out",
  });
}

prepareFoldText();

if ("IntersectionObserver" in window) {
  const foldObserver = new IntersectionObserver(
    ([entry]) => {
      heroInView = entry.isIntersecting;
      if (heroInView && loaderDone) playFoldText();
    },
    { threshold: [0, 0.2] },
  );

  foldObserver.observe(heroCopy);
}

let progressValue = 0;
let loaderDone = false;

body.classList.add("is-locked");

const loaderTimer = window.setInterval(() => {
  progressValue = Math.min(100, progressValue + Math.ceil(Math.random() * 16));
  loaderCount.textContent = String(progressValue).padStart(3, "0");

  if (progressValue === 100) finishLoader();
}, reduceMotion ? 20 : 80);

function finishLoader() {
  if (loaderDone) return;
  loaderDone = true;
  window.clearInterval(loaderTimer);
  loaderCount.textContent = "100";
  loader.classList.add("is-complete");
  body.classList.remove("is-locked");
  updateStage();

  window.setTimeout(() => {
    if (heroInView) playFoldText();
  }, 320);
}

window.setTimeout(finishLoader, 2300);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function updateStage() {
  if (mobileQuery.matches) {
    track.style.transform = "none";
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const progress = total > 0 ? clamp(window.scrollY / total, 0, 1) : 0;
    pageProgress.textContent = `${String(Math.round(progress * 100)).padStart(3, "0")}%`;
    header.classList.remove("is-contact");
    return;
  }

  const scrollRange = stage.offsetHeight - window.innerHeight;
  const progress = scrollRange > 0 ? clamp((window.scrollY - stage.offsetTop) / scrollRange, 0, 1) : 0;
  const maxShift = Math.max(0, track.scrollWidth - window.innerWidth);

  track.style.transform = `translate3d(${-maxShift * progress}px, 0, 0)`;
  pageProgress.textContent = `${String(Math.round(progress * 100)).padStart(3, "0")}%`;
  header.classList.toggle("is-contact", progress > 0.83);
}

let frameRequested = false;
function requestStageUpdate() {
  if (frameRequested) return;
  frameRequested = true;
  window.requestAnimationFrame(() => {
    frameRequested = false;
    updateStage();
  });
}

window.addEventListener("scroll", requestStageUpdate, { passive: true });
window.addEventListener("resize", requestStageUpdate);
mobileQuery.addEventListener("change", requestStageUpdate);
document.fonts.ready.then(requestStageUpdate);
window.requestAnimationFrame(updateStage);

function closeMobileNav() {
  menuButton.setAttribute("aria-expanded", "false");
  mobileNav.classList.remove("is-open");
  body.classList.remove("is-locked");
}

menuButton.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  mobileNav.classList.toggle("is-open", !isOpen);
  body.classList.toggle("is-locked", !isOpen);
});

function navigateTo(name) {
  closeMobileNav();

  if (mobileQuery.matches) {
    const target =
      name === "top"
        ? document.querySelector(".hero-scene")
        : name === "works"
          ? document.querySelector("#works")
          : name === "about"
            ? document.querySelector("#about")
            : document.querySelector("#personal-info");
    const top = target.getBoundingClientRect().top + window.scrollY - (name === "top" ? 0 : 55);
    window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
    return;
  }

  if (name === "top") {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    return;
  }

  const target =
    name === "works"
      ? document.querySelector("#works")
      : name === "about"
        ? document.querySelector("#about")
        : document.querySelector("#contact");
  const maxShift = Math.max(0, track.scrollWidth - window.innerWidth);
  const ratio = maxShift > 0 ? target.offsetLeft / maxShift : 1;
  const maxScroll = stage.offsetHeight - window.innerHeight;
  window.scrollTo({
    top: stage.offsetTop + ratio * maxScroll,
    behavior: reduceMotion ? "auto" : "smooth",
  });
}

document.querySelectorAll("[data-navigate]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    navigateTo(link.dataset.navigate);
  });
});

document.querySelectorAll("a, button").forEach((element) => {
  element.classList.add("cursor-target");
  const label =
    element.dataset.cursorLabel ||
    element.getAttribute("aria-label") ||
    element.textContent.replace(/\s+/g, " ").trim();

  if (label) element.dataset.cursorLabel = label.slice(0, 18);
});

[
  [".project-preview", "VIEW"],
  [".project-copy h2", "VIEW"],
  [".about-art", "ABOUT"],
].forEach(([selector, label]) => {
  document.querySelectorAll(selector).forEach((element) => {
    element.classList.add("cursor-target");
    element.dataset.cursorLabel ||= label;
  });
});

if (window.TargetCursor) {
  new window.TargetCursor({
    cursorColor: "#ff0000",
    cursorColorOnTarget: "#ff0000",
    spinDuration: 2,
    hideDefaultCursor: true,
    parallaxOn: true,
  });
}

document.querySelectorAll("[data-open-project]").forEach((button) => {
  button.addEventListener("click", () => {
    const index = Number(button.dataset.openProject);
    const project = projects[index];

    document.querySelector("#modal-title").textContent = project.title;
    document.querySelector("#modal-year").textContent = project.year;
    document.querySelector("#modal-scope").textContent = project.scope;
    document.querySelector("#modal-lede").textContent = project.lede;
    document.querySelector("#modal-index").textContent = String(index + 1).padStart(2, "0");

    const modalImage = document.querySelector("#modal-image");
    modalImage.src = project.image;
    modalImage.alt = project.alt;

    body.classList.add("is-locked");
    modal.showModal();
    modalClose.focus();
  });
});

function closeModal() {
  modal.close();
  body.classList.remove("is-locked");
}

modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});
modal.addEventListener("close", () => body.classList.remove("is-locked"));

const hobbyList = document.querySelector(".hobby-list");
const hobbyButtons = [...document.querySelectorAll(".hobby-list button")];
const hobbySlides = [...document.querySelectorAll(".hobby-slide")];
const hobbyIndex = document.querySelector("#hobby-index");
let activeHobby = 0;
let hobbyTimer;

function showHobby(index) {
  activeHobby = (index + hobbySlides.length) % hobbySlides.length;
  hobbyButtons.forEach((button, buttonIndex) => {
    button.classList.toggle("is-active", buttonIndex === activeHobby);
  });
  hobbySlides.forEach((slide, slideIndex) => {
    slide.classList.toggle("is-active", slideIndex === activeHobby);
  });
  hobbyIndex.textContent = String(activeHobby + 1).padStart(2, "0");
}

function stopHobbyCarousel() {
  window.clearInterval(hobbyTimer);
  hobbyTimer = undefined;
}

function startHobbyCarousel() {
  stopHobbyCarousel();
  if (reduceMotion || hobbySlides.length < 2) return;
  hobbyTimer = window.setInterval(() => showHobby(activeHobby + 1), 4200);
}

hobbyButtons.forEach((button, index) => {
  button.addEventListener("pointerenter", () => {
    stopHobbyCarousel();
    showHobby(index);
  });
  button.addEventListener("focus", () => showHobby(index));
  button.addEventListener("click", () => showHobby(index));
});

hobbyList.addEventListener("pointerleave", startHobbyCarousel);
showHobby(0);
startHobbyCarousel();
