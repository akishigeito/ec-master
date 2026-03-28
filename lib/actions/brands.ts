'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Brand } from '@/lib/types'

export async function getBrands(): Promise<Brand[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('brand_name')

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createBrand(formData: FormData): Promise<ActionResult<Brand>> {
  const supabase = await createClient()

  const payload = {
    brand_name: formData.get('brand_name') as string,
    company_name: formData.get('company_name') as string,
    site_url: (formData.get('site_url') as string) || null,
    sku_prefix: (formData.get('sku_prefix') as string).trim(),
    sku_last_number: 0,
  }

  if (!payload.brand_name || !payload.company_name || !payload.sku_prefix) {
    return { success: false, error: '必須項目を入力してください' }
  }

  const { data, error } = await supabase
    .from('brands')
    .insert(payload)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/brands')
  revalidatePath('/dashboard')
  return { success: true, data }
}

export async function updateBrand(
  id: string,
  formData: FormData
): Promise<ActionResult<Brand>> {
  const supabase = await createClient()

  const payload = {
    brand_name: formData.get('brand_name') as string,
    company_name: formData.get('company_name') as string,
    site_url: (formData.get('site_url') as string) || null,
    sku_prefix: (formData.get('sku_prefix') as string).trim(),
  }

  if (!payload.brand_name || !payload.company_name || !payload.sku_prefix) {
    return { success: false, error: '必須項目を入力してください' }
  }

  const { data, error } = await supabase
    .from('brands')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/brands')
  revalidatePath('/dashboard')
  return { success: true, data }
}

export async function deleteBrand(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  // 紐づく商品が存在するか確認
  const { count } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('brand_id', id)

  if (count && count > 0) {
    return {
      success: false,
      error: 'このブランドに紐づく商品が存在するため削除できません',
    }
  }

  const { error } = await supabase.from('brands').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/brands')
  return { success: true, data: undefined }
}

interface CsvBrandRow {
  brand_name?: string
  company_name?: string
  sku_prefix?: string
  site_url?: string
  [key: string]: string | undefined
}

interface ImportResult {
  success: number
  skipped: number
  errors: string[]
}

export async function importBrandsFromCsv(rows: CsvBrandRow[]): Promise<ImportResult> {
  const supabase = await createClient()
  let success = 0
  let skipped = 0
  const errors: string[] = []

  // 既存の sku_prefix 一覧を取得して重複チェックに使う
  const { data: existing } = await supabase.from('brands').select('sku_prefix')
  const existingPrefixes = new Set((existing ?? []).map((b) => b.sku_prefix))

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const lineNum = i + 2 // ヘッダー行分 +2

    const brand_name = row['brand_name']?.trim()
    const company_name = row['company_name']?.trim()
    const sku_prefix = row['sku_prefix']?.trim()
    const site_url = row['site_url']?.trim() || null

    if (!brand_name || !company_name || !sku_prefix) {
      errors.push(`${lineNum}行目: brand_name・company_name・sku_prefix は必須です`)
      continue
    }

    if (existingPrefixes.has(sku_prefix)) {
      skipped++
      continue
    }

    const { error } = await supabase.from('brands').insert({
      brand_name,
      company_name,
      sku_prefix,
      site_url,
      sku_last_number: 0,
    })

    if (error) {
      errors.push(`${lineNum}行目 (${brand_name}): ${error.message}`)
    } else {
      existingPrefixes.add(sku_prefix)
      success++
    }
  }

  revalidatePath('/brands')
  return { success, skipped, errors }
}

/**
 * SKU自動採番：sku_prefix + ゼロ埋め4桁の (sku_last_number + 1)
 * 例: TBL-0001
 */
export async function generateSku(brandId: string): Promise<ActionResult<string>> {
  const supabase = await createClient()

  // トランザクション的に採番するため RPC を使用
  const { data, error } = await supabase.rpc('increment_sku_number', {
    brand_id_input: brandId,
  })

  if (error) {
    // RPC が未定義の場合はクライアントサイドで採番（初期実装フォールバック）
    const { data: brand, error: fetchError } = await supabase
      .from('brands')
      .select('sku_prefix, sku_last_number')
      .eq('id', brandId)
      .single()

    if (fetchError || !brand) return { success: false, error: 'ブランドが見つかりません' }

    const nextNumber = brand.sku_last_number + 1
    const sku = `${brand.sku_prefix}-${String(nextNumber).padStart(4, '0')}`

    await supabase
      .from('brands')
      .update({ sku_last_number: nextNumber })
      .eq('id', brandId)

    return { success: true, data: sku }
  }

  return { success: true, data: data as string }
}
