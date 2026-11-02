/*
 * Saral hero shader loader. Decorative only.
 *
 * Elements marked data-shader="<palette>" (the sign-in art panel, the products hero art and the
 * approved result art) already show a static CSS gradient. After the page has loaded and gone idle,
 * this lazily imports the Paper Shaders mesh gradient (vendor/saral-shader.js, ~7 KB gzipped) and
 * fades a slow-moving canvas in over that fallback. Nothing happens when the user prefers reduced
 * motion, when WebGL is missing, or when Save-Data is on: the static gradient stays. The canvas is
 * never behind body text, and Paper's ShaderMount pauses it while it is off-screen or the tab is hidden.
 * Pages that render a zone later (the application result) call window.saralShader.scan().
 */
(function () {
	"use strict";
	var motion = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
	var mounts = [];
	var loading = null;
	var ready = false;

	function allowed() {
		if (motion && motion.matches) return false;
		if (navigator.connection && navigator.connection.saveData) return false;
		try {
			var probe = document.createElement("canvas");
			return !!(probe.getContext("webgl2") || probe.getContext("webgl"));
		} catch (e) {
			return false;
		}
	}

	function mountAll(mod) {
		var zones = document.querySelectorAll("[data-shader]:not([data-shader-on])");
		Array.prototype.forEach.call(zones, function (zone) {
			zone.setAttribute("data-shader-on", "");
			var layer = document.createElement("div");
			layer.className = "shader-zone__canvas";
			layer.setAttribute("aria-hidden", "true");
			zone.insertBefore(layer, zone.firstChild);
			try {
				mounts.push({ zone: zone, mount: mod.mount(layer, zone.getAttribute("data-shader")) });
				requestAnimationFrame(function () {
					zone.classList.add("is-live");
				});
			} catch (e) {
				layer.remove();
			}
		});
	}

	function scan() {
		if (!ready || !document.querySelector("[data-shader]:not([data-shader-on])") || !allowed()) return;
		if (!loading) loading = import("/assets/loan_advisory_portal/js/vendor/saral-shader.js");
		loading.then(mountAll).catch(function () {
			/* keep the static gradient */
		});
	}

	// Stop for good if the user switches reduced motion on while the page is open.
	if (motion && motion.addEventListener) {
		motion.addEventListener("change", function (event) {
			if (!event.matches) return;
			mounts.forEach(function (m) {
				m.mount.dispose();
				m.zone.classList.remove("is-live");
			});
			mounts = [];
		});
	}

	function idle() {
		var go = function () {
			ready = true;
			scan();
		};
		if ("requestIdleCallback" in window) window.requestIdleCallback(go, { timeout: 2000 });
		else setTimeout(go, 600);
	}
	window.saralShader = { scan: scan };
	if (document.readyState === "complete") idle();
	else window.addEventListener("load", idle, { once: true });
})();
