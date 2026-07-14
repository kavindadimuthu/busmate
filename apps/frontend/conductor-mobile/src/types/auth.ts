export interface User {
  id: string;
  name: string;
  email: string;
  role: 'conductor';
  busId?: string;
  route?: string;
  contactNumber?: string;
  fullName?: string;
  username?: string;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: string;
}
