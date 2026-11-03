/* Document workspace: uploads, private files, previews and the hand-off to
   submission. Files belong to one application and the server re-checks
   ownership on every call. */
(function () {
	"use strict";

	var Portal = window.Portal;
	var config = {};
	try {
		config = JSON.parse(document.getElementById("documents-data").textContent || "{}");
	} catch (error) {
		config = {};
	}
	var DEMO = !!config.demo;
	var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	var MAX_BYTES = 10 * 1024 * 1024;

	var state = {
		application: null,
		documents: [],
		types: [],
		labels: {},
		canEdit: false,
		uploading: false,
		extractingRow: null,
		confirmingRow: null,
		confirmedRows: {},
		extraction: null,
		pendingRow: null,
		previewRow: null,
		previewToken: 0,
	};

	function field(id) {
		return document.getElementById(id);
	}

	function show(node) {
		if (node) node.classList.remove("hidden");
	}

	function hide(node) {
		if (node) node.classList.add("hidden");
	}

	function isAuth(error) {
		return (
			error.status === 401 ||
			(error.status === 403 && error.payload && error.payload.exc_type === "PermissionError")
		);
	}

	function setStatus(text, stateName) {
		var node = field("upload-status");
		node.textContent = text;
		if (stateName) node.dataset.state = stateName;
		else delete node.dataset.state;
	}

	function showFieldError(input, message) {
		input.setAttribute("aria-invalid", "true");
		var wrapper = input.closest(".field");
		var node = wrapper ? wrapper.querySelector(".error") : null;
		if (node) {
			node.textContent = message;
			node.classList.remove("hidden");
		}
		input.focus();
	}

	function clearFieldError(input) {
		input.removeAttribute("aria-invalid");
		var wrapper = input.closest(".field");
		var node = wrapper ? wrapper.querySelector(".error") : null;
		if (node) node.classList.add("hidden");
	}

	function sizeText(bytes) {
		var size = Number(bytes) || 0;
		if (!size) return "";
		if (size >= 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + " MB";
		return Math.max(1, Math.round(size / 1024)) + " KB";
	}

	function extensionOf(name) {
		var match = /\.([a-z0-9]+)$/i.exec(name || "");
		return match ? match[1].toUpperCase() : "FILE";
	}

	function labelOf(documentType) {
		return state.labels[documentType] || documentType;
	}

	function renderApplication() {
		var app = state.application;
		show(field("application-head"));
		show(field("summary-card"));
		show(field("handoff-card"));
		hide(field("no-application"));

		field("app-title").textContent = app.purpose || "Loan application";
		field("app-meta").textContent =
			app.name + " · " + Portal.money(app.loan_amount) + " over " + Portal.months(app.tenure_months);
		field("app-status").innerHTML = Portal.lifecycleBadge(
			app.lifecycle,
			app.decision && app.decision.decision
		);

		field("sum-amount").textContent = Portal.money(app.loan_amount);
		field("sum-tenure").textContent = Portal.months(app.tenure_months);
		field("sum-purpose").textContent = app.purpose || "Not provided";
		field("sum-status").textContent = Portal.lifecycleLabel(
			app.lifecycle,
			app.decision && app.decision.decision
		);

		var canEdit = app.docstatus === 0 && app.lifecycle !== "WITHDRAWN";
		state.canEdit = canEdit;
		field("upload-card").classList.toggle("hidden", !canEdit);
		field("locked-note").classList.toggle("hidden", canEdit);
		if (!canEdit) {
			var strong = field("locked-note").querySelector("strong");
			var span = field("locked-note").querySelector("span");
			if (app.lifecycle === "WITHDRAWN") {
				strong.textContent = "Application withdrawn";
				span.textContent = "Documents cannot be added or removed on a withdrawn application.";
			} else {
				strong.textContent = "Documents are locked";
				span.textContent = "This application has been submitted, so documents cannot be added or removed now.";
			}
		}

		var link = field("continue-application");
		link.href = "/borrower/application?name=" + encodeURIComponent(app.name);
		if (canEdit) {
			field("handoff-title").textContent = "Ready to submit?";
			field("handoff-text").textContent =
				"Open the application to check the details and submit it for review.";
			link.textContent = "Open the application";
		} else {
			field("handoff-title").textContent = "Application submitted";
			field("handoff-text").textContent =
				"You can still download documents and ask the assistant about the decision.";
			link.textContent = "View the application status";
		}
	}

	function renderTypes() {
		var select = field("doc-type");
		if (!state.types.length) {
			select.innerHTML = '<option value="">No document types are configured</option>';
			select.disabled = true;
			field("doc-file").disabled = true;
			setStatus("No document types are configured. Contact your loan advisor.", "error");
			return;
		}
		state.labels = {};
		var options = ['<option value="">Choose a type</option>'];
		state.types.forEach(function (type) {
			var label = type.loan_document_type || type.name;
			state.labels[type.name] = label;
			options.push('<option value="' + Portal.esc(type.name) + '">' + Portal.esc(label) + "</option>");
		});
		select.innerHTML = options.join("");
		select.disabled = false;
		field("doc-file").disabled = false;
	}

	function renderDocuments() {
		var count = state.documents.length;
		field("doc-count").textContent = count + (count === 1 ? " document" : " documents");
		field("doc-empty").classList.toggle("hidden", count > 0);
		field("doc-list").innerHTML = state.documents
			.map(function (doc, index) {
				var meta = [labelOf(doc.document_type), sizeText(doc.size)].filter(Boolean).join(" · ");
				var actions =
					'<button type="button" class="btn btn--quiet btn--sm" data-preview="' +
					index +
					'">Preview</button><button type="button" class="btn btn--quiet btn--sm" data-download="' +
					index +
					'">Download</button>';
				if (state.canEdit) {
					if (!DEMO) {
						var reading = state.extractingRow === doc.row;
						actions +=
							'<button type="button" class="btn btn--quiet btn--sm" data-extract="' +
							index +
							'"' +
							(reading ? " disabled aria-busy=\"true\"" : "") +
							">" +
							(reading ? "Reading…" : state.confirmedRows[doc.row] ? "View fields" : "Read fields") +
							"</button>";
					}
					actions +=
						'<button type="button" class="btn btn--quiet btn--sm" data-remove="' + index + '">Remove</button>';
				}
				return (
					'<li class="doc-row"><span class="doc-row__mark" aria-hidden="true">' +
					Portal.esc(extensionOf(doc.file_name)) +
					'</span><span class="doc-row__body"><span class="doc-row__name">' +
					Portal.esc(doc.file_name || "Document") +
					'</span><span class="doc-row__meta">' +
					Portal.esc(meta) +
					'</span></span><span class="doc-row__actions">' +
					actions +
					"</span></li>"
				);
			})
			.join("");
	}

	function resetPreview() {
		state.previewToken += 1;
		state.previewRow = null;
		state.extraction = null;
		field("preview-heading").textContent = "Document preview";
		hide(field("preview-close"));
		field("preview-body").removeAttribute("aria-busy");
		field("preview-body").innerHTML =
			'<p class="small muted">Choose Preview for a person-review note, or Read fields to run local OCR on an attached document.</p>';
	}

	function previewHeader(doc, badge) {
		return (
			'<div class="preview-sheet__top"><div><strong>' +
			Portal.esc(doc.file_name || "Document") +
			'</strong><p class="small muted">' +
			Portal.esc(labelOf(doc.document_type)) +
			" · " +
			Portal.esc(sizeText(doc.size) || "Size not recorded") +
			"</p></div>" +
			badge +
			"</div>"
		);
	}

	function renderPreview(doc) {
		if (!doc) return;
		var token = ++state.previewToken;
		state.previewRow = doc.row;
		state.extraction = null;
		field("preview-heading").textContent = "Document preview";
		field("preview-body").removeAttribute("aria-busy");
		show(field("preview-card"));
		show(field("preview-close"));
		field("preview-body").innerHTML =
			'<div class="preview-sheet">' +
			previewHeader(doc, '<span class="badge badge--info">Checking view</span>') +
			'<div class="skeleton skeleton--block" aria-hidden="true"></div>' +
			'<p class="small muted">Preparing a preview</p></div>';
		window.setTimeout(function () {
			if (state.previewToken !== token || state.previewRow !== doc.row) return;
			renderPreviewResult(doc, token);
		}, DEMO ? 650 : 350);
	}

	function renderPreviewResult(doc, token) {
		if (state.previewToken !== token || state.previewRow !== doc.row) return;
		if (DEMO) {
			field("preview-body").innerHTML =
				'<div class="preview-sheet">' +
				previewHeader(doc, '<span class="demo-flag">Demo</span>') +
				'<div class="preview-sample"><strong>Sample checking fields</strong>' +
				"<span>Name on document: Sample only</span>" +
				"<span>Document number: •••• 1234</span>" +
				"<span>Date of issue: Sample only</span></div>" +
				'<p class="small muted">This is a demonstration of the checking view. Nothing was read from your file, and no automatic verification has happened.</p>' +
				'<p class="small muted">In a live deployment a person reviews the uploaded file. Automatic reading is not connected in this environment.</p></div>';
			return;
		}
		field("preview-body").innerHTML =
			'<div class="preview-sheet">' +
			previewHeader(doc, '<span class="badge badge--neutral">Person review</span>') +
			'<p class="small muted">Choose Read fields to extract supported values locally, or use Download to inspect the original. A person reviews the uploaded file after you submit.</p>' +
			'<p class="small muted">Open the original with Download if you need to check what you sent.</p></div>';
	}

	function renderExtraction(doc, result, confirmedValues, alreadyConfirmed) {
		var fields = result.fields || result.extracted_values || {};
		var keys = Object.keys(fields);
		var confirmed = confirmedValues || {};
		var warnings = result.warnings || [];
		var suggestions = result.suggestions || {};
		state.previewRow = doc.row;
		state.extraction = {
			row: doc.row,
			result: result,
			confirmedValues: confirmed,
			alreadyConfirmed: alreadyConfirmed,
		};
		if (alreadyConfirmed) state.confirmedRows[doc.row] = true;
		field("preview-heading").textContent = alreadyConfirmed ? "Confirmed extraction" : "Review extracted fields";
		show(field("preview-card"));
		show(field("preview-close"));

		var fieldHtml = keys
			.map(function (key) {
				var item = fields[key] || {};
				var value = Object.prototype.hasOwnProperty.call(confirmed, key) ? confirmed[key] : item.value;
				var confidence =
					typeof item.confidence === "number" ? Math.round(item.confidence) + "% confidence" : "Confidence unavailable";
				var status = String(item.status || "unknown").replace(/_/g, " ");
				return (
					'<div class="ocr-field"><div class="ocr-field__head"><label for="ocr-field-' +
					Portal.esc(key) +
					'">' +
					Portal.esc(item.label || key) +
					'</label><span class="badge badge--neutral">' +
					Portal.esc(status) +
					'</span></div><input id="ocr-field-' +
					Portal.esc(key) +
							'" type="text" autocomplete="off" spellcheck="false" data-ocr-field="' +
					Portal.esc(key) +
					'" value="' +
					Portal.esc(value == null ? "" : value) +
					'"' +
					(alreadyConfirmed ? " readonly" : "") +
					'><p class="tiny muted">' +
					Portal.esc(item.note || confidence) +
					(item.note ? " · " + Portal.esc(confidence) : "") +
					"</p></div>"
				);
			})
			.join("");
		var warningHtml = warnings.length
			? '<div class="alert alert--warn"><strong>Check these notes</strong><ul>' +
				warnings.map(function (warning) {
					return "<li>" + Portal.esc(warning) + "</li>";
				}).join("") +
				"</ul></div>"
			: "";
		var suggestionKeys = Object.keys(suggestions);
		var suggestionHtml = suggestionKeys.length
			? '<div class="ocr-suggestions"><strong>Suggested only — not applied to your application</strong><ul>' +
				suggestionKeys.map(function (key) {
					var item = suggestions[key] || {};
					return (
						"<li>" +
						Portal.esc(key.replace(/_/g, " ")) +
						": " +
						Portal.esc(item.value) +
						(item.source ? " (from " + Portal.esc(item.source.replace(/_/g, " ")) + ")" : "") +
						"</li>"
					);
				}).join("") +
				"</ul></div>"
			: "";
		var confirmHtml =
			!alreadyConfirmed && keys.length && state.canEdit
				? '<button type="button" class="btn" data-confirm-extraction' +
					(state.confirmingRow === doc.row ? " disabled aria-busy=\"true\"" : "") +
					">" +
					(state.confirmingRow === doc.row ? "Saving…" : "Confirm these values") +
					"</button>"
				: "";
		field("preview-body").innerHTML =
			'<div class="preview-sheet"><div class="preview-sheet__top"><div><strong>' +
			Portal.esc(doc.file_name || "Document") +
			'</strong><p class="small muted">' +
			Portal.esc(result.kind || "unknown") +
			" · " +
			Portal.esc(result.engine || "Tesseract") +
			(result.engine_version ? " " + Portal.esc(result.engine_version) : "") +
			'</p></div><span class="badge badge--info">' +
			(alreadyConfirmed ? "Confirmed" : "Review required") +
			"</span></div>" +
			'<p class="small muted">OCR suggestions can be wrong. Check every value before confirming. This record does not update your application; the original document is not sent to an LLM.</p>' +
			warningHtml +
			(keys.length ? '<div class="ocr-fields">' + fieldHtml + "</div>" : '<p class="small muted">No supported fields were recognised. Try a clearer scan or ask your advisor to review the file.</p>') +
			suggestionHtml +
			confirmHtml +
			(alreadyConfirmed ? '<p class="small muted">Your confirmed values are saved for review. They have not been copied into application fields.</p>' : "") +
			"</div>";
	}

	async function readDocument(doc) {
		if (!doc || !state.canEdit || state.extractingRow) return;
		var token = ++state.previewToken;
		state.previewRow = doc.row;
		state.extraction = null;
		state.extractingRow = doc.row;
		field("preview-heading").textContent = "Reading document";
		show(field("preview-card"));
		show(field("preview-close"));
		field("preview-body").setAttribute("aria-busy", "true");
		field("preview-body").innerHTML =
			'<div class="preview-sheet"><p class="small muted">Reading the attached document on this server. The original is not sent to an LLM.</p><div class="skeleton skeleton--block" aria-hidden="true"></div></div>';
		renderDocuments();

		try {
			var saved = await Portal.call("loan_advisory_portal.api.ocr.get_extraction", {
				application: state.application.name,
				row: doc.row,
			});
			if (state.previewToken !== token || state.previewRow !== doc.row) return;
			if (saved) {
				renderExtraction(
					doc,
					{
						kind: saved.kind || "unknown",
						engine: saved.engine,
						engine_version: saved.engine_version,
						fields: saved.extracted_values || {},
						warnings: [],
					},
					saved.confirmed_values || {},
					true
				);
				return;
			}
			var result = await Portal.call("loan_advisory_portal.api.ocr.extract", {
				application: state.application.name,
				row: doc.row,
			});
			if (state.previewToken === token && state.previewRow === doc.row) {
				renderExtraction(doc, result, {}, false);
			}
		} catch (error) {
			if (state.previewToken !== token || state.previewRow !== doc.row || isAuth(error)) return;
			field("preview-heading").textContent = "Document could not be read";
			field("preview-body").innerHTML =
				'<div class="alert alert--error" role="alert"><strong>Automatic reading did not complete</strong><span>' +
				Portal.esc(error.message || "Try a clearer file or ask your advisor to review it.") +
				"</span></div>";
		} finally {
			if (state.previewToken === token && state.previewRow === doc.row) {
				field("preview-body").removeAttribute("aria-busy");
			}
			if (state.extractingRow === doc.row) {
				state.extractingRow = null;
				renderDocuments();
			}
		}
	}

	async function confirmExtraction(button) {
		var extraction = state.extraction;
		if (!extraction || extraction.alreadyConfirmed || state.confirmingRow) return;
		var token = state.previewToken;
		var doc = state.documents.find(function (item) {
			return item.row === extraction.row;
		});
		if (!doc) return;

		var values = {};
		field("preview-body").querySelectorAll("[data-ocr-field]").forEach(function (input) {
			var value = input.value.trim();
			if (value) values[input.dataset.ocrField] = value;
		});
		if (!Object.keys(values).length) {
			Portal.flash("error", "No values to confirm", "Enter or correct at least one extracted value.");
			return;
		}

		state.confirmingRow = doc.row;
		Portal.busy(button, true, "Saving");
		try {
			var response = await Portal.call("loan_advisory_portal.api.ocr.confirm", {
				application: state.application.name,
				row: doc.row,
				values: values,
			});
			state.confirmedRows[doc.row] = true;
			if (state.previewToken === token && state.previewRow === doc.row) {
				renderExtraction(doc, extraction.result, response.confirmed_values || values, true);
			}
			Portal.flash("success", "Values saved for review", "They were not copied into your application.");
		} catch (error) {
			if (!isAuth(error)) {
				Portal.flash("error", "We could not confirm these values", error.message);
			}
		} finally {
			state.confirmingRow = null;
			renderDocuments();
		}
	}

	async function uploadFile(file) {
		if (!file || state.uploading || !state.application || !state.canEdit) return;
		var select = field("doc-type");
		if (!select.value) {
			showFieldError(select, "Choose the kind of document before you upload.");
			return;
		}
		clearFieldError(select);
		var extension = /\.([a-z0-9]+)$/i.exec(file.name || "");
		var suffix = extension ? extension[1].toLowerCase() : "";
		if (["pdf", "jpg", "jpeg", "png"].indexOf(suffix) === -1) {
			setStatus("Only PDF, JPEG or PNG files are accepted.", "error");
			return;
		}
		if (file.size > MAX_BYTES) {
			setStatus("Files must be 10 MB or smaller.", "error");
			return;
		}

		state.uploading = true;
		var input = field("doc-file");
		input.disabled = true;
		setStatus("Uploading " + file.name, "busy");
		try {
			var uploaded = await Portal.upload(file);
			setStatus("Attaching the file to the application", "busy");
			var response = await Portal.call("loan_advisory_portal.api.documents.attach_document", {
				application: state.application.name,
				document_type: select.value,
				file: uploaded.name,
			});
			state.documents = response.documents || [];
			select.value = "";
			renderDocuments();
			setStatus("Added " + (uploaded.file_name || file.name), "ok");
			Portal.flash("success", "Document added", "Add any other documents, then submit from the application page.");
			renderPreview(state.documents[state.documents.length - 1]);
			field("preview-card").scrollIntoView({
				behavior: reduceMotion ? "auto" : "smooth",
				block: "nearest",
			});
		} catch (error) {
			setStatus(error.message || "The upload did not complete.", "error");
			if (isAuth(error)) return;
		} finally {
			state.uploading = false;
			input.disabled = false;
			input.value = "";
		}
	}

	function askRemove(doc) {
		state.pendingRow = doc.row;
		field("remove-text").textContent =
			"The file " +
			(doc.file_name || "this document") +
			" will be deleted from this application. You can upload it again before you submit.";
		Portal.openDialog(field("remove-dialog"));
	}

	async function removeDocument() {
		var row = state.pendingRow;
		if (!row) return;
		var confirmButton = field("remove-confirm");
		Portal.busy(confirmButton, true, "Removing");
		try {
			var response = await Portal.call("loan_advisory_portal.api.documents.remove_document", {
				application: state.application.name,
				row: row,
			});
			state.documents = response.documents || [];
			delete state.confirmedRows[row];
			renderDocuments();
			if (state.previewRow === row) resetPreview();
			setStatus("Document removed", "ok");
			Portal.flash("success", "Document removed", "You can upload another copy before you submit.");
		} catch (error) {
			if (isAuth(error)) return;
			Portal.flash("error", "We could not remove this document", error.message);
		} finally {
			Portal.busy(confirmButton, false);
			state.pendingRow = null;
			Portal.closeDialog(field("remove-dialog"));
		}
	}

	function download(doc) {
		if (!state.application) return;
		var form = document.createElement("form");
		form.method = "POST";
		form.action = "/api/method/loan_advisory_portal.api.documents.download_document";
		form.target = "doc-download";
		form.hidden = true;
		[
			["csrf_token", Portal.boot.csrf_token || ""],
			["application", state.application.name],
			["row", doc.row],
		].forEach(function (pair) {
			var input = document.createElement("input");
			input.type = "hidden";
			input.name = pair[0];
			input.value = pair[1];
			form.appendChild(input);
		});
		document.body.appendChild(form);
		form.submit();
		form.remove();
	}

	async function showChooser() {
		hide(field("application-head"));
		hide(field("upload-card"));
		hide(field("list-card"));
		hide(field("preview-card"));
		hide(field("summary-card"));
		hide(field("handoff-card"));
		show(field("no-application"));
		field("no-app-title").textContent = "Choose an application";
		field("no-app-text").textContent =
			"Documents belong to a single application. Open one to add or review its documents.";
		var host = field("application-choices");
		try {
			var applications = await Portal.call("loan_advisory_portal.api.applications.list_applications");
			if (!applications || !applications.length) {
				field("no-app-title").textContent = "No applications yet";
				field("no-app-text").textContent =
					"Documents belong to an application. Start one and you will come back here to add documents.";
				host.innerHTML = '<a class="btn" href="/borrower/apply">Start an application</a>';
				return;
			}
			host.innerHTML = applications
				.map(function (app) {
					return (
						'<a class="btn btn--ghost btn--block" href="/borrower/documents?name=' +
						encodeURIComponent(app.name) +
						'">' +
						Portal.esc((app.purpose || "Loan application") + " · " + Portal.money(app.loan_amount)) +
						"</a>"
					);
				})
				.join("");
		} catch (error) {
			if (isAuth(error)) return;
			field("no-app-title").textContent = "We could not load your applications";
			field("no-app-text").textContent = error.message || "Try again in a moment.";
			host.innerHTML = '<button type="button" class="btn btn--quiet" id="retry-choices">Try again</button>';
			field("retry-choices").addEventListener("click", showChooser);
		}
	}

	async function loadApplication(name) {
		try {
			var results = await Promise.all([
				Portal.call("loan_advisory_portal.api.applications.get_application", { application: name }),
				Portal.call("loan_advisory_portal.api.documents.list_documents", { application: name }),
				Portal.call("loan_advisory_portal.api.documents.list_document_types"),
			]);
			state.application = results[0];
			state.documents = results[1] || [];
			state.types = results[2] || [];
			renderTypes();
			renderApplication();
			renderDocuments();
			show(field("list-card"));
			show(field("preview-card"));
			show(field("upload-card"));
			if (!state.canEdit) hide(field("upload-card"));
			resetPreview();
			setStatus("No file chosen", null);
		} catch (error) {
			if (isAuth(error)) return;
			var card = field("workspace-error");
			field("workspace-error-text").textContent =
				(error.message || "Try again in a moment.") + " Return to your applications if this keeps happening.";
			show(card);
			hide(field("application-head"));
			hide(field("upload-card"));
			hide(field("list-card"));
			hide(field("preview-card"));
		}
	}

	async function start() {
		try {
			var me = await Portal.call("loan_advisory_portal.api.session.me");
			var selected = config.application || (me && me.selected_application);
			if (!selected) {
				await showChooser();
				return;
			}
			await loadApplication(selected);
		} catch (error) {
			if (isAuth(error)) return;
			field("workspace-error-text").textContent = error.message || "Try again in a moment.";
			show(field("workspace-error"));
		}
	}

	var select = field("doc-type");
	select.addEventListener("change", function () {
		clearFieldError(select);
	});

	field("doc-file").addEventListener("change", function () {
		var file = this.files && this.files[0];
		if (file) uploadFile(file);
	});

	var dropzone = field("dropzone");
	["dragenter", "dragover"].forEach(function (name) {
		dropzone.addEventListener(name, function (event) {
			event.preventDefault();
			dropzone.classList.add("is-dragging");
		});
	});
	["dragleave", "drop"].forEach(function (name) {
		dropzone.addEventListener(name, function (event) {
			event.preventDefault();
			dropzone.classList.remove("is-dragging");
		});
	});
	dropzone.addEventListener("drop", function (event) {
		var file = event.dataTransfer && event.dataTransfer.files[0];
		if (file) uploadFile(file);
	});
	dropzone.addEventListener("keydown", function (event) {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			field("doc-file").click();
		}
	});

	field("upload-form").addEventListener("submit", function (event) {
		event.preventDefault();
	});

	field("doc-list").addEventListener("click", function (event) {
		var button = event.target.closest("button");
		if (!button) return;
		var index = Number(
			button.dataset.preview || button.dataset.download || button.dataset.remove || button.dataset.extract
		);
		var doc = state.documents[index];
		if (!doc) return;
		if (button.hasAttribute("data-preview")) renderPreview(doc);
		else if (button.hasAttribute("data-download")) download(doc);
		else if (button.hasAttribute("data-remove")) askRemove(doc);
		else if (button.hasAttribute("data-extract")) readDocument(doc);
	});

	field("preview-body").addEventListener("click", function (event) {
		var button = event.target.closest("[data-confirm-extraction]");
		if (button) confirmExtraction(button);
	});

	field("preview-close").addEventListener("click", resetPreview);

	field("remove-cancel").addEventListener("click", function () {
		state.pendingRow = null;
		Portal.closeDialog(field("remove-dialog"));
	});

	field("remove-confirm").addEventListener("click", removeDocument);

	start();
})();
