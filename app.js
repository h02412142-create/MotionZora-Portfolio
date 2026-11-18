/* ============ CONFIG: edit your contact details here ============ */
const CONTACT = {
  email: "h02412142@gmail.com",       // <- your email
  whatsapp: "923138839076"            // <- number with country code, digits only (03138839076 -> +92 313 8839076)
};

/* ============ VIDEO LIBRARY ============ */
// wide = landscape 16:9 clip
const CATS = {
  ugc:       { label: "UGC",       icon: "🎬", n: 14 },
  vsl:       { label: "VSL",       icon: "📈", n: 4 },
  animation: { label: "Animation", icon: "✨", n: 8 },
  hooks:     { label: "Hooks",     icon: "🪝", n: 6 },
  "b-roll":  { label: "B-roll",    icon: "🎞", n: 5 },
  podcast:   { label: "Podcast",   icon: "🎙", n: 2 }
};
// Optional custom names, e.g. { "animation-08": "My name" }. Any video not listed is labelled with just its category.
const NAMES = {};
// clips shorter than ~20s (the B-roll 03 source is only 10.9s long): never start these part-way in
const SHORT_CLIPS = new Set(["b-roll-03"]);
const WIDE = new Set(["hooks-04", "hooks-05", "b-roll-05"]);
const VIDEOS = [];
for (const [key, c] of Object.entries(CATS)) {
  for (let i = 1; i <= c.n; i++) {
    const id = `${key}-${String(i).padStart(2, "0")}`;
    VIDEOS.push({ id, cat: key, num: String(i).padStart(2, "0"), wide: WIDE.has(id),
      src: `media/${key}/${id}.mp4?v=4`, poster: `media/${key}/${id}.webp?v=6` });
  }
}

/* ============ HELPERS ============ */
const catLabel = k => k === "animation" ? t("cat.animation.label") : CATS[k].label;
const vidTitle = v => NAMES[v.id] || catLabel(v.cat);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ============ RIBBONS: infinite scrolling, speeds up with page scroll ============ */
(function () {
  const words = ["UGC", "VSL", "Animation", "Hooks", "B-roll", "Podcast"];
  const star = '<span class="s">✦</span>';
  const unit = words.map(w => `<span>${w}</span>${star}`).join("");
  const anims = $$(".rtrack").map((t, i) => {
    const one = `<div class="w">${unit}</div>`;
    const order = i ? words.slice().reverse().map(w => `<span>${w}</span>${star}`).join("") : unit;
    t.innerHTML = `<div class="w">${order}</div>`.repeat(8);
    const half = t.scrollWidth / 2;
    const dir = +t.dataset.dir;
    const a = t.animate(dir < 0 ? [{ transform: "translateX(0)" }, { transform: `translateX(${-half}px)` }]
                                : [{ transform: `translateX(${-half}px)` }, { transform: "translateX(0)" }],
      { duration: i ? 34000 : 28000, iterations: Infinity, easing: "linear" });
    return a;
  });
  let lastY = scrollY, boost = 0;
  addEventListener("scroll", () => { boost = Math.min(Math.abs(scrollY - lastY), 60); lastY = scrollY; }, { passive: true });
  let rate = 1;
  (function tick() {
    boost *= .92;
    const want = boost < .05 ? 1 : 1 + boost / 6;
    if (want !== rate) { rate = want; anims.forEach(a => a.playbackRate = rate); }
    requestAnimationFrame(tick);
  })();
})();

/* ============ SERVICES ============ */
let revealed = false;
function renderServices() {
  $("#services-grid").innerHTML = Object.entries(CATS).map(([k, c]) => `
  <article class="svc reveal${revealed ? " in" : ""}" data-cat="${k}">
    <div class="ico"><b>${c.icon}</b></div><h3>${catLabel(k)}</h3><p>${t("cat." + k)}</p>
    <div class="count">${t("svc.count", { n: c.n, samples: t(c.n > 1 ? "svc.samples" : "svc.sample") })}</div>
  </article>`).join("");
}
renderServices();

/* ============ WORK GRID ============ */
let current = "all";
const filters = $("#filters"), grid = $("#grid");
function renderFilters() {
  filters.innerHTML = `<button class="pill${current === "all" ? " on" : ""}" data-f="all">${t("work.all")} · ${VIDEOS.length}</button>` +
    Object.entries(CATS).map(([k, c]) => `<button class="pill${current === k ? " on" : ""}" data-f="${k}">${catLabel(k)} · ${c.n}</button>`).join("");
}
renderFilters();

function renderGrid() {
  const list = VIDEOS.filter(v => current === "all" || v.cat === current);
  // portrait tiles first, then landscape tiles on their own rows, so tall and wide tiles never share a row
  const portrait = list.filter(v => !v.wide), wide = list.filter(v => v.wide);
  const tile = (v, i) => `
    <div class="card ${v.wide ? "wide" : ""}" data-id="${v.id}" style="animation-delay:${Math.min(i, 12) * 40}ms" tabindex="0">
      <img src="${v.poster}" alt="${vidTitle(v)}" loading="lazy">
      <video muted loop playsinline preload="none" data-src="${v.src}"></video>
      <span class="play">▶</span>
      <div class="meta"><b>${vidTitle(v)}</b>${NAMES[v.id] ? `<small>${catLabel(v.cat)}</small>` : ""}</div>
    </div>`;
  grid.innerHTML = portrait.map(tile).join("") + (portrait.length && wide.length ? '<span class="grid-break"></span>' : "") + wide.map((v, i) => tile(v, i + portrait.length)).join("");
}
renderGrid();

filters.addEventListener("click", e => {
  const b = e.target.closest(".pill"); if (!b) return;
  current = b.dataset.f;
  $$(".pill", filters).forEach(p => p.classList.toggle("on", p === b));
  renderGrid();
});
$("#services-grid").addEventListener("click", e => {
  const s = e.target.closest(".svc"); if (!s) return;
  current = s.dataset.cat;
  $$(".pill", filters).forEach(p => p.classList.toggle("on", p.dataset.f === current));
  renderGrid();
  $("#work").scrollIntoView({ behavior: "smooth" });
});

/* hover preview (lazy-load video on first hover) */
grid.addEventListener("mouseover", e => {
  const c = e.target.closest(".card"); if (!c) return;
  const v = $("video", c);
  if (!v.src) v.src = v.dataset.src;
  v.play().catch(() => {});
});
grid.addEventListener("mouseout", e => {
  const c = e.target.closest(".card"); if (!c || c.contains(e.relatedTarget)) return;
  const v = $("video", c); v.pause();
});

/* modal player */
const modal = $("#modal"), body = $("#modalBody");
function openModal(id) {
  const v = VIDEOS.find(x => x.id === id);
  body.innerHTML = `<video src="${v.src}" poster="${v.poster}" controls autoplay playsinline loop></video>`;
  modal.classList.add("open"); modal.setAttribute("aria-hidden", "false");
}
function closeModal() { modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); body.innerHTML = ""; }
grid.addEventListener("click", e => { const c = e.target.closest(".card"); if (c) openModal(c.dataset.id); });
grid.addEventListener("keydown", e => { if (e.key === "Enter") { const c = e.target.closest(".card"); if (c) openModal(c.dataset.id); } });
$("#modalClose").onclick = closeModal;
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });




/* ============ CATEGORY-AWARE AD PICKER ============
   Picks the next ad for one slot so that: no ad is shown twice, and no two slots show the same category
   (two UGC ads can never play together). Recently shown ads are avoided so the whole library gets used. */
const recentAds = [];
function pickAd(slot, shown, dom) {
  const catOf = id => { const v = id && VIDEOS.find(x => x.id === id); return v ? v.cat : null; };
  const usedIds = new Set([...shown, ...dom].filter(Boolean));
  const otherCats = new Set();
  [shown, dom].forEach(arr => arr.forEach((id, j) => { if (j !== slot && id) otherCats.add(catOf(id)); }));
  const own = catOf(shown[slot]) || catOf(dom[slot]);
  const strictOther = new Set();
  [shown, dom].forEach(arr => arr.forEach((id, j) => { if (j !== slot && id) strictOther.add(catOf(id)); }));
  const tiers = [
    v => !usedIds.has(v.id) && !otherCats.has(v.cat) && v.cat !== own,    // best: new ad, new category, different from this slot's last
    v => !usedIds.has(v.id) && !otherCats.has(v.cat),
    v => !usedIds.has(v.id)                                              // last resort, never reached with 6 categories and 3 slots
  ];
  let pool = [];
  for (const rule of tiers) { pool = VIDEOS.filter(rule); if (pool.length) break; }
  const fresh = pool.filter(v => !recentAds.includes(v.id));
  const src = fresh.length ? fresh : pool;
  const pick = src[Math.floor(Math.random() * src.length)];
  recentAds.push(pick.id); if (recentAds.length > 14) recentAds.shift();
  return pick.id;
}

/* ============ HERO SHUFFLE ============
   The three hero phones draw from the whole library, always three different categories at once.
   When a phone's video ends, it fades to the next ad in place. The hover-to-rotate carousel keeps working. */
(function () {
  const phones = $$("#heroVisual .phone");
  let shown = [], visible = true;
  const swapping = phones.map(() => false);
  const domIds = () => phones.map(p => p.dataset.id);
  const label = id => catLabel(VIDEOS.find(x => x.id === id).cat);
  function setPhone(i, id, animate, stagger) {
    const p = phones[i], vid = $("video", p), v = VIDEOS.find(x => x.id === id);
    const apply = () => {
      vid.poster = v.poster; p.dataset.id = id;
      vid.src = (stagger && !SHORT_CLIPS.has(id)) ? `${v.src}#t=${stagger}` : v.src;   // "#t=9" makes the video start 9 seconds in, so the three don't all end together
      const tag = $(".tag", p); if (tag) tag.textContent = label(id);
      vid.play().catch(() => {});
    };
    shown[i] = id;
    if (!animate) return apply();
    swapping[i] = true;
    vid.classList.add("swap-out");                       // fade out in place, swap, fade back in
    setTimeout(() => { apply(); vid.classList.remove("swap-out"); swapping[i] = false; }, 450);
  }
  const change = i => { if (!swapping[i]) setPhone(i, pickAd(i, shown, domIds()), true); };
  // first load: three different categories; clips start at staggered points so they don't all end together
  phones.forEach((_, i) => { setPhone(i, pickAd(i, shown, domIds()), false, i * 9); phones[i].dataset.id = shown[i]; });
  phones.forEach((p, i) => {
    const vid = $("video", p);
    vid.loop = false;
    vid.addEventListener("ended", () => change(i));
    vid.addEventListener("error", () => { if (vid.src) setTimeout(() => change(i), 1500); });
  });
  new IntersectionObserver(es => es.forEach(e => {
    visible = e.isIntersecting;
    phones.forEach(p => { const v = $("video", p); visible ? v.play().catch(() => {}) : v.pause(); });
  }), { threshold: .15 }).observe($("#heroVisual"));
  window.refreshHero = () => phones.forEach(p => { const tag = $(".tag", p); if (tag && p.dataset.id) tag.textContent = label(p.dataset.id); });
})();

/* ============ TYPING HEADLINE ============ */
const typed = $("#typed");
let wi = 0, ci = 0, del = false;
(function tick() {
  const words = t("hero.typed"), w = words[wi % words.length];
  typed.textContent = w.slice(0, ci);
  if (!del && ci === w.length) { del = true; return setTimeout(tick, 1700); }
  if (del && ci === 0) { del = false; wi = (wi + 1) % words.length; }
  if (ci > w.length) ci = w.length;
  ci += del ? -1 : 1;
  setTimeout(tick, del ? 35 : 75);
})();

/* ============ SCROLL REVEAL + COUNTERS ============ */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}), { threshold: .12 });
function observeReveals() {
  setTimeout(() => { revealed = true; }, 0); $$(".reveal:not(.in)").forEach(el => io.observe(el)); }
observeReveals();

function countUp(el) {
  const to = +el.dataset.count, suf = el.dataset.suffix || "", t0 = performance.now();
  (function step(t) {
    const p = Math.min((t - t0) / 1600, 1), eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(to * eased) + suf;
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}
$("[data-count='38']").dataset.count = VIDEOS.length;
$$("[data-count]").forEach(countUp);

/* ============ THEME (system default, user can override) ============ */
(function () {
  const root = document.documentElement, mq = matchMedia("(prefers-color-scheme: light)");
  const saved = () => { try { return localStorage.getItem("theme"); } catch (e) { return null; } };
  const apply = t => root.setAttribute("data-theme", t);
  $("#themeBtn").addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    apply(next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  });
  // follow live system changes until the user picks a theme themselves
  mq.addEventListener("change", e => { if (!saved()) apply(e.matches ? "light" : "dark"); });
})();

/* ============ NAV, PROGRESS, GLOW ============ */
const progress = $("#progress"), links = $$(".nav a"), secs = links.map(a => $(a.getAttribute("href")));
addEventListener("scroll", () => {
  const h = document.documentElement;
  progress.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + "%";
  let idx = 0; secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < 220) idx = i; });
  links.forEach((a, i) => a.classList.toggle("active", i === idx));
}, { passive: true });
$("#burger").onclick = () => $("#nav").classList.toggle("open");
$$(".nav a").forEach(a => a.addEventListener("click", () => $("#nav").classList.remove("open")));


/* card spotlight + tilt on services */
document.addEventListener("pointermove", e => {
  const c = e.target.closest && e.target.closest(".svc"); if (!c) return;
  const r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  c.style.setProperty("--mx", x + "px"); c.style.setProperty("--my", y + "px");
  c.style.transform = `perspective(700px) translateY(-12px) scale(1.04) rotateY(${(x / r.width - .5) * 8}deg) rotateX(${(.5 - y / r.height) * 8}deg)`;
});
document.addEventListener("pointerout", e => { const c = e.target.closest && e.target.closest(".svc"); if (c) c.style.transform = ""; });

/* hero 3D carousel: hover a back phone and it rotates to the front */
(function () {
  const phones = $$("#heroVisual .phone"), N = phones.length, STEP = 360 / N;
  let rot = -STEP * 1, target = rot, last = performance.now();   // phone #1 starts in front
  const R = () => (innerWidth < 640 ? 120 : 175);
  function bringToFront(i) {
    let t = -i * STEP;
    while (t - rot > 180) t -= 360;
    while (t - rot < -180) t += 360;
    target = t;
  }
  phones.forEach((p, i) => {
    const go = () => { if (Math.abs(target - rot) < 2 && !p.classList.contains("front")) bringToFront(i); };
    p.addEventListener("pointerenter", go);
    p.addEventListener("pointermove", go);   // also fires if the cursor is already resting on a back phone
    p.addEventListener("click", () => bringToFront(i));
  });
  let dirty = true; addEventListener("resize", () => { dirty = true; });
  (function loop(t) {
    const dt = Math.min((t - last) / 16.7, 3); last = t;
    if (Math.abs(target - rot) < .02 && !dirty) { requestAnimationFrame(loop); return; }   // settled: nothing to redraw
    rot += (target - rot) * (1 - Math.pow(.9, dt));                      // smooth easing
    if (Math.abs(target - rot) < .02) rot = target;
    dirty = false;
    phones.forEach((p, i) => {
      const th = (i * STEP + rot) * Math.PI / 180, s = Math.sin(th), c = Math.cos(th);
      const front = c > .85;
      p.style.transform = `translate3d(${s * R()}px,0,${(c + 1) * 75}px) rotateY(${-s * 30}deg) rotateZ(${s * 6}deg) scale(${.84 + .16 * (c + 1) / 2})`;
      p.style.zIndex = Math.round((c + 1) * 10);
      p.style.setProperty("--dim", (.5 * (1 - c) / 2).toFixed(2));
      p.classList.toggle("front", front);
    });
    requestAnimationFrame(loop);
  })(last);
})();

/* ============ CONTACT ============ */
function setContactLinks() {
  $("#mailBtn").href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(t("mail.subject"))}`;
  $("#waBtn").href = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(t("wa.text"))}`;
}
setContactLinks();
$("#form").addEventListener("submit", e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const body = `${t("mail.name")}: ${f.get("name")}\n${t("mail.email")}: ${f.get("email")}\n${t("mail.service")}: ${f.get("service")}\n\n${f.get("msg")}`;
  location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(t("mail.quote") + ": " + f.get("service"))}&body=${encodeURIComponent(body)}`;
});
$("#yr").textContent = new Date().getFullYear();

/* ============ TESTIMONIALS (replace the placeholders with real client quotes) ============ */
// Each entry: { name, stars, text: { en, de, fr, el, pl, es } }. If a language is missing, English is shown.
const TESTIMONIALS = [
  {
    "name": "Vinny",
    "stars": 5,
    "text": {
      "en": "Fast turnaround and the hooks really hit. Our UGC ads finally feel native to the feed, and the first cut landed within a day. Easy to work with, and revisions were never a hassle.",
      "de": "Schnelle Lieferung und die Hooks sitzen. Unsere UGC-Anzeigen wirken endlich nativ im Feed, und der erste Schnitt kam schon am nächsten Tag. Unkomplizierte Zusammenarbeit, Korrekturen waren nie ein Problem.",
      "fr": "Livraison rapide et des hooks qui font vraiment mouche. Nos pubs UGC ont enfin l'air natives dans le fil, et la première version est arrivée en une journée. Collaboration simple, et les retouches n'ont jamais posé problème.",
      "el": "Γρήγορη παράδοση και hooks που πραγματικά πιάνουν. Οι UGC διαφημίσεις μας φαίνονται επιτέλους φυσικές στο feed και το πρώτο κόψιμο ήρθε μέσα σε μία μέρα. Εύκολη συνεργασία και οι διορθώσεις δεν ήταν ποτέ πρόβλημα.",
      "pl": "Szybka realizacja i hooki, które naprawdę działają. Nasze reklamy UGC w końcu wyglądają naturalnie w feedzie, a pierwsza wersja przyszła w ciągu doby. Łatwa współpraca, a poprawki nigdy nie były kłopotem.",
      "es": "Entrega rápida y unos hooks que realmente funcionan. Nuestros anuncios UGC por fin se sienten nativos en el feed, y el primer corte llegó en un día. Es fácil trabajar con él y las revisiones nunca fueron un problema."
    }
  },
  {
    "name": "Shawn",
    "stars": 5,
    "text": {
      "en": "The animated VSL completely changed how we present our product. Clear communication, sharp editing and great pacing that holds attention right to the end. I'll keep sending MotionZora my next ads.",
      "de": "Das animierte VSL hat komplett verändert, wie wir unser Produkt präsentieren. Klare Kommunikation, präziser Schnitt und ein starkes Tempo, das bis zum Ende fesselt. Meine nächsten Anzeigen gehen wieder an MotionZora.",
      "fr": "Le VSL animé a complètement changé la façon dont nous présentons notre produit. Communication claire, montage précis et un super rythme qui retient l'attention jusqu'au bout. Je continuerai de confier mes prochaines pubs à MotionZora.",
      "el": "Το animated VSL άλλαξε εντελώς τον τρόπο που παρουσιάζουμε το προϊόν μας. Σαφής επικοινωνία, ακριβές μοντάζ και εξαιρετικός ρυθμός που κρατά την προσοχή μέχρι το τέλος. Θα συνεχίσω να στέλνω στη MotionZora τις επόμενες διαφημίσεις μου.",
      "pl": "Animowane VSL całkowicie zmieniło sposób, w jaki prezentujemy nasz produkt. Jasna komunikacja, precyzyjny montaż i świetne tempo, które utrzymuje uwagę do samego końca. Kolejne reklamy też zlecę MotionZora.",
      "es": "El VSL animado cambió por completo cómo presentamos nuestro producto. Comunicación clara, edición precisa y un ritmo genial que mantiene la atención hasta el final. Seguiré enviando mis próximos anuncios a MotionZora."
    }
  }
];
function renderReviews() {
  $("#reviewsGrid").innerHTML = TESTIMONIALS.map(r => {
    const name = r.name || t("tes.name");
    const body = r.text ? (typeof r.text === "string" ? r.text : (r.text[LANG] || r.text.en)) : "";
    return `<article class="review reveal in">${body ? "" : '<span class="sample">SAMPLE</span>'}
      <div class="q">“</div><p>${body || t("tes.ph")}</p>
      <div class="who"><div class="av">${name.trim().charAt(0).toUpperCase()}</div><div><b>${name}</b><small>${"★".repeat(r.stars || 5)}</small></div></div>
    </article>`;
  }).join("");
}

/* ============ SHUFFLING SHOWCASE ============
   Draws from the whole library (every video). Three different ads are on screen at once;
   a shuffled deck guarantees that no ad can be shown twice at the same time. */
(function () {
  const cards = $$("#trio .tcard"), ids = VIDEOS.map(v => v.id);
  let deck = [], shown = [], slot = 0, timer = null, visible = false, hovering = false;
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const domIds = () => cards.map(c => c.dataset.id);
  const busy = () => new Set([...shown, ...domIds()]);          // on screen now, or about to be
  function nextId() {
    for (;;) {
      if (!deck.length) deck = shuffle(ids.filter(id => !busy().has(id)));
      const id = deck.pop();
      if (!busy().has(id)) return id;                          // never a duplicate of anything visible or pending
    }
  }
  function setCard(i, id, animate) {
    const card = cards[i], vid = $("video", card), v = VIDEOS.find(x => x.id === id);
    const apply = () => {
      vid.poster = v.poster; vid.src = v.src; card.dataset.id = id;
      $(".tlabel", card).textContent = vidTitle(v);
      if (visible) vid.play().catch(() => {});
      vid.classList.remove("swap-out"); card.classList.remove("flash"); void card.offsetWidth; card.classList.add("flash");
    };
    shown[i] = id;
    if (!animate) return apply();
    vid.classList.add("swap-out"); setTimeout(apply, 450);
  }
  function rotateOne() {
    const old = shown[slot], id = pickAd(slot, shown, domIds());
    setCard(slot, id, true);
    slot = (slot + 1) % cards.length;
    void old;
  }
  function shuffleAll() {
    const old = domIds(), picks = [null, null, null];                    // three new ads, three different categories, none now showing
    cards.forEach((_, i) => { picks[i] = pickAd(i, picks, old); });
    shown = picks.slice();
    cards.forEach((_, i) => setTimeout(() => setCard(i, picks[i], true), i * 160));
  }
  const start = () => { stop(); timer = setInterval(() => { if (visible && !hovering && !document.hidden) rotateOne(); }, 5000); };
  const stop = () => { if (timer) clearInterval(timer); timer = null; };

  cards.forEach((_, i) => setCard(i, pickAd(i, shown, domIds()), false));
  cards.forEach(c => {
    c.addEventListener("mouseenter", () => hovering = true);
    c.addEventListener("mouseleave", () => hovering = false);
    c.addEventListener("click", () => openModal(c.dataset.id));
  });
  $("#shuffleBtn").addEventListener("click", () => { shuffleAll(); start(); });
  new IntersectionObserver(es => es.forEach(e => {
    visible = e.isIntersecting;
    cards.forEach(c => { const v = $("video", c); visible ? v.play().catch(() => {}) : v.pause(); });
  }), { threshold: .25 }).observe($("#trio"));
  start();
  // keep labels in the right language when the language changes
  window.refreshShowcase = () => cards.forEach((c, i) => { const v = VIDEOS.find(x => x.id === shown[i]); if (v) $(".tlabel", c).textContent = vidTitle(v); });
})();

/* ============ LANGUAGE SWITCHER ============ */
function onLangChange() {
  renderServices(); renderFilters(); renderGrid(); renderReviews(); setContactLinks(); if (window.refreshShowcase) refreshShowcase(); if (window.refreshHero) refreshHero();
  wi = 0; ci = 0; del = false;                       // restart the typing headline in the new language
  $("#langCode").textContent = LANGS.find(l => l.c === LANG).s;
  $$("#langMenu li").forEach(li => li.setAttribute("aria-selected", li.dataset.c === LANG));
  // service options keep their English names, which are product terms; labels for Animation follow the language
  const opt = $("#form select option:nth-child(3)"); if (opt) opt.textContent = catLabel("animation");
  observeReveals();
}
(function () {
  const box = $("#lang"), btn = $("#langBtn"), menu = $("#langMenu");
  menu.innerHTML = LANGS.map(l => `<li role="option" data-c="${l.c}" tabindex="0"><span>${l.n}</span><small>${l.s}</small></li>`).join("");
  const close = () => { box.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); };
  btn.addEventListener("click", e => { e.stopPropagation(); const o = box.classList.toggle("open"); btn.setAttribute("aria-expanded", o); });
  menu.addEventListener("click", e => { const li = e.target.closest("li"); if (li) { setLang(li.dataset.c); close(); } });
  menu.addEventListener("keydown", e => { if (e.key === "Enter") { const li = e.target.closest("li"); if (li) { setLang(li.dataset.c); close(); } } });
  document.addEventListener("click", e => { if (!box.contains(e.target)) close(); });
  addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  applyStatic(); onLangChange();                      // initial language: saved choice, else browser language
})();


/* nav links: roll once per hover. The link moves out from under a resting cursor and comes back,
   which the browser reports as a new hover, so a short cooldown after each roll ignores that echo. */
$$(".nav a").forEach(a => {
  let busy = false;
  a.addEventListener("mouseenter", () => {
    if (busy) return;
    busy = true;
    a.classList.add("spin");
    a.addEventListener("animationend", () => {
      a.classList.remove("spin");
      setTimeout(() => { busy = false; }, 450);
    }, { once: true });
  });
});
