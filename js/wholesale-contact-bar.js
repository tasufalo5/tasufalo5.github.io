/**
 * Wholesale sticky bar: office clock in a fixed IANA timezone (no network).
 */
(function () {
  var el = document.querySelector('[data-wholesale-time]');
  if (!el) return;
  var tz = el.getAttribute('data-timezone') || 'Asia/Shanghai';

  function tick() {
    try {
      var now = new Date();
      var fmt = new Intl.DateTimeFormat(undefined, {
        timeZone: tz,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      el.textContent = fmt.format(now);
      el.setAttribute('datetime', now.toISOString());
    } catch (e) {
      el.textContent = '—';
    }
  }

  tick();
  setInterval(tick, 30000);
})();
