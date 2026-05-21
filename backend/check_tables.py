"""Script para verificar que tablas existen en Oracle."""
from backend.database import get_connection, release_connection

conn = get_connection("admin")
cursor = conn.cursor()

# Tablas existentes
cursor.execute("SELECT table_name FROM all_tables WHERE owner = 'C##QUINDIOFLIX' ORDER BY table_name")
tablas = [r[0] for r in cursor]
print("=== TABLAS EXISTENTES EN C##QUINDIOFLIX ===")
for t in tablas:
    print(f"  {t}")

print()

# Tablas esperadas
esperadas = [
    "USUARIOS", "PLANES", "CONTENIDO", "GENEROS", "CONTENIDO_GENEROS",
    "TEMPORADAS", "EPISODIOS", "PERFILES", "REPRODUCCIONES",
    "FAVORITOS", "CALIFICACIONES", "PAGOS", "REPORTES_CONTENIDO",
    "CONTENIDO_RELACIONADO", "EMPLEADOS", "DEPARTAMENTOS",
    "HISTORIAL_ESTADOS", "USUARIOS_AUTH"
]

print("=== VERIFICACION ===")
faltantes = []
for t in esperadas:
    if t in tablas:
        print(f"  [OK] {t}")
    else:
        print(f"  [FALTA] {t}")
        faltantes.append(t)

print(f"\nResumen: {len(tablas)} tablas existentes, {len(faltantes)} faltantes")

# Si existe, ver columnas de REPRODUCCIONES
if "REPRODUCCIONES" in tablas:
    cursor.execute("SELECT column_name FROM all_tab_cols WHERE table_name = 'REPRODUCCIONES' AND owner = 'C##QUINDIOFLIX'")
    cols = [r[0] for r in cursor]
    print(f"\nColumnas de REPRODUCCIONES: {cols}")

cursor.close()
release_connection(conn)
