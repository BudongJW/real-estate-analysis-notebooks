import { useEffect, useState } from 'react'
import { formatNumber, formatDate } from '../lib/format'

type SubItem = {
  name: string
  location: string
  totalUnits: number
  announcementDate: string
  applicationStart: string
  applicationEnd: string
  winnerDate: string
  competitionRate: number | null
}

export function Subscriptions() {
  const [items, setItems] = useState<SubItem[]>([])

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/subscriptions.json`)
      .then(r => r.json())
      .then(d => setItems(d.items))
  }, [])

  if (!items.length) return <div className="flex justify-center py-20 text-gray-400">로딩 중...</div>

  const getStatus = (item: SubItem) => {
    const now = new Date()
    const start = new Date(item.applicationStart)
    const end = new Date(item.applicationEnd)
    if (now < start) return { label: '접수 예정', color: 'bg-blue-100 text-blue-700' }
    if (now <= end) return { label: '접수중', color: 'bg-green-100 text-green-700' }
    return { label: '접수 마감', color: 'bg-gray-100 text-gray-600' }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">청약 정보</h1>
        <p className="text-gray-500 mt-1">최근 아파트 분양 청약 일정 및 경쟁률</p>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const status = getStatus(item)
          return (
            <div key={item.name} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{item.location}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">총 세대수</p>
                    <p className="text-lg font-bold text-gray-900">{formatNumber(item.totalUnits)}</p>
                  </div>
                  {item.competitionRate && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500">경쟁률</p>
                      <p className={`text-lg font-bold ${item.competitionRate > 100 ? 'text-red-600' : 'text-blue-600'}`}>
                        {item.competitionRate}:1
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">공고일</p>
                  <p className="text-sm font-medium text-gray-700">{formatDate(item.announcementDate)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">청약 시작</p>
                  <p className="text-sm font-medium text-gray-700">{formatDate(item.applicationStart)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">청약 마감</p>
                  <p className="text-sm font-medium text-gray-700">{formatDate(item.applicationEnd)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">당첨 발표</p>
                  <p className="text-sm font-medium text-gray-700">{formatDate(item.winnerDate)}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
