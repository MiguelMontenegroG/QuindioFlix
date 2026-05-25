"""Prueba del monitor_service usando fq() con el schema corregido."""
import sys
import os

# Asegurar que el directorio raiz del proyecto esta en el path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from backend.database import init_pools, get_connection, release_connection, fq
from backend.config import settings

print("=== DB_SCHEMA actual:", settings.DB_SCHEMA, "===")

init_pools()
conn = get_connection('admin')
cursor = conn.cursor()

tests = [
    ("COUNT USUARIOS", "SELECT COUNT(*) FROM " + fq("USUARIOS")),
    ("GROUP USUARIOS", "SELECT estado_cuenta, COUNT(*) as cnt FROM " + fq("USUARIOS") + " GROUP BY estado_cuenta"),
    ("COUNT CONTENIDO", "SELECT COUNT(*) FROM " + fq("CONTENIDO")),
    ("COUNT REPRODUCCIONES", "SELECT COUNT(*) FROM " + fq("REPRODUCCIONES")),
    ("COUNT PAGOS", "SELECT COUNT(*) FROM " + fq("PAGOS")),
]

for name, query in tests:
    try:
        cursor.execute(query)
        row = cursor.fetchone()
        print(f"  [OK] {name}: {row[0] if row else 'None'} - {query[:70]}...")
    except Exception as e:
        print(f"  [ERROR] {name}: {e}")

# Planes (JOIN)
print("\n--- PLANES (JOIN) ---")
try:
    q = f"SELECT p.nombre_plan, COUNT(*) as total FROM {fq('USUARIOS')} u JOIN {fq('PLANES')} p ON u.id_plan = p.id_plan GROUP BY p.nombre_plan ORDER BY total DESC"
    cursor.execute(q)
    for row in cursor:
        print(f"  {row[0]}: {row[1]}")
except Exception as e:
    print(f"  ERROR: {e}")

# Top contenido (JOIN)
print("\n--- TOP CONTENIDO ---")
try:
    q = f"SELECT c.titulo, COUNT(r.id_reproduccion) as vistas FROM {fq('REPRODUCCIONES')} r JOIN {fq('CONTENIDO')} c ON r.id_contenido = c.id_contenido GROUP BY c.titulo ORDER BY vistas DESC FETCH FIRST 5 ROWS ONLY"
    cursor.execute(q)
    for row in cursor:
        print(f"  {row[0]}: {row[1]}")
except Exception as e:
    print(f"  ERROR: {e}")

# Ingresos mes
print("\n--- INGRESOS MES ---")
try:
    q = "SELECT NVL(SUM(monto), 0) FROM " + fq("PAGOS") + " WHERE estado_pago = 'EXITOSO' AND EXTRACT(MONTH FROM fecha_pago) = EXTRACT(MONTH FROM SYSDATE) AND EXTRACT(YEAR FROM fecha_pago) = EXTRACT(YEAR FROM SYSDATE)"
    cursor.execute(q)
    print(f"  {cursor.fetchone()[0]}")
except Exception as e:
    print(f"  ERROR: {e}")

# Reproducciones hoy
print("\n--- REPRODUCCIONES HOY ---")
try:
    q = f"SELECT COUNT(*) FROM {fq('REPRODUCCIONES')} WHERE TRUNC(fecha_hora_inicio) = TRUNC(SYSDATE)"
    cursor.execute(q)
    print(f"  {cursor.fetchone()[0]}")
except Exception as e:
    print(f"  ERROR: {e}")

# Usuarios nuevos hoy
print("\n--- USUARIOS NUEVOS HOY ---")
try:
    q = f"SELECT COUNT(*) FROM {fq('USUARIOS')} WHERE TRUNC(fecha_registro) = TRUNC(SYSDATE)"
    cursor.execute(q)
    print(f"  {cursor.fetchone()[0]}")
except Exception as e:
    print(f"  ERROR: {e}")

# Pagos pendientes
print("\n--- PAGOS PENDIENTES ---")
try:
    q = "SELECT COUNT(*) FROM " + fq("PAGOS") + " WHERE estado_pago = 'PENDIENTE'"
    cursor.execute(q)
    print(f"  {cursor.fetchone()[0]}")
except Exception as e:
    print(f"  ERROR: {e}")

# Ultimos registros (JOIN reproducciones)
print("\n--- ULTIMAS REPRODUCCIONES ---")
try:
    q = f"SELECT r.id_reproduccion, c.titulo, TO_CHAR(r.fecha_hora_inicio, 'YYYY-MM-DD HH24:MI:SS') as fecha FROM {fq('REPRODUCCIONES')} r JOIN {fq('CONTENIDO')} c ON r.id_contenido = c.id_contenido ORDER BY r.fecha_hora_inicio DESC FETCH FIRST 5 ROWS ONLY"
    cursor.execute(q)
    for row in cursor:
        print(f"  [{row[0]}] {row[1]} - {row[2]}")
except Exception as e:
    print(f"  ERROR: {e}")

# Ultimos pagos (JOIN)
print("\n--- ULTIMOS PAGOS ---")
try:
    q = f"SELECT p.id_pago, u.nombre, p.monto, p.estado_pago, TO_CHAR(p.fecha_pago, 'YYYY-MM-DD HH24:MI:SS') as fecha FROM {fq('PAGOS')} p JOIN {fq('USUARIOS')} u ON p.id_usuario = u.id_usuario ORDER BY p.fecha_pago DESC FETCH FIRST 5 ROWS ONLY"
    cursor.execute(q)
    for row in cursor:
        print(f"  [{row[0]}] {row[1]} - ${row[2]} - {row[3]} - {row[4]}")
except Exception as e:
    print(f"  ERROR: {e}")

cursor.close()
release_connection(conn)
print("\n=== PRUEBA COMPLETADA ===")
