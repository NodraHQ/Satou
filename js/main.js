/* ============================================================
   main.js
   Vanilla JS, no dependencies. Organized as small independent
   modules, each initialized once on DOMContentLoaded.
   New sections added in later stages should register their own
   init function in the bottom "BOOT" block.
   ============================================================ */

(function () {
  'use strict';

  /* ------------------------------------------------------------
     MODULE: Language toggle (PT / EN)
     Default language: PT. Persists only in memory (per session).
     ------------------------------------------------------------ */
  const LangToggle = (function () {
    let current = 'pt';

    function stored() {
      try {
        const fromUrl = new URLSearchParams(location.search).get('lang');
        if (fromUrl === 'pt' || fromUrl === 'en') return fromUrl;
        const v = localStorage.getItem('satou-lang');
        return v === 'en' ? 'en' : 'pt';
      } catch (e) { return 'pt'; }
    }

    function apply(lang) {
      current = lang;
      document.body.classList.remove('lang-pt', 'lang-en');
      document.body.classList.add('lang-' + lang);
      document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
      try { localStorage.setItem('satou-lang', lang); } catch (e) { /* modo privado */ }

      /* links com versão por idioma (ex.: media kit PDF) */
      document.querySelectorAll('[data-href-en]').forEach((a) => {
        if (!a.hasAttribute('data-href-pt')) a.setAttribute('data-href-pt', a.getAttribute('href'));
        a.setAttribute('href', a.getAttribute(lang === 'en' ? 'data-href-en' : 'data-href-pt'));
      });

      /* selects duplicados por idioma: só o visível é enviado */
      document.querySelectorAll('select[data-lang]').forEach((sel) => {
        sel.disabled = sel.getAttribute('data-lang') !== lang;
      });

      document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
        btn.textContent = lang === 'pt' ? 'EN' : 'PT';
        btn.setAttribute('aria-label', lang === 'pt' ? 'Switch to English' : 'Mudar para Português');
      });
    }

    function toggle() {
      apply(current === 'pt' ? 'en' : 'pt');
    }

    function init() {
      apply(stored());
      document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
        btn.addEventListener('click', toggle);
      });
    }

    return { init };
  })();

  /* ------------------------------------------------------------
     MODULE: Sticky nav (background/blur on scroll) + mobile menu
     ------------------------------------------------------------ */
  const Nav = (function () {
    let nav, toggleBtn, mobilePanel;

    function onScroll() {
      const scrolled = window.scrollY > 12;
      nav.classList.toggle('is-scrolled', scrolled);
    }

    function toggleMobile() {
      const isOpen = mobilePanel.classList.toggle('is-open');
      toggleBtn.classList.toggle('is-open', isOpen);
      toggleBtn.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    function closeMobile() {
      mobilePanel.classList.remove('is-open');
      toggleBtn.classList.remove('is-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    function init() {
      nav = document.querySelector('.nav');
      toggleBtn = document.querySelector('.nav-toggle');
      mobilePanel = document.querySelector('.nav-mobile-panel');
      if (!nav) return;

      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });

      if (toggleBtn && mobilePanel) {
        toggleBtn.addEventListener('click', toggleMobile);
        mobilePanel.querySelectorAll('a').forEach((link) => {
          link.addEventListener('click', closeMobile);
        });
      }
    }

    return { init };
  })();

  /* ------------------------------------------------------------
     MODULE: Scroll reveal
     Any element with [data-reveal] fades/slides in once it enters
     the viewport. Works for single elements and groups (children
     get a staggered [data-delay] attribute set automatically).
     ------------------------------------------------------------ */
  const ScrollReveal = (function () {
    function init() {
      const targets = document.querySelectorAll('[data-reveal]');
      if (!targets.length) return;

      if (!('IntersectionObserver' in window)) {
        targets.forEach((el) => el.classList.add('is-visible'));
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
      );

      targets.forEach((el) => observer.observe(el));
    }

    return { init };
  })();

  /* ------------------------------------------------------------
     MODULE: Animated counters
     Usage: <span data-counter data-target="488" data-suffix="K">0</span>
     Triggers once, when the element enters the viewport.
     ------------------------------------------------------------ */
  const Counters = (function () {
    function animate(el) {
      const target = parseFloat(el.getAttribute('data-target'));
      const suffix = el.getAttribute('data-suffix') || '';
      const decimals = el.getAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals'), 10) : 0;
      const duration = 1400;
      const start = performance.now();

      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); /* ease-out cubic */
        const value = target * eased;
        el.textContent = value.toFixed(decimals) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    }

    function init() {
      const targets = document.querySelectorAll('[data-counter]');
      if (!targets.length) return;

      if (!('IntersectionObserver' in window)) {
        targets.forEach(animate);
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animate(entry.target);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );

      targets.forEach((el) => observer.observe(el));
    }

    return { init };
  })();

  /* ------------------------------------------------------------
     MODULE: Contact form (FormSubmit via fetch)
     Sem JS, o <form> faz POST normal para o FormSubmit.
     Botões [data-service] pré-selecionam o formato no form.
     ------------------------------------------------------------ */
  const ContactForm = (function () {
    const MSG = {
      pt: {
        sending: 'Enviando...',
        ok: 'Mensagem enviada! Vou responder no e-mail informado.',
        error: 'Não foi possível enviar. Escreva direto para <a href="mailto:satoukibijusu@gmail.com">satoukibijusu@gmail.com</a>.'
      },
      en: {
        sending: 'Sending...',
        ok: 'Message sent! I will reply to the email you provided.',
        error: 'Could not send. Please email <a href="mailto:satoukibijusu@gmail.com">satoukibijusu@gmail.com</a> directly.'
      }
    };

    function lang() {
      return document.body.classList.contains('lang-en') ? 'en' : 'pt';
    }

    function preselect(key) {
      document.querySelectorAll('#contact-form select').forEach((sel) => {
        const opt = sel.querySelector('option[data-key="' + key + '"]');
        if (opt) sel.value = opt.value;
      });
    }

    function init() {
      const form = document.getElementById('contact-form');
      if (!form) return;
      const status = form.querySelector('.form-status');
      const btn = form.querySelector('button[type="submit"]');

      document.querySelectorAll('[data-service]').forEach((el) => {
        el.addEventListener('click', () => preselect(el.getAttribute('data-service')));
      });

      form.addEventListener('submit', function (e) {
        if (!window.fetch || !window.FormData) return; /* fallback: POST normal */
        e.preventDefault();
        const m = MSG[lang()];
        status.className = 'form-status';
        status.textContent = m.sending;
        btn.disabled = true;

        const endpoint = form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/');
        fetch(endpoint, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form)
        })
          .then((r) => r.json().then((d) => ({ ok: r.ok, d: d })))
          .then((res) => {
            if (!res.ok || String(res.d.success) !== 'true') throw new Error(res.d.message || 'fail');
            status.className = 'form-status is-ok';
            status.textContent = m.ok;
            form.reset();
          })
          .catch(() => {
            status.className = 'form-status is-error';
            status.innerHTML = m.error;
          })
          .finally(() => { btn.disabled = false; });
      });
    }

    return { init };
  })();

  /* ------------------------------------------------------------
     BOOT
     ------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', function () {
    LangToggle.init();
    Nav.init();
    ScrollReveal.init();
    Counters.init();
    ContactForm.init();
  });
})();
