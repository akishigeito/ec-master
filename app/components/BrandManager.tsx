'use client'

import { useState, useTransition } from 'react'
import { deleteBrand } from '@/lib/actions/brands'
import BrandForm from './BrandForm'
import BrandCsvImport from './BrandCsvImport'
import type { Brand } from '@/lib/types'

interface BrandManagerProps {
  initialBrands: Brand[]
}

export default function BrandManager({ initialBrands }: BrandManagerProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function handleEdit(brand: Brand) {
    setEditingBrand(brand)
    setShowForm(true)
  }

  function handleNew() {
    setEditingBrand(null)
    setShowForm(true)
  }

  function handleClose() {
    setShowForm(false)
    setEditingBrand(null)
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`「${name}」を削除しますか？`)) return
    setDeletingId(id)
    startTransition(async () => {
      const result = await deleteBrand(id)
      if (!result.success) alert(result.error)
      setDeletingId(null)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ブランド管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            {initialBrands.length} 件のブランドが登録されています
          </p>
        </div>
        <button onClick={handleNew} className="btn-primary">
          + ブランド追加
        </button>
      </div>

      {/* モーダル */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {editingBrand ? 'ブランド編集' : 'ブランド登録'}
            </h2>
            <BrandForm brand={editingBrand ?? undefined} onClose={handleClose} />
          </div>
        </div>
      )}

      <BrandCsvImport />

      {/* テーブル */}
      {initialBrands.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-16 text-center text-gray-500">
          ブランドが登録されていません
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">ブランド名</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">メーカー名</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">SKU接頭辞</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">最終採番</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">公式サイト</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {initialBrands.map((brand) => (
                <tr key={brand.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{brand.brand_name}</td>
                  <td className="px-4 py-3 text-gray-600">{brand.company_name}</td>
                  <td className="px-4 py-3 font-mono text-gray-600">{brand.sku_prefix}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {String(brand.sku_last_number).padStart(4, '0')}
                  </td>
                  <td className="px-4 py-3">
                    {brand.site_url ? (
                      <a
                        href={brand.site_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        リンク
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(brand)}
                        className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(brand.id, brand.brand_name)}
                        disabled={isPending && deletingId === brand.id}
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
      )}
    </div>
  )
}
