export interface Product {
    id: number;
    nome: string;
    preco: number;
  }
  
  export const products: Product[] = [
    { id: 1, nome: "Notebook", preco: 3500 },
    { id: 2, nome: "Mouse", preco: 100 },
    { id: 3, nome: "Teclado", preco: 250 },
  ];
  