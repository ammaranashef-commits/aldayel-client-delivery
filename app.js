(() => {
  'use strict';
  const data = window.ALDayelContent;
  if (!data) return;
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const size = bytes => bytes >= 1000000 ? `${(bytes / 1000000).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1000))} KB`;
  const downloadIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/></svg>';
  const zoomIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg>';
  const previewItems = new Map();
  const asDownload = href => `href="${esc(href)}" download`;
  const filesHTML = files => `<details class="file-details"><summary><span>تنزيلات مباشرة <bdi>(${files.length})</bdi></span><span aria-hidden="true">+</span></summary><ul class="file-list">${files.map(file => `<li><a ${asDownload(file.href)} aria-label="تحميل ${esc(file.label)} بصيغة ${esc(file.format)}"><span class="file-label">${esc(file.label)}</span><span class="file-right-meta"><span class="format-badge">${esc(file.format)}</span><span class="file-size">${size(file.bytes)}</span></span></a></li>`).join('')}</ul></details>`;
  document.querySelectorAll('[data-package]').forEach(a => { a.href = data.packages[a.dataset.package].href; });
  $('#full-package-meta').textContent = `ZIP / ${size(data.packages.full.bytes)} + ${size(data.packages.compact.bytes)}`;
  $('#compact-package-meta').textContent = `ZIP / ${size(data.packages.compact.bytes)}`;

  $('#guide-grid').innerHTML = data.guides.map(g => `<article class="guide-card" data-guide="${esc(g.id)}"><a class="guide-cover" href="${esc(g.href)}" target="_blank" rel="noopener" aria-label="عرض ${esc(g.title)} بصيغة PDF"><img src="${esc(g.preview)}" alt="غلاف ${esc(g.title)}" width="480" height="600" loading="lazy"><span class="cover-action" aria-hidden="true"><svg class="link-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg></span></a><div class="guide-info"><p class="card-eyebrow">${esc(g.eyebrow)}</p><h3>${esc(g.title)}</h3><p>${esc(g.description)}</p><span class="file-meta"><bdi dir="ltr">PDF</bdi><span aria-hidden="true">·</span><bdi dir="rtl">${g.pages} صفحة</bdi><span aria-hidden="true">·</span><bdi dir="ltr">${size(g.bytes)}</bdi></span><div class="guide-bottom"><a class="text-link" href="${esc(g.href)}" target="_blank" rel="noopener">عرض الدليل <svg class="link-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg></a><a class="icon-button" ${asDownload(g.href)} aria-label="تحميل ${esc(g.title)}">${downloadIcon}</a></div></div></article>`).join('');

  function appCard(item, index, compact = false) {
    const key = `${compact ? 'compact' : 'full'}-${item.id}`;
    previewItems.set(key, {title:item.title,preview:item.preview,href:item.bundle?.href || item.files.find(f => f.format === 'PDF')?.href || item.files[0]?.href,bundle:Boolean(item.bundle)});
    return `<article class="${compact ? 'compact-card' : 'app-card'}" ${!compact ? `data-id="${esc(item.id)}" data-category="${esc(item.category)}" data-search="${esc(item.title + ' ' + item.description + ' ' + item.files.map(f=>f.label).join(' '))}"` : ''}><button type="button" class="app-preview" data-preview="${esc(key)}" aria-label="معاينة ${esc(item.title)}"><img src="${esc(item.preview)}" alt="معاينة ${esc(item.title)}" loading="lazy" width="660" height="500"><span class="preview-badge">${zoomIcon} تكبير المعاينة</span></button><div class="app-body"><div class="app-heading"><h3>${esc(item.title)}</h3>${!compact ? `<span class="app-order">${String(index+1).padStart(2,'0')}</span>` : ''}</div><p class="app-description">${esc(item.description)}</p>${item.bundle && !compact ? `<a class="group-download" ${asDownload(item.bundle.href)}><span>تحميل المجموعة</span><span class="bundle-size">ZIP · ${size(item.bundle.bytes)}</span>${downloadIcon}</a>` : ''}</div>${filesHTML(item.files)}</article>`;
  }
  $('#application-grid').innerHTML = data.applications.map((item,index)=>appCard(item,index)).join('');
  $('#compact-grid').innerHTML = data.compact.map((item,index)=>appCard(item,index,true)).join('');
  $('#resource-list').innerHTML = data.resources.map(r => `<a class="resource-link" ${asDownload(r.href)}><div><h3>${esc(r.title)}</h3><p>${esc(r.description)}</p><span class="file-meta">${esc(r.format || 'ZIP')} · ${size(r.bytes)}</span></div>${downloadIcon}</a>`).join('');

  let category = 'all';
  const normalize = value => value.toLowerCase().replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/[\u064B-\u065F]/g,'').trim();
  function filter() {
    const query = normalize($('#library-search').value);
    let visible = 0;
    document.querySelectorAll('.app-card').forEach(card => {
      const match = (category === 'all' || card.dataset.category === category) && normalize(card.dataset.search).includes(query);
      card.hidden = !match;
      if(match) visible++;
    });
    $('#result-count').textContent = `${visible} من ${data.applications.length} مجموعات`;
    $('#empty-state').hidden = visible > 0;
  }
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    category = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(b => {b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button));});
    filter();
  }));
  $('#library-search').addEventListener('input', () => { filter(); $('#search-placeholder').hidden = Boolean($('#library-search').value); });
  $('#library-search').addEventListener('focus', () => { $('#search-placeholder').hidden=true; });
  $('#library-search').addEventListener('blur', () => { $('#search-placeholder').hidden=Boolean($('#library-search').value); });
  $('#reset-search').addEventListener('click', () => {$('#library-search').value=''; $('[data-filter="all"]').click(); $('#library-search').focus();});
  filter();

  const dialog = $('#preview-dialog');
  const closePreview = () => dialog.close();
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-preview]');
    if(!button) return;
    const item = previewItems.get(button.dataset.preview);
    $('#preview-title').textContent = item.title;
    $('#preview-image').src = item.preview;
    $('#preview-image').alt = `معاينة ${item.title}`;
    $('#preview-download').href = item.href;
    $('#preview-download').innerHTML = `${item.bundle ? 'تحميل المجموعة' : 'تحميل الملف'} <svg class="link-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M5 13l7 7 7-7"/></svg>`;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  });
  $('#close-preview').addEventListener('click', closePreview);
  dialog.addEventListener('close', () => {document.body.style.overflow='';});
  dialog.addEventListener('click', event => {if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closePreview();}});
})();
