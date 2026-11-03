// node --test tests/js/portal_doc_labels.test.cjs
// E2E D-03 (2026-11-04): the borrower document picker showed raw codes such as PAYSLIP_1.
const test = require("node:test");
const assert = require("node:assert/strict");
const S = require("../../apps/loan_advisory_portal/loan_advisory_portal/public/js/status.js");

test("document type codes read as plain labels", () => {
	assert.equal(S.docLabel("PAYSLIP_1"), "Payslip 1");
	assert.equal(S.docLabel("BANK_STATEMENT"), "Bank statement");
	assert.equal(S.docLabel("PAN"), "PAN card");
	assert.equal(S.docLabel("AADHAAR_LAST4"), "Aadhaar card");
	assert.equal(S.docLabel("ADDRESS_PROOF"), "Address proof");
	assert.equal(S.docLabel("Salary slip"), "Salary slip"); // already plain
});
