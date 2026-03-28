'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { Product } from '@/lib/types'
import { deleteProduct } from '@/lib/actions/products'

interface ProductTableProps {
  products: Product[]
}

export default function ProductTable({ products }: ProductTableProps) {
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function handleDelete(id: string, name: string) {
    if (!confirm(`「${name}」を削除しますか？`)) return
    setDeletingId(id)
    startTransition(async () => {
      const result = await deleteProduct(id)
      if (!result.success) {
        alert(result.error)
      }
      setDeletingId(null)
    })
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 py-16 text-center text-gray-500">
        商品が登録されていません
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-600">商品名</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">ASIN</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">SKU</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">JANコード</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">ブランド</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">FBAサイズ</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">仕入値</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">初期価格</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-gray-50">
              <td className="max-w-xs truncate px-4 py-3 font-medium text-gray-900">
                {product.product_name}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-gray-600">
                {product.asin ?? '-'}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-gray-600">
                {product.sku ?? '-'}
              </td>
              <td className="px-4 py-3 text-xs text-gray-600">
                {product.jan_code_1 ?? '-'}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {product.brands?.brand_name ?? '-'}
              </td>
              <td className="px-4 py-3">
                <FbaSizeBadge size={product.fba_size} />
              </td>
              <td className="px-4 py-3 text-right text-gray-600">
                {product.purchase_price != null
                  ? `¥${product.purchase_price.toLocaleString()}`
                  : '-'}
              </td>
              <td className="px-4 py-3 text-right text-gray-600">
                {product.initial_price != null
                  ? `¥${product.initial_price.toLocaleString()}`
                  : '-'}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/products/${product.id}/edit`}
                    className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                  >
                    編集
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id, product.product_name)}
                    disabled={isPending && deletingId === product.id}
                    className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    削除
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FbaSizeBadge({ size }: { size: string }) {
  const colors: Record<string, string> = {
    小型: 'bg-green-100 text-green-700',
    標準: 'bg-blue-100 text-blue-700',
    大型: 'bg-yellow-100 text-yellow-700',
    特大: 'bg-red-100 text-red-700',
  }
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[size] ?? 'bg-gray-100 text-gray-700'}`}
    >
      {size}
    </span>
  )
}
