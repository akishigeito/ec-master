import Link from 'next/link'
import { signOut } from '@/lib/actions/auth'

interface NavbarProps {
  userEmail: string
}

export default function Navbar({ userEmail }: NavbarProps) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <nav className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-gray-900 hover:text-blue-600"
          >
            EC管理
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            商品一覧
          </Link>
          <Link
            href="/products/new"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            商品登録
          </Link>
          <Link
            href="/brands"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ブランド管理
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">{userEmail}</span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
            >
              ログアウト
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
