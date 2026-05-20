# QuindioFlix Backend (FastAPI + Oracle)

## Cambios realizados
- Pooles Oracle por rol (admin/analista/soporte/contenido) y helper de esquema.
- Manejo centralizado de errores Oracle a HTTP.
- Autenticacion con `USUARIOS_AUTH` y SPs oficiales; JWT con roles.
- Rutas reorganizadas (perfiles, favoritos, calificaciones) y endpoints faltantes.
- Servicios de contenido/pagos/reproducciones/usuarios alineados a SPs/funciones.
- Paginacion con OFFSET/FETCH y lectura de CLOBs.
- Script SQL `sql/09_usuarios_auth.sql` para tabla auxiliar.
- README, pruebas basicas y dependencias actualizadas.

## Requisitos
- Python 3.11+
- Oracle 19c accesible

## Configuracion
Crea `backend/.env` con valores similares a:

```
DB_DSN=localhost:1521/XEPDB1
DB_SCHEMA=QUINDIOFLIX
DB_USER_ADMIN=qf_admin
DB_PASS_ADMIN=... 
DB_USER_ANALISTA=qf_analista
DB_PASS_ANALISTA=...
DB_USER_SOPORTE=qf_soporte
DB_PASS_SOPORTE=...
DB_USER_CONTENIDO=qf_contenido
DB_PASS_CONTENIDO=...
SECRET_KEY=cambia_esto
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:3000
```

Si no existe la tabla auxiliar de credenciales, ejecuta `sql/09_usuarios_auth.sql` en el esquema `QUINDIOFLIX`.

## Ejecutar
```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

## Pruebas
```
pytest backend\tests\test_auth_utils.py
```
