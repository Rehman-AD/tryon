"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllProducts, updateProduct, deleteProduct } from "@/lib/products";
import type { Product } from "@/types";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllProducts().then((p) => { setProducts(p); setLoading(false); });
  }, []);

  const handleToggleActive = async (product: Product) => {
    await updateProduct(product.id, { active: !product.active });
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, active: !p.active } : p));
  };

  const handleToggleFeatured = async (product: Product) => {
    await updateProduct(product.id, { featured: !product.featured });
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, featured: !p.featured } : p));
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"?`)) return;
    await deleteProduct(product.id);
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, active: false } : p));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link
          href="/admin/products/new"
          className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition shadow-md flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Product
        </Link>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-500 mb-4">No products yet</p>
          <Link href="/admin/products/new" className="text-blue-600 font-medium hover:text-blue-700">
            Add your first product
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Price</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Featured</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Active</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((product) => (
                  <tr key={product.id} className={`hover:bg-gray-50 transition ${!product.active ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.imageThumbnail ? (
                          <img src={product.imageThumbnail} alt="" className="w-10 h-12 rounded-lg object-cover border border-gray-100" />
                        ) : (
                          <div className="w-10 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xs">N/A</div>
                        )}
                        <span className="font-medium text-gray-900 text-sm truncate max-w-[200px]">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 capitalize">{product.category}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">Rs. {product.price?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{product.stock}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleToggleFeatured(product)} className={`w-5 h-5 rounded border-2 transition ${product.featured ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
                        {product.featured && <svg className="w-full h-full text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleToggleActive(product)} className={`w-5 h-5 rounded border-2 transition ${product.active ? "bg-green-600 border-green-600" : "border-gray-300"}`}>
                        {product.active && <svg className="w-full h-full text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/products/${product.id}/edit`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </Link>
                        <button onClick={() => handleDelete(product)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
