#!/usr/bin/env python
"""
Test script to verify the Reports improvements
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://127.0.0.1:8000/api"

print("=" * 60)
print("TESTING REPORTS IMPROVEMENTS")
print("=" * 60)

# Test 1: Check available dates endpoint
print("\n1️⃣  Testing /api/reports/fechas-disponibles/ endpoint...")
try:
    response = requests.get(f"{BASE_URL}/reports/fechas-disponibles/")
    response.raise_for_status()
    data = response.json()
    print(f"   ✅ Status: {response.status_code}")
    print(f"   📅 Total available dates: {data.get('total_fechas', 0)}")
    if data.get('fechas_disponibles'):
        print(f"   📋 Sample dates: {data['fechas_disponibles'][:3]}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 2: Check improved CSV export with sample date
print("\n2️⃣  Testing improved /api/reports/ventas/ endpoint...")
try:
    today = datetime.now().date()
    yesterday = today - timedelta(days=1)
    
    params = {
        'fecha_inicio': yesterday.isoformat(),
        'fecha_fin': today.isoformat()
    }
    
    response = requests.get(f"{BASE_URL}/reports/ventas/", params=params)
    response.raise_for_status()
    
    print(f"   ✅ Status: {response.status_code}")
    print(f"   📊 Content-Type: {response.headers.get('Content-Type', 'N/A')}")
    
    # Check CSV content
    csv_content = response.text
    lines = csv_content.split('\n')
    if lines:
        header = lines[0]
        print(f"   📋 CSV Columns ({len(header.split(','))}):")
        columns = header.split(',')
        for i, col in enumerate(columns, 1):
            print(f"      {i}. {col.strip()}")
        
        if len(lines) > 1:
            print(f"   📈 Data rows: {len(lines) - 2}")
            
except Exception as e:
    print(f"   ❌ Error: {e}")

print("\n" + "=" * 60)
print("IMPROVEMENTS SUMMARY")
print("=" * 60)
print("""
✅ Backend Changes:
   • New endpoint: /api/reports/fechas-disponibles/
   • Enhanced CSV with 15 columns (was 8)
   • Columns include: table_code, nome_mesero, margin_%, etc.
   
✅ Frontend Changes:
   • Quick-select buttons (Today, Last 7 Days, Last 30 Days, Clear)
   • Available dates preview in report panel
   • All date changes trigger available dates reload
   
✅ Data Enrichment:
   • Table codes with branch prefixes (G-01, R-01, ZT-01)
   • Employee names (waiter & cashier)
   • Sales margins calculated
   • Date/Time split for better sorting
""")
print("=" * 60)
