// app/product/[id]/buy/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader } from "lucide-react";
import { products } from '../../../../../../data/saleListings';

type Product = {
  id: string;
  name: string;
  price: number;
  seller: string; // sellerId
  shortDescription: string;
};

export default function BuyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<any>({
    ID : "none",
    name: "seller",
    email: "seller@example.com",
    photoURL: null
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
  //   const fetchData = async () => {
  //     const productRef = doc(db, 'products', id as string);
  //     const productSnap = await getDoc(productRef);
  //     if (productSnap.exists()) {
  //       const productData = productSnap.data();
  //       setProduct(productData);

  //       // Fetch seller profile
  //       const sellerRef = doc(db, 'users', productData.seller);
  //       const sellerSnap = await getDoc(sellerRef);
  //       if (sellerSnap.exists()) {
  //         setSeller(sellerSnap.data());
  //       }
  //     }
  //   };

  //   if (id) fetchData();
  // }, [id]);

  // find listing data
      const foundProduct = products.find(item => 
      item.id === parseInt(id as string) || item.id.toString() === id
    );
    
    if (foundProduct) {
      setProduct(foundProduct);

      setLoading(false);

      setSeller({
      ID: foundProduct.sellerID || "none",
      name: foundProduct.seller || "seller",
      email: foundProduct.sellerEmail || "seller@example.com",
      photoURL: foundProduct.sellerPhoto || null
    });

    };
  }, [id]);

  const handlePurchase = async () => {
    if (!product) return;
    setProcessing(true);

    try {
      const res = await fetch("/api/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          sellerId: product.seller,
          amount: product.price,
        }),
      });

      if (!res.ok) throw new Error("Payment failed");

      alert("Purchase successful!");
      router.push(`/thank-you`);
    } catch (err) {
      console.error(err);
      alert("Failed to complete purchase.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        <Loader className="animate-spin mr-2" /> Loading product...
      </div>
    );
  }

  if (!product) {
    setLoading(false);
    return (
      <div className="text-center text-red-500 mt-10">
        Product not found.
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold text-gray-700 mb-2">{product.name}</h1>
      <p className="text-gray-600 mb-4">{product.shortDescription}</p>
      <div className="text-xl font-semibold text-green-600 mb-6">${product.price}</div>

      <div className="flex justify-between items-center text-sm text-gray-500 mb-6">
        <div>Seller ID: <span className="font-medium text-gray-700">{product.seller}</span></div>
        <div>Product ID: <span className="text-gray-400">{product.id}</span></div>
      </div>

      <button
        onClick={handlePurchase}
        disabled={processing}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition disabled:opacity-60"
      >
        {processing ? "Processing..." : "Confirm and Pay"}
      </button>
    </div>
  );
}
