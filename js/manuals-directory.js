/**
 * 说明书列表：纯前端关键词过滤（无接口）。
 * 依赖 [data-manual-idx][data-manual-search] 网格单元。
 */
(function () {
  'use strict';

  function stripOuterQuotes(s) {
    var t = (s || '').toString().trim();
    for (var i = 0; i < 4 && t.length >= 2; i++) {
      var a = t.charAt(0);
      var b = t.charAt(t.length - 1);
      if ((a === '"' && b === '"') || (a === "'" && b === "'")) {
        t = t.slice(1, -1).trim();
        continue;
      }
      break;
    }
    return t;
  }

  function norm(s) {
    return stripOuterQuotes(s)
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  function tokens(q) {
    return norm(q)
      .split(/\s+/)
      .map(function (t) {
        return t.trim();
      })
      .filter(Boolean);
  }

  function matches(haystack, toks) {
    if (!toks.length) return true;
    for (var i = 0; i < toks.length; i++) {
      if (haystack.indexOf(toks[i]) === -1) return false;
    }
    return true;
  }

  function init(root) {
    var input = root.querySelector('#manuals-search-input');
    var emptyEl = root.querySelector('#manuals-search-empty');
    var cells = root.querySelectorAll('[data-manual-idx]');
    if (!input || !cells.length) return;

    function apply() {
      var toks = tokens(input.value);
      var n = 0;
      for (var i = 0; i < cells.length; i++) {
        var el = cells[i];
        var raw = el.getAttribute('data-manual-search') || '';
        var hay = norm(raw);
        var ok = matches(hay, toks);
        if (ok) n++;
        el.classList.toggle('d-none', !ok);
      }
      if (emptyEl) emptyEl.classList.toggle('d-none', n !== 0);
    }

    input.addEventListener('input', apply);
    input.addEventListener('search', apply);
    apply();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.getElementById('manuals-directory-root');
    if (root) init(root);
  });
})();
