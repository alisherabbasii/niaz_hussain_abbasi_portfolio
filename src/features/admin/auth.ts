/**
 * Client-side-only gate for `/admin`. This is a static, frontend-only site —
 * there is no server to check a password against, so these credentials ship
 * inside the built JS bundle and are readable by anyone who opens devtools
 * or views the bundle source. This stops a casual visitor from wandering
 * onto the drafting tool; it is NOT real authentication and must never gate
 * anything actually sensitive. To change the credentials, edit the two
 * constants below and rebuild + redeploy — there's nothing to rotate on a
 * server.
 */
export const ADMIN_USERNAME = 'niaz-admin';
export const ADMIN_PASSWORD = '_RnBKXCmMD3r';

const STORAGE_KEY = 'blog-admin-unlocked';

export function checkCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function isUnlocked(): boolean {
  return localStorage.getItem(STORAGE_KEY) === '1';
}

export function unlock(): void {
  localStorage.setItem(STORAGE_KEY, '1');
}

export function lock(): void {
  localStorage.removeItem(STORAGE_KEY);
}
