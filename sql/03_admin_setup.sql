-- ============================================
-- Script 03: Configuracion de administradores
-- ============================================
-- Agrega columna password_hash y es_admin a USUARIOS
-- Crea el usuario administrador inicial
-- EJECUTAR COMO: SYS o SYSTEM
-- ============================================

-- 1. Agregar columna password_hash si no existe
DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM user_tab_cols
    WHERE table_name = 'USUARIOS' AND column_name = 'PASSWORD_HASH';
    
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'ALTER TABLE USUARIOS ADD (password_hash VARCHAR2(255))';
        DBMS_OUTPUT.PUT_LINE('Columna password_hash agregada a USUARIOS');
    ELSE
        DBMS_OUTPUT.PUT_LINE('Columna password_hash ya existe');
    END IF;
END;
/

-- 2. Agregar columna es_admin si no existe
DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM user_tab_cols
    WHERE table_name = 'USUARIOS' AND column_name = 'ES_ADMIN';
    
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'ALTER TABLE USUARIOS ADD (es_admin CHAR(1) DEFAULT ''N'' NOT NULL)';
        EXECUTE IMMEDIATE 'ALTER TABLE USUARIOS ADD CONSTRAINT ck_usu_admin CHECK (es_admin IN (''S'', ''N''))';
        DBMS_OUTPUT.PUT_LINE('Columna es_admin agregada a USUARIOS');
    ELSE
        DBMS_OUTPUT.PUT_LINE('Columna es_admin ya existe');
    END IF;
END;
/

-- 3. Crear usuario administrador inicial
-- Email: admin@quindioflix.com / Password: Admin123!
DECLARE
    v_id_usuario NUMBER;
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM USUARIOS WHERE email = 'admin@quindioflix.com';
    
    IF v_count = 0 THEN
        v_id_usuario := seq_usuarios.NEXTVAL;
        
        INSERT INTO USUARIOS (
            id_usuario, nombre, email, telefono, fecha_nacimiento,
            ciudad, estado_cuenta, fecha_registro, id_plan,
            password_hash, es_admin
        ) VALUES (
            v_id_usuario, 'Administrador QuindioFlix', 'admin@quindioflix.com',
            '3000000000', DATE '1990-01-01', 'Armenia',
            'ACTIVO', SYSDATE, 1,
            '$2b$12$LJ3m4ys3Lk0TSwHnbfOMqOyMvOKzQBnK7YPMGEqGqKqL0FYKhXqWa',
            'S'
        );
        
        INSERT INTO PERFILES (id_perfil, id_usuario, nombre_perfil, avatar, tipo)
        VALUES (seq_perfiles.NEXTVAL, v_id_usuario, 'Admin', 'admin.png', 'ADULTO');
        
        DBMS_OUTPUT.PUT_LINE('Admin creado: admin@quindioflix.com / Admin123!');
    ELSE
        DBMS_OUTPUT.PUT_LINE('El admin ya existe');
    END IF;
    
    COMMIT;
END;
/

-- 4. Verificar
SELECT id_usuario, nombre, email, es_admin 
FROM USUARIOS 
WHERE es_admin = 'S';

COMMIT;
