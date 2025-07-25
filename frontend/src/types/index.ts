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
