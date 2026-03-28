import Link from 'next/link'
import { getBrands } from '@/lib/actions/brands'
import ProductForm from '@/app/components/ProductForm'

export default async function NewProductPage() {
  const brands = await getBrands()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← 商品一覧
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">商品登録</h1>
      </div>
      <ProductForm brands={brands} />
    </div>
  )
}
