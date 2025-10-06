"use client";

import { UseFormRegister, FieldErrors } from "react-hook-form";
import { Store } from "@/services/inventory.service";

interface TransferFormData {
  fromStoreId: string;
  toStoreId: string;
  note: string;
}

interface TransferFormFieldsProps {
  register: UseFormRegister<TransferFormData>;
  errors: FieldErrors<TransferFormData>;
  stores: Store[];
  fromStoreId: string;
  onFromStoreChange: (value: string) => void;
}

export function TransferFormFields({
  register,
  errors,
  stores,
  fromStoreId,
  onFromStoreChange,
}: TransferFormFieldsProps) {
  return (
    <>
      {/* Store Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* From Store */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            From Store <span className="text-destructive">*</span>
          </label>
          <select
            {...register("fromStoreId")}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary transition-colors bg-background ${
              errors.fromStoreId
                ? "border-destructive focus:ring-destructive"
                : "border-border"
            }`}
            onChange={(e) => onFromStoreChange(e.target.value)}
          >
            <option value="">Select source store</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id.toString()}>
                {store.name} - {store.city}
              </option>
            ))}
          </select>
          {errors.fromStoreId && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <span>⚠</span>
              {errors.fromStoreId.message}
            </p>
          )}
        </div>

        {/* To Store */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            To Store <span className="text-destructive">*</span>
          </label>
          <select
            {...register("toStoreId")}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary transition-colors bg-background ${
              errors.toStoreId
                ? "border-destructive focus:ring-destructive"
                : "border-border"
            }`}
          >
            <option value="">Select destination store</option>
            {stores
              .filter((store) => store.id.toString() !== fromStoreId)
              .map((store) => (
                <option key={store.id} value={store.id.toString()}>
                  {store.name} - {store.city}
                </option>
              ))}
          </select>
          {errors.toStoreId && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <span>⚠</span>
              {errors.toStoreId.message}
            </p>
          )}
        </div>
      </div>

      {/* Transfer Note */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          Transfer Note / Reason <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          {...register("note")}
          placeholder="e.g., REPLENISH, REBALANCE, STORE_OPENING"
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary transition-colors bg-background ${
            errors.note
              ? "border-destructive focus:ring-destructive"
              : "border-border"
          }`}
        />
        {errors.note && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <span>⚠</span>
            {errors.note.message}
          </p>
        )}
      </div>
    </>
  );
}
