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

  /* ---------- Появление блоков и отсчёт цифр ---------- */
  const animOn = document.documentElement.classList.contains('js-anim');
  window.__revealReady = true;

  const countUp = (el) => {
    const to = Number(el.dataset.to);
    if (!to || to <= 1) return;
    const duration = to >= 100 ? 1600 : 1100;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.max(1, Math.round(1 + (to - 1) * eased)));
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = String(to);
    };
    requestAnimationFrame(tick);
  };

  if (animOn) {
    // До появления блока числа стоят на «1»; ширина — как у итогового числа,
    // чтобы соседний текст не дёргался во время отсчёта
    document.querySelectorAll('.count').forEach((el) => {
      el.style.minWidth = el.dataset.to.length + 'ch';
      if (Number(el.dataset.to) > 1) el.textContent = '1';
    });

    const STAGGER = 120;
    // Элементы, появившиеся одновременно, проявляются по очереди
    const reveal = (els) => {
      els.sort((x, y) => {
        const a = x.getBoundingClientRect(), b = y.getBoundingClientRect();
        return a.top - b.top || a.left - b.left;
      }).forEach((el, i) => {
        const delay = i * STAGGER;
        el.style.setProperty('--rv-delay', delay + 'ms');
        el.classList.add('is-in');
        revealIO.unobserve(el);
        el.querySelectorAll('.count').forEach((c) => setTimeout(() => countUp(c), delay + 150));
        if (el.classList.contains('step')) el.parentElement.classList.add('is-line');
      });
    };
    const revealIO = new IntersectionObserver((entries) => {
      reveal(entries.filter((e) => e.isIntersecting).map((e) => e.target));
    }, { threshold: 0.2 });

    const targets = [...document.querySelectorAll('[data-reveal]')];
    targets.forEach((el) => revealIO.observe(el));
    // То, что уже видно на первом экране, проявляем сразу, не дожидаясь прокрутки
    requestAnimationFrame(() => {
      reveal(targets.filter((el) => {
        // Та же мера, что у наблюдателя: видно не меньше 20% элемента
        const r = el.getBoundingClientRect();
        const shown = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
        return !el.classList.contains('is-in') && r.height > 0 && shown / r.height >= 0.2;
      }));
    });
  }

  /* ---------- Этапы: линия на телефоне следует за прокруткой ---------- */
  const stepsList = document.getElementById('steps-list');
  if (animOn && stepsList) {
    let ticking = false;
    const updateStepsLine = () => {
      ticking = false;
      const r = stepsList.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (window.innerHeight * 0.8 - r.top) / r.height));
      stepsList.style.setProperty('--steps-progress', progress.toFixed(3));
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(updateStepsLine); }
    }, { passive: true });
    updateStepsLine();
  }

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

  const attachPhoneMask = (input) => {
    input.addEventListener('input', () => {
      input.value = formatPhone(input.value);
    });
    input.addEventListener('focus', () => {
      if (!input.value) input.value = '+7 (';
      // Ставим курсор в конец, иначе первая цифра попадёт перед «+7»
      requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
    });
    input.addEventListener('blur', () => {
      if (input.value.replace(/\D/g, '').length <= 1) input.value = '';
    });
  };
  attachPhoneMask(phone);

  /* ---------- Квиз: расчёт стоимости за 3 шага ---------- */
  const quiz = document.getElementById('quiz');
  const DAYS = { 6000: 25, 14000: 50, 22000: 60, 11000: 45 };
  const fmt = new Intl.NumberFormat('ru-RU');
  const QUESTIONS = ['q-type', 'q-area', 'q-start'];
  const quizSteps = [...quiz.querySelectorAll('.quiz__step')];
  const quizLabel = document.getElementById('quiz-label');
  const quizBars = quiz.querySelectorAll('.quiz__progress i');
  const quizNav = document.getElementById('quiz-nav');
  const quizBack = document.getElementById('quiz-back');
  const quizNext = document.getElementById('quiz-next');
  const quizForm = document.getElementById('quiz-form');
  const quizPhone = document.getElementById('quiz-phone');
  attachPhoneMask(quizPhone);
  let current = 1;

  const picked = (name) => quiz.querySelector(`input[name="${name}"]:checked`);

  const showStep = (n, initial = false) => {
    current = n;
    quizSteps.forEach((s) => { s.hidden = Number(s.dataset.step) !== n; });
    quizBars.forEach((bar, i) => bar.classList.toggle('on', i < Math.min(n, 3)));
    quizLabel.textContent = n <= 3 ? `Шаг ${n} из 3` : n === 4 ? 'Последний шаг' : 'Готово';
    quizNav.hidden = n === 5;
    quizBack.hidden = n === 1;
    quizNext.hidden = n === 4;
    quizNext.disabled = n <= 3 && !picked(QUESTIONS[n - 1]);
    if (initial) return;
    // На телефоне возвращаем начало квиза в зону видимости
    const top = quiz.getBoundingClientRect().top;
    if (top < 0) quiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const active = quizSteps.find((s) => !s.hidden);
    if (active) active.focus({ preventScroll: true });
  };

  QUESTIONS.forEach((name) => {
    quiz.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
      input.addEventListener('change', () => {
        const dd = quiz.querySelector(`[data-pick="${name}"]`);
        dd.textContent = input.dataset.text;
        dd.classList.add('is-set');
        // Переход дальше — только по кнопке «Далее», чтобы можно было передумать
        quizNext.disabled = false;
      });
    });
  });

  quizNext.addEventListener('click', () => { if (current < 4) showStep(current + 1); });
  showStep(1, true);
  quizBack.addEventListener('click', () => { if (current > 1) showStep(current - 1); });
  document.getElementById('quiz-restart').addEventListener('click', () => {
    quiz.querySelectorAll('input[type="radio"]').forEach((r) => { if (r.name !== 'q-msg') r.checked = false; });
    quiz.querySelectorAll('[data-pick]').forEach((dd) => { dd.textContent = '—'; dd.classList.remove('is-set'); });
    showStep(1);
  });

  const quizError = (input, msg) => {
    const err = quizForm.querySelector(`.form__error[data-for="${input.id}"]`);
    input.classList.toggle('is-invalid', Boolean(msg));
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) err.textContent = msg || '';
  };

  const showResult = () => {
    const rate = Number(picked('q-type').value);
    const [min, max] = picked('q-area').value.split('-').map((v) => (v ? Number(v) : null));
    const dayFor = (a) => Math.round(DAYS[rate] * Math.max(1, a / 80));
    document.getElementById('quiz-price').innerHTML = max
      ? `${fmt.format(min * rate)} – ${fmt.format(max * rate)}&nbsp;₽<small>в зависимости от точной площади</small>`
      : `от ${fmt.format(min * rate)}&nbsp;₽<small>для площади от ${min} м²</small>`;
    const rows = [
      ['Ремонт', picked('q-type').dataset.text],
      ['Площадь', picked('q-area').dataset.text],
      ['Ставка', `от ${fmt.format(rate)} ₽/м²`],
      ['Срок', `от ${dayFor(min)} дней`],
      ['Старт', picked('q-start').dataset.text],
    ];
    document.getElementById('quiz-rows').innerHTML = rows
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    const msg = picked('q-msg').value;
    document.getElementById('quiz-note').textContent = msg === 'звонок'
      ? 'Менеджер перезвонит в течение 15 минут в рабочее время, уточнит детали и назначит бесплатный замер.'
      : `Подробную смету пришлём в ${msg} в течение 15 минут в рабочее время. Точную цену зафиксируем в договоре после бесплатного замера.`;
    showStep(5);
  };

  quizForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('quiz-name');
    const consent = document.getElementById('quiz-consent');
    const errors = [
      [name, name.value.trim().length < 2 ? 'Укажите, как к вам обращаться' : ''],
      [quizPhone, quizPhone.value.replace(/\D/g, '').length !== 11 ? 'Введите номер телефона полностью' : ''],
      [consent, consent.checked ? '' : 'Необходимо согласие на обработку персональных данных'],
    ];
    errors.forEach(([el, msg]) => quizError(el, msg));
    const firstBad = errors.find(([, msg]) => msg);
    if (firstBad) { firstBad[0].focus(); return; }
    // TODO: отправьте ответы квиза и контакты в CRM вместе с заявкой
    // fetch('/api/quiz', { method: 'POST', body: new FormData(quizForm) })
    showResult();
  });
  [document.getElementById('quiz-name'), quizPhone].forEach((el) => {
    el.addEventListener('input', () => { if (el.classList.contains('is-invalid')) quizError(el, ''); });
  });
  document.getElementById('quiz-consent').addEventListener('change', (e) => {
    if (e.target.checked) quizError(e.target, '');
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

  /* ---------- Отзывы: «Показать ещё» ---------- */
  const moreBtn = document.getElementById('reviews-more');
  const REVIEWS_STEP = 2;
  const hiddenReviews = () => document.querySelectorAll('#reviews-list .review[hidden]');
  moreBtn.parentElement.hidden = hiddenReviews().length === 0;
  moreBtn.addEventListener('click', () => {
    [...hiddenReviews()].slice(0, REVIEWS_STEP).forEach((r) => {
      r.hidden = false;
      r.classList.add('is-new');
    });
    if (!hiddenReviews().length) moreBtn.parentElement.hidden = true;
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
