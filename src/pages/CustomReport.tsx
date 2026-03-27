import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar,
} from 'recharts'
import { formatPrice, formatPriceShort, formatDate, formatNumber } from '../lib/format'
import { ChartDownload } from '../components/ChartDownload'

type TradeRegion = {
  code: string
  monthly: { month: string; median: number; min: number; max: number; count: number }[]
  recent: { name: string; dong: string; area: number; floor: number; price: number; date: string; year: number }[]
}

type JeonseItem = {
  region: string
  tradeMedian: number
  jeonseMedian: number
  ratio: number
  tradeSamples: number
}

export function CustomReport() {
  const [regions, setRegions] = useState<Record<string, TradeRegion>>({})
  const [jeonseMap, setJeonseMap] = useState<Record<string, JeonseItem>>({})
  const [selected, setSelected] = useState('')
  const [generated, setGenerated] = useState(false)

  useEffect(() => {
    const base = import.meta.env.BASE_URL
    Promise.all([
      fetch(`${base}data/trades.json`).then(r => r.json()),
      fetch(`${base}data/jeonse.json`).then(r => r.json()),
    ]).then(([t, j]) => {
      setRegions(t.regions)
      const map: Record<string, JeonseItem> = {}
      j.data.forEach((d: JeonseItem) => { map[d.region] = d })
      setJeonseMap(map)
      setSelected(Object.keys(t.regions)[0])
    })
  }, [])

  if (!Object.keys(regions).length) {
    return <div className="flex justify-center py-20 text-gray-400">로딩 중...</div>
  }

  const region = selected ? regions[selected] : null
  const jeonse = selected ? jeonseMap[selected] : null

  const handleGenerate = () => {
    if (selected) setGenerated(true)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">맞춤 리포트 생성</h1>
        <p className="text-gray-500 mt-1">지역을 선택하면 유튜브 영상/블로그에 바로 활용 가능한 분석 리포트를 생성합니다</p>
      </div>

      {/* Region selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">지역 선택</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.keys(regions).map(name => (
            <button
              key={name}
              onClick={() => { setSelected(name); setGenerated(false) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selected === name
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
        <button
          onClick={handleGenerate}
          disabled={!selected}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
        >
          리포트 생성
        </button>
      </div>

      {/* Generated report */}
      {generated && region && (
        <div className="space-y-6" id="custom-report">
          {/* Report header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
            <p className="text-sm opacity-80">부동산 시장 분석 리포트</p>
            <h2 className="text-2xl font-bold mt-1">{selected}</h2>
            <p className="text-sm opacity-80 mt-1">{new Date().toLocaleDateString('ko-KR')} 기준</p>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">중위 매매가</p>
              <p className="text-lg font-bold text-gray-900">{formatPriceShort(region.monthly[region.monthly.length - 1].median)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">이번달 거래량</p>
              <p className="text-lg font-bold text-gray-900">{formatNumber(region.monthly[region.monthly.length - 1].count)}건</p>
            </div>
            {jeonse && (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs text-gray-500">전세 중위가</p>
                  <p className="text-lg font-bold text-gray-900">{formatPriceShort(jeonse.jeonseMedian)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs text-gray-500">전세가율</p>
                  <p className={`text-lg font-bold ${jeonse.ratio >= 60 ? 'text-red-600' : 'text-blue-600'}`}>
                    {jeonse.ratio}%
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Price trend chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">매매가 추이 (6개월)</h3>
              <ChartDownload chartId="report-chart-trend" filename={`${selected}_매매가추이`} />
            </div>
            <div id="report-chart-trend">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={region.monthly.map(m => ({
                  month: m.month.slice(5) + '월',
                  중위가: m.median,
                  최고가: m.max,
                  최저가: m.min,
                }))} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => formatPriceShort(v)} />
                  <Tooltip formatter={(v) => formatPrice(Number(v)) + '원'} />
                  <Line type="monotone" dataKey="최고가" stroke="#fca5a5" strokeDasharray="4 4" dot={false} />
                  <Line type="monotone" dataKey="중위가" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="최저가" stroke="#86efac" strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Volume chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">월별 거래량</h3>
              <ChartDownload chartId="report-chart-volume" filename={`${selected}_거래량`} />
            </div>
            <div id="report-chart-volume">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={region.monthly.map(m => ({
                  month: m.month.slice(5) + '월',
                  거래량: m.count,
                }))} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="거래량" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent transactions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">최근 거래 내역</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">아파트</th>
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">동</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">면적</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">층</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">거래가</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">거래일</th>
                  </tr>
                </thead>
                <tbody>
                  {region.recent.map((t, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-2 px-2 font-medium text-gray-900">{t.name}</td>
                      <td className="py-2 px-2 text-gray-600">{t.dong}</td>
                      <td className="py-2 px-2 text-right text-gray-600">{t.area}㎡</td>
                      <td className="py-2 px-2 text-right text-gray-600">{t.floor}층</td>
                      <td className="py-2 px-2 text-right font-semibold text-blue-700">{formatPrice(t.price)}원</td>
                      <td className="py-2 px-2 text-right text-gray-500">{formatDate(t.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Analysis summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-3">분석 요약</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              {(() => {
                const latest = region.monthly[region.monthly.length - 1]
                const prev = region.monthly[region.monthly.length - 2]
                const change = ((latest.median - prev.median) / prev.median * 100).toFixed(1)
                const isUp = Number(change) > 0
                return (
                  <>
                    <li>• {selected}의 이번달 중위 매매가는 <strong>{formatPrice(latest.median)}원</strong>으로 전월 대비 <strong className={isUp ? 'text-red-600' : 'text-blue-600'}>{isUp ? '+' : ''}{change}%</strong> 변동했습니다.</li>
                    <li>• 거래량은 <strong>{formatNumber(latest.count)}건</strong>으로, 전월({formatNumber(prev.count)}건) 대비 {latest.count > prev.count ? '증가' : '감소'}세입니다.</li>
                    <li>• 최저가({formatPrice(latest.min)}원)와 최고가({formatPrice(latest.max)}원) 사이 편차가 {formatPrice(latest.max - latest.min)}원입니다.</li>
                    {jeonse && <li>• 전세가율은 <strong>{jeonse.ratio}%</strong>로, {jeonse.ratio >= 60 ? '주의 구간에 진입했습니다. 갭투자 시 리스크 관리가 필요합니다.' : '안정적인 수준입니다.'}</li>}
                  </>
                )
              })()}
            </ul>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-400 py-4">
            <p>부동산 시장 분석 대시보드 | budongjw.github.io/real-estate-analysis-notebooks</p>
            <p>데이터 출처: 국토교통부 실거래가 공개시스템</p>
          </div>
        </div>
      )}
    </div>
  )
}
