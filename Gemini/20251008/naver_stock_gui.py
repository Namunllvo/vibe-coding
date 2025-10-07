"""
naver_stock_gui.py

완전히 새로 작성한 GUI 프로그램입니다. (한 파일)
- PySide6 기반 GUI
- Playwright(Chromium)로 네이버 금융에서 종목 페이지를 찾아 스크린샷(특정 영역) 저장
- 기업개요 텍스트 스크랩 후 GUI에 표시
- 스레드로 비동기 작업 처리(메인 UI 블로킹 없음)
- 실패 시 에러 메시지를 GUI에 표시

사용법 요약
1) Python 3.8+ 설치
2) 의존성 설치:
   pip install playwright PySide6 pillow
   playwright install chromium
3) 실행:
   python naver_stock_gui.py

동작
- 상단 입력창에 종목명(예: 삼성전자) 또는 종목코드(예: 005930)를 입력하고 '검색' 버튼 클릭
- 내부적으로 네이버 검색 페이지에서 finance.naver.com 링크를 찾아 첫번째로 매칭되는 종목코드를 사용
- 해당 종목 페이지에 접속하여 전체 스크린샷을 찍고 기본 캡쳐영역을 크롭하여 저장(./output)
- 기업개요(여러 후보 셀렉터 사용)를 추출하여 텍스트로 저장(./output)하고 GUI 하단에 표시
- 캡쳐 이미지는 GUI 중앙의 미리보기에 표시

주의사항 / 한계
- 네이버 페이지 구조가 바뀌면 셀렉터를 조정해야 합니다. (앱 내에서 사용자 지정 셀렉터 입력 가능)
- 네트워크 상황/로봇 차단(네이버 차단) 시 작동하지 않을 수 있습니다.

"""

import sys
import os
import re
import io
import time
import threading
from datetime import datetime
from pathlib import Path

from PySide6.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit,
    QPushButton, QTextEdit, QFileDialog, QMessageBox, QSpinBox
)
from PySide6.QtGui import QPixmap, QImage
from PySide6.QtCore import Qt, Signal, QObject

from playwright.sync_api import sync_playwright, TimeoutError as PWTimeoutError
from PIL import Image

# 기본값
DEFAULT_VIEWPORT = {"width": 1366, "height": 768}
DEFAULT_AREA = {"left": 264, "top": 233, "right": 1222, "bottom": 726}
OUTPUT_DIR = Path("./output")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

OVERVIEW_SELECTORS = [
    "#summary_info",
    "#content .section.cop_analysis",
    "div.cop_analysis",
    "div.section.cop_analysis",
    "#content .company_summary",
    ".corp_group",
    ".wrap_company",
    "meta[name=description]",
]


def timestamp():
    return datetime.now().strftime("%Y%m%d_%H%M%S")


class WorkerSignals(QObject):
    finished = Signal()
    error = Signal(str)
    result = Signal(bytes, str, str)  # image bytes, overview text, saved_prefix


class ScrapeWorker(threading.Thread):
    def __init__(self, query: str, area: dict, selector_override: str | None = None, headless=True):
        super().__init__()
        self.query = query.strip()
        self.area = area
        self.selector_override = selector_override
        self.signals = WorkerSignals()
        self.headless = headless

    def run(self):
        try:
            code = None
            url = None
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=self.headless)
                context = browser.new_context(viewport=DEFAULT_VIEWPORT)
                page = context.new_page()

                # 1) 사용자가 6자리 숫자(종목코드)를 입력한 경우 그대로 사용
                if re.fullmatch(r"\d{4,6}", self.query):
                    code = self.query.zfill(6)
                    url = f"https://finance.naver.com/item/main.naver?code={code}"
                else:
                    # 2) 이름으로 검색 — 네이버 통합검색에서 finance.naver 링크 찾기
                    q = f"{self.query} 주식"
                    search_url = "https://search.naver.com/search.naver?query=" + q
                    page.goto(search_url, wait_until="domcontentloaded", timeout=15000)
                    time.sleep(0.8)
                    anchors = page.query_selector_all('a')
                    found = None
                    for a in anchors:
                        href = a.get_attribute('href')
                        if not href:
                            continue
                        m = re.search(r"finance\.naver\.com/item/main\.naver\?code=(\d{4,6})", href)
                        if m:
                            code = m.group(1).zfill(6)
                            found = href
                            break
                    if not code:
                        # 대체 전략: 검색 결과 페이지 전체 HTML에서 href 추출(더 넓게 검색)
                        html = page.content()
                        m = re.search(r"finance\.naver\.com/item/main\.naver\?code=(\d{4,6})", html)
                        if m:
                            code = m.group(1).zfill(6)
                    if not code:
                        browser.close()
                        raise RuntimeError(f"종목코드를 찾을 수 없습니다: {self.query}")
                    url = f"https://finance.naver.com/item/main.naver?code={code}"

                # 3) 해당 종목 페이지로 이동
                try:
                    page.goto(url, wait_until="domcontentloaded", timeout=20000)
                except PWTimeoutError:
                    # 그래도 계속 진행
                    pass
                time.sleep(1.0)

                # devicePixelRatio
                try:
                    dpr = page.evaluate("() => window.devicePixelRatio") or 1.0
                except Exception:
                    dpr = 1.0

                # overview 추출
                overview = self.extract_overview(page)

                # screenshot (full page) -> crop
                full_bytes = page.screenshot(full_page=True)

                left = int(self.area['left'] * float(dpr))
                top = int(self.area['top'] * float(dpr))
                right = int(self.area['right'] * float(dpr))
                bottom = int(self.area['bottom'] * float(dpr))

                # 이미지 안전 처리
                img = Image.open(io.BytesIO(full_bytes))
                W, H = img.size
                left = max(0, min(left, W - 1))
                right = max(0, min(right, W))
                top = max(0, min(top, H - 1))
                bottom = max(0, min(bottom, H))
                if right <= left or bottom <= top:
                    # 잘못된 박스면 전체 저장
                    cropped_bytes = full_bytes
                else:
                    cropped = img.crop((left, top, right, bottom))
                    bio = io.BytesIO()
                    cropped.save(bio, format="PNG")
                    cropped_bytes = bio.getvalue()

                # 파일 저장
                prefix = f"{code}_{timestamp()}"
                img_path = OUTPUT_DIR / f"{prefix}.png"
                with open(img_path, "wb") as f:
                    f.write(cropped_bytes)

                txt_path = OUTPUT_DIR / f"{prefix}.txt"
                with open(txt_path, "w", encoding="utf-8") as f:
                    f.write(overview)

                browser.close()

            # 완료 신호
            self.signals.result.emit(cropped_bytes, overview, str(prefix))
        except Exception as e:
            self.signals.error.emit(str(e))
        finally:
            self.signals.finished.emit()

    def extract_overview(self, page):
        selectors = [self.selector_override] + OVERVIEW_SELECTORS if self.selector_override else OVERVIEW_SELECTORS
        for sel in selectors:
            if not sel:
                continue
            try:
                if sel.strip().startswith('meta'):
                    content = page.get_attribute(sel, 'content')
                    if content and content.strip():
                        return content.strip()
                else:
                    el = page.query_selector(sel)
                    if el:
                        txt = el.inner_text().strip()
                        if txt:
                            return txt
            except Exception:
                continue
        # fallback: body 앞부분
        try:
            body = page.query_selector('body')
            if body:
                t = body.inner_text().strip()
                return t[:3000]
        except Exception:
            pass
        return '(No overview found)'


class MainWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle('Naver Stock Capture - GUI')
        self.resize(900, 700)

        layout = QVBoxLayout()

        # Top search bar
        top_row = QHBoxLayout()
        self.input = QLineEdit()
        self.input.setPlaceholderText('종목명(예: 삼성전자) 또는 종목코드(예: 005930) 입력')
        self.btn_search = QPushButton('검색')
        self.btn_search.clicked.connect(self.on_search)
        top_row.addWidget(self.input)
        top_row.addWidget(self.btn_search)

        layout.addLayout(top_row)

        # Preview area (이미지)
        self.preview_label = QLabel('이미지 미리보기 영역')
        self.preview_label.setAlignment(Qt.AlignCenter)
        self.preview_label.setFixedHeight(360)
        self.preview_label.setStyleSheet('border: 1px solid #888; background: #fff;')
        layout.addWidget(self.preview_label)

        # Overview text area
        self.overview_text = QTextEdit()
        self.overview_text.setReadOnly(True)
        self.overview_text.setPlaceholderText('기업개요 텍스트가 여기 표시됩니다.')
        layout.addWidget(self.overview_text)

        # Bottom controls: save folder open, area config, selector input
        bottom_row = QHBoxLayout()
        self.btn_change_folder = QPushButton('저장 폴더 열기')
        self.btn_change_folder.clicked.connect(self.open_output_folder)
        bottom_row.addWidget(self.btn_change_folder)

        self.btn_config_area = QPushButton('캡쳐 영역 설정')
        self.btn_config_area.clicked.connect(self.configure_area)
        bottom_row.addWidget(self.btn_config_area)

        self.selector_input = QLineEdit()
        self.selector_input.setPlaceholderText('기업개요 셀렉터(선택, CSS selector)')
        bottom_row.addWidget(self.selector_input)

        layout.addLayout(bottom_row)

        self.setLayout(layout)

        # internal
        self.current_worker = None
        self.area = DEFAULT_AREA.copy()

    def on_search(self):
        query = self.input.text().strip()
        if not query:
            QMessageBox.warning(self, '입력 필요', '종목명 또는 종목코드를 입력하세요.')
            return
        if self.current_worker and self.current_worker.is_alive():
            QMessageBox.information(self, '진행중', '이미 작업이 진행중입니다. 완료 후 다시 시도하세요.')
            return

        selector_override = self.selector_input.text().strip() or None
        self.overview_text.setPlainText('스크랩 중...')
        self.preview_label.setText('로딩 중...')

        worker = ScrapeWorker(query=query, area=self.area, selector_override=selector_override, headless=True)
        worker.signals.result.connect(self.on_result)
        worker.signals.error.connect(self.on_error)
        worker.signals.finished.connect(self.on_finished)
        self.current_worker = worker
        worker.start()

    def on_result(self, image_bytes: bytes, overview: str, prefix: str):
        # 이미지 보여주기
        qimg = QImage.fromData(image_bytes)
        pix = QPixmap.fromImage(qimg)
        # fit to label
        scaled = pix.scaled(self.preview_label.width(), self.preview_label.height(), Qt.KeepAspectRatio)
        self.preview_label.setPixmap(scaled)
        # overview text
        self.overview_text.setPlainText(overview)
        # 상태 표시
        self.preview_label.setToolTip(f"저장 파일 접두사: {prefix}")

    def on_error(self, msg: str):
        QMessageBox.critical(self, '에러', msg)
        self.overview_text.setPlainText('(오류 발생) ' + msg)
        self.preview_label.setText('에러')

    def on_finished(self):
        # optional: enable/disable controls
        pass

    def open_output_folder(self):
        path = str(OUTPUT_DIR.resolve())
        if sys.platform.startswith('darwin'):
            os.system(f'open "{path}"')
        elif os.name == 'nt':
            os.startfile(path)
        else:
            os.system(f'xdg-open "{path}"')

    def configure_area(self):
        # 간단한 대화형 설정: 숫자 입력을 창으로 받아 대체
        dlg = AreaConfigDialog(self.area, self)
        if dlg.exec():
            self.area = dlg.get_area()


from PySide6.QtWidgets import QDialog, QFormLayout

class AreaConfigDialog(QDialog):
    def __init__(self, area, parent=None):
        super().__init__(parent)
        self.setWindowTitle('캡쳐 영역 설정')
        self.area = area.copy()
        layout = QFormLayout()
        self.left = QSpinBox(); self.left.setRange(0, 10000); self.left.setValue(self.area['left'])
        self.top = QSpinBox(); self.top.setRange(0, 10000); self.top.setValue(self.area['top'])
        self.right = QSpinBox(); self.right.setRange(0, 10000); self.right.setValue(self.area['right'])
        self.bottom = QSpinBox(); self.bottom.setRange(0, 10000); self.bottom.setValue(self.area['bottom'])
        layout.addRow('left', self.left)
        layout.addRow('top', self.top)
        layout.addRow('right', self.right)
        layout.addRow('bottom', self.bottom)
        btn_ok = QPushButton('확인')
        btn_ok.clicked.connect(self.accept)
        btn_cancel = QPushButton('취소')
        btn_cancel.clicked.connect(self.reject)
        hb = QHBoxLayout(); hb.addWidget(btn_ok); hb.addWidget(btn_cancel)
        layout.addRow(hb)
        self.setLayout(layout)

    def get_area(self):
        return {'left': self.left.value(), 'top': self.top.value(), 'right': self.right.value(), 'bottom': self.bottom.value()}


def main():
    app = QApplication(sys.argv)
    w = MainWindow()
    w.show()
    sys.exit(app.exec())


if __name__ == '__main__':
    main()
