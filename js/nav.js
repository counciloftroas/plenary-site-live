/* Mobile navigation: hamburger opens a full-screen dark drawer; Escape, the close button,
   any in-page link, or growing past the phone breakpoint closes it. Focus is kept inside. */
(function () {
  var drawer = document.getElementById("site-drawer");
  var openBtn = document.querySelector("[data-nav-open]");
  if (!drawer || !openBtn) return;
  var lastFocus = null;
  var focusables = function () { return Array.prototype.slice.call(drawer.querySelectorAll("a[href],button:not([disabled])")); };
  var open = function () {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    document.documentElement.style.overflow = "hidden";
    openBtn.setAttribute("aria-expanded", "true");
    var f = drawer.querySelector("[data-nav-close]"); if (f) f.focus();
  };
  var close = function () {
    if (drawer.hidden) return;
    drawer.hidden = true;
    document.documentElement.style.overflow = "";
    openBtn.setAttribute("aria-expanded", "false");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };
  openBtn.addEventListener("click", open);
  if (window.location.hash === "#nav") open(); // deep link to the menu (also used for screenshots)
  drawer.addEventListener("click", function (e) { if (e.target.closest("[data-nav-close]")) close(); });
  document.addEventListener("keydown", function (e) {
    if (drawer.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key === "Tab") {
      var els = focusables(); if (!els.length) return;
      var first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  var mq = window.matchMedia("(min-width: 761px)");
  (mq.addEventListener ? mq.addEventListener("change", function (m) { if (m.matches) close(); }) : mq.addListener(function (m) { if (m.matches) close(); }));
})();
