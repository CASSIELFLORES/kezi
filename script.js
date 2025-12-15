// Mobile nav toggle, set footer year, smooth scroll (responsive fixes)
document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.querySelector('.menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  const yearEl = document.getElementById('year');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Ensure ARIA state is consistent
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
  if (mobileNav) mobileNav.setAttribute('aria-hidden', 'true');

  // Toggle mobile nav by adding/removing the .open class (allows CSS transitions)
  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      mobileNav.setAttribute('aria-hidden', String(!isOpen));
      toggle.setAttribute('aria-expanded', String(isOpen));
      if (isOpen) mobileNav.querySelector('a')?.focus();
    });

    // Close when pressing Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
        mobileNav.classList.remove('open');
        mobileNav.setAttribute('aria-hidden', 'true');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  // Close mobile nav on any link click inside the mobile nav
  if (mobileNav) {
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (!mobileNav.classList.contains('open')) return;
        mobileNav.classList.remove('open');
        mobileNav.setAttribute('aria-hidden', 'true');
        toggle?.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Gallery link handler: navigate to gallery page
  const galleryLink = document.getElementById('gallery-link');
  const mobileGalleryLink = document.getElementById('mobile-gallery-link');
  function openGalleryPage(e) {
    e.preventDefault();
    window.location.href = 'gallery.html';
  }
  if (galleryLink) galleryLink.addEventListener('click', openGalleryPage);
  if (mobileGalleryLink) mobileGalleryLink.addEventListener('click', openGalleryPage);

  // Add smooth scroll for internal links (modern browsers)
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    // skip gallery links - they have their own handler
    if (anchor.id === 'gallery-link' || anchor.id === 'mobile-gallery-link') return;
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Active nav link highlighting: mark nav item for section currently in view
  (function setupActiveNav() {
    const navLinks = Array.from(document.querySelectorAll('.main-nav a'));
    const mobileLinks = Array.from(document.querySelectorAll('#mobile-nav a'));
    const sections = Array.from(document.querySelectorAll('main > section[id]'));
    if (!sections.length) return;

    const setActive = (href) => {
      navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === href));
      mobileLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === href));
    };

    // Clicking an internal nav link should immediately set it active
    [...navLinks, ...mobileLinks].forEach(a => {
      if (!a.getAttribute('href') || a.getAttribute('href') === '#') return;
      a.addEventListener('click', () => {
        const href = a.getAttribute('href');
        if (href && href.startsWith('#')) setActive(href);
      });
    });

    // IntersectionObserver to update active link on scroll
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.target.id) return;
        const href = `#${entry.target.id}`;
        if (entry.isIntersecting) setActive(href);
      });
    }, { root: null, rootMargin: '-40% 0px -55% 0px', threshold: 0.15 });

    sections.forEach(s => observer.observe(s));
  })();

  // Header hide/show on scroll: hide when scrolling down, show when scrolling up
  (function headerHideOnScroll() {
    const headerEl = document.querySelector('.site-header');
    const mobileNavEl = document.getElementById('mobile-nav');
    if (!headerEl) return;

    let lastY = window.pageYOffset || document.documentElement.scrollTop;
    let ticking = false;
    const threshold = 1; // minimum px movement to react (very sensitive)
    const hideOffset = 0; // hide immediately after any scroll down

    function applyShow() {
      // make the reveal instant by disabling transition for this frame
      headerEl.style.transition = 'none';
      headerEl.style.transform = '';
      headerEl.classList.remove('header-hidden');
      // restore a fast transition on the next frame for subsequent hides
      requestAnimationFrame(() => {
        headerEl.style.transition = 'transform 150ms cubic-bezier(.2,.9,.3,1), box-shadow 150ms ease';
      });
    }

    function applyHide() {
      headerEl.style.transition = headerEl.style.transition || 'transform 150ms cubic-bezier(.2,.9,.3,1), box-shadow 150ms ease';
      headerEl.style.transform = 'translateY(-110%)';
      headerEl.classList.add('header-hidden');
    }

    window.addEventListener('scroll', () => {
      const y = window.pageYOffset || document.documentElement.scrollTop;

      // if mobile nav is open, keep header visible
      if (mobileNavEl && mobileNavEl.classList.contains('open')) {
        applyShow();
        lastY = y;
        return;
      }

      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (Math.abs(y - lastY) < threshold) {
            ticking = false;
            return;
          }

          if (y > lastY && y > hideOffset) {
            applyHide();
          } else {
            applyShow();
          }

          lastY = y <= 0 ? 0 : y;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Extra listeners for immediate response to wheel/touch gestures
    // wheel: desktop mouse wheel — deltaY < 0 is scroll up
    window.addEventListener('wheel', (e) => {
      if (mobileNavEl && mobileNavEl.classList.contains('open')) return;
      if (e.deltaY < 0) applyShow();
      else if (e.deltaY > 0) applyHide();
    }, { passive: true });

    // touch: update based on actual scroll position during touch interactions
    let lastTouchY = window.pageYOffset || document.documentElement.scrollTop;
    window.addEventListener('touchmove', () => {
      if (mobileNavEl && mobileNavEl.classList.contains('open')) return;
      const y = window.pageYOffset || document.documentElement.scrollTop;
      if (y < lastTouchY) applyShow();
      else if (y > lastTouchY) applyHide();
      lastTouchY = y;
    }, { passive: true });
  })();

  // When page is opened with a fragment (from gallery links), ensure target is visible
  (function handleInitialHash() {
    function revealTarget(hash) {
      if (!hash) return;
      try {
        const el = document.querySelector(hash);
        if (el) {
          // ensure header is visible before scrolling so margin calculations are stable
          const headerEl = document.querySelector('.site-header');
          if (headerEl) {
            headerEl.classList.remove('header-hidden');
            headerEl.style.transform = '';
          }
          // smooth scroll into view
          setTimeout(() => { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
        }
      } catch (e) { /* invalid selector */ }

      if (hash === '#Experience' && window.showExperienceSlide) {
        // open the experience slider (first slide or data-slide if provided)
        try { window.showExperienceSlide(0); } catch (e) { /* ignore */ }
      }
    }

    // handle initial load
    revealTarget(location.hash);

    // handle navigations that change the hash while on the page
    window.addEventListener('hashchange', () => revealTarget(location.hash));
  })();

  // Experience slider (flashcard / carousel)
  const experienceSlider = document.querySelector('.experience-slider');
  if (experienceSlider) {
    const slides = Array.from(experienceSlider.querySelectorAll('.slide'));
    const prevBtn = experienceSlider.querySelector('.prev');
    const nextBtn = experienceSlider.querySelector('.next');
    const dotsContainer = experienceSlider.querySelector('.dots');
    let current = 0;
    let timer = null;

    function showExpSlide(index) {
      index = (index + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle('active', i === index));
      const dots = dotsContainer.querySelectorAll('.dot');
      dots.forEach((d, i) => d.classList.toggle('active', i === index));
      current = index;
    }

    // expose function so nav links can open a specific slide
    window.showExperienceSlide = function (index) {
      if (typeof index === 'string') index = parseInt(index, 10) || 0;
      if (!Number.isFinite(index)) index = 0;
      showExpSlide(index);
      // ensure the Experience section is visible and focused
      const el = document.getElementById('Experience');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // build dots
    slides.forEach((_, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dot';
      btn.setAttribute('aria-label', `Go to slide ${i + 1}`);
      btn.addEventListener('click', () => { showExpSlide(i); resetTimer(); });
      dotsContainer.appendChild(btn);
    });

    prevBtn?.addEventListener('click', () => { showExpSlide(current - 1); resetTimer(); });
    nextBtn?.addEventListener('click', () => { showExpSlide(current + 1); resetTimer(); });

    function startTimer() { timer = setInterval(() => showExpSlide(current + 1), 5500); }
    function resetTimer() { clearInterval(timer); startTimer(); }

    experienceSlider.addEventListener('mouseenter', () => clearInterval(timer));
    experienceSlider.addEventListener('mouseleave', () => startTimer());

    // keyboard navigation when not focused on form fields
    document.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') prevBtn?.click();
      if (e.key === 'ArrowRight') nextBtn?.click();
    });

    // init
    showExpSlide(0);
    startTimer();
    // wire nav links with data-slide to open the slider
    document.querySelectorAll('a[data-slide]').forEach(a => {
      a.addEventListener('click', function (e) {
        const slide = parseInt(this.getAttribute('data-slide'), 10) || 0;
        // if slider exists, open requested slide
        if (window.showExperienceSlide) {
          e.preventDefault();
          window.showExperienceSlide(slide);
          resetTimer();
        }
      });
    });
  }

  // Certificates are displayed as a static responsive grid now; carousel JS removed.
  // Lightbox handlers for certificate preview
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const lbImg = lightbox.querySelector('img');
    const lbCaption = lightbox.querySelector('.lightbox-caption');
    const lbClose = lightbox.querySelector('.lightbox-close');

    function openLightbox(src, alt, caption) {
      lbImg.src = src;
      lbImg.alt = alt || '';
      lbCaption.textContent = caption || '';
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      lbClose?.focus();
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      lbImg.src = '';
      lbImg.alt = '';
      lbCaption.textContent = '';
      document.body.style.overflow = '';
    }

    // click on any certificate image to open lightbox
    document.querySelectorAll('.certificates-slider .cert-image').forEach(img => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', (e) => {
        const src = img.getAttribute('src');
        const alt = img.getAttribute('alt') || '';
        // try to find title nearby
        const card = img.closest('.certificate-card');
        const title = card?.querySelector('h3')?.textContent || '';
        openLightbox(src, alt, title);
      });
    });

    // make the whole card clickable (except when clicking the image itself)
    document.querySelectorAll('.certificate-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        if (e.target.closest('.cert-image') || e.target.closest('button')) return;
        const img = card.querySelector('.cert-image');
        if (!img) return;
        const src = img.getAttribute('src');
        const alt = img.getAttribute('alt') || '';
        const title = card.querySelector('h3')?.textContent || '';
        openLightbox(src, alt, title);
      });
    });

    // close handlers
    lbClose?.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox(); });

    // helper: open lightbox with HTML caption (for journal full text)
    function openLightboxHTML(src, alt, captionHtml) {
      lbImg.src = src;
      lbImg.alt = alt || '';
      lbCaption.innerHTML = captionHtml || '';
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      lbClose?.focus();
      document.body.style.overflow = 'hidden';
    }

    // inject bottom-left action icons into each journal entry (view + link)
    document.querySelectorAll('.journal-entry').forEach(entry => {
      const actions = document.createElement('div');
      actions.className = 'card-actions';

      const btnView = document.createElement('button');
      btnView.type = 'button';
      btnView.className = 'btn-view';
      btnView.setAttribute('aria-label', 'Open journal');
      // show the image icon in the small action button; clicking it will open
      // an alternate image if `data-view-src` is present on the entry.
      btnView.innerHTML = '<i class="fa-solid fa-image"></i>';
      btnView.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const altSrc = entry.getAttribute('data-view-src');
        const title = entry.querySelector('h3')?.textContent || '';
        // if an alternate view image is specified on the entry, open that instead
        if (altSrc) {
          openLightbox(altSrc, title, title);
          return;
        }
        const img = entry.querySelector('.journal-image');
        const src = img?.getAttribute('src');
        const alt = img?.getAttribute('alt') || '';
        const date = entry.querySelector('.journal-date')?.textContent || '';
        const paras = Array.from(entry.querySelectorAll('p')).map(p => p.textContent).join('\n\n');
        const captionHtml = `
          <div style="font-weight:700;margin-bottom:6px">${title}</div>
          <div style="color:var(--muted);font-size:0.9rem;margin-bottom:8px">${date}</div>
          <div style="color:var(--muted);line-height:1.6">${paras}</div>
        `;
        openLightboxHTML(src || '', alt, captionHtml);
      });

      const btnLink = document.createElement('button');
      btnLink.type = 'button';
      btnLink.className = 'btn-link';
      btnLink.setAttribute('aria-label','Open company page');
      btnLink.innerHTML = '<i class="fa-solid fa-up-right-from-square"></i>';
      btnLink.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const external = entry.getAttribute('data-external') || entry.querySelector('a[href]')?.getAttribute('href');
        if (external) {
          window.open(external, '_blank');
          return;
        }
        // fallback: open Google search for the company title
        const title = entry.querySelector('h3')?.textContent || '';
        if (title) {
          const q = encodeURIComponent(title + ' company');
          window.open(`https://www.google.com/search?q=${q}`, '_blank');
        }
      });

      actions.appendChild(btnLink);
      actions.appendChild(btnView);
      entry.style.position = entry.style.position || 'relative';
      const titleEl = entry.querySelector('h3');
      if (titleEl) titleEl.insertAdjacentElement('afterend', actions);
      else entry.appendChild(actions);
    });
  }
});
  