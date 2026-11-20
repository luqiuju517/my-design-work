(() => {
  const CORNER_ANGLES = [0, 90, 180, 270];
  const QUARTER = Math.PI / 2;

  const spring = (state, goal, stiffness, damping, dt) => {
    const steps = Math.max(2, Math.ceil(dt * 60));
    const h = dt / steps;

    for (let i = 0; i < steps; i += 1) {
      state.v += (stiffness * (goal - state.x) - damping * state.v) * h;
      state.x += state.v * h;
    }
  };

  const resolveElement = (value) => (value && "current" in value ? value.current : value) || null;

  class TargetCursor {
    constructor(options = {}) {
      this.settings = {
        targetSelector: ".cursor-target",
        cursorColor: "#ffffff",
        cursorColorOnTarget: "",
        spinDuration: 2,
        hoverDuration: 0.2,
        parallaxOn: true,
        hideDefaultCursor: true,
        size: 36,
        cornerSize: 12,
        thickness: 3,
        padding: 6,
        matchRadius: true,
        dotSize: 4,
        blendMode: "difference",
        showLabel: true,
        clickEffect: true,
        container: null,
        ...options,
      };

      this.settings.hoverDuration = Math.max(0.05, this.settings.hoverDuration);
      this.settings.size = Math.max(4, this.settings.size);
      this.settings.cornerSize = Math.max(2, this.settings.cornerSize);
      this.settings.thickness = Math.max(0.5, this.settings.thickness);
      this.settings.dotSize = Math.max(0, this.settings.dotSize);

      this.host = null;
      this.root = null;
      this.styleNode = null;
      this.corners = [];
      this.dot = null;
      this.label = null;
      this.target = null;
      this.targetRadius = 0;
      this.quarter = 0;
      this.spinSpeed = 0;
      this.raf = 0;
      this.last = 0;
      this.lastLabel = "";
      this.lastColor = "";
      this.lastScope = null;

      this.pointer = { x: 0, y: 0, inside: false, seen: false, pressed: false };
      this.centerX = { x: 0, v: 0 };
      this.centerY = { x: 0, v: 0 };
      this.halfW = { x: 0, v: 0 };
      this.halfH = { x: 0, v: 0 };
      this.radius = { x: 0, v: 0 };
      this.turn = { x: 0, v: 0 };
      this.lock = { x: 0, v: 0 };
      this.press = { x: 0, v: 0 };
      this.presence = { x: 0, v: 0 };

      this.frame = this.frame.bind(this);
      this.onPointerMove = this.onPointerMove.bind(this);
      this.onPointerDown = this.onPointerDown.bind(this);
      this.onPointerUp = this.onPointerUp.bind(this);
      this.onLeave = this.onLeave.bind(this);
      this.onScroll = this.onScroll.bind(this);
      this.updateHost = this.updateHost.bind(this);

      this.finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
      this.finePointer.addEventListener("change", this.updateHost);
      this.updateHost();
    }

    updateHost() {
      const nextHost = this.finePointer.matches ? document.body : null;
      if (nextHost === this.host) return;

      this.destroyRuntime();
      this.host = nextHost;
      if (this.host) this.mount();
    }

    mount() {
      this.styleNode = document.createElement("style");
      document.head.appendChild(this.styleNode);

      this.root = document.createElement("div");
      this.root.className = "target-cursor";
      this.root.style.mixBlendMode = this.settings.blendMode;
      this.root.style.opacity = "0";
      this.root.setAttribute("aria-hidden", "true");

      this.corners = CORNER_ANGLES.map(() => {
        const corner = document.createElement("span");
        corner.className = "target-cursor__corner";
        this.root.appendChild(corner);
        return corner;
      });

      this.dot = document.createElement("span");
      this.dot.className = "target-cursor__dot";
      this.root.appendChild(this.dot);

      this.label = document.createElement("span");
      this.label.className = "target-cursor__label";
      this.root.appendChild(this.label);

      this.host.appendChild(this.root);

      window.addEventListener("pointermove", this.onPointerMove, { passive: true });
      window.addEventListener("pointerdown", this.onPointerDown, { passive: true });
      window.addEventListener("pointerup", this.onPointerUp, { passive: true });
      window.addEventListener("scroll", this.onScroll, { passive: true, capture: true });
      document.documentElement.addEventListener("pointerleave", this.onLeave);
      window.addEventListener("blur", this.onLeave);
    }

    destroyRuntime() {
      if (!this.root) return;

      window.cancelAnimationFrame(this.raf);
      this.raf = 0;
      window.removeEventListener("pointermove", this.onPointerMove);
      window.removeEventListener("pointerdown", this.onPointerDown);
      window.removeEventListener("pointerup", this.onPointerUp);
      window.removeEventListener("scroll", this.onScroll, { capture: true });
      document.documentElement.removeEventListener("pointerleave", this.onLeave);
      window.removeEventListener("blur", this.onLeave);
      this.lastScope?.removeAttribute("data-target-cursor-scope");
      this.styleNode?.remove();
      this.root.remove();

      this.root = null;
      this.styleNode = null;
      this.corners = [];
      this.dot = null;
      this.label = null;
      this.target = null;
      this.pointer = { x: 0, y: 0, inside: false, seen: false, pressed: false };
      this.last = 0;
      this.lastLabel = "";
      this.lastColor = "";
      this.lastScope = null;
    }

    scopeOf() {
      return resolveElement(this.settings.container);
    }

    hideCursor() {
      const scope = this.scopeOf();
      if (scope !== this.lastScope) {
        this.lastScope?.removeAttribute("data-target-cursor-scope");
        scope?.setAttribute("data-target-cursor-scope", "");
        this.lastScope = scope;
      }

      const selector = scope ? "[data-target-cursor-scope]" : "html";
      const rule =
        this.settings.hideDefaultCursor && this.pointer.inside
          ? `${selector}, ${selector} * { cursor: none !important; }`
          : "";

      if (this.styleNode.textContent !== rule) this.styleNode.textContent = rule;
    }

    findTarget(x, y, element) {
      const node = element || document.elementFromPoint(x, y);
      const found = node?.closest?.(this.settings.targetSelector) || null;
      const scope = this.scopeOf();
      if (found && scope && !scope.contains(found)) return null;
      return found;
    }

    lockOn(next) {
      if (next === this.target) return;
      this.target = next;

      if (this.target) {
        this.quarter = Math.round(this.turn.x / QUARTER);
        this.targetRadius =
          Number.parseFloat(getComputedStyle(this.target).borderTopLeftRadius) || 0;
        this.spinSpeed = 0;
      }
    }

    frame(now) {
      this.raf = 0;
      const s = this.settings;
      const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 1 / 60;
      this.last = now;

      if (this.target && !this.target.isConnected) this.lockOn(null);
      const rect = this.target ? this.target.getBoundingClientRect() : null;
      const locked = Boolean(rect && this.pointer.inside);
      const snapW = 4.6 / s.hoverDuration;
      const snapK = snapW * snapW;
      const snapC = 2 * 0.62 * snapW;

      spring(this.presence, this.pointer.inside ? 1 : 0, 260, 32, dt);
      spring(this.lock, locked ? 1 : 0, snapK, 2 * snapW, dt);
      spring(this.press, this.pointer.pressed && s.clickEffect ? 1 : 0, 900, 40, dt);

      let goalX = this.pointer.x;
      let goalY = this.pointer.y;
      let goalW = s.size / 2;
      let goalH = s.size / 2;
      let goalR = Math.min(2, s.cornerSize / 4);

      if (locked) {
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const lean = s.parallaxOn ? 0.08 : 0;
        const odd = Math.abs(this.quarter) % 2 === 1;
        const w = rect.width / 2 + s.padding;
        const h = rect.height / 2 + s.padding;

        goalX = cx + (this.pointer.x - cx) * lean;
        goalY = cy + (this.pointer.y - cy) * lean;
        goalW = odd ? h : w;
        goalH = odd ? w : h;
        goalR = s.matchRadius
          ? Math.min(this.targetRadius + Math.max(0, s.padding), s.cornerSize)
          : 0;
      }

      if (!this.pointer.inside && this.presence.x < 0.01) this.pointer.seen = false;
      if (!this.pointer.seen) {
        this.centerX.x = goalX;
        this.centerY.x = goalY;
        this.halfW.x = goalW;
        this.halfH.x = goalH;
        this.pointer.seen = this.pointer.inside;
      }

      const follow = locked ? snapK : 2200;
      const followC = locked ? snapC : 2 * Math.sqrt(2200);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      spring(this.centerX, goalX, follow, followC, dt);
      spring(this.centerY, goalY, follow, followC, dt);
      spring(this.halfW, goalW, snapK, snapC, dt);
      spring(this.halfH, goalH, snapK, snapC, dt);
      spring(this.radius, goalR, snapK, 2 * snapW, dt);

      if (locked) {
        spring(this.turn, this.quarter * QUARTER, snapK, snapC, dt);
      } else {
        const speed =
          s.spinDuration > 0 && !reduce ? (Math.PI * 2) / s.spinDuration : 0;
        this.spinSpeed += (speed - this.spinSpeed) * (1 - Math.exp(-dt * 3));
        this.turn.v = this.spinSpeed;
        this.turn.x += this.spinSpeed * dt;
      }

      const squeeze = 1 - this.press.x * 0.14;
      const cos = Math.cos(this.turn.x);
      const sin = Math.sin(this.turn.x);
      const w = Math.max(0, this.halfW.x) * squeeze;
      const h = Math.max(0, this.halfH.x) * squeeze;
      const local = [
        [-w, -h],
        [w, -h],
        [w, h],
        [-w, h],
      ];
      const r = Math.max(0, Math.min(this.radius.x, s.cornerSize));
      const degrees = (this.turn.x * 180) / Math.PI;
      let left = Infinity;
      let top = Infinity;

      this.corners.forEach((corner, index) => {
        const [lx, ly] = local[index];
        const x = this.centerX.x + lx * cos - ly * sin;
        const y = this.centerY.x + lx * sin + ly * cos;
        left = Math.min(left, x);
        top = Math.min(top, y);
        corner.style.transform =
          `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) ` +
          `rotate(${(CORNER_ANGLES[index] + degrees).toFixed(2)}deg)`;
        corner.style.width = `${s.cornerSize}px`;
        corner.style.height = `${s.cornerSize}px`;
        corner.style.borderWidth = `${s.thickness}px 0 0 ${s.thickness}px`;
        corner.style.borderTopLeftRadius = `${r.toFixed(2)}px`;
      });

      if (this.dot) {
        const dotScale = 1 - this.press.x * 0.35;
        this.dot.style.transform =
          `translate3d(${this.pointer.x}px, ${this.pointer.y}px, 0) ` +
          `translate(-50%, -50%) scale(${dotScale.toFixed(3)})`;
        this.dot.style.width = `${s.dotSize}px`;
        this.dot.style.height = `${s.dotSize}px`;
      }

      if (this.label) {
        const text =
          s.showLabel && this.target
            ? this.target.getAttribute("data-cursor-label") || ""
            : "";
        if (text && text !== this.lastLabel) this.label.textContent = text;
        if (text) this.lastLabel = text;
        const shown = text ? Math.max(0, Math.min(1, this.lock.x)) : 0;
        this.label.style.transform =
          `translate3d(${left.toFixed(2)}px, ${(top - 8).toFixed(2)}px, 0) ` +
          `translateY(-100%) translateY(${((1 - shown) * 4).toFixed(2)}px)`;
        this.label.style.opacity = shown.toFixed(3);
      }

      const mix = s.cursorColorOnTarget
        ? Math.round(Math.max(0, Math.min(1, this.lock.x)) * 100)
        : 0;
      const color = mix
        ? `color-mix(in oklab, ${s.cursorColorOnTarget} ${mix}%, ${s.cursorColor})`
        : s.cursorColor;

      if (color !== this.lastColor) {
        this.root.style.setProperty("--target-cursor-color", color);
        this.lastColor = color;
      }

      this.root.style.opacity = Math.max(0, Math.min(1, this.presence.x)).toFixed(3);

      const resting =
        !this.pointer.inside &&
        this.presence.x < 0.002 &&
        Math.abs(this.presence.v) < 0.002 &&
        Math.abs(this.lock.x) < 0.002 &&
        Math.abs(this.press.x) < 0.002;
      const spinning = this.pointer.inside && !locked && this.spinSpeed > 0.0001;
      const moving =
        Math.abs(this.centerX.v) +
          Math.abs(this.centerY.v) +
          Math.abs(this.halfW.v) +
          Math.abs(this.halfH.v) +
          Math.abs(this.turn.v) >
          0.01 ||
        Math.abs(goalX - this.centerX.x) + Math.abs(goalY - this.centerY.x) > 0.05 ||
        Math.abs(this.lock.v) + Math.abs(this.press.v) + Math.abs(this.presence.v) >
          0.001;

      if (!resting && (spinning || moving || locked)) this.raf = requestAnimationFrame(this.frame);
      else this.last = 0;
    }

    wake() {
      if (!this.raf) this.raf = requestAnimationFrame(this.frame);
    }

    insideScope(x, y, element) {
      const scope = this.scopeOf();
      if (!scope) return true;
      if (element && scope.contains(element)) return true;

      const box = scope.getBoundingClientRect();
      return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
    }

    onPointerMove(event) {
      if (event.pointerType && event.pointerType !== "mouse") return;

      this.pointer.x = event.clientX;
      this.pointer.y = event.clientY;
      const inside = this.insideScope(this.pointer.x, this.pointer.y, event.target);

      if (inside !== this.pointer.inside) {
        this.pointer.inside = inside;
        this.hideCursor();
      }

      this.lockOn(
        inside ? this.findTarget(this.pointer.x, this.pointer.y, event.target) : null,
      );
      this.wake();
    }

    onPointerDown(event) {
      if (event.pointerType && event.pointerType !== "mouse") return;
      this.pointer.pressed = true;
      this.wake();
    }

    onPointerUp() {
      this.pointer.pressed = false;
      this.wake();
    }

    onLeave() {
      this.pointer.inside = false;
      this.pointer.pressed = false;
      this.lockOn(null);
      this.hideCursor();
      this.wake();
    }

    onScroll() {
      if (!this.pointer.inside) return;
      this.lockOn(this.findTarget(this.pointer.x, this.pointer.y));
      this.wake();
    }
  }

  window.TargetCursor = TargetCursor;
})();
