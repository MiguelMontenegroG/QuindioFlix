SET SERVEROUTPUT ON SIZE UNLIMITED;

-- EXCEPCIONES PERSONALIZADAS (declaradas como objetos del esquema para ser

-- EX-01: Email ya registrado en la plataforma
CREATE OR REPLACE PACKAGE PKG_EXCEPCIONES AS
    -- Registro
    EX_EMAIL_DUPLICADO      EXCEPTION;
    PRAGMA EXCEPTION_INIT(EX_EMAIL_DUPLICADO,      -20001);

    -- Plan / perfiles
    EX_PERFILES_EXCEDEN     EXCEPTION;
    PRAGMA EXCEPTION_INIT(EX_PERFILES_EXCEDEN,     -20002);

    -- Reproducción / calificación
    EX_CUENTA_INACTIVA      EXCEPTION;
    PRAGMA EXCEPTION_INIT(EX_CUENTA_INACTIVA,      -20003);

    EX_UMBRAL_INSUFICIENTE  EXCEPTION;
    PRAGMA EXCEPTION_INIT(EX_UMBRAL_INSUFICIENTE,  -20004);

    -- Parámetros inválidos
    EX_PARAMETRO_INVALIDO   EXCEPTION;
    PRAGMA EXCEPTION_INIT(EX_PARAMETRO_INVALIDO,   -20005);

    -- Plan no existe
    EX_PLAN_NO_EXISTE       EXCEPTION;
    PRAGMA EXCEPTION_INIT(EX_PLAN_NO_EXISTE,       -20006);
END PKG_EXCEPCIONES;
/


-- FUNCIÓN 1: FN_CALCULAR_MONTO
--  Descuento por referido activo (15 %)        → RN-06
--  Descuento por antigüedad 12-23 meses (10 %) → RN-11
--  Descuento por antigüedad ≥ 24 meses  (15 %) → RN-11
--  Los descuentos son acumulables; el resultado nunca es negativo.

CREATE OR REPLACE FUNCTION FN_CALCULAR_MONTO (
    p_id_usuario IN NUMBER
) RETURN NUMBER IS

    v_precio_base      PLANES.precio_mensual%TYPE;
    v_meses_antiguedad NUMBER;
    v_tiene_referido   NUMBER;
    v_desc_antiguedad  NUMBER := 0;
    v_desc_referido    NUMBER := 0;
    v_monto_final      NUMBER;

BEGIN
    -- Validar parámetro
    IF p_id_usuario IS NULL OR p_id_usuario <= 0 THEN
        RAISE_APPLICATION_ERROR(-20005, 'FN_CALCULAR_MONTO: id_usuario inválido.');
    END IF;

    -- 1) Obtener precio del plan actual
    SELECT p.precio_mensual
    INTO   v_precio_base
    FROM   USUARIOS u
    JOIN   PLANES   p ON p.id_plan = u.id_plan
    WHERE  u.id_usuario = p_id_usuario;

    -- 2) Calcular antigüedad en meses completos
    SELECT FLOOR(MONTHS_BETWEEN(SYSDATE, u.fecha_registro))
    INTO   v_meses_antiguedad
    FROM   USUARIOS u
    WHERE  u.id_usuario = p_id_usuario;

    -- 3) Descuento por antigüedad (RN-11)
    IF    v_meses_antiguedad >= 24 THEN v_desc_antiguedad := 0.15;
    ELSIF v_meses_antiguedad >= 12 THEN v_desc_antiguedad := 0.10;
    END IF;

    -- 4) Descuento por referido activo (RN-06)
    -- El usuario tiene al menos un referido con cuenta ACTIVA y pago exitoso vigente
    SELECT COUNT(*)
    INTO   v_tiene_referido
    FROM   USUARIOS referido
    WHERE  referido.id_referidor  = p_id_usuario
    AND    referido.estado_cuenta = 'ACTIVO'
    AND    EXISTS (
               SELECT 1
               FROM   PAGOS pg
               WHERE  pg.id_usuario   = referido.id_usuario
               AND    pg.estado_pago  = 'EXITOSO'
               AND    pg.fecha_vencimiento >= SYSDATE
           );

    IF v_tiene_referido > 0 THEN
        v_desc_referido := 0.15;
    END IF;

    -- 5) Aplicar descuentos (acumulables, máximo 30 %)
    v_monto_final := ROUND(
        v_precio_base * (1 - LEAST(v_desc_antiguedad + v_desc_referido, 0.30)),
        2
    );

    RETURN v_monto_final;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20005,
            'FN_CALCULAR_MONTO: usuario ' || p_id_usuario || ' no encontrado.');
    WHEN OTHERS THEN
        RAISE;
END FN_CALCULAR_MONTO;
/

-- FUNCIÓN 2: FN_CONTENIDO_RECOMENDADO

CREATE OR REPLACE FUNCTION FN_CONTENIDO_RECOMENDADO (
    p_id_perfil IN NUMBER
) RETURN NUMBER IS

    v_tipo_perfil   PERFILES.tipo%TYPE;
    v_id_recomend   NUMBER := -1;

BEGIN
    -- Validar parámetro
    IF p_id_perfil IS NULL OR p_id_perfil <= 0 THEN
        RAISE_APPLICATION_ERROR(-20005,
            'FN_CONTENIDO_RECOMENDADO: id_perfil inválido.');
    END IF;

    -- Obtener tipo de perfil (ADULTO / INFANTIL)
    SELECT tipo
    INTO   v_tipo_perfil
    FROM   PERFILES
    WHERE  id_perfil = p_id_perfil;

    -- Elegir el contenido más reproducido por otros perfiles,
    -- compatible con la clasificación de edad del perfil,
    -- que el perfil aún no haya visto.
    SELECT id_contenido
    INTO   v_id_recomend
    FROM (
        SELECT  c.id_contenido,
                COUNT(r.id_reproduccion) AS cnt
        FROM    CONTENIDO c
        JOIN    REPRODUCCIONES r ON r.id_contenido = c.id_contenido
        WHERE   r.id_perfil <> p_id_perfil
        AND     c.id_contenido NOT IN (
                    SELECT id_contenido
                    FROM   REPRODUCCIONES
                    WHERE  id_perfil = p_id_perfil
                )
        AND (   -- filtro de clasificación de edad (RN-03)
                v_tipo_perfil = 'ADULTO'
                OR c.clasificacion_edad IN ('TP', '+7', '+13')
            )
        GROUP BY c.id_contenido
        ORDER BY cnt DESC
    )
    WHERE ROWNUM = 1;

    RETURN v_id_recomend;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        -- No existe el perfil, o no hay contenido disponible
        RETURN -1;
    WHEN OTHERS THEN
        RAISE;
END FN_CONTENIDO_RECOMENDADO;
/


-- PROCEDIMIENTO 1: SP_REGISTRAR_USUARIO
-- Parámetros:
--   p_nombre        IN  – nombre completo
--   p_email         IN  – email único
--   p_telefono      IN  – teléfono
--   p_fnac          IN  – fecha de nacimiento
--   p_ciudad        IN  – ciudad de residencia
--   p_id_plan       IN  – plan elegido (1=Básico, 2=Estándar, 3=Premium)
--   p_id_referidor  IN  – id del usuario que refirió (NULL si ninguno)
--   p_metodo_pago   IN  – metodo del primer pago
--   p_id_usuario    OUT – id generado para el nuevo usuario

CREATE OR REPLACE PROCEDURE SP_REGISTRAR_USUARIO (
    p_nombre       IN  USUARIOS.nombre%TYPE,
    p_email        IN  USUARIOS.email%TYPE,
    p_telefono     IN  USUARIOS.telefono%TYPE,
    p_fnac         IN  USUARIOS.fecha_nacimiento%TYPE,
    p_ciudad       IN  USUARIOS.ciudad%TYPE,
    p_id_plan      IN  USUARIOS.id_plan%TYPE,
    p_id_referidor IN  USUARIOS.id_referidor%TYPE DEFAULT NULL,
    p_metodo_pago  IN  PAGOS.metodo_pago%TYPE     DEFAULT 'PSE',
    p_id_usuario   OUT USUARIOS.id_usuario%TYPE
) IS

    v_email_existe  NUMBER;
    v_plan_existe   NUMBER;
    v_ref_activo    NUMBER;
    v_monto_base    PLANES.precio_mensual%TYPE;
    v_monto_pago    NUMBER;
    v_nuevo_id      NUMBER;

BEGIN
    -- Validaciones previas

    -- 1. Parámetros obligatorios no nulos
    IF p_nombre IS NULL OR p_email IS NULL OR p_telefono IS NULL
       OR p_fnac IS NULL OR p_ciudad IS NULL THEN
        RAISE_APPLICATION_ERROR(-20005,
            'SP_REGISTRAR_USUARIO: todos los campos obligatorios deben tener valor.');
    END IF;

    -- 2. Email duplicado (RN implicita)
    SELECT COUNT(*) INTO v_email_existe
    FROM   USUARIOS WHERE email = LOWER(TRIM(p_email));

    IF v_email_existe > 0 THEN
        RAISE_APPLICATION_ERROR(-20001,
            'SP_REGISTRAR_USUARIO: el email "' || p_email || '" ya está registrado.');
    END IF;

    -- 3. Plan existe
    SELECT COUNT(*) INTO v_plan_existe
    FROM   PLANES WHERE id_plan = p_id_plan;

    IF v_plan_existe = 0 THEN
        RAISE_APPLICATION_ERROR(-20006,
            'SP_REGISTRAR_USUARIO: el plan ' || p_id_plan || ' no existe.');
    END IF;

    -- 4. Referidor activo (si se proveyó)
    IF p_id_referidor IS NOT NULL THEN
        SELECT COUNT(*) INTO v_ref_activo
        FROM   USUARIOS
        WHERE  id_usuario    = p_id_referidor
        AND    estado_cuenta = 'ACTIVO';

        IF v_ref_activo = 0 THEN
            RAISE_APPLICATION_ERROR(-20005,
                'SP_REGISTRAR_USUARIO: el referidor ' || p_id_referidor
                || ' no existe o está inactivo.');
        END IF;
    END IF;

    -- Insertar usuario

    SELECT seq_usuarios.NEXTVAL INTO v_nuevo_id FROM DUAL;

    INSERT INTO USUARIOS (
        id_usuario, nombre, email, telefono,
        fecha_nacimiento, ciudad, estado_cuenta,
        fecha_registro, id_plan, id_referidor
    ) VALUES (
        v_nuevo_id,
        TRIM(p_nombre),
        LOWER(TRIM(p_email)),
        p_telefono,
        p_fnac,
        TRIM(p_ciudad),
        'ACTIVO',
        SYSDATE,
        p_id_plan,
        p_id_referidor
    );

    -- Crear perfil ADULTO por defecto

    INSERT INTO PERFILES (id_perfil, id_usuario, nombre_perfil, avatar, tipo)
    VALUES (seq_perfiles.NEXTVAL, v_nuevo_id,
            SUBSTR(TRIM(p_nombre), 1, 50), 'default.png', 'ADULTO');

    -- Calcular primer pago

    SELECT precio_mensual INTO v_monto_base
    FROM   PLANES WHERE id_plan = p_id_plan;

    IF p_id_referidor IS NOT NULL THEN
        -- Descuento del 15 % para el nuevo usuario (RN-07)
        v_monto_pago := ROUND(v_monto_base * 0.85, 2);
    ELSE
        v_monto_pago := v_monto_base;
    END IF;

    INSERT INTO PAGOS (
        id_pago, id_usuario, fecha_pago, monto,
        metodo_pago, estado_pago, fecha_vencimiento
    ) VALUES (
        seq_pagos.NEXTVAL,
        v_nuevo_id,
        SYSDATE,
        v_monto_pago,
        p_metodo_pago,
        'PENDIENTE',
        ADD_MONTHS(SYSDATE, 1)
    );

    -- Beneficio para el referidor (15 % descuento próximo mes)
    -- Se crea un pago con monto reducido con vigencia el mes siguiente
    -- al corriente del referidor.
    IF p_id_referidor IS NOT NULL THEN
        DECLARE
            v_monto_ref    PLANES.precio_mensual%TYPE;
            v_prox_venc    DATE;
        BEGIN
            -- Precio del plan del referidor
            SELECT pl.precio_mensual INTO v_monto_ref
            FROM   USUARIOS u JOIN PLANES pl ON pl.id_plan = u.id_plan
            WHERE  u.id_usuario = p_id_referidor;

            -- Próximo vencimiento del referidor
            SELECT NVL(MAX(fecha_vencimiento), SYSDATE)
            INTO   v_prox_venc
            FROM   PAGOS
            WHERE  id_usuario  = p_id_referidor
            AND    estado_pago = 'EXITOSO';

            INSERT INTO PAGOS (
                id_pago, id_usuario, fecha_pago, monto,
                metodo_pago, estado_pago, fecha_vencimiento
            ) VALUES (
                seq_pagos.NEXTVAL,
                p_id_referidor,
                SYSDATE,
                ROUND(v_monto_ref * 0.85, 2),   -- 15 % descuento
                'PENDIENTE',
                ADD_MONTHS(v_prox_venc, 1)
            );
        END;
    END IF;

    -- Confirmar y retornar

    p_id_usuario := v_nuevo_id;
    COMMIT;

    DBMS_OUTPUT.PUT_LINE(
        'SP_REGISTRAR_USUARIO: usuario ' || v_nuevo_id
        || ' ("' || p_nombre || '") registrado exitosamente.'
        || CASE WHEN p_id_referidor IS NOT NULL
                THEN ' Referidor ' || p_id_referidor || ' bonificado.'
                ELSE '' END
    );

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('ERROR en SP_REGISTRAR_USUARIO: ' || SQLERRM);
        RAISE;
END SP_REGISTRAR_USUARIO;
/


-- PROCEDIMIENTO 2: SP_CAMBIAR_PLAN

CREATE OR REPLACE PROCEDURE SP_CAMBIAR_PLAN (
    p_id_usuario    IN USUARIOS.id_usuario%TYPE,
    p_id_plan_nuevo IN PLANES.id_plan%TYPE,
    p_metodo_pago   IN PAGOS.metodo_pago%TYPE DEFAULT 'PSE'
) IS

    v_plan_actual     PLANES%ROWTYPE;
    v_plan_nuevo      PLANES%ROWTYPE;
    v_num_perfiles    NUMBER;
    v_estado_cuenta   USUARIOS.estado_cuenta%TYPE;
    v_monto           NUMBER;

BEGIN
    -- Validaciones

    IF p_id_usuario IS NULL OR p_id_plan_nuevo IS NULL THEN
        RAISE_APPLICATION_ERROR(-20005,
            'SP_CAMBIAR_PLAN: parámetros no pueden ser nulos.');
    END IF;

    -- Estado de la cuenta
    SELECT estado_cuenta INTO v_estado_cuenta
    FROM   USUARIOS WHERE id_usuario = p_id_usuario;

    IF v_estado_cuenta = 'INACTIVO' THEN
        RAISE_APPLICATION_ERROR(-20003,
            'SP_CAMBIAR_PLAN: la cuenta del usuario ' || p_id_usuario
            || ' está INACTIVA. Regularice su pago primero.');
    END IF;

    -- Plan actual
    SELECT p.*
    INTO   v_plan_actual
    FROM   PLANES p
    JOIN   USUARIOS u ON u.id_plan = p.id_plan
    WHERE  u.id_usuario = p_id_usuario;

    -- Plan nuevo
    BEGIN
        SELECT * INTO v_plan_nuevo FROM PLANES WHERE id_plan = p_id_plan_nuevo;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20006,
                'SP_CAMBIAR_PLAN: el plan ' || p_id_plan_nuevo || ' no existe.');
    END;

    -- Mismo plan: no se hace nada
    IF v_plan_actual.id_plan = v_plan_nuevo.id_plan THEN
        DBMS_OUTPUT.PUT_LINE(
            'SP_CAMBIAR_PLAN: el usuario ya tiene el plan "'
            || v_plan_actual.nombre_plan || '". No se realizó ningún cambio.');
        RETURN;
    END IF;

    -- Si baja de plan: validar cantidad de perfiles (RN-10)
    IF v_plan_nuevo.precio_mensual < v_plan_actual.precio_mensual THEN
        SELECT COUNT(*) INTO v_num_perfiles
        FROM   PERFILES WHERE id_usuario = p_id_usuario;

        IF v_num_perfiles > v_plan_nuevo.max_perfiles THEN
            RAISE_APPLICATION_ERROR(-20002,
                'SP_CAMBIAR_PLAN: el usuario tiene ' || v_num_perfiles
                || ' perfiles pero el plan "' || v_plan_nuevo.nombre_plan
                || '" solo permite ' || v_plan_nuevo.max_perfiles
                || '. Elimine ' || (v_num_perfiles - v_plan_nuevo.max_perfiles)
                || ' perfil(es) antes de bajar de plan.');
        END IF;
    END IF;

    -- Actualizar plan

    UPDATE USUARIOS
    SET    id_plan = p_id_plan_nuevo
    WHERE  id_usuario = p_id_usuario;

    -- Calcular monto con descuentos usando la función
    v_monto := FN_CALCULAR_MONTO(p_id_usuario);

    -- Registrar nuevo ciclo de pago
    INSERT INTO PAGOS (
        id_pago, id_usuario, fecha_pago, monto,
        metodo_pago, estado_pago, fecha_vencimiento
    ) VALUES (
        seq_pagos.NEXTVAL,
        p_id_usuario,
        SYSDATE,
        v_monto,
        p_metodo_pago,
        'PENDIENTE',
        ADD_MONTHS(SYSDATE, 1)
    );

    COMMIT;

    DBMS_OUTPUT.PUT_LINE(
        'SP_CAMBIAR_PLAN: usuario ' || p_id_usuario
        || ' cambió de "' || v_plan_actual.nombre_plan
        || '" a "' || v_plan_nuevo.nombre_plan
        || '". Monto próximo ciclo: $' || TO_CHAR(v_monto, 'FM99,999,990.00')
    );

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20005,
            'SP_CAMBIAR_PLAN: usuario ' || p_id_usuario || ' no encontrado.');
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('ERROR en SP_CAMBIAR_PLAN: ' || SQLERRM);
        RAISE;
END SP_CAMBIAR_PLAN;
/

-- PROCEDIMIENTO 3: SP_REPORTE_CONSUMO

CREATE OR REPLACE PROCEDURE SP_REPORTE_CONSUMO (
    p_id_usuario IN USUARIOS.id_usuario%TYPE,
    p_mes        IN NUMBER DEFAULT NULL,
    p_anio       IN NUMBER DEFAULT NULL
) IS

    -- Variables de cabecera
    v_nombre       USUARIOS.nombre%TYPE;
    v_email        USUARIOS.email%TYPE;
    v_ciudad       USUARIOS.ciudad%TYPE;
    v_estado       USUARIOS.estado_cuenta%TYPE;
    v_plan         PLANES.nombre_plan%TYPE;
    v_registro     USUARIOS.fecha_registro%TYPE;

    -- Variables de métricas
    v_total_reprod     NUMBER := 0;
    v_horas_consumo    NUMBER := 0;
    v_num_perfiles     NUMBER := 0;
    v_num_calific      NUMBER := 0;
    v_prom_estrellas   NUMBER := 0;
    v_total_pagado     NUMBER := 0;

    -- Cursores internos
    CURSOR cur_perfiles IS
        SELECT nombre_perfil, tipo,
               COUNT(r.id_reproduccion)                          AS reprod,
               ROUND(SUM(
                   (CAST(r.fecha_hora_fin AS DATE) - CAST(r.fecha_hora_inicio AS DATE)) * 24
               ), 2)                                             AS horas
        FROM   PERFILES p
        LEFT JOIN REPRODUCCIONES r ON r.id_perfil = p.id_perfil
            AND (p_mes  IS NULL OR EXTRACT(MONTH FROM r.fecha_hora_inicio) = p_mes)
            AND (p_anio IS NULL OR EXTRACT(YEAR  FROM r.fecha_hora_inicio) = p_anio)
        WHERE  p.id_usuario = p_id_usuario
        GROUP BY nombre_perfil, tipo
        ORDER BY reprod DESC;

    CURSOR cur_top_generos IS
        SELECT g.nombre_genero, COUNT(*) AS cnt
        FROM   REPRODUCCIONES r
        JOIN   PERFILES       pf  ON pf.id_perfil   = r.id_perfil
        JOIN   CONTENIDO_GENERO cg ON cg.id_contenido = r.id_contenido
        JOIN   GENEROS         g   ON g.id_genero     = cg.id_genero
        WHERE  pf.id_usuario = p_id_usuario
        AND    (p_mes  IS NULL OR EXTRACT(MONTH FROM r.fecha_hora_inicio) = p_mes)
        AND    (p_anio IS NULL OR EXTRACT(YEAR  FROM r.fecha_hora_inicio) = p_anio)
        GROUP BY g.nombre_genero
        ORDER BY cnt DESC
        FETCH FIRST 5 ROWS ONLY;

    CURSOR cur_top_contenidos IS
        SELECT c.titulo, cat.nombre_categoria,
               COUNT(r.id_reproduccion) AS veces
        FROM   REPRODUCCIONES r
        JOIN   PERFILES       pf  ON pf.id_perfil   = r.id_perfil
        JOIN   CONTENIDO      c   ON c.id_contenido = r.id_contenido
        JOIN   CATEGORIAS     cat ON cat.id_categoria = c.id_categoria
        WHERE  pf.id_usuario = p_id_usuario
        AND    (p_mes  IS NULL OR EXTRACT(MONTH FROM r.fecha_hora_inicio) = p_mes)
        AND    (p_anio IS NULL OR EXTRACT(YEAR  FROM r.fecha_hora_inicio) = p_anio)
        GROUP BY c.titulo, cat.nombre_categoria
        ORDER BY veces DESC
        FETCH FIRST 5 ROWS ONLY;

    CURSOR cur_pagos IS
        SELECT fecha_pago, monto, metodo_pago, estado_pago, fecha_vencimiento
        FROM   PAGOS
        WHERE  id_usuario = p_id_usuario
        AND    (p_mes  IS NULL OR EXTRACT(MONTH FROM fecha_pago) = p_mes)
        AND    (p_anio IS NULL OR EXTRACT(YEAR  FROM fecha_pago) = p_anio)
        ORDER BY fecha_pago DESC;

    v_pf   cur_perfiles%ROWTYPE;
    v_gen  cur_top_generos%ROWTYPE;
    v_con  cur_top_contenidos%ROWTYPE;
    v_pago cur_pagos%ROWTYPE;

BEGIN
    -- Validar usuario
    BEGIN
        SELECT u.nombre, u.email, u.ciudad, u.estado_cuenta,
               p.nombre_plan, u.fecha_registro
        INTO   v_nombre, v_email, v_ciudad, v_estado, v_plan, v_registro
        FROM   USUARIOS u
        JOIN   PLANES   p ON p.id_plan = u.id_plan
        WHERE  u.id_usuario = p_id_usuario;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20005,
                'SP_REPORTE_CONSUMO: usuario ' || p_id_usuario || ' no encontrado.');
    END;

    -- Métricas globales
    SELECT COUNT(*),
           ROUND(SUM(
               (CAST(fecha_hora_fin AS DATE) - CAST(fecha_hora_inicio AS DATE)) * 24
           ), 2)
    INTO   v_total_reprod, v_horas_consumo
    FROM   REPRODUCCIONES r
    JOIN   PERFILES pf ON pf.id_perfil = r.id_perfil
    WHERE  pf.id_usuario = p_id_usuario
    AND    r.fecha_hora_fin IS NOT NULL
    AND    (p_mes  IS NULL OR EXTRACT(MONTH FROM r.fecha_hora_inicio) = p_mes)
    AND    (p_anio IS NULL OR EXTRACT(YEAR  FROM r.fecha_hora_inicio) = p_anio);

    SELECT COUNT(*), NVL(ROUND(AVG(estrellas), 2), 0)
    INTO   v_num_calific, v_prom_estrellas
    FROM   CALIFICACIONES cal
    JOIN   PERFILES       pf ON pf.id_perfil = cal.id_perfil
    WHERE  pf.id_usuario = p_id_usuario
    AND    (p_mes  IS NULL OR EXTRACT(MONTH FROM cal.fecha_calificacion) = p_mes)
    AND    (p_anio IS NULL OR EXTRACT(YEAR  FROM cal.fecha_calificacion) = p_anio);

    SELECT COUNT(*) INTO v_num_perfiles FROM PERFILES WHERE id_usuario = p_id_usuario;

    SELECT NVL(SUM(monto), 0) INTO v_total_pagado
    FROM   PAGOS
    WHERE  id_usuario  = p_id_usuario
    AND    estado_pago = 'EXITOSO'
    AND    (p_mes  IS NULL OR EXTRACT(MONTH FROM fecha_pago) = p_mes)
    AND    (p_anio IS NULL OR EXTRACT(YEAR  FROM fecha_pago) = p_anio);

    -- Imprimir reporte

    DBMS_OUTPUT.PUT_LINE(RPAD('=', 65, '='));
    DBMS_OUTPUT.PUT_LINE('  REPORTE DE CONSUMO – QuindioFlix');
    DBMS_OUTPUT.PUT_LINE('  Período: '
        || NVL(TO_CHAR(p_mes,'FM00') || '/' || TO_CHAR(p_anio), 'TODOS LOS MESES'));
    DBMS_OUTPUT.PUT_LINE(RPAD('=', 65, '='));
    DBMS_OUTPUT.PUT_LINE('  Usuario  : ' || v_nombre   || '  (ID: ' || p_id_usuario || ')');
    DBMS_OUTPUT.PUT_LINE('  Email    : ' || v_email);
    DBMS_OUTPUT.PUT_LINE('  Ciudad   : ' || v_ciudad);
    DBMS_OUTPUT.PUT_LINE('  Plan     : ' || v_plan || '  |  Estado: ' || v_estado);
    DBMS_OUTPUT.PUT_LINE('  Miembro  : ' || TO_CHAR(v_registro, 'DD/MM/YYYY'));
    DBMS_OUTPUT.PUT_LINE(RPAD('-', 65, '-'));
    DBMS_OUTPUT.PUT_LINE('  Perfiles       : ' || v_num_perfiles);
    DBMS_OUTPUT.PUT_LINE('  Reproducciones : ' || v_total_reprod
        || '  |  Horas consumidas: ' || NVL(v_horas_consumo, 0));
    DBMS_OUTPUT.PUT_LINE('  Calificaciones : ' || v_num_calific
        || '  |  Promedio ★: ' || v_prom_estrellas);
    DBMS_OUTPUT.PUT_LINE('  Total pagado   : $' || TO_CHAR(v_total_pagado, 'FM99,999,990.00'));

    -- Detalle por perfil
    DBMS_OUTPUT.PUT_LINE(RPAD('-', 65, '-'));
    DBMS_OUTPUT.PUT_LINE('  DETALLE POR PERFIL:');
    OPEN cur_perfiles;
    LOOP
        FETCH cur_perfiles INTO v_pf;
        EXIT WHEN cur_perfiles%NOTFOUND;
        DBMS_OUTPUT.PUT_LINE(
            '    • ' || RPAD(v_pf.nombre_perfil, 20)
            || '[' || v_pf.tipo || ']'
            || '  Reprod: ' || LPAD(v_pf.reprod, 4)
            || '  Horas: '  || NVL(v_pf.horas, 0)
        );
    END LOOP;
    CLOSE cur_perfiles;

    -- Top géneros
    DBMS_OUTPUT.PUT_LINE(RPAD('-', 65, '-'));
    DBMS_OUTPUT.PUT_LINE('  TOP 5 GÉNEROS CONSUMIDOS:');
    OPEN cur_top_generos;
    LOOP
        FETCH cur_top_generos INTO v_gen;
        EXIT WHEN cur_top_generos%NOTFOUND;
        DBMS_OUTPUT.PUT_LINE('    • ' || RPAD(v_gen.nombre_genero, 20) || v_gen.cnt || ' vez(ces)');
    END LOOP;
    CLOSE cur_top_generos;

    -- Top contenidos
    DBMS_OUTPUT.PUT_LINE(RPAD('-', 65, '-'));
    DBMS_OUTPUT.PUT_LINE('  TOP 5 CONTENIDOS MÁS VISTOS:');
    OPEN cur_top_contenidos;
    LOOP
        FETCH cur_top_contenidos INTO v_con;
        EXIT WHEN cur_top_contenidos%NOTFOUND;
        DBMS_OUTPUT.PUT_LINE(
            '    • ' || RPAD(SUBSTR(v_con.titulo, 1, 34), 36)
            || '[' || v_con.nombre_categoria || ']'
            || '  x' || v_con.veces
        );
    END LOOP;
    CLOSE cur_top_contenidos;

    -- Historial de pagos
    DBMS_OUTPUT.PUT_LINE(RPAD('-', 65, '-'));
    DBMS_OUTPUT.PUT_LINE('  HISTORIAL DE PAGOS:');
    OPEN cur_pagos;
    LOOP
        FETCH cur_pagos INTO v_pago;
        EXIT WHEN cur_pagos%NOTFOUND;
        DBMS_OUTPUT.PUT_LINE(
            '    ' || TO_CHAR(v_pago.fecha_pago, 'DD/MM/YYYY')
            || '  $' || LPAD(TO_CHAR(v_pago.monto, 'FM99,999,990.00'), 14)
            || '  ' || RPAD(v_pago.metodo_pago, 16)
            || '  ' || v_pago.estado_pago
            || '  Vence: ' || TO_CHAR(v_pago.fecha_vencimiento, 'DD/MM/YYYY')
        );
    END LOOP;
    CLOSE cur_pagos;

    DBMS_OUTPUT.PUT_LINE(RPAD('=', 65, '='));

EXCEPTION
    WHEN OTHERS THEN
        -- Cerrar cursores si están abiertos
        IF cur_perfiles%ISOPEN      THEN CLOSE cur_perfiles;      END IF;
        IF cur_top_generos%ISOPEN   THEN CLOSE cur_top_generos;   END IF;
        IF cur_top_contenidos%ISOPEN THEN CLOSE cur_top_contenidos; END IF;
        IF cur_pagos%ISOPEN         THEN CLOSE cur_pagos;         END IF;
        DBMS_OUTPUT.PUT_LINE('ERROR en SP_REPORTE_CONSUMO: ' || SQLERRM);
        RAISE;
END SP_REPORTE_CONSUMO;
/


-- PRUEBAS
/*
-- Prueba FN_CALCULAR_MONTO
SELECT FN_CALCULAR_MONTO(1) AS monto_usuario1 FROM DUAL;
SELECT FN_CALCULAR_MONTO(2) AS monto_usuario2 FROM DUAL;

-- Prueba FN_CONTENIDO_RECOMENDADO
SELECT FN_CONTENIDO_RECOMENDADO(1)  AS recom_perfil1  FROM DUAL;
SELECT FN_CONTENIDO_RECOMENDADO(2)  AS recom_perfil2  FROM DUAL;

-- Prueba SP_REGISTRAR_USUARIO
DECLARE
    v_id NUMBER;
BEGIN
    SP_REGISTRAR_USUARIO(
        p_nombre       => 'Juan Prueba Nuevo',
        p_email        => 'juan.prueba@gmail.com',
        p_telefono     => '3001234000',
        p_fnac         => DATE '1995-06-15',
        p_ciudad       => 'Armenia',
        p_id_plan      => 2,
        p_id_referidor => 1,
        p_metodo_pago  => 'NEQUI',
        p_id_usuario   => v_id
    );
    DBMS_OUTPUT.PUT_LINE('Nuevo ID: ' || v_id);
END;
/

-- Prueba SP_CAMBIAR_PLAN
EXEC SP_CAMBIAR_PLAN(p_id_usuario => 2, p_id_plan_nuevo => 1, p_metodo_pago => 'PSE');

-- Prueba SP_REPORTE_CONSUMO
EXEC SP_REPORTE_CONSUMO(p_id_usuario => 1, p_mes => NULL, p_anio => 2024);
*/