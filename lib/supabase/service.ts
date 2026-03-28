import { createClient } from '@supabase/supabase-js'

/**
 * サービスロールクライアント（RLSをバイパス）
 * サーバーサイド専用。クライアントコンポーネントで使用禁止。
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
