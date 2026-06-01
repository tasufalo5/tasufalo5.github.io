(function () {
  'use strict';

  var root = document.getElementById('cfg-root');
  if (!root) return;

  function loadConfiguratorData() {
    var raw = window.SWITNEX_CONFIGURATOR;
    if (!raw) {
      var dataEl = document.getElementById('cfg-configurator-data');
      if (dataEl) raw = dataEl.textContent;
    }
    if (!raw) return null;
    if (typeof raw === 'object') return raw;
    try {
      var parsed = JSON.parse(raw);
      return typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
    } catch (e) {
      return null;
    }
  }

  var DATA = loadConfiguratorData();
  if (!DATA || !DATA.voltage_sets) return;

  var form = document.getElementById('cfg-form');
  var countryInputs = form.querySelectorAll('input[name="country"]');
  var countryOtherWrap = document.getElementById('cfg-country-other-wrap');
  var countryOtherEl = document.getElementById('cfg-country-other');
  var supplyInputs = form.querySelectorAll('input[name="supply_type"]');
  var voltageEl = document.getElementById('cfg-voltage');
  var voltageOtherWrap = document.getElementById('cfg-voltage-other-wrap');
  var voltageOtherEl = document.getElementById('cfg-voltage-other');
  var voltageNoteEl = document.getElementById('cfg-voltage-note');
  var currentEl = document.getElementById('cfg-current');
  var applicationEl = document.getElementById('cfg-application');
  var plugTypeEl = document.getElementById('cfg-plug-type');
  var remarksEl = document.getElementById('cfg-remarks');
  var alertEl = document.getElementById('cfg-alert');
  var previewImg = document.getElementById('cfg-preview-img');
  var heavyImg = root.querySelector('[data-cfg-img="heavy"]');
  var visualStatus = document.getElementById('cfg-visual-status');
  var leadSummary = document.getElementById('cfg-lead-summary');
  var leadForm = document.getElementById('cfg-lead-form');
  var submitButtons = document.querySelectorAll('[data-submit-channel]');

  var photoNameplate = document.getElementById('cfg-photo-nameplate');
  var photoPlug = document.getElementById('cfg-photo-plug');
  var nameplateName = document.getElementById('cfg-nameplate-name');
  var plugName = document.getElementById('cfg-plug-name');
  var nameplatePreview = document.getElementById('cfg-nameplate-preview');
  var plugPreview = document.getElementById('cfg-plug-preview');

  var FORM = DATA.form || {};
  var CHECKOUT = DATA.checkout || {};
  var ALERTS = DATA.alerts || {};
  var VOLTAGE_SETS = DATA.voltage_sets || {};
  var COUNTRY_MAP = DATA.country_voltage_map || {};
  var PRODUCTS = DATA.products || [];
  var productsListEl = document.getElementById('cfg-products-list');
  var productsNoteEl = document.getElementById('cfg-products-note');
  var selectedProductId = null;

  function getCountry() {
    var checked = form.querySelector('input[name="country"]:checked');
    return checked ? checked.value : 'us';
  }

  function countryMeta(id) {
    var list = DATA.countries || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return { label: id, flag: '' };
  }

  function otherCountryMeta(id) {
    var list = DATA.other_countries || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function countryLabel() {
    var id = getCountry();
    if (id === 'other') {
      if (!countryOtherEl || !countryOtherEl.value) {
        return countryMeta(id).label;
      }
      var meta = otherCountryMeta(countryOtherEl.value);
      if (meta) return (meta.flag ? meta.flag + ' ' : '') + meta.label;
      var opt = countryOtherEl.options[countryOtherEl.selectedIndex];
      return opt ? opt.textContent.trim() : countryMeta(id).label;
    }
    return countryMeta(id).label;
  }

  function toggleCountryOther() {
    if (!countryOtherWrap || !countryOtherEl) return;
    var other = getCountry() === 'other';
    countryOtherWrap.hidden = !other;
    countryOtherEl.required = other;
    if (!other) {
      countryOtherEl.setCustomValidity('');
      countryOtherEl.value = '';
    }
  }

  function getSupplyType() {
    var checked = form.querySelector('input[name="supply_type"]:checked');
    return checked && checked.value === 'dc' ? 'dc' : 'ac';
  }

  function voltageSetKey() {
    if (getSupplyType() === 'dc') return 'dc';
    var country = getCountry();
    if (country === 'other') {
      var meta = countryOtherEl && otherCountryMeta(countryOtherEl.value);
      return (meta && meta.voltage_set) || 'iec';
    }
    return COUNTRY_MAP[country] || 'iec';
  }

  function isVoltageOther() {
    return voltageEl.value === 'other';
  }

  function getVoltageCustomText() {
    return voltageOtherEl ? voltageOtherEl.value.trim() : '';
  }

  function toggleVoltageOtherField() {
    if (!voltageOtherWrap || !voltageOtherEl) return;
    var other = isVoltageOther();
    voltageOtherWrap.hidden = !other;
    voltageOtherEl.required = other;
    if (!other) voltageOtherEl.setCustomValidity('');
  }

  function populateVoltageOptions() {
    var key = voltageSetKey();
    var set = VOLTAGE_SETS[key] || VOLTAGE_SETS.iec || [];
    var opts = Array.isArray(set) ? set.slice() : [];
    opts.sort(function (a, b) {
      return parseFloat(a.value) - parseFloat(b.value);
    });
    var prev = voltageEl.value;
    voltageEl.innerHTML = '';
    opts.forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = o.id;
      opt.textContent = o.label;
      opt.dataset.value = o.value;
      opt.dataset.note = o.note || '';
      if (o.review) opt.dataset.review = '1';
      if (o.intercept) opt.dataset.intercept = '1';
      voltageEl.appendChild(opt);
    });
    var otherOpt = document.createElement('option');
    otherOpt.value = 'other';
    otherOpt.textContent = FORM.voltage_other_option || 'Other';
    otherOpt.dataset.other = '1';
    voltageEl.appendChild(otherOpt);

    var still =
      prev === 'other' || opts.some(function (o) { return o.id === prev; });
    voltageEl.value = still ? prev : opts[0] ? opts[0].id : 'other';
    toggleVoltageOtherField();
    updateVoltageNote();
  }

  function selectedVoltageOption() {
    if (isVoltageOther()) {
      return {
        id: 'other',
        value: getVoltageCustomText(),
        note: '',
        review: true,
        other: true,
      };
    }
    var opt = voltageEl.options[voltageEl.selectedIndex];
    return opt
      ? {
          id: opt.value,
          value: opt.dataset.value || '',
          note: opt.dataset.note || '',
          review: opt.dataset.review === '1',
          intercept: opt.dataset.intercept === '1',
          other: false,
        }
      : { id: '', value: '', note: '', review: false, intercept: false, other: false };
  }

  function updateVoltageNote() {
    var v = selectedVoltageOption();
    if (!voltageNoteEl) return;
    if (v.other) {
      voltageNoteEl.hidden = true;
      voltageNoteEl.textContent = '';
      return;
    }
    if (v.note) {
      voltageNoteEl.textContent = v.note;
      voltageNoteEl.hidden = false;
    } else {
      voltageNoteEl.hidden = true;
      voltageNoteEl.textContent = '';
    }
  }

  function currentOption() {
    var opt = currentEl.options[currentEl.selectedIndex];
    return {
      id: currentEl.value,
      label: opt ? opt.textContent : currentEl.value,
      custom: opt && opt.dataset.custom === '1',
    };
  }

  function isHeavyVisual() {
    var v = selectedVoltageOption();
    var cur = currentOption();
    if (v.other) return true;
    if (getSupplyType() === 'dc') {
      return v.value === '48' || v.value === '310' || v.value === '540';
    }
    if (v.value === '480' || v.value === '400') return true;
    if (cur.custom) return true;
    if (cur.id === '60') return true;
    return false;
  }

  function setPreviewImage(heavy) {
    if (!previewImg || !heavyImg) return;
    if (heavy) {
      previewImg.hidden = true;
      previewImg.classList.remove('cfg-visual__img--active');
      heavyImg.hidden = false;
      heavyImg.classList.add('cfg-visual__img--active');
    } else {
      heavyImg.hidden = true;
      heavyImg.classList.remove('cfg-visual__img--active');
      previewImg.hidden = false;
      previewImg.classList.add('cfg-visual__img--active');
    }
  }

  function detectMismatch() {
    if (getSupplyType() === 'dc' || isVoltageOther()) return null;
    var country = getCountry();
    var v = selectedVoltageOption();
    var plug = plugTypeEl ? plugTypeEl.value : '';

    if (plug === 'twist480' && (v.value === '110' || v.value === '120' || v.value === '230')) {
      return {
        type: 'mismatch',
        title: ALERTS.mismatch_title,
        body: ALERTS.mismatch_body,
      };
    }
    if (
      (country === 'us' || country === 'ca') &&
      (v.value === '110' || v.value === '120') &&
      plug === 'dryer'
    ) {
      return {
        type: 'mismatch',
        title: ALERTS.mismatch_title,
        body: ALERTS.mismatch_body,
      };
    }
    return null;
  }

  function collectAlerts() {
    var items = [];
    var v = selectedVoltageOption();
    var cur = currentOption();
    var mismatch = detectMismatch();

    if (v.intercept) {
      items.push({
        type: 'mismatch',
        title: ALERTS.voltage_intercept_title,
        body: ALERTS.voltage_intercept_body,
      });
    } else if (v.other) {
      items.push({
        type: 'review',
        title: ALERTS.voltage_review_title,
        body: ALERTS.voltage_review_body,
      });
    } else if (v.review) {
      items.push({
        type: 'review',
        title: ALERTS.voltage_review_title,
        body: ALERTS.voltage_review_body,
      });
    }
    if (cur.custom) {
      items.push({
        type: 'custom',
        title: ALERTS.current_custom_title,
        body: ALERTS.current_custom_body,
      });
    }
    if (mismatch) items.push(mismatch);
    return items;
  }

  function renderAlerts(alerts) {
    if (!alertEl) return;
    if (!alerts.length) {
      alertEl.hidden = true;
      alertEl.innerHTML = '';
      return;
    }
    alertEl.hidden = false;
    alertEl.innerHTML = alerts
      .map(function (a) {
        return (
          '<div class="cfg-alert__item cfg-alert__item--' +
          a.type +
          '">' +
          '<strong>' +
          escapeHtml(a.title) +
          '</strong>' +
          '<p>' +
          escapeHtml(a.body) +
          '</p></div>'
        );
      })
      .join('');
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function voltageDisplayLabel() {
    if (isVoltageOther()) {
      var custom = getVoltageCustomText();
      return custom
        ? 'Other: ' + custom
        : FORM.voltage_other_option || 'Other';
    }
    var opt = voltageEl.options[voltageEl.selectedIndex];
    return opt ? opt.textContent : '';
  }

  function parseCurrentA() {
    var id = currentEl.value;
    if (id === '80plus') return 999;
    return parseInt(id, 10) || 0;
  }

  function getVoltageValue() {
    var v = selectedVoltageOption();
    if (v.other || !v.value) return null;
    return String(v.value);
  }

  function isExactProductMatch(product, supply, voltage, currentA) {
    if (product.supply !== supply) return false;
    if (!voltage || isVoltageOther()) return false;
    if (String(product.voltage) !== String(voltage)) return false;
    if (currentA >= 999) return false;
    return product.current_max >= currentA;
  }

  function findMatchingProducts() {
    var supply = getSupplyType();
    var voltage = getVoltageValue();
    var currentA = parseCurrentA();
    var exact = [];
    var near = [];
    var featured = [];

    PRODUCTS.forEach(function (product) {
      if (product.supply !== supply) return;
      if (product.featured) featured.push(product);
      if (isExactProductMatch(product, supply, voltage, currentA)) {
        exact.push(product);
        return;
      }
      if (!voltage || isVoltageOther()) return;
      if (String(product.voltage) !== String(voltage)) return;
      if (currentA < 999 && product.current_max < currentA) return;
      near.push(product);
    });

    exact.sort(function (a, b) {
      return a.current_max - b.current_max;
    });
    near.sort(function (a, b) {
      return a.current_max - b.current_max;
    });

    var result = [];
    var seen = {};
    function pushUnique(list) {
      list.forEach(function (product) {
        if (seen[product.id]) return;
        seen[product.id] = true;
        result.push(product);
      });
    }

    pushUnique(exact);
    if (result.length < 3) pushUnique(near);
    if (result.length < 2) {
      pushUnique(
        featured.sort(function (a, b) {
          return a.current_max - b.current_max;
        })
      );
    }

    return {
      products: result.slice(0, 4),
      exact: exact,
      hasExact: exact.length > 0,
    };
  }

  function getProductById(id) {
    for (var i = 0; i < PRODUCTS.length; i++) {
      if (PRODUCTS[i].id === id) return PRODUCTS[i];
    }
    return null;
  }

  function renderProducts() {
    if (!productsListEl) return;
    var match = findMatchingProducts();
    var products = match.products;
    var supply = getSupplyType();
    var voltage = getVoltageValue();
    var currentA = parseCurrentA();

    if (
      selectedProductId &&
      !products.some(function (p) {
        return p.id === selectedProductId;
      })
    ) {
      selectedProductId = null;
    }

    if (!products.length) {
      productsListEl.innerHTML =
        '<p class="cfg-products__empty">' +
        escapeHtml(FORM.products_empty || 'No matching panels yet.') +
        '</p>';
      if (productsNoteEl) productsNoteEl.hidden = true;
      return;
    }

    if (productsNoteEl) {
      if (!match.hasExact) {
        productsNoteEl.textContent =
          FORM.products_no_match || 'Showing closest matching panels.';
        productsNoteEl.hidden = false;
      } else {
        productsNoteEl.hidden = true;
      }
    }

    productsListEl.innerHTML = products
      .map(function (product) {
        var exact = isExactProductMatch(product, supply, voltage, currentA);
        var badge = exact
          ? FORM.products_match_badge || 'Exact match'
          : product.featured
            ? FORM.products_featured_badge || 'Popular'
            : FORM.products_near_badge || 'Compatible';
        var selected = selectedProductId === product.id;
        var specs = (product.specs || [])
          .slice(0, 3)
          .map(function (line) {
            return '<li>' + escapeHtml(line) + '</li>';
          })
          .join('');
        var image = product.image || '/images/home-product-showcase.png';
        return (
          '<label class="cfg-product' +
          (selected ? ' cfg-product--selected' : '') +
          '">' +
          '<input type="radio" name="cfg_product" class="cfg-product__input" value="' +
          escapeHtml(product.id) +
          '"' +
          (selected ? ' checked' : '') +
          ' />' +
          '<article class="cfg-product__card">' +
          '<div class="cfg-product__media">' +
          '<img src="' +
          escapeHtml(image) +
          '" alt="" loading="lazy" decoding="async" />' +
          '<span class="cfg-product__badge">' +
          escapeHtml(badge) +
          '</span>' +
          '</div>' +
          '<div class="cfg-product__body">' +
          '<h3 class="cfg-product__title">' +
          escapeHtml(product.title) +
          '</h3>' +
          '<p class="cfg-product__sku">' +
          escapeHtml(product.sku || '') +
          '</p>' +
          '<ul class="cfg-product__specs">' +
          specs +
          '</ul>' +
          '<div class="cfg-product__footer">' +
          '<span class="cfg-product__price">' +
          escapeHtml(FORM.products_price_label || 'From') +
          ' $' +
          Number(product.price_usd || 0).toFixed(0) +
          ' USD</span>' +
          '<span class="cfg-product__pick">' +
          escapeHtml(
            selected
              ? FORM.products_selected_cta || 'Selected'
              : FORM.products_select_cta || 'Select this panel'
          ) +
          '</span>' +
          '</div>' +
          '</div>' +
          '</article>' +
          '</label>'
        );
      })
      .join('');

    productsListEl.querySelectorAll('.cfg-product__input').forEach(function (input) {
      input.addEventListener('change', function () {
        selectedProductId = input.value;
        var product = getProductById(selectedProductId);
        if (product && product.image && previewImg) {
          previewImg.src = product.image;
          previewImg.hidden = false;
          previewImg.classList.add('cfg-visual__img--active');
          if (heavyImg) {
            heavyImg.hidden = true;
            heavyImg.classList.remove('cfg-visual__img--active');
          }
        }
        renderProducts();
        sync();
      });
    });
  }

  function buildSummary() {
    var supply = getSupplyType() === 'dc' ? 'DC' : 'AC';
    var lines = [
      'Country: ' + countryLabel(),
      'Supply: ' + supply,
      'Voltage: ' + voltageDisplayLabel(),
      'Max current: ' + currentOption().label,
    ];
    var app = applicationEl && applicationEl.value.trim();
    if (app) lines.push('Application: ' + app);
    var plug = plugTypeEl && plugTypeEl.value;
    if (plug) {
      var plugLabel = plugTypeEl.options[plugTypeEl.selectedIndex].text;
      lines.push('Plug / breaker hint: ' + plugLabel);
    }
    if (remarksEl && remarksEl.value.trim()) {
      lines.push('Notes: ' + remarksEl.value.trim());
    }
    if (selectedProductId) {
      var product = getProductById(selectedProductId);
      if (product) {
        lines.push('', 'Selected panel: ' + product.title + ' (' + (product.sku || product.id) + ')');
        lines.push('Panel price: $' + Number(product.price_usd || 0).toFixed(2) + ' USD');
      }
    }
    var alerts = collectAlerts();
    if (alerts.length) {
      lines.push('', 'Flags for engineering:');
      alerts.forEach(function (a) {
        lines.push('• ' + a.title);
      });
    }
    lines.push('', 'Verification photos: attached in follow-up email (mail client).');
    return lines.join('\n');
  }

  function syncVisualStatus(alerts) {
    if (!visualStatus) return;
    if (!alerts.length) {
      visualStatus.hidden = true;
      visualStatus.textContent = '';
      return;
    }
    visualStatus.hidden = false;
    visualStatus.textContent = alerts[0].title;
  }

  function sync() {
    toggleCountryOther();
    toggleVoltageOtherField();
    updateVoltageNote();

    if (selectedProductId) {
      var selectedProduct = getProductById(selectedProductId);
      if (selectedProduct && selectedProduct.image && previewImg) {
        previewImg.src = selectedProduct.image;
        previewImg.hidden = false;
        previewImg.classList.add('cfg-visual__img--active');
        if (heavyImg) {
          heavyImg.hidden = true;
          heavyImg.classList.remove('cfg-visual__img--active');
        }
      } else {
        setPreviewImage(isHeavyVisual());
      }
    } else {
      setPreviewImage(isHeavyVisual());
    }

    var alerts = collectAlerts();
    renderAlerts(alerts);
    syncVisualStatus(alerts);
    renderProducts();

    if (leadSummary) leadSummary.value = buildSummary();
  }

  function bindFileInput(input, nameEl, previewEl, dropEl) {
    if (!input) return;
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) {
        if (nameEl) {
          nameEl.hidden = true;
          nameEl.textContent = '';
        }
        if (previewEl) {
          previewEl.hidden = true;
          previewEl.removeAttribute('src');
        }
        if (dropEl) dropEl.classList.remove('cfg-verify__drop--filled');
        return;
      }
      if (nameEl) {
        nameEl.textContent = file.name;
        nameEl.hidden = false;
      }
      if (dropEl) dropEl.classList.add('cfg-verify__drop--filled');
      if (previewEl && file.type.indexOf('image/') === 0) {
        var reader = new FileReader();
        reader.onload = function (ev) {
          previewEl.src = ev.target.result;
          previewEl.hidden = false;
        };
        reader.readAsDataURL(file);
      }
      sync();
    });
  }

  function bindDropZone(dropEl, input) {
    if (!dropEl || !input) return;
    ['dragenter', 'dragover'].forEach(function (ev) {
      dropEl.addEventListener(ev, function (e) {
        e.preventDefault();
        dropEl.classList.add('cfg-verify__drop--drag');
      });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      dropEl.addEventListener(ev, function (e) {
        e.preventDefault();
        dropEl.classList.remove('cfg-verify__drop--drag');
      });
    });
    dropEl.addEventListener('drop', function (e) {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        input.files = e.dataTransfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }

  countryInputs.forEach(function (input) {
    input.addEventListener('change', function () {
      populateVoltageOptions();
      sync();
    });
  });

  if (countryOtherEl) {
    countryOtherEl.addEventListener('change', function () {
      populateVoltageOptions();
      sync();
    });
  }

  supplyInputs.forEach(function (input) {
    input.addEventListener('change', function () {
      populateVoltageOptions();
      sync();
    });
  });

  voltageEl.addEventListener('change', function () {
    toggleVoltageOtherField();
    sync();
  });

  if (voltageOtherEl) voltageOtherEl.addEventListener('input', sync);
  currentEl.addEventListener('change', sync);
  if (applicationEl) applicationEl.addEventListener('input', sync);
  if (plugTypeEl) plugTypeEl.addEventListener('change', sync);
  if (remarksEl) remarksEl.addEventListener('input', sync);

  bindFileInput(
    photoNameplate,
    nameplateName,
    nameplatePreview,
    document.getElementById('cfg-drop-nameplate')
  );
  bindFileInput(photoPlug, plugName, plugPreview, document.getElementById('cfg-drop-plug'));
  bindDropZone(document.getElementById('cfg-drop-nameplate'), photoNameplate);
  bindDropZone(document.getElementById('cfg-drop-plug'), photoPlug);

  function validateBeforeSubmit() {
      if (getCountry() === 'other' && countryOtherEl && !countryOtherEl.value) {
        countryOtherEl.focus();
        countryOtherEl.reportValidity();
        return false;
      }
      if (isVoltageOther() && !getVoltageCustomText()) {
        if (voltageOtherEl) {
          voltageOtherEl.focus();
          voltageOtherEl.reportValidity();
        }
        return false;
      }
      if (!form.checkValidity()) {
        form.reportValidity();
        return false;
      }
      if (!leadForm.checkValidity()) {
        leadForm.reportValidity();
        return false;
      }
      return true;
  }

  function submitByChannel(channel) {
      if (!validateBeforeSubmit()) return;
      var subject = 'SWITNEX™ configurator — verified engineering quote';
      var bodyText = leadSummary.value;
      var email = document.getElementById('cfg-lead-email').value.trim();

      if (channel === 'wa') {
        var waBase = CHECKOUT.whatsapp_url || 'https://wa.me/8615812381273';
        var waText = encodeURIComponent(subject + '\n\n' + bodyText + '\n\nReply email: ' + email);
        window.open(waBase + '?text=' + waText, '_blank', 'noopener');
        return;
      }

      if (channel === 'tg') {
        var tgBase = CHECKOUT.telegram_url || 'https://t.me/switnex_aaron';
        var tgText = encodeURIComponent(subject + '\n\n' + bodyText + '\n\nReply email: ' + email);
        window.open(tgBase + '?text=' + tgText, '_blank', 'noopener');
        return;
      }

      var emailTo = CHECKOUT.email_to || 'switnex@icloud.com';
      var subjectEnc = encodeURIComponent(subject);
      var bodyEnc = encodeURIComponent(bodyText);
      window.location.href =
        'mailto:' +
        emailTo +
        '?subject=' +
        subjectEnc +
        '&body=' +
        bodyEnc +
        '&cc=' +
        encodeURIComponent(email);
  }

  if (leadForm) {
    leadForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      submitByChannel('email');
    });
  }

  submitButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      submitByChannel(btn.getAttribute('data-submit-channel') || 'email');
    });
  });

  toggleCountryOther();
  populateVoltageOptions();
  sync();
})();
