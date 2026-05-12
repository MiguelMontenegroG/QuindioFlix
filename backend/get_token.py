"""
Script para obtener un token JWT de administrador.

Uso:
    python get_token.py                          # Usa credenciales por defecto
    python get_token.py --email algo@correo.com --password mi_pass

Requiere: pip install requests
"""

import sys
import json
try:
    import requests
except ImportError:
    print("Error: Se necesita requests. Instalalo con: pip install requests")
    sys.exit(1)

API_URL = "http://localhost:8000"


def obtener_token(email="admin@quindioflix.com", password="Admin123!"):
    """Obtiene token JWT haciendo login."""
    try:
        resp = requests.post(
            f"{API_URL}/auth/login",
            json={"email": email, "password": password},
            timeout=10
        )
        
        if resp.status_code == 200:
            data = resp.json()
            return data["token"], data["usuario"], data["perfiles"]
        elif resp.status_code == 401:
            print(f"Credenciales invalidas para {email}")
            return None, None, None
        else:
            print(f"Error {resp.status_code}: {resp.text}")
            return None, None, None
    except requests.ConnectionError:
        print(f"No se pudo conectar a {API_URL}. Verifica que el backend este corriendo.")
        return None, None, None
    except Exception as e:
        print(f"Error inesperado: {e}")
        return None, None, None


def probar_token(token):
    """Prueba el token contra el endpoint /dba/query."""
    try:
        resp = requests.post(
            f"{API_URL}/dba/query",
            json={"query": "SELECT table_name FROM user_tables ORDER BY table_name"},
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            print("Token VALIDO - Consulta exitosa!")
            print(f"Tablas encontradas: {len(data['rows'])}")
            for row in data["rows"]:
                print(f"  - {row['TABLE_NAME']}")
            return True
        else:
            print(f"Token INVALIDO - Error {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        print(f"Error al probar token: {e}")
        return False


def main():
    email = "admin@quindioflix.com"
    password = "Admin123!"
    
    # Parsear argumentos
    args = sys.argv[1:]
    for i, arg in enumerate(args):
        if arg == "--email" and i + 1 < len(args):
            email = args[i + 1]
        elif arg == "--password" and i + 1 < len(args):
            password = args[i + 1]
    
    print(f"Obteniendo token para {email}...")
    print()
    
    token, usuario, perfiles = obtener_token(email, password)
    
    if not token:
        print("No se pudo obtener el token.")
        sys.exit(1)
    
    print("==========================================")
    print("TOKEN JWT DE ADMINISTRADOR")
    print("==========================================")
    print()
    print(token)
    print()
    print("==========================================")
    print()
    print(f"Usuario: {usuario['nombre']} (ID: {usuario['id_usuario']})")
    print(f"Email: {usuario['email']}")
    print(f"Es admin: {usuario['es_admin']}")
    print(f"Perfiles: {', '.join(p['nombre_perfil'] for p in perfiles)}")
    print()
    print("==========================================")
    print()
    print("Para usar en PowerShell:")
    print(f'$token = "{token}"')
    print()
    print("Para usar en curl:")
    print(f'curl -H "Authorization: Bearer {token}" http://localhost:8000/dba/query')
    print()
    
    # Probar automáticamente
    print("Probando token contra /dba/query...")
    probar_token(token)


if __name__ == "__main__":
    main()
