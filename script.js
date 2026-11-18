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
const cursor = document.querySelector(".cursor");
const modal = document.querySelector("#project-modal");
const modalClose = document.querySelector(".modal-close");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobileQuery = window.matchMedia("(max-width: 900px)");

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
            : document.querySelector("#contact");
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

if (!reduceMotion) {
  window.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  });

  document.querySelectorAll(".project-preview, .project-copy h2, .about-art").forEach((target) => {
    target.addEventListener("pointerenter", () => cursor.classList.add("is-visible"));
    target.addEventListener("pointerleave", () => cursor.classList.remove("is-visible"));
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

document.querySelector(".copy-email").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const email = button.dataset.email;

  try {
    await navigator.clipboard.writeText(email);
    button.textContent = "COPIED ✓";
    window.setTimeout(() => {
      button.textContent = "COPY EMAIL";
    }, 1800);
  } catch {
    button.textContent = email;
  }
});
