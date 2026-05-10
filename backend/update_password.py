"""Script para actualizar la contrasena del admin."""
import oracledb

conn = oracledb.connect(
    user="C##quindioflix",
    password="quindioflix",
    dsn="localhost:1521/BD"
)

# Hash generado con passlib para "Admin123!"
new_hash = "$2b$12$eKhgnBeJ8OiF46gGYp/mLueJ23BaYI6MWhfPn2YEl.RaTyoI3Newi"

cursor = conn.cursor()
cursor.execute(
    "UPDATE USUARIOS SET password_hash = :hash WHERE email = 'admin@quindioflix.com'",
    hash=new_hash
)
conn.commit()

# Verificar
cursor.execute(
    "SELECT email, password_hash FROM USUARIOS WHERE email = 'admin@quindioflix.com'"
)
row = cursor.fetchone()
print(f"Email: {row[0]}")
print(f"Hash: {row[1]}")
print(f"Hash length: {len(row[1])}")

cursor.close()
conn.close()
