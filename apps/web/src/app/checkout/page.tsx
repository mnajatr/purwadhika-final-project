"use client";

import React from "react";
import { FaMapMarkerAlt, FaLock, FaCheckCircle } from "react-icons/fa";
import ApplyDiscount from "@/components/discount/ApplyDiscount";
import AddressCard from "@/components/checkout/AddressCard";
import ItemsList from "@/components/checkout/ItemsList";
import OrderSummary from "@/components/checkout/OrderSummary";
import OrderSuccessModal from "@/components/checkout/OrderSuccessModal";
import { CheckoutHeader } from "@/components/checkout/CheckoutHeader";
import { CheckoutProgress } from "@/components/checkout/CheckoutProgress";
import { CheckoutLoadingState } from "@/components/checkout/CheckoutLoadingState";
import { CheckoutEmptyState } from "@/components/checkout/CheckoutEmptyState";
import { ShippingMethodCard } from "@/components/checkout/ShippingMethodCard";
import { PaymentMethodCard } from "@/components/checkout/PaymentMethodCard";
import { SpecialInstructionsCard } from "@/components/checkout/SpecialInstructionsCard";
import { useCheckoutForm, getUserId } from "@/hooks/useCheckoutForm";

export default function CheckoutPage() {
  const userId = getUserId();

  const {
    cart,
    isCartLoading,
    customer,
    selectedAddressFull,
    items,
    initialStoreId,
    selectedAddress,
    shippingMethod,
    shippingOption,
    paymentMethod,
    appliedDiscounts,
    showSuccessModal,
    handleSelectAddress,
    handleUpdateCart,
    setShippingMethod,
    setShippingOption,
    setPaymentMethod,
    setAppliedDiscounts,
    handlePlaceOrder,
    handleSuccessModalComplete,
    isProcessing,
  } = useCheckoutForm(userId);

  if (isCartLoading) {
    return <CheckoutLoadingState />;
  }

  if (!cart || cart.items.length === 0) {
    return <CheckoutEmptyState />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <CheckoutHeader
          selectedAddress={!!selectedAddress}
          shippingMethod={!!shippingMethod}
          paymentMethod={!!paymentMethod}
        />

        <CheckoutProgress
          selectedAddress={!!selectedAddress}
          shippingMethod={!!shippingMethod}
          paymentMethod={!!paymentMethod}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="flex gap-4">
              <div className="flex-1 space-y-8 relative">
                {/* Vertical progress track (visible on large screens) */}
                <div
                  aria-hidden
                  className="hidden lg:block absolute left-7 top-0 bottom-0 w-[2px] bg-border/60"
                />

                {/* Delivery Address */}
                <div
                  className={`flex items-center gap-6 transition-all duration-300 rounded-xl ${
                    !selectedAddress ? "bg-red-50/50 dark:bg-red-900/10" : ""
                  }`}
                  data-field="address"
                >
                  <div className="hidden lg:flex flex-col items-center w-14">
                    <div
                      className={`z-10 flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all duration-300 ${
                        selectedAddress
                          ? "bg-primary text-white shadow-lg scale-110"
                          : "bg-card border-2 border-red-300 hover:border-primary/50 text-red-500"
                      }`}
                    >
                      {selectedAddress ? (
                        <FaCheckCircle className="w-5 h-5" />
                      ) : (
                        <FaMapMarkerAlt className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <AddressCard
                      onSelect={handleSelectAddress}
                      checkoutStoreId={initialStoreId}
                      userId={userId}
                    />
                  </div>
                </div>

                {/* Order Items */}
                <div className="flex items-center gap-6">
                  <div className="hidden lg:flex flex-col items-center w-14">
                    <div className="z-10 w-10 h-10" />
                  </div>
                  <div className="flex-1">
                    <ItemsList cart={cart} selectedIds={null} userId={userId} />
                  </div>
                </div>

                {/* Shipping Method */}
                <ShippingMethodCard
                  shippingMethod={shippingMethod}
                  shippingOption={shippingOption}
                  selectedAddress={!!selectedAddress}
                  onShippingMethodChange={setShippingMethod}
                  onShippingOptionChange={setShippingOption}
                />

                {/* Payment Method */}
                <PaymentMethodCard
                  paymentMethod={paymentMethod}
                  shippingMethod={!!shippingMethod}
                  onPaymentMethodChange={setPaymentMethod}
                />

                {/* Additional Options */}
                <div className="flex items-center gap-6">
                  <div className="hidden lg:flex flex-col items-center w-14">
                    <div className="z-10 w-10 h-10" />
                  </div>
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ApplyDiscount
                        cart={cart}
                        handleUpdateCart={handleUpdateCart}
                        onApplyDiscount={setAppliedDiscounts}
                        isLoading={isCartLoading}
                      />
                      <SpecialInstructionsCard />
                    </div>
                  </div>
                </div>

                {/* Review bullet (bottom) */}
                <div className="flex items-center gap-6 mt-6">
                  <div className="hidden lg:flex flex-col items-center w-14">
                    <div
                      className={`z-10 flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all duration-300 ${
                        selectedAddress && shippingMethod && paymentMethod
                          ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg animate-pulse"
                          : "bg-muted border-2 border-border"
                      }`}
                    >
                      <FaLock className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-medium mt-2 text-muted-foreground">
                      Order
                    </div>
                  </div>
                  <div className="flex-1" />
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <OrderSummary
                cart={cart}
                items={items}
                appliedDiscounts={appliedDiscounts}
                onPlaceOrder={handlePlaceOrder}
                isProcessing={isProcessing}
                customer={customer ?? undefined}
                address={selectedAddressFull ?? undefined}
                shippingMethod={shippingMethod}
                shippingOption={shippingOption}
              />
            </div>
          </div>
        </div>
      </div>

      <OrderSuccessModal
        isVisible={showSuccessModal}
        onComplete={handleSuccessModalComplete}
      />
    </div>
  );
}
