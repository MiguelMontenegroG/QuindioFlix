# QuindioFlix

Plataforma de streaming colombiana -- Proyecto Final Bases de Datos II

Universidad del Quindio

## Stack tecnologico

| Componente    | Tecnologia                                      |
|---------------|-------------------------------------------------|
| Backend       | FastAPI (Python 3.11+)                          |
| Frontend      | Next.js 16 + React 19 + TypeScript              |
| Base de datos | Oracle 19c                                      |
| UI            | Radix UI + Tailwind CSS 4 + shadcn/ui           |
| Graficos      | Recharts 2.15.0                                 |
| Autenticacion | JWT (python-jose) + bcrypt (passlib)            |

## Estructura del proyecto

```
QuindioFlix/
+-- sql/                          # Scripts SQL de base de datos
|   +-- 01_create_tables.sql      # 18 tablas, 14 secuencias, comentarios
|   +-- 02_insert_data.sql        # Datos de prueba (40+ usuarios, 200+ reproducciones)
|   +-- 03_admin_setup.sql        # Configuracion de administrador inicial
|   +-- 03_cursores.sql           # Cursores CUR_USUARIOS_MOROSOS y CUR_POPULARIDAD
|   +-- 03_nucleo1_consultas.sql  # PIVOT, ROLLUP, CUBE, vistas materializadas, particiones
|   +-- 04_funciones_procedimientos.sql  # SPs, funciones, PKG_EXCEPCIONES
|   +-- 05_triggers_excepciones.sql      # 7 triggers, tabla AUDITORIA_QUINDIOFLIX
|   +-- 06_transacciones_concurrencia.sql # TXN-1, TXN-2, TXN-3, concurrencia
|   +-- 07_indices.sql           # 5 indices con EXPLAIN PLAN antes/despues
|   +-- 08_usuarios_roles.sql    # 4 roles, 4 usuarios Oracle, 2 profiles
|   +-- 09_usuarios_auth.sql     # Tabla USUARIOS_AUTH para login
+-- backend/                      # API REST FastAPI
|   +-- main.py                   # Punto de entrada
|   +-- config.py                 # Configuracion desde variables de entorno
|   +-- database.py               # Pool de conexiones por rol
|   +-- auth.py                   # JWT y hashing de contrasenas
|   +-- dependencies.py           # Inyeccion de dependencias (roles)
|   +-- oracle_errors.py          # Manejador centralizado de errores Oracle
|   +-- routers/                  # 14 routers (auth, contenido, pagos, admin, dba...)
|   +-- services/                 # Logica de negocio (auth, contenido, planes...)
|   +-- schemas/                  # Modelos Pydantic
|   +-- tests/                    # Pruebas unitarias
+-- frontend/                     # Aplicacion Next.js 16
|   +-- app/                      # 25+ rutas de usuario y admin
|   +-- components/               # UI components (shadcn/ui, Radix)
|   +-- lib/                      # API client, tipos, auth, validaciones
|   +-- hooks/                    # Custom hooks (contenido, reproduccion, perfil)
+-- scripts/                      # Scripts auxiliares
|   +-- ejecutar.bat              # Inicio rapido del frontend
+-- .gitignore
+-- README.md
```

## Requisitos previos

- Oracle Database 19c (XE para desarrollo) corriendo en `localhost:1521/BD`
- Python 3.11+
- Node.js 18+
- SQL*Plus o SQL Developer para ejecutar los scripts SQL

## Instalacion

### 1. Base de datos

Ejecutar los scripts en orden desde SQL*Plus conectado como SYSDBA o SYSTEM:

```sql
CONNECT system/clave@XE
@sql/01_create_tables.sql       -- Crear tablas y secuencias
@sql/02_insert_data.sql         -- Poblar datos de prueba (40 contenidos, 41 usuarios)
@sql/02b_insert_complement.sql  -- Datos complementarios (200+ reproducciones, 80 pagos)
@sql/03a_admin_setup.sql        -- Crear usuario admin inicial (admin@quindioflix.com)
@sql/03b_cursores.sql           -- Cursores CUR_USUARIOS_MOROSOS y CUR_POPULARIDAD
@sql/03c_nucleo1_consultas.sql  -- PIVOT, ROLLUP, CUBE, GROUPING SETS, vistas materializadas, particionamiento
@sql/04_funciones_procedimientos.sql  -- SPs, funciones, PKG_EXCEPCIONES
@sql/05_triggers_excepciones.sql      -- Triggers y tabla de auditoria
@sql/06_transacciones_concurrencia.sql -- Transacciones con concurrencia y bloqueos
@sql/07_indices.sql             -- Indices con EXPLAIN PLAN antes/despues
@sql/08_usuarios_roles.sql      -- Roles y usuarios Oracle
@sql/09_usuarios_auth.sql       -- Tabla de autenticacion
```

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
pip install -r requirements.txt
copy .env.example .env      # Personalizar con datos de conexion
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicacion estara disponible en `http://localhost:3000` y la API en `http://localhost:8000/docs`.

## Variables de entorno

Crear `backend/.env` con las siguientes variables (ver `.env.example` para valores de ejemplo):

| Variable             | Descripcion                           | Default                    |
|----------------------|---------------------------------------|----------------------------|
| DB_USER              | Usuario Oracle del esquema            | C##quindioflix             |
| DB_PASS              | Contrasena Oracle                     | (obligatorio)              |
| DB_DSN               | Cadena de conexion Oracle             | localhost:1521/BD          |
| DB_SCHEMA            | Esquema de Oracle                     | QUINDIOFLIX                |
| SECRET_KEY           | Clave secreta para JWT                | (cambiar en produccion)    |
| ALGORITHM            | Algoritmo JWT                         | HS256                      |
| ACCESS_TOKEN_EXPIRE_MINUTES | Duracion del token JWT         | 1440                       |
| CORS_ORIGINS         | Origenes permitidos por CORS          | http://localhost:3000      |

## Credenciales de prueba

### Administrador de la plataforma

- Email: `admin@quindioflix.com`
- Password: `Admin123!`

### Usuarios Oracle (seguridad a nivel BD)

| Usuario        | Password                       | Rol            |
|----------------|--------------------------------|----------------|
| qf_admin       | QuindioFlix_Admin_2024#        | ROL_ADMIN      |
| qf_analista    | QuindioFlix_Analista_2024#     | ROL_ANALISTA   |
| qf_soporte     | QuindioFlix_Soporte_2024#      | ROL_SOPORTE    |
| qf_contenido   | QuindioFlix_Contenido_2024#    | ROL_CONTENIDO  |

### Usuarios de prueba en la BD

Existen 41 usuarios en la tabla USUARIOS con datos reales distribuidos entre Bogota, Medellin, Cali y Armenia, con planes Basico, Estandar y Premium. Algunos con estado INACTIVO para probar mora y reactivacion.

## Funcionalidades principales

### Catalogo de contenido
- 40 titulos entre peliculas, series, documentales, musica y podcasts
- 10 generos (Accion, Comedia, Drama, Suspenso, Romance, Ciencia Ficcion, Terror, Infantil, Documental, Musical)
- Contenido original QuindioFlix y licenciado
- Clasificaciones por edad (Todo Publico, +7, +13, +16, +18)

### Perfiles y usuarios
- Multiples perfiles por cuenta (ADULTO e INFANTIL)
- Perfiles INFANTIL con restriccion automatica de contenido +13, +16 y +18
- Maximo 5 perfiles por cuenta (controlado por trigger TRG_LIMITE_PERFILES)
- Estado de cuenta ACTIVO/INACTIVO/SUSPENDIDO
- Sistema de referidos con descuentos acumulables (hasta 30% - RN-09)

### Suscripcion y pagos
- 3 planes: Basico ($14.900/mes, 1 dispositivo, SD), Estandar ($24.900/mes, 2 disp, HD), Premium ($34.900/mes, 4 disp, 4K)
- Metodos de pago: Nequi, Daviplata, PSE, Tarjeta de Credito, Efecty
- Renovacion automatica mensual con deteccion de mora (SP_RENOVACION_MENSUAL)
- Desactivacion de cuenta por mora superior a 30 dias (RN-04)

### Reglas de negocio implementadas (14 RN)
- RN-01: Email unico por usuario
- RN-02: Maximo 5 perfiles por cuenta (TRG_LIMITE_PERFILES)
- RN-03: Perfil INFANTIL solo ve contenido apto para su edad (TRG_VALIDA_REPRODUCCION)
- RN-04: Cuenta INACTIVA si no paga por mas de 30 dias
- RN-05: Calificacion solo entre 1 y 5 estrellas (TRG_VALIDA_CALIFICACION)
- RN-06: Solo 1 calificacion por usuario por contenido
- RN-07: Contenido +18 no visible para menores
- RN-08: Descuento por referido (5% por referido, max 30%)
- RN-09: Descuento maximo acumulado 30%
- RN-10: Supervisor debe pertenecer al mismo departamento (TRG_SUPERVISOR_MISMO_DEPTO)
- RN-11: Jefe debe pertenecer al mismo departamento (TRG_JEFE_MISMO_DEPTO)
- RN-12: Cambio de plan registrado en auditoria (TRG_LOG_CAMBIO_PLAN)
- RN-13: Pago registrado en auditoria (TRG_AUDITORIA_PAGOS)
- RN-14: Cuenta eliminada no puede tener pagos pendientes

### Procesos almacenados (6 SPs + 2 FN)
- SP_REGISTRAR_USUARIO_COMPLETO: Registra usuario + perfil + pago inicial en una transaccion
- SP_CAMBIAR_PLAN: Cambia plan y registra diferencia de pago
- SP_REPORTE_CONSUMO: Reporte detallado de reproducciones por periodo
- SP_RENOVACION_MENSUAL: Renovacion masiva con SAVEPOINT y SKIP LOCKED (TXN-2)
- SP_ELIMINAR_CUENTA: Eliminacion con FOR UPDATE NOWAIT y validaciones (TXN-3)
- FN_CALCULAR_MONTO: Calcula monto a pagar aplicando descuentos por referidos
- FN_CONTENIDO_RECOMENDADO: Contenido recomendado basado en historial del perfil

### Transacciones con concurrencia (3 TXN)
- TXN-1: SP_REGISTRAR_USUARIO_COMPLETO con manejo completo de errores
- TXN-2: SP_RENOVACION_MENSUAL con SAVEPOINT por cada usuario y FOR UPDATE SKIP LOCKED
- TXN-3: SP_ELIMINAR_CUENTA con FOR UPDATE NOWAIT y bloqueo pesimista

### Excepciones personalizadas (PKG_EXCEPCIONES)
- E_USUARIO_NO_ENCONTRADO, E_PLAN_NO_ENCONTRADO, E_PERFIL_MAXIMO, E_EDAD_NO_PERMITIDA
- E_CONTENIDO_NO_DISPONIBLE, E_PAGO_FALLIDO

### Indices y rendimiento (5 indices)
- IX_REPROD_PERFIL_FECHA: Historial de reproduccion (costo 8 a 2)
- IX_USUARIOS_EMAIL: Login por email (unico)
- IX_CONT_CAT_ANIO: Catalogo por categoria y anio
- IX_PAGOS_USUARIO_ESTADO: Pagos por usuario y estado (costo 4 a 1)
- IX_CALIFIC_CONT: Calificaciones por contenido
- Reduccion total de costo: 28 a 12 (57%)

### Seguridad por roles Oracle (4 roles, 4 usuarios, 2 profiles)
- ROL_ADMIN / qf_admin: CRUD completo en todas las tablas
- ROL_ANALISTA / qf_analista: Solo SELECT + reportes
- ROL_SOPORTE / qf_soporte: Datos de usuario y pagos (sin contenido ni auditoria)
- ROL_CONTENIDO / qf_contenido: Gestion de catalogo (sin datos financieros ni usuarios)
- PROF_ADMIN: 3 intentos fallidos, 60 dias password, 2 sesiones max
- PROF_APLICACION: 5 intentos, 90 dias password, 3 sesiones max, timeout 30min

### Triggers (7)
- TRG_VALIDA_REPRODUCCION: Valida edad contenido vs tipo perfil
- TRG_VALIDA_CALIFICACION: Valida rango 1-5 estrellas
- TRG_LIMITE_PERFILES: Maximo 5 perfiles por cuenta
- TRG_AUDITORIA_PAGOS: Registra cambios en pagos
- TRG_SUPERVISOR_MISMO_DEPTO: Supervisor en mismo departamento
- TRG_JEFE_MISMO_DEPTO: Jefe en mismo departamento
- TRG_LOG_CAMBIO_PLAN: Auditoria de cambios de plan

### Frontend (Next.js 16 + React 19)
- Autenticacion con JWT y manejo de perfiles
- Catalogo con busqueda, filtros por categoria y genero
- Reproductor de video con control de progreso
- Administracion: catalogo, usuarios, pagos, empleados, reportes, roles
- Panel DBA: EXPLAIN PLAN, transacciones activas, tablespaces, consultas SQL
- Monitoreo SSE en tiempo real
- Dashboard de analitica con KPIs, graficos Recharts
- Panel de moderacion de reportes de contenido