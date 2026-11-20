(() => {
  const canvas = document.querySelector("#aurora");
  const context = canvas?.getContext("2d");

  if (!canvas || !context) return;

  const settings = {
    speed: 0.6,
    scale: 1.5,
    brightness: 1,
    color1: "#f7f7f7",
    color2: "#ff0000",
    bandHeight: 0.6,
    bandSpread: 1,
    mouseInfluence: 0.25,
  };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const color1 = [247, 247, 247];
  const color2 = [255, 0, 0];
  const rgba = (color, alpha) => `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;

  let width = 0;
  let height = 0;
  let time = 0;
  let lastFrame = 0;
  let animationFrame = 0;
  let pointerX = 0.5;
  let pointerY = 0.5;
  let targetX = 0.5;
  let targetY = 0.5;
  let pulse = 0;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    if (reducedMotion) draw();
  }

  function waveY(x, offset, phase, amplitude) {
    const scale = settings.scale;
    const base = height * (1 - settings.bandHeight) + height * offset;
    const primary = Math.sin(x * 0.0042 * scale + time + phase) * 0.062;
    const secondary = Math.sin(x * 0.011 * scale - time * 0.7 + phase * 1.9) * 0.025;
    const detail = Math.sin(x * 0.026 * scale + time * 0.4 + phase) * 0.009;
    const pointerDrift = (pointerY - 0.5) * height * 0.11 * settings.mouseInfluence;
    const pulseLift = Math.sin(pulse * Math.PI) * height * 0.018 * pulse;

    return base + (primary + secondary + detail) * height * amplitude + pointerDrift + pulseLift;
  }

  function drawGlow(x, y, radius, color, alpha) {
    const glow = context.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, rgba(color, alpha));
    glow.addColorStop(0.42, rgba(color, alpha * 0.42));
    glow.addColorStop(1, rgba(color, 0));
    context.fillStyle = glow;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  function drawRibbon(offset, thickness, phase, alpha) {
    const top = [];
    const step = Math.max(10, width / 72);

    for (let x = -step; x <= width + step; x += step) {
      top.push([x, waveY(x, offset, phase, 1)]);
    }

    const gradient = context.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, rgba(color1, 0));
    gradient.addColorStop(0.18, rgba(color1, alpha));
    gradient.addColorStop(0.5, rgba(color1, alpha * 0.48));
    gradient.addColorStop(0.7, rgba(color2, alpha));
    gradient.addColorStop(1, rgba(color2, 0));

    context.beginPath();
    top.forEach(([x, y], index) => {
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });

    for (let index = top.length - 1; index >= 0; index -= 1) {
      const [x, y] = top[index];
      const spread = height * thickness * (0.82 + Math.sin(x * 0.008 + time + phase) * 0.18);
      context.lineTo(x, y + spread / settings.bandSpread);
    }

    context.closePath();
    context.fillStyle = gradient;
    context.fill();
  }

  function draw() {
    if (!width || !height) return;

    context.clearRect(0, 0, width, height);
    context.save();
    context.globalCompositeOperation = "screen";

    const pointerShift = (pointerX - 0.5) * width * settings.mouseInfluence;
    const upper = height * (1 - settings.bandHeight);
    const glowRadius = Math.max(width, height) * 0.62;

    drawGlow(width * 0.2 + pointerShift, upper + height * 0.03, glowRadius, color1, 0.09);
    drawGlow(width * 0.48 + pointerShift, upper + height * 0.1, glowRadius * 0.86, color2, 0.11);
    drawGlow(width * 0.82 + pointerShift, upper + height * 0.18, glowRadius * 0.74, color2, 0.08);

    drawRibbon(-0.06, 0.24, 0, 0.085);
    drawRibbon(0.03, 0.16, 2.1, 0.12);
    drawRibbon(0.12, 0.09, 4.4, 0.075);

    if (pulse > 0.001) {
      const pulseX = pointerX * width;
      const pulseY = pointerY * height;
      const pulseRadius = Math.max(width, height) * (0.16 + pulse * 0.3);
      drawGlow(pulseX, pulseY, pulseRadius, color1, pulse * 0.12);
      pulse *= 0.94;
    }

    context.restore();
  }

  function animate(now) {
    const delta = lastFrame ? Math.min(40, now - lastFrame) : 16;
    lastFrame = now;
    time += delta * 0.001 * settings.speed;
    pointerX += (targetX - pointerX) * 0.045;
    pointerY += (targetY - pointerY) * 0.045;
    draw();

    if (!document.hidden) animationFrame = window.requestAnimationFrame(animate);
  }

  function start() {
    if (reducedMotion) {
      draw();
      return;
    }

    window.cancelAnimationFrame(animationFrame);
    lastFrame = 0;
    animationFrame = window.requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener(
    "pointermove",
    (event) => {
      if (reducedMotion || event.pointerType === "touch") return;
      targetX = event.clientX / width;
      targetY = event.clientY / height;
    },
    { passive: true },
  );
  window.addEventListener("pointerdown", () => {
    if (!reducedMotion) pulse = 1;
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.cancelAnimationFrame(animationFrame);
    } else {
      start();
    }
  });

  resize();
  start();
})();
