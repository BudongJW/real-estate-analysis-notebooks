import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../lib/theme'

const NAV_ITEMS = [
  { label: '시장 개요', short: '개요', icon: '📊', path: '/' },
  { label: '실거래가', short: '실거래', icon: '💰', path: '/trades' },
  { label: '전세가율', short: '전세', icon: '🏘️', path: '/jeonse' },
  { label: '지역 비교', short: '비교', icon: '⚖️', path: '/compare' },
  { label: '청약', short: '청약', icon: '📋', path: '/subscriptions' },
  { label: '대출', short: '대출', icon: '🏦', path: '/calculator' },
  { label: '투자 시뮬', short: '투자', icon: '📈', path: '/roi' },
  { label: '세금', short: '세금', icon: '🧾', path: '/tax' },
  { label: '투자 스코어', short: '스코어', icon: '🎯', path: '/invest-score' },
  { label: '리포트', short: '리포트', icon: '📄', path: '/report' },
  { label: '맞춤 리포트', short: '맞춤', icon: '✨', path: '/custom-report' },
  { label: '요금제', short: '요금', icon: '💎', path: '/pricing' },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { theme, toggle } = useTheme()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <span>🏠</span>
              <span className="hidden sm:inline">부동산 시장 분석</span>
            </Link>
            <div className="hidden lg:flex items-center gap-0.5">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={toggle}
                className="ml-1 p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                title={theme === 'light' ? '다크 모드' : '라이트 모드'}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
            </div>
            {/* Mobile: dark mode toggle in header */}
            <button
              onClick={toggle}
              className="lg:hidden p-2 rounded-md text-gray-500 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-700"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-6">
        {children}
      </main>

      <footer className="hidden lg:block border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-5 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-gray-500 dark:text-gray-400">
          <p>부동산 시장 분석 대시보드 · 공공데이터포털(data.go.kr) 기반</p>
          <p className="mt-1">데이터 출처: 국토교통부 실거래가 공개시스템</p>
        </div>
      </footer>

      {/* Mobile bottom tab navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-bottom">
        <div className="flex overflow-x-auto scrollbar-hide">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[4rem] py-2 px-1.5 text-center transition-colors active:bg-gray-100 dark:active:bg-gray-700 ${
                location.pathname === item.path
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span className={`text-[10px] mt-0.5 leading-tight ${
                location.pathname === item.path ? 'font-semibold' : 'font-normal'
              }`}>
                {item.short}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
