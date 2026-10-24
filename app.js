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
    stage.innerHTML = projects.map((p, i) => {
      const safeTitle = p.title.replace(/'/g, "\\'").replace(/"/g, "&quot;");
      const tags = (p.tags || []).slice(0, 4);
      const tagsHtml = tags.map(t => `<span class="proj-tag">${t}</span>`).join("");

      // Action buttons
      let liveBtnHtml = "";
      if (p.live) {
        liveBtnHtml = `<a href="${p.live}" target="_blank" class="proj-btn-ghost" onclick="event.stopPropagation()">
          <span>LIVE DEMO</span>
          <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </a>`;
      } else if (p.github) {
        liveBtnHtml = `<a href="${p.github}" target="_blank" class="proj-btn-ghost" onclick="event.stopPropagation()">
          <span><i class="fa-brands fa-github"></i> CODE</span>
        </a>`;
      }

      return `
        <article class="proj-card" data-index="${i}">
          <div class="proj-card-inner">
            <div class="proj-card-info">
              <div class="proj-badge-top">
                <span class="proj-badge-dot"></span>
                <span>SELECTED PROJECT</span>
              </div>
              <h3 class="proj-card-title">${p.title}</h3>
              <p class="proj-card-desc">${p.desc}</p>
              <div class="proj-card-tags">
                ${tagsHtml}
              </div>
              <div class="proj-card-actions">
                <button type="button" class="proj-btn-primary" onclick="window.openProjectModal('${safeTitle}')">
                  <span>VIEW FULL DETAILS</span>
                  <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </button>
                ${liveBtnHtml}
              </div>
            </div>
            <div class="proj-card-media" onclick="window.openProjectModal('${safeTitle}')">
              <div class="proj-media-glow"></div>
              <img src="${p.image}" alt="${p.title}" class="proj-media-img" loading="lazy" />
              <div class="proj-media-overlay">
                <span class="proj-media-zoom-hint"><i class="fa-solid fa-expand"></i> View Details</span>
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

    // Attach click listeners to cards (if clicking on side card, navigate to it!)
    cards.forEach((card, i) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest("button") || e.target.closest("a")) return;
        if (i !== currentIndex) {
          e.preventDefault();
          goTo(i);
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

    window.openProjectModal = function(title) {
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

    window.closeProjectModal = function() {
      if (modalBg) {
        modalBg.classList.remove("open");
        document.body.style.overflow = "";
      }
    };

    if(closeBtn) closeBtn.addEventListener("click", window.closeProjectModal);
    if(modalBg) modalBg.addEventListener("click", (e) => {
      if(e.target === modalBg) window.closeProjectModal();
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

  // Lanyard — Auto-swing + Cursor-attached drag
  function initLanyard() {
    const badge = $("#idBadge");
    if (!badge) return;

    badge.style.transformOrigin = "50% 0px";
    badge.style.transform = "";

    // ── Drop-in animation on load ──
    const wrapper = badge.parentElement;
    wrapper.style.opacity = "0";
    wrapper.style.transform = "translateX(-50%) translateY(-420px)";

    setTimeout(() => {
      wrapper.classList.add("lanyard-drop");
      wrapper.style.opacity = "";
      wrapper.style.transform = "";
    }, 300);

    // After drop lands → start physics with big swing
    setTimeout(() => {
      wrapper.classList.remove("lanyard-drop");
      angle = 28;   // big initial angle = dramatic swing after landing
      omega = 0;
    }, 1850);

    let isDragging = false;
    let angle = -10;   // start offset → auto-swings immediately on load
    let omega =  0.4;  // initial kick so it starts moving right away
    let idleT = 0;
    const history = [];

    // ── Physics ──
    const G      = 0.11;   // gravity (controls swing speed)
    const DAMP   = 0.978;  // friction
    const IDLE_A = 4.0;    // idle sway amplitude (degrees)
    const IDLE_S = 0.009;  // idle sway speed
    const MAX_A  = 75;

    // Pivot = top-center of badge's parent (doesn't rotate, reliable)
    function getPivot() {
      const p = badge.parentElement;
      const r = p.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top };
    }

    function frame() {
      if (!isDragging) {
        // Pendulum: α = -G·sin(θ)
        const alpha = -G * Math.sin(angle * Math.PI / 180);
        omega = (omega + alpha) * DAMP;
        angle += omega;

        // Idle sway when energy is nearly gone
        if (Math.abs(omega) < 0.07 && Math.abs(angle) < 3) {
          idleT += IDLE_S;
          angle += (Math.sin(idleT) * IDLE_A - angle) * 0.016;
          omega *= 0.82;
        }
      }

      badge.style.transform = `rotate(${angle}deg)`;
      requestAnimationFrame(frame);
    }
    frame();

    // ── Mouse: true geometric angle from pivot to cursor ──
    badge.addEventListener("mousedown", (e) => {
      isDragging = true;
      history.length = 0;
      history.push({ a: angle, t: performance.now() });
      badge.style.cursor = "grabbing";
      e.preventDefault();
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const piv = getPivot();
      // atan2(dx, dy) = angle from vertical straight down
      const raw = Math.atan2(e.clientX - piv.x, e.clientY - piv.y) * (180 / Math.PI);
      angle = Math.max(-MAX_A, Math.min(MAX_A, raw));
      history.push({ a: angle, t: performance.now() });
      if (history.length > 6) history.shift();
    });

    window.addEventListener("mouseup", () => {
      if (!isDragging) return;
      isDragging = false;
      badge.style.cursor = "grab";
      // Angular velocity from recent angle history → realistic fling
      if (history.length >= 2) {
        const first = history[0], last = history[history.length - 1];
        const dt = Math.max(8, last.t - first.t);
        omega = Math.max(-14, Math.min(14, (last.a - first.a) / dt * 18));
      }
    });

    // ── Touch ──
    badge.addEventListener("touchstart", (e) => {
      isDragging = true;
      history.length = 0;
      history.push({ a: angle, t: performance.now() });
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
      if (!isDragging) return;
      const t = e.touches[0];
      const piv = getPivot();
      const raw = Math.atan2(t.clientX - piv.x, t.clientY - piv.y) * (180 / Math.PI);
      angle = Math.max(-MAX_A, Math.min(MAX_A, raw));
      history.push({ a: angle, t: performance.now() });
      if (history.length > 6) history.shift();
    }, { passive: true });

    window.addEventListener("touchend", () => {
      if (!isDragging) return;
      isDragging = false;
      if (history.length >= 2) {
        const first = history[0], last = history[history.length - 1];
        const dt = Math.max(8, last.t - first.t);
        omega = Math.max(-14, Math.min(14, (last.a - first.a) / dt * 18));
      }
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

  // Automatic Background Remover: Key out black background to pure transparent PNG
  function initPortraitChromaKey() {
    const img = document.getElementById("heroPortraitImg");
    if (!img) return;

    function removeBg() {
      try {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (!w || !h) return;

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;

        // Strip pure black background (RGB <= 24)
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          if (r < 24 && g < 24 && b < 24) {
            d[i + 3] = 0;
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        if (dataUrl && dataUrl.length > 100) {
          img.src = dataUrl;
          img.style.filter = "drop-shadow(0 0 35px rgba(0, 240, 255, 0.3))";
        }
      } catch (err) {
        // GPU SVG filter handles it smoothly
      }
    }

    if (img.complete && img.naturalWidth) {
      removeBg();
    } else {
      img.addEventListener("load", removeBg, { once: true });
    }
  }

  // Boot
  function boot() {
    initAppVisibility();
    initNavScrollSpy();
    initPortraitChromaKey();
    initProjectsCarousel();
    initReveal();
    initModal();
    initContact();
    initLanyard();
    initScrollTop();
  }

  if(document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
