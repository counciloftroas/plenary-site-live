/* Plenary consent — one record shared by the banner, the preference center on /cookies/,
   and anything that wants to load an optional script.
   Record: localStorage["plenary.consent"] = { functional, analytics, marketing, doNotSell, savedAt }
   Model (html[data-consent-model]): "opt-out" — optional categories start ON, the visitor switches
   them off (US default); "opt-in" — they start OFF until accepted (EEA/UK).
   Global Privacy Control always wins: marketing off, do-not-sell on.
   Gate optional scripts with: if (PlenaryConsent.allows("analytics")) { … }
   and listen for document "plenary:consent" to react to a change. */
(function () {
  var KEY = "plenary.consent";
  var MODEL = (document.documentElement.getAttribute("data-consent-model") || "opt-out") === "opt-in" ? "opt-in" : "opt-out";
  var gpc = !!(window.navigator && window.navigator.globalPrivacyControl);

  function read() { try { var s = JSON.parse(window.localStorage.getItem(KEY) || "null"); return s && typeof s === "object" ? s : null; } catch (e) { return null; } }
  function defaults() { var on = MODEL === "opt-out"; return { functional: on, analytics: on, marketing: on, doNotSell: false }; }
  function normalize(rec) {
    rec = rec || defaults();
    var r = { functional: !!rec.functional, analytics: !!rec.analytics, marketing: !!rec.marketing, doNotSell: !!rec.doNotSell, savedAt: rec.savedAt || "" };
    if (gpc) { r.marketing = false; r.doNotSell = true; }
    return r;
  }
  function write(next) {
    var rec = normalize(next);
    rec.savedAt = new Date().toISOString();
    try { window.localStorage.setItem(KEY, JSON.stringify(rec)); } catch (e) {}
    try { document.dispatchEvent(new CustomEvent("plenary:consent", { detail: rec })); } catch (e) {}
    return rec;
  }
  function clear() { try { window.localStorage.removeItem(KEY); } catch (e) {} }
  function fmt(iso) { try { return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }); } catch (e) { return iso; } }

  window.PlenaryConsent = {
    model: MODEL, gpc: gpc,
    get: function () { return normalize(read()); },
    saved: function () { return !!read(); },
    set: function (next) { return write(next); },
    allows: function (category) { if (category === "essential") return true; var r = normalize(read()); return !!r[category]; }
  };

  // ---- Banner: every page, first visit only. Not on the cookies page — that page IS the preference center.
  var root = document.querySelector("[data-consent-root]");
  var onPrefsPage = !!document.getElementById("preferences");
  if (root) {
    var banner = root.querySelector('[data-consent-view="banner"]');
    var savedView = root.querySelector('[data-consent-view="saved"]');
    var choiceLine = root.querySelector("[data-consent-choiceline]");
    var gpcPill = root.querySelector("[data-consent-gpc]");
    var modelLine = root.querySelector("[data-consent-modelline]");
    var hideTimer = null;
    var show = function (which) { root.hidden = !which; banner.hidden = which !== "banner"; savedView.hidden = which !== "saved"; };
    if (gpcPill) gpcPill.hidden = !gpc;
    if (modelLine) modelLine.textContent = MODEL === "opt-in" ? "They stay off until you accept them." : "They are on unless you turn them off.";
    show(!read() && !onPrefsPage ? "banner" : null);
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-consent-action]");
      if (!b) return;
      var action = b.getAttribute("data-consent-action");
      if (action === "undo") { clear(); clearTimeout(hideTimer); show("banner"); return; }
      if (action === "all") write({ functional: true, analytics: true, marketing: true, doNotSell: false });
      else if (action === "essential") write({ functional: false, analytics: false, marketing: false, doNotSell: true });
      if (choiceLine) choiceLine.textContent = action === "all" ? "All cookies on." : "Essential cookies only.";
      show("saved");
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () { show(null); }, 9000);
    });
  }

  // ---- Preference center (/cookies/#preferences)
  var pc = document.getElementById("preferences");
  if (pc) {
    var stored = read();
    var state = normalize(stored);
    var savedAt = stored ? state.savedAt : "";
    var dirty = false;
    var keys = ["functional", "analytics", "marketing", "doNotSell"];
    var rows = {};
    keys.forEach(function (k) { rows[k] = pc.querySelector('[data-pref="' + k + '"]'); });
    var status = pc.querySelector("[data-pref-status]");
    var pill = pc.querySelector("[data-consent-gpc]");
    var line = pc.querySelector("[data-consent-modelline]");
    if (pill) pill.hidden = !gpc;
    if (line) line.textContent = MODEL === "opt-in" ? "Optional cookies are off until you turn them on." : "Optional cookies are on. Turn off any you do not want, then save.";
    var paint = function () {
      keys.forEach(function (k) {
        var row = rows[k]; if (!row) return;
        var on = !!state[k];
        row.setAttribute("aria-checked", on ? "true" : "false");
        var label = row.querySelector("[data-pref-label]"), track = row.querySelector("[data-track]"), knob = row.querySelector("[data-knob]");
        if (label) label.textContent = on ? "On" : "Off";
        if (track) track.style.background = on ? "var(--action)" : "var(--stone-400)";
        if (knob) knob.style.transform = on ? "translateX(20px)" : "translateX(0)";
      });
      if (status) {
        if (dirty) { status.textContent = "Not saved yet"; status.style.color = "var(--amber-700)"; status.hidden = false; }
        else if (savedAt) { status.textContent = "Saved " + fmt(savedAt); status.style.color = "var(--green-700)"; status.hidden = false; }
        else status.hidden = true;
      }
    };
    keys.forEach(function (k) {
      var row = rows[k]; if (!row) return;
      row.addEventListener("click", function () {
        var v = !state[k];
        state[k] = v;
        if (k === "doNotSell" && v) state.marketing = false;   // do-not-sell implies no marketing cookies
        if (k === "marketing" && v) state.doNotSell = false;   // and turning marketing on withdraws the opt-out
        dirty = true; savedAt = ""; paint();
      });
    });
    var persist = function (next) { var rec = write(next); state = rec; savedAt = rec.savedAt; dirty = false; paint(); };
    var on = function (name, fn) { var b = pc.querySelector('[data-pref-action="' + name + '"]'); if (b) b.addEventListener("click", fn); };
    on("save", function () { persist(state); });
    on("reject", function () { persist({ functional: false, analytics: false, marketing: false, doNotSell: true }); });
    on("accept", function () { persist({ functional: true, analytics: true, marketing: true, doNotSell: false }); });
    paint();
  }
})();
