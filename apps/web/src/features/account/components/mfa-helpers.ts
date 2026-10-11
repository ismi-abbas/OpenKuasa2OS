// Pure pieces of the two-factor card.

/** The six digits an authenticator app shows; spaces from pasting are dropped. */
export const cleanTotp = (value: string) => value.replace(/\s/g, '');

/** Splits the setup key into groups of four so it is easier to type. */
export function formatSecret(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(' ') ?? secret;
}

/** The base32 secret inside a better-auth `otpauth://totp/...?secret=...` URI. */
export function secretFromUri(uri: string): string {
  try {
    return new URL(uri).searchParams.get('secret') ?? '';
  } catch {
    return '';
  }
}

/** Contents of the downloaded recovery-codes text file. */
export function recoveryCodesFileText(codes: string[]): string {
  return [
    'OpenKuasa OS recovery codes',
    '',
    'Each code works once. If you lose your phone, a recovery code signs you',
    'in. Keep them somewhere safe.',
    '',
    ...codes,
    '',
  ].join('\n');
}
