// Saral Review (ADR-0008): Loan Officer actions on a MANUAL_REVIEW Loan Application in the Desk.
// Desk-only (hooks.doctype_js); the borrower portal never loads this file.
frappe.ui.form.on("Loan Application", {
	refresh(frm) {
		const officer = frappe.user.has_role("Loan Officer") || frappe.user.has_role("System Manager");
		if (!officer || frm.is_new()) return;
		if (frm.doc.custom_decision_snapshot) {
			frm.add_custom_button(__("Decision Snapshot"), () =>
				frappe.set_route("Form", "Decision Snapshot", frm.doc.custom_decision_snapshot), __("Review"));
			show_context(frm);
		}
		if (frm.doc.custom_lifecycle_state !== "MANUAL_REVIEW") return;
		const actions = [
			["approve", __("Approve")],
			["decline", __("Decline")],
			["request_info", __("Request info")],
		];
		for (const [method, label] of actions) {
			frm.add_custom_button(label, () => act(frm, method, label), __("Review"));
		}
	},
});

function act(frm, method, label) {
	frappe.prompt(
		[{ fieldname: "note", fieldtype: "Small Text", label: __("Note (internal, required)"), reqd: 1 }],
		(values) => {
			frappe.call({
				method: `loan_advisory_portal.api.review.${method}`,
				args: { application: frm.doc.name, note: values.note },
				freeze: true,
				callback: () => {
					frappe.show_alert({ message: __("{0} recorded", [label]), indicator: "green" });
					frm.reload_doc();
				},
			});
		},
		label,
		__("Record")
	);
}

function show_context(frm) {
	frappe.call({
		method: "loan_advisory_portal.api.review.get_review_context",
		args: { application: frm.doc.name },
		callback: ({ message }) => {
			if (!message || !message.snapshot) return;
			const rows = (message.rule_results || [])
				.map((r) => `<li><b>${frappe.utils.escape_html(r.rule_id)}</b> ${frappe.utils.escape_html(r.outcome)}: ${frappe.utils.escape_html(r.internal_message || "")}</li>`)
				.join("");
			frm.set_intro(
				`<b>${__("Outcome")}:</b> ${frappe.utils.escape_html(message.outcome || "")}<br>` +
				`<b>${__("Internal reasons")}:</b> ${frappe.utils.escape_html(message.internal_reasons || "")}` +
				(rows ? `<ul>${rows}</ul>` : ""),
				"blue"
			);
		},
	});
}
