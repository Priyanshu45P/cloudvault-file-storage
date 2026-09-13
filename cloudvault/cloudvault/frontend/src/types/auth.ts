export interface User {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  storageUsed: string; // BigInt serialized as string by the API
  storageLimit: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
