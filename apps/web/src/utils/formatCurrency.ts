export function formatIDR(value: number | string | null | undefined) {
  const num = Number(value ?? 0);
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(num);
  } catch {
    return `Rp ${num.toLocaleString()}`;
  }
}

export default formatIDR;
