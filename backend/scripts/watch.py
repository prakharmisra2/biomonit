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
# API QUEUE SYSTEM
# ------------------------------------

API_URL = "https://bio-monitor.onrender.com/api/v1/dataup/push"
HEALTH_URL = "https://bio-monitor.onrender.com/health"
QUEUE_FILE = "queue.json"

# Reset queue.json on start
with open(QUEUE_FILE, "w") as f:
    json.dump([], f)
    print(f"Queue file reset: {QUEUE_FILE}")


def load_queue():
    """Load queued payloads from file"""
    if os.path.exists(QUEUE_FILE):
        with open(QUEUE_FILE, "r") as f:
            return json.load(f)
    return []
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


def save_queue(queue):
    """Save queued payloads to file"""
    with open(QUEUE_FILE, "w") as f:
        json.dump(queue, f)


def test_connection():
    """Test if we can reach the API server"""
    try:
        print(f"\n{'='*60}")
        print(f"Testing connection to: {HEALTH_URL}")
        print(f"{'='*60}")
        
        response = requests.get(HEALTH_URL, timeout=5)
        
        if response.status_code == 200:
            print("✓ Connection successful!")
            data = response.json()
            print(f"✓ Server: {data.get('message', 'Running')}")
            print(f"✓ Version: {data.get('version', 'N/A')}")
            print(f"{'='*60}\n")
            return True
        else:
            print(f"✗ Unexpected status: {response.status_code}")
            print(f"{'='*60}\n")
            return False
            
    except requests.exceptions.ConnectionError as e:
        print(f"✗ Connection failed: Cannot reach server")
        print(f"  Error: {e}")
        print(f"  Check internet connection and firewall settings")
        print(f"{'='*60}\n")
        return False
    except requests.exceptions.Timeout:
        print(f"✗ Connection timeout: Server took too long to respond")
        print(f"{'='*60}\n")
        return False
    except Exception as e:
        print(f"✗ Connection test failed: {e}")
        print(f"{'='*60}\n")
        return False


def send_payload(payload, retries=5):
    """Send payload to API with retry logic"""
    headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'ReactorDataWatcher/1.0'
    }
    
    for attempt in range(1, retries + 1):
        try:
            print(f"\n[Attempt {attempt}/{retries}] Sending data to API...")
            
            # Show payload type
            if 'gas' in payload:
                data_type = "Gas Data"
            elif 'level_control' in payload:
                data_type = "Level Control Data"
            elif 'dilution' in payload:
                data_type = "Dilution Data"
            else:
                data_type = "Unknown Data"
            
            print(f"  Type: {data_type}")
            
            response = requests.post(
                API_URL, 
                json=payload, 
                headers=headers, 
                timeout=10
            )

            print(f"  Response Status: {response.status_code}")

            if response.status_code == 200:
                result = response.json()
                print(f"  ✓ Success: {result.get('message', 'Data sent successfully')}")
                return True
            else:
                print(f"  ✗ Server Error: {response.text}")

        except requests.exceptions.Timeout:
            print(f"  ✗ Timeout: Server took too long to respond")
        except requests.exceptions.ConnectionError as e:
            print(f"  ✗ Connection Error: {e}")
        except requests.exceptions.RequestException as e:
            print(f"  ✗ Request Error: {e}")
        except Exception as e:
            print(f"  ✗ Unexpected Error: {e}")

        if attempt < retries:
            wait = min(2 ** attempt, 30)
            print(f"  → Retrying in {wait} seconds...")
            time.sleep(wait)

    print(f"  ✗ Failed to send data after {retries} attempts")
    return False


# ------------------------------------
# DATA HELPERS
# ------------------------------------

def safe_timestamp(row):
    """Convert Date and Time columns to ISO timestamp"""
    try:
        ts = pd.to_datetime(str(row["Date"]) + " " + str(row["Time"]), errors="coerce")
        return None if pd.isna(ts) else ts.isoformat()
    except Exception as e:
        print(f"Error creating timestamp: {e}")
        return None


def prepare_gas_payload(row, reactor_id):
    """Prepare gas data payload"""
    return {
        "gas": {
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
    """Prepare level control data payload"""
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
    """Prepare dilution data payload"""
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
# WATCHER THREAD
# ------------------------------------

class ExcelWatcher(threading.Thread):
    def __init__(self, filepath, reactor_id, prepare_fn, update_status, data_type):
        super().__init__(daemon=True)
        self.filepath = filepath
        self.reactor_id = reactor_id
        self.prepare_fn = prepare_fn
        self.update_status = update_status
        self.data_type = data_type
        self.running = True
        self.last_rows = 0

    def run(self):
        print(f"\n[{self.data_type}] Watcher started for reactor {self.reactor_id}")
        print(f"  File: {self.filepath}")
        
        queue = load_queue()

        while self.running:
            try:
                # Read Excel file
                df = pd.read_excel(self.filepath)

                # Check for new rows
                if len(df) > self.last_rows:
                    new_rows_count = len(df) - self.last_rows
                    new_df = df.tail(new_rows_count)

                    print(f"\n[{self.data_type}] Found {new_rows_count} new row(s)")

                    # Process each new row
                    for idx, row in new_df.iterrows():
                        timestamp = safe_timestamp(row)
                        if timestamp is None:
                            print(f"  ⚠ Skipping row {idx}: Invalid date/time")
                            continue

                        payload = self.prepare_fn(row, self.reactor_id)
                        queue.append(payload)
                        print(f"  ✓ Queued row {idx} (timestamp: {timestamp})")

                    save_queue(queue)
                    self.last_rows = len(df)
                    self.update_status(f"[{self.data_type}] Queued {new_rows_count} new rows")

                # Try sending queue
                if queue:
                    print(f"\n[{self.data_type}] Processing queue ({len(queue)} items)")
                    new_queue = []
                    
                    for item in queue:
                        if send_payload(item):
                            print(f"  ✓ Delivered and removed from queue")
                        else:
                            new_queue.append(item)
                            print(f"  ✗ Failed, keeping in queue")

                    queue = new_queue
                    save_queue(queue)
                    
                    if not queue:
                        print(f"  ✓ Queue cleared!")
                    else:
                        print(f"  ⚠ {len(queue)} items remaining in queue")
                        self.update_status(f"[{self.data_type}] {len(queue)} items pending")

            except FileNotFoundError:
                error_msg = f"File not found: {self.filepath}"
                print(f"\n[{self.data_type}] Error: {error_msg}")
                self.update_status(f"Error: {error_msg}")
            except PermissionError:
                error_msg = f"Permission denied: {self.filepath}"
                print(f"\n[{self.data_type}] Error: {error_msg}")
                self.update_status(f"Error: {error_msg}")
            except Exception as e:
                error_msg = f"{type(e).__name__}: {e}"
                print(f"\n[{self.data_type}] Error: {error_msg}")
                self.update_status(f"Error: {error_msg}")

            # Wait before next check
            time.sleep(3)

    def stop(self):
        print(f"\n[{self.data_type}] Stopping watcher...")
        self.running = False


# ------------------------------------
# GUI
# ------------------------------------

class MonitorApp(ctk.CTk):

    def __init__(self):
        super().__init__()
        self.title("Reactor Excel Data Watcher")
        self.geometry("800x700")

        self.watchers = []
        self.create_ui()

    def create_ui(self):
        # Main frame
        frame = ctk.CTkScrollableFrame(self, corner_radius=10)
        frame.pack(padx=20, pady=20, fill="both", expand=True)

        # Title
        title = ctk.CTkLabel(
            frame, 
            text="🧪 Reactor Data Watcher", 
            font=("Arial", 24, "bold")
        )
        title.pack(pady=(0, 20))

        # Connection status
        self.connection_status = ctk.CTkLabel(
            frame, 
            text="⚠ Connection not tested", 
            text_color="orange",
            font=("Arial", 12)
        )
        self.connection_status.pack(pady=5)

        # Test connection button
        ctk.CTkButton(
            frame, 
            text="Test API Connection",
            command=self.test_api_connection,
            fg_color="blue"
        ).pack(pady=10)

        # Separator
        ctk.CTkLabel(frame, text="─" * 60).pack(pady=10)

        # Reactor ID
        ctk.CTkLabel(frame, text="Reactor ID:", font=("Arial", 16, "bold")).pack(anchor="w", pady=(10, 0))
        self.reactor_id_var = ctk.StringVar(value="1")
        ctk.CTkEntry(
            frame, 
            textvariable=self.reactor_id_var,
            font=("Arial", 14)
        ).pack(fill="x", pady=5)

        # File inputs
        self.file_vars = {
            "gas": ctk.StringVar(),
            "level": ctk.StringVar(),
            "dilution": ctk.StringVar()
        }

        def create_file_input(label, key, emoji):
            ctk.CTkLabel(
                frame, 
                text=f"{emoji} {label}", 
                font=("Arial", 14, "bold")
            ).pack(anchor="w", pady=(15, 5))
            
            row = ctk.CTkFrame(frame, fg_color="transparent")
            row.pack(fill="x", pady=5)
            
            ctk.CTkEntry(
                row, 
                textvariable=self.file_vars[key], 
                width=500,
                placeholder_text="No file selected"
            ).pack(side="left", padx=5, expand=True, fill="x")
            
            ctk.CTkButton(
                row, 
                text="Browse", 
                command=lambda: self.select_file(key),
                width=100
            ).pack(side="left")

        create_file_input("Gas Data File", "gas", "💨")
        create_file_input("Level Control File", "level", "📊")
        create_file_input("Dilution Data File", "dilution", "💧")

        # Separator
        ctk.CTkLabel(frame, text="─" * 60).pack(pady=15)

        # Control buttons
        btn_frame = ctk.CTkFrame(frame, fg_color="transparent")
        btn_frame.pack(pady=10)

        self.start_btn = ctk.CTkButton(
            btn_frame, 
            text="▶ Start Watching", 
            command=self.start_watching,
            fg_color="green",
            hover_color="darkgreen",
            width=150,
            height=40,
            font=("Arial", 14, "bold")
        )
        self.start_btn.pack(side="left", padx=10)

        self.stop_btn = ctk.CTkButton(
            btn_frame, 
            text="⏹ Stop Watching", 
            command=self.stop_watching,
            fg_color="red",
            hover_color="darkred",
            width=150,
            height=40,
            font=("Arial", 14, "bold"),
            state="disabled"
        )
        self.stop_btn.pack(side="left", padx=10)

        # Status label
        self.status_label = ctk.CTkLabel(
            frame, 
            text="Status: Idle", 
            text_color="gray",
            font=("Arial", 12)
        )
        self.status_label.pack(pady=10)

        # Log area
        ctk.CTkLabel(
            frame, 
            text="📋 Activity Log", 
            font=("Arial", 14, "bold")
        ).pack(anchor="w", pady=(20, 5))
        
        self.log_text = ctk.CTkTextbox(frame, height=150, font=("Courier", 10))
        self.log_text.pack(fill="both", expand=True, pady=5)
        self.log_text.insert("1.0", "Waiting to start...\n")
        self.log_text.configure(state="disabled")

    def log_message(self, message):
        """Add message to log area"""
        self.log_text.configure(state="normal")
        self.log_text.insert("end", f"{datetime.now().strftime('%H:%M:%S')} - {message}\n")
        self.log_text.see("end")
        self.log_text.configure(state="disabled")

    def test_api_connection(self):
        """Test connection to API"""
        self.log_message("Testing API connection...")
        self.connection_status.configure(text="⏳ Testing connection...", text_color="orange")
        self.update()
        
        if test_connection():
            self.connection_status.configure(text="✓ API Connected", text_color="green")
            self.log_message("✓ API connection successful")
        else:
            self.connection_status.configure(text="✗ API Connection Failed", text_color="red")
            self.log_message("✗ API connection failed")
            messagebox.showerror(
                "Connection Error",
                "Cannot connect to API server.\n\nPlease check:\n"
                "- Internet connection\n"
                "- Firewall settings\n"
                "- Server status"
            )

    def select_file(self, key):
        """Open file dialog to select Excel file"""
        path = filedialog.askopenfilename(
            filetypes=[("Excel Files", "*.xlsx"), ("All Files", "*.*")]
        )
        if path:
            self.file_vars[key].set(path)
            self.log_message(f"Selected {key} file: {os.path.basename(path)}")

    def update_status(self, msg):
        """Update status label"""
        self.status_label.configure(text=f"Status: {msg}")
        self.log_message(msg)

    def start_watching(self):
        """Start watching Excel files"""
        reactor_id = self.reactor_id_var.get()
        
        if not reactor_id.isdigit():
            messagebox.showerror("Invalid ID", "Reactor ID must be a number")
            return

        # Test connection first
        self.log_message("Verifying API connection...")
        if not test_connection():
            messagebox.showerror(
                "Connection Error",
                "Cannot connect to API server.\n\n"
                "Please test the connection first and ensure the server is reachable."
            )
            return

        watchers_config = [
            (self.file_vars["gas"].get(), prepare_gas_payload, "Gas"),
            (self.file_vars["level"].get(), prepare_level_payload, "Level"),
            (self.file_vars["dilution"].get(), prepare_dilution_payload, "Dilution"),
        ]

        started_count = 0
        for filepath, prepare_fn, data_type in watchers_config:
            if filepath:
                watcher = ExcelWatcher(
                    filepath, 
                    int(reactor_id), 
                    prepare_fn, 
                    self.update_status,
                    data_type
                )
                watcher.start()
                self.watchers.append(watcher)
                started_count += 1
                self.log_message(f"✓ Started {data_type} watcher")

        if started_count == 0:
            messagebox.showwarning(
                "No Files Selected",
                "Please select at least one Excel file to watch"
            )
            return

        self.update_status(f"Watching {started_count} file(s)")
        self.start_btn.configure(state="disabled")
        self.stop_btn.configure(state="normal")
        self.log_message(f"Watching started for reactor {reactor_id}")

    def stop_watching(self):
        """Stop all watchers"""
        for w in self.watchers:
            w.stop()

        self.watchers = []
        self.update_status("Stopped watching")
        self.start_btn.configure(state="normal")
        self.stop_btn.configure(state="disabled")
        self.log_message("All watchers stopped")


if __name__ == "__main__":
    print("\n" + "="*60)
    print("  REACTOR EXCEL DATA WATCHER")
    print("  Version 1.0")
    print("="*60 + "\n")
    
    ctk.set_appearance_mode("System")
    ctk.set_default_color_theme("blue")
    
    app = MonitorApp()
    app.mainloop()