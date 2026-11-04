/* Shared portal runtime: typed API calls, formatting, and small UI helpers. */
(function () {
	"use strict";

	var node = document.getElementById("portal-bootstrap");
	var boot = node ? JSON.parse(node.textContent) : { user: "Guest", csrf_token: "" };

	var money = new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: 0,
	});
	var dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

	function esc(value) {
		return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
			return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
		});
	}

	function messageOf(payload) {
		if (!payload) return "Something went wrong. Try again.";
		if (typeof payload._server_messages === "string") {
			try {
				var list = JSON.parse(payload._server_messages);
				for (var i = 0; i < list.length; i++) {
					var entry = JSON.parse(list[i]);
					if (entry && entry.message) return stripTags(entry.message);
				}
			} catch (err) {
				/* fall through to the generic message */
			}
		}
		if (payload.message && typeof payload.message === "string") return stripTags(payload.message);
		if (payload._error_message) return stripTags(payload._error_message);
		if (payload.exc_type) return "The request could not be completed (" + payload.exc_type + ").";
		return "Something went wrong. Try again.";
	}

	function stripTags(value) {
		var div = document.createElement("div");
		div.innerHTML = value;
		return (div.textContent || "").trim();
	}

	function redirectToLogin() {
		var target = window.location.pathname + window.location.search;
		window.location.assign("/login?redirect-to=" + encodeURIComponent(target));
	}

	function failure(response, payload) {
		if (
			response.status === 401 ||
			(response.status === 403 && payload && payload.exc_type === "PermissionError")
		) {
			redirectToLogin();
		}
		var error = new Error(messageOf(payload));
		error.status = response.status;
		error.payload = payload;
		return error;
	}

	async function parse(response) {
		try {
			return await response.json();
		} catch (err) {
			return null;
		}
	}

	/**
	 * Call a whitelisted method. Resolves with `message`; rejects with an Error
	 * carrying `.status` and `.payload` so pages can react to 401 vs validation.
	 */
	/*
	 * v6 page loading: while the page's first reads are still out after a short grace period, the loading
	 * status card (base.html #page-loading; a thin CSS status bar, still under reduced motion) shows with
	 * one status sentence. Content areas keep their own skeletons. Reads that a
	 * borrower starts later (a save, a refresh) have their own busy states, so they do not show it.
	 */
	var loading = { inflight: 0, settled: false, timer: 0, settle: 0, shownAt: 0 };

	function loadingHost() {
		return document.getElementById("page-loading");
	}

	function setLoading(show) {
		var host = loadingHost();
		if (!host) return;
		if (show) {
			if (!host.hidden) return;
			host.hidden = false;
			loading.shownAt = Date.now();
			document.body.setAttribute("data-page-loading", "");
			return;
		}
		var wait = Math.max(0, 450 - (Date.now() - loading.shownAt));
		window.setTimeout(function () {
			host.hidden = true;
			document.body.removeAttribute("data-page-loading");
		}, host.hidden ? 0 : wait);
	}

	function trackStart() {
		if (loading.settled) return false;
		if (loading.settle) {
			// A follow-up read right after the first ones is still part of the page load.
			window.clearTimeout(loading.settle);
			loading.settle = 0;
		}
		loading.inflight += 1;
		if (!loading.timer) {
			loading.timer = window.setTimeout(function () {
				loading.timer = 0;
				if (loading.inflight > 0 && !loading.settled) setLoading(true);
			}, 300);
		}
		return true;
	}

	function trackEnd() {
		loading.inflight = Math.max(0, loading.inflight - 1);
		if (loading.inflight > 0) return;
		loading.settle = window.setTimeout(function () {
			loading.settle = 0;
			if (loading.inflight > 0) return;
			loading.settled = true;
			if (loading.timer) {
				window.clearTimeout(loading.timer);
				loading.timer = 0;
			}
			setLoading(false);
		}, 150);
	}

	async function call(method, args) {
		var tracked = trackStart();
		try {
			return await request(method, args);
		} finally {
			if (tracked) trackEnd();
		}
	}

	async function request(method, args) {
		var response = await fetch("/api/method/" + method, {
			method: "POST",
			credentials: "same-origin",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				"X-Frappe-CSRF-Token": boot.csrf_token || "",
			},
			body: JSON.stringify(args || {}),
		});
		var payload = await parse(response);
		if (!response.ok) throw failure(response, payload);
		return payload ? payload.message : null;
	}

	/** Upload a private file and return the File record (name, file_name, file_url). */
	async function upload(file) {
		var body = new FormData();
		body.append("file", file, file.name);
		body.append("is_private", "1");
		body.append("folder", "Home");
		var response = await fetch("/api/method/upload_file", {
			method: "POST",
			credentials: "same-origin",
			headers: { Accept: "application/json", "X-Frappe-CSRF-Token": boot.csrf_token || "" },
			body: body,
		});
		var payload = await parse(response);
		if (!response.ok || !payload || !payload.message) throw failure(response, payload);
		return payload.message;
	}

	function flash(kind, title, text) {
		var host = document.getElementById("flash");
		if (!host) return;
		var box = document.createElement("div");
		box.className = "alert alert--" + kind;
		box.setAttribute("role", kind === "error" ? "alert" : "status");
		box.innerHTML = "<strong>" + esc(title) + "</strong>" + (text ? "<span>" + esc(text) + "</span>" : "");
		host.appendChild(box);
		window.setTimeout(function () {
			box.remove();
		}, kind === "error" ? 9000 : 5000);
	}

	function busy(button, isBusy, label) {
		if (!button) return;
		if (isBusy) {
			button.dataset.label = button.textContent;
			button.disabled = true;
			button.setAttribute("aria-busy", "true");
			if (label) button.textContent = label;
		} else {
			button.disabled = false;
			button.removeAttribute("aria-busy");
			if (button.dataset.label) button.textContent = button.dataset.label;
		}
	}

	function money$1(value) {
		if (value === null || value === undefined || value === "") return "—";
		return money.format(Number(value));
	}

	function date(value) {
		if (!value) return "—";
		var parsed = new Date(String(value).replace(" ", "T"));
		if (isNaN(parsed.getTime())) return String(value);
		return dateFmt.format(parsed);
	}

	function months(value) {
		if (!value) return "—";
		return value + (Number(value) === 1 ? " month" : " months");
	}

	var LIFECYCLE = {
		"": { label: "Draft", cls: "badge--neutral" },
		DRAFT: { label: "Draft", cls: "badge--neutral" },
		SUBMITTED: { label: "Submitted", cls: "badge--info" },
		INFO_REQUESTED: { label: "Information needed", cls: "badge--warn" },
		UNDER_REVIEW: { label: "Under review", cls: "badge--info" },
		MANUAL_REVIEW: { label: "Manual review", cls: "badge--warn" },
		APPROVED: { label: "Approved", cls: "badge--ok" },
		REJECTED: { label: "Not approved", cls: "badge--bad" },
		WITHDRAWN: { label: "Withdrawn", cls: "badge--neutral" },
	};

	function lifecycleLabel(lifecycle, decision) {
		var entry = lifecycle ? LIFECYCLE[lifecycle] : null;
		if (!entry && decision === "APPROVED") entry = LIFECYCLE.APPROVED;
		if (!entry && decision === "REJECTED") entry = LIFECYCLE.REJECTED;
		if (!entry) entry = lifecycle ? { label: lifecycle } : LIFECYCLE[""];
		return entry.label;
	}

	function lifecycleBadge(lifecycle, decision) {
		/* The canonical lifecycle always wins. A decision is only a fallback for a
		   legacy row with no lifecycle value, so a held decision (MANUAL_REVIEW)
		   can never render as Approved. */
		var entry = lifecycle ? LIFECYCLE[lifecycle] : null;
		if (!entry && decision === "APPROVED") entry = LIFECYCLE.APPROVED;
		if (!entry && decision === "REJECTED") entry = LIFECYCLE.REJECTED;
		if (!entry) entry = lifecycle ? { label: lifecycle, cls: "badge--neutral" } : LIFECYCLE[""];
		return '<span class="badge ' + entry.cls + '">' + esc(entry.label) + "</span>";
	}

	function initials(name) {
		var parts = String(name || "").trim().split(/\s+/).filter(Boolean);
		if (!parts.length) return "LA";
		if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	}

	function openDialog(dialog) {
		if (!dialog) return;
		if (typeof dialog.showModal === "function") dialog.showModal();
		else dialog.setAttribute("open", "");
	}

	function closeDialog(dialog) {
		if (!dialog) return;
		if (typeof dialog.close === "function") dialog.close();
		else dialog.removeAttribute("open");
	}

	async function logout() {
		try {
			await call("logout");
		} catch (err) {
			/* a failed logout still clears the local view */
		}
		window.location.assign("/login");
	}

	window.Portal = {
		boot: boot,
		call: call,
		upload: upload,
		esc: esc,
		flash: flash,
		busy: busy,
		money: money$1,
		date: date,
		months: months,
		lifecycleBadge: lifecycleBadge,
		lifecycleLabel: lifecycleLabel,
		initials: initials,
		openDialog: openDialog,
		closeDialog: closeDialog,
		logout: logout,
		loading: setLoading,
	};

	function setNav(open) {
		document.body.classList.toggle("nav-open", open);
		var scrim = document.querySelector(".nav-scrim");
		if (scrim) scrim.hidden = !open;
		document.querySelectorAll("[data-action='nav-toggle']").forEach(function (button) {
			button.setAttribute("aria-expanded", open ? "true" : "false");
		});
		if (open) {
			var first = document.querySelector("#portal-rail a, #portal-rail button");
			if (first) first.focus();
		}
	}

	document.addEventListener("click", function (event) {
		var target = event.target.closest("[data-action='logout']");
		if (target) {
			event.preventDefault();
			logout();
			return;
		}
		if (event.target.closest("[data-action='nav-toggle']")) {
			setNav(!document.body.classList.contains("nav-open"));
			return;
		}
		if (event.target.closest("[data-action='nav-close']")) setNav(false);
	});

	document.addEventListener("keydown", function (event) {
		if (event.key === "Escape" && document.body.classList.contains("nav-open")) setNav(false);
	});

	if (boot.user && boot.user !== "Guest") {
		document.documentElement.dataset.signedIn = "true";
		if (document.body) document.body.dataset.signedIn = "true";
	}
})();
