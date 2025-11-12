import os
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

print("=" * 60)
print("🔧 Oracle Database Connection Test")
print("=" * 60)
print(f"User:         {ORACLE_USER}")
print(f"Password:     {'*' * len(ORACLE_PASSWORD)}")
print(f"Host:         {ORACLE_HOST}")
print(f"Port:         {ORACLE_PORT}")
print(f"Service:      {ORACLE_SERVICE}")
print("=" * 60)
print()

# Test 1: Základní připojení
print("Test 1: Connecting to Oracle...")
try:
    conn = oracledb.connect(
        user=ORACLE_USER,
        password=ORACLE_PASSWORD,
        host=ORACLE_HOST,
        port=int(ORACLE_PORT),
        service_name=ORACLE_SERVICE
    )
    print("✅ Connection successful!")
    
    # Test 2: Jednoduchý dotaz
    print("\nTest 2: Running simple query (SELECT 1 FROM DUAL)...")
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM DUAL")
    result = cur.fetchone()
    print(f"✅ Query successful! Result: {result[0]}")
    
    # Test 3: Test přístupu k V$SESSION
    print("\nTest 3: Testing access to V$SESSION...")
    cur.execute("SELECT COUNT(*) FROM V$SESSION")
    count = cur.fetchone()[0]
    print(f"✅ V$SESSION access OK! Session count: {count}")
    
    cur.close()
    conn.close()
    
    print("\n" + "=" * 60)
    print("✅ All tests passed! Database connection is working.")
    print("=" * 60)
    
except oracledb.Error as error:
    print(f"❌ Oracle error: {error}")
    print("\n" + "=" * 60)
    print("🔧 Troubleshooting suggestions:")
    print("=" * 60)
    print("1. Check if the password is correct in .env file")
    print("2. Try different service names:")
    print("   - FREEPDB1")
    print("   - FREE")
    print("   - XE")
    print("3. Check if user has necessary privileges")
    print("4. Verify the database is running: ping 10.0.21.14")
    print("=" * 60)
    
except Exception as e:
    print(f"❌ Unexpected error: {e}")

print("\nPress Enter to exit...")
input()
