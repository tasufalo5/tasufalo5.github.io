(function () {
  "use strict";

  var root = document.getElementById("tl-contact-root");
  var form = document.getElementById("tl-inquiry-form-el");
  if (!root || !form) return;

  var cfg = window.TENDLYN_CONTACT || {};
  var alertEl = document.getElementById("tl-form-alert");
  var submitBtn = document.getElementById("tl-form-submit");
  var sending = false;
  var inited = false;

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

  function setSending(on) {
    sending = on;
    if (!submitBtn) return;
    submitBtn.disabled = on;
    submitBtn.textContent = on
      ? cfg.sendingLabel || "Sending…"
      : cfg.submitLabel || "Send Inquiry";
  }

  function fieldValue(id) {
    var el = document.getElementById(id);
    return el && el.value ? String(el.value).trim() : "";
  }

  function ensureEmailJs() {
    return new Promise(function (resolve, reject) {
      if (window.emailjs && typeof window.emailjs.send === "function") {
        resolve(window.emailjs);
        return;
      }
      var tries = 0;
      var timer = setInterval(function () {
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
    } catch (err) {
      try {
        emailjs.init(cfg.publicKey);
      } catch (err2) {
        console.warn("tendlyn-contact emailjs init:", err2);
      }
    }
    inited = true;
  }

  ensureEmailJs()
    .then(initEmailJs)
    .catch(function () {
      /* SDK may still arrive later on submit */
    });

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (sending) return;
    clearAlert();

    var email = fieldValue("tl-email");
    var message = fieldValue("tl-message");

    if (!email || !message || !form.checkValidity()) {
      form.reportValidity();
      showAlert(cfg.requiredText || "Please fill in email and message.", "error");
      return;
    }

    if (!cfg.publicKey || !cfg.serviceId || !cfg.templateId) {
      showAlert(cfg.errorText || "Form is not configured.", "error");
      return;
    }

    var payload = {
      name: fieldValue("tl-name") || "N/A",
      email: email,
      website: fieldValue("tl-website") || "N/A",
      whatsapp: fieldValue("tl-whatsapp") || "N/A",
      company: fieldValue("tl-company") || "N/A",
      country: fieldValue("tl-country") || "N/A",
      message: message,
      reply_to: email,
      title: "Tendlyn Packaging Inquiry",
      time: new Date().toISOString(),
    };

    setSending(true);

    ensureEmailJs()
      .then(function (emailjs) {
        initEmailJs(emailjs);
        return emailjs.send(cfg.serviceId, cfg.templateId, payload);
      })
      .then(function () {
        form.reset();
        try {
          sessionStorage.setItem("tlq_done", "1");
          localStorage.setItem("tlq_submitted", "1");
        } catch (_) {}
        showAlert(
          cfg.successText ||
            "Thanks! We'll email you within 24 hours. If you don't see our reply, please check your spam folder.",
          "success"
        );
      })
      .catch(function (err) {
        console.warn("tendlyn-contact emailjs:", err);
        var detail =
          (err && (err.text || err.message)) ||
          (typeof err === "string" ? err : "");
        showAlert(
          (cfg.errorText || "Something went wrong. Please try again.") +
            (detail ? " (" + detail + ")" : ""),
          "error"
        );
      })
      .finally(function () {
        setSending(false);
      });
  });
})();
