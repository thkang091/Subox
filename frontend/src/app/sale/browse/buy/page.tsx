'use client'

import { useEffect, useState } from 'react'
import { Trash, Package, MapPin, Clock, Truck, Star, Minus, Plus } from 'lucide-react'
import Link from "next/link"
import { motion } from "framer-motion"


interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

const BuyPage = () => {
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [viewMode, setViewMode] = useState("grid");
  const [cart, setCart] = useState(new Map());

  useEffect(() => {
    if (typeof window === 'undefined') return;


    const cartRaw = localStorage.getItem('cart');
    if (cartRaw) {
      const parsed = JSON.parse(cartRaw) as Product[];
      setCartItems(parsed);
    }

    const favRaw = localStorage.getItem('favorites');
    if (favRaw) {
      const parsedFav = JSON.parse(favRaw) as Product[];
      setFavorites(parsedFav);
    }
  }, []);


  const removeFromCart = (id: number) => {
    const updated = cartItems.filter(item => item.id !== id);
    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const updateCart = (productId, newQuantity) => {
    setCartItems((prev) => {
      const updated = prev
        .map((item) =>
          item.id === productId ? {...item, quantity: newQuantity } : item
        )
        .filter((item) => item.quantity > 0);
      
      localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });
  };

  const handleBuy = () => {
    alert('Purchase complete!');
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  if (cartItems.length === 0) {
    return <div className="p-6 text-center text-gray-500">Your cart is empty.</div>;
  }

  return (
    <div className="relative p-6 pb-24">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      <div className="space-y-4">
        {cartItems.map((item) => (
          <div
            key={`${item.id}`}
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow border"
          >
            <div className="flex items-center gap-4">
              {item.image && (
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded object-cover" />
              )}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{item.name}</h2>
                <p className="text-sm text-gray-500">
                  ${item.price} × {item.quantity}
                </p>
              </div>
            </div>
            <button
              onClick={() => removeFromCart(item.id)}
              className="text-red-500 hover:text-red-600 p-2"
              aria-label="Remove"
            >
              <Trash className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Buy Button */}
      <div className="fixed bottom-4 right-4">
        <button
          onClick={handleBuy}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          Buy Now (${cartItems.reduce((total, item) => total + item.price * item.quantity, 0)})
        </button>
      </div>
      {favorites.length > 0 && (
        <>
          <h2 className="text-xl font-bold mt-10 mb-4">Favorite Products</h2>
            <motion.div 
              layout
              className={`grid gap-6 ${
                viewMode === "grid" 
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
                  : "grid-cols-1"
              }`}
            >
              {favorites.map(product => (
                <motion.div
                  key={`product-${product.id}`}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all ${
                    viewMode === "list" ? "flex" : ""
                  }`}
                >
                  <Link href={`browse/product/${product.id}`} className="block">
                    <div className="cursor-pointer">
                      {/* Product Image */}
                      <div className={`relative ${viewMode === "list" ? "w-48 h-32" : "aspect-square"}`}>
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <Package className="w-12 h-12 text-gray-400" />
                        </div>
                        {/* Condition Badge */}
                        <div className="absolute bottom-2 left-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.condition === "new" ? "bg-green-100 text-green-700" :
                            product.condition === "like-new" ? "bg-blue-100 text-blue-700" :
                            product.condition === "good" ? "bg-yellow-100 text-yellow-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {product.condition}
                          </span>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-4 flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
                          <div className="text-right">
                            <div className="text-xl font-bold text-gray-900">${product.price}</div>
                            <div className="text-sm text-gray-500 line-through">${product.originalPrice}</div>
                          </div>
                        </div>

                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span className="capitalize">{product.location.replace("-", " ")}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Until {product.availableUntil}</span>
                          </div>
                          {product.deliveryAvailable && (
                            <div className="flex items-center space-x-1">
                              <Truck className="w-3 h-3" />
                              <span>Delivery</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-medium">{product.rating}</span>
                            </div>
                            <span className="text-gray-500 text-sm">• {product.views} views</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            
                            {cartItems.find(prod => prod.id === product.id) ? (
                              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    updateCart(product.id, (cart.get(product.id) || 1) - 1);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-l-lg"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-2 py-1 text-sm font-medium">{cart.get(product.id)}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    updateCart(product.id, (cart.get(product.id) || 0) + 1);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-r-lg"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  const existingItem = cartItems.find((item) => item.id === product.id);
                                  if (existingItem) {
                                    updateCart(product.id, existingItem.quantity + 1);
                                  } else {
                                    const updated = [...cartItems, { ...product, quantity: 1 }];
                                    setCartItems(updated);
                                    localStorage.setItem('cart', JSON.stringify(updated));
                                  }
                                }}
                                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                              >
                                Add to Cart
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                      {/* Product Seller info */}
                        <Link key={`seller-${product.id}`} href={`browse/profile/${product.seller}`} className="text-sm text-gray-500">
                          Sold by <span className="font-medium text-gray-700">{product.seller}</span>
                        </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
        </>
      )}
    </div>
  );
};

export default BuyPage;