/**
 * 구독 상태 관리 (localStorage 기반)
 * 실제 결제 연동 전 단계 — 클라이언트 사이드 상태만 관리
 */

export type SubscriptionTier = 'free' | 'pro'

export function getSubscriptionTier(): SubscriptionTier {
  return (localStorage.getItem('subscription_tier') as SubscriptionTier) || 'free'
}

export function setSubscriptionTier(tier: SubscriptionTier) {
  localStorage.setItem('subscription_tier', tier)
  window.dispatchEvent(new CustomEvent('subscription-change', { detail: { tier } }))
}

export function isPro(): boolean {
  return getSubscriptionTier() === 'pro'
}

/**
 * Pro 전용 기능 목록
 * - 투자 스코어보드 전체 지역 열람
 * - 차트 고해상도 내보내기 (3x) + 커스텀 브랜딩
 * - 주간 프리미엄 리포트 (AI 코멘터리 포함)
 * - 맞춤 리포트 무제한 생성
 * - 워터마크 제거
 */
export const PRO_FEATURES = [
  {
    icon: '🎯',
    title: '투자 스코어보드 전체 열람',
    desc: '전 지역 투자 등급·상세 분석·레이더 차트',
    free: '상위 4개 지역만',
  },
  {
    icon: '📊',
    title: '고해상도 차트 내보내기',
    desc: '3x 해상도 + 다크/라이트 테마 + 커스텀 브랜딩',
    free: '2x + 워터마크',
  },
  {
    icon: '📝',
    title: '프리미엄 주간 리포트',
    desc: 'AI 투자 코멘터리 + 핵심 지표 하이라이트 + PDF',
    free: '기본 데이터 요약만',
  },
  {
    icon: '✨',
    title: '맞춤 리포트 무제한',
    desc: '원하는 지역·기간·지표로 자유롭게 생성',
    free: '월 3회 제한',
  },
  {
    icon: '🔔',
    title: '텔레그램 프리미엄 채널',
    desc: '실시간 시장 이상 신호 알림 + 주간 딥다이브',
    free: '주간 요약만',
  },
  {
    icon: '📈',
    title: '시장 모멘텀 지표',
    desc: '거래량 이상 감지, 가격 모멘텀, 과열/침체 신호',
    free: '기본 추이 차트만',
  },
]
