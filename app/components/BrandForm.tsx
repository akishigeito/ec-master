'use client'

import { useState, useTransition } from 'react'
import { createBrand, updateBrand } from '@/lib/actions/brands'
import type { Brand } from '@/lib/types'

interface BrandFormProps {
  brand?: Brand
  onClose: () => void
}

export default function BrandForm({ brand, onClose }: BrandFormProps) {
  const isEdit = !!brand
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError('')
    startTransition(async () => {
      const result = isEdit
        ? await updateBrand(brand.id, formData)
        : await createBrand(formData)

      if (!result.success) {
        setError(result.error)
        return
      }
      onClose()
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div>
        <label className="label-text" htmlFor="brand_name">
          ブランド名 <span className="text-red-500">*</span>
        </label>
        <input
          id="brand_name"
          name="brand_name"
          required
          defaultValue={brand?.brand_name}
          className="form-input"
        />
      </div>

      <div>
        <label className="label-text" htmlFor="company_name">
          メーカー会社名 <span className="text-red-500">*</span>
        </label>
        <input
          id="company_name"
          name="company_name"
          required
          defaultValue={brand?.company_name}
          className="form-input"
        />
      </div>

      <div>
        <label className="label-text" htmlFor="sku_prefix">
          SKU接頭辞 <span className="text-red-500">*</span>
        </label>
        <input
          id="sku_prefix"
          name="sku_prefix"
          required
          defaultValue={brand?.sku_prefix}
          placeholder="例: TBL"
          className="form-input font-mono"
        />
        <p className="mt-1 text-xs text-gray-400">
          SKU は「{brand?.sku_prefix ?? 'PREFIX'}-0001」形式で自動採番されます
        </p>
      </div>

      <div>
        <label className="label-text" htmlFor="site_url">
          公式サイトURL
        </label>
        <input
          id="site_url"
          name="site_url"
          type="url"
          defaultValue={brand?.site_url ?? ''}
          className="form-input"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">
          キャンセル
        </button>
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? '保存中...' : isEdit ? '更新する' : '登録する'}
        </button>
      </div>
    </form>
  )
}
