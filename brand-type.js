/* Whole-label artwork in the original identity typefaces. Native text remains
   in the DOM for accessible names, selection, search and graceful fallback. */
(() => {
  'use strict';
  if (window.__DISABLE_BRAND_TYPE__) return;
  const labels = window.ALDayelBrandType;
  const sprite = window.ALDayelBrandTypeSprite;
  if (!labels || !sprite) return;
  const ns = 'http://www.w3.org/2000/svg';
  const arabic = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/;
  const omitted = 'script,style,noscript,input,textarea,select,option,svg,.sr-only,[data-brand-type],[data-brand-type-sprite]';
  const normalize = text => text.replace(/\s+/g, ' ').trim();
  const missing = new Set();
  window.__brandTypeMissing = [];
  const holder = document.createElement('div');
  holder.dataset.brandTypeSprite = '';
  holder.className = 'brand-font-sprite';
  holder.setAttribute('aria-hidden', 'true');
  holder.innerHTML = sprite;
  // Decorative symbols must not contribute a second accessible name through
  // <use>; the adjacent native DOM text is the sole label for each control.
  holder.querySelectorAll('title,desc').forEach(node => node.remove());
  document.body.prepend(holder);

  function outline(root) {
    const nodes = [];
    if (root.nodeType === Node.TEXT_NODE) nodes.push(root);
    else if (root.nodeType === Node.ELEMENT_NODE && !root.closest(omitted)) {
      const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walk.nextNode()) nodes.push(walk.currentNode);
    }
    for (const node of nodes) {
      const parent = node.parentElement;
      if (!parent || parent.closest(omitted) || !arabic.test(node.nodeValue)) continue;
      const text = normalize(node.nodeValue);
      if (!labels[text]) {
        missing.add(text);
        window.__brandTypeMissing = [...missing];
        continue;
      }
      const weight = parseInt(getComputedStyle(parent).fontWeight, 10) >= 600 ? 'bold' : 'regular';
      const metric = labels[text][weight];
      const wrapper = document.createElement('span');
      wrapper.className = 'brand-text';
      wrapper.dataset.brandType = text;
      wrapper.style.verticalAlign = `${-(metric.heightEm - metric.baselineEm)}em`;
      const native = document.createElement('span');
      native.className = 'sr-only';
      native.textContent = text;
      const graphic = document.createElementNS(ns, 'svg');
      graphic.setAttribute('class', 'brand-text-svg');
      graphic.setAttribute('aria-hidden', 'true');
      graphic.setAttribute('focusable', 'false');
      graphic.setAttribute('viewBox', metric.viewBox);
      graphic.style.width = `${metric.widthEm}em`;
      const use = document.createElementNS(ns, 'use');
      use.setAttribute('href', `#${metric.id}`);
      use.setAttribute('width', '100%');
      use.setAttribute('height', '100%');
      graphic.append(use);
      wrapper.append(native, graphic);
      const replacement = document.createDocumentFragment();
      if (/^\s/.test(node.nodeValue)) replacement.append(' ');
      replacement.append(wrapper);
      if (/\s$/.test(node.nodeValue)) replacement.append(' ');
      node.replaceWith(replacement);
    }
  }

  outline(document.body);
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'characterData') outline(record.target);
      else for (const node of record.addedNodes) outline(node);
    }
  }).observe(document.body, {childList: true, subtree: true, characterData: true});
})();
