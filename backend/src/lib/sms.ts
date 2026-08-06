// No SMS gateway is wired up yet. Swap this implementation once a provider
// (Mongolian aggregator, Twilio, etc.) is chosen — the rest of the phone-auth
// flow only depends on this function's signature.
export async function sendSms(phone: string, message: string): Promise<void> {
  console.log(`[sms:dev] to=${phone} message="${message}"`);
}
