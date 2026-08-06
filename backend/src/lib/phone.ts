const MN_MOBILE_RE = /^[5-9]\d{7}$/;

export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[^\d]/g, "");
  const local = digits.startsWith("976") && digits.length === 11 ? digits.slice(3) : digits;
  if (!MN_MOBILE_RE.test(local)) return null;
  return `976${local}`;
}
