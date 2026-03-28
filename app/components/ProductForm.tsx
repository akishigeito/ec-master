'use client'

import { useState, useTransition } from 'react'
import { useActionState } from 'react'
import { createProduct, updateProduct } from '@/lib/actions/products'
import { generateSku } from '@/lib/actions/brands'
import { fetchAmazonProductInfo } from '@/lib/actions/amazon'
import type { Brand, Product } from '@/lib/types'

const FBA_SIZES = ['小型', '標準', '大型', '特大'] as const

interface ProductFormProps {
  brands: Brand[]
  product?: Product
}

export default function ProductForm({ brands, product }: ProductFormProps) {
  const isEdit = !!product

  // フォームフィールドの state
  const [asin, setAsin] = useState(product?.asin ?? '')
  const [sku, setSku] = useState(product?.sku ?? '')
  const [janCode1, setJanCode1] = useState(product?.jan_code_1 ?? '')
  const [janCode2, setJanCode2] = useState(product?.jan_code_2 ?? '')
  const [productName, setProductName] = useState(product?.product_name ?? '')
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '')
  const [selectedBrandId, setSelectedBrandId] = useState(product?.brand_id ?? '')

  const [asinLoading, setAsinLoading] = useState(false)
  const [asinError, setAsinError] = useState('')
  const [skuLoading, setSkuLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [isPending, startTransition] = useTransition()

  // ASIN から商品情報を自動取得（モック）
  async function handleFetchAsin() {
    if (!asin) return
    setAsinLoading(true)
    setAsinError('')
    const result = await fetchAmazonProductInfo(asin)
    setAsinLoading(false)
    if (!result.success) {
      setAsinError(result.error)
      return
    }
    setProductName(result.data.product_name)
    setJanCode1(result.data.jan_code_1 ?? '')
    setJanCode2(result.data.jan_code_2 ?? '')
    if (result.data.image_url) setImageUrl(result.data.image_url)
  }

  // SKU 自動採番
  async function handleGenerateSku() {
    if (!selectedBrandId) {
      alert('先にブランドを選択してください')
      return
    }
    setSkuLoading(true)
    const result = await generateSku(selectedBrandId)
    setSkuLoading(false)
    if (!result.success) {
      alert(result.error)
      return
    }
    setSku(result.data)
  }

  function handleSubmit(formData: FormData) {
    setFormError('')
    startTransition(async () => {
      const result = isEdit
        ? await updateProduct(product.id, formData)
        : await createProduct(formData)

      // redirect が投げられるので success: false の場合のみここに到達
      if (!result.success) {
        setFormError(result.error)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      {formError && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{formError}</div>
      )}

      {/* Amazon連携 */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Amazon情報</h2>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="label-text" htmlFor="asin">
              ASIN
            </label>
            <input
              id="asin"
              name="asin"
              value={asin}
              onChange={(e) => setAsin(e.target.value.toUpperCase())}
              placeholder="B08XYZ1234"
              className="form-input font-mono"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleFetchAsin}
              disabled={asinLoading || !asin}
              className="btn-secondary"
            >
              {asinLoading ? '取得中...' : 'SP-APIで取得'}
            </button>
          </div>
        </div>
        {asinError && <p className="mt-1 text-xs text-red-600">{asinError}</p>}
        <p className="mt-2 text-xs text-gray-400">
          ※ SP-API未設定のためモックデータが返されます
        </p>
      </section>

      {/* 基本情報 */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-gray-900">基本情報</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label-text" htmlFor="product_name">
              商品名 <span className="text-red-500">*</span>
            </label>
            <input
              id="product_name"
              name="product_name"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="form-input"
            />
          </div>

          <div>
            <label className="label-text" htmlFor="jan_code_1">
              JANコード 1
            </label>
            <input
              id="jan_code_1"
              name="jan_code_1"
              value={janCode1}
              onChange={(e) => setJanCode1(e.target.value)}
              className="form-input font-mono"
            />
          </div>

          <div>
            <label className="label-text" htmlFor="jan_code_2">
              JANコード 2
            </label>
            <input
              id="jan_code_2"
              name="jan_code_2"
              value={janCode2}
              onChange={(e) => setJanCode2(e.target.value)}
              className="form-input font-mono"
            />
          </div>

          <div>
            <label className="label-text" htmlFor="brand_id">
              ブランド
            </label>
            <select
              id="brand_id"
              name="brand_id"
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="form-input"
            >
              <option value="">選択してください</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.brand_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-text" htmlFor="sku">
              SKU
            </label>
            <div className="flex gap-2">
              <input
                id="sku"
                name="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="form-input flex-1 font-mono"
              />
              <button
                type="button"
                onClick={handleGenerateSku}
                disabled={skuLoading || !selectedBrandId}
                className="btn-secondary shrink-0"
                title="SKU自動採番"
              >
                {skuLoading ? '...' : '自動採番'}
              </button>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="label-text" htmlFor="image_url">
              商品画像URL
            </label>
            <input
              id="image_url"
              name="image_url"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="form-input"
            />
          </div>

          <div>
            <label className="label-text" htmlFor="info_url_1">
              商品情報URL 1
            </label>
            <input
              id="info_url_1"
              name="info_url_1"
              type="url"
              defaultValue={product?.info_url_1 ?? ''}
              className="form-input"
            />
          </div>
          <div>
            <label className="label-text" htmlFor="info_url_2">
              商品情報URL 2
            </label>
            <input
              id="info_url_2"
              name="info_url_2"
              type="url"
              defaultValue={product?.info_url_2 ?? ''}
              className="form-input"
            />
          </div>
          <div>
            <label className="label-text" htmlFor="info_url_3">
              商品情報URL 3
            </label>
            <input
              id="info_url_3"
              name="info_url_3"
              type="url"
              defaultValue={product?.info_url_3 ?? ''}
              className="form-input"
            />
          </div>
        </div>
      </section>

      {/* サイズ・重量 */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-gray-900">サイズ・重量</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="label-text" htmlFor="weight_kg">
              重量 (kg)
            </label>
            <input
              id="weight_kg"
              name="weight_kg"
              type="number"
              step="0.001"
              min="0"
              defaultValue={product?.weight_kg ?? ''}
              className="form-input"
            />
          </div>
          <div>
            <label className="label-text" htmlFor="size_length_cm">
              縦 (cm)
            </label>
            <input
              id="size_length_cm"
              name="size_length_cm"
              type="number"
              step="0.1"
              min="0"
              defaultValue={product?.size_length_cm ?? ''}
              className="form-input"
            />
          </div>
          <div>
            <label className="label-text" htmlFor="size_width_cm">
              横 (cm)
            </label>
            <input
              id="size_width_cm"
              name="size_width_cm"
              type="number"
              step="0.1"
              min="0"
              defaultValue={product?.size_width_cm ?? ''}
              className="form-input"
            />
          </div>
          <div>
            <label className="label-text" htmlFor="size_height_cm">
              高さ (cm)
            </label>
            <input
              id="size_height_cm"
              name="size_height_cm"
              type="number"
              step="0.1"
              min="0"
              defaultValue={product?.size_height_cm ?? ''}
              className="form-input"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="label-text">FBAサイズ区分</label>
          <div className="mt-1 flex gap-4">
            {FBA_SIZES.map((size) => (
              <label key={size} className="flex cursor-pointer items-center gap-1.5">
                <input
                  type="radio"
                  name="fba_size"
                  value={size}
                  defaultChecked={(product?.fba_size ?? '標準') === size}
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-700">{size}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* 価格 */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-gray-900">価格</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label-text" htmlFor="purchase_price">
              仕入値段 (円)
            </label>
            <input
              id="purchase_price"
              name="purchase_price"
              type="number"
              min="0"
              defaultValue={product?.purchase_price ?? ''}
              className="form-input"
            />
          </div>
          <div>
            <label className="label-text" htmlFor="initial_price">
              初期販売価格 (円)
            </label>
            <input
              id="initial_price"
              name="initial_price"
              type="number"
              min="0"
              defaultValue={product?.initial_price ?? ''}
              className="form-input"
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <a href="/dashboard" className="btn-secondary">
          キャンセル
        </a>
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? '保存中...' : isEdit ? '更新する' : '登録する'}
        </button>
      </div>
    </form>
  )
}
