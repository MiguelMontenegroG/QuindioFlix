-- ============================================================
-- Consultas de ejemplo para verificar datos en QuindioFlix
-- Ejecutar con: python query_db.py -f consultas_ejemplo.sql
-- ============================================================

-- 1. Ver todas las tablas del esquema
SELECT table_name FROM user_tables ORDER BY table_name;

-- 2. Usuarios activos con su plan
SELECT u.id_usuario, u.nombre, u.email, u.estado_cuenta, p.nombre_plan
FROM usuarios u
JOIN planes p ON p.id_plan = u.id_plan
WHERE u.estado_cuenta = 'ACTIVO'
ORDER BY u.nombre;

-- 3. Contenido disponible (peliculas y series)
SELECT c.id_contenido, c.titulo, cat.nombre_categoria, c.anio_lanzamiento, c.clasificacion_edad
FROM contenido c
JOIN categorias cat ON cat.id_categoria = c.id_categoria
ORDER BY c.anio_lanzamiento DESC;

-- 4. Empleados por departamento
SELECT d.nombre_depto, COUNT(*) as total_empleados
FROM empleados e
JOIN departamentos d ON d.id_departamento = e.id_departamento
GROUP BY d.nombre_depto
ORDER BY total_empleados DESC;

-- 5. Top 5 contenido mas visto (por reproducciones)
SELECT c.titulo, COUNT(r.id_reproduccion) as total_reproducciones
FROM contenido c
LEFT JOIN reproducciones r ON r.id_contenido = c.id_contenido
GROUP BY c.titulo
ORDER BY total_reproducciones DESC
FETCH FIRST 5 ROWS ONLY;

-- 6. Pagos recientes
SELECT p.id_pago, u.nombre, p.monto, p.fecha_pago, p.estado_pago, p.metodo_pago
FROM pagos p
JOIN usuarios u ON u.id_usuario = p.id_usuario
ORDER BY p.fecha_pago DESC
FETCH FIRST 10 ROWS ONLY;

-- 7. Reportes de moderacion pendientes
SELECT r.id_reporte, c.titulo, r.motivo, r.fecha_reporte
FROM reportes r
JOIN contenido c ON c.id_contenido = r.id_contenido
WHERE r.estado_reporte = 'PENDIENTE'
ORDER BY r.fecha_reporte;

-- 8. Perfiles por usuario
SELECT u.nombre, COUNT(p.id_perfil) as total_perfiles
FROM usuarios u
LEFT JOIN perfiles p ON p.id_usuario = u.id_usuario
GROUP BY u.nombre
ORDER BY total_perfiles DESC;

-- 9. Planes y sus precios
SELECT p.id_plan, p.nombre_plan, p.precio_mensual, p.num_pantallas, p.calidad_video
FROM planes p
ORDER BY p.precio_mensual;

-- 10. Ver estructura de una tabla especifica (cambiar NOMBRE_TABLA)
-- DESCRIBE NOMBRE_TABLA
