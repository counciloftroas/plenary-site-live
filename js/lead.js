/* Mini Report request form: posts JSON to /api/lead (a Cloudflare Pages Function) and shows
   the thanks state in place. Without JS the form posts normally and the Function redirects
   back with ?sent=1. Turnstile loads only when a site key is configured. */
(function () {
  var form = document.querySelector("[data-lead-form]");
  var done = document.querySelector("[data-lead-done]");
  if (!form || !done) return;
  var status = form.querySelector("[data-lead-status]");
  var submit = form.querySelector("[data-lead-submit]");
  var key = form.getAttribute("data-turnstile-key") || "";
  var ts = form.querySelector(".cf-turnstile");
  if (ts) {
    if (key) {
      ts.setAttribute("data-sitekey", key);
      var s = document.createElement("script"); s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js"; s.async = true; s.defer = true; document.head.appendChild(s);
    } else { ts.remove(); }
  }
  var showDone = function () { form.hidden = true; done.hidden = false; done.setAttribute("tabindex", "-1"); done.focus(); };
  if (new URLSearchParams(window.location.search).get("sent") === "1") { showDone(); return; }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    var data = {};
    Array.prototype.forEach.call(form.elements, function (el) { if (el.name) data[el.name] = el.value; });
    status.textContent = ""; submit.setAttribute("aria-busy", "true"); submit.disabled = true;
    fetch(form.getAttribute("action"), { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j.ok, j: j }; }).catch(function () { return { ok: false, j: {} }; }); })
      .then(function (res) {
        if (res.ok) { showDone(); return; }
        status.style.color = "var(--red-700)";
        status.textContent = (res.j && res.j.error) || "We could not send that. Please try again in a minute.";
        if (window.turnstile && ts) { try { window.turnstile.reset(); } catch (err) {} }
      })
      .catch(function () { status.style.color = "var(--red-700)"; status.textContent = "No connection. Please try again."; })
      .then(function () { submit.removeAttribute("aria-busy"); submit.disabled = false; });
  });
})();
