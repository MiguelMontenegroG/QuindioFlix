import importlib
import sys

# Force reimport
if "backend.routers.reportes_mod" in sys.modules:
    del sys.modules["backend.routers.reportes_mod"]
if "backend.routers" in sys.modules:
    del sys.modules["backend.routers"]

from backend.schemas.reporte import ReporteCreate
from backend.routers.reportes_mod import crear_reporte

data = ReporteCreate(id_perfil_reportador=4, id_contenido=1, motivo="test_final_v3")
try:
    result = crear_reporte(data)
    print(f"SUCCESS! Reporte ID: {result.id_reporte}")
    print(f"Fecha: {result.fecha_reporte}")
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
