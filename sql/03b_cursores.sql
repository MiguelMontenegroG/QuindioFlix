SET SERVEROUTPUT ON SIZE UNLIMITED;

-- CURSOR 1: CUR_USUARIOS_MOROSOS

DECLARE

    -- Registro que almacena cada fila recuperada por el cursor
    TYPE t_moroso IS RECORD (
        id_usuario     USUARIOS.id_usuario%TYPE,
        nombre         USUARIOS.nombre%TYPE,
        email          USUARIOS.email%TYPE,
        ciudad         USUARIOS.ciudad%TYPE,
        nombre_plan    PLANES.nombre_plan%TYPE,
        ultimo_venc    PAGOS.fecha_vencimiento%TYPE,
        dias_mora      NUMBER
    );

    v_moroso     t_moroso;
    v_contador   PLS_INTEGER := 0;

    -- Cursor explícito: une USUARIOS, PLANES y el último pago exitoso.
    -- La condición HAVING asegura que el último vencimiento exitoso superó 30 días.
    CURSOR cur_usuarios_morosos IS
        SELECT  u.id_usuario,
                u.nombre,
                u.email,
                u.ciudad,
                p.nombre_plan,
                MAX(pg.fecha_vencimiento)            AS ultimo_venc,
                TRUNC(SYSDATE - MAX(pg.fecha_vencimiento)) AS dias_mora
        FROM    USUARIOS u
        JOIN    PLANES   p  ON p.id_plan   = u.id_plan
        JOIN    PAGOS    pg ON pg.id_usuario = u.id_usuario
        WHERE   u.estado_cuenta  = 'ACTIVO'
        AND     pg.estado_pago   = 'EXITOSO'
        GROUP BY u.id_usuario, u.nombre, u.email, u.ciudad, p.nombre_plan
        HAVING  MAX(pg.fecha_vencimiento) < SYSDATE - 30
        ORDER BY dias_mora DESC;

BEGIN
    DBMS_OUTPUT.PUT_LINE('=============================================================');
    DBMS_OUTPUT.PUT_LINE('  REPORTE DE USUARIOS MOROSOS  –  ' || TO_CHAR(SYSDATE,'DD/MM/YYYY'));
    DBMS_OUTPUT.PUT_LINE('=============================================================');

    OPEN cur_usuarios_morosos;

    LOOP
        FETCH cur_usuarios_morosos INTO v_moroso;
        EXIT WHEN cur_usuarios_morosos%NOTFOUND;

        v_contador := v_contador + 1;

        -- Desactivar la cuenta (RN-04)
        UPDATE USUARIOS
        SET    estado_cuenta = 'INACTIVO'
        WHERE  id_usuario    = v_moroso.id_usuario;

        -- Reporte en consola
        DBMS_OUTPUT.PUT_LINE(
            LPAD(v_contador, 3, '0') || '. '
            || RPAD(v_moroso.nombre, 25)
            || ' | Plan: '   || RPAD(v_moroso.nombre_plan, 9)
            || ' | Ciudad: ' || RPAD(v_moroso.ciudad, 10)
            || ' | Venció: ' || TO_CHAR(v_moroso.ultimo_venc, 'DD/MM/YYYY')
            || ' | Días mora: ' || v_moroso.dias_mora
        );
    END LOOP;

    CLOSE cur_usuarios_morosos;

    IF v_contador = 0 THEN
        DBMS_OUTPUT.PUT_LINE('  ✔ No se encontraron usuarios en mora.');
    ELSE
        DBMS_OUTPUT.PUT_LINE('-------------------------------------------------------------');
        DBMS_OUTPUT.PUT_LINE('  Total desactivados: ' || v_contador || ' usuario(s).');
        COMMIT;
    END IF;

    DBMS_OUTPUT.PUT_LINE('=============================================================');

EXCEPTION
    WHEN OTHERS THEN
        IF cur_usuarios_morosos%ISOPEN THEN
            CLOSE cur_usuarios_morosos;
        END IF;
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('ERROR inesperado en CUR_USUARIOS_MOROSOS: ' || SQLERRM);
        RAISE;
END;
/

-- CURSOR 2: CUR_POPULARIDAD

DECLARE

    TYPE t_popularidad IS RECORD (
        id_contenido     CONTENIDO.id_contenido%TYPE,
        titulo           CONTENIDO.titulo%TYPE,
        nombre_categoria CATEGORIAS.nombre_categoria%TYPE,
        es_original      CONTENIDO.es_original%TYPE,
        total_reprod     NUMBER,
        prom_estrellas   NUMBER,
        total_favoritos  NUMBER,
        indice           NUMBER
    );

    v_pop         t_popularidad;
    v_rank        PLS_INTEGER := 0;
    v_prom_indice NUMBER;

    -- Cursor principal: calcula el índice de popularidad compuesto
    CURSOR cur_popularidad(p_limite IN NUMBER DEFAULT 20) IS
        SELECT  c.id_contenido,
                c.titulo,
                cat.nombre_categoria,
                c.es_original,
                COUNT(DISTINCT r.id_reproduccion)                     AS total_reprod,
                NVL(ROUND(AVG(cal.estrellas), 2), 0)                  AS prom_estrellas,
                COUNT(DISTINCT f.id_perfil)                           AS total_favoritos,
                ROUND(
                    (COUNT(DISTINCT r.id_reproduccion)     * 0.40)
                  + (NVL(AVG(cal.estrellas), 0) * 10       * 0.35)
                  + (COUNT(DISTINCT f.id_perfil)            * 0.25)
                , 2)                                                   AS indice
        FROM    CONTENIDO   c
        JOIN    CATEGORIAS  cat ON cat.id_categoria = c.id_categoria
        LEFT JOIN REPRODUCCIONES r   ON r.id_contenido = c.id_contenido
        LEFT JOIN CALIFICACIONES cal ON cal.id_contenido = c.id_contenido
        LEFT JOIN FAVORITOS      f   ON f.id_contenido  = c.id_contenido
        GROUP BY c.id_contenido, c.titulo, cat.nombre_categoria, c.es_original
        ORDER BY indice DESC
        FETCH FIRST p_limite ROWS ONLY;

BEGIN
    -- Calcular el promedio global del índice para identificar "destacados"
    SELECT ROUND(AVG(
               (cnt_r * 0.40) + (prom_cal * 10 * 0.35) + (cnt_f * 0.25)
           ), 2)
    INTO   v_prom_indice
    FROM (
        SELECT  COUNT(DISTINCT r.id_reproduccion)          AS cnt_r,
                NVL(AVG(cal.estrellas), 0)                 AS prom_cal,
                COUNT(DISTINCT f.id_perfil)                AS cnt_f
        FROM    CONTENIDO c
        LEFT JOIN REPRODUCCIONES r   ON r.id_contenido = c.id_contenido
        LEFT JOIN CALIFICACIONES cal ON cal.id_contenido = c.id_contenido
        LEFT JOIN FAVORITOS      f   ON f.id_contenido  = c.id_contenido
        GROUP BY c.id_contenido
    );

    DBMS_OUTPUT.PUT_LINE('=============================================================');
    DBMS_OUTPUT.PUT_LINE('  RANKING DE POPULARIDAD DE CONTENIDO  –  TOP 20');
    DBMS_OUTPUT.PUT_LINE('  Índice promedio global: ' || v_prom_indice);
    DBMS_OUTPUT.PUT_LINE('  Fórmula: (Reprod×0.40) + (Estrellas×10×0.35) + (Favs×0.25)');
    DBMS_OUTPUT.PUT_LINE('=============================================================');
    DBMS_OUTPUT.PUT_LINE(
        RPAD('Pos', 4)  || RPAD('Título', 38) || RPAD('Categoría', 14)
        || RPAD('Orig', 5) || RPAD('Rep', 5)
        || RPAD('★', 5)  || RPAD('Fav', 5) || 'Índice'
    );
    DBMS_OUTPUT.PUT_LINE(RPAD('-', 90, '-'));

    OPEN cur_popularidad(20);

    LOOP
        FETCH cur_popularidad INTO v_pop;
        EXIT WHEN cur_popularidad%NOTFOUND;

        v_rank := v_rank + 1;

        DBMS_OUTPUT.PUT_LINE(
            LPAD(v_rank, 3, '0') || ' '
            || RPAD(SUBSTR(v_pop.titulo, 1, 36), 38)
            || RPAD(v_pop.nombre_categoria, 14)
            || RPAD(v_pop.es_original, 5)
            || RPAD(v_pop.total_reprod, 5)
            || RPAD(v_pop.prom_estrellas, 5)
            || RPAD(v_pop.total_favoritos, 5)
            || v_pop.indice
            || CASE WHEN v_pop.indice > v_prom_indice THEN '  ★ DESTACADO' ELSE '' END
        );
    END LOOP;

    CLOSE cur_popularidad;

    DBMS_OUTPUT.PUT_LINE(RPAD('=', 90, '='));
    DBMS_OUTPUT.PUT_LINE('  Contenidos evaluados: ' || v_rank);

EXCEPTION
    WHEN OTHERS THEN
        IF cur_popularidad%ISOPEN THEN
            CLOSE cur_popularidad;
        END IF;
        DBMS_OUTPUT.PUT_LINE('ERROR en CUR_POPULARIDAD: ' || SQLERRM);
        RAISE;
END;
/