"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="flex h-screen flex-col items-center justify-center text-center p-4">
      <h1 className="text-3xl font-bold text-red-600">Unauthorized</h1>
      <p className="mt-2 text-gray-600">
        You don’t have permission to access this page.
      </p>
      <Button className="mt-4" onClick={() => router.push("/")}>
        Go Back Home
      </Button>
    </div>
  );
}
