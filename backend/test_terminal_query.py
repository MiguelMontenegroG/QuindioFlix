"""
Script de prueba para depurar el problema del SQL Terminal.
Simula la logica de ejecutar_consulta_sql y muestra la query transformada.
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

_env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=_env_path, override=True)

# Leer configuracion
DB_SCHEMA = os.getenv("DB_SCHEMA", "C##QUINDIOFLIX")
DB_USER = os.getenv("DB_USER", "C##quindioflix")
DB_PASS = os.getenv("DB_PASS", "")
DB_DSN = os.getenv("DB_DSN", "localhost:1521/BD")

print("=" * 60)
print("Configuracion actual:")
print(f"  DB_SCHEMA = '{DB_SCHEMA}'")
print(f"  DB_USER   = '{DB_USER}'")
print(f"  DB_DSN    = '{DB_DSN}'")
print("=" * 60)

# Query de prueba (una de las que falla en el terminal)
query_test = """SELECT c.titulo, cat.nombre_categoria, COUNT(r.id_reproduccion) AS reproducciones
FROM C##QUINDIOFLIX.CONTENIDO c
JOIN C##QUINDIOFLIX.CATEGORIAS cat ON cat.id_categoria = c.id_categoria
LEFT JOIN C##QUINDIOFLIX.REPRODUCCIONES r ON r.id_contenido = c.id_contenido
GROUP BY c.titulo, cat.nombre_categoria
ORDER BY reproducciones DESC
FETCH FIRST 10 ROWS ONLY"""

print("\n--- Query ORIGINAL ---")
print(query_test)

# --- Simular paso 1: Reemplazo de esquemas ---
query_prep = query_test
for posible_esquema in ["QUINDIOFLIX.", "C##QUINDIOFLIX."]:
    if posible_esquema.upper() != f"{DB_SCHEMA}.":
        print(f"\nReemplazando '{posible_esquema}' por '{DB_SCHEMA}.'")
        query_prep = query_prep.replace(posible_esquema, f"{DB_SCHEMA}.")
        query_prep = query_prep.replace(posible_esquema.upper(), f"{DB_SCHEMA}.")
        query_prep = query_prep.replace(posible_esquema.lower(), f"{DB_SCHEMA}.")

print("\n--- Query DESPUES de reemplazo de esquemas ---")
print(query_prep)

# --- Simular paso 2b: Anteponer DB_SCHEMA a tablas sin calificar ---
tokens = query_prep.split()
reserved = ("SELECT", "WHERE", "AND", "OR", "ORDER", "GROUP", "HAVING", "SET", "NOT", "NULL", 
            "DISTINCT", "AS", "BY", "ON", "IN", "LIKE", "BETWEEN", "EXISTS", "ALL", "ANY", 
            "SOME", "UNION", "INTERSECT", "MINUS", "WITH", "CASE", "WHEN", "THEN", "ELSE", 
            "END", "TRUE", "FALSE", "FROM", "JOIN", "INTO", "TABLE", "UPDATE", "LEFT", "RIGHT",
            "FETCH", "FIRST", "ROWS", "ONLY", "ROWNUM")

i = 0
while i < len(tokens):
    tok = tokens[i]
    tok_upper = tok.upper().rstrip(";,")
    if tok_upper in ("FROM", "JOIN") and i + 1 < len(tokens):
        siguiente = tokens[i + 1].rstrip(";,")
        if "." not in siguiente and siguiente == siguiente.upper() and not siguiente.startswith("("):
            if siguiente not in reserved:
                siguiente_fq = f"{DB_SCHEMA}.{siguiente}"
                print(f"\nCalificando '{siguiente}' -> '{siguiente_fq}'")
                query_prep = query_prep.replace(tokens[i + 1], siguiente_fq, 1)
    i += 1

print("\n--- Query FINAL ---")
print(query_prep)

# Ahora probar la conexion real
print("\n" + "=" * 60)
print("Probando conexion a Oracle...")
print("=" * 60)

try:
    import oracledb
    conn = oracledb.connect(
        user=DB_USER,
        password=DB_PASS,
        dsn=DB_DSN
    )
    cursor = conn.cursor()
    
    print(f"\nConectado como: {DB_USER}")
    print(f"Base de datos: {DB_DSN}")
    
    # Probar la query original directamente
    print("\n--- Ejecutando query ORIGINAL ---")
    try:
        cursor.execute(query_test)
        cursor.fetchall()
        print("  OK - Query original ejecutada correctamente")
    except Exception as e:
        print(f"  ERROR en query original: {e}")
    
    # Probar CURRENT_SCHEMA
    print("\n--- Probando ALTER SESSION SET CURRENT_SCHEMA ---")
    try:
        cursor.execute(f"ALTER SESSION SET CURRENT_SCHEMA = {DB_SCHEMA}")
        print(f"  OK - CURRENT_SCHEMA cambiado a {DB_SCHEMA}")
    except Exception as e:
        print(f"  ERROR al cambiar CURRENT_SCHEMA: {e}")
    
    # Probar query sin prefijo con CURRENT_SCHEMA
    query_sin_prefijo = """SELECT c.titulo, cat.nombre_categoria, COUNT(r.id_reproduccion) AS reproducciones
FROM CONTENIDO c
JOIN CATEGORIAS cat ON cat.id_categoria = c.id_categoria
LEFT JOIN REPRODUCCIONES r ON r.id_contenido = c.id_contenido
GROUP BY c.titulo, cat.nombre_categoria
ORDER BY reproducciones DESC
FETCH FIRST 10 ROWS ONLY"""
    
    print("\n--- Ejecutando query SIN prefijo (con CURRENT_SCHEMA) ---")
    try:
        cursor.execute(query_sin_prefijo)
        rows = cursor.fetchmany(5)
        print(f"  OK - {len(rows)} filas obtenidas")
    except Exception as e:
        print(f"  ERROR: {e}")
    
    # Finalmente, probar con prefijo C##QUINDIOFLIX pero corriendo desde el schema actual
    print("\n--- Testing all_tables para el owner C##QUINDIOFLIX ---")
    cursor.execute("SELECT table_name FROM all_tables WHERE owner = 'C##QUINDIOFLIX' ORDER BY table_name")
    tables = [r[0] for r in cursor.fetchall()]
    print(f"  Tablas encontradas: {tables}")
    
    # Verificar tablas del usuario actual
    print("\n--- Probando user_tables ---")
    cursor.execute("SELECT table_name FROM user_tables ORDER BY table_name")
    user_tables = [r[0] for r in cursor.fetchall()]
    print(f"  Tablas del usuario actual: {user_tables}")
    
    cursor.close()
    conn.close()
    
except ImportError:
    print("  oracledb no instalado")
except Exception as e:
    print(f"  Error de conexion: {e}")
