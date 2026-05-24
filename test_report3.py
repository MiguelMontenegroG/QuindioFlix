import oracledb
from backend.database import get_connection, release_connection, fq

conn = get_connection('admin')
cursor = conn.cursor()
try:
    id_var = cursor.var(int)
    fecha_var = cursor.var(oracledb.DB_TYPE_DATE)  # Use DB_TYPE_DATE
    
    cursor.execute(
        f"""INSERT INTO {fq('REPORTES')} (id_reporte, id_perfil_reportador, id_contenido, motivo, estado_reporte)
           VALUES (seq_reportes.NEXTVAL, :1, :2, :3, 'PENDIENTE')
           RETURNING id_reporte, fecha_reporte INTO :4, :5""",
        [4, 1, 'test_v3', id_var, fecha_var]
    )
    conn.commit()
    id_reporte = id_var.getvalue()[0]
    fecha = fecha_var.getvalue()[0]
    print(f'SUCCESS! id={id_reporte}, fecha={fecha}')
except Exception as e:
    conn.rollback()
    print(f'Error: {type(e).__name__}: {e}')
    import traceback
    traceback.print_exc()
finally:
    cursor.close()
    release_connection(conn, 'admin')
