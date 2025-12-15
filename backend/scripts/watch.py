#file that watches for change and push to db via API using http

import customtkinter as ctk
from tkinter import filedialog, messagebox
import threading
import pandas as pd
import time
import json
import os
import requests
from datetime import datetime
# ------------------------------------
# API QUEUE SYSTEM  (from your snippet)
# ------------------------------------

API_URL = "https://bio-monitor.onrender.com/api/v1/dataup/push"
QUEUE_FILE = "queue.json"

# Reset queue.json
# ALWAYS RESET QUEUE ON START
with open(QUEUE_FILE, "w") as f:
    json.dump([], f)


def load_queue():
    if os.path.exists(QUEUE_FILE):
        with open(QUEUE_FILE, "r") as f:
            return json.load(f)
    return []


def save_queue(queue):
    with open(QUEUE_FILE, "w") as f:
        json.dump(queue, f)


def send_payload(payload, retries=5):
    for attempt in range(1, retries + 1):
        try:
            response = requests.post(API_URL, json=payload, timeout=5)

            if response.status_code == 200:
                return True

            print(f"Server error: {response.text}")

        except requests.exceptions.RequestException as e:
            print(f"Network error: {e}")

        wait = min(2 ** attempt, 30)
        print(f"Retrying in {wait} seconds...")
        time.sleep(wait)

    return False


# ------------------------------------
# DATA HELPERS
# ------------------------------------

def safe_timestamp(row):
    ts = pd.to_datetime(str(row["Date"]) + " " + str(row["Time"]), errors="coerce")
    return None if pd.isna(ts) else ts.isoformat()


def prepare_gas_payload(row, reactor_id):
    return {
        "gas":{
        "reactor_id": reactor_id,
        "timestamp": safe_timestamp(row),
        "OUR": row.get('OUR'),
        "RQ": row.get('RQ'),
        "Kla_1h": row.get('Kla(1/h)'),
        "Kla_bar": row.get('Kla bar(mmol/min atm)'),
        "stirrer_speed": row.get('Stirrer speed'),
        "pH": row.get('pH'),
        "DO": row.get('DO'),
        "reactor_temp": row.get('Reactor temperature (C)'),
        "pio2": row.get('pio2'),
        "gas_flow_in": row.get('Gas flow in'),
        "reactor_volume": row.get('Reactor volume(l)'),
        "Tout": row.get('Tout'),
        "Tin": row.get('Tin'),
        "Pout": row.get('Pout'),
        "Pin": row.get('Pin'),
        "gas_out": row.get('Gas out'),
        "Ni": row.get('Ni'),
        "Nout": row.get('Nout'),
        "CPR": row.get('CPR'),
        "Yo2in": row.get('Yo2in'),
        "Yo2out": row.get('Yo2out'),
        "Yco2in": row.get('Yco2in'),
        "Yco2out": row.get('Yco2out'),
        "Yinert_in": row.get('Yinert in'),
        "Yinert_out": row.get('Yinert out'),
        "uploaded_at": datetime.now().isoformat()
        }
    }


def prepare_level_payload(row, reactor_id):
    return {
        "level_control": {
            "reactor_id": reactor_id,
            "timestamp": safe_timestamp(row),
            "reactor_weight": row.get('Reactor weigt(kg)'),
            "volume_reactor": row.get('Volume of Reactor'),
            "pid_value": row.get('PID'),
            "pump_rpm": row.get('E. Pump RPM'),
            "uploaded_at": datetime.now().isoformat()
            }
        }


def prepare_dilution_payload(row, reactor_id):
    return {
        "dilution": {
            "reactor_id": reactor_id,
            "timestamp": safe_timestamp(row),
            "time_passed": row.get('Time passed'),
            "flowrate": row.get('Flowrate'),
            "dilution_rate": row.get('Dilution rate'),
            "volume_reactor": row.get('Volume of Reactor'),
            "mass_in_tank": row.get('Mass in Tank'),
            "filtered_mass_in_tank": row.get('Filtered Mass in tank'),
            "total_tank_balance": row.get('Total tank balance'),
            "uploaded_at": datetime.now().isoformat()
        }
    }


# ------------------------------------
# WATCHER THREAD: NOW SENDS TO API
# ------------------------------------

class ExcelWatcher(threading.Thread):
    def __init__(self, filepath, reactor_id, prepare_fn, update_status):
        super().__init__(daemon=True)
        self.filepath = filepath
        self.reactor_id = reactor_id
        self.prepare_fn = prepare_fn
        self.update_status = update_status
        self.running = True
        self.last_rows = 0

    def run(self):
        queue = load_queue()

        while self.running:
            try:
                df = pd.read_excel(self.filepath)

                if len(df) > self.last_rows:
                    new_df = df.tail(len(df) - self.last_rows)

                    for _, row in new_df.iterrows():
                        timestamp = safe_timestamp(row)
                        if timestamp is None:
                            print("Invalid date/time, skipping row.")
                            continue

                        payload = self.prepare_fn(row, self.reactor_id)
                        queue.append(payload)

                    save_queue(queue)

                    self.last_rows = len(df)
                    self.update_status(f"Queued {len(new_df)} new rows")

                # Try sending queue
                new_queue = []
                for item in queue:
                    if send_payload(item):
                        print("Delivered:", item)
                    else:
                        new_queue.append(item)

                queue = new_queue
                save_queue(queue)

            except Exception as e:
                print("Error:", e)
                self.update_status(f"Error: {e}")

            time.sleep(3)

    def stop(self):
        self.running = False


# ------------------------------------
# GUI (UNCHANGED)
# ------------------------------------

class MonitorApp(ctk.CTk):

    def __init__(self):
        super().__init__()
        self.title("Reactor Excel Data Watcher")
        self.geometry("700x600")

        self.watchers = []
        self.create_ui()

    def create_ui(self):

        frame = ctk.CTkScrollableFrame(self, corner_radius=10)
        frame.pack(padx=20, pady=20, fill="both", expand=True)

        ctk.CTkLabel(frame, text="Reactor ID:", font=("Arial", 16)).pack(anchor="w")
        self.reactor_id_var = ctk.StringVar(value="1")
        ctk.CTkEntry(frame, textvariable=self.reactor_id_var).pack(fill="x", pady=5)

        self.file_vars = {
            "gas": ctk.StringVar(),
            "level": ctk.StringVar(),
            "dilution": ctk.StringVar()
        }

        def create_file_input(label, key):
            ctk.CTkLabel(frame, text=label, font=("Arial", 14)).pack(anchor="w")
            row = ctk.CTkFrame(frame)
            row.pack(fill="x", pady=5)
            ctk.CTkEntry(row, textvariable=self.file_vars[key], width=400).pack(side="left", padx=5)
            ctk.CTkButton(row, text="Select", command=lambda: self.select_file(key)).pack(side="left")

        create_file_input("Gas Data File", "gas")
        create_file_input("Level Control File", "level")
        create_file_input("Dilution Data File", "dilution")

        btn_frame = ctk.CTkFrame(frame)
        btn_frame.pack(pady=10)

        ctk.CTkButton(btn_frame, text="Start Watching", command=self.start_watching).pack(side="left", padx=10)
        ctk.CTkButton(btn_frame, text="Stop Watching", command=self.stop_watching, fg_color="red").pack(side="left", padx=10)

        self.status_label = ctk.CTkLabel(frame, text="Status: Idle", text_color="gray")
        self.status_label.pack(pady=10)

    def select_file(self, key):
        path = filedialog.askopenfilename(filetypes=[("Excel Files", "*.xlsx")])
        if path:
            self.file_vars[key].set(path)

    def update_status(self, msg):
        self.status_label.configure(text=f"Status: {msg}")

    def start_watching(self):
        reactor_id = self.reactor_id_var.get()
        if not reactor_id.isdigit():
            messagebox.showerror("Invalid ID", "Reactor ID must be a number")
            return

        watchers_config = [
            (self.file_vars["gas"].get(), prepare_gas_payload),
            (self.file_vars["level"].get(), prepare_level_payload),
            (self.file_vars["dilution"].get(), prepare_dilution_payload),
        ]

        for filepath, prepare_fn in watchers_config:
            if filepath:
                watcher = ExcelWatcher(filepath, int(reactor_id), prepare_fn, self.update_status)
                watcher.start()
                self.watchers.append(watcher)

        self.update_status("Watching started")

    def stop_watching(self):
        for w in self.watchers:
            w.stop()

        self.watchers = []
        self.update_status("Stopped watching")


if __name__ == "__main__":
    ctk.set_appearance_mode("System")
    app = MonitorApp()
    app.mainloop()
