# Oracle Database 23ai Free Monitoring Dashboard (Proof of Concept)

## 🎯 Cíl projektu

Cílem je vytvořit ukázkový **real-time monitoring dashboard** pro Oracle Database 23ai Free, který nevyžaduje Enterprise Manager ani placené licenční balíčky (AWR, ADDM apod.).  
Architektura je navržena **co nejjednodušeji** – **backend v Pythonu (Flask)**, **frontend v Reactu (Vite)**, **data pouze v paměti** (bez databáze).

---

## ⚙️ Technologie a požadavky

- **Backend:** Python 3.9+, Flask, Flask-CORS, python-oracledb (thin mode)  
- **Frontend:** React (Vite), JavaScript, Axios  
- **Oracle DB:** Oracle Database 23ai Free (běžící lokálně nebo vzdáleně)  
- **O/S:** Linux, macOS, Windows  
- **Výhoda:** **Žádný Oracle Instant Client není potřeba!** 🎉  
- **Doporučení:** Projekt je určen pro laboratorní a výukové účely – **pouze real-time data bez historie**  

---

## 🚀 Instalace a první spuštění

### 1. Příprava prostředí

#### Systémové požadavky
- **Python 3.9+** - ověřte: `python --version`
- **Node.js 18+** - ověřte: `node --version`
- **Oracle Database 23ai Free** - musí běžet a být dostupný po síti

---

### 2. Backend (Flask)

```bash
# Vytvoření struktury projektu
mkdir backend
cd backend

# Virtuální prostředí
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/macOS

# Instalace závislostí (ŽÁDNÝ Instant Client není potřeba!)
pip install flask flask-cors oracledb
```

#### Konfigurace připojení k Oracle

Vytvořte soubor `.env` v adresáři `backend`:

```
ORACLE_USER=system
ORACLE_PASSWORD=your_password
ORACLE_HOST=localhost
ORACLE_PORT=1521
ORACLE_SERVICE=FREEPDB1
```

**Minimální potřebná oprávnění pro DB uživatele:**
```sql
GRANT SELECT ON V_$SESSION TO your_user;
GRANT SELECT ON V_$SESSION_WAIT TO your_user;
GRANT SELECT ON V_$SQL TO your_user;
GRANT SELECT ON V_$SGA_DYNAMIC_COMPONENTS TO your_user;
```

---

### 💻 Backend kód – `backend/app.py`

```python
import os
from datetime import datetime
from flask import Flask, jsonify
from flask_cors import CORS
import oracledb

# Konfigurace
ORACLE_USER = os.getenv('ORACLE_USER', 'system')
ORACLE_PASSWORD = os.getenv('ORACLE_PASSWORD', 'oracle')
ORACLE_HOST = os.getenv('ORACLE_HOST', 'localhost')
ORACLE_PORT = os.getenv('ORACLE_PORT', '1521')
ORACLE_SERVICE = os.getenv('ORACLE_SERVICE', 'FREEPDB1')

app = Flask(__name__)
CORS(app)  # Povolí CORS pro frontend


def get_oracle_connection():
    """Vytvoří nové připojení k Oracle DB v thin mode (bez Instant Client)"""
    return oracledb.connect(
        user=ORACLE_USER,
        password=ORACLE_PASSWORD,
        host=ORACLE_HOST,
        port=int(ORACLE_PORT),
        service_name=ORACLE_SERVICE
    )


def fetch_metrics():
    """Načte aktuální metriky z Oracle DB"""
    try:
        conn = get_oracle_connection()
        cur = conn.cursor()

        # 1. Aktivní sessions
        cur.execute("SELECT COUNT(*) FROM V$SESSION WHERE STATUS='ACTIVE'")
        active_sessions = cur.fetchone()[0]

        # 2. Top wait events
        cur.execute("""
            SELECT EVENT, COUNT(*) as CNT 
            FROM V$SESSION_WAIT
            WHERE EVENT NOT LIKE '%idle%'
            GROUP BY EVENT
            ORDER BY CNT DESC 
            FETCH FIRST 5 ROWS ONLY
        """)
        wait_events = [{'event': row[0], 'count': row[1]} for row in cur]

        # 3. Top SQL podle CPU time
        cur.execute("""
            SELECT SQL_ID, EXECUTIONS, 
                   ROUND(CPU_TIME/1000000,2) as CPU_SEC,
                   SUBSTR(SQL_TEXT,1,80) as SQL_TEXT
            FROM V$SQL 
            WHERE EXECUTIONS > 0
            ORDER BY CPU_TIME DESC 
            FETCH FIRST 5 ROWS ONLY
        """)
        top_sql = [{'sql_id': r[0], 'executions': r[1], 'cpu_sec': r[2], 'text': r[3]} 
                   for r in cur]

        # 4. SGA komponenty
        cur.execute("""
            SELECT COMPONENT, ROUND(CURRENT_SIZE/1024/1024,2) as SIZE_MB
            FROM V$SGA_DYNAMIC_COMPONENTS
            WHERE CURRENT_SIZE > 0 
            ORDER BY CURRENT_SIZE DESC
        """)
        sga_stats = [{'component': r[0], 'size_mb': r[1]} for r in cur]

        cur.close()
        conn.close()
        
        return {
            'timestamp': datetime.now().isoformat(),
            'active_sessions': active_sessions,
            'wait_events': wait_events,
            'top_sql': top_sql,
            'sga_stats': sga_stats
        }
    except oracledb.Error as error:
        print(f"Oracle error: {error}")
        return None
    except Exception as e:
        print(f"Unexpected error: {e}")
        return None


@app.route('/api/health', methods=['GET'])
def get_health():
    """Vrátí aktuální stav databáze"""
    metrics = fetch_metrics()
    if metrics is None:
        return jsonify({'error': 'Failed to fetch metrics from Oracle'}), 500
    return jsonify(metrics)


@app.route('/api/ping', methods=['GET'])
def ping():
    """Zdravotní check API"""
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})


if __name__ == '__main__':
    print("🚀 Starting Oracle Monitoring Backend...")
    print(f"📊 Connecting to Oracle: {ORACLE_USER}@{ORACLE_HOST}:{ORACLE_PORT}/{ORACLE_SERVICE}")
    app.run(host='0.0.0.0', port=5000, debug=True)
```

---

### 3. Frontend (React + Vite)

```bash
# Vytvoření React projektu
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install axios
```

#### 📁 Struktura komponent

```
frontend/
├── src/
│   ├── App.jsx              # Hlavní komponenta
│   ├── components/
│   │   ├── Dashboard.jsx    # Dashboard wrapper
│   │   ├── SessionsCard.jsx # Aktivní sessions
│   │   ├── WaitEventsTable.jsx  # Top wait events
│   │   ├── TopSQLTable.jsx      # Top SQL dotazy
│   │   └── SGAStatsTable.jsx    # SGA statistiky
│   └── App.css
└── vite.config.js
```

#### Konfigurace proxy v `vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
```

#### Ukázkový fetch v komponentě

```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/health');
        setMetrics(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
    // Refresh každých 30 sekund
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Načítání...</div>;
  if (error) return <div>Chyba: {error}</div>;

  return (
    <div className="dashboard">
      <h1>Oracle DB Monitor</h1>
      {/* Komponenty pro zobrazení metrik */}
    </div>
  );
}
```

---

## 🧩 Spuštění aplikace

### Backend
```bash
cd backend
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/macOS
python app.py
```
Backend běží na `http://localhost:5000`

### Frontend
```bash
cd frontend
npm run dev
```
Frontend běží na `http://localhost:5173`

### Otevřete prohlížeč
Přejděte na `http://localhost:5173` a uvidíte dashboard s real-time daty z Oracle DB.

---

## 🎨 Design a UX doporučení

- **Automatický refresh:** Dashboard se obnovuje každých 30 sekund
- **Loading stavy:** Zobrazit spinner při načítání dat
- **Error handling:** Jasné chybové hlášky při výpadku spojení
- **Responsive design:** Funkční i na menších obrazovkách
- **Barevné kódování:** Zelená (OK), Žlutá (Warning), Červená (Critical)

---

## 🔧 Možná rozšíření

- ✅ Přidat další metriky (locks, tablespaces, redo logs)
- ✅ Graf v čase (in-memory buffer posledních N měření)
- ✅ Alert thresholdy (např. >20 aktivních sessions)
- ✅ Dark mode
- ✅ Export aktuálního stavu do JSON/CSV
- ⚠️ Autentizace uživatelů (pro produkci)
- ⚠️ Persistence dat do SQLite/PostgreSQL (pokud chcete historii)  

---

## � Troubleshooting

### Backend nenaváže spojení s Oracle
- ✅ Zkontrolujte, že Oracle DB běží: `lsnrctl status`
- ✅ Ověřte credentials v `.env` souboru
- ✅ Zkontrolujte, že port 1521 je dostupný
- ✅ Ověřte service name: `FREEPDB1` (nebo jiný)
- ✅ Zkontrolujte firewall a síťové nastavení

### Frontend nedostává data
- ✅ Zkontrolujte, že backend běží na portu 5000
- ✅ Ověřte proxy konfiguraci ve `vite.config.js`
- ✅ Otevřete browser console (F12) a zkontrolujte network tab

### CORS chyby
- ✅ Ujistěte se, že máte nainstalovaný `flask-cors`
- ✅ Zkontrolujte, že `CORS(app)` je v `app.py`

---

##  Zdroje

- [Oracle V$ Views dokumentace](https://docs.oracle.com/en/database/oracle/oracle-database/23/arpls/dyn-performance-views.html)  
- [Flask documentation](https://flask.palletsprojects.com/)  
- [Flask-CORS](https://flask-cors.readthedocs.io/)
- [python-oracledb (thin mode)](https://python-oracledb.readthedocs.io/)  
- [React (Vite)](https://vitejs.dev/)  
- [Axios](https://axios-http.com/)

---

## 📝 Poznámky k implementaci

- **Maximálně jednoduchý PoC:** Žádná databáze, žádné threading, žádný Instant Client
- **python-oracledb thin mode:** Pure Python, funguje všude, žádné binární závislosti
- **Real-time pouze:** Data se načítají při každém API volání
- **Stateless:** Restart = ztráta všech dat (to je OK pro PoC)
- **Škálovatelnost:** Pro produkci přidat caching, connection pooling, rate limiting

---

## 🎯 Shrnutí: Co NEPOTŘEBUJETE

✅ **NEPOTŘEBUJETE:**
- ❌ Oracle Instant Client
- ❌ SQLite databázi
- ❌ Komplikované instalace
- ❌ LD_LIBRARY_PATH nebo PATH konfigurace
- ❌ Threading nebo background procesy
- ❌ Grafové knihovny (Recharts)

✅ **POTŘEBUJETE jen:**
- ✅ Python 3.9+
- ✅ Node.js 18+
- ✅ 3 pip balíčky: `flask`, `flask-cors`, `oracledb`
- ✅ 1 npm balíček: `axios`
- ✅ Běžící Oracle Database 23ai Free

---

Tento projekt představuje **nejjednodušší možný Proof of Concept** pro real-time monitoring Oracle Database 23ai Free - **bez komerčních komponent, bez složitých závislostí, bez Instant Client!** 🚀
