"""
주간 부동산 시장 리포트 자동 생성기
- 공공데이터포털 API로 최신 데이터 수집
- 마크다운 + HTML 리포트 생성
- 텔레그램 채널로 발송

환경변수:
  DATA_GO_KR_API_KEY  - 공공데이터포털 API 키
  TELEGRAM_BOT_TOKEN  - 텔레그램 봇 토큰 (선택)
  TELEGRAM_CHANNEL_ID - 텔레그램 채널 ID (선택)
"""

import json
import os
import sys
from datetime import datetime, timedelta
from urllib.parse import quote
from urllib.request import urlopen, Request
from xml.etree import ElementTree as ET

API_KEY = os.environ.get("DATA_GO_KR_API_KEY", "")
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
CHANNEL_ID = os.environ.get("TELEGRAM_CHANNEL_ID", "")

REPORT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "reports")

REGIONS = {
    "서울 강남구": "11680",
    "서울 서초구": "11650",
    "서울 송파구": "11710",
    "서울 마포구": "11440",
    "서울 용산구": "11170",
    "서울 성동구": "11200",
    "서울 강서구": "11500",
    "서울 노원구": "11350",
    "경기 성남시 분당구": "41135",
    "경기 수원시 영통구": "41117",
}


def fetch_trades(region_code: str, year_month: str):
    """아파트 매매 실거래가 조회"""
    url = (
        f"https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade"
        f"?serviceKey={quote(API_KEY, safe='')}"
        f"&LAWD_CD={region_code}&DEAL_YMD={year_month}&numOfRows=1000"
    )
    try:
        req = Request(url, headers={"Accept": "application/xml"})
        with urlopen(req, timeout=30) as resp:
            tree = ET.parse(resp)
        items = tree.findall(".//item")
        prices = []
        for item in items:
            if (item.findtext("cdealType") or "").strip() == "O":
                continue
            try:
                price = int(item.findtext("dealAmount", "0").strip().replace(",", ""))
                prices.append(price)
            except ValueError:
                continue
        if not prices:
            return None
        prices.sort()
        return {
            "count": len(prices),
            "median": prices[len(prices) // 2],
            "min": prices[0],
            "max": prices[-1],
        }
    except Exception as e:
        print(f"  [WARN] trade {region_code}/{year_month}: {e}", file=sys.stderr)
        return None


def fetch_rent(region_code: str, year_month: str):
    """아파트 전세 조회 (월세 제외)"""
    url = (
        f"https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent"
        f"?serviceKey={quote(API_KEY, safe='')}"
        f"&LAWD_CD={region_code}&DEAL_YMD={year_month}&numOfRows=1000"
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
                continue
            try:
                deposits.append(int(item.findtext("deposit", "0").strip().replace(",", "")))
            except ValueError:
                continue
        if not deposits:
            return None
        deposits.sort()
        return {"count": len(deposits), "median": deposits[len(deposits) // 2]}
    except Exception as e:
        print(f"  [WARN] rent {region_code}/{year_month}: {e}", file=sys.stderr)
        return None


def format_price(man: int) -> str:
    """만원 → 한글 표기"""
    if man >= 10000:
        eok = man // 10000
        rest = man % 10000
        if rest == 0:
            return f"{eok}억"
        return f"{eok}억 {rest:,}만"
    return f"{man:,}만"


def collect_data() -> dict:
    """현재 월 + 전월 데이터 수집"""
    now = datetime.now()
    cur_ym = now.strftime("%Y%m")
    prev = now - timedelta(days=32)
    prev_ym = prev.strftime("%Y%m")

    results = {}
    for name, code in REGIONS.items():
        print(f"  {name}...", end=" ", flush=True)
        cur_trade = fetch_trades(code, cur_ym)
        prev_trade = fetch_trades(code, prev_ym)
        cur_rent = fetch_rent(code, cur_ym)

        jeonse_ratio = None
        if cur_trade and cur_rent and cur_trade["median"] > 0:
            jeonse_ratio = round(cur_rent["median"] / cur_trade["median"] * 100, 1)

        change_pct = None
        if cur_trade and prev_trade and prev_trade["median"] > 0:
            change_pct = round((cur_trade["median"] - prev_trade["median"]) / prev_trade["median"] * 100, 1)

        results[name] = {
            "trade": cur_trade,
            "prev_trade": prev_trade,
            "rent": cur_rent,
            "jeonse_ratio": jeonse_ratio,
            "change_pct": change_pct,
        }
        print("OK" if cur_trade else "SKIP")

    return results


def generate_markdown(data: dict) -> str:
    """마크다운 리포트 생성"""
    now = datetime.now()
    date_str = now.strftime("%Y년 %m월 %d일")
    week_num = now.isocalendar()[1]

    lines = [
        f"# 📊 주간 부동산 시장 리포트",
        f"**{date_str}** (제{week_num}주)",
        "",
        "---",
        "",
        "## 📈 지역별 매매 시세",
        "",
        "| 지역 | 중위 매매가 | 전월 대비 | 거래량 | 전세가율 |",
        "|------|-----------|----------|--------|---------|",
    ]

    sorted_regions = sorted(
        data.items(),
        key=lambda x: (x[1]["trade"]["median"] if x[1]["trade"] else 0),
        reverse=True,
    )

    for name, d in sorted_regions:
        trade = d["trade"]
        if not trade:
            continue

        price_str = format_price(trade["median"])
        change = d["change_pct"]
        if change is not None:
            change_str = f"{'🔺' if change > 0 else '🔻' if change < 0 else '➡️'} {abs(change)}%"
        else:
            change_str = "-"

        count_str = f"{trade['count']}건"
        ratio_str = f"{d['jeonse_ratio']}%" if d["jeonse_ratio"] else "-"

        lines.append(f"| {name} | {price_str}원 | {change_str} | {count_str} | {ratio_str} |")

    lines.extend([
        "",
        "---",
        "",
        "## 🔍 주요 포인트",
        "",
    ])

    # 상승 TOP 3
    rising = [(n, d) for n, d in sorted_regions if d["change_pct"] and d["change_pct"] > 0]
    rising.sort(key=lambda x: x[1]["change_pct"], reverse=True)
    if rising:
        lines.append("**상승 지역 TOP 3:**")
        for name, d in rising[:3]:
            lines.append(f"- {name}: +{d['change_pct']}% ({format_price(d['trade']['median'])}원)")
        lines.append("")

    # 하락 지역
    falling = [(n, d) for n, d in sorted_regions if d["change_pct"] and d["change_pct"] < 0]
    falling.sort(key=lambda x: x[1]["change_pct"])
    if falling:
        lines.append("**하락 지역:**")
        for name, d in falling[:3]:
            lines.append(f"- {name}: {d['change_pct']}% ({format_price(d['trade']['median'])}원)")
        lines.append("")

    # 전세가율 경고
    high_ratio = [(n, d) for n, d in sorted_regions if d["jeonse_ratio"] and d["jeonse_ratio"] >= 60]
    high_ratio.sort(key=lambda x: x[1]["jeonse_ratio"], reverse=True)
    if high_ratio:
        lines.append("**⚠️ 전세가율 주의 지역 (60% 이상):**")
        for name, d in high_ratio:
            lines.append(f"- {name}: {d['jeonse_ratio']}%")
        lines.append("")

    lines.extend([
        "---",
        "",
        "📊 [대시보드에서 상세 차트 보기](https://budongjw.github.io/real-estate-analysis-notebooks/)",
        "",
        "*데이터 출처: 국토교통부 실거래가 공개시스템 (공공데이터포털)*",
        f"*생성일: {now.strftime('%Y-%m-%d %H:%M')} KST*",
    ])

    return "\n".join(lines)


def generate_telegram_message(data: dict) -> str:
    """텔레그램용 축약 메시지 (4096자 제한)"""
    now = datetime.now()
    date_str = now.strftime("%Y.%m.%d")

    lines = [f"📊 주간 부동산 시장 리포트 ({date_str})", ""]

    sorted_regions = sorted(
        data.items(),
        key=lambda x: (x[1]["trade"]["median"] if x[1]["trade"] else 0),
        reverse=True,
    )

    for name, d in sorted_regions:
        trade = d["trade"]
        if not trade:
            continue

        price = format_price(trade["median"])
        change = d["change_pct"]
        emoji = "🔺" if change and change > 0 else "🔻" if change and change < 0 else "➡️"
        change_str = f"{emoji}{abs(change)}%" if change is not None else ""
        ratio_str = f" | 전세가율 {d['jeonse_ratio']}%" if d["jeonse_ratio"] else ""

        lines.append(f"▪️ {name}: {price}원 {change_str}{ratio_str}")

    lines.extend([
        "",
        "📈 상세 차트 → budongjw.github.io/real-estate-analysis-notebooks",
        "",
        "#부동산 #실거래가 #시장분석",
    ])

    return "\n".join(lines)


def send_telegram(message: str):
    """텔레그램 채널로 메시지 전송"""
    if not BOT_TOKEN or not CHANNEL_ID:
        print("  텔레그램 설정 없음 → 전송 생략", file=sys.stderr)
        return False

    import urllib.parse

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = urllib.parse.urlencode({
        "chat_id": CHANNEL_ID,
        "text": message,
        "parse_mode": "Markdown",
        "disable_web_page_preview": "true",
    }).encode()

    try:
        req = Request(url, data=payload, method="POST")
        with urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read())
            if result.get("ok"):
                print("  ✅ 텔레그램 전송 완료")
                return True
            else:
                print(f"  ❌ 텔레그램 오류: {result}", file=sys.stderr)
                return False
    except Exception as e:
        print(f"  ❌ 텔레그램 전송 실패: {e}", file=sys.stderr)
        return False


def save_report(markdown: str):
    """리포트를 파일로 저장"""
    os.makedirs(REPORT_DIR, exist_ok=True)
    date_str = datetime.now().strftime("%Y-%m-%d")
    path = os.path.join(REPORT_DIR, f"report-{date_str}.md")
    with open(path, "w", encoding="utf-8") as f:
        f.write(markdown)
    print(f"  리포트 저장: {path}")

    # latest.md로도 저장 (대시보드 표시용)
    latest = os.path.join(REPORT_DIR, "latest.md")
    with open(latest, "w", encoding="utf-8") as f:
        f.write(markdown)


def use_sample_data() -> dict:
    """API 키 없을 때 샘플 데이터로 리포트 생성"""
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "data")
    trades_path = os.path.join(data_dir, "trades.json")
    jeonse_path = os.path.join(data_dir, "jeonse.json")

    with open(trades_path, "r", encoding="utf-8") as f:
        trades = json.load(f)
    with open(jeonse_path, "r", encoding="utf-8") as f:
        jeonse_data = json.load(f)

    jeonse_map = {d["region"]: d for d in jeonse_data["data"]}
    results = {}

    for name, region in trades["regions"].items():
        monthly = region["monthly"]
        cur = monthly[-1]
        prev = monthly[-2] if len(monthly) >= 2 else None

        change_pct = None
        if prev and prev["median"] > 0:
            change_pct = round((cur["median"] - prev["median"]) / prev["median"] * 100, 1)

        j = jeonse_map.get(name)
        results[name] = {
            "trade": {"count": cur["count"], "median": cur["median"], "min": cur["min"], "max": cur["max"]},
            "prev_trade": {"median": prev["median"]} if prev else None,
            "rent": {"median": j["jeonseMedian"]} if j else None,
            "jeonse_ratio": j["ratio"] if j else None,
            "change_pct": change_pct,
        }

    return results


if __name__ == "__main__":
    print("=== 주간 부동산 시장 리포트 생성 ===")

    if API_KEY:
        print("API 키 확인 → 실데이터 수집")
        data = collect_data()
    else:
        print("API 키 없음 → 샘플 데이터 사용")
        data = use_sample_data()

    md = generate_markdown(data)
    save_report(md)

    tg_msg = generate_telegram_message(data)
    send_telegram(tg_msg)

    print("\n=== 완료 ===")
