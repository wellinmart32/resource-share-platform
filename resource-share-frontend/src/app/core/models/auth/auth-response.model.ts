import { UserRole } from '../../enums/user-role.enum';

export interface AuthResponse {
  token: string;
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  message?: string;
}
