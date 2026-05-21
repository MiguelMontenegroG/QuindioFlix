"""Prueba directa del monitor_service."""
import sys
sys.path.insert(0, ".")

from backend.database import get_connection, release_connection

conn = get_connection("admin")
cursor = conn.cursor()

# Test 1: consulta de planes
print("=== Test 1: Planes populares ===")
try:
    cursor.execute("""
        SELECT p.nombre_plan, COUNT(*) as total
        FROM USUARIOS u
        JOIN PLANES p ON u.id_plan = p.id_plan
        GROUP BY p.nombre_plan
        ORDER BY total DESC
    """)
    for row in cursor:
        print(f"  {row[0]}: {row[1]}")
except Exception as e:
    print(f"  ERROR: {e}")

# Test 2: consulta de contenido mas visto
print("\n=== Test 2: Top contenido ===")
try:
    cursor.execute("""
        SELECT c.titulo, COUNT(r.id_reproduccion) as vistas
        FROM REPRODUCCIONES r
        JOIN CONTENIDO c ON r.id_contenido = c.id_contenido
        GROUP BY c.titulo
        ORDER BY vistas DESC
        FETCH FIRST 5 ROWS ONLY
    """)
    for row in cursor:
        print(f"  {row[0]}: {row[1]}")
except Exception as e:
    print(f"  ERROR: {e}")

# Test 3: consulta de reproducciones hoy
print("\n=== Test 3: Reproducciones hoy ===")
try:
    cursor.execute("""
        SELECT COUNT(*)
        FROM REPRODUCCIONES
        WHERE TRUNC(fecha_hora_inicio) = TRUNC(SYSDATE)
    """)
    print(f"  {cursor.fetchone()[0]}")
except Exception as e:
    print(f"  ERROR: {e}")

# Test 4: todas las metricas basicas
print("\n=== Test 4: Metricas basicas ===")
tests = [
    ("Total usuarios", "SELECT COUNT(*) FROM USUARIOS"),
    ("Total contenido", "SELECT COUNT(*) FROM CONTENIDO"),
    ("Total reproducciones", "SELECT COUNT(*) FROM REPRODUCCIONES"),
    ("Total pagos", "SELECT COUNT(*) FROM PAGOS"),
    ("Ingresos mes", "SELECT NVL(SUM(monto), 0) FROM PAGOS WHERE estado_pago = 'EXITOSO' AND EXTRACT(MONTH FROM fecha_pago) = EXTRACT(MONTH FROM SYSDATE) AND EXTRACT(YEAR FROM fecha_pago) = EXTRACT(YEAR FROM SYSDATE)"),
    ("Pagos pendientes", "SELECT COUNT(*) FROM PAGOS WHERE estado_pago = 'PENDIENTE'"),
    ("Usuarios nuevos hoy", "SELECT COUNT(*) FROM USUARIOS WHERE TRUNC(fecha_registro) = TRUNC(SYSDATE)"),
]
for nombre, query in tests:
    try:
        cursor.execute(query)
        print(f"  {nombre}: {cursor.fetchone()[0]}")
    except Exception as e:
        print(f"  {nombre}: ERROR - {e}")

cursor.close()
release_connection(conn)
print("\n=== Prueba completada ===")
