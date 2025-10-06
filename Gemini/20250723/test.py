# 필요한 라이브러리 불러오기
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
import time

def get_stock_summary_text(stock_name):
    """
    네이버 금융 페이지에서 특정 종목의 기업 개요 텍스트를 가져오는 함수입니다.
    """
    try:
        # 1. 종목명으로 종목 코드 가져오기
        stock_codes = {
            "삼성전자": "005930",
            "카카오": "035720"
        }

        if stock_name not in stock_codes:
            print(f"'{stock_name}'에 대한 종목 코드를 찾을 수 없습니다. '삼성전자' 또는 '카카오'를 입력해주세요.")
            return

        stock_code = stock_codes[stock_name]
        
        # 2. 네이버 금융 페이지 URL 생성
        url = f"https://finance.naver.com/item/main.naver?code={stock_code}"
        
        # 3. WebDriver 설정 및 브라우저 열기
        # chromedriver.exe 파일이 현재 파이썬 파일과 같은 폴더에 있다고 가정합니다.
        service = Service(executable_path='./chromedriver.exe')
        driver = webdriver.Chrome(service=service)

        print(f"'{stock_name}' 주가 페이지로 이동 중...")
        driver.get(url)
        
        # 페이지 로딩 대기
        time.sleep(5) 
        
        # 4. '기업개요' 팝업창 열기
        try:
            summary_button = driver.find_element(By.CSS_SELECTOR, 'a.fl') # '기업개요' 링크를 찾습니다.
            summary_button.click()
            time.sleep(2) # 팝업 로딩 대기
        except Exception as e:
            print("기업개요 버튼을 찾을 수 없습니다.")
            driver.quit()
            return
        
        # 5. 특정 영역 (div id="summary_info") 찾기
        summary_element = driver.find_element(By.ID, 'summary_info')
        
        # 6. 텍스트 정보 가져오기
        # 'p' 태그에 있는 모든 텍스트를 추출합니다.
        paragraphs = summary_element.find_elements(By.TAG_NAME, 'p')
        summary_text = "\n".join([p.text for p in paragraphs])
        
        print("\n--- 기업 개요 텍스트 정보 ---")
        print(summary_text)
        print("----------------------------")
        
    except Exception as e:
        print(f"오류가 발생했습니다: {e}")
        
    finally:
        # 7. 브라우저 닫기
        if 'driver' in locals():
            driver.quit()

# 사용자로부터 종목명 입력 받기
user_input = input("기업 개요 텍스트를 가져올 종목명을 입력하세요 (예: 삼성전자, 카카오): ")
get_stock_summary_text(user_input)