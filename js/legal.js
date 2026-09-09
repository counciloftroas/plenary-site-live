/* Legal pages — contents rail marks the section in view. No motion, just colour. */
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll("[data-toc] a[href^='#s']"));
  var secs = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); }).filter(Boolean);
  if (!secs.length || !("IntersectionObserver" in window)) return;
  var set = function (id) {
    links.forEach(function (a) {
      var on = a.getAttribute("href") === "#" + id;
      a.style.color = on ? "var(--action)" : "var(--text-secondary)";
      a.style.fontWeight = on ? "600" : "400";
    });
  };
  var o = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) set(e.target.id); }); }, { rootMargin: "-18% 0px -72% 0px" });
  secs.forEach(function (s) { o.observe(s); });
  set(secs[0].id);
})();
