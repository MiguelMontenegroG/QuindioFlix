"""
Script de consulta SQL directa a Oracle.
Ejecuta consultas SELECT directamente desde la terminal.
Sin emojis.

Uso:
    python query_db.py                    # Modo interactivo
    python query_db.py "SELECT * FROM usuarios"   # Consulta directa
    python query_db.py -f consulta.sql    # Consulta desde archivo

Requisitos: pip install oracledb python-dotenv
"""

import sys
import os
from pathlib import Path

# Cargar .env manualmente (sin la libreria python-dotenv si no esta)
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip())

try:
    import oracledb
except ImportError:
    print("Error: Se necesita oracledb. Instalalo con: pip install oracledb")
    sys.exit(1)

# Configuracion desde variables de entorno (con defaults)
DB_USER = os.getenv("DB_USER") or os.getenv("DB_USER_FILE") or "C##quindioflix"
DB_PASS = os.getenv("DB_PASS") or os.getenv("DB_PASSWORD") or "quindioflix"
DB_DSN = os.getenv("DB_DSN") or "localhost:1521/BD"


def conectar():
    """Crea y retorna una conexion a Oracle."""
    try:
        conn = oracledb.connect(user=DB_USER, password=DB_PASS, dsn=DB_DSN)
        print(f"Conectado a Oracle en {DB_DSN} como {DB_USER}")
        print()
        return conn
    except oracledb.Error as e:
        print(f"Error de conexion: {e}")
        print(f"Verifica que Oracle este corriendo en {DB_DSN}")
        sys.exit(1)


def formatear_fila(row, columns, anchos):
    """Formatea una fila como texto de ancho fijo."""
    partes = []
    for i, col in enumerate(columns):
        val = row[i] if row[i] is not None else "NULL"
        val = str(val)
        if len(val) > anchos[i]:
            val = val[:anchos[i] - 3] + "..."
        partes.append(val.ljust(anchos[i]))
    return " | ".join(partes)


def mostrar_resultados(cursor):
    """Muestra los resultados de una consulta formateados como tabla."""
    columns = [desc[0] for desc in cursor.description]
    
    # Obtener todas las filas
    rows = cursor.fetchall()
    
    if not rows:
        print("(0 filas retornadas)")
        return
    
    # Calcular anchos de columna
    anchos = []
    for i, col in enumerate(columns):
        max_len = len(col)
        for row in rows:
            val = str(row[i]) if row[i] is not None else "NULL"
            max_len = max(max_len, len(val))
        anchos.append(min(max_len + 1, 40))  # max 40 chars por columna
    
    # Linea separadora
    separador = "-+-".join("-" * a for a in anchos)
    
    # Encabezados
    print(separador)
    print(formatear_fila(columns, columns, anchos))
    print(separador)
    
    # Filas
    for row in rows:
        print(formatear_fila(row, columns, anchos))
    
    print(separador)
    print(f"({len(rows)} filas retornadas)")


def modo_interactivo(conn):
    """Modo interactivo: lee consultas una por una."""
    print("Modo interactivo. Escribe 'salir' o 'exit' para terminar.")
    print("Escribe 'tablas' para listar las tablas disponibles.")
    print("Escribe 'tabla <nombre>' para ver la estructura de una tabla.")
    print()
    
    while True:
        try:
            entrada = input("SQL> ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break
        
        if not entrada:
            continue
        
        if entrada.lower() in ("salir", "exit", "quit"):
            break
        
        if entrada.lower() == "tablas":
            try:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT table_name FROM user_tables ORDER BY table_name"
                )
                print()
                print("== TABLAS DEL ESQUEMA ==")
                for row in cursor:
                    print(f"  - {row[0]}")
                print()
                cursor.close()
            except Exception as e:
                print(f"Error: {e}")
            continue
        
        if entrada.lower().startswith("tabla "):
            nombre_tabla = entrada[6:].strip().upper()
            try:
                cursor = conn.cursor()
                cursor.execute(
                    f"""SELECT column_name, data_type, nullable, data_length
                        FROM user_tab_columns
                        WHERE table_name = '{nombre_tabla}'
                        ORDER BY column_id"""
                )
                print(f"\n== ESTRUCTURA DE {nombre_tabla} ==")
                print(f"{'Columna':30} {'Tipo':30} {'Nulo':5} {'Longitud':8}")
                print("-" * 75)
                for row in cursor:
                    col, tipo, nullable, length = row
                    nulo = "SI" if nullable == "Y" else "NO"
                    print(f"{col:30} {tipo:30} {nulo:5} {str(length or ''):8}")
                print()
                cursor.close()
            except Exception as e:
                print(f"Error: {e}")
            continue
        
        # Ejecutar la consulta
        try:
            cursor = conn.cursor()
            cursor.execute(entrada)
            if cursor.description:
                mostrar_resultados(cursor)
            else:
                print(f"Consulta ejecutada. Filas afectadas: {cursor.rowcount}")
            cursor.close()
        except Exception as e:
            print(f"Error SQL: {e}")


def main():
    # Si hay -f, leer archivo
    if len(sys.argv) == 3 and sys.argv[1] == "-f":
        archivo = sys.argv[2]
        try:
            with open(archivo, "r") as f:
                consulta = f.read()
        except FileNotFoundError:
            print(f"Archivo no encontrado: {archivo}")
            sys.exit(1)
    elif len(sys.argv) >= 2 and not sys.argv[1].startswith("-"):
        consulta = " ".join(sys.argv[1:])
    else:
        consulta = None
    
    conn = conectar()
    
    if consulta:
        # Modo consulta unica
        try:
            cursor = conn.cursor()
            cursor.execute(consulta)
            if cursor.description:
                mostrar_resultados(cursor)
            else:
                print(f"Consulta ejecutada. Filas afectadas: {cursor.rowcount}")
            cursor.close()
        except Exception as e:
            print(f"Error SQL: {e}")
    else:
        # Modo interactivo
        modo_interactivo(conn)
    
    conn.close()


if __name__ == "__main__":
    main()
