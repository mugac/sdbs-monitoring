# Oracle Database 23ai FREE Edition - Monitoring bez Enterprise Manager
## Praktický průvodce diagnostikou v omezené verzi

---

## 1. OMEZENÍ V ORACLE DATABASE 23ai FREE EDITION

### Co NENÍ dostupné (bez licence)

```
❌ Enterprise Manager Cloud Control     (Placené - velmi drahé)
❌ EM Express (Database Express)        (Deprecated od 23ai - již není podporován!)
❌ Diagnostic Pack                       (Placený add-on)
❌ Tuning Pack                           (Placený add-on)
❌ SQL Tuning Advisor                    (Vyžaduje Tuning Pack)
❌ AWR (Automatic Workload Repository)   (Vyžaduje Diagnostic Pack)
❌ ADDM (Automatic Database Diag Monitor)(Vyžaduje Diagnostic Pack)
❌ ASH Reports                           (Vyžaduje Diagnostic Pack)
❌ Performance Hub                       (Cloud feature, vyžaduje Diagnostic Pack)
```

### Klíčová Informace pro 23ai
```
⚠️  EM Express (GUI monitoring tool z 12c-22c) je DEPRECATED
    Od Oracle Database 26ai+ je FULLY REMOVED
    V 23ai: Still present but not supported
    
⚠️  Diagnostic Pack musí být DISABLED:
    control_management_pack_access = NONE (nebo TUNING only)
```

---

## 2. CO JE DOSTUPNÉ ZDARMA V 23ai FREE

### Free Tier Diagnostika

```
✓ V$ Views (Dynamic Performance Views)     - DOSTUPNÉ
  - V$SESSION, V$SESSION_WAIT
  - V$SYSTEM_EVENT, V$SQL, V$SQL_MONITOR
  - V$ACTIVE_SESSION_HISTORY (ASH in-memory buffer)
  - LIMIACE: Data только in SGA, ~5-10 minut retention

✓ Dictionary Views (DBA_ views)             - DOSTUPNÉ
  - DBA_TABLES, DBA_INDEXES
  - DBA_TABLESPACE_USAGE_METRICS
  - DBA_DATA_FILES, DBA_DATAFILES
  - Veškeré schema metadata

✓ Alert Log                                 - DOSTUPNÉ
  - Text soubor s error messages
  - V$DIAG_ALERT_EXT (Oracle 11g+)
  - Ručním readem nebo skriptu

✓ Trace Files                               - DOSTUPNÉ
  - Automatic Database Diagnostic Repository (ADR)
  - Komendy: adrci (ADR Command Interpreter)
  - Health check reports

✓ SQL*Plus + SQLPlus Scripts                - DOSTUPNÉ (zdarma)
  - @?/rdbms/admin/ashrpt.sql             (ASH Report)
  - Vlastní SQL scriptu

✓ ADRCI (ADR Command Interpreter)           - DOSTUPNÉ
  - Health check reports
  - Diagnostic data investigation
  - Problem packaging for Oracle Support

✓ DBMS Packages (free ones):                - DOSTUPNÉ
  - DBMS_SYSTEM                           (debug, event setting)
  - DBMS_SQLDIAG                          (SQL diagnostic)
  - DBMS_XPLAN                            (explain plans)
  - DBMS_SQL_MONITOR (Real-Time SQL Mon)  (bez license check!)
  
✓ Data Dictionary Health Check              - DOSTUPNÉ
  - DBMS_DICTIONARY_CHECK (19.22+)
  - Or: hcheck.sql script

✓ ORACHK / EXACHK                           - DOSTUPNÉ (zdarma!)
  - Health check framework
  - Lightweight, non-intrusive
  - Download z MOS (MyOracleSupport)
  - No installation required

✓ SQL*Developer (free IDE)                  - DOSTUPNÉ
  - GUI pro queries
  - Basic performance monitoring
  - No licensing required
```

---

## 3. DIAGNOSTIC TOOLS DOSTUPNÉ ZDARMA

### 3.1 Nástroje Zabudované v Databázi

#### V$SESSION - Current Sessions

```sql
-- Všechny aktivní sessions
SELECT sid, username, osuser, process, status, event, seconds_in_wait
FROM V$SESSION
WHERE status='ACTIVE'
ORDER BY seconds_in_wait DESC;

-- Session detaily
SELECT sid, serial#, username, command, rows_processed, ioreadcnt, iowritecnt
FROM V$SESSION
WHERE username IS NOT NULL;
```

#### V$SESSION_WAIT - Wait Events (aktuální)

```sql
-- Co sessions právě čekají
SELECT sid, username, event, p1, p2, p3, wait_time, seconds_in_wait
FROM V$SESSION_WAIT
WHERE event NOT LIKE 'SQL*'
ORDER BY seconds_in_wait DESC;

-- Summary wait events
SELECT event, COUNT(*) cnt, AVG(wait_time) avg_wait
FROM V$SESSION_WAIT
GROUP BY event
ORDER BY cnt DESC;
```

#### V$SYSTEM_EVENT - System-wide Wait Events

```sql
-- Top wait events za běh instance
SELECT event, total_waits, total_timeouts, time_waited, average_wait
FROM V$SYSTEM_EVENT
WHERE event NOT LIKE '%SQL%' AND event NOT LIKE '%Idle%'
ORDER BY time_waited DESC
FETCH FIRST 10 ROWS ONLY;
```

#### V$SQL - Currently Cached SQL

```sql
-- Top SQL by CPU
SELECT sql_id, executions, cpu_time/1000000 cpu_sec, 
  SUBSTR(sql_text,1,50) text
FROM V$SQL
WHERE executions > 0
ORDER BY cpu_time DESC
FETCH FIRST 10 ROWS ONLY;

-- Top SQL by I/O
SELECT sql_id, physical_reads, logical_reads,
  SUBSTR(sql_text,1,50) text
FROM V$SQL
WHERE physical_reads > 100
ORDER BY physical_reads DESC
FETCH FIRST 5 ROWS ONLY;
```

#### V$ACTIVE_SESSION_HISTORY - In-Memory Sampling

```sql
-- Last N seconds of activity (max ~10 minut)
SELECT sample_time, sid, event, sql_id, cnt
FROM (
  SELECT sample_time, sid, event, sql_id, COUNT(*) cnt
  FROM V$ACTIVE_SESSION_HISTORY
  WHERE sample_time > SYSDATE - 10/1440  -- Last 10 minutes
  GROUP BY sample_time, sid, event, sql_id
  ORDER BY sample_time DESC
)
FETCH FIRST 20 ROWS ONLY;

-- Top wait events from ASH
SELECT event, COUNT(*) cnt
FROM V$ACTIVE_SESSION_HISTORY
WHERE sample_time > SYSDATE - 1/24  -- Last 1 hour
GROUP BY event
ORDER BY cnt DESC;
```

#### V$SQL_MONITOR - Real-Time SQL Monitoring

```sql
-- Dlouhodobě běžící SQL statements
SELECT sql_id, sql_exec_start, elapsed_time/1000000 elapsed_sec,
  cpu_time/1000000 cpu_sec, buffer_gets, disk_reads
FROM V$SQL_MONITOR
WHERE status = 'EXECUTING'
ORDER BY elapsed_time DESC;

-- Monitoring report (bez Diagnostic Pack!)
SET LONG 9999
SELECT DBMS_SQL_MONITOR.REPORT_SQL_MONITOR(
  sql_id => 'SQL_ID_HERE',
  type => 'TEXT'
) 
FROM DUAL;
```

#### V$DIAG_ALERT_EXT - Alert Events

```sql
-- Recent alert messages
SELECT alert_id, timestamp, severity, message
FROM V$DIAG_ALERT_EXT
ORDER BY timestamp DESC
FETCH FIRST 20 ROWS ONLY;

-- Alert summary
SELECT severity, COUNT(*) cnt
FROM V$DIAG_ALERT_EXT
GROUP BY severity;
```

### 3.2 ADRCI - ADR Command Interpreter

```bash
# Spuštění ADRCI
adrci

# Důležité příkazy v ADRCI
show alert                          # Zobrazit alert log
show incident                       # Zobrazit incidenty
show problem                        # Zobrazit problémy
show trace                          # Zobrazit trace files
hcheck run                          # Run health check
pack offline -id <incident_id>     # Package diagnostics
quit                                # Exit
```

### 3.3 Alert Log - Přímý Přístup

```bash
# Najít alert log location
adrci> show base
# Obvykle: $ORACLE_BASE/diag/rdbms/[db_name]/[instance_name]/trace/

# V Linuxu/Unixu
tail -100 /path/to/alert_INSTANCE.log

# Hledání errory
grep -i "ORA-" alert_INSTANCE.log
grep -i "error" alert_INSTANCE.log
```

### 3.4 SQL*Plus Scripts (DOSTUPNÉ)

```bash
# 1. ASH Report - BEZPLATNĚ
sqlplus / as sysdba
@?/rdbms/admin/ashrpt.sql

# Prompts:
# - Report type: html or txt [html]
# - Begin time (minutes before now) [60]
# - Duration (minutes) [60]
# - Report name [ashrpt]

# 2. Explain Plan - BEZPLATNĚ
sqlplus / as sysdba

-- Vysvětlení SQL plánu
EXPLAIN PLAN FOR
  SELECT * FROM employees WHERE salary > 50000;

-- Zobrazení plánu
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY());

# 3. Session Kill Script
-- Zjistit session
SELECT sid, serial#, username, osuser, status
FROM V$SESSION
WHERE username = 'USERNAME';

-- Kill session
ALTER SYSTEM KILL SESSION 'SID,SERIAL#';
```

### 3.5 Health Check Scripts

#### ORACHK/EXACHK (ZDARMA!)

```bash
# Stáhnut z Oracle Support (MOS)
# Runs comprehensive health checks
# No installation required
# Output: HTML reports

./orachk.sh -h          # Help
./orachk.sh -as         # Automatic collection (guided)
./orachk.sh -f profile  # Run from profile file

# Outputs HTML report s doporučeními
```

#### Data Dictionary Health Check

```sql
-- Oracle 19.22+
SET PAGESIZE 30
EXEC DBMS_DICTIONARY_CHECK.VALIDATE;

-- Výstup: checks and guidance
```

---

## 4. FREE MONITORING WORKFLOW V 23ai

### Scenario: "Databáze je pomalá"

#### Step 1: Rychlá diagnóza (1 minuta)

```sql
-- Terminal 1: Connect
sqlplus / as sysdba

-- Check current activity
SELECT COUNT(*) active_sessions FROM V$SESSION WHERE status='ACTIVE';

-- Top wait events RIGHT NOW
SELECT event, COUNT(*) cnt FROM V$SESSION_WAIT
WHERE event NOT LIKE '%Idle%'
GROUP BY event ORDER BY cnt DESC;

-- Top CPU consuming SQL
SELECT sql_id, cpu_time/1000000 cpu_sec, executions,
  SUBSTR(sql_text,1,40) text
FROM V$SQL WHERE cpu_time > 0
ORDER BY cpu_time DESC FETCH FIRST 3 ROWS ONLY;
```

#### Step 2: Current Session Activity (3 minuty)

```sql
-- Všechny aktivní sessions s jejich aktuálním wait eventem
SELECT s.sid, s.username, s.status, 
  SUBSTR(w.event,1,30) event, 
  w.seconds_in_wait,
  SUBSTR(sql.sql_text,1,40) sql_text
FROM V$SESSION s
LEFT JOIN V$SESSION_WAIT w ON s.sid = w.sid
LEFT JOIN V$SQL sql ON s.sql_id = sql.sql_id
WHERE s.status='ACTIVE'
ORDER BY w.seconds_in_wait DESC;
```

#### Step 3: Historical Analysis (5-10 minut)

```sql
-- Run ASH report for last 1 hour
@?/rdbms/admin/ashrpt.sql
-- Answer prompts for 1-hour analysis
-- Output: ashrpt.html or ashrpt.txt

-- Or manual analysis of V$ACTIVE_SESSION_HISTORY
SELECT event, COUNT(*) cnt
FROM V$ACTIVE_SESSION_HISTORY
WHERE sample_time > SYSDATE - 1/24
GROUP BY event
ORDER BY cnt DESC;
```

#### Step 4: Resource Analysis (5 minuty)

```sql
-- Memory usage
SELECT component, ROUND(current_size/1024/1024/1024,1) size_gb
FROM V$SGA_DYNAMIC_COMPONENTS
ORDER BY current_size DESC;

-- Tablespace usage
SELECT tablespace_name, 
  ROUND(100*used_space/tablespace_size) pct_used,
  used_space*8192/1024/1024 used_mb
FROM DBA_TABLESPACE_USAGE_METRICS
WHERE pct_used > 80;

-- Redo log info
SELECT GROUP#, MEMBERS, BYTES/1024/1024 size_mb, status
FROM V$LOG;
```

#### Step 5: Lock Detection (3 minuty)

```sql
-- Check for blocking locks
SELECT s1.username blocker, s2.username waiter,
  l1.type lock_type, l1.id1, l1.id2
FROM V$LOCK l1, V$LOCK l2, V$SESSION s1, V$SESSION s2
WHERE l1.BLOCK=1 AND l2.request>0
  AND l1.id1=l2.id1 AND l1.id2=l2.id2
  AND s1.sid=l1.sid AND s2.sid=l2.sid;

-- Kill blocking session if needed
-- ALTER SYSTEM KILL SESSION 'SID,SERIAL#';
```

#### Step 6: SQL Specific Analysis (bez SQL Tuning Advisor!)

```sql
-- Explain plan bez advisor
EXPLAIN PLAN FOR
  SELECT ... FROM ... WHERE ...;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY());

-- Real-time SQL monitoring (bez license!)
SELECT sql_id, elapsed_time/1000000 elapsed_sec,
  buffer_gets, disk_reads, rows_processed
FROM V$SQL_MONITOR
WHERE status='EXECUTING'
ORDER BY elapsed_time DESC;
```

---

## 5. MONITOROVACÍ DASHBOARD (DIY SQL*Plus)

### Vytvoření vlastního health check scriptu

```sql
-- FILE: health_check.sql
SET PAGESIZE 30
SET LINESIZE 120
SET FEEDBACK OFF

CLEAR SCREEN
PROMPT ========================================
PROMPT Oracle Database Health Check
PROMPT ========================================
PROMPT

-- 1. Database status
PROMPT --- DATABASE STATUS ---
SELECT name, open_cursors FROM V$DATABASE;

-- 2. Active sessions
PROMPT --- ACTIVE SESSIONS ---
SELECT COUNT(*) active_sessions FROM V$SESSION WHERE status='ACTIVE';

-- 3. Top wait events
PROMPT --- TOP WAIT EVENTS ---
SELECT * FROM (
  SELECT event, COUNT(*) cnt FROM V$SESSION_WAIT
  WHERE event NOT LIKE '%Idle%'
  GROUP BY event ORDER BY cnt DESC
) WHERE ROWNUM <= 5;

-- 4. Memory info
PROMPT --- MEMORY (SGA) ---
SELECT component, ROUND(current_size/1024/1024/1024,2) size_gb
FROM V$SGA_DYNAMIC_COMPONENTS
WHERE current_size > 0
ORDER BY current_size DESC;

-- 5. Tablespace status
PROMPT --- TABLESPACE STATUS ---
SELECT tablespace_name, ROUND(100*used_space/tablespace_size) pct
FROM DBA_TABLESPACE_USAGE_METRICS
WHERE pct > 70
ORDER BY pct DESC;

-- 6. Top CPU SQL
PROMPT --- TOP CPU SQL ---
SELECT sql_id, executions, ROUND(cpu_time/1000000,2) cpu_sec,
  SUBSTR(sql_text,1,50) text
FROM V$SQL
WHERE cpu_time > 0 AND ROWNUM <= 3
ORDER BY cpu_time DESC;

SET FEEDBACK ON
```

### Spuštění healthchecku

```bash
# Periodicky (cron job)
0 */4 * * * sqlplus -s / as sysdba @/home/oracle/health_check.sql >> /tmp/health_check.log

# Nebo manuálně
sqlplus / as sysdba @health_check.sql
```

---

## 6. NOVÉ FEATURES V 23ai (i bez licence)

### Co je dostupné ZDARMA v 23ai

```
✓ SQL History - Zabudováno v V$SQL (bez limitů!)
  Všechny SQL statements se sledují, ne jen top N
  Dříve: Jen top 100 SQL v SGA
  Nyní: Všechna SQL se trackují (s omezeními z SGA velikosti)

✓ Real-Time SQL Monitoring - V$SQL_MONITOR
  DBMS_SQL_MONITOR package bez Diagnostic Pack
  Sledování dlouhodobě běžících SQL statements

✓ ASH Sampling - V$ACTIVE_SESSION_HISTORY
  Vždy dostupné, bez license check!
  ashrpt.sql script - generování reportů
  Limitace: 5-10 minut v paměti

✓ Automatic Transaction Quarantine
  Automaticky se rollbackují dlouhé transakce
  Monitoring v DBA_QUARANTINED_TRANSACTIONS
  V$DIAG_ALERT_EXT se logují incidenty

✓ SQL Firewall - Behavioral Security (free!)
  Kernel-level protection
  Preventace SQL injection
  Monitoring violations v trace files

✓ Enhanced Alert Log
  V$DIAG_ALERT_EXT view
  Structured alert information
  Health check results

✓ ADRCI - Enhanced diagnostics
  Better health check reports
  Problem investigation
  Trace file management
```

---

## 7. PRAKTICKÁ OMEZENÍ A WORKAROUNDY

### Omezení: Žádné dlouhodobé historické data (bez AWR)

```
PROBLÉM: 
- Bez Diagnostic Pack: Bez AWR (Automatic Workload Repository)
- Bez AWR: Bez historických dat delších než ~10 minut
- Bez ADDM: Bez automatické root cause analýzy

ŘEŠENÍ:
1. Ručně sbírat data z V$SQL periodicky:
   - Snapshot do tabulky každou hodinu
   - SQL: INSERT INTO my_sql_history SELECT ... FROM V$SQL;

2. Sběr systémových eventů:
   - SELECT * FROM V$SYSTEM_EVENT INTO my_event_history;
   - Periodicky (skript v cron)

3. Analýza vlastními scriptu:
   - Vlastní trendy vs baseline
   - CSV export pro Excel analýzu

Příklad:
```sql
-- Create own history table
CREATE TABLE sql_history AS
SELECT sysdate as capture_time, sql_id, executions, 
  cpu_time, physical_reads, logical_reads
FROM V$SQL WHERE sql_id IS NOT NULL;

-- Run periodically (e.g., hourly cron job)
-- INSERT INTO sql_history SELECT ... FROM V$SQL;

-- Later: Analyze trends
SELECT capture_time, sql_id, executions, cpu_time,
  LAG(executions) OVER (PARTITION BY sql_id ORDER BY capture_time) prev_exec
FROM sql_history
ORDER BY capture_time DESC;
```

### Omezení: Bez SQL Tuning Advisor (bez Tuning Pack)

```
PROBLÉM:
- Bez Tuning Pack: Bez SQL Tuning Advisor
- Bez doporučení: Musíš tuning dělat ručně

ŘEŠENÍ:
1. Použít DBMS_XPLAN.DISPLAY pro explain plány:
   EXPLAIN PLAN FOR SELECT ... FROM ...;
   SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY());

2. Manuální tuning na základě:
   - Explain plans (indexy, joins)
   - V$SQL_PLAN
   - Dokumentace Oracle Performance Tuning

3. Třetí party tools (SQLT, SQLdb360):
   - SQLT (free, community tool)
   - SQLdb360 (free assessment tool)
   - GitHub zdroje
```

### Omezení: Bez Enterprise Manager (bez Cloud Control)

```
PROBLÉM:
- Bez EM: Žádný GUI
- Bez GUI: Všechno přes SQL*Plus/SQLDeveloper

ŘEŠENÍ:
1. SQLDeveloper (ZDARMA!)
   - GUI pro queries
   - Explain plans
   - Performance tuning

2. Třetí party monitoring:
   - Prometheus + Oracle Exporter
   - Grafana pro vizualizace
   - Open source stack

3. Vlastní web dashboards:
   - PHP/Python + Oracle SQL
   - Zobrazení health check dat
   - Email notifications

4. ORACHK - command-line health checks
   - Automatické sbírání dat
   - HTML reports
   - No GUI potřeba
```

---

## 8. CHECKLIST - MONITORING V FREE VERZI

### Týdenní monitoring tasks

```
□ Čtení alert logu (weekly)
  tail -50 $ORACLE_BASE/diag/rdbms/.../trace/alert_*.log

□ Check tablespace usage (weekly)
  SELECT tablespace_name, pct FROM DBA_TABLESPACE_USAGE_METRICS;

□ Top SQL analysis (weekly)
  SELECT sql_id, executions, cpu_time FROM V$SQL ORDER BY cpu_time DESC;

□ Session activity (daily)
  SELECT sid, username, event, seconds_in_wait FROM V$SESSION_WAIT;

□ Lock check (hourly during business)
  SELECT * FROM V$LOCK WHERE BLOCK=1;

□ Memory trending (daily)
  SELECT component, current_size FROM V$SGA_DYNAMIC_COMPONENTS;

□ ORACHK health check (monthly)
  ./orachk.sh -as > health_report.html
```

### Měsíční reporting

```
□ Capacity trending
  - Disk growth rate
  - Memory utilization
  - Archive log generation

□ Performance trends
  - Top SQL changes
  - Wait event trending
  - Lock contention incidents

□ Health check summary
  - Data dictionary health
  - Segment advisor recommendations
  - Unused indexes

□ Security audit
  - Failed login attempts
  - Privilege changes
  - DBA activity log
```

---

## 9. SROVNÁNÍ: PAID vs FREE MONITORING

| Funkce | Placené (EM) | FREE (23ai) | Alternativa |
|--------|--------------|------------|-------------|
| **GUI Interface** | EM Cloud Control | ❌ | SQLDeveloper (free) |
| **Real-Time Dashboard** | Yes | ❌ | Vlastní SQL scriptu |
| **AWR Reports** | Yes (automatic) | ❌ | Manual V$ queries |
| **ADDM Analysis** | Automatic | ❌ | Manual analysis |
| **SQL Tuning Advisor** | Yes | ❌ | Explain plans + manual |
| **Incident Management** | Automatic | ❌ | ADRCI + manual |
| **Alerting** | Email/Pager | ❌ | Custom scripts |
| **Performance Hub** | Yes | ❌ | ashrpt.sql + V$SQL |
| **V$ Views** | Yes | ✓ | SQL*Plus access |
| **ASH Sampling** | Yes | ✓ | V$ACTIVE_SESSION_HISTORY |
| **SQL Monitor** | Yes | ✓ | V$SQL_MONITOR free! |
| **Alert Log** | Yes | ✓ | Direct file + V$DIAG_ALERT_EXT |
| **ADRCI Diagnostics** | Yes | ✓ | adrci command-line |
| **Real-Time Monitoring** | Live | Limited | V$SESSION + manual |
| **Historical Trending** | Years | ❌ | Manual collection |
| **Health Checks** | Automatic | ✓ | ORACHK (free tool) |

---

## 10. DOPORUČENÉ PŘÍSTUPY PRO DEVELOPMENT/TESTING

### Scenario: Developmentu bez EM

```
Prostředí: Notebook s Oracle Database 23ai Free
Úkol: Monitor aplikace během vývoje

Setup:
1. Install Oracle Database 23ai Free (RPM/Docker)
2. Create development database
3. Use SQL*Plus / SQLDeveloper pro monitoring

Daily workflow:
- Run health check script (startup)
- Monitor V$SESSION_WAIT during tests
- Review V$SQL for slow queries
- Generate ashrpt.sql for problematic timeframes
- Manual tuning based on explain plans
- No Enterprise Manager needed!

Tools:
✓ SQL*Developer (free)
✓ SQL*Plus (included)
✓ ashrpt.sql (included)
✓ ADRCI (included)
✓ ORACHK (download free)
```

### Scenario: Production bez Enterprise Manager

```
Prostředí: Production server bez Enterprise Manager
Úkol: 24/7 monitoring s limited resources

Setup:
1. Oracle Database 23ai (free or standard)
2. Custom monitoring scripts
3. ORACHK for health checks
4. Email notifications

Implementation:
- Cron jobs (every 15 min):
  SELECT INTO table FROM V$SESSION_WAIT
  SELECT INTO table FROM V$SQL
  
- Hourly reports generated
- Email alerts if thresholds exceeded
- Weekly ORACHK health report
- Manual ADRCI diagnostic analysis

Cost: MINIMAL (just server + DBA time)
Benefit: Necessary visibility without EM cost
```

---

## 11. KDE HLEDAT HELP (bez Oracle Support)

```
Zdroje:
✓ Oracle Database Documentation
  - docs.oracle.com
  - Free 23ai docs dostupné

✓ SQL*Plus Scripts (include)
  - $ORACLE_HOME/rdbms/admin/

✓ Oracle Technology Network (OTN)
  - forums, tutorials, scripts

✓ Community Resources
  - Stackoverflow (oracle-database tag)
  - Reddit r/oracle
  - DBA blogs

✓ ORACHK (automatic recommendations)
  - Health check results s doporučeními

✓ Alert Log (Oracle's diagnostics)
  - ORA errors often describe solution

✓ Health Checks (built-in)
  - DBMS_DICTIONARY_CHECK
  - ADRCI diagnostics
  - Trace file analysis
```

---

**Verze: 1.0 - FREE Edition Monitoring Guide**
**Pro Oracle Database 23ai bez Enterprise Manager**
