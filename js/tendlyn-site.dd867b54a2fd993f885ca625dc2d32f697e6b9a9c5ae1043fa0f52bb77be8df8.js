(() => {
  // <stdin>
  (() => {
    const nav = document.querySelector(".tl-nav");
    const toggle = document.querySelector("[data-tl-nav-toggle]");
    const drawer = document.querySelector("[data-tl-nav-drawer]");
    const onScroll = () => {
      if (!nav) return;
      const threshold = nav.offsetHeight || 0;
      nav.classList.toggle("is-scrolled", window.scrollY >= threshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    if (toggle && drawer) {
      toggle.addEventListener("click", () => {
        const open = drawer.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }
    document.querySelectorAll("[data-tl-lang]").forEach((root) => {
      const btn = root.querySelector("[data-tl-lang-toggle]");
      const menu = root.querySelector("[data-tl-lang-menu]");
      if (!btn || !menu) return;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = menu.hasAttribute("hidden");
        document.querySelectorAll("[data-tl-lang-menu]").forEach((m) => {
          if (m !== menu) m.setAttribute("hidden", "");
        });
        document.querySelectorAll("[data-tl-lang-toggle]").forEach((b) => {
          if (b !== btn) b.setAttribute("aria-expanded", "false");
        });
        if (open) menu.removeAttribute("hidden");
        else menu.setAttribute("hidden", "");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
    document.addEventListener("click", () => {
      document.querySelectorAll("[data-tl-lang-menu]").forEach((m) => m.setAttribute("hidden", ""));
      document.querySelectorAll("[data-tl-lang-toggle]").forEach((b) => b.setAttribute("aria-expanded", "false"));
    });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let fadeObserver = null;
    const revealFade = (nodes) => {
      if (reduce) {
        nodes.forEach((n) => n.classList.add("is-in"));
        return;
      }
      if (!("IntersectionObserver" in window)) {
        nodes.forEach((n) => n.classList.add("is-in"));
        return;
      }
      if (!fadeObserver) {
        fadeObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((e) => {
              if (e.isIntersecting) {
                e.target.classList.add("is-in");
                fadeObserver.unobserve(e.target);
              }
            });
          },
          { threshold: 0.01, rootMargin: "0px 0px 80px 0px" }
        );
      }
      nodes.forEach((n) => fadeObserver.observe(n));
    };
    revealFade(Array.from(document.querySelectorAll(".tl-fade-up")));
    document.querySelectorAll("[data-tl-gallery]").forEach((root) => {
      const slides = Array.from(root.querySelectorAll("[data-tl-gallery-slide]"));
      const thumbs = Array.from(root.querySelectorAll("[data-tl-gallery-thumb]"));
      const countEl = root.querySelector("[data-tl-gallery-count]");
      if (slides.length < 2) return;
      let index = Math.max(
        0,
        slides.findIndex((slide) => slide.classList.contains("is-active"))
      );
      const show = (next) => {
        index = (next % slides.length + slides.length) % slides.length;
        slides.forEach((slide, i) => {
          const on = i === index;
          slide.classList.toggle("is-active", on);
          if (on) slide.removeAttribute("hidden");
          else slide.setAttribute("hidden", "");
        });
        thumbs.forEach((thumb, i) => {
          thumb.classList.toggle("is-active", i === index);
          thumb.setAttribute("aria-selected", i === index ? "true" : "false");
        });
        if (countEl) countEl.textContent = `${index + 1} / ${slides.length}`;
      };
      root.querySelector("[data-tl-gallery-prev]")?.addEventListener("click", (e) => {
        e.preventDefault();
        show(index - 1);
      });
      root.querySelector("[data-tl-gallery-next]")?.addEventListener("click", (e) => {
        e.preventDefault();
        show(index + 1);
      });
      thumbs.forEach((thumb) => {
        thumb.addEventListener("click", (e) => {
          e.preventDefault();
          const raw = Number(thumb.getAttribute("data-index"));
          if (Number.isFinite(raw)) show(raw);
        });
      });
      show(index);
    });
    const mobileMq = window.matchMedia("(max-width: 960px)");
    const initInfinite = () => {
      const root = document.querySelector("[data-tl-infinite]");
      if (!root || !mobileMq.matches) return;
      const gridSel = root.getAttribute("data-grid") || "[data-tl-infinite-grid]";
      const grid = document.querySelector(gridSel);
      const sentinel = root.querySelector("[data-tl-infinite-sentinel]");
      const status = root.querySelector("[data-tl-infinite-status]");
      if (!grid || !sentinel) return;
      let nextUrl = root.getAttribute("data-next") || "";
      let loading = false;
      let done = !nextUrl;
      const setStatus = (text, finished) => {
        if (!status) return;
        status.textContent = text;
        status.hidden = !text;
        root.classList.toggle("is-done", !!finished);
      };
      if (done) {
        setStatus("", true);
        return;
      }
      setStatus("Scroll for more", false);
      const loadNext = async () => {
        if (loading || done || !nextUrl) return;
        loading = true;
        setStatus("Loading more\u2026", false);
        try {
          const res = await fetch(nextUrl, { credentials: "same-origin" });
          if (!res.ok) throw new Error(String(res.status));
          const html = await res.text();
          const doc = new DOMParser().parseFromString(html, "text/html");
          const nextGrid = doc.querySelector(gridSel);
          const nextRoot = doc.querySelector("[data-tl-infinite]");
          const cards = nextGrid ? Array.from(nextGrid.querySelectorAll(":scope > a.tl-card")) : [];
          if (!cards.length) {
            done = true;
            nextUrl = "";
            setStatus("You\u2019re all caught up", true);
            return;
          }
          const frag = document.createDocumentFragment();
          const fresh = [];
          cards.forEach((card) => {
            const node = document.importNode(card, true);
            frag.appendChild(node);
            fresh.push(node);
          });
          grid.appendChild(frag);
          revealFade(fresh);
          nextUrl = nextRoot?.getAttribute("data-next") || "";
          if (!nextUrl) {
            done = true;
            setStatus("You\u2019re all caught up", true);
          } else {
            setStatus("Scroll for more", false);
          }
        } catch (_) {
          setStatus("Couldn\u2019t load more. Try again.", false);
        } finally {
          loading = false;
        }
      };
      if (!("IntersectionObserver" in window)) {
        const onScrollLoad = () => {
          if (done) {
            window.removeEventListener("scroll", onScrollLoad);
            return;
          }
          const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 640;
          if (nearBottom) loadNext();
        };
        window.addEventListener("scroll", onScrollLoad, { passive: true });
        onScrollLoad();
        return;
      }
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) loadNext();
        },
        { rootMargin: "480px 0px" }
      );
      io.observe(sentinel);
    };
    let infiniteBound = false;
    const maybeInitInfinite = () => {
      if (!mobileMq.matches || infiniteBound) return;
      infiniteBound = true;
      initInfinite();
    };
    maybeInitInfinite();
    mobileMq.addEventListener?.("change", maybeInitInfinite);
  })();
})();
