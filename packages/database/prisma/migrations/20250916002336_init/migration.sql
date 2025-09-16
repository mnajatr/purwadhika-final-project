-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'SUPER_ADMIN', 'STORE_ADMIN');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAYMENT_REVIEW', 'PROCESSING', 'SHIPPED', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('MANUAL_TRANSFER', 'GATEWAY');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."DiscountType" AS ENUM ('PERCENTAGE', 'NOMINAL');

-- CreateEnum
CREATE TYPE "public"."ValueType" AS ENUM ('PRODUCT_DISCOUNT', 'BUY1GET1');

-- CreateEnum
CREATE TYPE "public"."StockChangeReason" AS ENUM ('ADD', 'REMOVE', 'RESERVE', 'RELEASE', 'TRANSFER_IN', 'TRANSFER_OUT');

-- CreateEnum
CREATE TYPE "public"."TokenType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "public"."Provider" AS ENUM ('GITHUB', 'GOOGLE');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "referralCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserProfile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "fullName" TEXT,
    "avatarUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SocialAccount" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "provider" "public"."Provider" NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Token" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "type" "public"."TokenType" NOT NULL,
    "expiredAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserAddress" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "label" TEXT,
    "recipientName" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "postalCode" TEXT NOT NULL,
    "latitude" DECIMAL(65,30) NOT NULL,
    "longitude" DECIMAL(65,30) NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Store" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StoreLocation" (
    "id" SERIAL NOT NULL,
    "storeId" INTEGER NOT NULL,
    "addressLine" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "postalCode" TEXT NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StoreAdminAssignment" (
    "id" SERIAL NOT NULL,
    "storeId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreAdminAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "weight" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "length" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductImage" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StoreInventory" (
    "id" SERIAL NOT NULL,
    "storeId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "stockQty" INTEGER NOT NULL,
    "reservedStock" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StockJournal" (
    "id" SERIAL NOT NULL,
    "storeId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "qtyChange" INTEGER NOT NULL,
    "reason" "public"."StockChangeReason" NOT NULL,
    "adminId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockJournal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Discount" (
    "id" SERIAL NOT NULL,
    "storeId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "value" "public"."ValueType" NOT NULL,
    "type" "public"."DiscountType" NOT NULL,
    "minPurchase" INTEGER,
    "maxDiscount" INTEGER,
    "expiredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Voucher" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "discountId" INTEGER NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Cart" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "storeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CartItem" (
    "id" SERIAL NOT NULL,
    "cartId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Order" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "storeId" INTEGER NOT NULL,
    "addressId" INTEGER NOT NULL,
    "status" "public"."OrderStatus" NOT NULL,
    "paymentMethod" "public"."PaymentMethod" NOT NULL,
    "subtotalAmount" INTEGER NOT NULL,
    "shippingCost" INTEGER NOT NULL,
    "discountTotal" INTEGER NOT NULL,
    "grandTotal" INTEGER NOT NULL,
    "totalItems" INTEGER NOT NULL,
    "paymentDeadlineAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderItem" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "productSnapshot" TEXT NOT NULL,
    "unitPriceSnapshot" DECIMAL(65,30) NOT NULL,
    "qty" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "reviewedByAdminId" INTEGER,
    "status" "public"."PaymentStatus" NOT NULL,
    "amount" INTEGER NOT NULL,
    "gatewayTransactionId" TEXT,
    "proofImageUrl" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShippingMethod" (
    "id" SERIAL NOT NULL,
    "carrier" TEXT NOT NULL,
    "serviceCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ShippingMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Shipment" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "methodId" INTEGER NOT NULL,
    "trackingNumber" TEXT,
    "cost" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "public"."User"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "public"."UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_provider_providerUserId_key" ON "public"."SocialAccount"("provider", "providerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Token_tokenHash_key" ON "public"."Token"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "public"."Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_name_key" ON "public"."ProductCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StoreInventory_storeId_productId_key" ON "public"."StoreInventory"("storeId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_userId_storeId_key" ON "public"."Cart"("userId", "storeId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_key" ON "public"."CartItem"("cartId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderId_key" ON "public"."Payment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_orderId_key" ON "public"."Shipment"("orderId");

-- AddForeignKey
ALTER TABLE "public"."UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SocialAccount" ADD CONSTRAINT "SocialAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Token" ADD CONSTRAINT "Token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserAddress" ADD CONSTRAINT "UserAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StoreLocation" ADD CONSTRAINT "StoreLocation_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StoreAdminAssignment" ADD CONSTRAINT "StoreAdminAssignment_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StoreAdminAssignment" ADD CONSTRAINT "StoreAdminAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."ProductCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StoreInventory" ADD CONSTRAINT "StoreInventory_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StoreInventory" ADD CONSTRAINT "StoreInventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockJournal" ADD CONSTRAINT "StockJournal_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockJournal" ADD CONSTRAINT "StockJournal_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockJournal" ADD CONSTRAINT "StockJournal_storeId_productId_fkey" FOREIGN KEY ("storeId", "productId") REFERENCES "public"."StoreInventory"("storeId", "productId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockJournal" ADD CONSTRAINT "StockJournal_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Discount" ADD CONSTRAINT "Discount_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Discount" ADD CONSTRAINT "Discount_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Voucher" ADD CONSTRAINT "Voucher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Voucher" ADD CONSTRAINT "Voucher_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "public"."Discount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cart" ADD CONSTRAINT "Cart_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "public"."Cart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "public"."UserAddress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Shipment" ADD CONSTRAINT "Shipment_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "public"."ShippingMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
