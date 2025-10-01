"use client";

import Image from "next/image";
import React from "react";

interface Props {
  imageUrl?: string;
  productId: number;
  alt: string;
}

export default function CartItemImage({ imageUrl, productId, alt }: Props) {
  // Use provided imageUrl or fallback to placeholder
  const imgSrc = imageUrl || `https://picsum.photos/seed/${productId}/200/200`;

  return (
    <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-xl flex-shrink-0 overflow-hidden relative shadow-sm">
      <Image
        src={imgSrc}
        alt={alt}
        fill
        sizes="(max-width: 640px) 80px, 96px"
        className="object-cover"
      />
    </div>
  );
}
