/*
 * Saral shader loader (one for every page; decorative only).
 *
 * Any element marked data-shader="<name>" already paints a static CSS gradient (portal.css, "v5 shaders").
 * After first paint, once the page has loaded and gone idle, this lazily imports Paper Shaders and fades a
 * live canvas in over that fallback:
 *   brand | warm | approved | muted | orb  -> MeshGradient    (vendor/saral-shader.js, ~8 KB gzipped)
 *   calm | pulse                           -> GrainGradient / PulsingBorder (vendor/saral-shader-extra.js,
 *                                             loaded only when a page shows one; carries Paper's noise texture)
 * Budget and safety:
 *   - at most 2 live shaders per page (first in document order win; the rest keep the static gradient);
 *   - render resolution capped at 1.5x device pixels (maxPixelCount follows the zone's size);
 *   - Paper's ShaderMount pauses while a zone is off-screen or the tab is hidden;
 *   - nothing loads when reduced motion is set, Save-Data is on or WebGL is missing; switching reduced
 *     motion on while the page is open disposes every shader;
 *   - zones that React or page scripts add later are picked up (MutationObserver), and zones that leave the
 *     DOM are disposed, so the assistant's thinking ring and empty-state orb never pile up.
 * Shaders never sit behind form fields, tables or body text; text on a shader sits on a solid plate.
 */
(function () {
	"use strict";
	var BASE = "/assets/loan_advisory_portal/js/vendor/";
	var EXTRA = { calm: 1, pulse: 1 };
	var MAX_LIVE = 2;
	var DPR_CAP = 1.5;
	var motion = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
	var mounts = [];
	var modules = {};
	var ready = false;
	var stopped = false;
	var queued = false;

	function allowed() {
		if (stopped) return false;
		if (motion && motion.matches) return false;
		if (navigator.connection && navigator.connection.saveData) return false;
		try {
			var probe = document.createElement("canvas");
			return !!(probe.getContext("webgl2") || probe.getContext("webgl"));
		} catch (e) {
			return false;
		}
	}

	function load(name) {
		var file = EXTRA[name] ? "saral-shader-extra.js" : "saral-shader.js";
		if (!modules[file]) {
			modules[file] = import(BASE + file).then(function (mod) {
				// The extra chunk waits for Paper's noise texture to decode before it can mount.
				return Promise.resolve(mod.ready).then(function () {
					return mod;
				});
			});
		}
		return modules[file];
	}

	function pixelBudget(zone) {
		var dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
		var box = zone.getBoundingClientRect();
		return Math.max(1, Math.round(box.width * dpr) * Math.round(box.height * dpr));
	}

	function dispose(entry) {
		try {
			entry.mount.dispose();
		} catch (e) {
			/* already gone */
		}
		if (entry.resize) entry.resize.disconnect();
		if (entry.layer && entry.layer.parentNode) entry.layer.parentNode.removeChild(entry.layer);
		entry.zone.classList.remove("is-live");
		entry.zone.removeAttribute("data-shader-on");
	}

	function prune() {
		mounts = mounts.filter(function (entry) {
			if (entry.zone.isConnected) return true;
			dispose(entry);
			return false;
		});
	}

	function mountZone(zone, mod) {
		if (!zone.isConnected || zone.hasAttribute("data-shader-on") || mounts.length >= MAX_LIVE) return;
		var name = zone.getAttribute("data-shader");
		zone.setAttribute("data-shader-on", "");
		var layer = document.createElement("div");
		layer.className = "shader-zone__canvas";
		layer.setAttribute("aria-hidden", "true");
		zone.insertBefore(layer, zone.firstChild);
		try {
			var mount = mod.mount(layer, name, { maxPixels: pixelBudget(zone) });
			var entry = { zone: zone, layer: layer, mount: mount, resize: null };
			if (window.ResizeObserver) {
				entry.resize = new ResizeObserver(function () {
					mount.setMaxPixelCount(pixelBudget(zone));
				});
				entry.resize.observe(zone);
			}
			mounts.push(entry);
			requestAnimationFrame(function () {
				zone.classList.add("is-live");
			});
		} catch (e) {
			layer.remove();
			zone.setAttribute("data-shader-failed", "");
			if (window.console) console.warn("Saral shader kept its static look:", e && e.message);
		}
	}

	function scan() {
		queued = false;
		if (!ready) return;
		prune();
		if (mounts.length >= MAX_LIVE || !allowed()) return;
		var zones = Array.prototype.slice.call(document.querySelectorAll("[data-shader]:not([data-shader-on]):not([data-shader-failed])"));
		zones.slice(0, MAX_LIVE - mounts.length).forEach(function (zone) {
			load(zone.getAttribute("data-shader"))
				.then(function (mod) {
					mountZone(zone, mod);
				})
				.catch(function () {
					/* keep the static gradient */
				});
		});
	}

	function queue() {
		if (queued) return;
		queued = true;
		requestAnimationFrame(scan);
	}

	if (motion && motion.addEventListener) {
		motion.addEventListener("change", function (event) {
			if (!event.matches) return;
			stopped = true;
			mounts.forEach(dispose);
			mounts = [];
		});
	}

	function start() {
		ready = true;
		scan();
		if (window.MutationObserver) {
			new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
		}
	}

	function idle() {
		if ("requestIdleCallback" in window) window.requestIdleCallback(start, { timeout: 1500 });
		else setTimeout(start, 400);
	}

	window.saralShader = {
		scan: queue,
		live: function () {
			return mounts.map(function (entry) {
				return entry.zone.getAttribute("data-shader");
			});
		},
	};
	if (document.readyState === "complete") idle();
	else window.addEventListener("load", idle, { once: true });
})();
