/**
 * Recharts 컨테이너를 PNG로 다운로드
 * - free: 워터마크 포함
 * - pro: 워터마크 없음 + 고해상도
 */
export function downloadChartAsPng(
  containerId: string,
  filename: string,
  isPro = false,
) {
  const container = document.getElementById(containerId)
  if (!container) return

  const svg = container.querySelector('svg')
  if (!svg) return

  const svgData = new XMLSerializer().serializeToString(svg)
  const { width, height } = svg.getBoundingClientRect()
  const scale = isPro ? 3 : 2
  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = (height + (isPro ? 0 : 40)) * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.scale(scale, scale)

  const img = new Image()
  img.onload = () => {
    // 배경
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 차트
    ctx.drawImage(img, 0, 0, width, height)

    // 워터마크 (무료)
    if (!isPro) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(
        '부동산 시장 분석 대시보드 | budongjw.github.io',
        width / 2,
        height + 25,
      )
    }

    const link = document.createElement('a')
    link.download = `${filename}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
}
