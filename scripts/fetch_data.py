"""
공공데이터포털 API를 통해 최신 부동산 데이터를 수집하여 public/data/ 에 저장합니다.
GitHub Actions 스케줄로 매일 실행됩니다.

필요한 환경변수: DATA_GO_KR_API_KEY
"""

import json
import os
import sys
from datetime import datetime, timedelta
from urllib.parse import quote
from urllib.request import urlopen, Request
from xml.etree import ElementTree as ET

API_KEY = os.environ.get("DATA_GO_KR_API_KEY", "")
BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "data")

# 주요 지역 코드 (시군구)
REGIONS = {
    "서울 강남구": "11680",
    "서울 서초구": "11650",
    "서울 송파구": "11710",
    "서울 마포구": "11440",
    "서울 용산구": "11170",
    "서울 성동구": "11200",
    "서울 영등포구": "11560",
    "서울 강서구": "11500",
    "서울 노원구": "11350",
    "경기 성남시 분당구": "41135",
    "경기 수원시 영통구": "41117",
    "경기 고양시 일산동구": "41173",
}

# 최근 6개월 YYYYMM 리스트
def get_recent_months(n=6):
    now = datetime.now()
    months = []
    for i in range(n):
        d = now - timedelta(days=30 * i)
        months.append(d.strftime("%Y%m"))
    return list(reversed(months))


def fetch_apt_trades(region_code: str, year_month: str):
    """국토교통부 아파트 실거래가 API"""
    url = (
        f"https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade"
        f"?serviceKey={quote(API_KEY, safe='')}"
        f"&LAWD_CD={region_code}"
        f"&DEAL_YMD={year_month}"
        f"&numOfRows=1000"
    )
    try:
        req = Request(url, headers={"Accept": "application/xml"})
        with urlopen(req, timeout=30) as resp:
            tree = ET.parse(resp)
        items = tree.findall(".//item")
        prices = []
        records = []
        for item in items:
            # 해제 거래 제외
            cd = item.findtext("cdealType", "").strip()
            if cd == "O":
                continue
            price_text = item.findtext("dealAmount", "0").strip().replace(",", "")
            try:
                price = int(price_text)
            except ValueError:
                continue
            prices.append(price)
            records.append({
                "name": (item.findtext("aptNm") or "").strip(),
                "dong": (item.findtext("aptDong") or item.findtext("umdNm") or "").strip(),
                "area": float(item.findtext("excluUseAr") or "0"),
                "floor": int(item.findtext("floor") or "0"),
                "price": price,
                "date": f"{year_month[:4]}-{year_month[4:]}-{(item.findtext('dealDay') or '1').strip().zfill(2)}",
                "year": int(item.findtext("buildYear") or "0"),
            })
        if not prices:
            return None, []
        prices.sort()
        median = prices[len(prices) // 2]
        return {
            "median": median,
            "min": prices[0],
            "max": prices[-1],
            "count": len(prices),
        }, sorted(records, key=lambda r: r["date"], reverse=True)[:5]
    except Exception as e:
        print(f"  [WARN] {region_code}/{year_month}: {e}", file=sys.stderr)
        return None, []


def fetch_apt_rent(region_code: str, year_month: str):
    """국토교통부 아파트 전월세 API — 전세 중위가 추출"""
    url = (
        f"https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent"
        f"?serviceKey={quote(API_KEY, safe='')}"
        f"&LAWD_CD={region_code}"
        f"&DEAL_YMD={year_month}"
        f"&numOfRows=1000"
    )
    try:
        req = Request(url, headers={"Accept": "application/xml"})
        with urlopen(req, timeout=30) as resp:
            tree = ET.parse(resp)
        items = tree.findall(".//item")
        deposits = []
        for item in items:
            monthly = int((item.findtext("monthlyRent") or "0").strip().replace(",", "") or "0")
            if monthly > 0:
                continue  # 월세 제외, 전세만
            dep_text = (item.findtext("deposit") or "0").strip().replace(",", "")
            try:
                deposits.append(int(dep_text))
            except ValueError:
                continue
        if not deposits:
            return None
        deposits.sort()
        return {
            "median": deposits[len(deposits) // 2],
            "count": len(deposits),
        }
    except Exception as e:
        print(f"  [WARN] rent {region_code}/{year_month}: {e}", file=sys.stderr)
        return None


def build_trades_json():
    """실거래가 데이터 수집"""
    print("=== 실거래가 데이터 수집 ===")
    months = get_recent_months(6)
    result = {"updated": datetime.now().strftime("%Y-%m"), "regions": {}}

    for region_name, code in REGIONS.items():
        print(f"  {region_name} ({code})")
        monthly_data = []
        latest_records = []
        for ym in months:
            summary, records = fetch_apt_trades(code, ym)
            if summary:
                monthly_data.append({
                    "month": f"{ym[:4]}-{ym[4:]}",
                    **summary,
                })
            if records and not latest_records:
                latest_records = records

        if monthly_data:
            result["regions"][region_name] = {
                "code": code,
                "monthly": monthly_data,
                "recent": latest_records,
            }

    path = os.path.join(BASE_DIR, "trades.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"  -> {path} ({len(result['regions'])} regions)")


def build_jeonse_json():
    """전세가율 데이터 수집"""
    print("=== 전세가율 데이터 수집 ===")
    current_ym = datetime.now().strftime("%Y%m")
    result = {"updated": datetime.now().strftime("%Y-%m"), "data": []}

    for region_name, code in REGIONS.items():
        print(f"  {region_name} ({code})")
        trade_summary, _ = fetch_apt_trades(code, current_ym)
        rent_summary = fetch_apt_rent(code, current_ym)

        if trade_summary and rent_summary and trade_summary["median"] > 0:
            ratio = round(rent_summary["median"] / trade_summary["median"] * 100, 1)
            result["data"].append({
                "region": region_name,
                "tradeMedian": trade_summary["median"],
                "jeonseMedian": rent_summary["median"],
                "ratio": ratio,
                "tradeSamples": trade_summary["count"],
                "jeonseSamples": rent_summary["count"],
            })

    path = os.path.join(BASE_DIR, "jeonse.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"  -> {path} ({len(result['data'])} regions)")


if __name__ == "__main__":
    if not API_KEY:
        print("DATA_GO_KR_API_KEY not set. Using existing sample data.", file=sys.stderr)
        sys.exit(0)

    os.makedirs(BASE_DIR, exist_ok=True)
    build_trades_json()
    build_jeonse_json()
    print("\nDone!")
