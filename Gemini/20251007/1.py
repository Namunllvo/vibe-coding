import tkinter as tk
from tkinter import messagebox, filedialog
from PIL import ImageGrab, ImageTk
from pynput import mouse
import threading

clicks = []
captured_image = None

def on_click(x, y, button, pressed):
    global clicks
    if pressed:
        clicks.append((int(x), int(y)))
        print(f"클릭 좌표: ({x}, {y})")
        if len(clicks) == 2:
            listener.stop()
            capture_area(clicks[0], clicks[1])

def capture_area(pt1, pt2):
    global captured_image
    left = min(pt1[0], pt2[0])
    top = min(pt1[1], pt2[1])
    right = max(pt1[0], pt2[0])
    bottom = max(pt1[1], pt2[1])

    # 화면 캡처
    captured_image = ImageGrab.grab(bbox=(left, top, right, bottom))

    # GUI 미리보기
    img = captured_image.resize((300, 200))
    photo = ImageTk.PhotoImage(img)
    label_preview.config(image=photo)
    label_preview.image = photo

def start_capture():
    global clicks, listener
    clicks = []
    messagebox.showinfo("알림", "캡처할 영역의 두 점을 클릭하세요.")
    listener = mouse.Listener(on_click=on_click)
    listener.start()

def save_image():
    global captured_image
    if captured_image:
        file_path = filedialog.asksaveasfilename(
            defaultextension=".png",  # 기본 확장자
            filetypes=[("PNG 파일", "*.png"),
                       ("JPEG 파일", "*.jpg"),
                       ("모든 파일", "*.*")])
        if file_path:
            # 확장자 확인 후 저장 형식 지정
            ext = file_path.split('.')[-1].lower()
            if ext in ['jpg', 'jpeg']:
                captured_image.convert("RGB").save(file_path, "JPEG")
            else:
                captured_image.save(file_path)  # PNG 등 기본
            messagebox.showinfo("저장 완료", f"{file_path}로 저장되었습니다.")
    else:
        messagebox.showwarning("경고", "저장할 이미지가 없습니다.")

# Tkinter GUI 설정
root = tk.Tk()
root.title("멀티 윈도우 캡처 프로그램")

# 창 크기
window_width = 600
window_height = 400

# 화면 크기 가져오기
screen_width = root.winfo_screenwidth()
screen_height = root.winfo_screenheight()

# 화면 중앙 좌표 계산
x = (screen_width // 2) - (window_width // 2)
y = (screen_height // 2) - (window_height // 2)

# 창 위치 및 크기 설정
root.geometry(f"{window_width}x{window_height}+{x}+{y}")

# 캡처 버튼 (스레드 사용)
capture_btn = tk.Button(root, text="스크린샷 찍기", command=lambda: threading.Thread(target=start_capture).start(), width=20, height=2)
capture_btn.pack(pady=20)

# 미리보기 라벨
label_preview = tk.Label(root)
label_preview.pack(pady=20)

# 저장 버튼
save_btn = tk.Button(root, text="저장하기", command=save_image, width=20, height=2)
save_btn.pack(pady=10)

root.mainloop()
