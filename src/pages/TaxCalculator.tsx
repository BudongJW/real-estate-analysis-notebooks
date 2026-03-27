import { useState, useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { formatNumber } from '../lib/format'

type HouseCount = 1 | 2 | 3
type HoldPeriod = '1미만' | '1이상2미만' | '2이상' | '3이상' | '5이상' | '10이상' | '15이상'

const HOLD_OPTIONS: { label: string; value: HoldPeriod }[] = [
  { label: '1년 미만', value: '1미만' },
  { label: '1~2년', value: '1이상2미만' },
  { label: '2~3년', value: '2이상' },
  { label: '3~5년', value: '3이상' },
  { label: '5~10년', value: '5이상' },
  { label: '10~15년', value: '10이상' },
  { label: '15년 이상', value: '15이상' },
]

function calcAcquisitionTax(price: number, houseCount: HouseCount, isAdjustedArea: boolean) {
  // price: 만원 단위
  const priceWon = price * 10000

  // 취득세 기본세율 (1주택 기준, 2025년 기준)
  let baseRate: number
  if (houseCount === 1) {
    if (priceWon <= 600000000) baseRate = 1.0
    else if (priceWon <= 900000000) baseRate = 1.0 + (priceWon - 600000000) / 300000000 * 2.0
    else baseRate = 3.0
  } else if (houseCount === 2) {
    baseRate = isAdjustedArea ? 8.0 : 1.0 + (priceWon <= 600000000 ? 0 : priceWon <= 900000000 ? 1.0 : 2.0)
  } else {
    baseRate = isAdjustedArea ? 12.0 : 8.0
  }

  const acquisitionTax = Math.round(price * baseRate / 100)
  // 지방교육세: 취득세의 10%
  const localEduTax = Math.round(acquisitionTax * 0.1)
  // 농어촌특별세: 전용면적 85㎡ 초과 시 0.2% (간이 적용)
  const ruralTax = Math.round(price * 0.2 / 100)

  return {
    baseRate: Math.round(baseRate * 100) / 100,
    acquisitionTax,
    localEduTax,
    ruralTax,
    total: acquisitionTax + localEduTax + ruralTax,
  }
}

function calcCapitalGainTax(
  buyPrice: number,
  sellPrice: number,
  houseCount: HouseCount,
  holdPeriod: HoldPeriod,
  isAdjustedArea: boolean,
) {
  const gain = sellPrice - buyPrice
  if (gain <= 0) return { gain, taxable: 0, taxRate: 0, tax: 0, localTax: 0, total: 0, deductionRate: 0, deduction: 0, brackets: [] }

  // 기본공제 250만원
  const basicDeduction = 250

  // 장기보유특별공제 (1세대 1주택, 거주요건 무시 간이)
  let deductionRate = 0
  if (houseCount === 1) {
    switch (holdPeriod) {
      case '3이상': deductionRate = 12; break
      case '5이상': deductionRate = 20; break
      case '10이상': deductionRate = 40; break
      case '15이상': deductionRate = 80; break
      default: deductionRate = 0
    }
  }

  const longTermDeduction = Math.round(gain * deductionRate / 100)
  const taxable = Math.max(0, gain - longTermDeduction - basicDeduction)

  // 세율 결정
  let taxRate = 0
  let surcharge = 0

  // 단기 양도 중과
  if (holdPeriod === '1미만') {
    taxRate = 70
  } else if (holdPeriod === '1이상2미만') {
    taxRate = 60
  } else {
    // 다주택 중과
    if (houseCount === 2 && isAdjustedArea) surcharge = 20
    else if (houseCount >= 3 && isAdjustedArea) surcharge = 30
  }

  // 누진세율 계산 (기본세율 or 단기세율)
  const brackets: { range: string; amount: number; rate: number; tax: number }[] = []
  let tax = 0

  if (taxRate > 0) {
    // 단기 양도: 단일세율
    tax = Math.round(taxable * taxRate / 100)
    brackets.push({ range: '단기양도 단일세율', amount: taxable, rate: taxRate, tax })
  } else {
    // 누진세율 (2025년 기준)
    const BRACKETS = [
      { limit: 1400, rate: 6, cumTax: 0 },
      { limit: 5000, rate: 15, cumTax: 84 },
      { limit: 8800, rate: 24, cumTax: 624 },
      { limit: 15000, rate: 35, cumTax: 1536 },
      { limit: 30000, rate: 38, cumTax: 3706 },
      { limit: 50000, rate: 40, cumTax: 9406 },
      { limit: 100000, rate: 42, cumTax: 17406 },
      { limit: Infinity, rate: 45, cumTax: 38406 },
    ]

    let remaining = taxable
    let prevLimit = 0
    for (const b of BRACKETS) {
      if (remaining <= 0) break
      const bracketSize = Math.min(remaining, b.limit - prevLimit)
      const bracketTax = Math.round(bracketSize * (b.rate + surcharge) / 100)
      brackets.push({
        range: b.limit === Infinity ? `${formatNumber(prevLimit)}만~` : `${formatNumber(prevLimit)}~${formatNumber(b.limit)}만`,
        amount: bracketSize,
        rate: b.rate + surcharge,
        tax: bracketTax,
      })
      tax += bracketTax
      remaining -= bracketSize
      prevLimit = b.limit
    }
  }

  // 지방소득세 10%
  const localTax = Math.round(tax * 0.1)

  return {
    gain,
    deductionRate,
    deduction: longTermDeduction,
    taxable,
    taxRate: taxRate || (brackets.length > 0 ? brackets[brackets.length - 1].rate : 0),
    tax,
    localTax,
    total: tax + localTax,
    brackets,
  }
}

export function TaxCalculator() {
  const [tab, setTab] = useState<'acquisition' | 'capital'>('acquisition')

  // 취득세 inputs
  const [acqPrice, setAcqPrice] = useState(80000)
  const [houseCount, setHouseCount] = useState<HouseCount>(1)
  const [isAdjustedArea, setIsAdjustedArea] = useState(false)

  // 양도세 inputs
  const [buyPrice, setBuyPrice] = useState(60000)
  const [sellPrice, setSellPrice] = useState(80000)
  const [capHouseCount, setCapHouseCount] = useState<HouseCount>(1)
  const [holdPeriod, setHoldPeriod] = useState<HoldPeriod>('5이상')
  const [capAdjusted, setCapAdjusted] = useState(false)

  const acqResult = useMemo(() =>
    calcAcquisitionTax(acqPrice, houseCount, isAdjustedArea),
    [acqPrice, houseCount, isAdjustedArea]
  )

  const capResult = useMemo(() =>
    calcCapitalGainTax(buyPrice, sellPrice, capHouseCount, holdPeriod, capAdjusted),
    [buyPrice, sellPrice, capHouseCount, holdPeriod, capAdjusted]
  )

  const priceStr = (man: number) => {
    if (man >= 10000) return `${(man / 10000).toFixed(1)}억`
    return `${formatNumber(man)}만`
  }

  const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444']

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">세금 계산기</h1>
        <p className="text-gray-500 mt-1">취득세·양도소득세 간이 계산 — 2025년 세법 기준</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('acquisition')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            tab === 'acquisition' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          취득세
        </button>
        <button
          onClick={() => setTab('capital')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            tab === 'capital' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          양도소득세
        </button>
      </div>

      {tab === 'acquisition' ? (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Acquisition Tax Input */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">취득 조건</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                매매가: {priceStr(acqPrice)}
              </label>
              <input type="range" min={5000} max={300000} step={5000} value={acqPrice}
                onChange={e => setAcqPrice(Number(e.target.value))} className="w-full accent-blue-600" />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>5천만</span><span>30억</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">보유 주택 수</label>
              <div className="flex gap-2">
                {([1, 2, 3] as HouseCount[]).map(n => (
                  <button key={n} onClick={() => setHouseCount(n)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      houseCount === n ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-50 text-gray-600 border border-gray-200'
                    }`}>
                    {n === 3 ? '3주택 이상' : `${n}주택`}
                  </button>
                ))}
              </div>
            </div>

            {houseCount >= 2 && (
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={isAdjustedArea} onChange={e => setIsAdjustedArea(e.target.checked)}
                  className="accent-blue-600 w-4 h-4" />
                조정대상지역
              </label>
            )}
          </div>

          {/* Acquisition Tax Result */}
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <p className="text-sm text-blue-600 font-medium">총 취득세</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{formatNumber(acqResult.total)}만원</p>
              <p className="text-xs text-blue-500 mt-1">약 {formatNumber(acqResult.total * 10000)}원</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-3">세부 내역</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">취득세 ({acqResult.baseRate}%)</span>
                  <span className="font-medium">{formatNumber(acqResult.acquisitionTax)}만원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">지방교육세</span>
                  <span className="font-medium">{formatNumber(acqResult.localEduTax)}만원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">농어촌특별세</span>
                  <span className="font-medium">{formatNumber(acqResult.ruralTax)}만원</span>
                </div>
                <hr className="border-gray-100" />
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-900">합계</span>
                  <span className="text-blue-700">{formatNumber(acqResult.total)}만원</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">매매가 대비 세금 비율</p>
              <p className="text-lg font-bold text-gray-900">
                {(acqResult.total / acqPrice * 100).toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Acquisition Pie chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center">
            <h3 className="text-sm font-medium text-gray-500 mb-2">세금 구성</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={[
                    { name: '취득세', value: acqResult.acquisitionTax },
                    { name: '지방교육세', value: acqResult.localEduTax },
                    { name: '농어촌특별세', value: acqResult.ruralTax },
                  ]}
                  cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                >
                  {[0, 1, 2].map(i => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v) => `${formatNumber(Number(v))}만원`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap items-center gap-3 text-xs mt-2">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block" /> 취득세</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" /> 지방교육세</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> 농어촌특별세</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Capital Gain Tax Input */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">양도 조건</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                취득가: {priceStr(buyPrice)}
              </label>
              <input type="range" min={5000} max={300000} step={5000} value={buyPrice}
                onChange={e => setBuyPrice(Number(e.target.value))} className="w-full accent-blue-600" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                양도가: {priceStr(sellPrice)}
              </label>
              <input type="range" min={5000} max={300000} step={5000} value={sellPrice}
                onChange={e => setSellPrice(Number(e.target.value))} className="w-full accent-blue-600" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">보유 주택 수</label>
              <div className="flex gap-2">
                {([1, 2, 3] as HouseCount[]).map(n => (
                  <button key={n} onClick={() => setCapHouseCount(n)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      capHouseCount === n ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-50 text-gray-600 border border-gray-200'
                    }`}>
                    {n === 3 ? '3주택+' : `${n}주택`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">보유 기간</label>
              <select value={holdPeriod} onChange={e => setHoldPeriod(e.target.value as HoldPeriod)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                {HOLD_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {capHouseCount >= 2 && (
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={capAdjusted} onChange={e => setCapAdjusted(e.target.checked)}
                  className="accent-blue-600 w-4 h-4" />
                조정대상지역
              </label>
            )}
          </div>

          {/* Capital Gain Tax Result */}
          <div className="space-y-4">
            {capResult.gain <= 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <p className="text-sm text-green-600 font-medium">양도차익 없음</p>
                <p className="text-xl font-bold text-green-900 mt-1">세금 0원</p>
                <p className="text-xs text-green-500 mt-1">양도가가 취득가보다 낮습니다</p>
              </div>
            ) : (
              <>
                <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                  <p className="text-sm text-red-600 font-medium">양도소득세 (지방소득세 포함)</p>
                  <p className="text-2xl font-bold text-red-900 mt-1">{formatNumber(capResult.total)}만원</p>
                  <p className="text-xs text-red-500 mt-1">약 {formatNumber(capResult.total * 10000)}원</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-sm text-gray-500 mb-3">계산 과정</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">양도차익</span>
                      <span className="font-medium">{formatNumber(capResult.gain)}만원</span>
                    </div>
                    {capResult.deductionRate > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">장기보유특별공제 ({capResult.deductionRate}%)</span>
                        <span className="font-medium text-green-600">-{formatNumber(capResult.deduction)}만원</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">기본공제</span>
                      <span className="font-medium text-green-600">-250만원</span>
                    </div>
                    <hr className="border-gray-100" />
                    <div className="flex justify-between">
                      <span className="text-gray-600">과세표준</span>
                      <span className="font-medium">{formatNumber(capResult.taxable)}만원</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">양도소득세</span>
                      <span className="font-medium">{formatNumber(capResult.tax)}만원</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">지방소득세 (10%)</span>
                      <span className="font-medium">{formatNumber(capResult.localTax)}만원</span>
                    </div>
                    <hr className="border-gray-100" />
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-900">납부 세액</span>
                      <span className="text-red-700">{formatNumber(capResult.total)}만원</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-sm text-gray-500 mb-1">실효세율</p>
                  <p className="text-lg font-bold text-gray-900">
                    {(capResult.total / capResult.gain * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-400">양도차익 대비 세금 비율</p>
                </div>
              </>
            )}
          </div>

          {/* Capital Gain Brackets chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">과세구간별 세금</h3>
            {capResult.brackets.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={capResult.brackets} layout="vertical" margin={{ top: 5, right: 10, bottom: 5, left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${formatNumber(v)}만`} />
                  <YAxis dataKey="range" type="category" tick={{ fontSize: 10 }} width={75} />
                  <Tooltip formatter={(v) => `${formatNumber(Number(v))}만원`} />
                  <Bar dataKey="tax" name="세금" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                양도차익이 없어 세금이 없습니다
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reference table */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">취득세율 요약</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">구분</th>
                  <th className="text-right py-2 px-2 text-gray-500 font-medium">1주택</th>
                  <th className="text-right py-2 px-2 text-gray-500 font-medium">2주택(조정)</th>
                  <th className="text-right py-2 px-2 text-gray-500 font-medium">3주택+(조정)</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-b border-gray-50">
                  <td className="py-2 px-2">6억 이하</td>
                  <td className="py-2 px-2 text-right">1%</td>
                  <td className="py-2 px-2 text-right text-orange-600">8%</td>
                  <td className="py-2 px-2 text-right text-red-600">12%</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-2 px-2">6~9억</td>
                  <td className="py-2 px-2 text-right">1~3%</td>
                  <td className="py-2 px-2 text-right text-orange-600">8%</td>
                  <td className="py-2 px-2 text-right text-red-600">12%</td>
                </tr>
                <tr>
                  <td className="py-2 px-2">9억 초과</td>
                  <td className="py-2 px-2 text-right">3%</td>
                  <td className="py-2 px-2 text-right text-orange-600">8%</td>
                  <td className="py-2 px-2 text-right text-red-600">12%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">양도소득세 누진세율</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">과세표준</th>
                  <th className="text-right py-2 px-2 text-gray-500 font-medium">세율</th>
                  <th className="text-right py-2 px-2 text-gray-500 font-medium">누진공제</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                {[
                  ['1,400만 이하', '6%', '-'],
                  ['5,000만 이하', '15%', '126만'],
                  ['8,800만 이하', '24%', '576만'],
                  ['1.5억 이하', '35%', '1,544만'],
                  ['3억 이하', '38%', '1,994만'],
                  ['5억 이하', '40%', '2,594만'],
                  ['10억 이하', '42%', '3,594만'],
                  ['10억 초과', '45%', '6,594만'],
                ].map(([range, rate, ded], i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-1.5 px-2">{range}</td>
                    <td className="py-1.5 px-2 text-right font-medium">{rate}</td>
                    <td className="py-1.5 px-2 text-right">{ded}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800">
          <strong>주의:</strong> 이 계산기는 간이 계산 참고용이며, 실제 세금과 다를 수 있습니다.
          1세대 1주택 비과세, 일시적 2주택, 장기보유특별공제 거주요건, 지방세 감면 등은 미반영입니다.
          정확한 세금 계산은 반드시 세무사와 상담하세요.
        </p>
      </div>
    </div>
  )
}
