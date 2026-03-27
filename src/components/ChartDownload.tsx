import { useState, useRef, useEffect } from 'react'
import { downloadChartAsPng } from '../lib/download'
import type { ExportOptions } from '../lib/download'

type ChartDownloadProps = {
  chartId: string
  filename: string
  title?: string
  source?: string
}

const BG_PRESETS = [
  { label: '화이트', value: '#ffffff' },
  { label: '다크', value: '#111827' },
  { label: '네이비', value: '#1e293b' },
  { label: '크림', value: '#fefce8' },
]

export function ChartDownload({ chartId, filename, title, source }: ChartDownloadProps) {
  const isPro = localStorage.getItem('subscription_tier') === 'pro'
  const [showPanel, setShowPanel] = useState(false)
  const [bgColor, setBgColor] = useState('#ffffff')
  const [brandText, setBrandText] = useState('')
  const [includeTitle, setIncludeTitle] = useState(true)
  const [includeSource, setIncludeSource] = useState(true)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false)
      }
    }
    if (showPanel) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showPanel])

  const handleQuickDownload = () => {
    downloadChartAsPng(chartId, filename, { isPro })
  }

  const handleCustomDownload = () => {
    const opts: ExportOptions = {
      isPro,
      bgColor,
      title: includeTitle ? title : undefined,
      source: includeSource ? (source || '국토교통부 실거래가 공개시스템') : undefined,
      brandText: brandText || undefined,
    }
    downloadChartAsPng(chartId, filename, opts)
    setShowPanel(false)
  }

  return (
    <div className="relative" ref={panelRef}>
      <div className="flex items-center gap-1">
        <button
          onClick={handleQuickDownload}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          title="PNG 다운로드"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          PNG
        </button>
        <button
          onClick={() => setShowPanel(!showPanel)}
          className={`inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            isPro
              ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
              : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
          }`}
          title={isPro ? '내보내기 설정' : 'Pro 전용 기능'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Export settings panel */}
      {showPanel && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-gray-200 shadow-lg p-4 z-50 space-y-3">
          {!isPro && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-700">
              Pro 구독 시 워터마크 제거, 커스텀 브랜딩, 고해상도(3x) 내보내기 가능
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">배경색</label>
            <div className="flex gap-1.5">
              {BG_PRESETS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setBgColor(p.value)}
                  className={`flex-1 py-1.5 rounded-md text-[10px] font-medium border transition-colors ${
                    bgColor === p.value
                      ? 'border-blue-400 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="inline-block w-3 h-3 rounded-full mr-1 align-middle border border-gray-300" style={{ backgroundColor: p.value }} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {title && (
            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
              <input type="checkbox" checked={includeTitle} onChange={e => setIncludeTitle(e.target.checked)}
                className="accent-blue-600 w-3.5 h-3.5" />
              제목 포함: "{title}"
            </label>
          )}

          <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
            <input type="checkbox" checked={includeSource} onChange={e => setIncludeSource(e.target.checked)}
              className="accent-blue-600 w-3.5 h-3.5" />
            출처 표기
          </label>

          {isPro && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">커스텀 브랜딩</label>
              <input
                type="text"
                value={brandText}
                onChange={e => setBrandText(e.target.value)}
                placeholder="예: 부동산전문 OOO 채널"
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs"
              />
            </div>
          )}

          <button
            onClick={handleCustomDownload}
            className="w-full py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isPro ? '고해상도 PNG 다운로드 (3x)' : 'PNG 다운로드 (2x)'}
          </button>
        </div>
      )}
    </div>
  )
}
