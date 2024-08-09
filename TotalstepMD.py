import requests
from pymongo import MongoClient
from datetime import datetime
import schedule
import time

client = MongoClient('mongodb://localhost:27017/')
db = client['myDatabase']
users_collection = db['internDatabase']

def fetch_and_send_data():
    url = 'http://"IP_ADDRESS"/get_all_process_stations_ui/'
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        for item in data:
            timeStamp = datetime.now()
            newData = {
                "station_name" : item["station_name"],
                "passed_process_count" : item["passed_process_count"],
                "failed_process_count" : item["failed_process_count"],
                "aborted_process_count" : item["aborted_process_count"],
                "process_count" : item["process_count"],
                "current_step" : item["current_step"],
                "current_process_plan" : item["current_process_plan"],
                "current_serial_number" : item["current_serial_number"],
                "elapsed_seconds_for_display" : item["elapsed_seconds_for_display"],
                "time_stamp" : timeStamp
            }
            result = users_collection.insert_one(newData)
            print(f'Add data id: {result.inserted_id}')
    else:
        print(f"Error: {response.status_code}")

schedule.every(1).minutes.do(fetch_and_send_data)

while True:
    schedule.run_pending()
    time.sleep(1)
