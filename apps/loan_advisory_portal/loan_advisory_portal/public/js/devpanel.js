/* Dev mode: a drawer pinned to the bottom of the application page that shows, step by step,
   what the pipeline did for this application: OCR per document, the bureau check and every ZEN
   rule. Loaded only when the site sets `saral_dev_panel: 1`. Polls every 2 s while the
   application is in flight, then stops. ZEN evaluates all rules in milliseconds, so the rule
   list is the engine's own trace, revealed row by row when it arrives. */
(function () {
	"use strict";
	var ref = document.getElementById("application-ref");
	if (!ref || !window.Portal) return;
	var application = JSON.parse(ref.textContent || "null");
	window.__portalPollMs = 3000; // the page itself also refreshes faster in dev mode
	if (!application) return;

	var MARK = { done: "✓", current: "●", todo: "○", failed: "✕", skipped: "–" };
	var shown = {};
	var drawer = document.createElement("section");
	drawer.className = "devpanel";
	drawer.setAttribute("aria-label", "Dev mode");
	drawer.innerHTML =
		'<button type="button" class="devpanel__bar" aria-expanded="true">' +
		'<span class="devpanel__tag">Dev mode</span><span class="devpanel__status">Loading</span>' +
		'<span class="devpanel__chev" aria-hidden="true">▾</span></button>' +
		'<ol class="devpanel__steps" aria-live="polite"></ol>';
	document.body.appendChild(drawer);
	document.body.classList.add("has-devpanel");
	var bar = drawer.querySelector(".devpanel__bar");
	var list = drawer.querySelector(".devpanel__steps");
	var statusEl = drawer.querySelector(".devpanel__status");
	bar.addEventListener("click", function () {
		var open = drawer.classList.toggle("devpanel--closed") === false;
		bar.setAttribute("aria-expanded", open ? "true" : "false");
	});

	function time(at) {
		if (!at) return "";
		var m = String(at).match(/(\d{1,2}:\d{2}(:\d{2})?(\s?[AP]M)?)/);
		return m ? m[1] : "";
	}

	function rules(step, row) {
		var host = row.querySelector(".devpanel__rules");
		if (!host || !step.items.length || shown[step.key]) return;
		shown[step.key] = true;
		var i = 0;
		(function next() {
			if (i >= step.items.length) return;
			var r = step.items[i++];
			var li = document.createElement("li");
			li.className = "devpanel__rule devpanel__rule--" + String(r.result || "").toLowerCase().replace(/_/g, "-");
			li.innerHTML = "<code>" + Portal.esc(r.id || "") + "</code> " + Portal.esc(r.name || "") +
				'<span class="devpanel__res">' + Portal.esc(r.result || "") + "</span>";
			host.appendChild(li);
			window.setTimeout(next, 18);
		})();
	}

	function render(data) {
		var current = data.steps.filter(function (s) { return s.state === "current"; })[0];
		statusEl.textContent = data.state + (current ? " · " + current.label : "");
		list.innerHTML = "";
		data.steps.forEach(function (step) {
			var li = document.createElement("li");
			li.className = "devpanel__step devpanel__step--" + step.state;
			li.innerHTML =
				'<span class="devpanel__mark" aria-hidden="true">' + (MARK[step.state] || "·") + "</span>" +
				'<span class="devpanel__body"><strong>' + Portal.esc(step.label) + "</strong>" +
				(step.detail ? ' <span class="devpanel__detail">' + Portal.esc(step.detail) + "</span>" : "") +
				(step.items.length ? '<ol class="devpanel__rules"></ol>' : "") +
				"</span>" +
				'<span class="devpanel__at">' + Portal.esc(time(step.at)) + "</span>";
			list.appendChild(li);
			if (step.items.length) { shown[step.key] = false; rules(step, li); }
		});
	}

	var timer = null;
	var first = true;
	var wasInFlight = false;
	function tick() {
		Portal.call("loan_advisory_portal.api.progress.get_progress", { application: application })
			.then(function (data) {
				render(data);
				// Open while something is running; tucked away otherwise so it never hides the page.
				if (first) { first = false; drawer.classList.toggle("devpanel--closed", !data.in_flight); }
				if (data.in_flight) {
					drawer.classList.remove("devpanel--closed");
					wasInFlight = true;
					timer = window.setTimeout(tick, 2000);
				} else if (wasInFlight) {
					wasInFlight = false;
					// The decision landed: let the page show it too.
					if (window.location) window.setTimeout(function () { window.location.reload(); }, 4000);
				}
			})
			.catch(function (error) {
				statusEl.textContent = "Unavailable: " + (error.message || "error");
			});
	}

	// Submitting starts the run; look again straight away instead of waiting for the page poll.
	document.addEventListener("click", function (event) {
		if (event.target.closest("#submit-app, #resubmit-button")) {
			window.clearTimeout(timer);
			wasInFlight = true;
			window.setTimeout(tick, 1200);
		}
	});
	tick();
})();
