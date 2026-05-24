import oracledb
from backend.database import get_connection, release_connection, fq

conn = get_connection('admin')
cursor = conn.cursor()
try:
    cursor.execute(
        f"""INSERT INTO {fq('REPORTES')} (id_reporte, id_perfil_reportador, id_contenido, motivo, estado_reporte)
           VALUES (seq_reportes.NEXTVAL, :1, :2, :3, 'PENDIENTE')
           RETURNING id_reporte, fecha_reporte INTO :4, :5""",
        [4, 1, 'test_contenido_inapropiado',
         cursor.var(int), cursor.var(str)]
    )
    id_reporte, fecha = cursor.fetchone()
    conn.commit()
    print(f'SUCCESS! id={id_reporte}, fecha={fecha}')
except Exception as e:
    conn.rollback()
    print(f'Error: {type(e).__name__}: {e}')
    import traceback
    traceback.print_exc()
finally:
    cursor.close()
    release_connection(conn, 'admin')
