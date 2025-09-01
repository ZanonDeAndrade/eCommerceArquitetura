export interface Product {
  id?: number;
  name: string;
  price: number;
  stock: number;
}

export const products: Product[] = [
  { name: "Notebook", price: 3500, stock: 5 },
  { name: "Mouse", price: 100, stock: 20 },
  { name: "Teclado", price: 250, stock: 15 },
];
