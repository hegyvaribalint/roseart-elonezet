/* Süti-sáv (Consent Mode v2), mobilmenü, mérési események a dataLayer-be.
   Események: click_phone, click_email, click_route, click_app, és bármi data-esemeny="..." attribútummal. */
(function () {
  'use strict';
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  function applyConsent(value) {
    var s = value === 'accepted' ? 'granted' : 'denied';
    gtag('consent', 'update', { ad_storage: s, ad_user_data: s, ad_personalization: s, analytics_storage: s });
    window.dataLayer.push({ event: 'consent_update', consent: value });
  }

  var bar = document.getElementById('cookie');
  var saved = null;
  try { saved = localStorage.getItem('cookie_consent'); } catch (e) {}
  if (bar && !saved) bar.hidden = false;
  if (bar) {
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-consent]');
      if (!b) return;
      var v = b.getAttribute('data-consent');
      try { localStorage.setItem('cookie_consent', v); } catch (err) {}
      applyConsent(v);
      bar.hidden = true;
    });
  }

  // Süti-beállítások újranyitása (pl. láblécben: <button data-cookie-settings>)
  document.addEventListener('click', function (e) {
    if (bar && e.target.closest('[data-cookie-settings]')) bar.hidden = false;
  });

  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('fomenu');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Almenük (mobilon gombbal nyílnak)
  document.querySelectorAll('.sub-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var sub = document.getElementById(b.getAttribute('aria-controls'));
      var open = sub.classList.toggle('open');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  // Mobilmenü: horgonyra kattintva záródjon
  if (nav) nav.addEventListener('click', function (e) {
    if (e.target.closest('a[href^="#"]') && btn) { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
  });

  // YouTube: csak kattintásra töltődik (youtube-nocookie)
  document.addEventListener('click', function (e) {
    var y = e.target.closest('.yt');
    if (!y || y.querySelector('iframe')) return;
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + y.getAttribute('data-yt') + '?autoplay=1&rel=0';
    f.allow = 'autoplay; encrypted-media; picture-in-picture';
    f.allowFullscreen = true;
    f.title = y.getAttribute('aria-label') || 'Videó';
    y.appendChild(f);
    window.dataLayer.push({ event: 'video_play', video_id: y.getAttribute('data-yt') });
  });

  // Lightbox (galéria, cikkképek)
  var lb = document.getElementById('lightbox');
  var lbList = [], lbIdx = 0;
  function lbShow(i) {
    lbIdx = (i + lbList.length) % lbList.length;
    var a = lbList[lbIdx];
    lb.querySelector('img').src = a.getAttribute('href');
    lb.querySelector('img').alt = a.getAttribute('data-felirat') || '';
    lb.querySelector('figcaption').textContent = (a.getAttribute('data-felirat') || '') + (lbList.length > 1 ? ' (' + (lbIdx + 1) + '/' + lbList.length + ')' : '');
  }
  if (lb) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-lightbox]');
      if (!a) return;
      e.preventDefault();
      lbList = Array.prototype.slice.call(document.querySelectorAll('a[data-lightbox="' + a.getAttribute('data-lightbox') + '"]'));
      lb.hidden = false;
      lbShow(lbList.indexOf(a));
      lb.querySelector('.lb-zar').focus();
    });
    lb.addEventListener('click', function (e) {
      if (e.target.closest('.lb-kov')) lbShow(lbIdx + 1);
      else if (e.target.closest('.lb-elozo')) lbShow(lbIdx - 1);
      else if (e.target.closest('.lb-zar') || e.target === lb) lb.hidden = true;
    });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') lb.hidden = true;
      if (e.key === 'ArrowRight') lbShow(lbIdx + 1);
      if (e.key === 'ArrowLeft') lbShow(lbIdx - 1);
    });
  }

  // Ajánlatkérő űrlap: időcsapda, téma az oldal alapján, AJAX-beküldés, köszönőoldal a témához
  var t0 = Date.now();
  var p = location.pathname;
  var tema = /chiavari|berles/.test(p) ? 'chiavari' : /meghivo/.test(p) ? 'meghivo' 
    : /rendezvenyszervezes/.test(p) ? 'szervezes' : 'dekoracio';
  var KOSZONJUK = { chiavari: '/chiavari-szek-berles-erdeklodes/', meghivo: '/meghivo-erdeklodes/' };
  document.querySelectorAll('form.urlap').forEach(function (f) {
    var sel = f.querySelector('select[name="tema"]');
    if (sel) sel.value = tema;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = f.querySelector('.urlap-uzenet');
      if (!f.checkValidity()) { msg.textContent = 'Kérjük, töltsd ki a csillagos mezőket, és fogadd el az adatkezelési tájékoztatót.'; msg.className = 'urlap-uzenet hiba'; f.reportValidity(); return; }
      f.querySelector('[name="csapda_ido"]').value = String(Date.now() - t0);
      var gomb = f.querySelector('button[type="submit"]');
      gomb.disabled = true;
      msg.className = 'urlap-uzenet'; msg.textContent = 'Küldés…';
      fetch(f.action, { method: 'POST', body: new FormData(f), headers: { 'X-Requested-With': 'fetch', 'Accept': 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.ok && d.lead) {
            var t = sel ? sel.value : 'dekoracio';
            window.dataLayer.push({ event: 'callback_submit', tema: t });
            location.href = KOSZONJUK[t] || '/dekoracio-erdeklodes/';
          } else {
            msg.textContent = d.message || 'Köszönjük!';
            msg.className = 'urlap-uzenet' + (d.ok ? '' : ' hiba');
            gomb.disabled = false;
          }
        })
        .catch(function () {
          msg.textContent = 'A küldés nem sikerült. Kérjük, írj a hello@roseart.hu címre, vagy hívj: +36 22 200 245.';
          msg.className = 'urlap-uzenet hiba';
          gomb.disabled = false;
        });
    });
  });

  // Chiavari kalkulátor (a régi CostCalc képlete a kalkulator.php-ban)
  document.querySelectorAll('form.kalk').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var out = f.querySelector('.kalk-eredmeny');
      var db = parseInt(f.chair_count.value, 10);
      if (!/^\d{4}$/.test(f.zipcode.value.trim())) { out.innerHTML = '<p class="hiba">Adj meg egy négyjegyű irányítószámot.</p>'; return; }
      if (!(db >= 10)) { out.innerHTML = '<p class="hiba">Minimum 10 széket szállítunk.</p>'; return; }
      if (db > 200) { out.innerHTML = '<p class="hiba">200 szék felett személyes ajánlatot adunk: <a href="#ajanlat">kérj ajánlatot</a>.</p>'; return; }
      out.textContent = 'Számolás…';
      fetch(f.action, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ zipcode: f.zipcode.value.trim(), chair_count: db, color: f.color ? f.color.value : 'feher' }) })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.error) { out.innerHTML = '<p class="hiba"></p>'; out.firstChild.textContent = d.error; return; }
          var sor = function (a, b) { return '<tr><td>' + a + '</td><td>' + b + ' Ft</td></tr>'; };
          out.innerHTML = '<p><strong></strong></p><table>' +
            sor('Székbérlés (' + db + ' db, ' + (d.color === 'arany' ? 'arany' : 'fehér') + ')', d.chair_cost) + sor('Fel- és lepakolás', d.loading_cost) +
            (d.distance_cost === 'none' ? '' : sor('Kiszállítás', d.distance_cost)) +
            sor('Összesen (nettó)', d.total_cost) + '<tr class="osszes"><td>Összesen (bruttó)</td><td>' + d.total_cost_tax + ' Ft</td></tr></table>' +
            '<p class="kicsi">Tájékoztató ár. <a href="#ajanlat">Kérj pontos ajánlatot!</a></p>';
          out.querySelector('strong').textContent = d.town_found && d.town_found !== 'none' ? d.town_found : 'Ezt az irányítószámot nem találtuk, a kiszállítás nélkül számoltunk.';
          window.dataLayer.push({ event: 'kalkulator', szekek: db });
        })
        .catch(function () {
          out.innerHTML = '<p class="hiba">A kalkulátor most nem érhető el. Kérj ajánlatot az űrlapon, vagy hívj: +36 22 200 245.</p>';
        });
    });
  });

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a, button');
    if (!a) return;
    var ev = a.getAttribute('data-esemeny');
    var href = a.getAttribute('href') || '';
    if (!ev) {
      if (href.indexOf('tel:') === 0) ev = 'click_phone';
      else if (href.indexOf('mailto:') === 0) ev = 'click_email';
      else if (/google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps/.test(href)) ev = 'click_route';
      else if (/apps\.apple\.com|play\.google\.com/.test(href)) ev = 'click_app';
    }
    if (ev) window.dataLayer.push({ event: ev, link_url: href, link_text: (a.textContent || '').trim().slice(0, 80) });
  });
})();
