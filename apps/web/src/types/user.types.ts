export type UserResponse = {
  id: number;
  email: string;
  role: "USER" | "SUPER_ADMIN" | "STORE_ADMIN";
  referralCode?: string | null;
  createdAt: string;
  updatedAt: string;
  profile?: {
    id: number;
    userId: number;
    fullName: string;
    updatedAt: string;
  } | null;
};

export type CreateUserInput = {
  email: string;
  password: string;
  role?: "USER" | "SUPER_ADMIN" | "STORE_ADMIN";
  profile?: {
    fullName: string;
  };
};

export type UpdateUserInput = {
  id: number;
  email?: string;
  password?: string;
  role?: "USER" | "SUPER_ADMIN" | "STORE_ADMIN";
  profile?: {
    fullName?: string;
  };
};
