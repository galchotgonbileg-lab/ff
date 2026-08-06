// No email provider is wired up yet. Swap this implementation once one
// (SES, SendGrid, SMTP, etc.) is chosen — the rest of the password-reset
// flow only depends on this function's signature.
export async function sendEmail(to: string, subject: string, message: string): Promise<void> {
  console.log(`[email:dev] to=${to} subject="${subject}" message="${message}"`);
}
