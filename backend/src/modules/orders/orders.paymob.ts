export type PaymobOrderLine = {
  productName: string;
  productSku: string;
  unitPrice: number | string | { toString(): string };
  quantity: number;
};

export function mapOrderLinesToPaymobItems(lines: PaymobOrderLine[]) {
  return lines.map((line) => ({
    name: line.productName.slice(0, 50),
    amount: toMinorUnits(line.unitPrice),
    quantity: line.quantity,
    description: line.productSku,
  }));
}

function toMinorUnits(value: PaymobOrderLine["unitPrice"]): number {
  return Math.round(Number(value) * 100);
}
