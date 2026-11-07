/* Orenis Canvas: a side panel that renders HTML / SVG / Markdown live and lets you edit the source directly.
   The page talks to it through a small API:  Canvas.init({ t, toast, saveFile })  once,
   then Canvas.open({ title, type, language, content, onChange, onAsk, onClose }), Canvas.update(...), Canvas.close().
   Previews run in a sandboxed iframe (scripts allowed, no same-origin), so canvas code can never touch the host page. */
const Canvas = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const P = {
    eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z", code: "M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14",
    undo: "M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3", redo: "M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3", copy: "M9 9h10v10H9zM5 15V5h10",
    dl: "M12 4v11M7 11l5 5 5-5M5 20h14", ext: "M14 4h6v6M20 4l-9 9M18 14v5H5V6h5", full: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
    x: "M6 6l12 12M18 6 6 18", desk: "M3 5h18v11H3zM8 20h8M12 16v4", tab: "M5 3h14v18H5zM11 18h2", phone: "M8 3h8v18H8zM11 18h2",
    send: "M12 19V5M5 12l7-7 7 7", warn: "M12 4 2 20h20zM12 10v4M12 17h.01", layout: "M3 4h18v16H3zM3 9h18M9 9v11",
  };
  const EXT = { html: "html", svg: "svg", markdown: "md", python: "py", javascript: "js", typescript: "ts", java: "java", c: "c", cpp: "cpp", go: "go", rust: "rs", ruby: "rb", php: "php", bash: "sh", shell: "sh", json: "json", css: "css", sql: "sql", yaml: "yml", kotlin: "kt", swift: "swift" };
  const HLANG = { html: "xml", svg: "xml", markdown: "markdown" };
  let T = (k, en) => en, toast = () => {}, saveFile = () => {};
  let root, ui = {}, state = null, cb = {}, hist = [], hi = 0, tab = "preview", width = "100%", errs = [], timers = {};

  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
  const icon = (n, size) => { const s = document.createElementNS(NS, "svg"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("class", "icon"); if (size) { s.style.width = s.style.height = size; } const p = document.createElementNS(NS, "path"); p.setAttribute("d", P[n]); s.append(p); return s; };
  const btn = (n, key, en, fn, cls = "cv-b") => { const b = el("button", cls); b.type = "button"; b.append(icon(n)); b._k = [key, en]; b.onclick = fn; return b; };
  const hasPreview = () => state && state.type !== "code";
  const later = (k, fn, ms) => { clearTimeout(timers[k]); timers[k] = setTimeout(fn, ms); };
  const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

  /* ---------- preview document ---------- */
  const HOOK = '<script>(function(){var s=function(m){parent.postMessage({orenisCanvas:1,m:String(m).slice(0,300)},"*")};addEventListener("error",function(e){s(e.message+(e.lineno?" (line "+e.lineno+")":""))});addEventListener("unhandledrejection",function(e){s("Unhandled: "+(e.reason&&e.reason.message||e.reason))});var ce=console.error;console.error=function(){s([].join.call(arguments," "));ce.apply(console,arguments)}})()<\/script>';
  function srcdoc() {
    const c = state.content;
    if (state.type === "svg") return `<!doctype html><meta charset="utf-8"><body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#fff">${c}${HOOK}`;
    if (state.type === "markdown") {
      let h = esc(c); try { h = DOMPurify.sanitize(marked.parse(c, { breaks: true })); } catch (e) {}
      return `<!doctype html><meta charset="utf-8"><body style="font:16px/1.7 system-ui,sans-serif;color:#222;max-width:46rem;margin:2rem auto;padding:0 1.2rem">${h}<style>pre,code{font-family:ui-monospace,Menlo,monospace}pre{background:#f4f4f8;padding:12px;border-radius:8px;overflow:auto}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:4px 8px}</style>`;
    }
    return /<head[^>]*>/i.test(c) ? c.replace(/<head[^>]*>/i, m => m + HOOK) : HOOK + c;
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
    later("prev", refresh, from === "model" ? 0 : 350);
    later("snap", snap, from === "model" ? 0 : 700);
    if (!quiet) later("save", () => cb.onChange && cb.onChange({ title: state.title, type: state.type, language: state.language, content: state.content }), from === "model" ? 0 : 700);
  }
  function refresh() { if (!hasPreview() || !ui.frame) return; errs = []; paintConsole(); ui.frame.srcdoc = srcdoc(); }
  function jump(d) {
    const n = hi + d; if (n < 0 || n >= hist.length) return; hi = n; setContent(hist[hi], { from: "model" }); paintHistory();
  }

  /* ---------- painting ---------- */
  function paintHistory() { ui.undo.disabled = hi <= 0; ui.redo.disabled = hi >= hist.length - 1; }
  function paintConsole() {
    ui.errBtn.hidden = !errs.length; ui.errBtn.lastChild.textContent = " " + errs.length;
    if (!errs.length) ui.cons.hidden = true; ui.cons.textContent = errs.join("\n");
  }
  function paintTabs() {
    const pv = hasPreview(); ui.tabPv.hidden = ui.devs.hidden = !pv; if (!pv) tab = "code";
    ui.tabPv.classList.toggle("on", tab === "preview"); ui.tabCd.classList.toggle("on", tab === "code");
    ui.pane.dataset.tab = tab; ui.frameWrap.hidden = tab !== "preview"; ui.ed.hidden = tab !== "code";
    ui.devs.querySelectorAll("button").forEach(b => b.classList.toggle("on", b._w === width));
    ui.frame.style.width = width;
  }
  function paintLabels() {
    root.querySelectorAll("button").forEach(b => { if (b._k) { const l = T(b._k[0], b._k[1]); b.title = l; b.setAttribute("aria-label", l); } });
    ui.tabPv.lastChild.textContent = T("cvPreview", "Preview"); ui.tabCd.lastChild.textContent = T("cvCode", "Code");
    ui.ask.placeholder = T("cvAsk", "Ask Orenis to change this…"); ui.errBtn.title = T("cvErrors", "Errors");
    ui.kicker.textContent = T("cvTitle", "Canvas");
  }
  function paintAll() {
    ui.title.value = state.title; ui.ta.value = state.content; highlight(); paintTabs(); paintHistory(); paintLabels(); refresh();
  }

  /* ---------- build the panel once ---------- */
  function build() {
    if (root) return; const mount = document.getElementById("cvMount") || document.body;
    root = el("aside", "cv"); root.hidden = true; root.setAttribute("aria-label", "Canvas");
    const rs = el("div", "cv-rs"); rs.setAttribute("role", "separator"); rs.setAttribute("aria-orientation", "vertical");
    rs.addEventListener("pointerdown", e => { e.preventDefault(); rs.setPointerCapture(e.pointerId); const mv = ev => { const w = Math.min(innerWidth - 380, Math.max(340, innerWidth - ev.clientX)); document.documentElement.style.setProperty("--cvw", w + "px"); localStorage.setItem("orenis_cvw", w); }; const up = () => { rs.removeEventListener("pointermove", mv); rs.removeEventListener("pointerup", up); }; rs.addEventListener("pointermove", mv); rs.addEventListener("pointerup", up); });
    const w0 = +localStorage.getItem("orenis_cvw"); if (w0) document.documentElement.style.setProperty("--cvw", w0 + "px");

    ui.head = el("div", "cv-head"); ui.kicker = el("span", "cv-kick"); ui.title = el("input", "cv-title"); ui.title.maxLength = 80; ui.title.setAttribute("aria-label", "Title");
    ui.title.oninput = () => { state.title = ui.title.value; later("save", () => cb.onChange && cb.onChange({ title: state.title, type: state.type, language: state.language, content: state.content }), 500); };
    const seg = el("div", "cv-seg"); ui.tabPv = el("button", "cv-t"); ui.tabPv.append(icon("eye"), el("span")); ui.tabCd = el("button", "cv-t"); ui.tabCd.append(icon("code"), el("span"));
    ui.tabPv.onclick = () => { tab = "preview"; paintTabs(); refresh(); }; ui.tabCd.onclick = () => { tab = "code"; paintTabs(); ui.ta.focus(); }; seg.append(ui.tabPv, ui.tabCd);
    ui.undo = btn("undo", "cvUndo", "Undo", () => jump(-1)); ui.redo = btn("redo", "cvRedo", "Redo", () => jump(1));
    const copy = btn("copy", "cvCopy", "Copy code", async () => { try { await navigator.clipboard.writeText(state.content); } catch (e) {} toast(T("copied", "Copied")); });
    const dl = btn("dl", "cvDownload", "Download", () => { const ext = EXT[state.type] || EXT[(state.language || "").toLowerCase()] || "txt", name = (state.title || "canvas").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 40) || "canvas"; saveFile(`${name}.${ext}`, state.type === "html" ? "text/html" : "text/plain", state.content); });
    const ext = btn("ext", "cvNewTab", "Open in new tab", () => { if (hasPreview()) window.open(URL.createObjectURL(new Blob([srcdoc()], { type: "text/html" })), "_blank"); });
    const full = btn("full", "cvFull", "Expand", () => root.classList.toggle("full"));
    const close = btn("x", "cvClose", "Close canvas", () => closeIt());
    const tools = el("div", "cv-tools"); tools.append(ui.undo, ui.redo, copy, dl, ext, full, close);
    const row1 = el("div", "cv-row"); row1.append(ui.kicker, ui.title, tools);
    const row2 = el("div", "cv-row"); ui.devs = el("div", "cv-devs");
    [["desk", "100%", "cvDesktop", "Desktop"], ["tab", "768px", "cvTablet", "Tablet"], ["phone", "390px", "cvPhone", "Phone"]].forEach(([i, w, k, en]) => { const b = btn(i, k, en, () => { width = w; paintTabs(); }, "cv-b"); b._w = w; ui.devs.append(b); });
    ui.errBtn = el("button", "cv-err"); ui.errBtn.append(icon("warn"), document.createTextNode(" 0")); ui.errBtn.onclick = () => { ui.cons.hidden = !ui.cons.hidden; };
    row2.append(seg, ui.devs, ui.errBtn); ui.head.append(row1, row2);

    ui.pane = el("div", "cv-pane");
    ui.frameWrap = el("div", "cv-fw"); ui.frame = el("iframe", "cv-frame"); ui.frame.setAttribute("sandbox", "allow-scripts allow-forms allow-modals"); ui.frame.title = "Preview";
    ui.cons = el("pre", "cv-cons"); ui.cons.hidden = true; ui.frameWrap.append(ui.frame, ui.cons);
    ui.ed = el("div", "cv-ed"); ui.gut = el("div", "cv-ln"); const box = el("div", "cv-box"), pre = el("pre", "cv-hl"); ui.code = el("code", "hljs"); pre.append(ui.code);
    ui.ta = el("textarea", "cv-ta"); ui.ta.spellcheck = false; ui.ta.setAttribute("autocapitalize", "off"); ui.ta.setAttribute("autocomplete", "off"); ui.ta.setAttribute("aria-label", "Code");
    ui.ta.addEventListener("input", edit); ui.ta.addEventListener("keydown", onKey);
    ui.ta.addEventListener("scroll", () => { pre.scrollTop = ui.ta.scrollTop; pre.scrollLeft = ui.ta.scrollLeft; ui.gut.scrollTop = ui.ta.scrollTop; });
    box.append(pre, ui.ta); ui.ed.append(ui.gut, box); ui.pane.append(ui.frameWrap, ui.ed);
    ui.bar = el("div", "cv-bar"); ui.busy = el("div", "cv-busy"); ui.ask = el("input", "cv-ask"); ui.ask.maxLength = 500;
    const send = btn("send", "cvSend", "Send", () => ask(), "cv-send");
    ui.ask.addEventListener("keydown", e => { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); ask(); } });
    ui.bar.append(ui.ask, send);
    root.append(rs, ui.head, ui.busy, ui.pane, ui.bar); mount.append(root);
    window.addEventListener("message", e => { if (e.data && e.data.orenisCanvas && ui.frame && e.source === ui.frame.contentWindow && errs.length < 20) { errs.push(e.data.m); paintConsole(); } });
    window.addEventListener("keydown", e => { if (e.key === "Escape" && root && !root.hidden && root.classList.contains("full")) root.classList.remove("full"); });
  }
  function ask() { const q = ui.ask.value.trim(); if (!q || !cb.onAsk) return; ui.ask.value = ""; cb.onAsk(q); }
  function closeIt() { if (!root) return; root.hidden = true; root.classList.remove("full"); document.querySelector(".app")?.classList.remove("cv-open"); cb.onClose && cb.onClose(); }

  return {
    init(o = {}) { if (o.t) T = o.t; if (o.toast) toast = o.toast; if (o.saveFile) saveFile = o.saveFile; },
    open(o) {
      build(); clearTimeout(timers.save);
      state = { title: o.title || T("cvTitle", "Canvas"), type: ["html", "svg", "markdown", "code"].includes(o.type) ? o.type : "html", language: o.language || "", content: String(o.content ?? "") };
      cb = { onChange: o.onChange, onAsk: o.onAsk, onClose: o.onClose }; hist = [state.content]; hi = 0; errs = []; tab = hasPreview() ? "preview" : "code";
      root.hidden = false; document.querySelector(".app")?.classList.add("cv-open"); paintAll();
    },
    update(o) { if (!state || !root || root.hidden) return this.open(o); if (o.title) { state.title = o.title; ui.title.value = o.title; } if (o.type && o.type !== state.type) { state.type = o.type; state.language = o.language || ""; } setContent(String(o.content ?? ""), { from: "model" }); tab = hasPreview() ? "preview" : tab; paintTabs(); },
    close: closeIt, isOpen: () => !!root && !root.hidden, get: () => state && { ...state },
    busy(on) { if (root) root.classList.toggle("is-busy", !!on); },
    relabel() { if (root && state) { paintLabels(); } },
    starter: type => type === "svg" ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="400"><rect width="200" height="120" rx="12" fill="#6C63FF"/><text x="100" y="68" font-size="22" text-anchor="middle" fill="#fff" font-family="sans-serif">Hello, canvas</text></svg>' : '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>My page</title>\n  <style>\n    body { font-family: system-ui, sans-serif; display: grid; place-items: center; min-height: 100vh; margin: 0; background: #f6f5ff; }\n    button { padding: .8rem 1.4rem; border: 0; border-radius: .8rem; background: #5547F0; color: #fff; font-size: 1rem; cursor: pointer; }\n  </style>\n</head>\n<body>\n  <button onclick="this.textContent = \'Clicked!\'">Click me</button>\n</body>\n</html>\n',
  };
})();
