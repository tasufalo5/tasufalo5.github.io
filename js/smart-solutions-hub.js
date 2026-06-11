/**
 * Smart Solutions hub: before/after compare + ROI slider (no network calls).
 */
(function () {
  function initCompare(root) {
    if (!root || root.dataset.ssCompareInit === '1') return;
    root.dataset.ssCompareInit = '1';
    var beforeUrl = root.getAttribute('data-ss-before') || '';
    var afterUrl = root.getAttribute('data-ss-after') || '';
    var afterLayer = root.querySelector('[data-ss-after-layer]');
    var beforeLayer = root.querySelector('[data-ss-before-layer]');
    var handle = root.querySelector('[data-ss-handle]');
    var range = root.querySelector('[data-ss-range]');
    if (!afterLayer || !beforeLayer || !range) return;

    function setBg(el, url) {
      if (!url) return;
      el.style.backgroundImage = 'url("' + url.replace(/"/g, '\\"') + '")';
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
    }

    setBg(afterLayer, afterUrl);
    setBg(beforeLayer, beforeUrl);

    function applyPos(p) {
      var n = Math.max(0, Math.min(100, p));
      root.style.setProperty('--ss-p', n + '%');
      beforeLayer.style.clipPath = 'inset(0 calc(100% - ' + n + '%) 0 0)';
      if (handle) handle.style.left = n + '%';
    }

    var start = parseInt(range.value, 10);
    if (isNaN(start)) start = 50;
    applyPos(start);

    range.addEventListener('input', function () {
      applyPos(parseInt(range.value, 10));
    });
  }

  function formatMoney(prefix, suffix, n) {
    var s = Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (prefix || '') + s + (suffix || '');
  }

  function initRoi(root) {
    if (!root || root.dataset.ssRoiInit === '1') return;
    root.dataset.ssRoiInit = '1';
    var pre = root.getAttribute('data-ss-currency-prefix') || '';
    var suf = root.getAttribute('data-ss-currency-suffix') || '';
    var roomsEl = root.querySelector('[data-ss-roi-rooms]');
    var roomsOut = root.querySelector('[data-ss-roi-rooms-out]');
    var elecEl = root.querySelector('[data-ss-roi-elec]');
    var kitEl = root.querySelector('[data-ss-roi-kit]');
    var out = root.querySelector('[data-ss-roi-out]');
    if (!roomsEl || !elecEl || !kitEl || !out) return;

    function calc() {
      var rooms = parseInt(roomsEl.value, 10) || 1;
      var elec = parseFloat(elecEl.value) || 0;
      var kit = parseFloat(kitEl.value) || 0;
      var save = rooms * Math.max(0, elec - kit);
      out.textContent = formatMoney(pre, suf, save);
      if (roomsOut) roomsOut.textContent = String(rooms);
    }

    ['input', 'change'].forEach(function (ev) {
      roomsEl.addEventListener(ev, calc);
      elecEl.addEventListener(ev, calc);
      kitEl.addEventListener(ev, calc);
    });
    calc();
  }

  function boot() {
    document.querySelectorAll('[data-ss-compare]').forEach(initCompare);
    document.querySelectorAll('[data-ss-roi]').forEach(initRoi);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
