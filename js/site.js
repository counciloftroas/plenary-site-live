/* Plenary landing — motion, ported from the design canvas logic. Plain DOM.
   Reduced motion turns off parallax, count-ups, reveals, the mesh loops and the cursor demo;
   the entrance can never hide content (a 4s safety reveal). */
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var ease = "cubic-bezier(.22,.61,.36,1)";

  // Mesh video loops: fade in once playable; poster/field stays otherwise.
  Array.prototype.forEach.call(document.querySelectorAll("video[data-mesh]"), function (v) {
    if (reduced || saveData) { v.removeAttribute("src"); try { v.load(); } catch (e) {} return; }
    v.muted = true; v.loop = true; v.playsInline = true;
    var show = function () { v.style.opacity = "1"; };
    if (v.readyState >= 3) show(); else v.addEventListener("canplay", show, { once: true });
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  });
  // Autoplay can be refused until the first gesture; retry once on interaction.
  var retryPlay = function () {
    Array.prototype.forEach.call(document.querySelectorAll("video[data-mesh][src]"), function (v) { if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } });
  };
  ["pointerdown", "keydown", "touchstart", "scroll"].forEach(function (ev) { window.addEventListener(ev, retryPlay, { once: true, passive: true }); });

  // Reveals, count-ups, bars.
  var pendingReveal = [], pendingCounts = [];
  var revealEl = function (el) {
    var i = pendingReveal.indexOf(el); if (i < 0) return; pendingReveal.splice(i, 1);
    var d = (parseInt(el.getAttribute("data-reveal"), 10) || 0) * 80;
    el.style.transition = "opacity 600ms " + ease + " " + d + "ms, transform 600ms " + ease + " " + d + "ms";
    el.style.opacity = "1"; el.style.transform = "translateY(0)";
  };
  var runCount = function (el) {
    var t = parseFloat(el.getAttribute("data-count"));
    var pre = el.getAttribute("data-prefix") || "", suf = el.getAttribute("data-suffix") || "";
    var t0 = performance.now(), dur = 900, done = false;
    var finish = function () { if (!done) { done = true; el.textContent = pre + t.toLocaleString("en-US") + suf; } };
    var tick = function (now) {
      if (done) return;
      var p = Math.min(1, (now - t0) / dur), e2 = 1 - Math.pow(1 - p, 3);
      if (p >= 1) return finish();
      el.textContent = pre + Math.round(t * e2).toLocaleString("en-US") + suf;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setTimeout(finish, dur + 300); // rAF can be throttled in background tabs — always land on the true value
  };
  var startCount = function (el) { var i = pendingCounts.indexOf(el); if (i < 0) return; pendingCounts.splice(i, 1); runCount(el); };
  if (!reduced) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-reveal]"), function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight * 0.92) { el.style.opacity = "0"; el.style.transform = "translateY(14px)"; pendingReveal.push(el); }
    });
    pendingCounts = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
    if ("IntersectionObserver" in window) {
      var o = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { revealEl(e.target); o.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
      pendingReveal.forEach(function (el) { o.observe(el); });
      var o2 = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { startCount(e.target); o2.unobserve(e.target); } }); }, { threshold: 0.6 });
      pendingCounts.forEach(function (el) { o2.observe(el); });
    }
    var sweep = function () {
      pendingReveal.slice().forEach(function (el) { var r = el.getBoundingClientRect(); if (r.bottom > 0 && r.top < window.innerHeight * 0.96) revealEl(el); });
      pendingCounts.slice().forEach(function (el) { var r = el.getBoundingClientRect(); if (r.bottom > 0 && r.top < window.innerHeight * 0.85) startCount(el); });
    };
    var sweeping = false;
    var onSweep = function () { if (!sweeping) { sweeping = true; requestAnimationFrame(function () { sweeping = false; sweep(); }); } };
    window.addEventListener("scroll", onSweep, { passive: true });
    window.addEventListener("resize", onSweep, { passive: true });
    setTimeout(function () { pendingReveal.slice().forEach(revealEl); pendingCounts.slice().forEach(startCount); }, 4000);
    sweep();
    Array.prototype.forEach.call(document.querySelectorAll("[data-bar]"), function (el) {
      var w = el.getAttribute("data-bar") + "%"; el.style.width = "0%";
      requestAnimationFrame(function () { requestAnimationFrame(function () { el.style.transition = "width 600ms " + ease + " 250ms"; el.style.width = w; }); });
    });
  }

  // Parallax on the hero media, the plan's progress rail, and the active layer.
  var media = document.querySelector("[data-hero-media]");
  var plan = document.querySelector("[data-plan]");
  var prog = document.querySelector("[data-plan-progress]");
  var rails = Array.prototype.slice.call(document.querySelectorAll("[data-rail]"));
  var layers = Array.prototype.slice.call(document.querySelectorAll("[data-layer]"));
  var setActive = function (i) {
    rails.forEach(function (it, j) {
      var dot = it.querySelector("[data-rail-dot]"), num = it.querySelector("[data-rail-num]"), lab = it.querySelector("[data-rail-label]");
      var on = j === i, done = j < i;
      if (dot) {
        dot.style.background = on ? "var(--lime-400)" : done ? "var(--teal-600)" : "#d8d6d0";
        dot.style.transform = on ? "scale(1.3)" : "scale(1)";
        dot.style.boxShadow = on ? "0 0 0 4px rgba(180,217,79,.25)" : "none";
      }
      if (num) num.style.color = on ? "var(--action)" : "var(--text-muted)";
      if (lab) lab.style.color = on || done ? "var(--text-heading)" : "var(--text-muted)";
    });
  };
  var ticking = false;
  var update = function () {
    ticking = false;
    if (reduced) {
      if (media) media.style.transform = "none";
      if (prog) prog.style.transform = "scaleY(1)";
    } else {
      var y = window.scrollY || window.pageYOffset || 0;
      if (media && y < window.innerHeight * 1.4) media.style.transform = "translate3d(0," + (y * 0.22).toFixed(1) + "px,0)";
      if (plan && prog) {
        var r = plan.getBoundingClientRect();
        var span = Math.max(1, r.height - window.innerHeight * 0.55);
        var p = Math.max(0, Math.min(1, (window.innerHeight * 0.55 - r.top) / span));
        prog.style.transform = "scaleY(" + p.toFixed(4) + ")";
      }
    }
    if (rails.length && layers.length) {
      var line = window.innerHeight * 0.45, idx = 0;
      layers.forEach(function (c, i) { if (c.getBoundingClientRect().top <= line) idx = i; });
      setActive(idx);
    }
  };
  var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  if (rails.length && layers.length) setActive(0);
  update();

  // Button motion per the DS interaction rules: hover lift + soft shadow, spring press release.
  if (!reduced) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-btnfx]"), function (b) {
      b.style.transition = "transform var(--dur-fast) var(--ease-spring), box-shadow var(--dur-base) var(--ease-out), background var(--dur-fast) var(--ease-out), opacity var(--dur-fast) var(--ease-out)";
      var hov = false;
      var settle = function () { b.style.transform = hov ? "var(--lift-hover)" : "none"; b.style.boxShadow = hov ? "var(--shadow-hover)" : "none"; };
      b.addEventListener("mouseenter", function () { hov = true; settle(); });
      b.addEventListener("mouseleave", function () { hov = false; settle(); });
      b.addEventListener("mousedown", function () { b.style.transform = "var(--press-active)"; });
      b.addEventListener("mouseup", settle);
      b.addEventListener("blur", settle);
    });
  }

  // Hero demo: the live DS App scaled to fit the window; a scripted cursor dispatches real clicks
  // on its rail (Home -> Search -> Applications). Waits for hero-demo.js to mount the App.
  var demo = document.querySelector("[data-demo]");
  if (demo) {
    var stage = demo.querySelector("[data-demo-stage]");
    var box = demo.querySelector("[data-demo-scale]");
    var host = document.getElementById("hero-app");
    var fit = function () { if (stage && box) box.style.transform = "scale(" + (stage.clientWidth / 1180) + ")"; };
    fit();
    window.addEventListener("resize", fit, { passive: true });
    if (!reduced) {
      // The DS App's internal nav calls window.scrollTo({top:0}) — silence it around scripted clicks.
      if (!window.__plenaryNativeScrollTo) {
        window.__plenaryNativeScrollTo = window.scrollTo.bind(window);
        window.__plenaryQuietDepth = 0;
        window.scrollTo = function () { if (!window.__plenaryQuietDepth) window.__plenaryNativeScrollTo.apply(null, arguments); };
      }
      var clickQuiet = function (b) {
        window.__plenaryQuietDepth++;
        try { b.click(); } finally { setTimeout(function () { window.__plenaryQuietDepth = Math.max(0, window.__plenaryQuietDepth - 1); }, 60); }
      };
      var cur = demo.querySelector("[data-demo-cursor]");
      var rip = demo.querySelector("[data-demo-ripple]");
      cur.style.transition = "left 900ms " + ease + ", top 900ms " + ease + ", transform 150ms ease, opacity 240ms ease";
      var navBtn = function (label) {
        var btns = Array.prototype.slice.call(box.querySelectorAll("button"));
        return btns.filter(function (b) { return (b.textContent || "").trim() === label; })[0];
      };
      var ptOf = function (btn) {
        var r = btn.getBoundingClientRect(), s = stage.getBoundingClientRect();
        return { x: r.left - s.left + Math.min(r.width * 0.38, 70), y: r.top - s.top + r.height / 2 };
      };
      var at = function (p) { cur.style.left = p.x + "px"; cur.style.top = p.y + "px"; };
      var press = function (p) {
        cur.style.transform = "scale(.82)";
        rip.style.left = p.x + "px"; rip.style.top = p.y + "px";
        rip.style.transition = "none"; rip.style.opacity = ".55"; rip.style.transform = "translate(-50%,-50%) scale(.3)";
        requestAnimationFrame(function () { rip.style.transition = "opacity 450ms ease, transform 450ms ease"; rip.style.opacity = "0"; rip.style.transform = "translate(-50%,-50%) scale(1.7)"; });
        setTimeout(function () { cur.style.transform = "scale(1)"; }, 170);
      };
      var rest = function () { var s = stage.getBoundingClientRect(); return { x: s.width * 0.62, y: s.height * 0.42 }; };
      var sched = function (fn, t) { setTimeout(fn, t); };
      var goTo = function (label, tMove, tClick) {
        sched(function () { var b = navBtn(label); if (b) at(ptOf(b)); }, tMove);
        sched(function () { var b = navBtn(label); if (b) { press(ptOf(b)); clickQuiet(b); } }, tClick);
      };
      var waited = 0;
      var cycle = function () {
        fit();
        if (!navBtn("Search")) {
          var m = host && host.getAttribute("data-mounted");
          if (m === "failed" || m === "skipped" || (waited += 800) > 30000) return;
          setTimeout(cycle, 800); return;
        }
        cur.style.opacity = "1";
        at(rest());
        goTo("Search", 900, 2000);
        sched(function () { var s = stage.getBoundingClientRect(); at({ x: s.width * 0.55, y: s.height * 0.52 }); }, 2900);
        goTo("Applications", 4600, 5700);
        sched(function () { var s = stage.getBoundingClientRect(); at({ x: s.width * 0.58, y: s.height * 0.6 }); }, 6600);
        goTo("Home", 9800, 10900);
        sched(function () { at(rest()); }, 11700);
        sched(cycle, 13200);
      };
      cycle();
    }
  }
})();
