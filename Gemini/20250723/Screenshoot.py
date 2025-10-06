from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from PIL import Image
import time

# 1. 크롬 옵션 설정
options = Options()
options.add_argument('--headless')  # 창 안 띄우고 실행
options.add_argument('--window-size=1920,1080')

# 2. 드라이버 실행
driver = webdriver.Chrome(service=Service('/path/to/chromedriver'), options=options)

# 3. URL 접속
driver.get('https://finance.naver.com/item/main.naver?code=005930&stockExchangeType=KRX')
time.sleep(3)  # 콘텐츠 로딩 대기

# 4. 스크린샷 찍을 요소 선택
element = driver.find_element("css selector", "#content > div.section.trade_compare")

# 5. 전체 페이지 스크린샷 후, 원하는 요소 잘라내기
driver.save_screenshot("full_page.png")
location = element.location
size = element.size

left = location['x']
top = location['y']
right = left + size['width']
bottom = top + size['height']

image = Image.open("full_page.png")
cropped_image = image.crop((left, top, right, bottom))
cropped_image.save("samsung_price_section.png")

driver.quit()