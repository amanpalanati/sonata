export interface SignUpFormData {
  accountType: "student" | "teacher" | "parent";
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface ForgotPasswordFormData {
  newPassword: string;
  confirmNewPassword: string;
}

export interface ForgotPasswordEmailData {
  email: string;
}

export interface AccountInfoFormData {
  firstName: string;
  lastName: string;
  email: string;
  childFirstName?: string;
  childLastName?: string;
  bio?: string;
}

export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
