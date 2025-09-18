"use client";

import { CartPage } from "@/components/cart/CartPage";
import { useEffect, useState } from "react";

export default function Cart() {
  const [userId, setUserId] = useState<number>(1);

  useEffect(() => {
    const devUserId = localStorage.getItem("devUserId");
    if (devUserId && devUserId !== "none") {
      setUserId(parseInt(devUserId));
    } else {
      setUserId(4); // Default user for demo
    }
  }, []);

  return <CartPage userId={userId} />;
}
