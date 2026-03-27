import { useEffect, useState } from 'react'

export function Report() {
  const [markdown, setMarkdown] = useState<string>('')
  const [loading, setLoading] = useState(true)

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

      {markdown ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
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

      {/* CTA: Telegram subscription */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">텔레그램에서 매주 받아보세요</h2>
            <p className="text-blue-100 text-sm">
              매주 월요일 오전, 주요 지역 매매가·전세가율·거래량 분석 리포트를
              텔레그램 채널로 무료 발송합니다.
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

/** 간단한 마크다운 → HTML 렌더러 (외부 의존성 없이) */
function MarkdownRenderer({ content }: { content: string }) {
  const html = content
    .split('\n')
    .map(line => {
      // Headers
      if (line.startsWith('# ')) return `<h1 class="text-2xl font-bold mt-6 mb-3">${line.slice(2)}</h1>`
      if (line.startsWith('## ')) return `<h2 class="text-xl font-semibold mt-5 mb-2">${line.slice(3)}</h2>`
      if (line.startsWith('### ')) return `<h3 class="text-lg font-medium mt-4 mb-1">${line.slice(4)}</h3>`
      // HR
      if (line.startsWith('---')) return '<hr class="my-4 border-gray-200" />'
      // Bold
      line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Links
      line = line.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank">$1</a>')
      // Code
      line = line.replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>')
      // Italic
      line = line.replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Table
      if (line.startsWith('|')) {
        const cells = line.split('|').filter(c => c.trim()).map(c => c.trim())
        if (cells.every(c => c.match(/^[-:]+$/))) return '' // separator row
        const tag = line.includes('---') ? 'th' : 'td'
        const cls = tag === 'th' ? 'bg-gray-50 font-medium text-gray-600' : ''
        return `<tr>${cells.map(c => `<${tag} class="px-3 py-2 border border-gray-100 text-sm ${cls}">${c}</${tag}>`).join('')}</tr>`
      }
      // List
      if (line.startsWith('- ')) return `<li class="ml-4 text-sm text-gray-700">${line.slice(2)}</li>`
      // Empty
      if (!line.trim()) return '<br/>'
      // Paragraph
      return `<p class="text-sm text-gray-700 leading-relaxed">${line}</p>`
    })
    .join('\n')

  const wrapped = html.includes('<tr>') ? html.replace(/(<tr>.*?<\/tr>\n?)+/gs, (match) =>
    `<table class="w-full border-collapse my-3">${match}</table>`
  ) : html

  return <div dangerouslySetInnerHTML={{ __html: wrapped }} />
}
