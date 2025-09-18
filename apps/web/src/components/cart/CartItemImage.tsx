"use client";

import Image from "next/image";
import React from "react";

interface Props {
  productId: number;
  alt: string;
}

export default function CartItemImage({ productId, alt }: Props) {
  return (
    <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-xl flex-shrink-0 overflow-hidden relative shadow-sm">
      <Image
        src={`https://picsum.photos/seed/${productId}/200/200`}
        alt={alt}
        fill
        sizes="(max-width: 640px) 64px, 80px"
        className="object-cover"
      />
    </div>
  );
}
