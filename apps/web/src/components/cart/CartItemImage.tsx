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
  const { data: productsData } = useQuery({
    queryKey: ["products"],
    queryFn: () =>
      import("@/services/products.service").then((s) =>
        s.productsService.getProducts()
      ),
  });

  // Find the product with matching ID
  const product = productsData?.products?.find(
    (p) => parseInt(p.id) === productId
  );
  const imageUrl =
    product?.imageUrl || `https://picsum.photos/seed/${productId}/200/200`;

  return (
    <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-xl flex-shrink-0 overflow-hidden relative shadow-sm">
      <Image
        src={imageUrl}
        alt={alt}
        fill
        sizes="(max-width: 640px) 80px, 96px"
        className="object-cover"
      />
    </div>
  );
}
