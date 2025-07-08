import { Timestamp } from "firebase/firestore"; 

export interface User {
  id: string;
  name: string;
  email: string;
  purchasedProducts: string[];
  soldProducts: string[];
}

export type ProductStatus = "sold" | "bought";

export interface Product {
  id: string;
  name: string;
  price: number;
  sellerId: string;
  buyerId?: string;
  status: ProductStatus;
  timestamp: Timestamp | Date;
}

export const sampleUser: User = {
  id: "user123",
  name: "Jane Doe",
  email: "jane@example.com",
  purchasedProducts: ["productA", "productC"],
  soldProducts: ["productB"],
};

export const sampleProduct: Product = {
  id: "productA",
  name: "MacBook Pro",
  price: 1200,
  sellerId: "user456",
  buyerId: "user123",
  status: "sold",
  timestamp: new Date()
};
