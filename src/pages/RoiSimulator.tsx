import { useState, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar,
} from 'recharts'
import { formatNumber } from '../lib/format'
import { ChartDownload } from '../components/ChartDownload'

export function RoiSimulator() {
  // 매입 조건
  const [purchasePrice, setPurchasePrice] = useState(80000) // 만원 (8억)
  const [jeonseDeposit, setJeonseDeposit] = useState(48000) // 전세 보증금
  const [loanAmount, setLoanAmount] = useState(20000) // 대출금
  const [loanRate, setLoanRate] = useState(4.0) // 연이율

  // 보유 기간 & 예상 상승률
  const [holdYears, setHoldYears] = useState(5)
  const [annualGrowth, setAnnualGrowth] = useState(3.0)

  // 세금/비용
  const [acquisitionTaxRate] = useState(1.1) // 취득세 (6억~9억 기준 1.1%)
  const [brokerFee] = useState(0.4) // 중개수수료 0.4%

  const result = useMemo(() => {
    const selfCapital = purchasePrice - jeonseDeposit - loanAmount // 자기자본
    const acquisitionTax = Math.round(purchasePrice * acquisitionTaxRate / 100)
    const brokerCost = Math.round(purchasePrice * brokerFee / 100)
    const totalInvestment = selfCapital + acquisitionTax + brokerCost

    // 연도별 시뮬레이션
    const yearly: {
      year: number
      price: number
      equity: number
      loanBalance: number
      interestPaid: number
      totalReturn: number
      roi: number
    }[] = []

    let accInterest = 0
    for (let y = 1; y <= holdYears; y++) {
      const futurePrice = Math.round(purchasePrice * Math.pow(1 + annualGrowth / 100, y))
      const yearInterest = Math.round(loanAmount * loanRate / 100)
      accInterest += yearInterest

      const equity = futurePrice - jeonseDeposit - loanAmount
      const totalReturn = futurePrice - purchasePrice - accInterest - acquisitionTax - brokerCost
      const roi = totalInvestment > 0 ? Math.round(totalReturn / totalInvestment * 100) : 0

      yearly.push({
        year: y,
        price: futurePrice,
        equity,
        loanBalance: loanAmount,
        interestPaid: accInterest,
        totalReturn,
        roi,
      })
    }

    // 매도 시 양도세 (간이 계산: 2년 이상 보유 기본세율)
    const finalPrice = yearly[yearly.length - 1]?.price || purchasePrice
    const capitalGain = finalPrice - purchasePrice
    let capitalGainTax = 0
    if (capitalGain > 0 && holdYears >= 2) {
      // 기본공제 250만원, 누진세율 간이 적용
      const taxable = Math.max(0, capitalGain - 250)
      if (taxable <= 1400) capitalGainTax = Math.round(taxable * 0.06)
      else if (taxable <= 5000) capitalGainTax = Math.round(84 + (taxable - 1400) * 0.15)
      else if (taxable <= 8800) capitalGainTax = Math.round(624 + (taxable - 5000) * 0.24)
      else capitalGainTax = Math.round(1536 + (taxable - 8800) * 0.35)
    } else if (capitalGain > 0 && holdYears < 2) {
      capitalGainTax = Math.round(capitalGain * 0.6) // 1년 미만 60%, 2년 미만도 높은 세율
    }

    const sellBroker = Math.round(finalPrice * brokerFee / 100)
    const netProfit = capitalGain - accInterest - acquisitionTax - brokerCost - capitalGainTax - sellBroker
    const netRoi = totalInvestment > 0 ? Math.round(netProfit / totalInvestment * 100) : 0
    const annualRoi = holdYears > 0 ? (netRoi / holdYears).toFixed(1) : '0'

    return {
      selfCapital,
      totalInvestment,
      acquisitionTax,
      brokerCost,
      yearly,
      capitalGain,
      capitalGainTax,
      sellBroker,
      accInterest: accInterest,
      netProfit,
      netRoi,
      annualRoi,
      jeonseRatio: Math.round(jeonseDeposit / purchasePrice * 100),
    }
  }, [purchasePrice, jeonseDeposit, loanAmount, loanRate, holdYears, annualGrowth, acquisitionTaxRate, brokerFee])

  const priceStr = (man: number) => {
    if (man >= 10000) return `${(man / 10000).toFixed(1)}억`
    return `${(man / 1000).toFixed(0)}천만`
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">투자 수익률 시뮬레이터</h1>
        <p className="text-gray-500 mt-1">갭투자 시나리오 기반 수익률 분석 — 대출이자, 세금, 수수료 반영</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Input */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">매입 조건</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              매매가: {priceStr(purchasePrice)}
            </label>
            <input type="range" min={10000} max={200000} step={5000} value={purchasePrice}
              onChange={e => setPurchasePrice(Number(e.target.value))} className="w-full accent-blue-600" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              전세 보증금: {priceStr(jeonseDeposit)} (전세가율 {result.jeonseRatio}%)
            </label>
            <input type="range" min={0} max={purchasePrice} step={1000} value={jeonseDeposit}
              onChange={e => setJeonseDeposit(Number(e.target.value))} className="w-full accent-blue-600" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              대출금: {priceStr(loanAmount)}
            </label>
            <input type="range" min={0} max={purchasePrice - jeonseDeposit} step={1000} value={Math.min(loanAmount, purchasePrice - jeonseDeposit)}
              onChange={e => setLoanAmount(Number(e.target.value))} className="w-full accent-blue-600" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              대출 금리: {loanRate}%
            </label>
            <input type="range" min={2} max={8} step={0.1} value={loanRate}
              onChange={e => setLoanRate(Number(e.target.value))} className="w-full accent-blue-600" />
          </div>

          <hr className="border-gray-100" />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              보유 기간: {holdYears}년
            </label>
            <input type="range" min={1} max={20} step={1} value={holdYears}
              onChange={e => setHoldYears(Number(e.target.value))} className="w-full accent-blue-600" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              연간 시세 상승률: {annualGrowth}%
            </label>
            <input type="range" min={-5} max={15} step={0.5} value={annualGrowth}
              onChange={e => setAnnualGrowth(Number(e.target.value))} className="w-full accent-blue-600" />
          </div>
        </div>

        {/* Result summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">자기자본</p>
            <p className="text-xl font-bold text-gray-900">{formatNumber(result.selfCapital)}만원</p>
            <p className="text-xs text-gray-400">매매가 - 전세 - 대출</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">총 투자금 (세금+수수료 포함)</p>
            <p className="text-xl font-bold text-gray-900">{formatNumber(result.totalInvestment)}만원</p>
            <p className="text-xs text-gray-400">취득세 {formatNumber(result.acquisitionTax)}만 + 중개비 {formatNumber(result.brokerCost)}만</p>
          </div>
          <div className={`rounded-xl border p-5 ${result.netProfit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
            <p className="text-sm text-gray-600">순수익 ({holdYears}년 후)</p>
            <p className={`text-2xl font-bold ${result.netProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
              {result.netProfit >= 0 ? '+' : ''}{formatNumber(result.netProfit)}만원
            </p>
            <p className="text-xs text-gray-500 mt-1">
              수익률 {result.netRoi}% (연평균 {result.annualRoi}%)
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">비용 내역</p>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">취득세</span><span>{formatNumber(result.acquisitionTax)}만</span></div>
              <div className="flex justify-between"><span className="text-gray-600">중개수수료 (매입)</span><span>{formatNumber(result.brokerCost)}만</span></div>
              <div className="flex justify-between"><span className="text-gray-600">대출이자 ({holdYears}년)</span><span>{formatNumber(result.accInterest)}만</span></div>
              <div className="flex justify-between"><span className="text-gray-600">양도소득세</span><span>{formatNumber(result.capitalGainTax)}만</span></div>
              <div className="flex justify-between"><span className="text-gray-600">중개수수료 (매도)</span><span>{formatNumber(result.sellBroker)}만</span></div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">시세 변동 + 수익률</h3>
              <ChartDownload chartId="roi-chart" filename="투자수익률_시뮬레이션" />
            </div>
            <div id="roi-chart">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={result.yearly} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} tickFormatter={v => `${v}년`} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => priceStr(v)} />
                  <Tooltip formatter={(v) => `${formatNumber(Number(v))}만원`} labelFormatter={v => `${v}년차`} />
                  <Area type="monotone" dataKey="price" stroke="#3b82f6" fill="#dbeafe" name="예상 시세" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">연도별 수익률(ROI)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={result.yearly} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} tickFormatter={v => `${v}년`} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v) => `${v}%`} labelFormatter={v => `${v}년차`} />
                <Bar dataKey="roi" name="누적 ROI" radius={[4, 4, 0, 0]}>
                  {result.yearly.map((entry, i) => (
                    <rect key={i} fill={entry.roi >= 0 ? '#3b82f6' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800">
          <strong>주의:</strong> 이 시뮬레이션은 참고용이며, 실제 투자 결과와 다를 수 있습니다.
          세금은 간이 계산이며, 다주택자 중과·장기보유특별공제 등은 미반영입니다.
          투자 결정 전 반드시 세무사와 상담하세요.
        </p>
      </div>
    </div>
  )
}
