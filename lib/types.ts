export type FbaSize = '小型' | '標準' | '大型' | '特大'

export interface Brand {
  id: string
  brand_name: string
  company_name: string
  site_url: string | null
  sku_prefix: string
  sku_last_number: number
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  asin: string | null
  sku: string | null
  jan_code_1: string | null
  jan_code_2: string | null
  brand_id: string | null
  product_name: string
  image_url: string | null
  info_url_1: string | null
  info_url_2: string | null
  info_url_3: string | null
  weight_kg: number | null
  size_length_cm: number | null
  size_width_cm: number | null
  size_height_cm: number | null
  fba_size: FbaSize
  purchase_price: number | null
  initial_price: number | null
  created_at: string
  updated_at: string
  brands?: Pick<Brand, 'id' | 'brand_name'> | null
}

export interface AmazonProductInfo {
  product_name: string
  jan_code_1: string | null
  jan_code_2: string | null
  image_url: string | null
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
