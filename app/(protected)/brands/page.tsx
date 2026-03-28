import { getBrands } from '@/lib/actions/brands'
import BrandManager from '@/app/components/BrandManager'

export default async function BrandsPage() {
  const brands = await getBrands()

  return <BrandManager initialBrands={brands} />
}
