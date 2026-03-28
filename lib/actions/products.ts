'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Product } from '@/lib/types'

export async function getProducts(search?: string): Promise<Product[]> {
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('*, brands(id, brand_name)')
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(
      `product_name.ilike.%${search}%,asin.ilike.%${search}%,sku.ilike.%${search}%,jan_code_1.ilike.%${search}%`
    )
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as Product[]
}

export async function getProduct(id: string): Promise<Product | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, brands(id, brand_name)')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Product
}

function parseNullableNumber(value: FormDataEntryValue | null): number | null {
  if (!value || value === '') return null
  const n = Number(value)
  return isNaN(n) ? null : n
}

function buildProductPayload(formData: FormData) {
  return {
    asin: (formData.get('asin') as string) || null,
    sku: (formData.get('sku') as string) || null,
    jan_code_1: (formData.get('jan_code_1') as string) || null,
    jan_code_2: (formData.get('jan_code_2') as string) || null,
    brand_id: (formData.get('brand_id') as string) || null,
    product_name: formData.get('product_name') as string,
    image_url: (formData.get('image_url') as string) || null,
    info_url_1: (formData.get('info_url_1') as string) || null,
    info_url_2: (formData.get('info_url_2') as string) || null,
    info_url_3: (formData.get('info_url_3') as string) || null,
    weight_kg: parseNullableNumber(formData.get('weight_kg')),
    size_length_cm: parseNullableNumber(formData.get('size_length_cm')),
    size_width_cm: parseNullableNumber(formData.get('size_width_cm')),
    size_height_cm: parseNullableNumber(formData.get('size_height_cm')),
    fba_size: (formData.get('fba_size') as string) || '標準',
    purchase_price: parseNullableNumber(formData.get('purchase_price')),
    initial_price: parseNullableNumber(formData.get('initial_price')),
  }
}

export async function createProduct(formData: FormData): Promise<ActionResult<Product>> {
  const supabase = await createClient()
  const payload = buildProductPayload(formData)

  if (!payload.product_name) {
    return { success: false, error: '商品名は必須です' }
  }

  const { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function updateProduct(
  id: string,
  formData: FormData
): Promise<ActionResult<Product>> {
  const supabase = await createClient()
  const payload = buildProductPayload(formData)

  if (!payload.product_name) {
    return { success: false, error: '商品名は必須です' }
  }

  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath(`/products/${id}/edit`)
  redirect('/dashboard')
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  return { success: true, data: undefined }
}

interface CsvProductRow {
  product_name?: string
  asin?: string
  sku?: string
  jan_code_1?: string
  jan_code_2?: string
  brand_name?: string
  purchase_price?: string
  initial_price?: string
  fba_size?: string
  weight_kg?: string
  size_length_cm?: string
  size_width_cm?: string
  size_height_cm?: string
  [key: string]: string | undefined
}

interface ImportResult {
  success: number
  skipped: number
  errors: string[]
}

export async function importProductsFromCsv(
  rows: CsvProductRow[]
): Promise<ImportResult> {
  const supabase = await createClient()
  let success = 0
  let skipped = 0
  const errors: string[] = []

  // ブランド名 → brand_id のマップを事前取得
  const { data: brands } = await supabase.from('brands').select('id, brand_name')
  const brandMap = new Map(
    (brands ?? []).map((b) => [b.brand_name.toLowerCase(), b.id])
  )

  // 既存SKUの一覧を取得して重複チェック
  const { data: existingProducts } = await supabase
    .from('products')
    .select('sku')
    .not('sku', 'is', null)
  const existingSkus = new Set((existingProducts ?? []).map((p) => p.sku))

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const lineNum = i + 2

    const product_name = row['product_name']?.trim()
    if (!product_name) {
      errors.push(`${lineNum}行目: product_name は必須です`)
      continue
    }

    const sku = row['sku']?.trim() || null

    // SKUが既存と重複する場合はスキップ
    if (sku && existingSkus.has(sku)) {
      skipped++
      continue
    }

    // brand_name からbrand_idを解決
    const brandName = row['brand_name']?.trim()
    const brand_id = brandName
      ? (brandMap.get(brandName.toLowerCase()) ?? null)
      : null

    if (brandName && !brand_id) {
      errors.push(`${lineNum}行目 (${product_name}): ブランド「${brandName}」が見つかりません`)
      continue
    }

    const fba_size = row['fba_size']?.trim() || '標準'
    const validFbaSizes = ['小型', '標準', '大型', '特大']
    if (!validFbaSizes.includes(fba_size)) {
      errors.push(`${lineNum}行目 (${product_name}): fba_size は ${validFbaSizes.join('/')} のいずれかを指定してください`)
      continue
    }

    const toNum = (v?: string) => {
      if (!v?.trim()) return null
      const n = Number(v.trim())
      return isNaN(n) ? null : n
    }

    const { error } = await supabase.from('products').insert({
      product_name,
      asin: row['asin']?.trim() || null,
      sku,
      jan_code_1: row['jan_code_1']?.trim() || null,
      jan_code_2: row['jan_code_2']?.trim() || null,
      brand_id,
      purchase_price: toNum(row['purchase_price']),
      initial_price: toNum(row['initial_price']),
      fba_size,
      weight_kg: toNum(row['weight_kg']),
      size_length_cm: toNum(row['size_length_cm']),
      size_width_cm: toNum(row['size_width_cm']),
      size_height_cm: toNum(row['size_height_cm']),
    })

    if (error) {
      errors.push(`${lineNum}行目 (${product_name}): ${error.message}`)
    } else {
      if (sku) existingSkus.add(sku)
      success++
    }
  }

  revalidatePath('/dashboard')
  return { success, skipped, errors }
}
