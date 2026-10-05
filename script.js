/* =========================================================
   REMONT DESIGN — интерактив лендинга
   ========================================================= */
(function () {
  'use strict';

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
  window.matchMedia('(min-width: 1101px)').addEventListener('change', (e) => {
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

  /* ---------- Карусель портфолио ---------- */
  const track = document.getElementById('pf-track');
  const prev = document.getElementById('pf-prev');
  const next = document.getElementById('pf-next');
  const dotsBox = document.getElementById('pf-dots');

  const cardStep = () => {
    const card = track.querySelector('.project');
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return card.getBoundingClientRect().width + gap;
  };
  const pageCount = () => {
    const perView = Math.max(1, Math.round(track.clientWidth / cardStep()));
    return Math.max(1, track.children.length - perView + 1);
  };
  const currentIndex = () => Math.round(track.scrollLeft / cardStep());
  const goTo = (i) => track.scrollTo({ left: i * cardStep() });

  const buildDots = () => {
    const n = pageCount();
    dotsBox.innerHTML = '';
    dotsBox.hidden = n < 2;
    for (let i = 0; i < n; i++) {
      const d = document.createElement('button');
      d.type = 'button';
      d.setAttribute('role', 'tab');
      d.setAttribute('aria-label', 'Проекты, страница ' + (i + 1));
      d.addEventListener('click', () => goTo(i));
      dotsBox.appendChild(d);
    }
    syncCarousel();
  };
  const syncCarousel = () => {
    const i = Math.min(currentIndex(), pageCount() - 1);
    [...dotsBox.children].forEach((d, k) => d.setAttribute('aria-selected', String(k === i)));
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  };

  prev.addEventListener('click', () => goTo(currentIndex() - 1));
  next.addEventListener('click', () => goTo(currentIndex() + 1));
  track.addEventListener('scroll', () => requestAnimationFrame(syncCarousel), { passive: true });
  window.addEventListener('resize', buildDots);
  buildDots();

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
    let d;
    if (value.includes('+7')) {
      // Префикс уже есть: берём цифры без него, где бы ни стоял курсор
      d = value.replace('+7', '').replace(/\D/g, '');
    } else {
      d = value.replace(/\D/g, '');
      // Вставили номер целиком с 7 или 8 в начале
      if (d.length >= 11 && (d[0] === '7' || d[0] === '8')) d = d.slice(1);
      else if (d === '7' || d === '8') d = '';
    }
    d = d.slice(0, 10);
    if (!d) return '';
    let out = '+7 (' + d.slice(0, 3);
    if (d.length > 3) out += ') ' + d.slice(3, 6);
    if (d.length > 6) out += '-' + d.slice(6, 8);
    if (d.length > 8) out += '-' + d.slice(8, 10);
    return out;
  };

  phone.addEventListener('input', () => {
    phone.value = formatPhone(phone.value);
  });
  phone.addEventListener('focus', () => {
    if (!phone.value) phone.value = '+7 (';
    // Ставим курсор в конец, иначе первая цифра попадёт перед «+7»
    requestAnimationFrame(() => phone.setSelectionRange(phone.value.length, phone.value.length));
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
    const btnHtml = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'Отправляем…';

    setTimeout(() => {
      form.reset();
      btn.disabled = false;
      btn.innerHTML = btnHtml;
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
