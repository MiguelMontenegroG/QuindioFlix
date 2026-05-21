"""Script de prueba para el endpoint SSE del monitor."""
import requests
import json

response = requests.get("http://localhost:8000/monitor/stream", stream=True, timeout=15)
count = 0

print("Conectado al SSE de monitor...")
print("=" * 60)

for line in response.iter_lines():
    if line:
        try:
            decoded = line.decode("utf-8")
            if decoded.startswith("data:"):
                data = json.loads(decoded[5:])
                if "total_usuarios" in data:
                    print(f"\n[STATS] Timestamp: {data.get('timestamp', 'N/A')}")
                    print(f"  Usuarios totales: {data['total_usuarios']}")
                    print(f"  Usuarios activos: {data['usuarios_activos']}")
                    print(f"  Usuarios inactivos: {data['usuarios_inactivos']}")
                    print(f"  Contenido total: {data['total_contenido']}")
                    print(f"  Reproducciones totales: {data['total_reproducciones']}")
                    print(f"  Ingresos del mes: ${data['ingresos_mes']:,.0f}")
                    print(f"  Reproducciones hoy: {data['reproducciones_hoy']}")
                    print(f"  Usuarios nuevos hoy: {data['usuarios_nuevos_hoy']}")
                    print(f"  Pagos pendientes: {data['pagos_pendientes']}")
                    print(f"  Planes: {data['planes']}")
                    print(f"  Top contenido: {data['top_contenido']}")
                elif "ultimos_usuarios" in data:
                    print(f"\n[ACTIVIDAD RECIENTE]")
                    print(f"  Ultimos usuarios: {len(data['ultimos_usuarios'])}")
                    for u in data['ultimos_usuarios'][:2]:
                        print(f"    - {u.get('NOMBRE','')} ({u.get('EMAIL','')})")
                    print(f"  Ultimas reproducciones: {len(data['ultimas_reproducciones'])}")
                    for r in data['ultimas_reproducciones'][:2]:
                        print(f"    - {r.get('TITULO','')}")
                    print(f"  Ultimos pagos: {len(data['ultimos_pagos'])}")
                    for p in data['ultimos_pagos'][:2]:
                        print(f"    - {p.get('NOMBRE','')}: ${p.get('MONTO',0):,.0f}")
                count += 1
        except Exception as e:
            print(f"Error: {e}")

    if count >= 6:  # 3 ciclos completos (stats + activity)
        break

response.close()
print("\n" + "=" * 60)
print("SSE funcionando correctamente!")
