import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, hash: string) {
  const attempted = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);
  const stored = Buffer.from(hash, 'hex');

  if (attempted.length !== stored.length) return false;
  return timingSafeEqual(attempted, stored);
}
