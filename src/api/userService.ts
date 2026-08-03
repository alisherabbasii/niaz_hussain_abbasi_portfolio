import { apiClient } from './client';
import type {
  AdminUser,
  CreateAdminUserInput,
  ListAdminUsersParams,
  ListAdminUsersResult,
  UpdateAdminUserInput,
} from './types';

interface AdminUserEnvelope {
  data: AdminUser;
}

/** GET /api/users/index.php — paginated list. Requires an authenticated super_admin session. */
export async function listUsers(params: ListAdminUsersParams = {}): Promise<ListAdminUsersResult> {
  const { data } = await apiClient.get<ListAdminUsersResult>('/users/index.php', { params });
  return data;
}

/** GET /api/users/show.php?id=… */
export async function getUserById(id: number): Promise<AdminUser> {
  const { data } = await apiClient.get<AdminUserEnvelope>('/users/show.php', { params: { id } });
  return data.data;
}

/** POST /api/users/create.php */
export async function createUser(input: CreateAdminUserInput): Promise<AdminUser> {
  const { data } = await apiClient.post<AdminUserEnvelope>('/users/create.php', input);
  return data.data;
}

/** PUT /api/users/update.php?id=… — omitted fields are left unchanged; also used for activate/deactivate via `is_active`. */
export async function updateUser(id: number, input: UpdateAdminUserInput): Promise<AdminUser> {
  const { data } = await apiClient.put<AdminUserEnvelope>('/users/update.php', input, { params: { id } });
  return data.data;
}

/** POST /api/users/reset_password.php?id=… — admin-initiated reset of *another* user's password. */
export async function resetUserPassword(id: number, password: string, passwordConfirmation: string): Promise<void> {
  await apiClient.post('/users/reset_password.php', {
    password,
    password_confirmation: passwordConfirmation,
  }, { params: { id } });
}

/** DELETE /api/users/delete.php?id=…&confirm=true */
export async function deleteUser(id: number): Promise<number> {
  const { data } = await apiClient.delete<{ data: { id: number } }>('/users/delete.php', {
    params: { id, confirm: true },
  });
  return data.data.id;
}
