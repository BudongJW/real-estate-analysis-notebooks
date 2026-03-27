/** 만원 단위를 한글 표기로 변환 (예: 198000 → "19억 8,000만원") */
export function formatPrice(man: number): string {
  if (man >= 10000) {
    const eok = Math.floor(man / 10000)
    const rest = man % 10000
    if (rest === 0) return `${eok}억`
    return `${eok}억 ${rest.toLocaleString()}만`
  }
  return `${man.toLocaleString()}만`
}

/** 만원 → "19.8억" 형태의 축약 표기 */
export function formatPriceShort(man: number): string {
  if (man >= 10000) {
    return `${(man / 10000).toFixed(1)}억`
  }
  return `${(man / 1000).toFixed(1)}천만`
}

/** 숫자에 콤마 */
export function formatNumber(n: number): string {
  return n.toLocaleString('ko-KR')
}

/** 날짜 포맷 */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}
