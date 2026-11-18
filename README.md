# Bio-Monitor

**A Web-Based Bioreactor Monitoring and Data Visualization System**

Bio-Monitor is a web application designed to monitor bioreactor operations, collect experimental data, and visualize process parameters through a centralized dashboard.

The system integrates LabVIEW-based data acquisition with a centralized backend and PostgreSQL database, allowing researchers to remotely access, monitor, and analyze experimental data.

## Features

- Centralized storage of bioreactor experimental data.
- Automated data ingestion from LabVIEW-generated Excel files.
- Reactor-wise data management.
- Interactive dashboards and experimental data visualization.
- Monitoring of gas, dilution, and level-control parameters.
- User authentication and role-based access control.
- Historical data analysis and Excel export.
- Remote access to experimental data.

## Technology Stack

| Component          | Technology                |
| ------------------ | ------------------------- |
| Frontend           | React.js, Material UI     |
| Backend            | Node.js, Express.js       |
| Database           | PostgreSQL                |
| Data Acquisition   | LabVIEW                   |
| Data Upload        | Python                    |
| Communication      | REST APIs                 |
| Deployment         | AWS Lightsail / Linux VPS |
| Process Management | PM2                       |

## System Architecture

```text
Bioreactor Instruments
         |
         v
      LabVIEW
         |
         v
  Experimental Excel Files
         |
         v
 Python Data Watcher
         |
      HTTP API
         |
         v
  Node.js / Express
         |
         v
    PostgreSQL
         |
      REST APIs
         |
         v
    React Frontend
         |
         v
   User Dashboard
```

### Data Flow

1. **Data Acquisition:** LabVIEW collects experimental parameters from connected bioreactor instruments.
2. **Data Processing:** Experimental measurements are saved into structured files.
3. **Data Upload:** A Python-based watcher monitors these files and uploads the data to the backend through HTTP APIs.
4. **Backend Processing:** The Express server validates and processes incoming data.
5. **Data Storage:** Processed records are stored in PostgreSQL.
6. **Visualization:** The React frontend retrieves data through REST APIs and displays it using interactive charts and dashboards.

### Data Categories

- **Gas Data:** OUR, CPR, RQ, Kla, pH, DO, and other process measurements.
- **Dilution Data:** Flow rate, dilution rate, and mass-related measurements.
- **Level Control Data:** Reactor weight, PID output, and pump RPM.

---

## Getting Started

Follow these instructions to run Bio-Monitor locally.

### Prerequisites

Install the following:

- Node.js and npm
- PostgreSQL
- Git
- Python 3 (required for the data watcher)

Verify installations:

```bash
node --version
npm --version
psql --version
python3 --version
```

### 1. Clone the Repository

```bash
git clone <REPOSITORY_URL>
cd Bio-monitor
```

### 2. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE bio_monitor;
```

Configure the database credentials and ensure the backend has the required database privileges.

Initialize the database schema using the project's existing schema or migration scripts.

### 3. Environment Configuration

Create the required `.env` files in the backend and frontend directories.

Example backend configuration:

```env
DB_HOST=YOUR_DB_HOST
DB_PORT=YOUR_PORT
DB_NAME=YOUR_DB_NAME
DB_USER=YOUR_BD_USER
DB_PASSWORD=your_db_password

PORT=5000
NODE_ENV=development

JWT_SECRET=your_secure_secret
```

Example frontend configuration (if supported by the project):

```env
REACT_APP_API_URL=http://localhost:5000
```

**Note:** These are example variable names. Refer to the backend and frontend source code for the exact environment variables required.

Never commit `.env` files or credentials to Git.

### 4. Run the Backend

Open a terminal:

```bash
cd backend
npm install
npm run dev
```

Alternatively, use `npm run start` if that is the configured start script.

### 5. Run the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run start
```

The frontend development server will display the local URL, typically:

```text
http://localhost:3000
```

### 6. Run the Data Watcher (Optional)

The Python data watcher is responsible for uploading LabVIEW-generated experimental files to the backend.
The Backend URL to be set in watcher file.
Set up its Python environment:

```bash
python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt
```

Start the watcher using its configured entry-point script:
To be started on the systems where the data is being collected.

```bash
python3 <watcher_script>.py
```

Ensure that the backend is running and the watcher is configured with the correct API URL and data directory.

---

## Database Structure

The application primarily uses the following PostgreSQL tables:

| Table                | Description                                   |
| -------------------- | --------------------------------------------- |
| `users`              | User accounts, credentials, and roles         |
| `reactors`           | Reactor information and configuration         |
| `gas_data`           | Gas and process measurements                  |
| `dilution_data`      | Dilution-related measurements                 |
| `level_control_data` | Reactor weight and level-control measurements |

User roles:

- **Admin:** Administrative operations and user/reactor management.
- **Normal User:** Access to permitted application functionality and assigned reactors.
- **Viewer:** Read-only access.

Refer to the actual database schema for complete column definitions and relationships.

---

## Project Structure

```text
Bio-monitor/
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── config/
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   └── package.json
│
│
└── README.md
```

*Directory names are indicative; refer to the repository for the actual structure.*

---

## Troubleshooting

| Issue                              | Possible Solution                                           |
| ---------------------------------- | ----------------------------------------------------------- |
| Backend database connection error  | Verify PostgreSQL status and database credentials           |
| Frontend cannot connect to backend | Check API URL, backend status, and CORS configuration       |
| Data not appearing                 | Verify the Python watcher, upload API, and database records |
| Missing database tables            | Initialize the database schema or apply migrations          |
| npm dependency issues              | Run `npm install` and check Node.js compatibility           |

---
