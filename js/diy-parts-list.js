/**
 * My DIY List: open SWITNEX search from checked SKUs + copy list (no API).
 */
(function () {
  var root = document.querySelector('[data-diy-list-root]');
  if (!root) return;

  var statusEl = root.querySelector('[data-diy-list-status]');
  var base = root.getAttribute('data-search-base') || 'https://switnex.com/search?q=';

  function selectedParts() {
    var out = [];
    root.querySelectorAll('input[data-diy-part]:checked').forEach(function (el) {
      out.push({
        sku: el.getAttribute('data-sku') || '',
        name: el.getAttribute('data-name') || '',
        buyUrl: el.getAttribute('data-buy-url') || '',
      });
    });
    return out;
  }

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg || '';
  }

  root.querySelector('[data-diy-list-open]')?.addEventListener('click', function () {
    var parts = selectedParts();
    if (!parts.length) {
      setStatus('Select at least one part.');
      return;
    }
    var q = parts
      .map(function (p) {
        return p.sku;
      })
      .join(' ');
    var url = base + encodeURIComponent(q);
    window.open(url, '_blank', 'noopener,noreferrer');
    setStatus('Opened SWITNEX search for: ' + q);
  });

  root.querySelector('[data-diy-list-copy]')?.addEventListener('click', function () {
    var parts = selectedParts();
    if (!parts.length) {
      setStatus('Select at least one part.');
      return;
    }
    var lines = parts.map(function (p) {
      return p.sku + '\t' + p.name + '\t' + p.buyUrl;
    });
    var text = lines.join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          setStatus('Copied SKU list to clipboard.');
        },
        function () {
          setStatus('Could not copy — select text manually.');
        }
      );
    } else {
      setStatus(text);
    }
  });
})();
