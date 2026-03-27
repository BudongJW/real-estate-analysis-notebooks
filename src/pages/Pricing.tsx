import { Link } from 'react-router-dom'

const FEATURES = [
  { name: '대시보드 조회', free: true, pro: true },
  { name: '주간 시장 리포트 (요약)', free: true, pro: true },
  { name: '차트 PNG 다운로드 (워터마크)', free: true, pro: false },
  { name: '차트 PNG 다운로드 (고해상도, 워터마크 없음)', free: false, pro: true },
  { name: '주간 리포트 전문 (지역별 상세 + 투자 포인트)', free: false, pro: true },
  { name: '맞춤 리포트 생성 (원하는 지역/단지)', free: false, pro: true },
  { name: '텔레그램 알림 (주 1회)', free: true, pro: true },
  { name: '텔레그램 알림 (매일 + 급매/이슈)', free: false, pro: true },
  { name: '실거래가 데이터 CSV 다운로드', free: false, pro: true },
  { name: '전세가율 위험도 알림', free: false, pro: true },
]

export function Pricing() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">요금제</h1>
        <p className="text-gray-500 mt-2">부동산 데이터 분석, 누구나 쉽게 시작하세요</p>
      </div>

      {/* Pricing cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Free */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">무료</h2>
            <div className="mt-3">
              <span className="text-4xl font-bold text-gray-900">₩0</span>
              <span className="text-gray-500">/월</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">기본 시장 분석 도구</p>
          </div>
          <ul className="space-y-3 mb-6">
            {FEATURES.filter(f => f.free).map(f => (
              <li key={f.name} className="flex items-start gap-2 text-sm">
                <span className="text-green-500 mt-0.5">✓</span>
                <span className="text-gray-700">{f.name}</span>
              </li>
            ))}
            {FEATURES.filter(f => !f.free).map(f => (
              <li key={f.name} className="flex items-start gap-2 text-sm">
                <span className="text-gray-300 mt-0.5">✕</span>
                <span className="text-gray-400">{f.name}</span>
              </li>
            ))}
          </ul>
          <Link
            to="/"
            className="block w-full text-center py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            시작하기
          </Link>
        </div>

        {/* Pro */}
        <div className="bg-white rounded-xl border-2 border-blue-500 p-6 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              추천
            </span>
          </div>
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">프로</h2>
            <div className="mt-3">
              <span className="text-4xl font-bold text-blue-600">₩9,900</span>
              <span className="text-gray-500">/월</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">크리에이터 · 투자자를 위한 프리미엄</p>
          </div>
          <ul className="space-y-3 mb-6">
            {FEATURES.filter(f => f.pro).map(f => (
              <li key={f.name} className="flex items-start gap-2 text-sm">
                <span className="text-blue-500 mt-0.5">✓</span>
                <span className="text-gray-700">{f.name}</span>
              </li>
            ))}
          </ul>
          <a
            href="https://t.me/realestate_report_kr"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            프로 시작하기
          </a>
          <p className="text-xs text-gray-400 text-center mt-2">7일 무료 체험 포함</p>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto mt-12">
        <h2 className="text-xl font-semibold text-gray-900 text-center mb-6">자주 묻는 질문</h2>
        <div className="space-y-4">
          <FaqItem
            q="데이터는 어디서 오나요?"
            a="국토교통부 실거래가 공개시스템(공공데이터포털)의 공식 API를 통해 수집합니다. 매주 자동으로 최신 데이터가 업데이트됩니다."
          />
          <FaqItem
            q="다운로드한 차트를 영상/블로그에 사용해도 되나요?"
            a="네! 무료 플랜은 워터마크가 포함되며, 프로 플랜은 워터마크 없이 자유롭게 사용 가능합니다. 상업적 이용(유튜브 수익화, 블로그 등) 모두 허용됩니다."
          />
          <FaqItem
            q="맞춤 리포트는 어떤 건가요?"
            a="원하는 지역이나 아파트 단지를 선택하면, 실거래가 추이·전세가율·거래량·주변 시세 비교를 포함한 상세 분석 리포트를 자동 생성합니다. 유튜브 영상 자료로 바로 활용할 수 있습니다."
          />
          <FaqItem
            q="환불이 가능한가요?"
            a="결제 후 7일 이내 환불 가능합니다. 텔레그램 채널을 통해 문의해주세요."
          />
        </div>
      </div>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="bg-white rounded-xl border border-gray-200 p-4 group">
      <summary className="font-medium text-gray-900 cursor-pointer list-none flex items-center justify-between">
        {q}
        <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
      </summary>
      <p className="text-sm text-gray-600 mt-3 leading-relaxed">{a}</p>
    </details>
  )
}
