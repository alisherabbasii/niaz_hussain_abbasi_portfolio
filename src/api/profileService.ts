import { apiClient } from './client';
import type { Admin } from './types';

interface AdminEnvelope {
  admin: Admin;
}

/** PUT /api/profile/update.php — updates the current admin's own name/email. Never touches role. */
export async function updateProfile(fullName: string, email: string): Promise<Admin> {
  const { data } = await apiClient.put<AdminEnvelope>('/profile/update.php', {
    full_name: fullName,
    email,
  });
  return data.admin;
}

/** POST /api/profile/change_password.php — requires the current password. */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
  newPasswordConfirmation: string,
): Promise<void> {
  await apiClient.post('/profile/change_password.php', {
    current_password: currentPassword,
    new_password: newPassword,
    new_password_confirmation: newPasswordConfirmation,
  });
}
