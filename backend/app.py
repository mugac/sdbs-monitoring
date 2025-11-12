import os
from datetime import datetime
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import oracledb

# Načtení .env souboru
load_dotenv()

# Konfigurace
ORACLE_USER = os.getenv('ORACLE_USER', 'system')
ORACLE_PASSWORD = os.getenv('ORACLE_PASSWORD', 'oracle')
ORACLE_HOST = os.getenv('ORACLE_HOST', '10.0.21.14')
ORACLE_PORT = os.getenv('ORACLE_PORT', '1521')
ORACLE_SERVICE = os.getenv('ORACLE_SERVICE', 'FREEPDB1')

app = Flask(__name__)
CORS(app)  # Povolí CORS pro frontend


def get_oracle_connection():
    """Vytvoří nové připojení k Oracle DB v thin mode (bez Instant Client)"""
    try:
        conn = oracledb.connect(
            user=ORACLE_USER,
            password=ORACLE_PASSWORD,
            host=ORACLE_HOST,
            port=int(ORACLE_PORT),
            service_name=ORACLE_SERVICE
        )
        return conn
    except oracledb.Error as error:
        print(f"❌ Oracle connection error: {error}")
        raise


def fetch_metrics():
    """Načte aktuální metriky z Oracle DB"""
    try:
        conn = get_oracle_connection()
        cur = conn.cursor()

        # 1. Aktivní sessions
        cur.execute("SELECT COUNT(*) FROM V$SESSION WHERE STATUS='ACTIVE'")
        active_sessions = cur.fetchone()[0]

        # 2. Total sessions
        cur.execute("SELECT COUNT(*) FROM V$SESSION WHERE USERNAME IS NOT NULL")
        total_sessions = cur.fetchone()[0]

        # 3. Top wait events
        cur.execute("""
            SELECT EVENT, COUNT(*) as CNT 
            FROM V$SESSION_WAIT
            WHERE EVENT NOT LIKE '%idle%'
            GROUP BY EVENT
            ORDER BY CNT DESC 
            FETCH FIRST 10 ROWS ONLY
        """)
        wait_events = [{'event': row[0], 'count': row[1]} for row in cur]

        # 4. System-wide wait events
        cur.execute("""
            SELECT EVENT, TOTAL_WAITS, TIME_WAITED, AVERAGE_WAIT
            FROM V$SYSTEM_EVENT
            WHERE EVENT NOT LIKE '%SQL%' AND EVENT NOT LIKE '%Idle%'
            ORDER BY TIME_WAITED DESC
            FETCH FIRST 10 ROWS ONLY
        """)
        system_events = [{'event': r[0], 'total_waits': r[1], 'time_waited': r[2], 'avg_wait': r[3]} 
                         for r in cur]

        # 5. Top SQL podle CPU time
        cur.execute("""
            SELECT SQL_ID, EXECUTIONS, 
                   ROUND(CPU_TIME/1000000,2) as CPU_SEC,
                   ROUND(ELAPSED_TIME/1000000,2) as ELAPSED_SEC,
                   DISK_READS,
                   BUFFER_GETS,
                   SUBSTR(SQL_TEXT,1,100) as SQL_TEXT
            FROM V$SQL 
            WHERE EXECUTIONS > 0
            ORDER BY CPU_TIME DESC 
            FETCH FIRST 10 ROWS ONLY
        """)
        top_sql = [{'sql_id': r[0], 'executions': r[1], 'cpu_sec': r[2], 
                    'elapsed_sec': r[3], 'disk_reads': r[4], 
                    'buffer_gets': r[5], 'text': r[6]} 
                   for r in cur]

        # 6. SGA komponenty
        cur.execute("""
            SELECT COMPONENT, ROUND(CURRENT_SIZE/1024/1024,2) as SIZE_MB
            FROM V$SGA_DYNAMIC_COMPONENTS
            WHERE CURRENT_SIZE > 0 
            ORDER BY CURRENT_SIZE DESC
        """)
        sga_stats = [{'component': r[0], 'size_mb': r[1]} for r in cur]

        # 7. Tablespace usage
        cur.execute("""
            SELECT TABLESPACE_NAME, 
                   ROUND(100*USED_SPACE/TABLESPACE_SIZE,2) as PCT_USED,
                   ROUND(USED_SPACE*8192/1024/1024,2) as USED_MB,
                   ROUND(TABLESPACE_SIZE*8192/1024/1024,2) as TOTAL_MB
            FROM DBA_TABLESPACE_USAGE_METRICS
            ORDER BY PCT_USED DESC
        """)
        tablespaces = [{'name': r[0], 'pct_used': r[1], 'used_mb': r[2], 'total_mb': r[3]} 
                       for r in cur]

        # 8. Recent alerts (pokud existují)
        try:
            cur.execute("""
                SELECT MESSAGE_TEXT, MESSAGE_LEVEL, ORIGINATING_TIMESTAMP
                FROM V$DIAG_ALERT_EXT
                WHERE ORIGINATING_TIMESTAMP > SYSDATE - 1/24
                ORDER BY ORIGINATING_TIMESTAMP DESC
                FETCH FIRST 20 ROWS ONLY
            """)
            alerts = [{'message': r[0], 'level': r[1], 'timestamp': r[2].isoformat() if r[2] else None} 
                     for r in cur]
        except:
            alerts = []

        # 9. Dlouhodobě běžící SQL (SQL Monitor)
        try:
            cur.execute("""
                SELECT SQL_ID, 
                       SQL_EXEC_START,
                       ROUND(ELAPSED_TIME/1000000,2) as ELAPSED_SEC,
                       ROUND(CPU_TIME/1000000,2) as CPU_SEC,
                       BUFFER_GETS,
                       DISK_READS,
                       STATUS
                FROM V$SQL_MONITOR
                WHERE STATUS = 'EXECUTING'
                ORDER BY ELAPSED_TIME DESC
                FETCH FIRST 5 ROWS ONLY
            """)
            long_running = [{'sql_id': r[0], 'start_time': r[1].isoformat() if r[1] else None,
                           'elapsed_sec': r[2], 'cpu_sec': r[3], 
                           'buffer_gets': r[4], 'disk_reads': r[5], 'status': r[6]} 
                          for r in cur]
        except:
            long_running = []

        # 10. Database info
        cur.execute("SELECT NAME, OPEN_MODE, LOG_MODE FROM V$DATABASE")
        db_row = cur.fetchone()
        db_info = {'name': db_row[0], 'open_mode': db_row[1], 'log_mode': db_row[2]}

        cur.close()
        conn.close()
        
        return {
            'timestamp': datetime.now().isoformat(),
            'database': db_info,
            'active_sessions': active_sessions,
            'total_sessions': total_sessions,
            'wait_events': wait_events,
            'system_events': system_events,
            'top_sql': top_sql,
            'sga_stats': sga_stats,
            'tablespaces': tablespaces,
            'alerts': alerts,
            'long_running_sql': long_running
        }
    except oracledb.Error as error:
        print(f"❌ Oracle error: {error}")
        return None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return None


@app.route('/api/health', methods=['GET'])
def get_health():
    """Vrátí aktuální stav databáze"""
    metrics = fetch_metrics()
    if metrics is None:
        return jsonify({
            'error': 'Failed to fetch metrics from Oracle',
            'timestamp': datetime.now().isoformat()
        }), 500
    return jsonify(metrics)


@app.route('/api/ping', methods=['GET'])
def ping():
    """Zdravotní check API"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'database': f"{ORACLE_USER}@{ORACLE_HOST}:{ORACLE_PORT}/{ORACLE_SERVICE}"
    })


@app.route('/', methods=['GET'])
def index():
    """Root endpoint"""
    return jsonify({
        'service': 'Oracle Database 23ai Free Monitoring API',
        'version': '1.0.0',
        'endpoints': {
            '/api/ping': 'Health check',
            '/api/health': 'Database metrics'
        }
    })


if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Starting Oracle Monitoring Backend...")
    print(f"📊 Database: {ORACLE_USER}@{ORACLE_HOST}:{ORACLE_PORT}/{ORACLE_SERVICE}")
    print(f"🌐 API will be available at: http://localhost:5000")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5000, debug=True)
