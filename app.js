(() => {
  const PROFILE = window.PROFILE;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  // Toast
  function toast(msg) {
    const t = $("#toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => t.classList.remove("show"), 2500);
  }

  // App Init & Immediate Reveal
  function initAppVisibility() {
    const appMain = $("#appMain");
    if (appMain) appMain.classList.add("ready");

    // Reveal visible elements immediately
    setTimeout(() => {
      document.querySelectorAll('.reveal, .reveal-stagger, .reveal-left, .reveal-right, .reveal-anim').forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight + 100) {
          el.classList.add('in');
        }
      });
    }, 50);
  }

  // 3D Coverflow Projects Carousel
  function initProjectsCarousel() {
    const stage = $("#projStage");
    const dotsContainer = $("#projDots");
    const counterCurrent = $("#projCounterCurrent");
    const counterTotal = $("#projCounterTotal");
    const showcase = $("#projectsShowcase");
    if (!stage || !PROFILE.projects || PROFILE.projects.length === 0) return;

    const projects = PROFILE.projects;
    const total = projects.length;
    let currentIndex = 0;

    // Set total counter
    if (counterTotal) {
      counterTotal.textContent = String(total).padStart(2, "0");
    }

    // Render Cards in Stage
    // Render Cards in Stage (Image Only from outside)
    stage.innerHTML = projects.map((p, i) => {
      const safeTitle = p.title.replace(/'/g, "\\'").replace(/"/g, "&quot;");
      return `
        <article class="proj-card" data-index="${i}" title="${safeTitle}">
          <div class="proj-card-inner">
            <div class="proj-card-media">
              <div class="proj-media-glow"></div>
              <img src="${p.image}" alt="${p.title}" class="proj-media-img" loading="lazy" />
              <div class="proj-media-overlay">
                <div class="proj-media-tag-hint">
                  <span class="proj-media-title-text">${safeTitle}</span>
                  <span class="proj-media-action-pill">
                    <span>Details</span>
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join("");

    // Render Pagination Dots
    if (dotsContainer) {
      dotsContainer.innerHTML = projects.map((_, i) => `
        <button type="button" class="proj-dot ${i === 0 ? 'is-active' : ''}" data-dot-index="${i}" aria-label="Go to project ${i + 1}"></button>
      `).join("");

      // Dot click handlers
      dotsContainer.querySelectorAll(".proj-dot").forEach(dot => {
        dot.addEventListener("click", () => {
          const idx = parseInt(dot.getAttribute("data-dot-index"), 10);
          goTo(idx);
        });
      });
    }

    const cards = Array.from(stage.querySelectorAll(".proj-card"));

    // Attach click listeners to cards: click on side card rotates, click on center active card opens full details modal!
    cards.forEach((card, i) => {
      card.addEventListener("click", (e) => {
        if (i !== currentIndex) {
          e.preventDefault();
          goTo(i);
        } else {
          window.openProjectModal(projects[i].title);
        }
      });
    });

    // Update positions and visual classes
    function updateCarousel() {
      cards.forEach((card, i) => {
        card.classList.remove("is-active", "is-prev", "is-next", "is-far-prev", "is-far-next", "is-hidden");

        let diff = i - currentIndex;
        // Circular difference
        if (diff > total / 2) diff -= total;
        if (diff < -total / 2) diff += total;

        if (diff === 0) {
          card.classList.add("is-active");
        } else if (diff === -1) {
          card.classList.add("is-prev");
        } else if (diff === 1) {
          card.classList.add("is-next");
        } else if (diff === -2) {
          card.classList.add("is-far-prev");
        } else if (diff === 2) {
          card.classList.add("is-far-next");
        } else {
          card.classList.add("is-hidden");
        }
      });

      // Update counter
      if (counterCurrent) {
        counterCurrent.textContent = String(currentIndex + 1).padStart(2, "0");
      }

      // Update dots
      if (dotsContainer) {
        dotsContainer.querySelectorAll(".proj-dot").forEach((d, i) => {
          d.classList.toggle("is-active", i === currentIndex);
        });
      }
    }

    function goTo(index) {
      currentIndex = (index + total) % total;
      updateCarousel();
    }

    function next() {
      goTo(currentIndex + 1);
    }

    function prev() {
      goTo(currentIndex - 1);
    }

    // Attach button listeners
    const topPrev = $("#projTopPrev");
    const topNext = $("#projTopNext");
    const sidePrev = $("#projSidePrev");
    const sideNext = $("#projSideNext");

    if (topPrev) topPrev.addEventListener("click", prev);
    if (topNext) topNext.addEventListener("click", next);
    if (sidePrev) sidePrev.addEventListener("click", prev);
    if (sideNext) sideNext.addEventListener("click", next);

    // Keyboard navigation
    window.addEventListener("keydown", (e) => {
      if ($("#modalBg") && $("#modalBg").classList.contains("open")) return;
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if (e.key === "ArrowLeft") {
        prev();
      } else if (e.key === "ArrowRight") {
        next();
      }
    });

    // Touch & Mouse Swipe / Drag support
    if (showcase) {
      let touchStartX = 0;
      let touchEndX = 0;
      let isDragging = false;
      let dragStartX = 0;

      showcase.addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      showcase.addEventListener("touchend", (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchEndX - touchStartX;
        if (Math.abs(diff) > 45) {
          if (diff < 0) next();
          else prev();
        }
      }, { passive: true });

      showcase.addEventListener("mousedown", (e) => {
        if (e.target.closest("button") || e.target.closest("a")) return;
        isDragging = true;
        dragStartX = e.clientX;
      });

      window.addEventListener("mouseup", (e) => {
        if (!isDragging) return;
        isDragging = false;
        const diff = e.clientX - dragStartX;
        if (Math.abs(diff) > 60) {
          if (diff < 0) next();
          else prev();
        }
      });
    }

    // Initialize initial state
    updateCarousel();
  }

  // Reveal Animations
  function initReveal() {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -20px 0px" }
    );
    $$(".reveal, .reveal-stagger, .reveal-anim, .reveal-left, .reveal-right").forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) {
        el.classList.add("in");
      }
      io.observe(el);
    });
  }

  // Enhanced Modal for full project details
  function initModal() {
    const modalBg = $("#modalBg");
    const closeBtn = $("#modalClose");

    window.openProjectModal = function (title) {
      const project = PROFILE.projects.find((p) => p.title === title);
      if (!project || !modalBg) return;

      $("#modalTitle").textContent = project.title;
      $("#modalDesc").textContent = project.fullDescription || project.desc;
      $("#modalImgBg").src = project.image;
      $("#modalImg").src = project.image;
      $("#modalCat").textContent = project.category || "Selected Project";

      // Features list
      const featuresWrap = $("#modalFeaturesWrap");
      const featuresList = $("#modalFeaturesList");
      if (featuresWrap && featuresList) {
        if (project.features && project.features.length > 0) {
          featuresWrap.style.display = "block";
          featuresList.innerHTML = project.features.map(f => `
            <li class="modal-feature-item">
              <i class="fa-solid fa-circle-check modal-feature-icon"></i>
              <span>${f}</span>
            </li>
          `).join("");
        } else {
          featuresWrap.style.display = "none";
          featuresList.innerHTML = "";
        }
      }

      const tagsContainer = $("#modalTags");
      if (tagsContainer) {
        tagsContainer.innerHTML = (project.tags || [])
          .map((t) => `<div class="modal-tag">${t}</div>`)
          .join("");
      }

      const btnLive = $("#modalLive");
      if (btnLive) {
        btnLive.style.display = project.live ? "inline-flex" : "none";
        btnLive.href = project.live || "#";
      }

      const btnGit = $("#modalGit");
      if (btnGit) {
        btnGit.style.display = project.github ? "inline-flex" : "none";
        btnGit.href = project.github || "#";
      }

      modalBg.classList.add("open");
      document.body.style.overflow = "hidden";
    };

    window.closeProjectModal = function () {
      if (modalBg) {
        modalBg.classList.remove("open");
        document.body.style.overflow = "";
      }
    };

    if (closeBtn) closeBtn.addEventListener("click", window.closeProjectModal);
    if (modalBg) modalBg.addEventListener("click", (e) => {
      if (e.target === modalBg) window.closeProjectModal();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modalBg && modalBg.classList.contains("open")) {
        window.closeProjectModal();
      }
    });
  }

  // Copy Email & Contact
  function initContact() {
    const copyBtn = $("#copyBtn");
    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText("nancy.ahmed.abdelgawad@gmail.com");
          toast("Email copied to clipboard!");
        } catch {
          toast("Failed to copy email.");
        }
      });
    }
  }

  // ── Lanyard ID Badge: Fixed Anchor & Damped Pendulum Physics ──
  function initLanyard() {
    const badge = $("#idBadge");
    const wrapper = $("#lanyardWrapper") || (badge ? badge.parentElement : null);
    if (!badge || !wrapper) return;

    const strap = badge.querySelector(".lanyard-strap");
    const hardware = badge.querySelector(".lanyard-hardware");
    const card = badge.querySelector(".id-card-holder");
    if (strap) strap.style.transformOrigin = "50% 0px";

    if (card && !card.querySelector(".id-card-back")) {
      const back = document.createElement("div");
      back.className = "id-card-back";
      card.appendChild(back);
    }

    // Anchor point calculation:
    // Anchor top-center is locked horizontally at the center of the right column
    // without any horizontal travel, sliding animations, or layout jumps.
    function setLanyardAnchor() {
      wrapper.style.left = "50%";
      wrapper.style.transform = "translateX(-50%)";
    }

    // Set initial anchor position synchronously BEFORE first paint
    setLanyardAnchor();
    badge.style.transformOrigin = "50% 0px";

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

    // Physics state
    let isDragging = false;
    // Initial damped pendulum swing (about ±4° decaying to 0 in ~1.5s)
    let angle = prefersReducedMotion ? 0 : 4.0;
    let omega = 0;
    const G = 0.16;      // Gravity factor for natural swing cycle
    const DAMP = 0.94;   // Damping constant: 4° decays to 0 within ~90 frames (1.5s)
    const MAX_A = 70;
    const history = [];

    // Idle sway constants & state
    const SWAY_AMP = 3;
    const SWAY_PERIOD = 3.6;
    let idle = prefersReducedMotion ? 0 : 1;

    // 360 Spin Fling constants & state
    const SPIN_SPEED = 1.4; // px/ms
    const SPIN_MS = 1200;
    let spin = null;
    const pointerSamples = [];

    // Elastic spring pull & flip constants
    const MAX_PULL = 150;
    const STRAP_H = 200;
    const PULL_K = 0.1;
    const PULL_DAMP = 0.93;
    const BOB_AMP = 4;
    const BOB_PERIOD = 1.8;
    const FLIP_FLING = 1.2;
    const FLIP_PULL = 60;
    const FLIP_TURN_MS = 1500;

    // Elastic spring & flip state
    let pull = 0;
    let pullVel = 0;
    let pullTarget = 0;
    let grabY = 0;
    let flipTurn = null; // { t0 }
    let flipExtra = 0;
    let lastShowBack = false;

    // Pivot calculation: top-center of fixed lanyard anchor
    function getPivot() {
      const r = wrapper.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top };
    }

    badge.style.transform = `rotate(${angle}deg)`;

    // Wait until layout/fonts/images settle, then fade in over ~400ms with fixed anchor
    requestAnimationFrame(() => {
      setLanyardAnchor();
      requestAnimationFrame(() => {
        wrapper.style.opacity = "1";
      });
    });

    // Window resize recalculates anchor cleanly without jumps
    window.addEventListener("resize", () => {
      setLanyardAnchor();
    });

    // Pendulum physics loop
    function frame() {
      if (prefersReducedMotion) {
        idle = 0;
      } else if (isDragging || spin) {
        idle += (0 - idle) * 0.25;
      } else {
        idle += (1 - idle) * 0.03;
      }

      if (!isDragging) {
        if (!prefersReducedMotion) {
          if (Math.abs(angle) > 0.02 || Math.abs(omega) > 0.002) {
            // α = -G * sin(θ)
            const alpha = -G * Math.sin(angle * (Math.PI / 180));
            omega = (omega + alpha) * DAMP;
            angle += omega;
          } else {
            angle = 0;
            omega = 0;
          }
        } else {
          angle = 0;
          omega = 0;
        }

        // Elastic spring bounce physics for pull
        pullVel = (pullVel - PULL_K * pull) * PULL_DAMP;
        pull += pullVel;
        if (Math.abs(pull) < 0.05 && Math.abs(pullVel) < 0.05) {
          pull = 0;
          pullVel = 0;
        }
      } else {
        // While dragging: ease pull towards pullTarget
        pull += (pullTarget - pull) * 0.4;
        pullVel = 0;
      }

      const now = performance.now();
      const sway = SWAY_AMP * idle * Math.sin((now / 1000) * ((2 * Math.PI) / SWAY_PERIOD));

      let spinOffset = 0;
      if (spin) {
        const t = Math.min(1, (now - spin.t0) / SPIN_MS);
        const c1 = 1.1;
        const c3 = c1 + 1;
        const diff = t - 1;
        const e = 1 + c3 * diff * diff * diff + c1 * diff * diff;
        spinOffset = spin.dir * 360 * e;
        if (t >= 1) {
          spin = null;
          spinOffset = 0;
        }
      }

      // Smooth calm 360 turn on card flip
      if (flipTurn) {
        const t = Math.min(1, (now - flipTurn.t0) / FLIP_TURN_MS);
        const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // easeInOutCubic
        flipExtra = 360 * e;
        if (t >= 1) {
          flipTurn = null;
          flipExtra = 0;
        }
      }

      // 1) Rotate entire pendulum badge
      badge.style.transform = `rotate(${angle + sway + spinOffset}deg)`;

      // 2 & 4) Elastic spring: stretch, bob, gentle bounce tilt, and calm 360 card flip
      const bob = prefersReducedMotion ? 0 : BOB_AMP * idle * Math.sin((now / 1000) * ((2 * Math.PI) / BOB_PERIOD));
      const p = pull + bob;
      const tilt = prefersReducedMotion ? 0 : Math.max(-22, Math.min(22, p * 0.3));
      const flip = tilt + flipExtra;

      // Plain card back visibility toggle (facing away: between 90 and 270 deg)
      const f = ((flip % 360) + 360) % 360;
      const showBack = f > 90 && f < 270;
      if (showBack !== lastShowBack) {
        card.classList.toggle("show-back", showBack);
        lastShowBack = showBack;
      }

      if (strap) {
        const strapScaleY = Math.max(0.1, (STRAP_H + p) / STRAP_H);
        strap.style.transform = `scaleY(${strapScaleY})`;
      }
      if (hardware) {
        hardware.style.transform = `translateY(${p}px)`;
      }
      if (card) {
        card.style.transform = `translateY(${p}px) perspective(900px) rotateY(${flip}deg)`;
      }

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    function onRelease() {
      const now = performance.now();
      let vx = 0;
      let vy = 0;

      if (pointerSamples.length >= 2) {
        const lastSample = pointerSamples[pointerSamples.length - 1];
        if (now - lastSample.t <= 80) {
          const recent = pointerSamples.filter((s) => now - s.t <= 120);
          if (recent.length >= 2) {
            const first = recent[0];
            const last = recent[recent.length - 1];
            const dt = last.t - first.t;
            if (dt > 0) {
              vx = (last.x - first.x) / dt;
              vy = (last.y - first.y) / dt;
            }
          }
        }
      }

      // Elastic pull bounce on release
      pullVel = clamp(vy * 4, -25, 25);
      const flingDown = vy >= FLIP_FLING && vy > 1.3 * Math.abs(vx);
      if (!prefersReducedMotion && (flingDown || pull > FLIP_PULL) && !flipTurn) {
        flipTurn = { t0: performance.now() };
      }

      // Strong sideways fling = 360 spin or standard pendulum momentum
      if (
        !prefersReducedMotion &&
        Math.abs(vx) >= SPIN_SPEED &&
        Math.abs(vx) > 1.3 * Math.abs(vy)
      ) {
        spin = { dir: vx > 0 ? -1 : 1, t0: now };
        omega = 0;
      } else if (!prefersReducedMotion && history.length >= 2) {
        const first = history[0];
        const last = history[history.length - 1];
        const dt = Math.max(8, last.t - first.t);
        omega = Math.max(-14, Math.min(14, ((last.a - first.a) / dt) * 18));
      } else {
        omega = 0;
      }
    }

    // ── Mouse Drag: pivots around fixed anchor ──
    badge.addEventListener("mousedown", (e) => {
      if (spin) return;
      isDragging = true;
      history.length = 0;
      history.push({ a: angle, t: performance.now() });
      pointerSamples.length = 0;
      pointerSamples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      grabY = e.clientY;
      pullTarget = 0;
      badge.style.cursor = "grabbing";
      e.preventDefault();
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const piv = getPivot();
      const raw = -Math.atan2(e.clientX - piv.x, e.clientY - piv.y) * (180 / Math.PI);
      angle = Math.max(-MAX_A, Math.min(MAX_A, raw));
      const now = performance.now();
      history.push({ a: angle, t: now });
      if (history.length > 6) history.shift();
      pointerSamples.push({ x: e.clientX, y: e.clientY, t: now });
      if (pointerSamples.length > 10) pointerSamples.shift();

      pullTarget = clamp(e.clientY - grabY, 0, MAX_PULL);
    });

    window.addEventListener("mouseup", () => {
      if (!isDragging) return;
      isDragging = false;
      badge.style.cursor = "grab";
      onRelease();
    });

    // ── Touch Drag: pivots around fixed anchor ──
    badge.addEventListener("touchstart", (e) => {
      if (spin) return;
      isDragging = true;
      history.length = 0;
      history.push({ a: angle, t: performance.now() });
      pointerSamples.length = 0;
      const t = e.touches[0];
      if (t) {
        pointerSamples.push({ x: t.clientX, y: t.clientY, t: performance.now() });
        grabY = t.clientY;
      }
      pullTarget = 0;
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
      if (!isDragging) return;
      const t = e.touches[0];
      if (!t) return;
      const piv = getPivot();
      const raw = -Math.atan2(t.clientX - piv.x, t.clientY - piv.y) * (180 / Math.PI);
      angle = Math.max(-MAX_A, Math.min(MAX_A, raw));
      const now = performance.now();
      history.push({ a: angle, t: now });
      if (history.length > 6) history.shift();
      pointerSamples.push({ x: t.clientX, y: t.clientY, t: now });
      if (pointerSamples.length > 10) pointerSamples.shift();

      pullTarget = clamp(t.clientY - grabY, 0, MAX_PULL);
    }, { passive: true });

    window.addEventListener("touchend", () => {
      if (!isDragging) return;
      isDragging = false;
      onRelease();
    });
  }

  // Scroll Spy for Nav
  function initNavScrollSpy() {
    const navLinks = $$(".nav-link");
    const sections = ["#home", "#about", "#experience", "#work", "#services", "#contact"]
      .map(id => $(id))
      .filter(Boolean);

    window.addEventListener("scroll", () => {
      let currentSectionId = "";
      const scrollPos = window.scrollY + 220;

      sections.forEach(sec => {
        if (sec.offsetTop <= scrollPos) {
          currentSectionId = sec.getAttribute("id");
        }
      });

      if (currentSectionId) {
        navLinks.forEach(link => {
          const href = link.getAttribute("href");
          if (href === `#${currentSectionId}`) {
            link.classList.add("active");
          } else {
            link.classList.remove("active");
          }
        });
      }
    }, { passive: true });
  }

  // Scroll to Top
  function initScrollTop() {
    const btn = $("#scrollTop");
    if (!btn) return;
    window.addEventListener("scroll", () => {
      if (window.scrollY > 300) {
        btn.classList.add("is-visible");
      } else {
        btn.classList.remove("is-visible");
      }
    }, { passive: true });

    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Boot
  function boot() {
    initAppVisibility();
    initNavScrollSpy();
    initProjectsCarousel();
    initReveal();
    initModal();
    initContact();
    initLanyard();
    initScrollTop();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
