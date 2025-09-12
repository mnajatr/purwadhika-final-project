"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useConfirmOrder } from "@/hooks/useOrder";

export default function ConfirmButton({
  orderId,
  userId,
}: {
  orderId: number;
  userId?: number;
}) {
  const confirm = useConfirmOrder();
  const [loading, setLoading] = React.useState(false);
  const [errMsg, setErrMsg] = React.useState<string | null>(null);

  const handle = async () => {
    setErrMsg(null);
    setLoading(true);
    try {
      await confirm.mutateAsync({ orderId, userId });
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={handle} disabled={loading}>
        {loading ? "Confirming..." : "Confirm Receipt"}
      </Button>
      {errMsg && <div className="text-sm text-red-600 mt-2">{errMsg}</div>}
    </div>
  );
}
