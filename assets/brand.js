/* Shared brand helpers: PNG favicon (Safari ignores SVG favicons) and the theme-color of the browser bar. */
(function () {
  const meta = document.querySelector('meta[name="theme-color"]');
  const sync = () => { if (meta) meta.content = document.documentElement.dataset.theme === "dark" ? "#0E0D16" : "#FFFFFF"; };
  sync(); new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const img = new Image();
  img.onload = () => {
    try {
      const c = document.createElement("canvas"); c.width = c.height = 180; c.getContext("2d").drawImage(img, 0, 0, 180, 180);
      const u = c.toDataURL("image/png");
      document.querySelectorAll('link[rel~="icon"],link[rel="apple-touch-icon"]').forEach(l => l.remove());
      [["icon", "image/png"], ["apple-touch-icon", ""]].forEach(([rel, type]) => { const l = document.createElement("link"); l.rel = rel; if (type) l.type = type; l.href = u; document.head.append(l); });
    } catch (e) { /* keep the SVG favicon */ }
  };
  img.src = "assets/orenis-logo.svg";
})();
