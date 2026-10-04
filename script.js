"use strict";
(() => {
  const MAX = 40, ZY = 0x5a5956454en, $ = (s) => document.querySelector(s);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  /* ---------- Lexicon + grammar (extend via optional content.json) ---------- */
  const LEX = {
    n: ["signal", "threshold", "mirror", "orbit", "silence", "pattern", "echo", "axis", "lattice", "ember", "drift", "archive", "horizon", "cipher", "tide", "fracture", "vessel", "gradient", "paradox", "anchor", "resonance", "margin", "origin", "pulse"],
    a: ["quiet", "unfinished", "luminous", "recursive", "patient", "hidden", "exact", "porous", "restless", "weightless", "deliberate", "unmapped", "fragile", "magnetic", "slow", "layered"],
    v: ["unfolds", "returns", "folds inward", "resists summary", "becomes legible", "keeps changing", "waits", "points elsewhere", "remembers itself", "divides without breaking"]
  };
  const T = {
    Identity: ["Zyven is a {a} {n}; every state is another angle on it.", "One name, read through {n} and {n}.", "Zyven: the {a} {n} that {v}."],
    Thought: ["Every {n} is {a} until it meets a {n}.", "To explore is to let the {n} {v}.", "A {a} mind keeps one {n} open."],
    Idea: ["Build a {n} that stays {a} as it grows.", "Treat the {n} as a place, not a thing.", "What if the {n} were {a}?"],
    Concept: ["{n} / {n}: a {a} system in which one {v}.", "The {a} {n} as a way of seeing.", "A {n} that {v}, seen from inside."],
    Question: ["Where does the {n} end, if it {v}?", "Is a {a} {n} still a {n}?", "Who reads the {n} when it {v}?"],
    Principle: ["Keep it {a}. Let the {n} do the work.", "Never explain the {n} twice.", "Prefer the {a} {n} to the loud one."],
    Artifact: ["Artifact: a {a} {n}, kept as a pattern rather than a file.", "A {n} preserved in {a} form.", "Recovered: one {n}, {a} but intact."],
    Experiment: ["Remove the {n}; observe what {v}.", "Pair a {a} {n} with a {n}. Wait.", "Run the {n} backwards until it {v}."],
    Discovery: ["Found: the {n} was {a} all along.", "A {n} appears where the {n} used to be.", "The {a} {n} {v}."],
    Unknown: ["Undefined: a {a} {n} with no name yet.", "Something {a} sits behind the {n}.", "Unmapped: where the {n} {v}."],
    Quote: ["“Be the {a} {n}.”", "“What {v} is worth following.”", "“A {n} is only a question, slowed down.”"]
  };
  const DIMS = Object.keys(T).concat(["Project", "Timeline"]);
  const DEEP = [["Surface", "Thought"], ["Context", "Concept"], ["Connection", "Idea"], ["Origin", "Identity"], ["Meaning", "Principle"], ["Related nodes", null], ["Future possibilities", "Idea"]];
  const STATUS = ["concept", "forming", "stable", "dormant", "evolving"];

  /* ---------- Deterministic RNG from a BigInt ---------- */
  const Rng = (id) => {
    let a = 0x9e3779b9, b = 0x243f6a88, c = 0xb7e15162, d = 1, x = id, i = 0;
    do {
      const w = Number(x & 0xffffffffn);
      a = Math.imul(a ^ w, 0x85ebca6b) ^ (b >>> 13);
      b = Math.imul(b + w + i, 0xc2b2ae35) ^ ((c << 7) | (c >>> 25));
      c = (Math.imul(c ^ a, 0x27d4eb2f) + d) | 0;
      d = (d + 0x9e3779b9 + w) | 0;
      x >>= 32n; i++;
    } while (x > 0n);
    const next = () => {
      const t = (((a + b) | 0) + d) | 0;
      d = (d + 1) | 0; a = b ^ (b >>> 9); b = (c + (c << 3)) | 0;
      c = (((c << 21) | (c >>> 11)) + t) | 0;
      return (t >>> 0) / 4294967296;
    };
    for (let k = 0; k < 16; k++) next();
    return { int: (n) => Math.floor(next() * n), range: (lo, hi) => lo + next() * (hi - lo), pick: (arr) => arr[Math.floor(next() * arr.length)] };
  };
  const seeded = (n, salt) => Rng(((n << 8n) | BigInt(salt)) ^ ZY);
  const fill = (tpl, r) => tpl.replace(/\{([nav])\}/g, (_, k) => r.pick(LEX[k]));
  const code = (r) => String(100 + r.int(9900));

  /* ---------- Identity Engine: n -> state (DNA + sections + graph) ---------- */
  const cache = new Map();
  function isRare(n) {
    const s = n.toString();
    return n === 42n || /^(\d)\1{2,}$/.test(s) || (s.length >= 5 && s === [...s].reverse().join("")) || /^10{2,}$/.test(s);
  }
  function section(n, dim, i) {
    const r = seeded(n, i + 1), c = code(r);
    if (dim === "Project") return { title: "Project " + c, rows: [["Status", r.pick(STATUS)], ["Concept", fill(r.pick(T.Concept), r)], ["Related", "Idea " + code(r) + " · Discovery " + code(r)], ["Future", fill("Next: let the {n} become {a}.", r)]] };
    if (dim === "Timeline") return { title: "Timeline " + c, rows: [["Past", fill("Origin: a {a} {n}.", r)], ["Present", fill("Current state: the {n} {v}.", r)], ["Possible", fill("A {a} {n} may form.", r)], ["Unknown", fill("Undefined: {n}, unnamed.", r)]] };
    return { title: dim + " " + c, text: fill(r.pick(T[dim]), r) };
  }
  function chainFor(n) {
    const r = seeded(n, 99);
    return ["Idea", "Project", "Discovery", "Concept", "Future"].map((name, k) => {
      let m = n * BigInt(k + 2) + BigInt(r.int(97));
      if (m.toString().length > MAX) m = n + BigInt(k + 1);
      return { label: name + " " + code(r), n: m };
    });
  }
  function build(n) {
    const key = n.toString();
    if (cache.has(key)) { const hit = cache.get(key); cache.delete(key); cache.set(key, hit); return hit; }
    const r = seeded(n, 0), pool = DIMS.slice(), count = 3 + r.int(2);
    const dna = { layout: r.int(6), type: r.int(3), dens: r.int(3), glow: +r.range(.15, .6).toFixed(2) };
    for (let i = 0; i < count; i++) { const j = i + r.int(pool.length - i); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const state = { n, dna, rare: isRare(n), sections: pool.slice(0, count).map((d, i) => section(n, d, i)), chain: chainFor(n) };
    cache.set(key, state);
    if (cache.size > 64) cache.delete(cache.keys().next().value);
    return state;
  }
  const deepLayer = (n, i) => { const [name, dim] = DEEP[i], r = seeded(n, 200 + i); return { name, text: dim ? (i === 6 ? "Possible: " : "") + fill(r.pick(T[dim]), r) : null }; };

  /* ---------- Parsing + storage ---------- */
  const parse = (s) => {
    const t = String(s ?? "").trim().replace(/^(zyven\s*\/?\s*)?(state\s*)?/i, "").replace(/[\s,_]/g, "").replace(/^0+(?=\d)/, "");
    return /^[1-9]\d*$/.test(t) && t.length <= MAX ? BigInt(t) : null;
  };
  const hashWord = (w) => { let h1 = 0x811c9dc5, h2 = 0x1b873593; for (const ch of w) { h1 = Math.imul(h1 ^ ch.codePointAt(0), 16777619); h2 = Math.imul(h2 + ch.codePointAt(0), 0x85ebca6b) ^ (h2 >>> 15); } return ((BigInt(h1 >>> 0) << 32n) | BigInt(h2 >>> 0)) % 1000000000000n + 1n; };
  const Store = {
    get(k) { try { const v = JSON.parse(localStorage.getItem("zyven." + k)); return Array.isArray(v) ? v.filter((x) => typeof x === "string" && /^\d{1,40}$/.test(x)) : []; } catch (e) { return []; } },
    set(k, v) { try { localStorage.setItem("zyven." + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };
  let favs = Store.get("favs"), hist = Store.get("hist");

  /* ---------- UI ---------- */
  const stage = $("#stage"), secEl = $("#sections"), chipsEl = $("#chips"), deepEl = $("#deep"), panel = $("#panel");
  let cur = 1n, deepOn = false, depth = 0, discOn = false;

  function toast(msg) {
    if (panel.open) { $("#pmsg").textContent = msg; return; }
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.remove("show"), 2200);
  }
  const stateUrl = (n) => { const u = new URL(location.href); u.search = ""; u.hash = ""; u.searchParams.set("state", n.toString()); return u.href; };
  const chipList = (chain) => {
    const ul = el("ul", "chips"), li0 = el("li"); li0.append(el("span", null, "Zyven")); ul.append(li0);
    chain.forEach((c) => { const li = el("li"), b = el("button", "btn", c.label); b.type = "button"; b.dataset.n = c.n.toString(); li.append(b); ul.append(li); });
    return ul;
  };

  function renderDeep() {
    deepEl.replaceChildren();
    $("#deepb").setAttribute("aria-pressed", deepOn);
    $("#next").textContent = deepOn && depth < DEEP.length ? "Deeper" : "Continue";
    if (!deepOn) return;
    for (let i = 0; i < depth; i++) {
      const L = deepLayer(cur, i), li = el("li"); li.append(el("h4", null, L.name));
      if (L.text) li.append(el("p", null, L.text)); else li.append(chipList(build(cur).chain));
      deepEl.append(li);
    }
  }
  function render() {
    const s = build(cur), d = s.dna;
    secEl.replaceChildren();
    secEl.className = "sections c" + d.layout + " t" + d.type + " d" + d.dens;
    stage.classList.toggle("rare", s.rare);
    stage.style.setProperty("--glow", d.glow);
    s.sections.forEach((sec) => {
      const card = el("div", "card"); card.append(el("h3", null, sec.title));
      if (sec.text) card.append(el("p", null, sec.text));
      else sec.rows.forEach(([k, v]) => { const row = el("div", "r"); row.append(el("span", "k", k), el("span", "v", v)); card.append(row); });
      secEl.append(card);
    });
    chipsEl.replaceChildren();
    if (s.rare) chipsEl.append(el("p", "rarenote", "A symmetry in the number itself"));
    chipsEl.append(chipList(s.chain));
    const id = cur.toString();
    $("#counter").textContent = "ZYVEN / STATE " + id.padStart(6, "0");
    $("#sh").textContent = "Zyven, state " + id;
    document.title = "Zyven / State " + id + " — The Infinite Profile";
    $("#save").setAttribute("aria-pressed", favs.includes(id));
    $("#save").textContent = favs.includes(id) ? "Saved" : "Save";
    renderDeep();
    stage.classList.remove("morph"); void stage.offsetWidth; stage.classList.add("morph");
    window.scrollTo(0, 0);
  }
  function go(n, urlMode) {
    if (!n || n < 1n || n.toString().length > MAX) { toast("Choose a whole number from 1 to " + MAX + " digits."); return; }
    cur = n; depth = deepOn ? 1 : 0;
    const id = n.toString();
    hist = [id].concat(hist.filter((x) => x !== id)).slice(0, 40); Store.set("hist", hist);
    try { if (urlMode !== "none") history[urlMode === "push" ? "pushState" : "replaceState"]({}, "", stateUrl(n)); } catch (e) { /* file:// may block */ }
    render();
  }
  const next = () => {
    if (deepOn && depth < DEEP.length) { depth++; renderDeep(); return; }
    if (discOn) { const ch = build(cur).chain, r = seeded(cur, 300); go(ch[r.int(ch.length)].n, "replace"); } else go(cur + 1n, "replace");
  };
  const prev = () => (cur > 1n ? go(cur - 1n, "replace") : toast("State 1 is the origin."));
  const randomState = () => { const w = new Uint32Array(2); if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(w); else w.forEach((_, i) => { w[i] = Math.random() * 4294967296; }); return ((BigInt(w[0]) << 32n) | BigInt(w[1])) % 1000000000000000000n + 1n; };
  const enter = (n) => { $("#intro").hidden = true; $("#app").hidden = false; go(n, "replace"); stage.focus({ preventScroll: true }); };

  /* ---------- Library panel ---------- */
  function lists() {
    [["favs", favs], ["hist", hist]].forEach(([id, arr]) => {
      const ul = $("#" + id); ul.replaceChildren();
      arr.forEach((n) => {
        const li = el("li"), b = el("button", "btn", "State " + n);
        b.type = "button"; b.dataset.n = n; li.append(b);
        if (id === "favs") { const x = el("button", "btn ghost", "✕"); x.type = "button"; x.dataset.rm = n; x.setAttribute("aria-label", "Remove state " + n); li.append(x); }
        ul.append(li);
      });
      if (!arr.length) ul.append(el("li", null, id === "favs" ? "Nothing saved yet." : "Nothing explored yet."));
    });
  }
  const openPanel = () => { $("#pmsg").textContent = ""; lists(); if (panel.showModal) panel.showModal(); else panel.setAttribute("open", ""); };
  const closePanel = () => { if (panel.close) panel.close(); else panel.removeAttribute("open"); };
  async function copy(text, ok) {
    try { await navigator.clipboard.writeText(text); toast(ok); } catch (e) {
      const a = el("textarea"); a.value = text; a.style.cssText = "position:fixed;opacity:0"; document.body.append(a); a.select();
      let done = false; try { done = document.execCommand("copy"); } catch (err) { done = false; } a.remove();
      toast(done ? ok : "Copy manually: " + text);
    }
  }

  $("#jump").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = $("#q").value.trim(), n = parse(q);
    if (!q) { toast("Enter a state number or a keyword."); return; }
    if (n) { closePanel(); go(n, "push"); return; }
    if (/^[\d\s,._+-]+$/.test(q)) { toast("State numbers are whole numbers from 1 to " + MAX + " digits."); return; }
    const m = hashWord(q.toLowerCase()); closePanel(); go(m, "push"); toast("“" + q.slice(0, 40) + "” resolved to state " + m);
  });
  panel.addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (e.target === panel) return closePanel();
    if (!t) return;
    if (t.dataset.rm) { favs = favs.filter((x) => x !== t.dataset.rm); Store.set("favs", favs); lists(); render(); }
    else if (t.dataset.n) { closePanel(); go(BigInt(t.dataset.n), "push"); }
  });
  $("#pclose").addEventListener("click", closePanel);
  $("#menu").addEventListener("click", openPanel);
  $("#clink").addEventListener("click", () => copy(stateUrl(cur), "State link copied"));
  $("#cid").addEventListener("click", () => copy(cur.toString(), "State ID copied"));
  $("#share").addEventListener("click", async () => {
    if (navigator.share) { try { await navigator.share({ title: "Zyven / State " + cur, url: stateUrl(cur) }); return; } catch (e) { if (e.name === "AbortError") return; } }
    copy(stateUrl(cur), "State link copied");
  });

  /* ---------- Controls ---------- */
  $("#enter").addEventListener("click", () => enter(parse(hist[0]) || 1n));
  $("#next").addEventListener("click", next);
  $("#prev").addEventListener("click", prev);
  $("#random").addEventListener("click", () => go(randomState(), "push"));
  $("#back").addEventListener("click", () => { const p = parse(hist[1]); if (p) go(p, "replace"); else toast("Nothing to return to yet."); });
  $("#disc").addEventListener("click", () => { discOn = !discOn; $("#disc").setAttribute("aria-pressed", discOn); toast(discOn ? "Discovery mode: Continue follows the graph." : "Discovery mode off."); });
  $("#deepb").addEventListener("click", () => { deepOn = !deepOn; depth = deepOn ? 1 : 0; renderDeep(); });
  $("#save").addEventListener("click", () => {
    const id = cur.toString();
    favs = favs.includes(id) ? favs.filter((x) => x !== id) : [id].concat(favs).slice(0, 200);
    Store.set("favs", favs); render();
  });
  document.addEventListener("click", (e) => { const c = e.target.closest("#chips button, #deep button"); if (c) go(BigInt(c.dataset.n), "push"); });
  document.addEventListener("keydown", (e) => {
    if ($("#app").hidden || panel.open || e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = e.target.tagName, inField = tag === "INPUT" || tag === "TEXTAREA";
    if (inField) return;
    if (e.key === "ArrowRight") next();
    else if (e.key === "ArrowLeft") prev();
    else if ((e.key === " " || e.key === "Enter") && tag !== "BUTTON") { e.preventDefault(); next(); }
    else if (e.key === "Escape" && deepOn) { deepOn = false; depth = 0; renderDeep(); }
  });
  let tx = 0, ty = 0;
  stage.addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev(); }
    else if (Math.abs(dy) > 70) { if (dy < 0) { if (!deepOn) { deepOn = true; depth = 0; } next(); } else $("#back").click(); }
  }, { passive: true });
  window.addEventListener("popstate", () => { const n = parse(new URLSearchParams(location.search).get("state")); if (n) { $("#intro").hidden = true; $("#app").hidden = false; go(n, "none"); } });

  /* ---------- Boot ---------- */
  $("#canon").href = location.origin === "null" ? "./" : location.origin + location.pathname;
  const initial = parse(new URLSearchParams(location.search).get("state"));
  if (initial) enter(initial);
  else if (hist[0]) $("#enter").textContent = "CONTINUE · " + hist[0];
  fetch("content.json").then((r) => (r.ok ? r.json() : null)).then((j) => {
    if (!j) return;
    ["n", "a", "v"].forEach((k) => { if (Array.isArray(j[k])) LEX[k].push(...j[k].filter((x) => typeof x === "string" && x.length < 40)); });
    cache.clear();
  }).catch(() => {});
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
