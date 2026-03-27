import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Legend,
} from 'recharts'
import { StatCard } from '../components/StatCard'
import { formatPriceShort, formatPrice } from '../lib/format'

type TradeData = {
  updated: string
  regions: Record<string, {
    code: string
    monthly: { month: string; median: number; min: number; max: number; count: number }[]
    recent: { name: string; dong: string; area: number; floor: number; price: number; date: string; year: number }[]
  }>
}

type JeonseData = {
  data: { region: string; tradeMedian: number; jeonseMedian: number; ratio: number }[]
}

type SubData = {
  items: { name: string; location: string; totalUnits: number; competitionRate: number | null; applicationStart: string }[]
}

export function Overview() {
  const [trades, setTrades] = useState<TradeData | null>(null)
  const [jeonse, setJeonse] = useState<JeonseData | null>(null)
  const [subs, setSubs] = useState<SubData | null>(null)

  useEffect(() => {
    const base = import.meta.env.BASE_URL
    Promise.all([
      fetch(`${base}data/trades.json`).then(r => r.json()),
      fetch(`${base}data/jeonse.json`).then(r => r.json()),
      fetch(`${base}data/subscriptions.json`).then(r => r.json()),
    ]).then(([t, j, s]) => {
      setTrades(t)
      setJeonse(j)
      setSubs(s)
    })
  }, [])

  if (!trades || !jeonse || !subs) {
    return <div className="flex justify-center py-20 text-gray-400">로딩 중...</div>
  }

  const regions = Object.entries(trades.regions)
  const latestPrices = regions.map(([name, data]) => ({
    region: name.replace('서울 ', '').replace('경기 ', ''),
    median: data.monthly[data.monthly.length - 1].median,
    count: data.monthly[data.monthly.length - 1].count,
  }))

  // 6개월 추이 데이터 (모든 지역)
  const trendData = trades.regions['서울 강남구'].monthly.map((m, i) => {
    const point: Record<string, string | number> = { month: m.month.slice(5) + '월' }
    regions.forEach(([name, data]) => {
      point[name.replace('서울 ', '').replace('경기 ', '')] = data.monthly[i].median
    })
    return point
  })

  const totalTransactions = regions.reduce(
    (sum, [, data]) => sum + data.monthly[data.monthly.length - 1].count, 0
  )

  const avgJeonseRatio = (jeonse.data.reduce((s, d) => s + d.ratio, 0) / jeonse.data.length).toFixed(1)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">시장 개요</h1>
        <p className="text-gray-500 mt-1">주요 지역 부동산 시장 현황 ({trades.updated} 기준)</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="강남구 중위가" value={formatPriceShort(latestPrices[0].median)} sub="전월 대비 +1.5%" color="blue" />
        <StatCard label="이번달 거래량" value={`${totalTransactions}건`} sub="4개 지역 합산" color="green" />
        <StatCard label="평균 전세가율" value={`${avgJeonseRatio}%`} sub="서울+경기 12개 구" color="orange" />
        <StatCard label="청약 예정" value={`${subs.items.length}건`} sub="이번달 분양" color="purple" />
      </div>

      {/* Price bar chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">지역별 중위 매매가</h2>
          <Link to="/trades" className="text-sm text-blue-600 hover:underline">상세 보기 →</Link>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={latestPrices} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="region" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatPriceShort(v)} />
            <Tooltip formatter={(v) => formatPrice(Number(v)) + '원'} />
            <Bar dataKey="median" fill="#3b82f6" radius={[6, 6, 0, 0]} name="중위 매매가" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Price trend line chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">6개월 매매가 추이</h2>
          <span className="text-xs text-gray-400">단위: 만원</span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatPriceShort(v)} />
            <Tooltip formatter={(v) => formatPrice(Number(v)) + '원'} />
            <Legend />
            {regions.map(([name], i) => {
              const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
              return (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name.replace('서울 ', '').replace('경기 ', '')}
                  stroke={colors[i % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Jeonse ratio + Subscription preview */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">전세가율 TOP 5</h2>
            <Link to="/jeonse" className="text-sm text-blue-600 hover:underline">전체 보기 →</Link>
          </div>
          <div className="space-y-3">
            {jeonse.data.slice(0, 5).sort((a, b) => b.ratio - a.ratio).map((d) => (
              <div key={d.region} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{d.region}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${d.ratio}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-14 text-right">{d.ratio}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">최근 청약</h2>
            <Link to="/subscriptions" className="text-sm text-blue-600 hover:underline">전체 보기 →</Link>
          </div>
          <div className="space-y-3">
            {subs.items.slice(0, 4).map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{s.totalUnits}세대</p>
                  {s.competitionRate && (
                    <p className="text-xs text-red-500">{s.competitionRate}:1</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
