import Link from 'next/link'
import { getProducts } from '@/lib/actions/products'
import ProductTable from '@/app/components/ProductTable'
import ProductCsvImport from '@/app/components/ProductCsvImport'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const products = await getProducts(q)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">商品一覧</h1>
          <p className="mt-1 text-sm text-gray-500">
            {products.length} 件の商品が登録されています
          </p>
        </div>
        <Link
          href="/products/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          + 新規商品登録
        </Link>
      </div>

      <ProductCsvImport />
      <SearchBar defaultValue={q} />
      <ProductTable products={products} />
    </div>
  )
}

function SearchBar({ defaultValue }: { defaultValue?: string }) {
  return (
    <form method="GET" action="/dashboard" className="flex gap-2">
      <input
        type="text"
        name="q"
        defaultValue={defaultValue}
        placeholder="商品名・ASIN・SKU・JANで検索..."
        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
      >
        検索
      </button>
      {defaultValue && (
        <Link
          href="/dashboard"
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          クリア
        </Link>
      )}
    </form>
  )
}
