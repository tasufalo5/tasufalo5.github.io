/**
 * Troubleshooting hub: client-side filter by search + tag chips (no API).
 */
(function () {
  'use strict';

  function norm(s) {
    return (s || '')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  function tokens(q) {
    return norm(q)
      .split(/\s+/)
      .filter(Boolean);
  }

  function matchesHaystack(haystack, toks) {
    if (!toks.length) return true;
    for (var i = 0; i < toks.length; i++) {
      if (haystack.indexOf(toks[i]) === -1) return false;
    }
    return true;
  }

  function tagMatches(issueTagsAttr, activeTag) {
    if (!activeTag) return true;
    var tags = norm(issueTagsAttr).split(/\s+/).filter(Boolean);
    return tags.indexOf(activeTag) !== -1;
  }

  function init(root) {
    var input = root.querySelector('#ts-search-input');
    var tagBtns = root.querySelectorAll('.switnex-ts-tag');
    var issues = root.querySelectorAll('.switnex-ts-issues-all .switnex-ts-issue');
    var globalEmpty = root.querySelector('#ts-global-empty');
    var filterLine = root.querySelector('#ts-filter-active');
    if (!input || !issues.length) return;

    var activeTag = '';
    var emptyHint = input.getAttribute('data-ts-empty-hint') || '';

    function setTagActive(tagId) {
      activeTag = tagId || '';
      for (var b = 0; b < tagBtns.length; b++) {
        var btn = tagBtns[b];
        var id = btn.getAttribute('data-ts-tag') || '';
        btn.classList.toggle('active', id === activeTag && activeTag !== '');
        btn.classList.toggle('btn-secondary', id === activeTag && activeTag !== '');
        btn.classList.toggle('btn-outline-secondary', !(id === activeTag && activeTag !== ''));
      }
    }

    function apply() {
      var toks = tokens(input.value);
      var totalVisible = 0;
      for (var i = 0; i < issues.length; i++) {
        var el = issues[i];
        var hay = norm(el.getAttribute('data-ts-keywords') || '');
        var tagAttr = el.getAttribute('data-ts-tags') || '';
        var ok = matchesHaystack(hay, toks) && tagMatches(tagAttr, activeTag);
        el.classList.toggle('d-none', !ok);
        if (ok) totalVisible++;
      }
      if (globalEmpty) {
        var showGlobal = totalVisible === 0 && (toks.length > 0 || activeTag);
        globalEmpty.classList.toggle('d-none', !showGlobal);
        globalEmpty.textContent = emptyHint;
      }
      if (filterLine) {
        var label = filterLine.getAttribute('data-label-filter') || '';
        var parts = [];
        if (activeTag) {
          for (var bi = 0; bi < tagBtns.length; bi++) {
            if ((tagBtns[bi].getAttribute('data-ts-tag') || '') === activeTag) {
              parts.push(tagBtns[bi].textContent.trim());
              break;
            }
          }
        }
        if (toks.length) parts.push(toks.join(' '));
        if (parts.length) {
          filterLine.textContent = label + ': ' + parts.join(' · ');
          filterLine.classList.remove('d-none');
        } else {
          filterLine.textContent = '';
          filterLine.classList.add('d-none');
        }
      }
    }

    input.addEventListener('input', apply);
    input.addEventListener('search', apply);

    for (var t = 0; t < tagBtns.length; t++) {
      tagBtns[t].addEventListener('click', function () {
        var id = this.getAttribute('data-ts-tag') || '';
        if (activeTag === id) setTagActive('');
        else setTagActive(id);
        apply();
      });
    }

    /* Health diagnosis: age path (static mailto links in DOM) */
    var ageBtns = document.querySelectorAll('[data-ts-age]');
    var agePanels = document.querySelectorAll('[data-ts-age-panel]');
    for (var a = 0; a < ageBtns.length; a++) {
      ageBtns[a].addEventListener('click', function () {
        var v = this.getAttribute('data-ts-age');
        for (var p = 0; p < agePanels.length; p++) {
          var panel = agePanels[p];
          var show = panel.getAttribute('data-ts-age-panel') === v;
          panel.classList.toggle('d-none', !show);
        }
        for (var b = 0; b < ageBtns.length; b++) {
          ageBtns[b].classList.toggle('btn-secondary', ageBtns[b].getAttribute('data-ts-age') === v);
          ageBtns[b].classList.toggle('btn-outline-secondary', ageBtns[b].getAttribute('data-ts-age') !== v);
        }
      });
    }

    setTagActive('');
    apply();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.getElementById('troubleshooting-hub-root');
    if (root) init(root);
  });
})();
