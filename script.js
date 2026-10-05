/* =========================================================
   REMONT DESIGN — интерактив лендинга
   ========================================================= */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  /* ---------- Шапка: тень при прокрутке ---------- */
  const header = document.getElementById('header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Мобильное меню ---------- */
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');

  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  };

  burger.addEventListener('click', () => {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });
  window.matchMedia('(min-width: 1025px)').addEventListener('change', (e) => {
    if (e.matches) setMenu(false);
  });

  /* ---------- Подсветка активного пункта меню ---------- */
  const navLinks = [...document.querySelectorAll('.nav__list a')];
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) =>
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id)
        );
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Появление блоков при прокрутке ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach((el) => {
      // Небольшая задержка для соседних карточек в сетке
      const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
      const idx = siblings.indexOf(el);
      if (siblings.length > 1) el.style.transitionDelay = (idx % 5) * 80 + 'ms';
      io.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Калькулятор ---------- */
  const DAYS = { 6000: 25, 14000: 50, 22000: 60, 11000: 45 };
  const area = document.getElementById('calc-area');
  const areaOut = document.getElementById('calc-area-out');
  const priceEl = document.getElementById('calc-price');
  const perEl = document.getElementById('calc-per');
  const daysEl = document.getElementById('calc-days');
  const typeInputs = document.querySelectorAll('input[name="calc-type"]');
  const calcCta = document.getElementById('calc-cta');
  const fmt = new Intl.NumberFormat('ru-RU');

  let shownPrice = 0;
  let rafId = null;

  const animatePrice = (target) => {
    cancelAnimationFrame(rafId);
    const from = shownPrice;
    const start = performance.now();
    const dur = 450;
    const step = (now) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      shownPrice = Math.round(from + (target - from) * eased);
      priceEl.textContent = fmt.format(shownPrice);
      if (t < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
  };

  const updateCalc = () => {
    const a = Number(area.value);
    const rate = Number(document.querySelector('input[name="calc-type"]:checked').value);
    // Для больших площадей срок растёт пропорционально
    const days = Math.round(DAYS[rate] * Math.max(1, a / 80));

    areaOut.textContent = a + ' м²';
    perEl.textContent = fmt.format(rate);
    daysEl.textContent = days;

    const fill = ((a - area.min) / (area.max - area.min)) * 100;
    area.style.setProperty('--fill', fill + '%');

    animatePrice(a * rate);
  };

  area.addEventListener('input', updateCalc);
  typeInputs.forEach((i) => i.addEventListener('change', updateCalc));
  updateCalc();

  // Перенос площади из калькулятора в форму заявки
  calcCta.addEventListener('click', () => {
    document.getElementById('lead-area').value = area.value;
  });

  /* ---------- Маска телефона ---------- */
  const phone = document.getElementById('lead-phone');

  const formatPhone = (value) => {
    let d = value.replace(/\D/g, '');
    if (!d) return '';
    if (d[0] === '8') d = '7' + d.slice(1);
    if (d[0] !== '7') d = '7' + d;
    d = d.slice(0, 11);
    let out = '+7';
    if (d.length > 1) out += ' (' + d.slice(1, 4);
    if (d.length >= 4) out += ')';
    if (d.length > 4) out += ' ' + d.slice(4, 7);
    if (d.length > 7) out += '-' + d.slice(7, 9);
    if (d.length > 9) out += '-' + d.slice(9, 11);
    return out;
  };

  phone.addEventListener('input', () => {
    phone.value = formatPhone(phone.value);
  });
  phone.addEventListener('focus', () => {
    if (!phone.value) phone.value = '+7 (';
  });
  phone.addEventListener('blur', () => {
    if (phone.value.replace(/\D/g, '').length <= 1) phone.value = '';
  });

  /* ---------- Валидация и отправка формы ---------- */
  const form = document.getElementById('lead-form');
  const status = document.getElementById('lead-status');

  const setError = (input, msg) => {
    const err = form.querySelector(`.form__error[data-for="${input.id}"]`);
    input.classList.toggle('is-invalid', Boolean(msg));
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) err.textContent = msg || '';
  };

  const validators = {
    'lead-name': (v) => (v.trim().length < 2 ? 'Укажите, как к вам обращаться' : ''),
    'lead-phone': (v) => (v.replace(/\D/g, '').length !== 11 ? 'Введите номер телефона полностью' : ''),
    'lead-area': (v) => {
      if (!v) return '';
      const n = Number(v);
      return n < 10 || n > 1000 ? 'Площадь от 10 до 1000 м²' : '';
    },
  };

  Object.keys(validators).forEach((id) => {
    const input = document.getElementById(id);
    input.addEventListener('input', () => {
      if (input.classList.contains('is-invalid')) setError(input, validators[id](input.value));
    });
  });

  const consent = document.getElementById('lead-consent');
  consent.addEventListener('change', () => {
    if (consent.checked) setError(consent, '');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    status.textContent = '';
    status.className = 'form__status';

    let firstInvalid = null;
    Object.keys(validators).forEach((id) => {
      const input = document.getElementById(id);
      const msg = validators[id](input.value);
      setError(input, msg);
      if (msg && !firstInvalid) firstInvalid = input;
    });

    if (!consent.checked) {
      setError(consent, 'Необходимо согласие на обработку персональных данных');
      if (!firstInvalid) firstInvalid = consent;
    }

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    // TODO: подключите отправку заявки (CRM, Telegram-бот, почта и т.п.)
    // fetch('/api/lead', { method: 'POST', body: new FormData(form) })
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Отправляем…';

    setTimeout(() => {
      form.reset();
      btn.disabled = false;
      btn.textContent = 'Вызвать замерщика';
      status.textContent = 'Спасибо! Мы перезвоним вам в течение 15 минут.';
      status.classList.add('is-success');
    }, 800);
  });

  /* ---------- FAQ: открыт только один вопрос ---------- */
  const faqItems = document.querySelectorAll('.faq__item');
  faqItems.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) faqItems.forEach((other) => { if (other !== item) other.open = false; });
    });
  });

  /* ---------- Год в подвале ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
