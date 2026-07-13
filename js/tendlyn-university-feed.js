/**
 * Tendlyn University hub — mobile infinite scroll (2-col grid).
 * Desktop uses windowed server pagination; runs only below md breakpoint.
 */
(function () {
  const feed = document.querySelector('[data-tl-uni-feed]');
  if (!feed) return;

  const mq = window.matchMedia('(max-width: 767.98px)');

  const grid = feed.querySelector('[data-tl-uni-grid]');
  const loader = feed.querySelector('[data-tl-uni-loader]');
  let sentinel = feed.querySelector('[data-tl-uni-sentinel]');
  let nextUrl = sentinel && sentinel.dataset.nextUrl ? sentinel.dataset.nextUrl : '';
  let loading = false;
  let observer = null;

  function setLoading(on) {
    feed.classList.toggle('is-loading', on);
    if (loader) loader.hidden = !on;
  }

  async function loadMore() {
    if (!mq.matches || !nextUrl || loading || !grid) return;
    loading = true;
    setLoading(true);
    try {
      const res = await fetch(nextUrl, { credentials: 'same-origin' });
      if (!res.ok) return;
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const cols = doc.querySelectorAll('[data-tl-uni-grid] > .col');
      cols.forEach((col) => grid.appendChild(col));

      const newSentinel = doc.querySelector('[data-tl-uni-sentinel]');
      nextUrl = newSentinel && newSentinel.dataset.nextUrl ? newSentinel.dataset.nextUrl : '';

      if (!nextUrl && sentinel) {
        if (observer) observer.disconnect();
        sentinel.remove();
        sentinel = null;
      } else if (sentinel && newSentinel) {
        sentinel.dataset.nextUrl = nextUrl;
      }
    } catch (err) {
      console.warn('tendlyn-university-feed:', err);
    } finally {
      loading = false;
      setLoading(false);
    }
  }

  function bindObserver() {
    if (observer) observer.disconnect();
    if (!mq.matches || !sentinel || !nextUrl) return;
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { rootMargin: '240px 0px' },
    );
    observer.observe(sentinel);
  }

  function onBreakpointChange() {
    if (mq.matches) {
      bindObserver();
    } else if (observer) {
      observer.disconnect();
      setLoading(false);
    }
  }

  mq.addEventListener('change', onBreakpointChange);
  onBreakpointChange();
})();
