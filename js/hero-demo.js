/* Hero demo — mounts the design system's App (the real product mock) inside the Mac window.
   React and the DS bundle load after the page is idle, only here; the cursor script in site.js
   waits for the mount. On save-data connections the window keeps its static frame. */
(function () {
  var host = document.getElementById("hero-app");
  if (!host) return;
  if (navigator.connection && navigator.connection.saveData) { host.setAttribute("data-mounted", "skipped"); return; }
  var base = (document.currentScript && document.currentScript.getAttribute("src") || "js/hero-demo.js").replace(/js\/hero-demo\.js$/, "");
  function load(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = base + src; s.async = false; s.onload = resolve; s.onerror = function () { reject(new Error("failed " + src)); };
      document.head.appendChild(s);
    });
  }
  function start() {
    load("vendor/react.min.js")
      .then(function () { return load("vendor/react-dom.min.js"); })
      .then(function () { return load("vendor/ds-bundle.js"); })
      .then(function () {
        var NS = window.FundSightDesignSystem_c2328a;
        if (!NS || !NS.App) throw new Error("design system App not found");
        window.ReactDOM.createRoot(host).render(window.React.createElement(NS.App));
        host.setAttribute("data-mounted", "1");
      })
      .catch(function (e) { host.setAttribute("data-mounted", "failed"); if (window.console) console.warn("hero demo:", e.message); });
  }
  if ("requestIdleCallback" in window) window.requestIdleCallback(start, { timeout: 2500 }); else setTimeout(start, 600);
})();
