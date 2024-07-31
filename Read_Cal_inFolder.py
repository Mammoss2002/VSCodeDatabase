from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import pandas as pd
import os
import time

# ฟังก์ชันจัดการเหตุการณ์การเปลี่ยนแปลง
def on_change(event):
    if event.is_directory:
        return None
    elif event.event_type == 'created':
        # เมื่อไฟล์ใหม่ถูกสร้าง
        process_new_file(event.src_path)

def process_new_file(file_path):
    if file_path.endswith('.csv'):
        time.sleep(1)  # หน่วงเวลา 1 วินาที เพื่อให้แน่ใจว่าไฟล์ถูกสร้างเสร็จ
        try:
            df = pd.read_csv(file_path, delimiter='|', header=None)
            # ตรวจสอบค่าในคอลัมน์ที่สอง (index 2)
            if df.shape[1] > 0 and df[0].str.startswith('MSJCTH').any():
                if df.shape[1] > 2:
                    global count_p, count_f
                    count_p += df[df[2].str.strip() == 'P'].shape[0]
                    count_f += df[df[2].str.strip() == 'F'].shape[0]
                    update_results()
            #remove file after read
            os.remove(file_path)

        except PermissionError:
            print(f"Permission denied: {file_path}")
        except Exception as e:
            print(f"Error processing file {file_path}: {e}")

def update_results():
    Total_Board = count_p + count_f
    Yield = (count_p / Total_Board) * 100 if Total_Board > 0 else 0

    # แสดงผลลัพธ์
    print(f'\n| {"Model":<10} | {"Total":<10} | {"Pass":<10} | {"Fail":<10} | {"Yield":<10} |')
    print(f'| {"-"*10} | {"-"*10} | {"-"*10} | {"-"*10} | {"-"*10} |')
    print(f'| {"GATO":<10} | {Total_Board:<10} | {count_p:<10} | {count_f:<10} | {Yield:<10.2f}%| ')
    print(f'| {"-"*10} | {"-"*10} | {"-"*10} | {"-"*10} | {"-"*10} |')

# ตัวแปรนับจำนวน 'P' และ 'F'
count_p = 0
count_f = 0

# กำหนดไดเรกทอรีที่ต้องการติดตาม (ตรวจสอบเส้นทางให้ถูกต้อง)
watch_dir = "Folder"

# สร้างและกำหนดค่า Event Handler
event_handler = FileSystemEventHandler()
event_handler.on_created = on_change

# สร้างและเริ่มต้น Observer
observer = Observer()
observer.schedule(event_handler, watch_dir, recursive=False)
observer.start()

try:
    while True:
        observer.join(timeout=1)
except KeyboardInterrupt:
    observer.stop()
    observer.join()