(function () {
  'use strict';

  var root = document.getElementById('tl-contact-root');
  var form = document.getElementById('tl-inquiry-form-el');
  if (!root || !form) return;

  var cfg = window.TENDLYN_CONTACT || {};
  var alertEl = document.getElementById('tl-form-alert');
  var submitBtn = document.getElementById('tl-form-submit');
  var sending = false;

  function showAlert(msg, type) {
    if (!alertEl) return;
    alertEl.hidden = false;
    alertEl.textContent = msg;
    alertEl.classList.remove('cp-form__alert--success', 'cp-form__alert--error');
    if (type === 'success') alertEl.classList.add('cp-form__alert--success');
    if (type === 'error') alertEl.classList.add('cp-form__alert--error');
  }

  function clearAlert() {
    if (!alertEl) return;
    alertEl.hidden = true;
    alertEl.textContent = '';
    alertEl.classList.remove('cp-form__alert--success', 'cp-form__alert--error');
  }

  function setSending(on) {
    sending = on;
    if (!submitBtn) return;
    submitBtn.disabled = on;
    submitBtn.textContent = on
      ? cfg.sendingLabel || 'Sending…'
      : cfg.submitLabel || 'Send Inquiry';
  }

  function smoothScrollTo(el, duration) {
    var start = window.pageYOffset;
    var target = el.getBoundingClientRect().top + window.pageYOffset - 24;
    var change = target - start;
    var startTime = performance.now();

    function tick(now) {
      var elapsed = now - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      window.scrollTo(0, start + change * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  root.querySelectorAll('[data-scroll-target]').forEach(function (btn) {
    btn.addEventListener('click', function (ev) {
      var targetSel = btn.getAttribute('data-scroll-target');
      var target = targetSel ? document.querySelector(targetSel) : null;
      if (!target) return;
      ev.preventDefault();
      smoothScrollTo(target, Number(cfg.smooth_scroll_ms) || 500);
    });
  });

  function ensureEmailJs() {
    return new Promise(function (resolve, reject) {
      if (window.emailjs && typeof window.emailjs.send === 'function') {
        resolve(window.emailjs);
        return;
      }
      var tries = 0;
      var timer = setInterval(function () {
        tries += 1;
        if (window.emailjs && typeof window.emailjs.send === 'function') {
          clearInterval(timer);
          resolve(window.emailjs);
        } else if (tries > 40) {
          clearInterval(timer);
          reject(new Error('EmailJS SDK failed to load'));
        }
      }, 50);
    });
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (sending) return;
    clearAlert();

    var email = (document.getElementById('tl-email').value || '').trim();
    var message = (document.getElementById('tl-message').value || '').trim();

    if (!email || !message || !form.checkValidity()) {
      form.reportValidity();
      showAlert(cfg.requiredText || 'Please fill in email and message.', 'error');
      return;
    }

    var payload = {
      name: (document.getElementById('tl-name').value || '').trim() || 'N/A',
      email: email,
      website: (document.getElementById('tl-website').value || '').trim() || 'N/A',
      whatsapp: (document.getElementById('tl-whatsapp').value || '').trim() || 'N/A',
      company: (document.getElementById('tl-company').value || '').trim() || 'N/A',
      country: (document.getElementById('tl-country').value || '').trim() || 'N/A',
      message: message,
      reply_to: email,
      title: 'Tendlyn Packaging Inquiry',
      time: new Date().toISOString(),
    };

    setSending(true);

    ensureEmailJs()
      .then(function (emailjs) {
        if (typeof emailjs.init === 'function') {
          emailjs.init({ publicKey: cfg.publicKey });
        }
        return emailjs.send(cfg.serviceId, cfg.templateId, payload);
      })
      .then(function () {
        form.reset();
        showAlert(cfg.successText || "Thanks! We'll email you within 24 hours. If you don't see our reply, please check your spam folder.", 'success');
      })
      .catch(function (err) {
        console.warn('tendlyn-contact emailjs:', err);
        showAlert(cfg.errorText || 'Something went wrong. Please try again.', 'error');
      })
      .finally(function () {
        setSending(false);
      });
  });
})();
