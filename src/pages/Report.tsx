import { useEffect, useState } from 'react'
import { isPro } from '../lib/subscription'
import { Link } from 'react-router-dom'

export function Report() {
  const [markdown, setMarkdown] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const pro = isPro()

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}reports/latest.md`)
      .then(r => {
        if (!r.ok) throw new Error('not found')
        return r.text()
      })
      .then(setMarkdown)
      .catch(() => setMarkdown(''))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20 text-gray-400">로딩 중...</div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">주간 시장 리포트</h1>
        <p className="text-gray-500 mt-1">매주 자동 생성되는 부동산 시장 분석 리포트</p>
      </div>

      {/* Free Report */}
      {markdown ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">FREE</span>
            <span className="text-sm text-gray-500">기본 시장 데이터 요약</span>
          </div>
          <div className="prose prose-sm max-w-none">
            <MarkdownRenderer content={markdown} />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-6xl mb-4">📊</p>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">아직 리포트가 없습니다</h2>
          <p className="text-gray-500 mb-6">
            첫 번째 리포트는 GitHub Actions 워크플로우가 실행되면 자동 생성됩니다.
          </p>
          <p className="text-sm text-gray-400">
            수동 실행: <code className="bg-gray-100 px-2 py-0.5 rounded">python scripts/generate_report.py</code>
          </p>
        </div>
      )}

      {/* Premium Insight Preview */}
      <div className="relative">
        <div className={`bg-white rounded-xl border border-gray-200 p-6 md:p-8 ${!pro ? 'overflow-hidden' : ''}`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">PRO</span>
            <span className="text-sm text-gray-500">AI 투자 인사이트 & 핵심 지표 분석</span>
          </div>

          <div className={!pro ? 'blur-sm select-none pointer-events-none' : ''}>
            {/* Simulated premium content */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-xs text-red-500 font-medium mb-1">과열 신호</p>
                <p className="text-lg font-bold text-red-700">강남구, 송파구</p>
                <p className="text-xs text-red-400 mt-1">6개월 연속 상승 + 거래량 급증</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs text-blue-500 font-medium mb-1">기회 포착</p>
                <p className="text-lg font-bold text-blue-700">마포구, 성동구</p>
                <p className="text-xs text-blue-400 mt-1">전세가율 안정 + 가격 조정 구간</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-xs text-amber-500 font-medium mb-1">주의 구간</p>
                <p className="text-lg font-bold text-amber-700">노원구</p>
                <p className="text-xs text-amber-400 mt-1">전세가율 64.5% — 역전세 경계</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">AI 시장 코멘터리</h3>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed space-y-2">
                  <p>이번 주 서울 주요 권역은 전반적으로 상승 흐름을 유지했습니다. 특히 <strong>강남 3구(강남·서초·송파)</strong>는 6개월 연속 중위가 상승을 기록하며, 거래량도 전월 대비 13% 증가했습니다.</p>
                  <p><strong>마포구</strong>는 전세가율 60.2%로 갭투자 적정 구간에 진입했으며, 가격 모멘텀이 서서히 회복 중입니다. 중장기 투자 관점에서 주목할 만한 지역입니다.</p>
                  <p><strong>노원구</strong>의 전세가율 64.5%는 경계 수준입니다. 향후 전세 시장 약세 시 역전세 리스크가 존재하므로, 갭투자 진입 시 충분한 안전마진 확보가 필요합니다.</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">핵심 지표 하이라이트</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { label: '서울 평균 매매가 변동', value: '+1.8%', sub: '전월 대비', positive: true },
                    { label: '거래량 변동', value: '+13.2%', sub: '전월 대비', positive: true },
                    { label: '평균 전세가율', value: '57.8%', sub: '전월 58.1%', positive: false },
                    { label: '신규 매물 증감', value: '-5.4%', sub: '공급 감소 추세', positive: false },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-white border border-gray-100 rounded-lg p-3">
                      <div>
                        <p className="text-xs text-gray-500">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.sub}</p>
                      </div>
                      <p className={`text-lg font-bold ${item.positive ? 'text-red-600' : 'text-blue-600'}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Overlay for free users */}
          {!pro && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-xl">
              <div className="text-center px-6">
                <p className="text-4xl mb-3">🔒</p>
                <h3 className="text-lg font-bold text-gray-900 mb-2">프리미엄 인사이트</h3>
                <p className="text-sm text-gray-600 mb-4">AI 시장 코멘터리, 과열/기회 신호, 핵심 지표 분석을 받아보세요</p>
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Pro 구독하기 — 월 9,900원
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CTA: Telegram subscription */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">텔레그램에서 매주 받아보세요</h2>
            <p className="text-blue-100 text-sm">
              매주 월요일 오전, 주요 지역 매매가·전세가율·거래량 분석 리포트를
              텔레그램 채널로 무료 발송합니다.
              {pro && ' Pro 구독자는 프리미엄 딥다이브 리포트도 함께 받습니다.'}
            </p>
          </div>
          <a
            href="https://t.me/realestate_report_kr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            채널 구독하기
          </a>
        </div>
      </div>
    </div>
  )
}

/** 간단한 마크다운 -> HTML 렌더러 (외부 의존성 없이) */
function MarkdownRenderer({ content }: { content: string }) {
  const html = content
    .split('\n')
    .map(line => {
      if (line.startsWith('# ')) return `<h1 class="text-2xl font-bold mt-6 mb-3">${line.slice(2)}</h1>`
      if (line.startsWith('## ')) return `<h2 class="text-xl font-semibold mt-5 mb-2">${line.slice(3)}</h2>`
      if (line.startsWith('### ')) return `<h3 class="text-lg font-medium mt-4 mb-1">${line.slice(4)}</h3>`
      if (line.startsWith('---')) return '<hr class="my-4 border-gray-200" />'
      line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      line = line.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank">$1</a>')
      line = line.replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>')
      line = line.replace(/\*(.+?)\*/g, '<em>$1</em>')
      if (line.startsWith('|')) {
        const cells = line.split('|').filter(c => c.trim()).map(c => c.trim())
        if (cells.every(c => c.match(/^[-:]+$/))) return ''
        const tag = line.includes('---') ? 'th' : 'td'
        const cls = tag === 'th' ? 'bg-gray-50 font-medium text-gray-600' : ''
        return `<tr>${cells.map(c => `<${tag} class="px-3 py-2 border border-gray-100 text-sm ${cls}">${c}</${tag}>`).join('')}</tr>`
      }
      if (line.startsWith('- ')) return `<li class="ml-4 text-sm text-gray-700">${line.slice(2)}</li>`
      if (!line.trim()) return '<br/>'
      return `<p class="text-sm text-gray-700 leading-relaxed">${line}</p>`
    })
    .join('\n')

  const wrapped = html.includes('<tr>') ? html.replace(/(<tr>.*?<\/tr>\n?)+/gs, (match) =>
    `<table class="w-full border-collapse my-3">${match}</table>`
  ) : html

  return <div dangerouslySetInnerHTML={{ __html: wrapped }} />
}
