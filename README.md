# 🏠 부동산 시장 분석 대시보드

한국 부동산 시장 데이터를 시각화하는 **인터랙티브 대시보드** + **Jupyter Notebook 분석 컬렉션**입니다.

> **🌐 Live Demo**: [GitHub Pages에서 보기](https://budongjw.github.io/real-estate-analysis-notebooks/)

---

## 📊 대시보드 기능

| 페이지 | 설명 |
|--------|------|
| **시장 개요** | 지역별 중위 매매가, 6개월 추이, 전세가율 TOP5, 청약 미리보기 |
| **실거래가** | 지역 선택 → 매매가 범위 차트, 거래량 추이, 최근 거래 테이블 |
| **전세가율** | 안전/주의/위험 구간 색상, 매매가 vs 전세가 산점도 |
| **청약 정보** | 분양 일정 카드, 접수 상태, 경쟁률 |
| **대출 계산기** | 원리금균등상환 시뮬레이션, 상환 스케줄 차트 |

## 🛠 기술 스택

- **Frontend**: React + TypeScript + Vite
- **차트**: Recharts
- **스타일**: Tailwind CSS
- **배포**: GitHub Pages (GitHub Actions 자동 배포)
- **데이터**: 국토교통부 실거래가 공개시스템 (공공데이터포털)

## 📌 Jupyter Notebook 분석

`notebooks/` 디렉토리에 다양한 부동산 분석 노트북이 포함되어 있습니다:

- **실거래 기반**: 월별 매매가 추세, 평형대별 가격 비교, 단지별 가격 흐름
- **전세가율**: 갭투자 위험도, 지역별 전세가격 흐름
- **가격지수**: 매매/전세 지수 트렌드, 상승/하락률 TOP 지역
- **확장 분석**: 전월세전환율, 노후도, 재건축 가능성, 시계열 예측

## 🚀 로컬 실행

```bash
# 대시보드
npm install
npm run dev

# Jupyter Notebooks
pip install -r requirements.txt
jupyter notebook
```

## 📡 자동 데이터 갱신

GitHub Secrets에 `DATA_GO_KR_API_KEY`를 추가하면:
- 매일 오전 9시(KST) GitHub Actions가 공공데이터 API에서 최신 데이터 수집
- `public/data/*.json` 파일 자동 업데이트 후 재배포
- API 키 없으면 샘플 데이터로 동작

## 📝 데이터 출처

- [국토교통부 실거래가 공개시스템](https://rt.molit.go.kr)
- [공공데이터포털](https://www.data.go.kr)
- [한국부동산원](https://www.reb.or.kr)

---

*부동산 임장왕 · BudongJW*
