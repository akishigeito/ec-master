'use client'

import { useRef, useState, useTransition } from 'react'
import { importProductsFromCsv } from '@/lib/actions/products'
import { decodeBuffer, parseCsv } from '@/lib/csv'

interface ImportResult {
  success: number
  skipped: number
  errors: string[]
}

export default function ProductCsvImport() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<ImportResult | null>(null)
  const [parseError, setParseError] = useState('')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setResult(null)
    setParseError('')

    const reader = new FileReader()
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer
      const text = decodeBuffer(buffer)
      const rows = parseCsv(text)

      if (rows.length === 0) {
        setParseError('データが見つかりませんでした。ヘッダー行を含む CSV を選択してください。')
        return
      }

      startTransition(async () => {
        const res = await importProductsFromCsv(rows)
        setResult(res)
        if (inputRef.current) inputRef.current.value = ''
      })
    }
    reader.readAsArrayBuffer(file)
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">CSVインポート</p>
          <p className="text-xs text-gray-400">
            ヘッダー: product_name, asin, sku, jan_code_1, jan_code_2, brand_name,
            purchase_price, initial_price, fba_size, weight_kg,
            size_length_cm, size_width_cm, size_height_cm
          </p>
        </div>
        <label className="btn-secondary cursor-pointer shrink-0">
          {isPending ? 'インポート中...' : 'CSVを選択'}
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileChange}
            disabled={isPending}
          />
        </label>
      </div>

      {parseError && (
        <p className="mt-3 text-sm text-red-600">{parseError}</p>
      )}

      {result && (
        <div className="mt-3 rounded-md bg-gray-50 p-3 text-sm space-y-1">
          <p className="text-green-700 font-medium">
            ✓ {result.success} 件インポート完了
          </p>
          {result.skipped > 0 && (
            <p className="text-yellow-600">
              ⚠ {result.skipped} 件スキップ（SKUが重複）
            </p>
          )}
          {result.errors.length > 0 && (
            <div className="text-red-600">
              <p>エラー ({result.errors.length} 件):</p>
              <ul className="ml-4 list-disc text-xs">
                {result.errors.slice(0, 5).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
                {result.errors.length > 5 && (
                  <li>...他 {result.errors.length - 5} 件</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
