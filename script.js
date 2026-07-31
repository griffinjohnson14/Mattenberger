/* ============================================================
   MATTENBERGER SITE — BEHAVIOR
   ------------------------------------------------------------
   This file handles everything that reacts to a click or scroll.
   It's split into clearly-labeled parts. None of it changes how
   things LOOK (that's style.css) or WHAT is on the page (index.html) —
   it only wires up the interactions.
   ============================================================ */

/* Wait until the page's HTML is fully loaded before wiring anything up. */
document.addEventListener('DOMContentLoaded', function () {

  /* ==========================================================
     1) MOBILE MENU
     On phones the menu links hide behind the hamburger button.
     Tapping it shows/hides them. Tapping a link closes it again.
     ========================================================== */
  const header = document.getElementById('siteHeader');
  const menuToggle = document.getElementById('menuToggle');

  menuToggle.addEventListener('click', function () {
    const isOpen = header.classList.toggle('nav-open');
    menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  document.querySelectorAll('#navLinks a').forEach(function (link) {
    link.addEventListener('click', function () {
      header.classList.remove('nav-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* ==========================================================
     2) ACCORDIONS  (Berufliche Erfahrungen, Ihr Termin, legal)
     Each row opens/closes on its own — several can be open at once.
     We animate the height by setting max-height to the content's
     real height when open, and back to 0 when closed.
     ========================================================== */
  const accordionItems = document.querySelectorAll('.accordion-item');

  accordionItems.forEach(function (item) {
    const trigger = item.querySelector('.accordion-trigger');
    const content = item.querySelector('.accordion-content');

    trigger.addEventListener('click', function () {
      const isOpen = item.classList.toggle('open');
      content.style.maxHeight = isOpen ? content.scrollHeight + 'px' : null;
    });
  });

  /* If the window is resized while a row is open, recompute its
     height so the text never gets clipped. */
  window.addEventListener('resize', function () {
    document.querySelectorAll('.accordion-item.open .accordion-content').forEach(function (content) {
      content.style.maxHeight = content.scrollHeight + 'px';
    });
  });

  /* ==========================================================
     3) THERAPY TILES  (click a tile -> wide detail box opens below)
     Only one is open at a time. The detail content for each tile
     lives inside that tile's <template> tag in index.html, so to
     edit a therapy's text you only touch the HTML, never this file.
     ========================================================== */
  const grid = document.getElementById('therapyGrid');
  const cards = Array.from(grid.querySelectorAll('.therapy-card'));

  /* A small image-placeholder icon reused inside the detail box. */
  const detailImageIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';

  /* Build the single detail box once; we move and refill it as needed. */
  const panel = document.createElement('div');
  panel.className = 'therapy-detail-panel';
  let activeCard = null;

  function fillPanel(card) {
    const template = card.querySelector('template');
    panel.innerHTML = '';

    /* Close (X) button */
    const closeBtn = document.createElement('button');
    closeBtn.className = 'detail-close';
    closeBtn.setAttribute('aria-label', 'Schließen');
    closeBtn.innerHTML = '&#10005;';
    closeBtn.addEventListener('click', function (e) { e.stopPropagation(); closePanel(); });
    panel.appendChild(closeBtn);

    /* Layout: a larger image placeholder on the left, text on the right. */
    const inner = document.createElement('div');
    inner.className = 'detail-inner';

    const image = document.createElement('div');
    image.className = 'detail-image';
    image.innerHTML = detailImageIcon;

    const text = document.createElement('div');
    text.className = 'detail-text';
    text.appendChild(template.content.cloneNode(true));  /* copy the tile's detail content in */

    inner.appendChild(image);
    inner.appendChild(text);
    panel.appendChild(inner);
  }

  /* Places the detail box on its own full-width row, directly after
     the LAST tile in the same row as the clicked tile — so it always
     appears below that row, at any screen width. */
  function placePanelAfterRowOf(card) {
    if (panel.parentNode) panel.parentNode.removeChild(panel);  /* detach first so it doesn't skew the measurement */

    const rowTop = card.offsetTop;
    let lastInRow = card;
    cards.forEach(function (c) {
      if (Math.abs(c.offsetTop - rowTop) < 2) lastInRow = c;  /* same visual row = same distance from the top */
    });

    grid.insertBefore(panel, lastInRow.nextSibling);
  }

  function openPanel(card) {
    fillPanel(card);
    placePanelAfterRowOf(card);
    panel.classList.add('open');
    cards.forEach(function (c) { c.classList.remove('active'); });
    card.classList.add('active');
    activeCard = card;
  }

  function closePanel() {
    panel.classList.remove('open');
    if (panel.parentNode) panel.parentNode.removeChild(panel);
    cards.forEach(function (c) { c.classList.remove('active'); });
    activeCard = null;
  }

  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      if (activeCard === card) {
        closePanel();          /* clicking the open tile again closes it */
      } else {
        openPanel(card);       /* otherwise open this one (and close any other) */
      }
    });
  });

  /* Keep the box under the right row if the window is resized. */
  window.addEventListener('resize', function () {
    if (activeCard) placePanelAfterRowOf(activeCard);
  });

  /* ==========================================================
     4) FADE-IN ON SCROLL
     Anything with class="reveal" fades up the first time it
     scrolls into view. (Uses IntersectionObserver, the browser's
     built-in "is this element visible yet?" tool.)
     ========================================================== */
  const revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);  /* only animate once */
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(function (el) {
    revealObserver.observe(el);
  });

  /* ==========================================================
     5) BACK-TO-TOP
     The floating round button appears once you've scrolled down,
     and both it and the footer "Nach oben" button return to top.
     ========================================================== */
  const toTop = document.getElementById('toTop');

  window.addEventListener('scroll', function () {
    toTop.classList.toggle('show', window.scrollY > 500);
  });

  function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
  toTop.addEventListener('click', scrollToTop);
  document.getElementById('backToTopLink').addEventListener('click', scrollToTop);

});