(() => {
  // <stdin>
  (() => {
    const modal = document.getElementById("tl-quote-modal");
    const form = document.getElementById("tl-quote-popup-form");
    if (!modal || !form) return;
    if (document.getElementById("tl-inquiry-form-el")) return;
    const cfg = window.TENDLYN_CONTACT || {};
    const dialog = modal.querySelector(".tl-quote-modal__dialog");
    const alertEl = document.getElementById("tl-qp-alert");
    const submitBtn = document.getElementById("tl-qp-submit");
    const sourceEl = document.getElementById("tl-qp-source");
    const SK_DONE = "tlq_done";
    const SK_STAY = "tlq_stay";
    const SK_EXIT = "tlq_exit";
    const LK_DONE = "tlq_submitted";
    let open = false;
    let sending = false;
    let inited = false;
    let lastFocus = null;
    let stayTimer = null;
    const storage = {
      get(key) {
        try {
          return sessionStorage.getItem(key);
        } catch (_) {
          return null;
        }
      },
      set(key, val) {
        try {
          sessionStorage.setItem(key, val);
        } catch (_) {
        }
      },
      getLocal(key) {
        try {
          return localStorage.getItem(key);
        } catch (_) {
          return null;
        }
      },
      setLocal(key, val) {
        try {
          localStorage.setItem(key, val);
        } catch (_) {
        }
      }
    };
    function alreadyQuoted() {
      return storage.get(SK_DONE) === "1" || storage.getLocal(LK_DONE) === "1";
    }
    function fieldValue(id) {
      const el = document.getElementById(id);
      return el && el.value ? String(el.value).trim() : "";
    }
    function showAlert(msg, type) {
      if (!alertEl) return;
      alertEl.hidden = false;
      alertEl.textContent = msg;
      alertEl.classList.remove("is-success", "is-error");
      if (type === "success") alertEl.classList.add("is-success");
      if (type === "error") alertEl.classList.add("is-error");
    }
    function clearAlert() {
      if (!alertEl) return;
      alertEl.hidden = true;
      alertEl.textContent = "";
      alertEl.classList.remove("is-success", "is-error");
    }
    function openModal(mode) {
      if (open || alreadyQuoted()) return;
      if (mode === "stay" && storage.get(SK_STAY) === "1") return;
      if (mode === "exit" && storage.get(SK_EXIT) === "1") return;
      if (sourceEl) sourceEl.value = mode === "exit" ? "quote-popup-exit" : "quote-popup-stay";
      clearAlert();
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.body.classList.add("is-quote-open");
      open = true;
      storage.set(mode === "exit" ? SK_EXIT : SK_STAY, "1");
      window.requestAnimationFrame(() => {
        const first = document.getElementById("tl-qp-email") || dialog;
        if (first && typeof first.focus === "function") first.focus();
      });
    }
    function closeModal() {
      if (!open) return;
      modal.hidden = true;
      document.body.classList.remove("is-quote-open");
      open = false;
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    }
    function ensureEmailJs() {
      return new Promise((resolve, reject) => {
        if (window.emailjs && typeof window.emailjs.send === "function") {
          resolve(window.emailjs);
          return;
        }
        let tries = 0;
        const timer = setInterval(() => {
          tries += 1;
          if (window.emailjs && typeof window.emailjs.send === "function") {
            clearInterval(timer);
            resolve(window.emailjs);
          } else if (tries > 80) {
            clearInterval(timer);
            reject(new Error("EmailJS SDK failed to load"));
          }
        }, 50);
      });
    }
    function initEmailJs(emailjs) {
      if (inited || !emailjs || typeof emailjs.init !== "function") return;
      try {
        emailjs.init({ publicKey: cfg.publicKey });
      } catch (_) {
        try {
          emailjs.init(cfg.publicKey);
        } catch (err) {
          console.warn("tendlyn-quote-popup emailjs init:", err);
        }
      }
      inited = true;
    }
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      if (sending) return;
      clearAlert();
      const email = fieldValue("tl-qp-email");
      if (!email || !form.checkValidity()) {
        form.reportValidity();
        showAlert(cfg.requiredText || "Please enter your email.", "error");
        return;
      }
      if (!cfg.publicKey || !cfg.serviceId || !cfg.templateId) {
        showAlert(cfg.errorText || "Form is not configured.", "error");
        return;
      }
      const source = fieldValue("tl-qp-source") || "quote-popup";
      const payload = {
        name: "N/A",
        email,
        website: fieldValue("tl-qp-website") || "N/A",
        whatsapp: "N/A",
        company: "N/A",
        country: "N/A",
        message: "[" + source + "] New customer signup \u2014 new-customer discount",
        reply_to: email,
        title: "Tendlyn New Customer Signup",
        time: (/* @__PURE__ */ new Date()).toISOString()
      };
      sending = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = cfg.sendingLabel || "Sending\u2026";
      }
      ensureEmailJs().then((emailjs) => {
        initEmailJs(emailjs);
        return emailjs.send(cfg.serviceId, cfg.templateId, payload);
      }).then(() => {
        form.reset();
        storage.set(SK_DONE, "1");
        storage.setLocal(LK_DONE, "1");
        showAlert(cfg.successText || "Thanks! We'll email your new-customer offer shortly.", "success");
        window.setTimeout(closeModal, 1600);
      }).catch((err) => {
        console.warn("tendlyn-quote-popup emailjs:", err);
        const detail = err && (err.text || err.message) || (typeof err === "string" ? err : "");
        showAlert(
          (cfg.errorText || "Something went wrong. Please try again.") + (detail ? " (" + detail + ")" : ""),
          "error"
        );
      }).finally(() => {
        sending = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = cfg.submitLabel || "SUBMIT";
        }
      });
    });
    const closeBtn = modal.querySelector("[data-tl-quote-close]");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => closeModal());
    }
    if (!alreadyQuoted()) {
      stayTimer = window.setTimeout(() => {
        const showStay = () => openModal("stay");
        if (document.visibilityState === "visible") {
          showStay();
          return;
        }
        const onVis = () => {
          if (document.visibilityState !== "visible") return;
          document.removeEventListener("visibilitychange", onVis);
          showStay();
        };
        document.addEventListener("visibilitychange", onVis);
      }, 6e3);
      document.documentElement.addEventListener("mouseleave", (e) => {
        if (e.clientY > 12) return;
        if (open) return;
        if (stayTimer) {
          window.clearTimeout(stayTimer);
          stayTimer = null;
        }
        openModal("exit");
      });
    }
    ensureEmailJs().then(initEmailJs).catch(() => {
    });
  })();
})();
