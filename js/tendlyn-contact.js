(function () {
  'use strict';

  var root = document.getElementById('tl-contact-root');
  var form = document.getElementById('tl-inquiry-form-el');
  if (!root || !form) return;

  var cfg = window.TENDLYN_CONTACT || {};
  var alertEl = document.getElementById('tl-form-alert');
  var freeDomains = Array.isArray(cfg.free_email_domains) ? cfg.free_email_domains : [];

  function showAlert(msg) {
    if (!alertEl) return;
    alertEl.hidden = false;
    alertEl.textContent = msg;
  }

  function clearAlert() {
    if (!alertEl) return;
    alertEl.hidden = true;
    alertEl.textContent = '';
  }

  function isBusinessEmail(email) {
    var at = email.lastIndexOf('@');
    if (at < 1) return false;
    var domain = email.slice(at + 1).toLowerCase().trim();
    if (!domain || domain.indexOf('.') === -1) return false;
    return freeDomains.indexOf(domain) === -1;
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

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    clearAlert();

    var name = document.getElementById('tl-name');
    var company = document.getElementById('tl-company');
    var email = document.getElementById('tl-email');
    var website = document.getElementById('tl-website');
    var service = document.getElementById('tl-service');
    var volume = document.getElementById('tl-volume');
    var markets = document.getElementById('tl-markets');
    var brief = document.getElementById('tl-brief');
    var file = document.getElementById('tl-file');

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (!isBusinessEmail(email.value)) {
      showAlert(cfg.email_blocked_text || 'Please use a business email domain.');
      email.focus();
      return;
    }

    var lines = [
      'Tendlyn Supply Chain Inquiry',
      '',
      'Name: ' + name.value.trim(),
      'Company: ' + company.value.trim(),
      'Business Email: ' + email.value.trim(),
      'Website: ' + (website.value.trim() || 'N/A'),
      'Service Interest: ' + service.value,
      'Monthly Volume: ' + volume.value,
      'Target Markets: ' + markets.value,
      'Project Brief: ' + brief.value.trim(),
      'Attachment selected: ' + ((file.files && file.files[0] && file.files[0].name) || 'None'),
    ];

    var subject = encodeURIComponent(cfg.subject || 'Tendlyn Supply Chain Inquiry');
    var body = encodeURIComponent(lines.join('\n'));
    var to = cfg.email_to || 'info@axwp.com';
    window.location.href = 'mailto:' + to + '?subject=' + subject + '&body=' + body;

    showAlert(cfg.success_text || 'Your default email app has been opened.');
  });
})();
