import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';

export function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 14 || password.length > 1024)
    throw new Error('Use uma senha entre 14 e 1024 caracteres.');
  const salt = randomBytes(32).toString('hex');
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

export function checkPassword(password, stored) {
  if (typeof password !== 'string' || password.length > 1024 || typeof stored !== 'string') return false;
  const parts = stored.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt' || !/^[a-f0-9]{64}$/.test(parts[1]) || !/^[a-f0-9]{128}$/.test(parts[2])) return false;
  return timingSafeEqual(scryptSync(password, parts[1], 64), Buffer.from(parts[2], 'hex'));
}

export function createSessionToken() { return randomBytes(32).toString('base64url'); }
export function hashSessionToken(token) { return createHash('sha256').update(token).digest('hex'); }
