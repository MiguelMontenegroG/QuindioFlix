import oracledb
from backend.database import get_connection, release_connection, fq

conn = get_connection('admin')
cursor = conn.cursor()
try:
    # First get the next sequence value
    cursor.execute(f"SELECT seq_reportes.NEXTVAL FROM DUAL")
    next_id = cursor.fetchone()[0]
    print(f"Next ID: {next_id}")
    
    # Now insert without RETURNING
    cursor.execute(
        f"""INSERT INTO {fq('REPORTES')} (id_reporte, id_perfil_reportador, id_contenido, motivo, estado_reporte)
           VALUES (:1, :2, :3, :4, 'PENDIENTE')""",
        [next_id, 4, 1, 'test_contenido_inapropiado']
    )
    conn.commit()
    print(f'SUCCESS! Inserted with id={next_id}')
    
    # Verify by fetching
    cursor.execute(f"SELECT * FROM {fq('REPORTES')} WHERE id_reporte = :1", [next_id])
    row = cursor.fetchone()
    print(f"Row: {row}")
    
except Exception as e:
    conn.rollback()
    print(f'Error: {type(e).__name__}: {e}')
    import traceback
    traceback.print_exc()
finally:
    cursor.close()
    release_connection(conn, 'admin')
