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

  // ── Lanyard ID Badge: Fixed Anchor & Damped Pendulum Physics ──
  function initLanyard() {
    const badge = $("#idBadge");
    const wrapper = $("#lanyardWrapper") || (badge ? badge.parentElement : null);
    if (!badge || !wrapper) return;

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

    // Physics state
    let isDragging = false;
    // Initial damped pendulum swing (about ±4° decaying to 0 in ~1.5s)
    let angle = prefersReducedMotion ? 0 : 4.0;
    let omega = 0;
    const G = 0.16;      // Gravity factor for natural swing cycle
    const DAMP = 0.94;   // Damping constant: 4° decays to 0 within ~90 frames (1.5s)
    const MAX_A = 70;
    const history = [];

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
      }

      badge.style.transform = `rotate(${angle}deg)`;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // ── Mouse Drag: pivots around fixed anchor ──
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
      const raw = Math.atan2(e.clientX - piv.x, e.clientY - piv.y) * (180 / Math.PI);
      angle = Math.max(-MAX_A, Math.min(MAX_A, raw));
      history.push({ a: angle, t: performance.now() });
      if (history.length > 6) history.shift();
    });

    window.addEventListener("mouseup", () => {
      if (!isDragging) return;
      isDragging = false;
      badge.style.cursor = "grab";
      if (!prefersReducedMotion && history.length >= 2) {
        const first = history[0], last = history[history.length - 1];
        const dt = Math.max(8, last.t - first.t);
        omega = Math.max(-14, Math.min(14, (last.a - first.a) / dt * 18));
      } else {
        omega = 0;
      }
    });

    // ── Touch Drag: pivots around fixed anchor ──
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
      if (!prefersReducedMotion && history.length >= 2) {
        const first = history[0], last = history[history.length - 1];
        const dt = Math.max(8, last.t - first.t);
        omega = Math.max(-14, Math.min(14, (last.a - first.a) / dt * 18));
      } else {
        omega = 0;
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

  // Automatic Background Remover: Flood-fill remove white or black background to pure transparent PNG
  function initPortraitChromaKey() {
    const img = document.getElementById("heroPortraitImg");
    if (!img) return;

    let processed = false;
    function attemptRemove() {
      if (processed || img.__bgRemoved) return;
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        processed = true;
        removeBg();
      }
    }

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

        // BFS flood-fill from all 4 borders to remove white/black background
        const totalPixels = w * h;
        const visited = new Uint8Array(totalPixels);
        const qx = new Int32Array(totalPixels);
        const qy = new Int32Array(totalPixels);
        let head = 0, tail = 0;

        function isBg(r, g, b) {
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const diff = max - min;
          // White or off-white background with JPEG noise tolerance
          if (min >= 165 && diff <= 36) return true;
          if (min >= 200) return true;
          // Black or near-black background
          if (max <= 42) return true;
          return false;
        }

        // Push border pixels
        for (let x = 0; x < w; x++) {
          // top border
          let idx0 = x * 4;
          if (isBg(d[idx0], d[idx0+1], d[idx0+2])) {
            visited[x] = 1;
            qx[tail] = x; qy[tail] = 0; tail++;
          }
          // bottom border
          let yB = h - 1;
          let idxB = (yB * w + x) * 4;
          if (isBg(d[idxB], d[idxB+1], d[idxB+2])) {
            visited[yB * w + x] = 1;
            qx[tail] = x; qy[tail] = yB; tail++;
          }
        }
        for (let y = 0; y < h; y++) {
          // left border
          let idxL = (y * w) * 4;
          if (!visited[y * w] && isBg(d[idxL], d[idxL+1], d[idxL+2])) {
            visited[y * w] = 1;
            qx[tail] = 0; qy[tail] = y; tail++;
          }
          // right border
          let xR = w - 1;
          let idxR = (y * w + xR) * 4;
          if (!visited[y * w + xR] && isBg(d[idxR], d[idxR+1], d[idxR+2])) {
            visited[y * w + xR] = 1;
            qx[tail] = xR; qy[tail] = y; tail++;
          }
        }

        // BFS 4-way expansion
        const dx = [1, -1, 0, 0];
        const dy = [0, 0, 1, -1];

        while (head < tail) {
          const cx = qx[head];
          const cy = qy[head];
          head++;

          const pIdx = (cy * w + cx) * 4;
          d[pIdx + 3] = 0; // Set to fully transparent

          for (let i = 0; i < 4; i++) {
            const nx = cx + dx[i];
            const ny = cy + dy[i];

            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              const nPos = ny * w + nx;
              if (!visited[nPos]) {
                const nIdx = nPos * 4;
                const nr = d[nIdx], ng = d[nIdx+1], nb = d[nIdx+2];
                if (isBg(nr, ng, nb)) {
                  visited[nPos] = 1;
                  qx[tail] = nx;
                  qy[tail] = ny;
                  tail++;
                }
              }
            }
          }
        }

        // Defringe border halo pixels
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const pos = y * w + x;
            if (visited[pos]) continue;
            const idx = pos * 4;
            const isNearTransparent = visited[pos - 1] || visited[pos + 1] || visited[pos - w] || visited[pos + w];
            if (isNearTransparent) {
              const r = d[idx], g = d[idx+1], b = d[idx+2];
              if (r > 175 && g > 175 && b > 175) {
                const brightness = (r + g + b) / 3;
                if (brightness > 220) {
                  d[idx + 3] = 0;
                } else {
                  const factor = (220 - brightness) / 45;
                  d[idx + 3] = Math.max(0, Math.min(255, Math.round(d[idx + 3] * factor)));
                }
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        if (dataUrl && dataUrl.length > 200) {
          img.__bgRemoved = true;
          img.src = dataUrl;
          img.style.filter = "drop-shadow(0 20px 50px rgba(0, 240, 255, 0.4)) drop-shadow(0 6px 20px rgba(0, 0, 0, 0.85))";
        }
      } catch (err) {
        console.warn("Portrait background processing fallback:", err);
      }
    }

    if (img.complete && img.naturalWidth > 0) {
      attemptRemove();
    } else {
      img.addEventListener("load", attemptRemove, { once: true });
    }

    // Safety polling retry in case load event fired before handler or image cached
    let pollCount = 0;
    const pollInterval = setInterval(() => {
      pollCount++;
      if (processed || pollCount > 35) {
        clearInterval(pollInterval);
      } else if (img.naturalWidth > 0) {
        attemptRemove();
        clearInterval(pollInterval);
      }
    }, 60);
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
