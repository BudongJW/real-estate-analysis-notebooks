import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PRO_FEATURES, setSubscriptionTier, isPro as checkIsPro } from '../lib/subscription'

export function Pricing() {
  const [currentPro, setCurrentPro] = useState(checkIsPro())

  const handleTogglePro = () => {
    const newTier = currentPro ? 'free' : 'pro'
    setSubscriptionTier(newTier)
    setCurrentPro(!currentPro)
  }

  return (
    <div className="space-y-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">요금제</h1>
        <p className="text-gray-500 mt-2">부동산 데이터 분석, 크리에이터와 투자자를 위한 도구</p>
      </div>

      {/* Pricing cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Free */}
        <div className="bg-white rounded-2xl border border-gray-200 p-7">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">무료</h2>
            <div className="mt-3">
              <span className="text-4xl font-bold text-gray-900">₩0</span>
              <span className="text-gray-500">/월</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">기본 시장 분석 도구</p>
          </div>

          <ul className="space-y-2.5 mb-6">
            {[
              '대시보드 전체 조회',
              '주간 리포트 (기본 요약)',
              '차트 PNG 다운로드 (워터마크)',
              '대출·세금 계산기',
              'ROI 시뮬레이터',
              '투자 스코어 상위 4개 지역',
              '텔레그램 주간 알림',
              '맞춤 리포트 월 3회',
            ].map(f => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                <span className="text-gray-700">{f}</span>
              </li>
            ))}
          </ul>

          <Link
            to="/"
            className="block w-full text-center py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            무료로 시작하기
          </Link>
        </div>

        {/* Pro */}
        <div className="bg-white rounded-2xl border-2 border-blue-500 p-7 relative shadow-lg shadow-blue-100/50">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm">
              추천
            </span>
          </div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">프로</h2>
            <div className="mt-3">
              <span className="text-4xl font-bold text-blue-600">₩9,900</span>
              <span className="text-gray-500">/월</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              크리에이터 · 투자자를 위한 프리미엄 분석
            </p>
            <p className="text-xs text-blue-500 mt-1">하루 약 330원 — 커피 한 잔 값으로</p>
          </div>

          <ul className="space-y-2.5 mb-6">
            {[
              '무료 플랜의 모든 기능',
              '투자 스코어보드 전 지역 열람',
              'AI 시장 코멘터리 + 과열/기회 신호',
              '고해상도 차트 (3x) + 커스텀 브랜딩',
              '워터마크 완전 제거',
              '맞춤 리포트 무제한 생성',
              '텔레그램 프리미엄 채널 (매일 + 딥다이브)',
              'CSV 데이터 다운로드',
              '우선 고객 지원',
            ].map(f => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <span className="text-blue-500 mt-0.5 flex-shrink-0">✓</span>
                <span className="text-gray-700">{f}</span>
              </li>
            ))}
          </ul>

          {currentPro ? (
            <div className="space-y-2">
              <div className="w-full text-center py-2.5 rounded-lg bg-green-100 text-green-700 font-medium text-sm">
                현재 구독 중
              </div>
              <button
                onClick={handleTogglePro}
                className="w-full text-center py-2 rounded-lg text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                구독 해지
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleTogglePro}
                className="block w-full text-center py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                7일 무료 체험 시작
              </button>
              <p className="text-xs text-gray-400 text-center">
                체험 후 자동 결제 · 언제든 해지 가능
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Feature comparison detail */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-900 text-center mb-6">프로만의 차별점</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRO_FEATURES.map(f => (
            <div key={f.title} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <p className="text-2xl mb-2">{f.icon}</p>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-xs text-gray-600 mb-2">{f.desc}</p>
              <p className="text-[10px] text-gray-400 bg-gray-50 rounded px-2 py-1 inline-block">
                무료: {f.free}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Social proof / Use case */}
      <div className="max-w-4xl mx-auto bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
        <h2 className="text-xl font-bold mb-6 text-center">이런 분들이 사용합니다</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              emoji: '🎬',
              title: '부동산 유튜버',
              desc: '영상에 바로 쓸 수 있는 고품질 차트와 주간 트렌드 데이터. 커스텀 브랜딩으로 나만의 콘텐츠를 만드세요.',
            },
            {
              emoji: '📊',
              title: '부동산 블로거',
              desc: '실거래가·전세가율·투자분석 차트를 워터마크 없이 블로그에 삽입. SEO 친화적 데이터 시각화.',
            },
            {
              emoji: '🏠',
              title: '투자자 / 중개사',
              desc: '지역별 투자 스코어보드로 기회를 빠르게 포착. 고객에게 데이터 기반 분석 리포트 제공.',
            },
          ].map(item => (
            <div key={item.title} className="text-center">
              <p className="text-3xl mb-2">{item.emoji}</p>
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-900 text-center mb-6">자주 묻는 질문</h2>
        <div className="space-y-3">
          <FaqItem
            q="데이터는 어디서 오나요?"
            a="국토교통부 실거래가 공개시스템(공공데이터포털)의 공식 API를 통해 수집합니다. 매주 자동으로 최신 데이터가 업데이트됩니다."
          />
          <FaqItem
            q="다운로드한 차트를 영상/블로그에 사용해도 되나요?"
            a="네! 무료 플랜은 워터마크가 포함되며, 프로 플랜은 워터마크 없이 자유롭게 사용 가능합니다. 상업적 이용(유튜브 수익화, 블로그 등) 모두 허용됩니다."
          />
          <FaqItem
            q="투자 스코어보드는 투자 추천인가요?"
            a="아닙니다. 투자 스코어보드는 공공데이터 기반 정량 분석 참고 자료이며, 투자 권유나 추천이 아닙니다. 투자 결정 전 반드시 현장 조사와 전문가 상담을 병행하세요."
          />
          <FaqItem
            q="맞춤 리포트는 어떤 건가요?"
            a="원하는 지역이나 아파트 단지를 선택하면, 실거래가 추이·전세가율·거래량·주변 시세 비교를 포함한 상세 분석 리포트를 자동 생성합니다. 유튜브 영상 자료로 바로 활용할 수 있습니다."
          />
          <FaqItem
            q="결제는 어떻게 하나요?"
            a="현재 텔레그램 채널을 통해 구독 결제를 진행합니다. 추후 카드/계좌이체 자동결제가 추가될 예정입니다."
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
