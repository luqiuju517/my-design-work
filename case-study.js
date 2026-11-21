(() => {
  const projects = [
    {
      id: "01",
      title: "品牌设计",
      english: "BRAND DESIGN",
      year: "2026",
      scope: "品牌识别 / IP视觉",
      image: "./assets/silicon-bloom.svg",
      alt: "硅基花卉概念视觉",
      description:
        "通过品牌识别、IP视觉与AIGC艺术指导，构建统一且具有长期识别度的品牌视觉体系。",
      page: "./project-01.html",
    },
    {
      id: "02",
      title: "电商全案设计",
      english: "E-COMMERCE DESIGN",
      year: "2026",
      scope: "详情页 / 主图 / 电商视觉",
      image: "./assets/chrome-memory.svg",
      alt: "液态金属与记忆概念视觉",
      description:
        "围绕详情页、主图与店铺视觉展开全案设计，以清晰的信息层级提升产品表达和购买体验。",
      page: "./project-02.html",
    },
    {
      id: "03",
      title: "线下物料设计",
      english: "PRINT & MATERIAL",
      year: "2026",
      scope: "画册 / 包装 / 线下传播",
      image: "./assets/body-signal.svg",
      alt: "人体信号与数字身份概念视觉",
      description:
        "将品牌语言延展至画册、包装和线下传播物料，在不同媒介中保持风格的连续与完整。",
      page: "./project-03.html",
    },
    {
      id: "04",
      title: "其他设计",
      english: "OTHER DESIGN",
      year: "2026",
      scope: "字体 / 视觉实验 / AIGC",
      image: "./assets/soft-machine.svg",
      alt: "柔软机械概念视觉",
      description:
        "记录字体设计、视觉实验与新技术探索，用持续试验拓展平面设计与数字影像的边界。",
      page: "./project-04.html",
    },
  ];

  const currentId = document.body.dataset.projectId;
  const current = projects.find((project) => project.id === currentId) || projects[0];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.title = `${current.title} | AIGC®`;
  document.querySelector("[data-case-index]").textContent = current.id;
  document.querySelector("[data-case-year]").textContent = current.year;
  document.querySelector("[data-case-scope]").textContent = current.scope;
  document.querySelector("[data-case-description]").textContent = current.description;

  const title = document.querySelector("[data-case-title]");
  title.setAttribute("aria-label", current.title);
  title.dataset.title = current.title;
  title.replaceChildren(
    ...[...current.title].map((character, index) => {
      const span = document.createElement("span");
      span.className = "case-title__char";
      span.style.setProperty("--char-index", index);
      span.dataset.char = character;
      span.setAttribute("aria-hidden", "true");
      span.textContent = character;
      return span;
    }),
  );

  title.addEventListener("pointerenter", () => {
    if (reduceMotion) return;
    title.classList.remove("is-sheen");
    void title.offsetWidth;
    title.classList.add("is-sheen");
  });

  const marqueeGroup = document.createElement("span");
  marqueeGroup.className = "case-marquee__group";
  marqueeGroup.innerHTML = `${current.title}<small>${current.english} / ${current.id}</small>`;
  const marquee = document.querySelector("[data-case-marquee]");
  for (let index = 0; index < 4; index += 1) {
    marquee.append(marqueeGroup.cloneNode(true));
  }

  const cardList = document.querySelector("[data-case-cards]");
  cardList.innerHTML = projects
    .map(
      (project) => `
        <a
          class="case-card cursor-target${project.id === current.id ? " is-current" : ""}"
          href="${project.page}"
          data-cursor-label="查看${project.title}"
          ${project.id === current.id ? 'aria-current="page"' : ""}
        >
          <span class="case-card__media">
            <img src="${project.image}" alt="${project.alt}" loading="lazy" />
          </span>
          <span class="case-card__tag">${project.id} / ${project.year}</span>
          <h3>${project.title}</h3>
          <p>${project.description}</p>
        </a>
      `,
    )
    .join("");

  document.querySelectorAll("a, button").forEach((element) => {
    element.classList.add("cursor-target");
    element.dataset.cursorLabel ||=
      element.getAttribute("aria-label") ||
      element.textContent.replace(/\s+/g, " ").trim().slice(0, 18);
  });

  if (window.TargetCursor) {
    new window.TargetCursor({
      targetSelector: ".cursor-target",
      cursorColor: "#aeff62",
      cursorColorOnTarget: "#ffffff",
      spinDuration: 3.2,
      size: 32,
      dotSize: 3,
      cornerSize: 10,
      thickness: 2,
      blendMode: "normal",
    });
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.16 },
    );

    document.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));
  } else {
    document.querySelectorAll("[data-reveal]").forEach((element) => element.classList.add("is-visible"));
  }

  let scrollQueued = false;
  const updateScroll = () => {
    scrollQueued = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    document.documentElement.style.setProperty("--scroll-ratio", ratio.toFixed(4));
  };

  window.addEventListener(
    "scroll",
    () => {
      if (scrollQueued) return;
      scrollQueued = true;
      requestAnimationFrame(updateScroll);
    },
    { passive: true },
  );
  updateScroll();

  if (!reduceMotion) {
    window.addEventListener(
      "pointermove",
      (event) => {
        document.documentElement.style.setProperty(
          "--pointer-x",
          ((event.clientX / window.innerWidth - 0.5) * 2).toFixed(3),
        );
        document.documentElement.style.setProperty(
          "--pointer-y",
          ((event.clientY / window.innerHeight - 0.5) * 2).toFixed(3),
        );
      },
      { passive: true },
    );

    document.querySelectorAll(".case-card").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--tilt-x", `${(-y * 4).toFixed(2)}deg`);
        card.style.setProperty("--tilt-y", `${(x * 5).toFixed(2)}deg`);
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--tilt-x", "0deg");
        card.style.setProperty("--tilt-y", "0deg");
      });
    });
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="./"]');
    if (!link || reduceMotion) return;
    event.preventDefault();
    document.body.classList.add("is-leaving");
    window.setTimeout(() => {
      window.location.assign(link.href);
    }, 280);
  });

  requestAnimationFrame(() => document.body.classList.add("is-ready"));
})();
