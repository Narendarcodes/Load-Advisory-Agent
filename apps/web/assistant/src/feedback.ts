/**
 * Thumbs on an answer go to the portal's existing feedback store (Borrower Feedback, category
 * "Assistant"), the same one the Help & Feedback page writes. Only the rating, a fixed sentence and
 * the application travel; the answer text is not copied.
 */
export async function sendAnswerFeedback(csrfToken: string, application: string, helpful: boolean): Promise<void> {
  const response = await fetch("/api/method/loan_advisory_portal.api.feedback.submit_feedback", {
    method: "POST",
    credentials: "same-origin",
    headers: { accept: "application/json", "content-type": "application/json", "x-frappe-csrf-token": csrfToken },
    body: JSON.stringify({
      rating: helpful ? 5 : 1,
      category: "assistant",
      application,
      message: helpful ? "Assistant answer marked helpful." : "Assistant answer marked not helpful.",
    }),
  });
  if (response.redirected || !response.ok) throw new Error(`feedback failed (${response.status})`);
}
