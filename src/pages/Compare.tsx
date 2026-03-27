import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import { ChartDownload } from '../components/ChartDownload'
import { formatPrice, formatPriceShort, formatNumber } from '../lib/format'

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

export function Compare() {
  const [regions, setRegions] = useState<Record<string, TradeRegion>>({})
  const [jeonseMap, setJeonseMap] = useState<Record<string, JeonseItem>>({})
  const [regionA, setRegionA] = useState('')
  const [regionB, setRegionB] = useState('')

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
      const keys = Object.keys(t.regions)
      setRegionA(keys[0])
      setRegionB(keys[1] || keys[0])
    })
  }, [])

  if (!Object.keys(regions).length) {
    return <div className="flex justify-center py-20 text-gray-400">로딩 중...</div>
  }

  const names = Object.keys(regions)
  const a = regions[regionA]
  const b = regions[regionB]
  const ja = jeonseMap[regionA]
  const jb = jeonseMap[regionB]

  // 추이 비교 데이터
  const trendData = a?.monthly.map((m, i) => ({
    month: m.month.slice(5) + '월',
    [regionA]: m.median,
    [regionB]: b?.monthly[i]?.median || 0,
  })) || []

  // 거래량 비교
  const volumeData = a?.monthly.map((m, i) => ({
    month: m.month.slice(5) + '월',
    [regionA]: m.count,
    [regionB]: b?.monthly[i]?.count || 0,
  })) || []

  // 레이더 차트 데이터 (정규화)
  const latestA = a?.monthly[a.monthly.length - 1]
  const latestB = b?.monthly[b.monthly.length - 1]
  const maxPrice = Math.max(latestA?.median || 0, latestB?.median || 0)
  const maxCount = Math.max(latestA?.count || 0, latestB?.count || 0)

  const radarData = [
    { metric: '중위가', A: ((latestA?.median || 0) / maxPrice * 100), B: ((latestB?.median || 0) / maxPrice * 100) },
    { metric: '거래량', A: ((latestA?.count || 0) / maxCount * 100), B: ((latestB?.count || 0) / maxCount * 100) },
    { metric: '전세가율', A: ja?.ratio || 0, B: jb?.ratio || 0 },
    { metric: '가격 범위', A: latestA ? ((latestA.max - latestA.min) / latestA.max * 100) : 0, B: latestB ? ((latestB.max - latestB.min) / latestB.max * 100) : 0 },
    { metric: '안정성', A: ja ? (100 - ja.ratio) : 50, B: jb ? (100 - jb.ratio) : 50 },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">지역 비교</h1>
        <p className="text-gray-500 mt-1">두 지역의 매매가, 거래량, 전세가율을 나란히 비교합니다</p>
      </div>

      {/* Region selectors */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">지역 A</p>
          <select
            value={regionA}
            onChange={e => setRegionA(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            {names.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-2">지역 B</p>
          <select
            value={regionB}
            onChange={e => setRegionB(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            {names.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Stat comparison */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">핵심 지표 비교</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-2 text-gray-500 font-medium">지표</th>
                <th className="text-right py-3 px-2 text-blue-600 font-medium">{regionA}</th>
                <th className="text-right py-3 px-2 text-emerald-600 font-medium">{regionB}</th>
                <th className="text-right py-3 px-2 text-gray-500 font-medium">차이</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-50">
                <td className="py-3 px-2 text-gray-700">중위 매매가</td>
                <td className="py-3 px-2 text-right font-semibold">{formatPrice(latestA?.median || 0)}원</td>
                <td className="py-3 px-2 text-right font-semibold">{formatPrice(latestB?.median || 0)}원</td>
                <td className="py-3 px-2 text-right text-gray-500">{formatPrice(Math.abs((latestA?.median || 0) - (latestB?.median || 0)))}원</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="py-3 px-2 text-gray-700">거래량</td>
                <td className="py-3 px-2 text-right">{formatNumber(latestA?.count || 0)}건</td>
                <td className="py-3 px-2 text-right">{formatNumber(latestB?.count || 0)}건</td>
                <td className="py-3 px-2 text-right text-gray-500">{formatNumber(Math.abs((latestA?.count || 0) - (latestB?.count || 0)))}건</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="py-3 px-2 text-gray-700">전세가율</td>
                <td className="py-3 px-2 text-right">{ja?.ratio || '-'}%</td>
                <td className="py-3 px-2 text-right">{jb?.ratio || '-'}%</td>
                <td className="py-3 px-2 text-right text-gray-500">{ja && jb ? `${Math.abs(ja.ratio - jb.ratio).toFixed(1)}%p` : '-'}</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="py-3 px-2 text-gray-700">전세 중위가</td>
                <td className="py-3 px-2 text-right">{ja ? formatPrice(ja.jeonseMedian) + '원' : '-'}</td>
                <td className="py-3 px-2 text-right">{jb ? formatPrice(jb.jeonseMedian) + '원' : '-'}</td>
                <td className="py-3 px-2 text-right text-gray-500">{ja && jb ? formatPrice(Math.abs(ja.jeonseMedian - jb.jeonseMedian)) + '원' : '-'}</td>
              </tr>
              <tr>
                <td className="py-3 px-2 text-gray-700">갭 (매매-전세)</td>
                <td className="py-3 px-2 text-right">{ja ? formatPrice(ja.tradeMedian - ja.jeonseMedian) + '원' : '-'}</td>
                <td className="py-3 px-2 text-right">{jb ? formatPrice(jb.tradeMedian - jb.jeonseMedian) + '원' : '-'}</td>
                <td className="py-3 px-2 text-right text-gray-500">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Price trend comparison */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">매매가 추이 비교</h2>
          <ChartDownload chartId="compare-trend" filename="지역비교_매매가추이" />
        </div>
        <div id="compare-trend">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => formatPriceShort(v)} />
              <Tooltip formatter={(v) => formatPrice(Number(v)) + '원'} />
              <Legend />
              <Line type="monotone" dataKey={regionA} stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey={regionB} stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Volume comparison */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">거래량 비교</h2>
          <ChartDownload chartId="compare-volume" filename="지역비교_거래량" />
        </div>
        <div id="compare-volume">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={volumeData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={regionA} stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name={regionA + ' 거래량'} />
              <Line type="monotone" dataKey={regionB} stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name={regionB + ' 거래량'} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Radar comparison */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">종합 비교 (레이더)</h2>
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis tick={false} domain={[0, 100]} />
            <Radar name={regionA} dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
            <Radar name={regionB} dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
