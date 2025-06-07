'use client'

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MapPin } from 'lucide-react';

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const productRef = doc(db, 'products', id as string);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const productData = productSnap.data();
        setProduct(productData);

        // Fetch seller profile
        const sellerRef = doc(db, 'users', productData.seller);
        const sellerSnap = await getDoc(sellerRef);
        if (sellerSnap.exists()) {
          setSeller(sellerSnap.data());
        }
      }
    };

    if (id) fetchData();
  }, [id]);

  if (!product || !seller) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto relative">
      {/* Seller Profile Picture */}
      <div className="flex items-center space-x-4 mb-6">
        {seller.photoURL ? (
          <img src={seller.photoURL} alt="Seller" className="w-24 h-24 rounded-full border-2 border-gray-300" />
        ) : (
          <div className="w-24 h-24 bg-gray-300 rounded-full" />
        )}
        <div>
          <h2 className="text-xl font-bold">{seller.name}</h2>
          <p className="text-gray-500 text-sm">{seller.email}</p>
        </div>
      </div>

      {/* Product Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
        <p className="text-gray-600 mb-4">{product.description}</p>

        <div className="flex items-center space-x-4 mb-4">
          <div className="text-xl font-bold text-green-600">${product.price}</div>
          <div className="flex items-center space-x-1 text-gray-500">
            <MapPin className="w-4 h-4" />
            <span className="capitalize">{product.location?.replace("-", " ")}</span>
          </div>
        </div>

        <button
          onClick={() => alert('Reported seller')}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Report Seller
        </button>
      </div>

      {/* Chat Bar */}
      <div className="fixed bottom-4 right-4 w-80 bg-white shadow-lg rounded-lg p-3 border">
        <div className="text-sm font-semibold mb-2">Chat with {seller.name}</div>
        <textarea
          className="w-full p-2 border rounded mb-2 resize-none text-sm"
          rows={2}
          placeholder="Type your message..."
        />
        <button className="w-full py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
          Send
        </button>
      </div>
    </div>
  );
}
