import csv
import time
import datetime
import os
import concurrent.futures
import gc
from src.download_m3u8 import get_m3u8_url, clear_seleniumwire_cache, increase_file_limit

def process_url(url, file_name, index, total):
    """
    Process a single URL and obtain m3u8 link
    """
    print(f"[*] 处理第 {index+1}/{total} 筆資料: {file_name}")
    print(f"[*] URL: {url}")
    
    try:
        m3u8_url = get_m3u8_url(url)
        if m3u8_url:
            print(f"[*] 成功取得 m3u8: {m3u8_url}")
            return m3u8_url
        else:
            print(f"[!] 無法取得 m3u8")
            return ""
    except Exception as e:
        print(f"[!] 處理 URL 時發生錯誤: {e}")
        return ""
    finally:
        gc.collect()

def process_csv(csv_file, max_workers=2, save_interval=5, start_from=0, max_retries=3):
    """
    Read CSV file, get m3u8 URLs for each entry, and update the CSV file
    
    Parameters:
    - csv_file: Path to the CSV file
    - max_workers: Maximum number of parallel threads
    - save_interval: How often to save results (number of entries)
    - start_from: Starting position for processing (for resuming)
    - max_retries: Maximum retry attempts on error
    """
    print(f"[*] 開始處理 CSV 檔案: {csv_file}")
    print(f"[*] 開始時間: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"[*] 設定: 最大並行數={max_workers}, 儲存間隔={save_interval}, 起始位置={start_from}")
    
    increase_file_limit()
    
    clear_seleniumwire_cache()
    
    checkpoint_file = f"{csv_file}.checkpoint"
    
    if os.path.exists(checkpoint_file) and start_from == 0:
        try:
            with open(checkpoint_file, 'r') as f:
                start_from = int(f.read().strip())
                print(f"[*] 從上次中斷點繼續處理: 第 {start_from} 筆")
        except Exception as e:
            print(f"[!] 讀取斷點文件時發生錯誤: {e}")
            start_from = 0
    
    rows = []
    try:
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames
            print(f"[*] CSV 欄位名稱: {fieldnames}")
            rows = list(reader)
        print(f"[*] 讀取到 {len(rows)} 筆資料")
    except Exception as e:
        print(f"[!] 讀取 CSV 檔案時發生錯誤: {e}")
        return
    
    tasks = []
    for i, row in enumerate(rows):
        if i < start_from:
            continue
            
        if not row.get('url'):
            print(f"[!] 第 {i+1} 筆資料缺少 URL，跳過")
            continue
        
        url = row['url'].strip()
        file_name = row.get(fieldnames[0], f"項目 {i+1}")
        
        tasks.append((i, url, file_name, row))
    
    if not tasks:
        print("[*] 沒有需要處理的任務或全部已完成")
        if os.path.exists(checkpoint_file):
            os.remove(checkpoint_file)
        return
        
    print(f"[*] 待處理任務數: {len(tasks)}")
    
    processed_count = 0
    last_save_time = time.time()
    
    batch_size = 10
    
    for batch_start in range(0, len(tasks), batch_size):
        batch_end = min(batch_start + batch_size, len(tasks))
        current_batch = tasks[batch_start:batch_end]
        
        print(f"[*] 開始處理第 {batch_start+1} 到 {batch_end} 筆任務 (共 {len(tasks)} 筆)")
        
        clear_seleniumwire_cache()
        gc.collect()
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_task = {
                executor.submit(process_url, url, file_name, i, len(rows)): (i, row)
                for i, url, file_name, row in current_batch
            }
            
            for future in concurrent.futures.as_completed(future_to_task):
                i, row = future_to_task[future]
                
                retry_count = 0
                result = None
                while retry_count < max_retries:
                    try:
                        result = future.result()
                        break
                    except Exception as e:
                        retry_count += 1
                        print(f"[!] 任務 {i+1} 執行失敗 (嘗試 {retry_count}/{max_retries}): {e}")
                        if retry_count < max_retries:
                            print(f"[*] 準備重試...")
                            time.sleep(2)
                        else:
                            print(f"[!] 達到最大重試次數，跳過")
                            result = ""
                
                row['m3u8'] = result
                processed_count += 1
                
                with open(checkpoint_file, 'w') as f:
                    f.write(str(i + 1))
                
                current_time = time.time()
                if processed_count % save_interval == 0 or (current_time - last_save_time) > 60:
                    try:
                        # 過濾掉包含 None 值的行
                        filtered_rows = []
                        for row in rows:
                            filtered_row = {k: (v if v is not None else '') for k, v in row.items() if k in fieldnames}
                            filtered_rows.append(filtered_row)
                        
                        with open(csv_file, 'w', encoding='utf-8', newline='') as f:
                            writer = csv.DictWriter(f, fieldnames=fieldnames)
                            writer.writeheader()
                            writer.writerows(filtered_rows)
                        print(f"[*] 已處理 {processed_count}/{len(tasks)} 筆資料，已將結果儲存至 CSV 檔案")
                        last_save_time = current_time
                    except Exception as e:
                        print(f"[!] 儲存 CSV 檔案時發生錯誤: {e}")
                
        batch_progress = (batch_end / len(tasks)) * 100
        print(f"[*] 已完成 {batch_end}/{len(tasks)} 筆任務 ({batch_progress:.1f}%)")
        print(f"[*] 休息 2 秒后继续下一批...")
        time.sleep(2)
    
    try:
        # 過濾掉包含 None 值的行
        filtered_rows = []
        for row in rows:
            filtered_row = {k: (v if v is not None else '') for k, v in row.items() if k in fieldnames}
            filtered_rows.append(filtered_row)
        
        with open(csv_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(filtered_rows)
        print(f"[*] 全部處理完成，最終結果已儲存至 CSV 檔案")
        
        if os.path.exists(checkpoint_file):
            os.remove(checkpoint_file)
    except Exception as e:
        print(f"[!] 最終儲存 CSV 檔案時發生錯誤: {e}")
    
    print(f"[*] 處理完成時間: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='批量獲取 m3u8 連結')
    parser.add_argument('--csv', type=str, default="consensus_test.csv", help='CSV 文件路徑')
    parser.add_argument('--workers', type=int, default=2, help='並行處理的線程數')
    parser.add_argument('--save', type=int, default=5, help='每處理多少條數據保存一次')
    parser.add_argument('--start', type=int, default=0, help='從第幾條數據開始處理')
    parser.add_argument('--retries', type=int, default=3, help='重試次數')
    args = parser.parse_args()
    
    process_csv(args.csv, args.workers, args.save, args.start, args.retries)