// Types for profile completion flow
export interface ProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  childFirstName?: string;
  childLastName?: string;
  instruments?: string[];
  profileImage?: File | null; // New file being uploaded
  profileImageUrl?: string; // Existing image URL (e.g., from Google OAuth)
  location?: string;
  bio?: string;
}

export const ALL_STEPS = [
  "nameEmail",
  "childName",
  "instruments",
  "pfp",
  "location",
  "bio",
] as const;

export type StepType = (typeof ALL_STEPS)[number];

// Props for step components
export interface StepComponentProps {
  data: ProfileData;
  onUpdate: (data: Partial<ProfileData>) => void;
  onNext: () => void;
  onPrev?: () => void;
  onSkip?: () => void;
  accountType?: string;
  isLastStep?: boolean;
}
