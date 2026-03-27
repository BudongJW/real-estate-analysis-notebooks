import { useState, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts'
import { formatNumber } from '../lib/format'

export function Calculator() {
  const [principal, setPrincipal] = useState(30000) // 만원
  const [rate, setRate] = useState(3.5) // %
  const [years, setYears] = useState(30)

  const result = useMemo(() => {
    const monthlyRate = rate / 100 / 12
    const months = years * 12
    const monthlyPayment = monthlyRate === 0
      ? principal / months
      : principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)

    const totalPayment = monthlyPayment * months
    const totalInterest = totalPayment - principal

    // 상환 스케줄
    const schedule: { year: number; principalPaid: number; interestPaid: number; remaining: number }[] = []
    let remaining = principal
    let yearPrincipal = 0
    let yearInterest = 0

    for (let m = 1; m <= months; m++) {
      const interestPayment = remaining * monthlyRate
      const principalPayment = monthlyPayment - interestPayment
      remaining -= principalPayment
      yearPrincipal += principalPayment
      yearInterest += interestPayment

      if (m % 12 === 0) {
        schedule.push({
          year: m / 12,
          principalPaid: Math.round(yearPrincipal),
          interestPaid: Math.round(yearInterest),
          remaining: Math.max(0, Math.round(remaining)),
        })
        yearPrincipal = 0
        yearInterest = 0
      }
    }

    return { monthlyPayment, totalPayment, totalInterest, schedule }
  }, [principal, rate, years])

  const pieData = [
    { name: '원금', value: principal },
    { name: '이자', value: Math.round(result.totalInterest) },
  ]
  const PIE_COLORS = ['#3b82f6', '#f59e0b']

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">대출 계산기</h1>
        <p className="text-gray-500 mt-1">원리금균등상환 방식 대출 상환 시뮬레이션</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Input form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">대출 조건</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              대출 금액: {formatNumber(principal)}만원 ({(principal / 10000).toFixed(1)}억)
            </label>
            <input
              type="range"
              min={1000}
              max={100000}
              step={1000}
              value={principal}
              onChange={e => setPrincipal(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1천만</span>
              <span>10억</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              연이율: {rate}%
            </label>
            <input
              type="range"
              min={1}
              max={10}
              step={0.1}
              value={rate}
              onChange={e => setRate(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1%</span>
              <span>10%</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              대출 기간: {years}년
            </label>
            <input
              type="range"
              min={5}
              max={40}
              step={5}
              value={years}
              onChange={e => setYears(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>5년</span>
              <span>40년</span>
            </div>
          </div>
        </div>

        {/* Result summary */}
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <p className="text-sm text-blue-600 font-medium">월 상환금</p>
            <p className="text-3xl font-bold text-blue-900 mt-1">{formatNumber(Math.round(result.monthlyPayment))}만원</p>
            <p className="text-xs text-blue-500 mt-1">
              약 {formatNumber(Math.round(result.monthlyPayment * 10000))}원
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-500">총 상환금</p>
            <p className="text-xl font-bold text-gray-900">{formatNumber(Math.round(result.totalPayment))}만원</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
            <p className="text-sm text-orange-600">총 이자</p>
            <p className="text-xl font-bold text-orange-900">{formatNumber(Math.round(result.totalInterest))}만원</p>
            <p className="text-xs text-orange-500 mt-1">
              원금 대비 {((result.totalInterest / principal) * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center">
          <h3 className="text-sm font-medium text-gray-500 mb-2">원금 vs 이자 비율</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${formatNumber(Number(v))}만원`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block" /> 원금</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500 inline-block" /> 이자</span>
          </div>
        </div>
      </div>

      {/* Amortization chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">연도별 상환 스케줄</h2>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={result.schedule} margin={{ top: 10, right: 20, bottom: 5, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} tickFormatter={v => `${v}년`} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${formatNumber(v)}만`} />
            <Tooltip
              formatter={(v, name) => [
                `${formatNumber(Number(v))}만원`,
                name === 'principalPaid' ? '원금 상환' : name === 'interestPaid' ? '이자 납부' : '잔액',
              ]}
              labelFormatter={v => `${v}년차`}
            />
            <Area type="monotone" dataKey="remaining" stroke="#94a3b8" fill="#f1f5f9" name="잔액" />
            <Area type="monotone" dataKey="principalPaid" stroke="#3b82f6" fill="#dbeafe" name="원금 상환" stackId="payment" />
            <Area type="monotone" dataKey="interestPaid" stroke="#f59e0b" fill="#fef3c7" name="이자 납부" stackId="payment" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
