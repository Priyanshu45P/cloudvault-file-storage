import { apiClient } from './client';
import { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/auth';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const authApi = {
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const res = await apiClient.post<ApiEnvelope<AuthResponse>>('/auth/register', payload);
    return res.data.data;
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await apiClient.post<ApiEnvelope<AuthResponse>>('/auth/login', payload);
    return res.data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  me: async (): Promise<User> => {
    const res = await apiClient.get<ApiEnvelope<{ user: User }>>('/auth/me');
    return res.data.data.user;
  },

  refresh: async (): Promise<AuthResponse> => {
    const res = await apiClient.post<ApiEnvelope<AuthResponse>>('/auth/refresh');
    return res.data.data;
  },
};
