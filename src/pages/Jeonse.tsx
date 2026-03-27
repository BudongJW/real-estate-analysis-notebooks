import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  ScatterChart, Scatter, ZAxis,
} from 'recharts'
import { formatPrice, formatPriceShort } from '../lib/format'

type JeonseItem = {
  region: string
  tradeMedian: number
  jeonseMedian: number
  ratio: number
  tradeSamples: number
  jeonseSamples: number
}

export function Jeonse() {
  const [data, setData] = useState<JeonseItem[]>([])

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/jeonse.json`)
      .then(r => r.json())
      .then(d => setData(d.data))
  }, [])

  if (!data.length) return <div className="flex justify-center py-20 text-gray-400">로딩 중...</div>

  const sorted = [...data].sort((a, b) => b.ratio - a.ratio)
  const avgRatio = (data.reduce((s, d) => s + d.ratio, 0) / data.length).toFixed(1)

  const barData = sorted.map(d => ({
    region: d.region.replace('서울 ', '').replace('경기 ', ''),
    ratio: d.ratio,
    gap: d.tradeMedian - d.jeonseMedian,
  }))

  const scatterData = data.map(d => ({
    x: d.tradeMedian,
    y: d.jeonseMedian,
    z: d.tradeSamples,
    name: d.region,
  }))

  const getColor = (ratio: number) => {
    if (ratio >= 63) return '#ef4444'
    if (ratio >= 58) return '#f59e0b'
    return '#3b82f6'
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">전세가율 분석</h1>
        <p className="text-gray-500 mt-1">매매가 대비 전세가 비율 — 투자 판단의 핵심 지표</p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          <strong>전세가율</strong> = (전세 보증금 ÷ 매매가) × 100.
          전세가율이 높을수록 갭투자 여력이 적고, 역전세 위험이 커집니다.
          일반적으로 60% 이상이면 주의, 70% 이상이면 위험 구간으로 봅니다.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">평균 전세가율</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{avgRatio}%</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">최고 전세가율</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{sorted[0].region} ({sorted[0].ratio}%)</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">최저 전세가율</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{sorted[sorted.length - 1].region} ({sorted[sorted.length - 1].ratio}%)</p>
        </div>
      </div>

      {/* Ratio bar chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">지역별 전세가율</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 100 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" domain={[0, 80]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="region" tick={{ fontSize: 12 }} width={90} />
            <Tooltip formatter={(v) => `${v}%`} />
            <Bar dataKey="ratio" name="전세가율" radius={[0, 6, 6, 0]}>
              {barData.map((entry, i) => (
                <Cell key={i} fill={getColor(entry.ratio)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-3 justify-center text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block" /> 안전 (&lt;58%)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500 inline-block" /> 주의 (58~63%)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> 위험 (&gt;63%)</span>
        </div>
      </div>

      {/* Scatter: trade vs jeonse */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">매매가 vs 전세가 분포</h2>
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" dataKey="x" name="매매 중위가" tick={{ fontSize: 12 }} tickFormatter={v => formatPriceShort(v)} />
            <YAxis type="number" dataKey="y" name="전세 중위가" tick={{ fontSize: 12 }} tickFormatter={v => formatPriceShort(v)} />
            <ZAxis type="number" dataKey="z" range={[60, 400]} />
            <Tooltip
              formatter={(v) => formatPrice(Number(v)) + '원'}
              labelFormatter={() => ''}
              content={({ payload }) => {
                if (!payload?.length) return null
                const d = payload[0].payload
                return (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
                    <p className="font-semibold">{d.name}</p>
                    <p className="text-gray-600">매매: {formatPrice(d.x)}원</p>
                    <p className="text-gray-600">전세: {formatPrice(d.y)}원</p>
                    <p className="text-gray-600">거래량: {d.z}건</p>
                  </div>
                )
              }}
            />
            <Scatter data={scatterData} fill="#3b82f6" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">상세 데이터</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-2 text-gray-500 font-medium">지역</th>
                <th className="text-right py-3 px-2 text-gray-500 font-medium">매매 중위가</th>
                <th className="text-right py-3 px-2 text-gray-500 font-medium">전세 중위가</th>
                <th className="text-right py-3 px-2 text-gray-500 font-medium">전세가율</th>
                <th className="text-right py-3 px-2 text-gray-500 font-medium">갭(매매-전세)</th>
                <th className="text-right py-3 px-2 text-gray-500 font-medium">거래 건수</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((d) => (
                <tr key={d.region} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-2 font-medium text-gray-900">{d.region}</td>
                  <td className="py-3 px-2 text-right">{formatPrice(d.tradeMedian)}원</td>
                  <td className="py-3 px-2 text-right">{formatPrice(d.jeonseMedian)}원</td>
                  <td className="py-3 px-2 text-right">
                    <span className={`font-semibold ${d.ratio >= 63 ? 'text-red-600' : d.ratio >= 58 ? 'text-amber-600' : 'text-blue-600'}`}>
                      {d.ratio}%
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right text-gray-600">{formatPrice(d.tradeMedian - d.jeonseMedian)}원</td>
                  <td className="py-3 px-2 text-right text-gray-500">{d.tradeSamples}건</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
