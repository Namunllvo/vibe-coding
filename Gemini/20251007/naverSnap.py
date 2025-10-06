import sys
import os
from PyQt6.QtWidgets import QApplication, QWidget, QVBoxLayout, QLabel, QLineEdit, QPushButton, QFileDialog
from playwright.sync_api import sync_playwright
from PIL import Image

class StockCaptureApp(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("주식 페이지 영역 캡쳐")
        self.setGeometry(200, 200, 400, 150)
        layout = QVBoxLayout()

        self.label = QLabel("검색어 입력:")
        layout.addWidget(self.label)

        self.search_input = QLineEdit()
        layout.addWidget(self.search_input)

        self.capture_button = QPushButton("캡쳐")
        self.capture_button.clicked.connect(self.capture_stock_page)
        layout.addWidget(self.capture_button)

        self.setLayout(layout)

    def capture_stock_page(self):
        search_word = self.search_input.text().strip()
        if not search_word:
            self.label.setText("검색어를 입력하세요!")
            return

        folder = QFileDialog.getExistingDirectory(self, "이미지 저장 폴더 선택")
        if not folder:
            return

        url = f"https://finance.naver.com/item/main.naver?code=005930"

        # 캡쳐 영역 좌표
        x1, y1 =, 233
        x2, y2 = 1000, 726
        width = x2 - x1
        height = y2 - y1

        with sync_playwright() as p:
            # 브라우저 실행 시 창 크기 지정
            browser = p.chromium.launch(headless=True, args=["--window-size=1512,561"])
            page = browser.new_page(viewport={"width": 1200, "height": 900})
            page.goto(url)
            page.wait_for_timeout(3000)  # 페이지 로딩 대기

            # 전체 페이지 스크린샷
            screenshot_bytes = page.screenshot(full_page=False)
            browser.close()

            # Pillow로 특정 영역 크롭
            image = Image.open(BytesIO(screenshot_bytes))
            cropped = image.crop((x1, y1, x2, y2))

            save_path = os.path.join(folder, f"{search_word}.png")
            cropped.save(save_path)
            self.label.setText(f"저장 완료: {save_path}")

if __name__ == "__main__":
    from io import BytesIO
    app = QApplication(sys.argv)
    window = StockCaptureApp()
    window.show()
    sys.exit(app.exec())
