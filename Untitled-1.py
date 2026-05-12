import yfinance as yf
import pandas as pd
import FinanceDataReader as fdr

def get_market_ingredients(start_date='2024-01-01'):
    """
    시장 국면 파악을 위한 날씨 지표(매크로)와 개별 종목 데이터를 수집하고 병합합니다.
    """
    print("🚀 전략 재료 수집 시작...\n")
    
    # 1. 날씨 지표 (금리, 공포지수)
    # 미국 10년물 국채 금리
    interest_rate = fdr.DataReader('US10YT=X', start_date)['Close']
    interest_rate.name = 'US_10Y_Rate'
    
    # VIX 공포지수
    vix = yf.download('^VIX', start=start_date)['Close']
    vix.name = 'VIX'
    
    # 2. 시장 지수 (S&P 500)
    market_index = yf.download('^GSPC', start=start_date)['Close']
    market_index.name = 'S&P500'
    
    # 3. 개별 종목 데이터 (예: 삼성전자)
    samsung = fdr.DataReader('005930', start_date)['Close']
    samsung.name = 'Samsung_005930'
    
    # 💡 체크 포인트 1 & 2 반영: 데이터의 '시간' 맞추기 및 결측치(빈칸) 처리
    # 날짜(Index)를 기준으로 하나의 데이터프레임으로 병합합니다. (Outer Join)
    df_combined = pd.concat([interest_rate, vix, market_index, samsung], axis=1)
    
    # 휴장일 차이로 인해 발생한 결측치를 이전 데이터로 채웁니다.
    df_combined = df_combined.ffill().dropna()
    
    print("✅ 모든 데이터 수집 및 병합 완료!")
    return df_combined

def classify_market_regime(df):
    """
    수집된 데이터를 바탕으로 현재 시장의 국면(날씨)을 판단합니다.
    - S&P500 20일 이동평균선(MA20) 계산
    - VIX 지수가 20 미만이고, S&P500이 20일 이평선 위에 있으면 '상승장(Risk On)'
    - 그렇지 않으면 '관망/위험(Risk Off)'
    """
    print("🔍 시장 국면(날씨) 분석 중...")
    
    # 20일 이동평균선 계산
    df['S&P500_MA20'] = df['S&P500'].rolling(window=20).mean()
    
    # 기본 국면은 'Risk Off (관망)'으로 설정
    df['Regime'] = 'Risk Off (관망)'
    
    # 안전/상승장 조건: S&P500이 20일 이평선 위에 있고, VIX 공포지수가 20 미만일 때
    condition_risk_on = (df['S&P500'] > df['S&P500_MA20']) & (df['VIX'] < 20)
    df.loc[condition_risk_on, 'Regime'] = 'Risk On (상승장)'
    
    return df

if __name__ == "__main__":
    # 데이터 수집 함수 실행
    market_data = get_market_ingredients()
    
    # 2단계: 시장 국면 판단기 적용
    market_data = classify_market_regime(market_data)
    
    # 데이터 확인
    print("\n[최근 5일 국면 판단 결과 확인]")
    print(market_data[['VIX', 'S&P500', 'S&P500_MA20', 'Regime']].tail())
    print("-" * 50)
    
    # 현재 금리와 공포지수 출력 (마지막 행 기준)
    current_rate = float(market_data['US_10Y_Rate'].iloc[-1])
    current_vix = float(market_data['VIX'].iloc[-1])
    current_regime = market_data['Regime'].iloc[-1]
    
    print(f"현재 금리: {current_rate:.2f}%, 현재 공포지수: {current_vix:.2f}")
    print(f"👉 현재 시장 국면: {current_regime}")
