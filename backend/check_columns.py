"""Verifica columnas de tablas clave para el monitor."""
from backend.database import get_connection, release_connection

conn = get_connection("admin")
cursor = conn.cursor()

tablas = ["REPRODUCCIONES", "PAGOS", "USUARIOS", "REPORTES"]
for t in tablas:
    cursor.execute(f"SELECT column_name FROM all_tab_cols WHERE table_name = '{t}' AND owner = 'C##QUINDIOFLIX'")
    cols = [r[0] for r in cursor]
    print(f"{t}: {cols}")

cursor.close()
release_connection(conn)
