'use server'

import type { ActionResult, AmazonProductInfo } from '@/lib/types'

/**
 * Amazon SP-API から商品情報を取得するモック関数。
 * SP-API の実装は後続フェーズで行う。
 */
export async function fetchAmazonProductInfo(
  asin: string
): Promise<ActionResult<AmazonProductInfo>> {
  // ---- SP-API 実装前のモック ----
  // 実際の実装では以下を行う:
  //   1. LWA (Login with Amazon) でアクセストークンを取得
  //   2. Catalog Items API v2022-04-01 で ASIN 検索
  //   3. レスポンスから商品名・JAN・画像URLを抽出

  if (!asin || asin.trim().length === 0) {
    return { success: false, error: 'ASINを入力してください' }
  }

  // ASIN フォーマット検証 (B + 9桁英数字)
  if (!/^[A-Z0-9]{10}$/.test(asin.trim().toUpperCase())) {
    return { success: false, error: '有効なASIN（10桁英数字）を入力してください' }
  }

  // モックデータを返す
  await new Promise((resolve) => setTimeout(resolve, 500)) // API遅延シミュレーション

  return {
    success: true,
    data: {
      product_name: `【モック】サンプル商品 (ASIN: ${asin.toUpperCase()})`,
      jan_code_1: '4901234567890',
      jan_code_2: null,
      image_url: null,
    },
  }
}
