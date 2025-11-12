# 🚀 Návod k spuštění Oracle DB Monitoring Dashboard

Projekt je **kompletně nastaven a připraven k použití**! Stačí se připojit na VPN a spustit aplikaci.

---

## 📋 Co je již hotovo

✅ **Backend (Flask API)**
- Virtuální prostředí vytvořeno
- Všechny Python závislosti nainstalovány
- `app.py` připraveno s API endpointy
- `.env` konfigurační soubor vytvořen

✅ **Frontend (React + Vite)**
- React projekt vytvořen
- Všechny npm závislosti nainstalovány
- Komponenty implementovány
- Styling dokončen

---

## ⚙️ Konfigurace databáze

Před spuštěním **upravte heslo** v souboru `backend\.env`:

```env
ORACLE_USER=system
ORACLE_PASSWORD=VAŠE_HESLO_SEM  👈 Změňte toto!
ORACLE_HOST=10.0.21.14
ORACLE_PORT=1521
ORACLE_SERVICE=FREEPDB1
```

---

## 🎯 Spuštění aplikace

### 1️⃣ Spusťte Backend (Flask API)

Otevřete **první terminál** a spusťte:

```powershell
cd b:\code\dbsmonitoring\backend
.\venv\Scripts\activate
python app.py
```

✅ Backend poběží na: **http://localhost:5000**

Měli byste vidět:
```
🚀 Starting Oracle Monitoring Backend...
📊 Database: system@10.0.21.14:1521/FREEPDB1
🌐 API will be available at: http://localhost:5000
```

---

### 2️⃣ Spusťte Frontend (React)

Otevřete **druhý terminál** a spusťte:

```powershell
cd b:\code\dbsmonitoring\frontend
npm run dev
```

✅ Frontend poběží na: **http://localhost:5173**

---

### 3️⃣ Otevřete Dashboard

Otevřete prohlížeč a přejděte na:
```
http://localhost:5173
```

🎉 **Dashboard by měl zobrazovat real-time data z databáze!**

---

## 🔍 Testování API (volitelné)

Můžete otestovat API přímo v prohlížeči nebo přes PowerShell:

### Test 1: Health Check
```powershell
# V prohlížeči
http://localhost:5000/api/ping

# Nebo v PowerShell
Invoke-WebRequest -Uri http://localhost:5000/api/ping | Select-Object -Expand Content
```

### Test 2: Database Metrics
```powershell
# V prohlížeči
http://localhost:5000/api/health

# Nebo v PowerShell
Invoke-WebRequest -Uri http://localhost:5000/api/health | Select-Object -Expand Content
```

---

## 🛑 Zastavení aplikace

### Backend
- Stiskněte `Ctrl+C` v terminálu s Flaskem

### Frontend
- Stiskněte `Ctrl+C` v terminálu s Vite

---

## 🔧 Řešení problémů

### ❌ Backend hlásí "Failed to connect to Oracle"

**Příčiny:**
1. Nejste na VPN
2. Špatné heslo v `.env`
3. Databáze není dostupná na adrese 10.0.21.14

**Řešení:**
- Připojte se na VPN
- Zkontrolujte heslo v `backend\.env`
- Ověřte, že databáze běží: `ping 10.0.21.14`

---

### ❌ Frontend nezobrazuje data

**Příčiny:**
1. Backend neběží
2. Backend vrací chybu

**Řešení:**
- Zkontrolujte, že backend běží na portu 5000
- Otevřte browser konzoli (F12) → záložka "Network"
- Podívejte se na chyby v terminálu s backendem

---

### ❌ Port 5000 nebo 5173 je již obsazen

**Řešení:**

**Pro Backend (port 5000):**
```powershell
# Najděte proces
netstat -ano | findstr :5000

# Ukončete proces (ID z výstupu výše)
taskkill /PID <process_id> /F
```

**Pro Frontend (port 5173):**
- Vite automaticky nabídne jiný port (např. 5174)

---

## 📊 Co dashboard zobrazuje

### 1. **Aktivní Sessions**
- Počet aktivních sessions v databázi
- Barevné kódování:
  - 🟢 **Zelená** (< 10) = Normální
  - 🟡 **Žlutá** (10-20) = Zvýšená aktivita
  - 🔴 **Červená** (> 20) = Vysoké zatížení

### 2. **Top Wait Events**
- 5 nejčastějších wait events
- Pomáhá identifikovat úzká hrdla

### 3. **Top SQL Queries**
- 5 SQL dotazů s nejvyšším CPU časem
- Zobrazuje SQL_ID, počet exekucí, CPU čas, text dotazu

### 4. **SGA Komponenty**
- Velikost jednotlivých komponent SGA v MB
- Přehled o alokaci paměti

---

## ⏱️ Automatické obnovování

Dashboard se **automaticky obnovuje každých 30 sekund**.

Můžete také kliknout na tlačítko **"🔄 Obnovit"** pro okamžitou aktualizaci.

---

## 🔐 Databázová oprávnění

Váš DB uživatel potřebuje tato oprávnění:

```sql
GRANT SELECT ON V$SESSION TO system;
GRANT SELECT ON V$SESSION_WAIT TO system;
GRANT SELECT ON V$SQL TO system;
GRANT SELECT ON V$SGA_DYNAMIC_COMPONENTS TO system;
```

*(Uživatel `system` by měl mít tato oprávnění standardně)*

---

## 📁 Struktura projektu

```
dbsmonitoring/
├── backend/
│   ├── venv/              # Python virtuální prostředí
│   ├── app.py             # Flask API
│   ├── requirements.txt   # Python závislosti
│   ├── .env              # Konfigurace DB připojení
│   └── .env.example      # Příklad konfigurace
│
├── frontend/
│   ├── src/
│   │   ├── components/   # React komponenty
│   │   ├── App.jsx       # Hlavní aplikace
│   │   ├── App.css       # Styling
│   │   └── main.jsx      # Entry point
│   ├── package.json      # npm závislosti
│   └── vite.config.js    # Vite konfigurace
│
├── .gitignore
└── README.md             # Dokumentace projektu
```

---

## 💡 Tipy

1. **Držte oba terminály otevřené** - jeden pro backend, druhý pro frontend
2. **Sledujte konzoli backendu** - všechny SQL chyby se tam zobrazí
3. **Použijte F12 v prohlížeči** - pro debugging frontendu
4. **Refresh každých 30s** - nepřetěžujte databázi častějšími dotazy

---

## 🎉 Hotovo!

Nyní máte funkční **real-time Oracle Database monitoring dashboard** bez Enterprise Manager a bez placených licencí! 🚀

Pro otázky a problémy se podívejte do hlavního `README.md` nebo do kódu backendu (`backend/app.py`).
