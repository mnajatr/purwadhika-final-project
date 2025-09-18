"use client";

import Image from "next/image";
import React from "react";
import { useQuery } from "@tanstack/react-query";

interface Props {
  productId: number;
  alt: string;
}

export default function CartItemImage({ productId, alt }: Props) {
  // Get product details to get the correct image
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () =>
      import("@/services/products.service").then((s) =>
        s.productsService.getProducts()
      ),
  });

  // Find the product with matching ID
  const product = products?.find((p) => parseInt(p.id) === productId);
  const imageUrl =
    product?.imageUrl || `https://picsum.photos/seed/${productId}/200/200`;

  return (
    <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-xl flex-shrink-0 overflow-hidden relative shadow-sm">
      <Image
        src={imageUrl}
        alt={alt}
        fill
        sizes="(max-width: 640px) 64px, 80px"
        className="object-cover"
      />
    </div>
  );
}
