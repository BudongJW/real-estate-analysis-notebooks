import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  AreaChart, Area,
} from 'recharts'
import { formatPrice, formatPriceShort, formatDate, formatNumber } from '../lib/format'

type TradeRegion = {
  code: string
  monthly: { month: string; median: number; min: number; max: number; count: number }[]
  recent: { name: string; dong: string; area: number; floor: number; price: number; date: string; year: number }[]
}

type TradeData = {
  updated: string
  regions: Record<string, TradeRegion>
}

export function Trades() {
  const [data, setData] = useState<TradeData | null>(null)
  const [selected, setSelected] = useState<string>('')

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/trades.json`)
      .then(r => r.json())
      .then((d: TradeData) => {
        setData(d)
        setSelected(Object.keys(d.regions)[0])
      })
  }, [])

  if (!data || !selected) return <div className="flex justify-center py-20 text-gray-400">로딩 중...</div>

  const region = data.regions[selected]
  const latest = region.monthly[region.monthly.length - 1]
  const prev = region.monthly[region.monthly.length - 2]
  const change = ((latest.median - prev.median) / prev.median * 100).toFixed(1)

  const rangeData = region.monthly.map(m => ({
    month: m.month.slice(5) + '월',
    median: m.median,
    min: m.min,
    max: m.max,
    range: [m.min, m.max],
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">실거래가 분석</h1>
        <p className="text-gray-500 mt-1">아파트 매매 실거래가 추이 및 최근 거래 내역</p>
      </div>

      {/* Region selector */}
      <div className="flex flex-wrap gap-2">
        {Object.keys(data.regions).map((name) => (
          <button
            key={name}
            onClick={() => setSelected(name)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selected === name
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">중위 매매가</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatPriceShort(latest.median)}</p>
          <p className={`text-xs mt-1 ${Number(change) >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
            전월 대비 {Number(change) >= 0 ? '▲' : '▼'} {Math.abs(Number(change))}%
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">거래량</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatNumber(latest.count)}건</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">최저가</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{formatPriceShort(latest.min)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">최고가</p>
          <p className="text-xl font-bold text-red-600 mt-1">{formatPriceShort(latest.max)}</p>
        </div>
      </div>

      {/* Price range chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">매매가 추이 (6개월)</h2>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={rangeData} margin={{ top: 10, right: 20, bottom: 5, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatPriceShort(v)} />
            <Tooltip formatter={(v) => formatPrice(Number(v)) + '원'} />
            <Legend />
            <Area type="monotone" dataKey="max" stroke="#fca5a5" fill="#fef2f2" name="최고가" />
            <Area type="monotone" dataKey="median" stroke="#3b82f6" fill="#eff6ff" name="중위가" strokeWidth={2} />
            <Area type="monotone" dataKey="min" stroke="#86efac" fill="#f0fdf4" name="최저가" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Transaction volume */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">월별 거래량</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={region.monthly.map(m => ({ month: m.month.slice(5) + '월', count: m.count }))} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} name="거래 건수" dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent transactions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 거래 내역</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-2 text-gray-500 font-medium">아파트</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">동</th>
                <th className="text-right py-3 px-2 text-gray-500 font-medium">면적(㎡)</th>
                <th className="text-right py-3 px-2 text-gray-500 font-medium">층</th>
                <th className="text-right py-3 px-2 text-gray-500 font-medium">거래가</th>
                <th className="text-right py-3 px-2 text-gray-500 font-medium">평당가</th>
                <th className="text-right py-3 px-2 text-gray-500 font-medium">거래일</th>
                <th className="text-right py-3 px-2 text-gray-500 font-medium">건축년도</th>
              </tr>
            </thead>
            <tbody>
              {region.recent.map((t, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-2 font-medium text-gray-900">{t.name}</td>
                  <td className="py-3 px-2 text-gray-600">{t.dong}</td>
                  <td className="py-3 px-2 text-right text-gray-600">{t.area}</td>
                  <td className="py-3 px-2 text-right text-gray-600">{t.floor}층</td>
                  <td className="py-3 px-2 text-right font-semibold text-blue-700">{formatPrice(t.price)}원</td>
                  <td className="py-3 px-2 text-right text-gray-500">{formatPrice(Math.round(t.price / (t.area / 3.3058)))}원</td>
                  <td className="py-3 px-2 text-right text-gray-500">{formatDate(t.date)}</td>
                  <td className="py-3 px-2 text-right text-gray-500">{t.year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
