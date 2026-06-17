(function () {
  'use strict';

  var root = document.getElementById('cp-root');
  var form = document.getElementById('cp-inquiry-form');
  if (!root || !form) return;

  var cfg = window.SWITNEX_CONTRACTOR_PORTAL || {};
  var alertEl = document.getElementById('cp-form-alert');
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

    var name = document.getElementById('cp-name');
    var company = document.getElementById('cp-company');
    var email = document.getElementById('cp-email');
    var load = document.getElementById('cp-load');
    var voltage = document.getElementById('cp-voltage');
    var quantity = document.getElementById('cp-quantity');
    var brief = document.getElementById('cp-brief');
    var file = document.getElementById('cp-file');

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
      'Contractor Project Inquiry',
      '',
      'Name & Title: ' + name.value.trim(),
      'Company: ' + company.value.trim(),
      'Business Email: ' + email.value.trim(),
      'Voltage & Phase: ' + voltage.value,
      'Target Horsepower/Amps: ' + load.value.trim(),
      'Estimated Quantity: ' + quantity.value,
      'Project Brief: ' + brief.value.trim(),
      'Attachment selected: ' + ((file.files && file.files[0] && file.files[0].name) || 'None'),
    ];

    var subject = encodeURIComponent(cfg.subject || 'Contractor Project Inquiry');
    var body = encodeURIComponent(lines.join('\n'));
    var to = cfg.email_to || 'info@axwp.com';
    window.location.href = 'mailto:' + to + '?subject=' + subject + '&body=' + body;

    showAlert(cfg.success_text || 'Your default email app has been opened.');
  });
})();
