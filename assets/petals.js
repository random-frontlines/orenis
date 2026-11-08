/* Orenis Petals: a side panel that renders HTML / SVG / Markdown live, shows code, and lets you edit the source directly.
   The page talks to it through a small API:
     Petals.init({ t, toast, saveFile })   once
     Petals.open({ id, title, type, language, content, onChange, onAsk, onClose })
     Petals.update({ title, type, language, content })   the model changed the open Petal
     Petals.close(), Petals.isOpen(), Petals.get(), Petals.busy(on), Petals.relabel()
   Previews run in a sandboxed iframe (scripts allowed, no same-origin), so a Petal can never touch the host page.

   Why previews used to come up blank, and what is done about it:
   - the old iframe was created once and had percentage height inside a flex box, which collapses to 0px in some browsers;
     now every render builds a fresh iframe that is absolutely positioned, so it always has a real size
   - sandboxed pages have no access to localStorage / sessionStorage; touching them throws and stops the page's script halfway.
     A tiny in-memory stand-in is installed before the page's own code runs
   - the model sometimes wraps a file in ``` fences, or leaves out <html>/<head>; both are repaired before rendering
   - an iframe that never reports in is rebuilt automatically (srcdoc first, then a blob URL), and a page that loads but
     shows nothing gets a visible "looks empty" notice with Reload / View code instead of a silent white box */
const Petals = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const P = {
    eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z", code: "M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14",
    undo: "M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3", redo: "M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3", copy: "M9 9h10v10H9zM5 15V5h10",
    dl: "M12 4v11M7 11l5 5 5-5M5 20h14", ext: "M14 4h6v6M20 4l-9 9M18 14v5H5V6h5", full: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
    x: "M6 6l12 12M18 6 6 18", desk: "M3 5h18v11H3zM8 20h8M12 16v4", tab: "M5 3h14v18H5zM11 18h2", phone: "M8 3h8v18H8zM11 18h2",
    send: "M12 19V5M5 12l7-7 7 7", warn: "M12 4 2 20h20zM12 10v4M12 17h.01", refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7",
  };
  const EXT = { html: "html", svg: "svg", markdown: "md", python: "py", javascript: "js", typescript: "ts", java: "java", c: "c", cpp: "cpp", go: "go", rust: "rs", ruby: "rb", php: "php", bash: "sh", shell: "sh", json: "json", css: "css", sql: "sql", yaml: "yml", kotlin: "kt", swift: "swift" };
  const MIME = { html: "text/html", svg: "image/svg+xml", markdown: "text/markdown" };
  const HLANG = { html: "xml", svg: "xml", markdown: "markdown" };
  let T = (k, en) => en, toast = () => {}, saveFile = () => {};
  let root, ui = {}, state = null, cb = {}, hist = [], hi = 0, tab = "preview", width = "100%", errs = [], timers = {}, gen = 0, blobUrl = "", dirty = false;

  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
  const icon = (n, size) => { const s = document.createElementNS(NS, "svg"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("class", "icon"); if (size) { s.style.width = s.style.height = size; } const p = document.createElementNS(NS, "path"); p.setAttribute("d", P[n]); s.append(p); return s; };
  const btn = (n, key, en, fn, cls = "cv-b") => { const b = el("button", cls); b.type = "button"; b.append(icon(n)); b._k = [key, en]; b.onclick = fn; return b; };
  const hasPreview = () => state && state.type !== "code";
  const later = (k, fn, ms) => { clearTimeout(timers[k]); timers[k] = setTimeout(fn, ms); };
  const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const unfence = c => { c = String(c ?? ""); const m = c.match(/^\s*```[\w+-]*[ \t]*\r?\n([\s\S]*?)\r?\n```\s*$/); return m ? m[1] : c; };
  const payload = () => ({ id: state.id, title: state.title, type: state.type, language: state.language, content: state.content });

  /* ---------- preview document ---------- */
  // Runs first inside the preview. It reports back to the host (hook / error / ready) and gives the page in-memory storage.
  function hook() {
    var send = function (o) { try { parent.postMessage(Object.assign({ orenisPetal: 1 }, o), "*"); } catch (e) {} };
    var err = function (m) { send({ t: "err", m: String(m).slice(0, 300) }); };
    send({ t: "hook" });
    addEventListener("error", function (e) { err((e.message || "Error") + (e.lineno ? " (line " + e.lineno + ")" : "")); });
    addEventListener("unhandledrejection", function (e) { err("Unhandled: " + ((e.reason && e.reason.message) || e.reason)); });
    var ce = console.error; console.error = function () { err([].join.call(arguments, " ")); try { ce.apply(console, arguments); } catch (x) {} };
    try { window.localStorage.getItem("o"); } catch (e) {
      var mk = function () { var d = {}; return { getItem: function (k) { return Object.prototype.hasOwnProperty.call(d, k) ? d[k] : null; }, setItem: function (k, v) { d[k] = String(v); }, removeItem: function (k) { delete d[k]; }, clear: function () { d = {}; }, key: function (i) { return Object.keys(d)[i] || null; }, get length() { return Object.keys(d).length; } }; };
      try { Object.defineProperty(window, "localStorage", { value: mk(), configurable: true }); Object.defineProperty(window, "sessionStorage", { value: mk(), configurable: true }); } catch (x) {}
    }
    var done = function () { var b = document.body; send({ t: "ready", n: b ? String(b.innerText || b.textContent || "").trim().length : 0, h: b ? b.getElementsByTagName("*").length : 0, v: !!(b && b.querySelector("canvas,svg,img,video,iframe,input,button,select,textarea")) }); };
    if (document.readyState === "complete") setTimeout(done, 60); else addEventListener("load", function () { setTimeout(done, 150); });
  }
  const HOOK = "<script>(" + hook.toString() + ")()<\/script>";
  const wrapHtml = c => {
    let h = String(c);
    if (/<head[^>]*>/i.test(h)) h = h.replace(/<head[^>]*>/i, m => m + HOOK);
    else if (/<html[^>]*>/i.test(h)) h = h.replace(/<html[^>]*>/i, m => m + "<head>" + HOOK + "</head>");
    else h = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' + HOOK + "</head><body>" + h + "</body></html>";
    return /^\s*<!doctype/i.test(h) ? h : "<!doctype html>" + h;
  };
  function doc(content, type) {
    const c = unfence(content);
    if (type === "svg") return `<!doctype html><html><head><meta charset="utf-8">${HOOK}<style>html,body{margin:0;height:100%}body{display:grid;place-items:center;background:#fff}svg{max-width:100%;max-height:100vh}</style></head><body>${c}</body></html>`;
    if (type === "markdown") {
      let h = esc(c); try { h = DOMPurify.sanitize(marked.parse(c, { breaks: true })); } catch (e) {}
      return `<!doctype html><html><head><meta charset="utf-8">${HOOK}<style>body{font:16px/1.7 system-ui,sans-serif;color:#222;max-width:46rem;margin:2rem auto;padding:0 1.2rem}pre,code{font-family:ui-monospace,Menlo,monospace}pre{background:#f4f4f8;padding:12px;border-radius:8px;overflow:auto}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:4px 8px}img{max-width:100%}</style></head><body>${h}</body></html>`;
    }
    return wrapHtml(c);
  }

  /* ---------- editor (textarea over a highlighted <pre>) ---------- */
  function highlight() {
    const src = state.content; let html = esc(src);
    try { if (window.hljs) html = hljs.highlight(src, { language: HLANG[state.type] || (hljs.getLanguage(state.language) ? state.language : "plaintext"), ignoreIllegals: true }).value; } catch (e) {}
    ui.code.innerHTML = html + "\n";
    const n = src.split("\n").length; ui.gut.textContent = Array.from({ length: n }, (_, i) => i + 1).join("\n");
  }
  function onKey(e) {
    const ta = ui.ta;
    if (e.key === "Tab") {
      e.preventDefault(); const a = ta.selectionStart, b = ta.selectionEnd, v = ta.value;
      if (a === b && !e.shiftKey) { ta.setRangeText("  ", a, b, "end"); }
      else { // indent / outdent the selected lines
        const s = v.lastIndexOf("\n", a - 1) + 1, block = v.slice(s, b), out = e.shiftKey ? block.replace(/^ {1,2}/gm, "") : block.replace(/^/gm, "  ");
        ta.setRangeText(out, s, b, "select"); ta.selectionStart = s;
      }
      edit();
    } else if (e.key === "Enter" && !e.isComposing) {
      const a = ta.selectionStart, v = ta.value, ls = v.lastIndexOf("\n", a - 1) + 1, ind = (v.slice(ls, a).match(/^\s*/) || [""])[0];
      if (ind) { e.preventDefault(); ta.setRangeText("\n" + ind, a, ta.selectionEnd, "end"); edit(); }
    }
  }
  function edit() { setContent(ui.ta.value, { from: "user", keepEditor: true }); }

  /* ---------- state changes ---------- */
  function snap() { if (state.content === hist[hi]) return; hist = hist.slice(0, hi + 1); hist.push(state.content); if (hist.length > 60) hist.shift(); hi = hist.length - 1; paintHistory(); }
  function setContent(text, { from = "user", keepEditor = false, quiet = false } = {}) {
    state.content = text;
    if (!keepEditor) ui.ta.value = text;
    highlight();
    later("prev", () => refresh(), from === "model" ? 0 : 350);
    later("snap", snap, from === "model" ? 0 : 700);
    if (!quiet) later("save", () => cb.onChange && cb.onChange(payload()), from === "model" ? 0 : 700);
  }
  function jump(d) {
    const n = hi + d; if (n < 0 || n >= hist.length) return; hi = n; setContent(hist[hi], { from: "model" }); paintHistory();
  }

  /* ---------- the preview iframe: built fresh on every render, watched until it reports in ---------- */
  function applyWidth() { ui.frameWrap.style.setProperty("--pw", width === "100%" ? "calc(100% - 1.6rem)" : width); }
  function note(kind) { // kind: "" (hide) | "empty" | "blank" | "slow"
    ui.note.hidden = !kind; if (!kind) return;
    ui.noteTxt.textContent = kind === "empty" ? T("cvEmpty", "This Petal is empty. Ask Orenis to fill it, or type in the Code tab.") : kind === "slow" ? T("cvSlow", "The preview is taking a long time to load.") : T("cvBlank", "The preview looks empty. The page may need a moment, or its code may have an error.");
    ui.noteReload.hidden = kind === "empty"; ui.noteCode.hidden = false;
  }
  function mount(html, viaBlob) {
    if (ui.frame) ui.frame.remove();
    const f = el("iframe", "cv-frame"); f.setAttribute("sandbox", "allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox"); f.setAttribute("allow", "fullscreen"); f.title = "Preview";
    if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = ""; }
    if (viaBlob) { blobUrl = URL.createObjectURL(new Blob([html], { type: "text/html" })); f.src = blobUrl; } else f.srcdoc = html;
    ui.frameWrap.insertBefore(f, ui.frameWrap.firstChild); ui.frame = f; applyWidth();
  }
  function refresh(attempt = 0) {
    if (!state || !ui.frameWrap) return;
    if (!hasPreview()) { if (ui.frame) { ui.frame.remove(); ui.frame = null; } note(""); return; }
    if (ui.frameWrap.hidden || root.hidden) { dirty = true; return; } // a hidden iframe may never load; render when it becomes visible
    dirty = false; const my = ++gen; clearTimeout(timers.hook); clearTimeout(timers.ready);
    if (!state.content.trim()) { if (ui.frame) { ui.frame.remove(); ui.frame = null; } errs = []; paintConsole(); return note("empty"); }
    note(""); if (!attempt) { errs = []; paintConsole(); }
    mount(doc(state.content, state.type), attempt >= 2);
    // 1) the page's first script reports "hook" almost instantly. If it never does, the iframe didn't load: rebuild it (srcdoc, then blob URL)
    timers.hook = setTimeout(() => { if (my === gen && attempt < 2) refresh(attempt + 1); else if (my === gen) note("blank"); }, 2500);
    // 2) the page is expected to finish loading; if it takes very long, say so instead of showing a white box
    timers.ready = setTimeout(() => { if (my === gen) note("slow"); }, 15000);
  }
  function onFrameMsg(e) {
    const d = e.data; if (!d || !d.orenisPetal || !ui.frame || e.source !== ui.frame.contentWindow) return;
    if (d.t === "hook") clearTimeout(timers.hook);
    else if (d.t === "err") { if (errs.length < 20) { errs.push(d.m); paintConsole(); } }
    else if (d.t === "ready") { clearTimeout(timers.hook); clearTimeout(timers.ready); note(d.n === 0 && !d.v && d.h < 4 ? "blank" : ""); }
  }

  /* ---------- painting ---------- */
  function paintHistory() { ui.undo.disabled = hi <= 0; ui.redo.disabled = hi >= hist.length - 1; }
  function paintConsole() {
    ui.errBtn.hidden = !errs.length; ui.errBtn.lastChild.textContent = " " + errs.length;
    if (!errs.length) ui.cons.hidden = true; ui.cons.textContent = errs.join("\n");
  }
  function paintTabs() {
    const pv = hasPreview(); ui.tabPv.hidden = ui.devs.hidden = ui.reload.hidden = !pv; if (!pv) tab = "code";
    ui.tabPv.classList.toggle("on", tab === "preview"); ui.tabCd.classList.toggle("on", tab === "code");
    ui.pane.dataset.tab = tab; ui.frameWrap.hidden = tab !== "preview"; ui.ed.hidden = tab !== "code";
    ui.devs.querySelectorAll("button").forEach(b => b.classList.toggle("on", b._w === width));
    applyWidth(); if (tab === "preview" && dirty) refresh();
  }
  function paintLabels() {
    root.querySelectorAll("button").forEach(b => { if (b._k) { const l = T(b._k[0], b._k[1]); b.title = l; b.setAttribute("aria-label", l); } });
    ui.tabPv.lastChild.textContent = T("cvPreview", "Preview"); ui.tabCd.lastChild.textContent = T("cvCode", "Code");
    ui.ask.placeholder = T("cvAsk", "Ask Orenis to change this…"); ui.errBtn.title = T("cvErrors", "Errors");
    ui.kicker.textContent = T("cvTitle", "Petal"); ui.noteReload.textContent = T("cvReload", "Reload"); ui.noteCode.textContent = T("cvViewCode", "View code");
  }
  function paintAll() {
    ui.title.value = state.title; ui.ta.value = state.content; highlight(); paintTabs(); paintHistory(); paintLabels(); refresh();
  }

  /* ---------- build the panel once ---------- */
  function build() {
    if (root) return; const mount0 = document.getElementById("cvMount") || document.body;
    root = el("aside", "cv"); root.hidden = true; root.setAttribute("aria-label", "Petal");
    const rs = el("div", "cv-rs"); rs.setAttribute("role", "separator"); rs.setAttribute("aria-orientation", "vertical");
    rs.addEventListener("pointerdown", e => { e.preventDefault(); rs.setPointerCapture(e.pointerId); const mv = ev => { const w = Math.min(innerWidth - 380, Math.max(340, innerWidth - ev.clientX)); document.documentElement.style.setProperty("--cvw", w + "px"); localStorage.setItem("orenis_cvw", w); }; const up = () => { rs.removeEventListener("pointermove", mv); rs.removeEventListener("pointerup", up); }; rs.addEventListener("pointermove", mv); rs.addEventListener("pointerup", up); });
    const w0 = +localStorage.getItem("orenis_cvw"); if (w0) document.documentElement.style.setProperty("--cvw", w0 + "px");

    ui.head = el("div", "cv-head"); ui.kicker = el("span", "cv-kick"); ui.title = el("input", "cv-title"); ui.title.maxLength = 80; ui.title.setAttribute("aria-label", "Title");
    ui.title.oninput = () => { state.title = ui.title.value; later("save", () => cb.onChange && cb.onChange(payload()), 500); };
    const seg = el("div", "cv-seg"); ui.tabPv = el("button", "cv-t"); ui.tabPv.append(icon("eye"), el("span")); ui.tabCd = el("button", "cv-t"); ui.tabCd.append(icon("code"), el("span"));
    ui.tabPv.onclick = () => { tab = "preview"; paintTabs(); }; ui.tabCd.onclick = () => { tab = "code"; paintTabs(); ui.ta.focus(); }; seg.append(ui.tabPv, ui.tabCd);
    ui.undo = btn("undo", "cvUndo", "Undo", () => jump(-1)); ui.redo = btn("redo", "cvRedo", "Redo", () => jump(1));
    ui.reload = btn("refresh", "cvReload", "Reload", () => refresh());
    const copy = btn("copy", "cvCopy", "Copy code", async () => { try { await navigator.clipboard.writeText(state.content); } catch (e) {} toast(T("copied", "Copied")); });
    const dl = btn("dl", "cvDownload", "Download", () => { const ext = EXT[state.type] || EXT[(state.language || "").toLowerCase()] || "txt", name = (state.title || "petal").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 40) || "petal"; saveFile(`${name}.${ext}`, MIME[state.type] || "text/plain", state.content); });
    const ext = btn("ext", "cvNewTab", "Open in new tab", () => { if (hasPreview()) window.open(URL.createObjectURL(new Blob([doc(state.content, state.type)], { type: "text/html" })), "_blank"); });
    const full = btn("full", "cvFull", "Expand", () => root.classList.toggle("full"));
    const close = btn("x", "cvClose", "Close", () => closeIt());
    const tools = el("div", "cv-tools"); tools.append(ui.undo, ui.redo, copy, dl, ext, full, close);
    const row1 = el("div", "cv-row"); row1.append(ui.kicker, ui.title, tools);
    const row2 = el("div", "cv-row"); ui.devs = el("div", "cv-devs");
    [["desk", "100%", "cvDesktop", "Desktop"], ["tab", "768px", "cvTablet", "Tablet"], ["phone", "390px", "cvPhone", "Phone"]].forEach(([i, w, k, en]) => { const b = btn(i, k, en, () => { width = w; paintTabs(); }, "cv-b"); b._w = w; ui.devs.append(b); });
    ui.errBtn = el("button", "cv-err"); ui.errBtn.append(icon("warn"), document.createTextNode(" 0")); ui.errBtn.onclick = () => { ui.cons.hidden = !ui.cons.hidden; };
    row2.append(seg, ui.reload, ui.devs, ui.errBtn); ui.head.append(row1, row2);

    ui.pane = el("div", "cv-pane");
    ui.frameWrap = el("div", "cv-fw"); ui.cons = el("pre", "cv-cons"); ui.cons.hidden = true;
    ui.note = el("div", "cv-note"); ui.note.hidden = true; ui.noteTxt = el("p"); ui.noteReload = el("button", "cv-nb"); ui.noteCode = el("button", "cv-nb");
    ui.noteReload.onclick = () => refresh(); ui.noteCode.onclick = () => { tab = "code"; paintTabs(); }; const nb = el("div", "cv-nbs"); nb.append(ui.noteReload, ui.noteCode); ui.note.append(ui.noteTxt, nb);
    ui.frameWrap.append(ui.cons, ui.note);
    ui.ed = el("div", "cv-ed"); ui.gut = el("div", "cv-ln"); const box = el("div", "cv-box"), pre = el("pre", "cv-hl"); ui.code = el("code", "hljs"); pre.append(ui.code);
    ui.ta = el("textarea", "cv-ta"); ui.ta.spellcheck = false; ui.ta.setAttribute("autocapitalize", "off"); ui.ta.setAttribute("autocomplete", "off"); ui.ta.setAttribute("aria-label", "Code");
    ui.ta.addEventListener("input", edit); ui.ta.addEventListener("keydown", onKey);
    ui.ta.addEventListener("scroll", () => { pre.scrollTop = ui.ta.scrollTop; pre.scrollLeft = ui.ta.scrollLeft; ui.gut.scrollTop = ui.ta.scrollTop; });
    box.append(pre, ui.ta); ui.ed.append(ui.gut, box); ui.pane.append(ui.frameWrap, ui.ed);
    ui.bar = el("div", "cv-bar"); ui.busy = el("div", "cv-busy"); ui.ask = el("input", "cv-ask"); ui.ask.maxLength = 500;
    const send = btn("send", "cvSend", "Send", () => ask(), "cv-send");
    ui.ask.addEventListener("keydown", e => { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); ask(); } });
    ui.bar.append(ui.ask, send);
    root.append(rs, ui.head, ui.busy, ui.pane, ui.bar); mount0.append(root);
    window.addEventListener("message", onFrameMsg);
    window.addEventListener("keydown", e => { if (e.key === "Escape" && root && !root.hidden && root.classList.contains("full")) root.classList.remove("full"); });
  }
  function ask() { const q = ui.ask.value.trim(); if (!q || !cb.onAsk) return; ui.ask.value = ""; cb.onAsk(q); }
  function closeIt() { if (!root) return; clearTimeout(timers.hook); clearTimeout(timers.ready); gen++; root.hidden = true; root.classList.remove("full"); document.querySelector(".app")?.classList.remove("cv-open"); if (ui.frame) { ui.frame.remove(); ui.frame = null; } cb.onClose && cb.onClose(); }

  return {
    init(o = {}) { if (o.t) T = o.t; if (o.toast) toast = o.toast; if (o.saveFile) saveFile = o.saveFile; },
    open(o) {
      build(); clearTimeout(timers.save);
      state = { id: o.id || "", title: o.title || T("cvTitle", "Petal"), type: ["html", "svg", "markdown", "code"].includes(o.type) ? o.type : "html", language: o.language || "", content: unfence(o.content) };
      cb = { onChange: o.onChange, onAsk: o.onAsk, onClose: o.onClose }; hist = [state.content]; hi = 0; errs = []; tab = hasPreview() ? "preview" : "code";
      root.hidden = false; document.querySelector(".app")?.classList.add("cv-open"); paintAll();
    },
    update(o) { if (!state || !root || root.hidden) return this.open(o); if (o.title) { state.title = o.title; ui.title.value = o.title; } if (o.type && o.type !== state.type) { state.type = o.type; state.language = o.language || ""; } setContent(unfence(o.content), { from: "model" }); tab = hasPreview() ? "preview" : tab; paintTabs(); },
    close: closeIt, isOpen: () => !!root && !root.hidden, get: () => state && { ...state },
    busy(on) { if (root) root.classList.toggle("is-busy", !!on); },
    relabel() { if (root && state) { paintLabels(); if (!ui.note.hidden) note(ui.noteReload.hidden ? "empty" : "blank"); } },
    doc, unfence,
    starter: type => type === "svg" ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="400"><rect width="200" height="120" rx="12" fill="#6C63FF"/><text x="100" y="68" font-size="22" text-anchor="middle" fill="#fff" font-family="sans-serif">Hello, Petal</text></svg>' : '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>My page</title>\n  <style>\n    body { font-family: system-ui, sans-serif; display: grid; place-items: center; min-height: 100vh; margin: 0; background: #f6f5ff; }\n    button { padding: .8rem 1.4rem; border: 0; border-radius: .8rem; background: #5547F0; color: #fff; font-size: 1rem; cursor: pointer; }\n  </style>\n</head>\n<body>\n  <button onclick="this.textContent = \'Clicked!\'">Click me</button>\n</body>\n</html>\n',
  };
})();
