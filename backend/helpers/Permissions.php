<?php

declare(strict_types=1);

/**
 * Centralized authorization rules for the admin roles ('super_admin',
 * 'admin', 'editor'). Every access decision for the user-management module
 * goes through here rather than scattering role string comparisons across
 * endpoints, so the rules only exist in one place.
 *
 * Current architecture decision: user management (create/edit/deactivate/
 * reset password/delete other admins) is super_admin-only. 'admin' and
 * 'editor' can never reach backend/api/users/** or backend/api/profile/**
 * on someone else's behalf, regardless of what the frontend shows. This is
 * intentionally the simplest safe rule the task's "admin ... user-management
 * access only if explicitly allowed by the architecture" leaves room for; if
 * that's ever loosened, admin_can_manage_users() is the one place to change.
 */

const ADMIN_ROLES = ['super_admin', 'admin', 'editor'];

/** True if $role is one of the allowed admin roles. */
function permission_role_is_valid(string $role): bool
{
    return in_array($role, ADMIN_ROLES, true);
}

/** True if the given (already-authenticated) admin record is a super_admin. */
function permission_is_super_admin(array $admin): bool
{
    return ($admin['role'] ?? null) === 'super_admin';
}

/** True if $admin is allowed to reach the user-management API at all. */
function permission_can_manage_users(array $admin): bool
{
    return permission_is_super_admin($admin);
}

/**
 * Middleware for backend/api/users/**: call after auth_require_admin().
 * Sends 403 and terminates the request if the caller can't manage users.
 */
function permission_require_manage_users(array $admin): void
{
    if (!permission_can_manage_users($admin)) {
        json_response(403, ['error' => 'You do not have permission to manage admin users.']);
    }
}

/**
 * True if $actor is allowed to act on $target (create/edit/delete) given
 * $target's *current* role — specifically: only a super_admin may touch a
 * super_admin account (rule: non-super-admins cannot edit/delete a
 * super_admin, and cannot promote anyone to super_admin either — the latter
 * is checked separately in permission_require_role_assignable() since it
 * depends on the *requested* role, not an existing target's role).
 */
function permission_can_act_on_target(array $actor, array $target): bool
{
    if (permission_is_super_admin($actor)) {
        return true;
    }

    return ($target['role'] ?? null) !== 'super_admin';
}

/** Middleware: 403s if $actor isn't allowed to modify/delete $target. */
function permission_require_can_act_on_target(array $actor, array $target): void
{
    if (!permission_can_act_on_target($actor, $target)) {
        json_response(403, ['error' => 'Only a super admin can modify or delete another super admin.']);
    }
}

/**
 * Middleware: 403s if $actor (not already a super_admin) is trying to
 * assign/keep the 'super_admin' role on a create or update.
 */
function permission_require_role_assignable(array $actor, string $requestedRole): void
{
    if ($requestedRole === 'super_admin' && !permission_is_super_admin($actor)) {
        json_response(403, ['error' => 'Only a super admin can grant the super admin role.']);
    }
}

/**
 * Blog CRUD role rule: 'super_admin' and 'admin' may act on any post.
 * 'editor' may only act on posts they authored themselves. $postAuthorId is
 * blog_posts.author_id for the post being acted on.
 */
function permission_can_manage_post(array $actor, int $postAuthorId): bool
{
    if (($actor['role'] ?? null) === 'editor') {
        return (int) $actor['id'] === $postAuthorId;
    }

    return true;
}

/** Middleware: 403s if $actor isn't allowed to update/delete the post authored by $postAuthorId. */
function permission_require_can_manage_post(array $actor, int $postAuthorId): void
{
    if (!permission_can_manage_post($actor, $postAuthorId)) {
        json_response(403, ['error' => 'Editors may only modify or delete posts they authored.']);
    }
}
