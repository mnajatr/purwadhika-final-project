export class CartBusiness {
  static findExistingCartItem(cartItems: any[], productId: number) {
    return cartItems.find((item: any) => item.productId === productId);
  }

  static calculateCartTotals(cartItems: any[]) {
    const totalItems = cartItems.length;
    const totalQuantity = cartItems.reduce(
      (sum: number, item: any) => sum + item.qty,
      0
    );
    const subtotal = cartItems.reduce(
      (sum: number, item: any) =>
        sum + Number(item.unitPriceSnapshot) * item.qty,
      0
    );

    return { totalItems, totalQuantity, subtotal };
  }

  static mapCartItemsForTotals(cartItems: any[]) {
    return cartItems.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      quantity: item.qty,
      unitPrice: Number(item.unitPriceSnapshot),
      total: Number(item.unitPriceSnapshot) * item.qty,
    }));
  }
}
