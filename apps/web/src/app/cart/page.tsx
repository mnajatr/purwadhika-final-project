"use client";

import { CartPage } from "@/components/cart/CartPage";

// TODO: Change user Id if userId from authcontext is available
const userId = 4;

export default function Cart() {
  return <CartPage userId={userId} />;
}
