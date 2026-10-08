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

  /* ---------- Мобильное меню-шторка ---------- */
  const burger = document.getElementById('burger');
  const sheet = document.getElementById('msheet');
  const sheetScrim = document.getElementById('msheet-scrim');

  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    sheet.setAttribute('aria-hidden', String(!open));
    sheet.inert = !open;
    sheet.style.removeProperty('--dy');
    document.body.classList.toggle('menu-open', open);
  };

  burger.addEventListener('click', () => {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  sheetScrim.addEventListener('click', () => setMenu(false));
  sheet.addEventListener('click', (e) => {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });
  window.matchMedia('(min-width: 1101px)').addEventListener('change', (e) => {
    if (e.matches) setMenu(false);
  });

  // Свайп вниз закрывает шторку (тянуть можно за любое место, кроме ссылок и кнопок)
  let sheetY = null;
  let sheetDy = 0;
  sheet.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button')) return;
    sheetY = e.clientY;
    sheetDy = 0;
    sheet.classList.add('is-drag');
    sheet.setPointerCapture(e.pointerId);
  });
  sheet.addEventListener('pointermove', (e) => {
    if (sheetY === null) return;
    sheetDy = Math.max(0, e.clientY - sheetY);
    sheet.style.setProperty('--dy', sheetDy + 'px');
  });
  const endSheetDrag = () => {
    if (sheetY === null) return;
    sheetY = null;
    sheet.classList.remove('is-drag');
    if (sheetDy > 90) setMenu(false);
    else sheet.style.setProperty('--dy', '0px');
  };
  sheet.addEventListener('pointerup', endSheetDrag);
  sheet.addEventListener('pointercancel', endSheetDrag);

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

  /* ---------- Первый экран и карточки «Почему мы?» ---------- */
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const stackCards = [...document.querySelectorAll('.stack-card')];

  const updateScenes = () => {
    // Карточки «Почему мы?»: та, на которую наезжает следующая, уходит вглубь
    stackCards.forEach((card, i) => {
      const next = stackCards[i + 1];
      if (!next) return;
      const gap = next.getBoundingClientRect().top - card.getBoundingClientRect().top;
      const cover = clamp01(1 - gap / (window.innerHeight * 0.6));
      card.style.setProperty('--s', 1 - cover * 0.06);
      card.style.setProperty('--b', 1 - cover * 0.45);
    });
  };

  // Первый экран: анимация запускается сама, как только загрузились шрифты
  // (но не позже чем через 0,6 с), и длится около 2 секунд
  const heroEl = document.getElementById('top');
  if (animOn) {
    let started = false;
    const play = () => {
      if (started) return;
      started = true;
      requestAnimationFrame(() => {
        heroEl.classList.add('is-play');
        setTimeout(() => heroEl.classList.add('is-final'), 1700);
      });
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(play);
    setTimeout(play, 600);
  }

  // Живое фото первого экрана: на телефоне сдвигается при наклоне, на компьютере — за мышью.
  // На iPhone датчик доступен только после разрешения: спрашиваем при первом касании фото
  if (animOn) {
    const heroImg = heroEl.querySelector('.hero__img');
    const RANGE = 14;
    let tx = 0, ty = 0, gx = 0, gy = 0, raf = null, heroVisible = true;
    const loop = () => {
      tx += (gx - tx) * 0.1;
      ty += (gy - ty) * 0.1;
      heroImg.style.setProperty('--tx', tx.toFixed(2) + 'px');
      heroImg.style.setProperty('--ty', ty.toFixed(2) + 'px');
      raf = Math.abs(gx - tx) > 0.05 || Math.abs(gy - ty) > 0.05 ? requestAnimationFrame(loop) : null;
    };
    const aim = (x, y) => {
      if (!heroVisible) return;
      gx = Math.max(-1, Math.min(1, x)) * RANGE;
      gy = Math.max(-1, Math.min(1, y)) * RANGE;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    new IntersectionObserver(([en]) => { heroVisible = en.isIntersecting; }).observe(heroEl);

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      heroEl.addEventListener('pointermove', (e) => {
        aim(-(e.clientX / innerWidth * 2 - 1), -(e.clientY / innerHeight * 2 - 1));
      });
      heroEl.addEventListener('pointerleave', () => aim(0, 0));
    } else if ('DeviceOrientationEvent' in window) {
      // Нулём считаем то, как человек держит телефон, и медленно подстраиваемся под новое положение
      let b0 = null, g0 = null;
      const onTilt = (e) => {
        if (e.beta == null || e.gamma == null) return;
        if (b0 === null) { b0 = e.beta; g0 = e.gamma; }
        b0 += (e.beta - b0) * 0.02;
        g0 += (e.gamma - g0) * 0.02;
        aim(-(e.gamma - g0) / 15, -(e.beta - b0) / 15);
      };
      const DOE = window.DeviceOrientationEvent;
      if (typeof DOE.requestPermission === 'function') {
        const ask = (e) => {
          if (e.target.closest('a, button')) return;
          heroEl.removeEventListener('click', ask);
          DOE.requestPermission()
            .then((state) => { if (state === 'granted') window.addEventListener('deviceorientation', onTilt); })
            .catch(() => {});
        };
        heroEl.addEventListener('click', ask);
      } else {
        window.addEventListener('deviceorientation', onTilt);
      }
    }
  }

  if (animOn) {
    let sceneTick = false;
    window.addEventListener('scroll', () => {
      if (sceneTick) return;
      sceneTick = true;
      requestAnimationFrame(() => { sceneTick = false; updateScenes(); });
    }, { passive: true });
    window.addEventListener('resize', updateScenes);
    updateScenes();
  }

  /* ---------- Было / стало: два проекта ---------- */
  const baGallery = document.getElementById('ba-gallery');
  if (baGallery) {
    const PROJECTS = [
      { title: 'Хамовники · 64 м² · капитальный ремонт · 52 дня' },
      { title: 'ЖК «Символ» · 78 м² · дизайнерский ремонт · 58 дней' },
    ];
    const slides = [...baGallery.querySelectorAll('.ba')];
    const baTitle = document.getElementById('ba-title');
    const baNum = document.getElementById('ba-num');
    let current = 0;
    let dragging = false;

    const setBA = (ba, pct) => {
      const v = Math.min(100, Math.max(0, pct));
      ba.style.setProperty('--bx', v + '%');
      ba.setAttribute('aria-valuenow', String(Math.round(v)));
    };

    // Точки на фото «стало»: координаты заданы в процентах кадра (1280×714),
    // а фото обрезается под окно (object-fit: cover), поэтому пересчитываем их под текущий размер
    const IMG_W = 1280;
    const IMG_H = 714;
    const placeSpots = (ba) => {
      const w = ba.clientWidth;
      const h = ba.clientHeight;
      if (!w || !h) return;
      const k = Math.max(w / IMG_W, h / IMG_H);
      const rw = IMG_W * k;
      const rh = IMG_H * k;
      const focus = parseFloat(getComputedStyle(ba).getPropertyValue('--ba-focus')) / 100 || 0.5;
      ba.querySelectorAll('.ba-spot').forEach((spot) => {
        const x = (w - rw) * focus + (spot.dataset.x / 100) * rw;
        const y = (h - rh) / 2 + (spot.dataset.y / 100) * rh;
        spot.style.setProperty('--sx', x + 'px');
        spot.style.setProperty('--sy', y + 'px');
        spot.hidden = x < 0 || x > w || y < 0 || y > h;
      });
    };
    const closeSpot = (ba) => {
      ba.querySelector('.ba-card').classList.remove('is-open');
      ba.querySelectorAll('.ba-spot.is-on').forEach((s) => s.classList.remove('is-on'));
    };
    const openSpot = (ba, spot) => {
      const card = ba.querySelector('.ba-card');
      if (spot.classList.contains('is-on')) { closeSpot(ba); return; }
      closeSpot(ba);
      spot.classList.add('is-on');
      card.querySelector('.ba-card__t').textContent = spot.dataset.t;
      card.querySelector('.ba-card__h').textContent = spot.dataset.h;
      card.querySelector('.ba-card__p').textContent = spot.dataset.p;
      card.classList.add('is-open');
    };
    slides.forEach((ba) => {
      placeSpots(ba);
      ba.querySelectorAll('.ba-spot').forEach((spot) => {
        spot.addEventListener('click', () => openSpot(ba, spot));
      });
      ba.querySelector('.ba-card__x').addEventListener('click', () => closeSpot(ba));
    });
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver((entries) => entries.forEach((en) => placeSpots(en.target)));
      slides.forEach((ba) => ro.observe(ba));
    } else {
      window.addEventListener('resize', () => slides.forEach(placeSpots));
    }

    slides.forEach((ba) => {
      const fromPointer = (e) => {
        const r = ba.getBoundingClientRect();
        setBA(ba, ((e.clientX - r.left) / r.width) * 100);
      };
      ba.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.ba-spot, .ba-card')) return;
        closeSpot(ba);
        dragging = true;
        ba.setPointerCapture(e.pointerId);
        fromPointer(e);
      });
      ba.addEventListener('pointermove', (e) => { if (dragging) fromPointer(e); });
      ba.addEventListener('pointerup', () => { dragging = false; });
      ba.addEventListener('pointercancel', () => { dragging = false; });
      ba.addEventListener('keydown', (e) => {
        const now = Number(ba.getAttribute('aria-valuenow'));
        if (e.key === 'ArrowLeft') { setBA(ba, now - 5); e.preventDefault(); }
        if (e.key === 'ArrowRight') { setBA(ba, now + 5); e.preventDefault(); }
      });
    });

    // Ползунок сам «качается», подсказывая, что его можно тянуть
    const wiggle = (ba) => {
      if (!animOn) return;
      const t0 = performance.now();
      const step = (now) => {
        const t = (now - t0) / 1600;
        if (dragging) return;
        if (t >= 1) { setBA(ba, 50); return; }
        setBA(ba, 50 + Math.sin(t * Math.PI * 2) * 22 * (1 - t));
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const show = (i) => {
      current = (i + slides.length) % slides.length;
      slides.forEach((ba, k) => {
        const on = k === current;
        closeSpot(ba);
        ba.classList.toggle('is-active', on);
        ba.setAttribute('aria-hidden', String(!on));
        ba.tabIndex = on ? 0 : -1;
      });
      setBA(slides[current], 50);
      baTitle.textContent = PROJECTS[current].title;
      baNum.textContent = String(current + 1).padStart(2, '0');
    };
    document.getElementById('ba-prev').addEventListener('click', () => { show(current - 1); wiggle(slides[current]); });
    document.getElementById('ba-next').addEventListener('click', () => { show(current + 1); wiggle(slides[current]); });

    // Свайп по подписи и краям тоже переключает проект (сам ползунок тянется пальцем)
    let sx = null;
    baGallery.addEventListener('touchstart', (e) => {
      sx = e.target.closest('.ba') ? null : e.touches[0].clientX;
    }, { passive: true });
    baGallery.addEventListener('touchend', (e) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      sx = null;
      if (Math.abs(dx) > 50) { show(current + (dx < 0 ? 1 : -1)); wiggle(slides[current]); }
    });

    show(0);
    if (animOn) {
      const hintIO = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        hintIO.disconnect();
        wiggle(slides[current]);
      }, { threshold: 0.6 });
      hintIO.observe(baGallery);
    }
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

  // Фото комнаты: до 10 штук, превью с крестиком
  const PHOTO_MAX = 10;
  const photos = [];
  const thumbs = document.getElementById('lead-thumbs');
  const phCount = document.getElementById('lead-ph-count');
  const renderPhotos = () => {
    thumbs.innerHTML = photos.map((p, i) => `<li><img src="${p.url}" alt="Фото комнаты ${i + 1}"><button type="button" data-i="${i}" aria-label="Удалить фото ${i + 1}"><span aria-hidden="true">✕</span></button></li>`).join('');
    phCount.hidden = !photos.length;
    phCount.textContent = `${photos.length} из ${PHOTO_MAX}`;
  };
  const clearPhotos = () => {
    photos.splice(0).forEach((p) => URL.revokeObjectURL(p.url));
    renderPhotos();
  };
  form.querySelectorAll('[data-photos]').forEach((input) => {
    input.addEventListener('change', () => {
      [...input.files].forEach((file) => {
        if (photos.length < PHOTO_MAX && file.type.startsWith('image/')) photos.push({ file, url: URL.createObjectURL(file) });
      });
      input.value = '';
      renderPhotos();
    });
  });
  thumbs.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const [p] = photos.splice(Number(btn.dataset.i), 1);
    URL.revokeObjectURL(p.url);
    renderPhotos();
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
    // const data = new FormData(form);
    // photos.forEach((p) => data.append('photos', p.file));
    // fetch('/api/lead', { method: 'POST', body: data })
    const btn = form.querySelector('button[type="submit"]');
    const btnHtml = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'Отправляем…';

    setTimeout(() => {
      form.reset();
      clearPhotos();
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

  /* ---------- FAQ: поиск и «открыт только один вопрос» ---------- */
  const faqItems = [...document.querySelectorAll('.faq__item')];
  const faqInput = document.getElementById('faq-q');
  const faqEmpty = document.getElementById('faq-empty');
  const faqHints = [...document.querySelectorAll('.faq-hint')];
  let faqSearching = false;

  faqItems.forEach((item) => {
    item.addEventListener('toggle', () => {
      // Во время поиска несколько ответов могут быть открыты сразу
      if (item.open && !faqSearching) faqItems.forEach((other) => { if (other !== item) other.open = false; });
    });
  });

  // Сохраняем исходный текст, чтобы подсвечивать совпадения и возвращать как было
  const faqSrc = faqItems.map((item) => ({
    q: item.querySelector('summary'),
    a: item.querySelector('.faq__body p'),
    qText: item.querySelector('summary').textContent,
    aText: item.querySelector('.faq__body p').textContent,
  }));
  const escapeHtml = (t) => t.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const highlight = (text, q) => {
    const i = q ? text.toLowerCase().indexOf(q) : -1;
    if (i < 0) return escapeHtml(text);
    return escapeHtml(text.slice(0, i)) + '<mark>' + escapeHtml(text.slice(i, i + q.length)) + '</mark>' + escapeHtml(text.slice(i + q.length));
  };
  const runFaqSearch = () => {
    const q = faqInput.value.trim().toLowerCase();
    faqSearching = Boolean(q);
    let found = 0;
    faqItems.forEach((item, i) => {
      const src = faqSrc[i];
      const inQ = src.qText.toLowerCase().includes(q);
      const inA = src.aText.toLowerCase().includes(q);
      const hit = !q || inQ || inA;
      item.hidden = !hit;
      if (hit) found += 1;
      src.q.innerHTML = highlight(src.qText, q);
      src.a.innerHTML = highlight(src.aText, q);
      // Совпадение только в ответе — раскрываем его, чтобы было видно
      item.open = Boolean(q && hit && inA && !inQ) || (Boolean(q) && item.open && hit);
    });
    faqEmpty.hidden = found > 0;
    faqHints.forEach((h) => h.classList.toggle('is-on', h.textContent === faqInput.value.trim()));
  };
  faqInput.addEventListener('input', runFaqSearch);
  faqHints.forEach((h) => h.addEventListener('click', () => {
    faqInput.value = faqInput.value.trim() === h.textContent ? '' : h.textContent;
    runFaqSearch();
  }));

  /* ---------- Услуги: карточки-перевёртыши ---------- */
  document.querySelectorAll('.service').forEach((card) => {
    const front = card.querySelector('.service__front');
    const back = card.querySelector('.service__back');
    const [openBtn] = front.querySelectorAll('.service__more');
    const backBtn = back.querySelector('.service__more');
    const flip = (on, moveFocus) => {
      card.classList.toggle('is-flipped', on);
      openBtn.setAttribute('aria-expanded', String(on));
      front.setAttribute('aria-hidden', String(on));
      back.setAttribute('aria-hidden', String(!on));
      openBtn.tabIndex = on ? -1 : 0;
      backBtn.tabIndex = on ? 0 : -1;
      // Фокус переносим только при управлении с клавиатуры
      if (moveFocus) (on ? backBtn : openBtn).focus({ preventScroll: true });
    };
    card.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      flip(!card.classList.contains('is-flipped'), e.detail === 0);
    });
  });

  /* ---------- Чат с менеджером: Анна отвечает на вопросы о ремонте ---------- */
  // Ответы собраны из текстов сайта (цены, сроки, FAQ, этапы). Вопрос сопоставляется с темами
  // по ключевым словам; если тема не нашлась — Анна предлагает оставить номер для звонка прораба.
  const mgrBtn = document.getElementById('mgr-btn');
  const mgr = document.getElementById('mgr');
  const mgrLog = document.getElementById('mgr-log');
  const mgrQuick = document.getElementById('mgr-quick');
  const mgrForm = document.getElementById('mgr-form');
  const mgrIn = document.getElementById('mgr-in');
  const typingDelay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 900;

  const PRICES = [
    ['Косметический', 6000, 'от 25 дней'],
    ['Капитальный', 14000, 'от 50 дней'],
    ['Новостройка', 11000, 'от 45 дней'],
    ['Дизайнерский', 22000, 'от 60 дней'],
  ];
  const money = (n) => Math.round(n / 1000).toLocaleString('ru-RU') + ' тыс. ₽';
  const CALL = 'Оставить номер';

  const TOPICS = [
    { id: 'price', keys: ['цен', 'стоим', 'сколько стоит', 'почем', 'бюджет', 'дорог', 'расцен', 'прайс', 'за метр', 'за квадрат', 'смету посчит', 'посчитай', 'рассчит'],
      a: 'Цены за м² (работы под ключ):\n• косметический — от 6 000 ₽\n• новостройка — от 11 000 ₽\n• капитальный — от 14 000 ₽\n• дизайнерский — от 22 000 ₽\nНапишите площадь квартиры, например «54 м²», — посчитаю примерно.',
      chips: ['Сроки ремонта', 'Что с материалами?', CALL], area: true },
    { id: 'types', keys: ['какой ремонт', 'тип ремонта', 'вид ремонта', 'какой выбрать', 'что выбрать', 'чем отлича', 'разниц', 'косметическ', 'капитальн', 'дизайнерск'],
      a: 'Коротко о форматах:\n• косметический — освежить стены, полы, двери без замены инженерии\n• капитальный — всё с нуля, включая проводку и трубы\n• новостройка — от бетона или white box до готовой квартиры\n• дизайнерский — капитальный + дизайн-проект и комплектация\nТочно подскажем на бесплатном замере.',
      chips: ['Сколько стоит?', 'Сроки ремонта', CALL] },
    { id: 'time', keys: ['срок', 'сколько времени', 'долго', 'сколько дней', 'месяц', 'быстро', 'когда закончи', 'за сколько'],
      a: 'Ремонт под ключ с дизайн-проектом — в среднем 60 дней для квартиры до 80 м². Косметический — от 25 дней, новостройка — от 45, капитальный — от 50. Точный срок пишем в договоре, за каждый день просрочки по нашей вине платим неустойку.',
      chips: ['Сколько стоит?', 'Как идёт оплата?', CALL] },
    { id: 'estimate', keys: ['смета', 'смету', 'сметы', 'доплат', 'подорож', 'вырастет', 'изменит', 'скрыт', 'сюрприз'],
      a: 'Смета фиксируется в договоре и не меняется, если вы не меняете объём работ. Если захотите что-то добавить — например, тёплый пол, — оформим допсоглашение только с вашей подписью. Доплат сверх сметы — 0 ₽.',
      chips: ['Какой договор?', 'Гарантия', CALL] },
    { id: 'materials', keys: ['материал', 'закуп', 'чернов', 'чистов', 'ламинат', 'обои', 'краск', 'паркет', 'покупать'],
      a: 'Как вам удобнее. Черновые материалы закупаем мы — с оптовыми скидками до 20% и отчётом по чекам. Чистовые можно выбрать вместе с дизайнером в салонах-партнёрах или купить самим.',
      chips: ['Сколько стоит?', 'Дизайн-проект', CALL] },
    { id: 'contract', keys: ['договор', 'юрид', 'документ', 'официальн'],
      a: 'Заключаем официальный договор подряда с юрлицом. В нём — смета, сроки, этапы оплаты, гарантия 3 года и ответственность сторон. Образец можем прислать заранее — оставьте номер или мессенджер.',
      chips: ['Как идёт оплата?', 'Гарантия', CALL] },
    { id: 'pay', keys: ['оплат', 'рассроч', 'кредит', 'аванс', 'предоплат', 'платить', 'заплатить', 'карт', 'налич'],
      a: 'Оплата по этапам: платите только за то, что уже сделано и принято вами, всего 5 этапов. Есть рассрочка через банки-партнёры до 24 месяцев — условия зависят от банка.',
      chips: ['Сроки ремонта', 'Какой договор?', CALL] },
    { id: 'warranty', keys: ['гарант', 'сломает', 'трещин', 'отвалит', 'брак', 'переделать'],
      a: 'Гарантия 3 года на все работы по договору. Если что-то случится — приедем и устраним за наш счёт.',
      chips: ['Какой договор?', 'Сколько стоит?', CALL] },
    { id: 'live', keys: ['жить', 'проживан', 'переехать', 'съехать', 'с детьми', 'живем'],
      a: 'При косметическом ремонте жить можно — работаем по комнатам. При капитальном лучше переехать на время черновых работ: будет шумно и пыльно.',
      chips: ['Сроки ремонта', 'Шум и соседи', CALL] },
    { id: 'report', keys: ['фото', 'отчет', 'контрол', 'узнаю', 'проверить', 'следить', 'приезжать'],
      a: 'Прораб каждый день присылает фотоотчёт в WhatsApp или Telegram, а каждый этап вы принимаете лично на объекте. Приезжать каждый день не нужно.',
      chips: ['Кто прораб?', 'Как идёт оплата?', CALL] },
    { id: 'foreman', keys: ['прораб', 'бригад', 'мастер', 'рабочи', 'кто будет делать', 'субподряд', 'гастарбайт'],
      a: 'У каждого объекта свой прораб — он на связи с вами от замера до сдачи. Работает своя бригада, не субподрядчики с улицы.',
      chips: ['Фотоотчёты', 'Гарантия', CALL] },
    { id: 'measure', keys: ['замер', 'выезд', 'обмер', 'приехать посмотр', 'посмотреть квартир', 'осмотр'],
      a: 'Замер бесплатный: приедем в удобный день, сделаем обмеры и обсудим пожелания. Предварительную смету даём в день замера, это ни к чему не обязывает.',
      chips: [CALL, 'Сколько стоит?'] },
    { id: 'design', keys: ['дизайн', '3d', 'визуал', 'проект', 'планиров', 'чертеж', 'стиль'],
      a: 'Дизайн-проект — это планировка, 3D-визуализация, чертежи и подбор материалов. В дизайнерском ремонте (от 22 000 ₽/м²) он уже входит в стоимость.',
      chips: ['Сколько стоит?', 'Перепланировка', CALL] },
    { id: 'newbuild', keys: ['новострой', 'бетон', 'white box', 'вайт бокс', 'предчистов', 'от застройщик', 'без отделки', 'черновая отделка'],
      a: 'С новостройками работаем постоянно: от бетона или white box до готовой квартиры. Цена — от 11 000 ₽/м², срок — от 45 дней.',
      chips: ['Посчитать по площади', 'Что с материалами?', CALL] },
    { id: 'replan', keys: ['переплан', 'снести', 'стену', 'стены', 'объедин', 'согласов', 'мжи', 'бти'],
      a: 'Перепланировку обсудим на замере: подскажем, что можно сделать, и поможем подготовить проект для согласования. Несущие стены не трогаем.',
      chips: ['Дизайн-проект', CALL] },
    { id: 'rooms', keys: ['ванн', 'санузел', 'туалет', 'кухн', 'одну комнат', 'только комнат', 'плитк', 'душев'],
      a: 'Берём и отдельные помещения — санузел, кухню, комнату. Цена зависит от площади и материалов, точную назовём после бесплатного замера.',
      chips: ['Сколько стоит?', 'Сроки ремонта', CALL] },
    { id: 'engineering', keys: ['электр', 'проводк', 'розет', 'сантехн', 'труб', 'стояк', 'отоплен', 'батаре', 'кондицион', 'теплый пол'],
      a: 'Электрику и сантехнику делаем полностью: новая проводка, разводка труб, тёплые полы, подготовка под кондиционеры. Всё — по проекту и с гарантией 3 года.',
      chips: ['Сколько стоит?', 'Гарантия', CALL] },
    { id: 'noise', keys: ['шум', 'сосед', 'выходн', 'ночью', 'вечером', 'тишин'],
      a: 'Шумные работы ведём только в разрешённое время по правилам дома, обычно по будням днём. Соседей предупреждаем заранее.',
      chips: ['Сроки ремонта', CALL] },
    { id: 'clean', keys: ['уборк', 'клининг', 'мусор', 'вывоз', 'грязь', 'пыль'],
      a: 'Вывоз мусора по ходу работ и клининг после ремонта входят в стоимость. Квартиру сдаём чистой — с актом и гарантийным талоном.',
      chips: ['Гарантия', CALL] },
    { id: 'where', keys: ['москв', 'област', 'подмосков', 'район', 'город', 'где вы', 'адрес', 'офис', 'выезжаете'],
      a: 'Работаем по Москве и ближнему Подмосковью. Офис: г. Москва, ул. Примерная, д. 1, офис 101, ежедневно 9:00–21:00.',
      chips: ['Бесплатный замер', CALL] },
    { id: 'discount', keys: ['скидк', 'акци', 'дешевле', 'подешевле', 'торг'],
      a: 'На черновые материалы у нас оптовые скидки до 20% — эта экономия остаётся вам. По работам цену фиксируем в договоре, а персональные условия обсудим на замере.',
      chips: ['Сколько стоит?', CALL] },
    { id: 'bot', keys: ['бот', 'робот', 'живой', 'человек', 'нейросет', 'ты кто', 'вы кто'],
      a: 'Я Анна, помощник студии. На частые вопросы отвечаю сразу, а всё, что требует осмотра квартиры, передаю прорабу — он перезвонит.',
      chips: ['Сколько стоит?', CALL] },
    { id: 'thanks', weak: true, keys: ['спасиб', 'благодар', 'понятно', 'ясно', 'хорошо', 'отлично', 'супер'],
      a: 'Пожалуйста! Если появятся вопросы — пишите. А если удобнее голосом, оставьте номер, и я перезвоню.',
      chips: [CALL, 'Сколько стоит?'] },
    { id: 'hello', weak: true, keys: ['привет', 'здравств', 'добрый', 'доброе', 'хай', 'алло'],
      a: 'Здравствуйте! Спрашивайте — про цены, сроки, договор, материалы или как проходит ремонт.',
      chips: ['Сколько стоит?', 'Сроки ремонта', CALL] },
    { id: 'call', keys: ['позвон', 'перезвон', 'звонок', 'созвон', 'связаться', 'консультац', 'оставить номер', 'мой номер', 'менеджер'],
      a: '', call: true },
  ];
  // Подписи кнопок-подсказок, у которых текст не совпадает с ключами темы
  const CHIP_TOPIC = {
    'Сколько стоит?': 'price', 'Посчитать по площади': 'price', 'Сроки ремонта': 'time', 'Что с материалами?': 'materials',
    'Какой договор?': 'contract', 'Как идёт оплата?': 'pay', 'Гарантия': 'warranty', 'Шум и соседи': 'noise',
    'Кто прораб?': 'foreman', 'Фотоотчёты': 'report', 'Дизайн-проект': 'design', 'Перепланировка': 'replan',
    'Бесплатный замер': 'measure', 'Что входит в смету?': 'estimate',
  };
  const START_CHIPS = ['Сколько стоит?', 'Сроки ремонта', 'Что входит в смету?', 'Гарантия', CALL];

  const chat = { started: false, mode: 'qa', name: '', phone: '', awaitArea: false, answered: 0, sent: false };

  const say = (text, who) => {
    const m = document.createElement('div');
    m.className = 'mgr__msg mgr__msg--' + who;
    m.textContent = text;
    mgrLog.appendChild(m);
    mgrLog.scrollTop = mgrLog.scrollHeight;
  };
  const botSay = (text, then) => {
    const t = document.createElement('div');
    t.className = 'mgr__typing';
    t.innerHTML = '<i></i><i></i><i></i>';
    mgrLog.appendChild(t);
    mgrLog.scrollTop = mgrLog.scrollHeight;
    // Длинный ответ «печатается» чуть дольше
    const delay = typingDelay ? Math.min(1800, typingDelay + text.length * 4) : 0;
    setTimeout(() => { t.remove(); say(text, 'bot'); if (then) then(); }, delay);
  };
  const quickReplies = (list) => {
    mgrQuick.innerHTML = '';
    list.forEach((label) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mgr__chip' + (label === CALL ? ' mgr__chip--call' : '');
      b.textContent = label;
      b.addEventListener('click', () => onUser(label));
      mgrQuick.appendChild(b);
    });
    // Подсказки занимают место снизу — докручиваем переписку до последнего ответа
    mgrLog.scrollTop = mgrLog.scrollHeight;
  };
  const setInput = (kind) => {
    mgrIn.disabled = false;
    mgrIn.type = kind === 'tel' ? 'tel' : 'text';
    mgrIn.inputMode = kind === 'tel' ? 'tel' : 'text';
    mgrIn.placeholder = kind === 'tel' ? '+7 (___) ___-__-__' : kind === 'name' ? 'Ваше имя' : 'Спросите про ремонт…';
  };

  const norm = (t) => ' ' + t.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9\s]/g, ' ').replace(/\s+/g, ' ') + ' ';
  const findTopic = (text) => {
    const n = norm(text);
    let best = null;
    let bestScore = 0;
    TOPICS.forEach((t) => {
      // «Спасибо» и «здравствуйте» уступают настоящему вопросу в той же фразе
      const score = t.keys.reduce((sum, k) => sum + (n.includes(k) ? k.length : 0), 0) * (t.weak ? 0.3 : 1);
      if (score > bestScore) { best = t; bestScore = score; }
    });
    return best;
  };
  // «54», «54 м2», «54 квадрата», «54 метра» → 54
  const findArea = (text, loose) => {
    const m = norm(text).match(/(\d{2,3})(?:[.,]\d+)?\s*(м|кв|квадрат|метр)/);
    if (m) return Number(m[1]);
    const only = text.trim().match(/^(\d{2,3})$/);
    return loose && only ? Number(only[1]) : 0;
  };
  // Если в вопросе назван формат ремонта — считаем только его
  const TYPE_KEYS = { 'Косметический': 'космет', 'Капитальный': 'капитал', 'Новостройка': 'новостр', 'Дизайнерский': 'дизайн' };
  const priceForArea = (area, text) => 'Для ' + area + ' м² ориентировочно, работы под ключ:\n' +
    PRICES.filter(([name], _, all) => {
      const named = all.filter(([n]) => norm(text).includes(TYPE_KEYS[n]));
      return !named.length || named.some(([n]) => n === name);
    }).map(([name, perM, days]) => '• ' + name.toLowerCase() + ' — от ' + money(area * perM) + ', ' + days).join('\n') +
    '\nТочную смету зафиксируем после бесплатного замера.';

  const offerCall = () => quickReplies([CALL, 'Сколько стоит?', 'Сроки ремонта']);

  const startCallback = () => {
    if (chat.sent) {
      botSay('Заявка уже у меня — перезвоню на ' + chat.phone + '. А пока можно спросить ещё что-нибудь.', () => quickReplies(START_CHIPS.filter((c) => c !== CALL)));
      return;
    }
    if (chat.phone) { askConsent(); return; }
    chat.mode = 'name';
    setInput('name');
    botSay('С удовольствием перезвоню. Как к вам обращаться?');
  };
  const askConsent = () => {
    chat.mode = 'consent';
    mgrIn.disabled = true;
    botSay('Почти готово! Подтвердите согласие на обработку данных — и я передам номер прорабу.', () => {
      mgrQuick.innerHTML = '<label class="mgr__consent"><input type="checkbox" id="mgr-consent"> <span>Я даю согласие на обработку персональных данных в соответствии с 152-ФЗ и принимаю <a href="privacy.html" target="_blank" rel="noopener">политику конфиденциальности</a></span></label>';
      const send = document.createElement('button');
      send.type = 'button';
      send.className = 'mgr__chip mgr__chip--main';
      send.textContent = 'Жду звонка';
      send.disabled = true;
      mgrQuick.appendChild(send);
      mgrLog.scrollTop = mgrLog.scrollHeight;
      document.getElementById('mgr-consent').addEventListener('change', (e) => { send.disabled = !e.target.checked; });
      send.addEventListener('click', () => {
        mgrQuick.innerHTML = '';
        say('Жду звонка', 'me');
        chat.sent = true;
        chat.mode = 'qa';
        setInput('qa');
        // TODO: отправьте заявку из чата туда же, куда и форму (CRM, почта, Telegram-бот)
        // fetch('/api/lead', { method: 'POST', body: JSON.stringify({ name: chat.name, phone: chat.phone, source: 'chat' }) })
        botSay('Готово, ' + chat.name + '! Перезвоню на ' + chat.phone + ' в течение 15 минут в рабочее время (ежедневно 9:00–21:00). Пока можно спросить ещё что-нибудь.',
          () => quickReplies(['Сколько стоит?', 'Сроки ремонта', 'Как идёт оплата?']));
      });
    });
  };

  const answerQuestion = (text) => {
    // Номер телефона прямо в сообщении — сразу оформляем звонок
    const digits = text.replace(/\D/g, '');
    if (digits.length === 11 && /^[78]/.test(digits) && !findArea(text)) {
      chat.phone = formatPhone(text);
      if (!chat.name) { chat.mode = 'name'; setInput('name'); botSay('Записала номер. Как к вам обращаться?'); return; }
      askConsent();
      return;
    }
    const area = findArea(text, chat.awaitArea);
    if (area) {
      chat.awaitArea = false;
      chat.answered += 1;
      botSay(priceForArea(area, text), () => quickReplies(['Что входит в смету?', 'Как идёт оплата?', CALL]));
      return;
    }
    const topic = CHIP_TOPIC[text] ? TOPICS.find((t) => t.id === CHIP_TOPIC[text]) : findTopic(text);
    if (topic && topic.call) { startCallback(); return; }
    if (!topic) {
      botSay('Не совсем поняла вопрос. Лучше всего я знаю про цены, сроки, договор, оплату и материалы. А если вопрос про вашу квартиру — оставьте номер, прораб перезвонит и всё разберёт.', offerCall);
      return;
    }
    chat.awaitArea = Boolean(topic.area);
    chat.answered += 1;
    let reply = topic.a;
    // После нескольких ответов мягко предлагаем звонок — один раз
    if (chat.answered === 3 && !chat.phone && topic.id !== 'thanks') reply += '\n\nЕсли удобнее обсудить голосом — оставьте номер, перезвоню за 15 минут.';
    botSay(reply, () => quickReplies(topic.chips));
  };

  const onUser = (raw) => {
    const text = String(raw).trim();
    if (!text) return;
    if (chat.mode === 'consent') return;
    if (chat.mode === 'phone' && text !== CALL && text.replace(/\D/g, '').length !== 11) {
      botSay('Кажется, в номере не хватает цифр. Проверьте, пожалуйста.');
      return;
    }
    say(text, 'me');
    mgrIn.value = '';
    mgrQuick.innerHTML = '';
    if (chat.mode === 'name') {
      chat.name = text.slice(0, 40);
      if (chat.phone) { askConsent(); return; }
      chat.mode = 'phone';
      setInput('tel');
      botSay(chat.name + ', очень приятно! Оставьте номер телефона.');
      return;
    }
    if (chat.mode === 'phone') {
      chat.phone = text;
      askConsent();
      return;
    }
    if (text === CALL) { startCallback(); return; }
    answerQuestion(text);
  };

  const chatStart = () => {
    setInput('qa');
    botSay('Здравствуйте! Я Анна, менеджер REMONT DESIGN. Спросите что угодно про ремонт — цены, сроки, договор, материалы. Или оставьте номер — перезвоню.',
      () => quickReplies(START_CHIPS));
  };

  mgrIn.addEventListener('input', () => {
    if (chat.mode === 'phone') mgrIn.value = formatPhone(mgrIn.value);
  });
  mgrForm.addEventListener('submit', (e) => {
    e.preventDefault();
    onUser(mgrIn.value);
  });

  const openChat = () => {
    mgr.hidden = false;
    mgrBtn.setAttribute('aria-expanded', 'true');
    if (!chat.started) { chat.started = true; chatStart(); }
    setTimeout(() => { if (!mgrIn.disabled) mgrIn.focus({ preventScroll: true }); }, 50);
  };
  const closeChat = () => {
    if (mgr.hidden) return;
    mgr.hidden = true;
    mgrBtn.setAttribute('aria-expanded', 'false');
    mgrBtn.focus({ preventScroll: true });
  };
  mgrBtn.addEventListener('click', openChat);
  document.getElementById('mgr-close').addEventListener('click', closeChat);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeChat(); });
  document.querySelectorAll('[data-open-chat]').forEach((b) => b.addEventListener('click', openChat));

  /* ---------- Год в подвале ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
