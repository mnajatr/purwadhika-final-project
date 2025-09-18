export type UserAddressResponse = {
  id: number;
  userId: number;
  recipientName: string;
  addressLine: string;
  province: string;
  city: string;
  postalCode: string;
  latitude?: number | null;
  longitude?: number | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};
