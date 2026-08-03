/**
 * Single source of truth for role-based UI decisions — hide/disable actions
 * a role can't perform, but never treat any of this as the real gate: the
 * backend (`backend/helpers/Permissions.php`) re-checks everything and is
 * what actually enforces it. Mirrors the backend's one rule: user management
 * is super_admin-only.
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EDITOR: 'editor',
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.EDITOR]: 'Editor',
};

export function isSuperAdmin(admin) {
  return admin?.role === ROLES.SUPER_ADMIN;
}

/** Can this admin reach the user-management screens at all? */
export function canManageUsers(admin) {
  return isSuperAdmin(admin);
}

/** Can $admin (the viewer) edit or delete $target (another admin record)? */
export function canActOnTarget(admin, target) {
  if (isSuperAdmin(admin)) return true;
  return target?.role !== ROLES.SUPER_ADMIN;
}

export function canAssignRole(admin, role) {
  if (role === ROLES.SUPER_ADMIN) return isSuperAdmin(admin);
  return true;
}
