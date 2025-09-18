import React from "react";

interface Props {
  children?: React.ReactNode;
}

export default function CategoryBadge({ children }: Props) {
  return (
    <div className="mb-2">
      <span className="inline-block bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
        {children ?? "Fruits & Vegetables"}
      </span>
    </div>
  );
}
