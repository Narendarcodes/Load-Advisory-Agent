/*
 * Saral shader loader (one for every page; decorative only).
 *
 * v6 placement (DESIGN_PRINCIPLES §1 "Shader placement (v6)"): shaders sit on flat surfaces (the page wash,
 * the top bar and footer bands, the edge of a few key cards, the loading band) and in the assistant
 * (orb, thinking ring, composer edge, streaming edge, voice orb). Never behind an illustration, form
 * fields, tables, body text or the sidebar.
 *
 * Any element marked data-shader="<look>" already paints a static CSS look (portal.css, "v6 shaders").
 * After first paint, once the page has loaded and gone idle, this lazily imports Paper Shaders and fades a
 * live canvas in over that fallback:
 *   wash | band | loading | orb | stream          -> MeshGradient   (vendor/saral-shader.js)
 *   ring | pulse | composer | voice | calm        -> PulsingBorder / SmokeRing / GrainGradient
 *                                                    (vendor/saral-shader-extra.js, only when a page shows one)
 * Budget and safety:
 *   - at most 2 live shaders at once, chosen among the zones on screen by priority (data-shader-priority,
 *     or the look's default below); a higher-priority zone that appears takes the slot of a lower one, and a
 *     zone that scrolls away or is hidden is disposed and returns to its static look;
 *   - render resolution capped at 1.5x device pixels (smooth fields such as the wash render lower still);
 *   - Paper's ShaderMount also pauses in hidden tabs;
 *   - nothing loads when reduced motion is set, Save-Data is on or WebGL is missing; switching reduced
 *     motion on while the page is open disposes every shader;
 *   - zones that React or page scripts add, remove or re-state later are picked up (MutationObserver):
 *     data-shader-state (and data-shader-level for the voice orb) are passed to the live shader.
 */
(function () {
	"use strict";
	var BASE = "/assets/loan_advisory_portal/js/vendor/";
	var EXTRA = { ring: 1, pulse: 1, composer: 1, voice: 1, calm: 1 };
	var PRIORITY = { voice: 9, pulse: 8, orb: 7, stream: 7, loading: 7, calm: 6, composer: 5, ring: 4, wash: 3, band: 2 };
	var MAX_LIVE = 2;
	var DPR_CAP = 1.5;
	var motion = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
	var mounts = [];
	var modules = {};
	var visible = new Set();
	var pending = new Set();
	var ready = false;
	var stopped = false;
	var queued = false;
	var io = null;
	var observed = new WeakSet();

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

	function priority(zone) {
		var own = parseFloat(zone.getAttribute("data-shader-priority"));
		if (!isNaN(own)) return own;
		return PRIORITY[zone.getAttribute("data-shader")] || 1;
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

	function layerOf(zone) {
		return zone.querySelector(":scope > .shader-zone__canvas");
	}

	function pixelBudget(layer) {
		var dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
		var box = layer.getBoundingClientRect();
		return Math.max(1, Math.round(box.width * dpr) * Math.round(box.height * dpr));
	}

	function dispose(entry) {
		try {
			entry.handle.dispose();
		} catch (e) {
			/* already gone */
		}
		if (entry.resize) entry.resize.disconnect();
		if (entry.layer && entry.layer.parentNode) entry.layer.parentNode.removeChild(entry.layer);
		entry.zone.classList.remove("is-live");
		entry.zone.removeAttribute("data-shader-on");
	}

	function isVisible(zone) {
		if (!zone.isConnected || !zone.hasAttribute("data-shader")) return false;
		if (io) return visible.has(zone);
		return zone.getClientRects().length > 0;
	}

	function entryOf(zone) {
		for (var i = 0; i < mounts.length; i++) if (mounts[i].zone === zone) return mounts[i];
		return null;
	}

	function prune() {
		mounts = mounts.filter(function (entry) {
			var keep = isVisible(entry.zone) && entry.zone.getAttribute("data-shader") === entry.name;
			if (!keep) dispose(entry);
			return keep;
		});
	}

	function applyState(entry) {
		var state = entry.zone.getAttribute("data-shader-state") || "";
		var level = parseFloat(entry.zone.getAttribute("data-shader-level")) || 0;
		if (state === entry.state && Math.abs(level - entry.level) < 0.04) return;
		entry.state = state;
		entry.level = level;
		try {
			entry.handle.setState(state, level);
		} catch (e) {
			/* a look without states */
		}
	}

	function mountZone(zone, mod) {
		pending.delete(zone);
		if (!isVisible(zone) || entryOf(zone) || mounts.length >= MAX_LIVE || !allowed()) return;
		var name = zone.getAttribute("data-shader");
		zone.setAttribute("data-shader-on", "");
		var layer = document.createElement("div");
		layer.className = "shader-zone__canvas";
		layer.setAttribute("aria-hidden", "true");
		zone.insertBefore(layer, zone.firstChild);
		try {
			var handle = mod.mount(layer, name, { maxPixels: pixelBudget(layer), state: zone.getAttribute("data-shader-state") || "" });
			var entry = { zone: zone, name: name, layer: layer, handle: handle, resize: null, state: null, level: -1 };
			if (window.ResizeObserver) {
				entry.resize = new ResizeObserver(function () {
					handle.setMaxPixelCount(pixelBudget(layer));
				});
				entry.resize.observe(layer);
			}
			mounts.push(entry);
			applyState(entry);
			requestAnimationFrame(function () {
				zone.classList.add("is-live");
			});
		} catch (e) {
			layer.remove();
			zone.removeAttribute("data-shader-on");
			zone.setAttribute("data-shader-failed", "");
			if (window.console) console.warn("Saral shader kept its static look:", e && e.message);
		}
	}

	function watch() {
		if (!io) return;
		document.querySelectorAll("[data-shader]").forEach(function (zone) {
			if (observed.has(zone)) return;
			observed.add(zone);
			io.observe(zone);
		});
	}

	function scan() {
		queued = false;
		if (!ready) return;
		watch();
		prune();
		if (!allowed()) return;
		mounts.forEach(applyState);
		var candidates = Array.prototype.slice
			.call(document.querySelectorAll("[data-shader]:not([data-shader-failed])"))
			.filter(function (zone) {
				return isVisible(zone) && !entryOf(zone) && !pending.has(zone);
			})
			.sort(function (a, b) {
				return priority(b) - priority(a);
			});
		candidates.forEach(function (zone) {
			var free = MAX_LIVE - mounts.length - pending.size;
			if (free <= 0) {
				// A more important zone on screen takes the slot of the least important live one.
				var lowest = null;
				mounts.forEach(function (entry) {
					if (!lowest || priority(entry.zone) < priority(lowest.zone)) lowest = entry;
				});
				if (!lowest || priority(lowest.zone) >= priority(zone)) return;
				dispose(lowest);
				mounts.splice(mounts.indexOf(lowest), 1);
			}
			pending.add(zone);
			load(zone.getAttribute("data-shader"))
				.then(function (mod) {
					mountZone(zone, mod);
				})
				.catch(function () {
					pending.delete(zone);
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
		if (window.IntersectionObserver) {
			io = new IntersectionObserver(
				function (records) {
					records.forEach(function (record) {
						if (record.isIntersecting) visible.add(record.target);
						else visible.delete(record.target);
					});
					queue();
				},
				{ rootMargin: "80px 0px" },
			);
		}
		scan();
		if (window.MutationObserver) {
			new MutationObserver(queue).observe(document.body, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ["data-shader", "data-shader-state", "data-shader-level", "hidden"],
			});
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
				return entry.name;
			});
		},
	};
	if (document.readyState === "complete") idle();
	else window.addEventListener("load", idle, { once: true });
})();
