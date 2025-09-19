export type UserResponse = {
  id: number;
  email: string;
  isVerified: boolean;
  role: "USER" | "SUPER_ADMIN" | "STORE_ADMIN";
  referralCode?: string | null;
  createdAt: string;
  updatedAt: string;
  profile?: {
    id: number;
    userId: number;
    fullName: string;
    avatarUrl?: string | null;
    updatedAt: string;
  } | null;
};
