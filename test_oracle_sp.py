import oracledb

conn = oracledb.connect(user='C##quindioflix', password='quindioflix', dsn='localhost:1521/BD')
cursor = conn.cursor()

# Ver tablas
cursor.execute("SELECT table_name FROM user_tables WHERE table_name LIKE '%PLAN%' OR table_name LIKE '%USUARIO%'")
print("Tablas encontradas:")
for row in cursor:
    print(f"  {row[0]}")

# Ver procedimientos
cursor.execute("SELECT object_name FROM user_procedures WHERE object_name LIKE '%USUARIO%'")
print("\nProcedimientos con USUARIO:")
for row in cursor:
    print(f"  {row[0]}")

# Ver todos los procedimientos
cursor.execute("SELECT object_name FROM user_procedURES")
print("\nTodos los procedimientos:")
for row in cursor:
    print(f"  {row[0]}")

# Ver el SP_REGISTRAR_USUARIO
cursor.execute("SELECT text FROM user_source WHERE name='SP_REGISTRAR_USUARIO' ORDER BY line")
print("SP_REGISTRAR_USUARIO code:")
lines = [r[0] for r in cursor]
print(''.join(lines))
print("\n" + "="*50)

# Ver el SP_REGISTRAR_USUARIO_COMPLETO
cursor.execute("SELECT text FROM user_source WHERE name='SP_REGISTRAR_USUARIO_COMPLETO' ORDER BY line")
rows = cursor.fetchall()
if rows:
    print("SP_REGISTRAR_USUARIO_COMPLETO code:")
    print(''.join([r[0] for r in rows]))
else:
    print("SP_REGISTRAR_USUARIO_COMPLETO NO existe en la BD")

# Ver parametros del SP que existe
cursor.execute("SELECT argument_name, data_type, in_out FROM user_arguments WHERE object_name='SP_REGISTRAR_USUARIO' ORDER BY position")
print("\nParametros de SP_REGISTRAR_USUARIO:")
for row in cursor:
    print(f"  {row[0]} ({row[1]}) - {row[2]}")

cursor.close()
conn.close()
