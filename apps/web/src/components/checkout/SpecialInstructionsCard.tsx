"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MessageSquare } from "lucide-react";
import { MdMessage } from "react-icons/md";
import { FaComments } from "react-icons/fa";

export function SpecialInstructionsCard() {
  return (
    <Card className="bg-card rounded-2xl border border-border shadow-sm backdrop-blur-sm overflow-hidden">
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shadow-md">
            <MdMessage className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-foreground">
              Special Instructions
            </div>
            <div className="text-sm font-normal text-muted-foreground">
              Additional delivery notes
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <div className="px-4">
        <div
          aria-hidden
          className="w-full rounded-full h-1"
          style={{
            background:
              "linear-gradient(90deg, rgb(223, 239, 181), rgb(247, 237, 184), rgb(253, 231, 188))",
          }}
        />
      </div>

      <CardContent className="p-6">
        <div className="space-y-3">
          <Label
            htmlFor="instructions"
            className="text-sm font-medium text-foreground"
          >
            Delivery notes (optional)
          </Label>
          <div className="relative">
            <textarea
              id="instructions"
              placeholder="Leave at front door, call when arriving, fragile items..."
              className="w-full px-4 py-3 pl-10 border-2 border-border rounded-xl bg-background text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50 transition-colors"
            />
            <FaComments className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            Help us deliver your order perfectly
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
