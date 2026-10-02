/* =============================================================================
   MATTENBERGER SITE — BEHAVIOR
   -----------------------------------------------------------------------------
   This file handles everything that reacts to a click or scroll. It's split
   into clearly-labeled parts. None of it changes how things LOOK (that's
   style.css) or WHAT is on the page (index.html) — it only wires up the
   interactions.
   ============================================================================= */

/* Wait until the page's HTML is fully loaded before wiring anything up. */
document.addEventListener('DOMContentLoaded', function () {

  /* ===========================================================================
     1) MOBILE MENU
     On phones the menu links hide behind the hamburger button. Tapping it
     shows/hides them. Tapping a link closes it again.
     =========================================================================== */
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

  /* ===========================================================================
     2) ACCORDIONS  (Berufliche Erfahrungen, Ihr Termin, legal)
     Each row opens/closes on its own — several can be open at once. A pixel
     max-height is only used to animate; once open we drop the cap to "none".
     That matters because the Anreise row holds photos: with a fixed cap
     measured at click time, anything that grew afterwards (an image finishing
     loading, a reflow) got silently clipped by overflow:hidden.
     =========================================================================== */
  const accordionItems = document.querySelectorAll('.accordion-item');

  accordionItems.forEach(function (item) {
    const trigger = item.querySelector('.accordion-trigger');
    const content = item.querySelector('.accordion-content');
    let capTimer = null;

    trigger.addEventListener('click', function () {
      const isOpen = item.classList.toggle('open');
      clearTimeout(capTimer);

      if (isOpen) {
        content.style.maxHeight = content.scrollHeight + 'px';
        /* Timer rather than transitionend, so it still runs for anyone with
           reduced motion turned on (no transition means no transitionend). */
        capTimer = setTimeout(function () {
          if (item.classList.contains('open')) content.style.maxHeight = 'none';
        }, 300);
      } else {
        /* Back to a concrete height first, otherwise there's nothing to
           animate from when the cap is currently "none". */
        content.style.maxHeight = content.scrollHeight + 'px';
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { content.style.maxHeight = '0px'; });
        });
      }
    });
  });

  /* ===========================================================================
     3) THERAPY TILES  (click a tile -> it expands in place)
     Only one is open at a time. The detail content for each tile lives inside
     that tile's <template> tag in index.html, so to edit a therapy's text you
     only touch the HTML, never this file. Expanding is just: build a
     .tile-detail block, drop it into that tile, hide the compact button, let
     CSS (.expanded) span it across the row. No repositioning math needed on
     resize — the grid handles that on its own.
     =========================================================================== */
  const grid = document.getElementById('therapyGrid');
  const tiles = Array.from(grid.querySelectorAll('.therapy-tile'));

  /* Placeholder icon for the two tiles still waiting on a real photo. */
  const detailImageIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';

  let expandedTile = null;

  function expandTile(tile) {
    const template = tile.querySelector('template');
    const photo = tile.querySelector('.therapy-photo img');

    const closeBtn = document.createElement('button');
    closeBtn.className = 'detail-close';
    closeBtn.setAttribute('aria-label', 'Schließen');
    closeBtn.innerHTML = '&#10005;';
    closeBtn.addEventListener('click', function (e) { e.stopPropagation(); collapseTile(tile); });

    const image = document.createElement('div');
    image.className = 'detail-image';
    if (photo) {
      const img = document.createElement('img');
      img.src = photo.src;
      img.alt = photo.alt;
      image.appendChild(img);
    } else {
      image.innerHTML = detailImageIcon;
    }

    const text = document.createElement('div');
    text.className = 'detail-text';
    text.appendChild(template.content.cloneNode(true));  /* copy the tile's detail content in */

    const inner = document.createElement('div');
    inner.className = 'detail-inner';
    inner.appendChild(image);
    inner.appendChild(text);

    const detail = document.createElement('div');
    detail.className = 'tile-detail';
    detail.appendChild(closeBtn);
    detail.appendChild(inner);

    tile.appendChild(detail);
    tile.classList.add('expanded');
    expandedTile = tile;
  }

  function collapseTile(tile) {
    const detail = tile.querySelector('.tile-detail');
    if (detail) tile.removeChild(detail);
    tile.classList.remove('expanded');
    if (expandedTile === tile) expandedTile = null;
  }

  tiles.forEach(function (tile) {
    const card = tile.querySelector('.therapy-card');
    card.addEventListener('click', function () {
      if (expandedTile === tile) {
        collapseTile(tile);           /* clicking the open tile again closes it */
      } else {
        if (expandedTile) collapseTile(expandedTile);  /* only one open at a time */
        expandTile(tile);
      }
    });
  });

  /* ===========================================================================
     4) FADE-IN ON SCROLL
     Anything with class="reveal" fades up the first time it scrolls into view.
     (Uses IntersectionObserver, the browser's built-in "is this element visible
     yet?" tool.)
     =========================================================================== */
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

  /* ===========================================================================
     5) BACK-TO-TOP
     The floating round button appears once you've scrolled down, and both it
     and the footer "Nach oben" button return to top.
     =========================================================================== */
  const toTop = document.getElementById('toTop');

  window.addEventListener('scroll', function () {
    toTop.classList.toggle('show', window.scrollY > 500);
  });

  function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
  toTop.addEventListener('click', scrollToTop);
  document.getElementById('backToTopLink').addEventListener('click', scrollToTop);

  /* ===========================================================================
     6) PHOTO LIGHTBOX  (tap a photo -> full-size, with an X to close)
     Built once and reused, same pattern as the therapy detail box. Closes on
     the X, a click on the dark backdrop, or Escape.
     =========================================================================== */
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';

  const lightboxImg = document.createElement('img');
  lightbox.appendChild(lightboxImg);

  const lightboxClose = document.createElement('button');
  lightboxClose.className = 'lightbox-close';
  lightboxClose.setAttribute('aria-label', 'Schließen');
  lightboxClose.innerHTML = '&#10005;';
  lightbox.appendChild(lightboxClose);

  document.body.appendChild(lightbox);

  function openLightbox(src, alt) {
    lightboxImg.src = src;
    lightboxImg.alt = alt;
    lightbox.classList.add('is-open');
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightboxImg.src = '';
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();  /* backdrop, not the photo itself */
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
  });

  document.querySelectorAll('.photo-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const img = btn.querySelector('img');
      openLightbox(img.src, img.alt);
    });
  });

});