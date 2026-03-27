import { useEffect, useState, useMemo } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
} from 'recharts'
import { formatNumber, formatPriceShort } from '../lib/format'
import { ChartDownload } from '../components/ChartDownload'

type JeonseData = {
  updated: string
  data: {
    region: string
    tradeMedian: number
    jeonseMedian: number
    ratio: number
    tradeSamples: number
    jeonseSamples: number
  }[]
}

type TradeRegion = {
  code: string
  monthly: { month: string; median: number; min: number; max: number; count: number }[]
  recent: { name: string; dong: string; area: number; floor: number; price: number; date: string; year: number }[]
}

type TradeData = {
  updated: string
  regions: Record<string, TradeRegion>
}

type RegionScore = {
  region: string
  // Raw data
  tradeMedian: number
  jeonseMedian: number
  jeonseRatio: number
  gapAmount: number       // 갭 (매매가 - 전세가)
  priceGrowth6m: number   // 6개월 시세 변동률 (%)
  volumeTrend: number     // 거래량 변동 추세
  tradeSamples: number
  // Scores (0~100)
  gapScore: number        // 갭 적정성 (낮을수록 좋음 → 높은 점수)
  momentumScore: number   // 가격 모멘텀
  liquidityScore: number  // 유동성 (거래량)
  safetyScore: number     // 안전성 (전세가율 적정 = 안전)
  valueScore: number      // 가성비 (중위가 대비 갭)
  totalScore: number      // 종합 점수
  grade: 'S' | 'A' | 'B' | 'C' | 'D'
  recommendation: string
}

function calcGrade(score: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  if (score >= 80) return 'S'
  if (score >= 65) return 'A'
  if (score >= 50) return 'B'
  if (score >= 35) return 'C'
  return 'D'
}

function gradeColor(grade: string) {
  switch (grade) {
    case 'S': return 'text-amber-500'
    case 'A': return 'text-blue-600'
    case 'B': return 'text-green-600'
    case 'C': return 'text-orange-500'
    case 'D': return 'text-red-500'
    default: return 'text-gray-500'
  }
}

function gradeBg(grade: string) {
  switch (grade) {
    case 'S': return 'bg-amber-50 border-amber-200'
    case 'A': return 'bg-blue-50 border-blue-200'
    case 'B': return 'bg-green-50 border-green-200'
    case 'C': return 'bg-orange-50 border-orange-200'
    case 'D': return 'bg-red-50 border-red-200'
    default: return 'bg-gray-50 border-gray-200'
  }
}

function scoreBarColor(score: number) {
  if (score >= 70) return '#22c55e'
  if (score >= 50) return '#3b82f6'
  if (score >= 30) return '#f59e0b'
  return '#ef4444'
}

function getRecommendation(s: RegionScore): string {
  if (s.totalScore >= 80) return '적극 매수 검토 — 갭 적정, 상승 모멘텀, 거래 활발'
  if (s.totalScore >= 65) return '매수 관심 — 지표 양호, 세부 단지 분석 필요'
  if (s.totalScore >= 50) return '중립 — 일부 긍정 신호, 리스크 요인 병존'
  if (s.totalScore >= 35) return '관망 권고 — 리스크 요인 우세, 추이 지켜볼 것'
  return '주의 — 투자 리스크 높음, 신중한 접근 필요'
}

export function InvestScore() {
  const [jeonseData, setJeonseData] = useState<JeonseData | null>(null)
  const [tradeData, setTradeData] = useState<TradeData | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [isPro] = useState(() => localStorage.getItem('subscription_tier') === 'pro')

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/jeonse.json`).then(r => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/trades.json`).then(r => r.json()),
    ]).then(([j, t]: [JeonseData, TradeData]) => {
      setJeonseData(j)
      setTradeData(t)
    })
  }, [])

  const scores: RegionScore[] = useMemo(() => {
    if (!jeonseData || !tradeData) return []

    return jeonseData.data
      .filter(j => tradeData.regions[j.region])
      .map(j => {
        const trade = tradeData.regions[j.region]
        const monthly = trade.monthly
        const first = monthly[0]
        const last = monthly[monthly.length - 1]

        // 6개월 가격 변동률
        const priceGrowth6m = ((last.median - first.median) / first.median) * 100

        // 거래량 변동 추세 (최근 3개월 평균 vs 이전 3개월 평균)
        const recentVol = monthly.slice(-3).reduce((s, m) => s + m.count, 0) / 3
        const prevVol = monthly.slice(0, 3).reduce((s, m) => s + m.count, 0) / 3
        const volumeTrend = ((recentVol - prevVol) / prevVol) * 100

        const gapAmount = j.tradeMedian - j.jeonseMedian

        // 점수 계산 (각 0~100)
        // 갭 적정성: 전세가율 60~70%가 갭투자 적정 → 높은 점수
        const gapScore = Math.max(0, Math.min(100,
          j.ratio >= 55 && j.ratio <= 75
            ? 60 + (1 - Math.abs(j.ratio - 65) / 10) * 40
            : j.ratio > 75 ? Math.max(0, 100 - (j.ratio - 75) * 5) : Math.max(0, (j.ratio - 40) * 4)
        ))

        // 모멘텀: 상승률 높을수록 높은 점수
        const momentumScore = Math.max(0, Math.min(100, 50 + priceGrowth6m * 8))

        // 유동성: 거래량 트렌드
        const liquidityScore = Math.max(0, Math.min(100, 50 + volumeTrend * 1.5))

        // 안전성: 전세가율 45~65%가 안전 (역전세 리스크 낮음)
        const safetyScore = Math.max(0, Math.min(100,
          j.ratio <= 65 ? 80 + (65 - j.ratio) * 0.5
            : j.ratio <= 75 ? Math.max(30, 80 - (j.ratio - 65) * 5)
            : Math.max(0, 30 - (j.ratio - 75) * 3)
        ))

        // 가성비: 갭 대비 매매가
        const valueRatio = gapAmount / j.tradeMedian
        const valueScore = Math.max(0, Math.min(100,
          valueRatio <= 0.3 ? 90 - valueRatio * 100
            : valueRatio <= 0.5 ? 70 - (valueRatio - 0.3) * 150
            : Math.max(10, 40 - (valueRatio - 0.5) * 100)
        ))

        const totalScore = Math.round(
          gapScore * 0.25 + momentumScore * 0.2 + liquidityScore * 0.15 + safetyScore * 0.25 + valueScore * 0.15
        )

        const result: RegionScore = {
          region: j.region,
          tradeMedian: j.tradeMedian,
          jeonseMedian: j.jeonseMedian,
          jeonseRatio: j.ratio,
          gapAmount,
          priceGrowth6m: Math.round(priceGrowth6m * 10) / 10,
          volumeTrend: Math.round(volumeTrend * 10) / 10,
          tradeSamples: j.tradeSamples,
          gapScore: Math.round(gapScore),
          momentumScore: Math.round(momentumScore),
          liquidityScore: Math.round(liquidityScore),
          safetyScore: Math.round(safetyScore),
          valueScore: Math.round(valueScore),
          totalScore,
          grade: calcGrade(totalScore),
          recommendation: '',
        }
        result.recommendation = getRecommendation(result)
        return result
      })
      .sort((a, b) => b.totalScore - a.totalScore)
  }, [jeonseData, tradeData])

  const selected = useMemo(() =>
    scores.find(s => s.region === selectedRegion) || scores[0],
    [scores, selectedRegion]
  )

  useEffect(() => {
    if (scores.length > 0 && !selectedRegion) {
      setSelectedRegion(scores[0].region)
    }
  }, [scores, selectedRegion])

  if (!jeonseData || !tradeData || scores.length === 0) {
    return <div className="flex justify-center py-20 text-gray-400">로딩 중...</div>
  }

  const radarData = selected ? [
    { metric: '갭 적정성', score: selected.gapScore, fullMark: 100 },
    { metric: '가격 모멘텀', score: selected.momentumScore, fullMark: 100 },
    { metric: '유동성', score: selected.liquidityScore, fullMark: 100 },
    { metric: '안전성', score: selected.safetyScore, fullMark: 100 },
    { metric: '가성비', score: selected.valueScore, fullMark: 100 },
  ] : []

  const rankChart = scores.map(s => ({
    region: s.region.replace('서울 ', '').replace('경기 ', ''),
    score: s.totalScore,
    grade: s.grade,
  }))

  // Free tier: show only top 4 regions in detail
  const freeLimit = 4
  const visibleScores = isPro ? scores : scores.slice(0, freeLimit)
  const hasLockedContent = !isPro && scores.length > freeLimit

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">투자 스코어보드</h1>
        <p className="text-gray-500 mt-1">지역별 갭투자 기회 분석 — 5대 지표 종합 스코어링</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            PREMIUM
          </span>
          <span className="text-xs text-gray-400">주간 자동 업데이트 · 데이터 기준: {jeonseData.updated}</span>
        </div>
      </div>

      {/* Score ranking overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">종합 투자 스코어 랭킹</h2>
          <ChartDownload chartId="score-ranking" filename="투자스코어_랭킹" />
        </div>
        <div id="score-ranking">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={rankChart} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis dataKey="region" type="category" tick={{ fontSize: 11 }} width={95} />
              <Tooltip formatter={(v) => `${v}점`} />
              <Bar dataKey="score" name="종합 점수" radius={[0, 6, 6, 0]}>
                {rankChart.map((entry, i) => (
                  <Cell key={i} fill={scoreBarColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Region cards grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visibleScores.map(s => (
          <button
            key={s.region}
            onClick={() => setSelectedRegion(s.region)}
            className={`text-left rounded-xl border p-4 transition-all ${
              selectedRegion === s.region
                ? 'ring-2 ring-blue-500 border-blue-300 bg-blue-50/50'
                : `${gradeBg(s.grade)} hover:shadow-md`
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">{s.region}</span>
              <span className={`text-2xl font-black ${gradeColor(s.grade)}`}>{s.grade}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.totalScore}<span className="text-sm text-gray-400 font-normal">/100</span></p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">중위 매매가</span>
                <span className="font-medium">{formatPriceShort(s.tradeMedian)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">갭</span>
                <span className="font-medium">{formatPriceShort(s.gapAmount)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">6개월 변동</span>
                <span className={`font-medium ${s.priceGrowth6m >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                  {s.priceGrowth6m >= 0 ? '+' : ''}{s.priceGrowth6m}%
                </span>
              </div>
            </div>
          </button>
        ))}

        {/* Locked cards for free tier */}
        {hasLockedContent && scores.slice(freeLimit).map((s, i) => (
          <div key={i} className="relative rounded-xl border border-gray-200 p-4 bg-gray-50 opacity-60">
            <div className="blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">{s.region}</span>
                <span className="text-2xl font-black text-gray-400">?</span>
              </div>
              <p className="text-2xl font-bold text-gray-400">??<span className="text-sm font-normal">/100</span></p>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-full">
                🔒 Pro 전용
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Selected region detail */}
      {selected && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Radar chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">{selected.region} 상세 분석</h3>
              <ChartDownload chartId="radar-detail" filename={`${selected.region}_투자분석`} />
            </div>
            <div id="radar-detail">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => `${v}점`} />
                  <Radar name="점수" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Score breakdown */}
          <div className="space-y-4">
            <div className={`rounded-xl border p-5 ${gradeBg(selected.grade)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">종합 투자 등급</p>
                  <p className={`text-4xl font-black mt-1 ${gradeColor(selected.grade)}`}>{selected.grade}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">{selected.totalScore}</p>
                  <p className="text-xs text-gray-500">/ 100점</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">{selected.recommendation}</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">5대 지표 상세</h4>
              <div className="space-y-3">
                {[
                  { label: '갭 적정성', score: selected.gapScore, desc: `전세가율 ${selected.jeonseRatio}% · 갭 ${formatPriceShort(selected.gapAmount)}`, weight: '25%' },
                  { label: '안전성', score: selected.safetyScore, desc: '역전세 리스크 · 전세가율 안정성', weight: '25%' },
                  { label: '가격 모멘텀', score: selected.momentumScore, desc: `6개월 ${selected.priceGrowth6m >= 0 ? '+' : ''}${selected.priceGrowth6m}% 변동`, weight: '20%' },
                  { label: '유동성', score: selected.liquidityScore, desc: `거래량 추세 ${selected.volumeTrend >= 0 ? '+' : ''}${selected.volumeTrend}%`, weight: '15%' },
                  { label: '가성비', score: selected.valueScore, desc: `중위가 ${formatPriceShort(selected.tradeMedian)} 대비 갭`, weight: '15%' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{item.label} <span className="text-gray-400 text-xs">({item.weight})</span></span>
                      <span className="font-bold" style={{ color: scoreBarColor(item.score) }}>{item.score}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${item.score}%`, backgroundColor: scoreBarColor(item.score) }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">핵심 수치</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">중위 매매가</p>
                  <p className="text-lg font-bold text-gray-900">{formatPriceShort(selected.tradeMedian)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">중위 전세가</p>
                  <p className="text-lg font-bold text-gray-900">{formatPriceShort(selected.jeonseMedian)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">필요 갭 자금</p>
                  <p className="text-lg font-bold text-blue-700">{formatPriceShort(selected.gapAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">월 거래량</p>
                  <p className="text-lg font-bold text-gray-900">{formatNumber(selected.tradeSamples)}건</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scoring methodology */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">스코어링 방법론</h3>
        <div className="grid md:grid-cols-5 gap-4 text-xs text-gray-600">
          <div>
            <p className="font-semibold text-gray-800 mb-1">갭 적정성 (25%)</p>
            <p>전세가율 60~70%를 적정 구간으로 설정. 과도한 갭은 자본 효율 하락, 너무 높은 전세가율은 역전세 리스크</p>
          </div>
          <div>
            <p className="font-semibold text-gray-800 mb-1">안전성 (25%)</p>
            <p>전세가율 65% 이하를 안전 구간으로 판단. 역전세 발생 가능성과 보증금 반환 리스크 평가</p>
          </div>
          <div>
            <p className="font-semibold text-gray-800 mb-1">가격 모멘텀 (20%)</p>
            <p>최근 6개월 중위 매매가 변동률 기반. 상승 추세일수록 높은 점수</p>
          </div>
          <div>
            <p className="font-semibold text-gray-800 mb-1">유동성 (15%)</p>
            <p>최근 3개월 vs 이전 3개월 거래량 비교. 거래 활성화 구간이 매도 용이성 향상</p>
          </div>
          <div>
            <p className="font-semibold text-gray-800 mb-1">가성비 (15%)</p>
            <p>매매가 대비 갭 비율 평가. 적은 자본으로 높은 가치의 자산 보유 가능성</p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800">
          <strong>주의:</strong> 투자 스코어는 공공데이터 기반 정량 분석이며, 투자 권유가 아닙니다.
          재건축·재개발 호재, 정책 변동, 개별 단지 특성 등은 반영되지 않습니다.
          투자 결정 전 반드시 현장 조사와 전문가 상담을 병행하세요.
        </p>
      </div>
    </div>
  )
}
