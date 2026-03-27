import { Link, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { label: '시장 개요', path: '/' },
  { label: '실거래가', path: '/trades' },
  { label: '전세가율', path: '/jeonse' },
  { label: '청약 정보', path: '/subscriptions' },
  { label: '대출 계산기', path: '/calculator' },
  { label: '주간 리포트', path: '/report' },
  { label: '맞춤 리포트', path: '/custom-report' },
  { label: '요금제', path: '/pricing' },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <span className="text-2xl">🏠</span>
              <span>부동산 시장 분석</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        {/* Mobile nav */}
        <nav className="md:hidden flex overflow-x-auto border-t border-gray-100 px-4 gap-1 py-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                location.pathname === item.path
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-500'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
      <footer className="border-t border-gray-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-sm text-gray-500">
          <p>부동산 시장 분석 대시보드 &middot; 공공데이터포털(data.go.kr) 기반</p>
          <p className="mt-1">데이터 출처: 국토교통부 실거래가 공개시스템</p>
        </div>
      </footer>
    </div>
  )
}
