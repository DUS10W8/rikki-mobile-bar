type SubmissionError = { message?: string };

/** Acceptance by Formspree is a lead; clicking Send is only an attempt. */
export async function postInquiry(
  formId: string,
  body: FormData,
  request: typeof fetch = fetch,
): Promise<{ ok: boolean; errors: SubmissionError[] }> {
  const response = await request(`https://formspree.io/f/${formId}`, {
    method: "POST", body, headers: { Accept: "application/json" },
  });
  // A successful HTTP response remains accepted even if the optional JSON is empty.
  if (response.ok) return { ok: true, errors: [] };
  const data = await response.json().catch(() => null);
  const errors = Array.isArray(data?.errors) ? data.errors : [];
  return {
    ok: false,
    errors: errors.length ? errors : [{ message: "Your request could not be sent. Please try again." }],
  };
}
