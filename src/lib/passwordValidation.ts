export const STRONG_PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export function getPasswordErrors(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Mínimo de 8 caracteres');
  if (!/[A-Z]/.test(password)) errors.push('Pelo menos uma letra maiúscula');
  if (!/\d/.test(password)) errors.push('Pelo menos um número');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('Pelo menos um caractere especial');
  return errors;
}

export function isPasswordStrong(password: string): boolean {
  return STRONG_PASSWORD_REGEX.test(password);
}
