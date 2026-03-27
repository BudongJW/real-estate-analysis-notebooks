import { downloadChartAsPng } from '../lib/download'

type ChartDownloadProps = {
  chartId: string
  filename: string
}

export function ChartDownload({ chartId, filename }: ChartDownloadProps) {
  return (
    <button
      onClick={() => downloadChartAsPng(chartId, filename)}
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
  )
}
