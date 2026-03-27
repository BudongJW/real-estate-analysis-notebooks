/**
 * Recharts 컨테이너를 PNG로 다운로드
 * - free: 워터마크 포함, 2x
 * - pro: 워터마크 없음/커스텀 + 고해상도 3x + 타이틀/출처 삽입
 */

export type ExportOptions = {
  isPro?: boolean
  title?: string
  source?: string
  bgColor?: string        // 배경색 (다크 테마 등)
  textColor?: string      // 텍스트 색상
  brandText?: string      // 커스텀 워터마크 (Pro)
  scale?: number           // 해상도 배율
  padding?: number         // 여백
}

const DEFAULT_WATERMARK = '부동산 시장 분석 대시보드 | budongjw.github.io'

export function downloadChartAsPng(
  containerId: string,
  filename: string,
  options: ExportOptions | boolean = false,
) {
  // backward compat: if boolean passed, treat as isPro
  const opts: ExportOptions = typeof options === 'boolean'
    ? { isPro: options }
    : options

  const {
    isPro = false,
    title,
    source,
    bgColor = '#ffffff',
    textColor = bgColor === '#ffffff' ? '#111827' : '#f3f4f6',
    brandText,
    scale: customScale,
    padding = 20,
  } = opts

  const container = document.getElementById(containerId)
  if (!container) return

  const svg = container.querySelector('svg')
  if (!svg) return

  const svgData = new XMLSerializer().serializeToString(svg)
  const { width, height } = svg.getBoundingClientRect()
  const scale = customScale || (isPro ? 3 : 2)

  // Calculate canvas dimensions
  const titleHeight = title ? 40 : 0
  const watermarkHeight = (isPro && !brandText) ? 0 : 30
  const sourceHeight = source ? 24 : 0
  const totalHeight = padding + titleHeight + height + sourceHeight + watermarkHeight + padding
  const totalWidth = width + padding * 2

  const canvas = document.createElement('canvas')
  canvas.width = totalWidth * scale
  canvas.height = totalHeight * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.scale(scale, scale)

  const img = new Image()
  img.onload = () => {
    // Background
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, totalWidth, totalHeight)

    let yPos = padding

    // Title
    if (title) {
      ctx.fillStyle = textColor
      ctx.font = 'bold 16px "Pretendard", system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(title, padding, yPos + 20)
      yPos += titleHeight
    }

    // Chart
    ctx.drawImage(img, padding, yPos, width, height)
    yPos += height

    // Source line
    if (source) {
      ctx.fillStyle = textColor
      ctx.globalAlpha = 0.5
      ctx.font = '11px "Pretendard", system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`출처: ${source}`, padding, yPos + 16)
      ctx.globalAlpha = 1
      yPos += sourceHeight
    }

    // Watermark / Branding
    if (isPro && brandText) {
      // Pro custom branding
      ctx.fillStyle = textColor
      ctx.globalAlpha = 0.4
      ctx.font = '12px "Pretendard", system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(brandText, totalWidth / 2, yPos + 18)
      ctx.globalAlpha = 1
    } else if (!isPro) {
      // Free watermark
      ctx.fillStyle = textColor
      ctx.globalAlpha = 0.15
      ctx.font = '13px "Pretendard", system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(DEFAULT_WATERMARK, totalWidth / 2, yPos + 18)
      ctx.globalAlpha = 1
    }

    const link = document.createElement('a')
    link.download = `${filename}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
}
