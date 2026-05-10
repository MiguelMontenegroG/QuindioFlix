-- 1. SECUENCIAS (reemplazan IDENTITY en Oracle < 12c; compatibles con 19c)

CREATE SEQUENCE seq_planes          START WITH 1  INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_usuarios        START WITH 1  INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_perfiles        START WITH 1  INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_pagos           START WITH 1  INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_categorias      START WITH 1  INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_generos         START WITH 1  INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_contenido       START WITH 1  INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_temporadas      START WITH 1  INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_episodios       START WITH 1  INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_reproducciones  START WITH 1  INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_calificaciones  START WITH 1  INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_reportes        START WITH 1  INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_departamentos   START WITH 1  INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_empleados       START WITH 1  INCREMENT BY 1 NOCACHE NOCYCLE;

-- 2. TABLAS DE CATALOGOS BASE

-- PLANES: define los tres niveles de suscripcion disponibles
CREATE TABLE PLANES (
    id_plan          NUMBER          CONSTRAINT pk_planes PRIMARY KEY,
    nombre_plan      VARCHAR2(20)    CONSTRAINT nn_plan_nombre   NOT NULL,
    precio_mensual   NUMBER(10, 2)   CONSTRAINT nn_plan_precio   NOT NULL,
    num_pantallas    NUMBER(1)       CONSTRAINT nn_plan_pant     NOT NULL,
    calidad_video    VARCHAR2(5)     CONSTRAINT nn_plan_calidad  NOT NULL,
    max_perfiles     NUMBER(1)       CONSTRAINT nn_plan_maxperf  NOT NULL,
    CONSTRAINT ck_plan_precio    CHECK (precio_mensual > 0),
    CONSTRAINT ck_plan_pantallas CHECK (num_pantallas IN (1, 2, 4)),
    CONSTRAINT ck_plan_calidad   CHECK (calidad_video  IN ('SD', 'HD', '4K')),
    CONSTRAINT ck_plan_maxperf   CHECK (max_perfiles   IN (2, 3, 5)),
    CONSTRAINT uq_plan_nombre    UNIQUE (nombre_plan)
);

COMMENT ON TABLE  PLANES               IS 'Planes de suscripcion disponibles en QuindioFlix';
COMMENT ON COLUMN PLANES.id_plan       IS 'Identificador unico del plan';
COMMENT ON COLUMN PLANES.nombre_plan   IS 'Nombre del plan: Basico, Estandar o Premium';
COMMENT ON COLUMN PLANES.precio_mensual IS 'Precio en COP por mes';
COMMENT ON COLUMN PLANES.num_pantallas IS 'Pantallas simultaneas permitidas: 1, 2 o 4';
COMMENT ON COLUMN PLANES.calidad_video IS 'Calidad maxima: SD, HD o 4K';
COMMENT ON COLUMN PLANES.max_perfiles  IS 'Numero maximo de perfiles por cuenta: 2, 3 o 5';


-- CATEGORIAS: tipo de contenido (Pelicula, Serie, Documental, Musica, Podcast)
CREATE TABLE CATEGORIAS (
    id_categoria      NUMBER         CONSTRAINT pk_categorias PRIMARY KEY,
    nombre_categoria  VARCHAR2(50)   CONSTRAINT nn_cat_nombre NOT NULL,
    descripcion       VARCHAR2(255),
    CONSTRAINT uq_cat_nombre UNIQUE (nombre_categoria)
);

COMMENT ON TABLE  CATEGORIAS                IS 'Tipos de contenido multimedia disponibles';
COMMENT ON COLUMN CATEGORIAS.id_categoria   IS 'Identificador unico de la categoria';
COMMENT ON COLUMN CATEGORIAS.nombre_categoria IS 'Nombre de la categoria: Pelicula, Serie, etc.';
COMMENT ON COLUMN CATEGORIAS.descripcion    IS 'Descripcion opcional de la categoria';


-- GENEROS: etiquetas de genero asignables a contenidos
CREATE TABLE GENEROS (
    id_genero      NUMBER        CONSTRAINT pk_generos PRIMARY KEY,
    nombre_genero  VARCHAR2(50)  CONSTRAINT nn_gen_nombre NOT NULL,
    CONSTRAINT uq_gen_nombre UNIQUE (nombre_genero)
);

COMMENT ON TABLE  GENEROS             IS 'Generos disponibles para clasificar el contenido';
COMMENT ON COLUMN GENEROS.id_genero   IS 'Identificador unico del genero';
COMMENT ON COLUMN GENEROS.nombre_genero IS 'Nombre del genero: Accion, Comedia, Drama, etc.';


-- 3. TABLAS DE EMPLEADOS Y ESTRUCTURA INTERNA

-- DEPARTAMENTOS: areas funcionales de QuindioFlix (id_jefe se agrega como FK diferida despues de crear EMPLEADOS)

CREATE TABLE DEPARTAMENTOS (
    id_departamento  NUMBER        CONSTRAINT pk_departamentos PRIMARY KEY,
    nombre_depto     VARCHAR2(50)  CONSTRAINT nn_depto_nombre NOT NULL,
    id_jefe          NUMBER,       -- FK hacia EMPLEADOS; se define tras crear esa tabla
    CONSTRAINT uq_depto_nombre UNIQUE (nombre_depto)
);

COMMENT ON TABLE  DEPARTAMENTOS                IS 'Departamentos internos de la empresa QuindioFlix';
COMMENT ON COLUMN DEPARTAMENTOS.id_departamento IS 'Identificador unico del departamento';
COMMENT ON COLUMN DEPARTAMENTOS.nombre_depto    IS 'Nombre: Tecnologia, Contenido, Marketing, Soporte, Finanzas';
COMMENT ON COLUMN DEPARTAMENTOS.id_jefe         IS 'FK al empleado que lidera el departamento (mismo departamento)';


-- EMPLEADOS: personal de QuindioFlix con jerarquia de supervision reflexiva

CREATE TABLE EMPLEADOS (
    id_empleado        NUMBER        CONSTRAINT pk_empleados PRIMARY KEY,
    nombre             VARCHAR2(100) CONSTRAINT nn_emp_nombre NOT NULL,
    email              VARCHAR2(150) CONSTRAINT nn_emp_email  NOT NULL,
    cargo              VARCHAR2(80)  CONSTRAINT nn_emp_cargo  NOT NULL,
    fecha_contratacion DATE          CONSTRAINT nn_emp_fcontrat NOT NULL,
    id_departamento    NUMBER        CONSTRAINT nn_emp_depto  NOT NULL,
    id_supervisor      NUMBER,

    CONSTRAINT uq_emp_email    UNIQUE (email),
    CONSTRAINT fk_emp_depto    FOREIGN KEY (id_departamento) REFERENCES DEPARTAMENTOS (id_departamento),
    CONSTRAINT fk_emp_superv   FOREIGN KEY (id_supervisor)   REFERENCES EMPLEADOS (id_empleado),
    CONSTRAINT ck_emp_no_auto  CHECK (id_supervisor <> id_empleado)
);

COMMENT ON TABLE  EMPLEADOS                  IS 'Empleados de QuindioFlix con jerarquia reflexiva de supervision';
COMMENT ON COLUMN EMPLEADOS.id_empleado      IS 'Identificador unico del empleado';
COMMENT ON COLUMN EMPLEADOS.nombre           IS 'Nombre completo del empleado';
COMMENT ON COLUMN EMPLEADOS.email            IS 'Correo institucional unico del empleado';
COMMENT ON COLUMN EMPLEADOS.cargo            IS 'Cargo o titulo del puesto';
COMMENT ON COLUMN EMPLEADOS.fecha_contratacion IS 'Fecha de inicio de contrato';
COMMENT ON COLUMN EMPLEADOS.id_departamento  IS 'FK al departamento al que pertenece';
COMMENT ON COLUMN EMPLEADOS.id_supervisor    IS 'FK reflexiva al supervisor directo (NULL si es jefe maximo)';


ALTER TABLE DEPARTAMENTOS
    ADD CONSTRAINT fk_depto_jefe FOREIGN KEY (id_jefe) REFERENCES EMPLEADOS (id_empleado);


-- 4. TABLAS DE CONTENIDO

-- CONTENIDO: catalogo principal (peliculas, series, documentales, musica, podcasts)

CREATE TABLE CONTENIDO (
    id_contenido       NUMBER          CONSTRAINT pk_contenido PRIMARY KEY,
    titulo             VARCHAR2(200)   CONSTRAINT nn_cont_titulo    NOT NULL,
    anio_lanzamiento   NUMBER(4)       CONSTRAINT nn_cont_anio      NOT NULL,
    duracion           NUMBER(7)       CONSTRAINT nn_cont_duracion  NOT NULL,
    sinopsis           CLOB,
    clasificacion_edad VARCHAR2(5)     CONSTRAINT nn_cont_clasif    NOT NULL,
    fecha_agregado     DATE            DEFAULT SYSDATE              NOT NULL,
    es_original        CHAR(1)         DEFAULT 'N'                  NOT NULL,
    id_categoria       NUMBER          CONSTRAINT nn_cont_cat       NOT NULL,
    id_empleado_resp   NUMBER          CONSTRAINT nn_cont_emp       NOT NULL,
    CONSTRAINT ck_cont_clasif  CHECK (clasificacion_edad IN ('TP', '+7', '+13', '+16', '+18')),
    CONSTRAINT ck_cont_original CHECK (es_original IN ('S', 'N')),
    CONSTRAINT ck_cont_anio    CHECK (anio_lanzamiento BETWEEN 1888 AND 2100),
    CONSTRAINT ck_cont_dur     CHECK (duracion > 0),
    CONSTRAINT fk_cont_cat     FOREIGN KEY (id_categoria)     REFERENCES CATEGORIAS (id_categoria),
    CONSTRAINT fk_cont_emp     FOREIGN KEY (id_empleado_resp) REFERENCES EMPLEADOS  (id_empleado)
);

COMMENT ON TABLE  CONTENIDO                  IS 'Catalogo de contenido multimedia de QuindioFlix';
COMMENT ON COLUMN CONTENIDO.id_contenido     IS 'Identificador unico del contenido';
COMMENT ON COLUMN CONTENIDO.titulo           IS 'Titulo del contenido';
COMMENT ON COLUMN CONTENIDO.anio_lanzamiento IS 'Anio de estreno original';
COMMENT ON COLUMN CONTENIDO.duracion         IS 'Duracion total en segundos';
COMMENT ON COLUMN CONTENIDO.sinopsis         IS 'Descripcion larga del contenido';
COMMENT ON COLUMN CONTENIDO.clasificacion_edad IS 'Clasificacion: TP, +7, +13, +16 o +18';
COMMENT ON COLUMN CONTENIDO.fecha_agregado   IS 'Fecha en que se publico en la plataforma';
COMMENT ON COLUMN CONTENIDO.es_original      IS 'S = produccion original QuindioFlix; N = contenido licenciado';
COMMENT ON COLUMN CONTENIDO.id_categoria     IS 'FK a CATEGORIAS';
COMMENT ON COLUMN CONTENIDO.id_empleado_resp IS 'FK al empleado de Contenido responsable de la publicacion';


-- CONTENIDO_GENERO: tabla intermedia N:M entre CONTENIDO y GENEROS

CREATE TABLE CONTENIDO_GENERO (
    id_contenido  NUMBER  CONSTRAINT nn_cg_cont NOT NULL,
    id_genero     NUMBER  CONSTRAINT nn_cg_gen  NOT NULL,
    CONSTRAINT pk_contenido_genero PRIMARY KEY (id_contenido, id_genero),
    CONSTRAINT fk_cg_contenido FOREIGN KEY (id_contenido) REFERENCES CONTENIDO (id_contenido) ON DELETE CASCADE,
    CONSTRAINT fk_cg_genero    FOREIGN KEY (id_genero)    REFERENCES GENEROS    (id_genero)    ON DELETE CASCADE
);

COMMENT ON TABLE  CONTENIDO_GENERO             IS 'Asociacion N:M entre contenidos y generos (un contenido puede tener varios generos)';
COMMENT ON COLUMN CONTENIDO_GENERO.id_contenido IS 'FK a CONTENIDO';
COMMENT ON COLUMN CONTENIDO_GENERO.id_genero    IS 'FK a GENEROS';


-- CONTENIDO_RELACIONADO: relaciones entre contenidos (secuelas, remakes, spin-offs)

CREATE TABLE CONTENIDO_RELACIONADO (
    id_contenido_a  NUMBER        CONSTRAINT nn_cr_a NOT NULL,
    id_contenido_b  NUMBER        CONSTRAINT nn_cr_b NOT NULL,
    tipo_relacion   VARCHAR2(30)  CONSTRAINT nn_cr_tipo NOT NULL,
    descripcion     VARCHAR2(300),
    CONSTRAINT pk_contenido_rel    PRIMARY KEY (id_contenido_a, id_contenido_b),
    CONSTRAINT fk_cr_contenido_a   FOREIGN KEY (id_contenido_a) REFERENCES CONTENIDO (id_contenido),
    CONSTRAINT fk_cr_contenido_b   FOREIGN KEY (id_contenido_b) REFERENCES CONTENIDO (id_contenido),
    CONSTRAINT ck_cr_tipo          CHECK (tipo_relacion IN ('SECUELA','PRECUELA','REMAKE','SPIN_OFF','VERSION_EXTENDIDA','OTRO')),
    CONSTRAINT ck_cr_no_auto       CHECK (id_contenido_a <> id_contenido_b)
);

COMMENT ON TABLE  CONTENIDO_RELACIONADO              IS 'Relacion entre contenidos: secuelas, precuelas, spin-offs, etc.';
COMMENT ON COLUMN CONTENIDO_RELACIONADO.id_contenido_a IS 'FK al primer contenido de la relacion';
COMMENT ON COLUMN CONTENIDO_RELACIONADO.id_contenido_b IS 'FK al segundo contenido de la relacion';
COMMENT ON COLUMN CONTENIDO_RELACIONADO.tipo_relacion  IS 'Tipo: SECUELA, PRECUELA, REMAKE, SPIN_OFF, VERSION_EXTENDIDA, OTRO';
COMMENT ON COLUMN CONTENIDO_RELACIONADO.descripcion    IS 'Descripcion opcional de la relacion';


-- TEMPORADAS: temporadas de series y podcasts

CREATE TABLE TEMPORADAS (
    id_temporada      NUMBER        CONSTRAINT pk_temporadas PRIMARY KEY,
    id_contenido      NUMBER        CONSTRAINT nn_temp_cont NOT NULL,
    numero_temporada  NUMBER(3)     CONSTRAINT nn_temp_num  NOT NULL,
    titulo_temporada  VARCHAR2(200),
    anio              NUMBER(4),
    CONSTRAINT uq_temp_cont_num   UNIQUE (id_contenido, numero_temporada),
    CONSTRAINT fk_temp_contenido  FOREIGN KEY (id_contenido) REFERENCES CONTENIDO (id_contenido) ON DELETE CASCADE,
    CONSTRAINT ck_temp_num        CHECK (numero_temporada > 0),
    CONSTRAINT ck_temp_anio       CHECK (anio IS NULL OR anio BETWEEN 1888 AND 2100)
);

COMMENT ON TABLE  TEMPORADAS                 IS 'Temporadas de series y podcasts';
COMMENT ON COLUMN TEMPORADAS.id_temporada    IS 'Identificador unico de la temporada';
COMMENT ON COLUMN TEMPORADAS.id_contenido    IS 'FK al contenido padre (serie o podcast)';
COMMENT ON COLUMN TEMPORADAS.numero_temporada IS 'Numero de la temporada (empieza en 1)';
COMMENT ON COLUMN TEMPORADAS.titulo_temporada IS 'Titulo opcional de la temporada';
COMMENT ON COLUMN TEMPORADAS.anio            IS 'Anio de estreno de la temporada';


-- EPISODIOS: episodios de cada temporada
CREATE TABLE EPISODIOS (
    id_episodio      NUMBER        CONSTRAINT pk_episodios PRIMARY KEY,
    id_temporada     NUMBER        CONSTRAINT nn_ep_temp NOT NULL,
    numero_episodio  NUMBER(3)     CONSTRAINT nn_ep_num  NOT NULL,
    titulo_episodio  VARCHAR2(200) CONSTRAINT nn_ep_titulo NOT NULL,
    duracion         NUMBER(7)     CONSTRAINT nn_ep_dur  NOT NULL,
    sinopsis_ep      CLOB,
    CONSTRAINT uq_ep_temp_num    UNIQUE (id_temporada, numero_episodio),
    CONSTRAINT fk_ep_temporada   FOREIGN KEY (id_temporada) REFERENCES TEMPORADAS (id_temporada) ON DELETE CASCADE,
    CONSTRAINT ck_ep_num         CHECK (numero_episodio > 0),
    CONSTRAINT ck_ep_dur         CHECK (duracion > 0)
);

COMMENT ON TABLE  EPISODIOS                 IS 'Episodios individuales de cada temporada';
COMMENT ON COLUMN EPISODIOS.id_episodio     IS 'Identificador unico del episodio';
COMMENT ON COLUMN EPISODIOS.id_temporada    IS 'FK a la temporada a la que pertenece';
COMMENT ON COLUMN EPISODIOS.numero_episodio IS 'Numero del episodio dentro de la temporada';
COMMENT ON COLUMN EPISODIOS.titulo_episodio IS 'Titulo del episodio';
COMMENT ON COLUMN EPISODIOS.duracion        IS 'Duracion en segundos';
COMMENT ON COLUMN EPISODIOS.sinopsis_ep     IS 'Sinopsis del episodio';


-- 5. TABLAS DE USUARIOS

-- USUARIOS: cuentas de suscriptores con referidos y plan
CREATE TABLE USUARIOS (
    id_usuario      NUMBER          CONSTRAINT pk_usuarios PRIMARY KEY,
    nombre          VARCHAR2(100)   CONSTRAINT nn_usu_nombre  NOT NULL,
    email           VARCHAR2(150)   CONSTRAINT nn_usu_email   NOT NULL,
    telefono        VARCHAR2(15)    CONSTRAINT nn_usu_tel     NOT NULL,
    fecha_nacimiento DATE           CONSTRAINT nn_usu_fnac    NOT NULL,
    ciudad          VARCHAR2(80)    CONSTRAINT nn_usu_ciudad  NOT NULL,
    estado_cuenta   VARCHAR2(10)    DEFAULT 'ACTIVO'          NOT NULL,
    fecha_registro  DATE            DEFAULT SYSDATE           NOT NULL,
    id_plan         NUMBER          CONSTRAINT nn_usu_plan    NOT NULL,
    id_referidor    NUMBER,
    CONSTRAINT uq_usu_email       UNIQUE (email),
    CONSTRAINT ck_usu_estado      CHECK (estado_cuenta IN ('ACTIVO', 'INACTIVO')),
    CONSTRAINT ck_usu_fnac CHECK (fecha_nacimiento < DATE '2026-04-12'),
    CONSTRAINT ck_usu_no_autoref  CHECK (id_referidor <> id_usuario),
    CONSTRAINT fk_usu_plan        FOREIGN KEY (id_plan)      REFERENCES PLANES   (id_plan),
    CONSTRAINT fk_usu_referidor   FOREIGN KEY (id_referidor) REFERENCES USUARIOS (id_usuario)
);

COMMENT ON TABLE  USUARIOS                 IS 'Cuentas de suscriptores de QuindioFlix';
COMMENT ON COLUMN USUARIOS.id_usuario      IS 'Identificador unico del usuario';
COMMENT ON COLUMN USUARIOS.nombre          IS 'Nombre completo del usuario';
COMMENT ON COLUMN USUARIOS.email           IS 'Correo electronico unico, usado para login';
COMMENT ON COLUMN USUARIOS.telefono        IS 'Numero de telefono de contacto';
COMMENT ON COLUMN USUARIOS.fecha_nacimiento IS 'Fecha de nacimiento; debe ser anterior a hoy';
COMMENT ON COLUMN USUARIOS.ciudad          IS 'Ciudad de residencia del usuario';
COMMENT ON COLUMN USUARIOS.estado_cuenta   IS 'ACTIVO: al dia con pagos; INACTIVO: mora mayor a 30 dias';
COMMENT ON COLUMN USUARIOS.fecha_registro  IS 'Fecha en que se creo la cuenta';
COMMENT ON COLUMN USUARIOS.id_plan         IS 'FK al plan de suscripcion contratado';
COMMENT ON COLUMN USUARIOS.id_referidor    IS 'FK reflexiva al usuario que refirio a este (NULL si ninguno)';


-- PERFILES: identidades de consumo dentro de una cuenta
CREATE TABLE PERFILES (
    id_perfil     NUMBER        CONSTRAINT pk_perfiles PRIMARY KEY,
    id_usuario    NUMBER        CONSTRAINT nn_perf_usu NOT NULL,
    nombre_perfil VARCHAR2(50)  CONSTRAINT nn_perf_nom NOT NULL,
    avatar        VARCHAR2(100) DEFAULT 'default.png',
    tipo          VARCHAR2(10)  CONSTRAINT nn_perf_tipo NOT NULL,
    -- Restricciones
    CONSTRAINT ck_perf_tipo    CHECK (tipo IN ('ADULTO', 'INFANTIL')),
    CONSTRAINT uq_perf_usu_nom UNIQUE (id_usuario, nombre_perfil),
    CONSTRAINT fk_perf_usuario FOREIGN KEY (id_usuario) REFERENCES USUARIOS (id_usuario) ON DELETE CASCADE
);

COMMENT ON TABLE  PERFILES              IS 'Perfiles de consumo dentro de cada cuenta de usuario';
COMMENT ON COLUMN PERFILES.id_perfil    IS 'Identificador unico del perfil';
COMMENT ON COLUMN PERFILES.id_usuario   IS 'FK al usuario propietario de la cuenta';
COMMENT ON COLUMN PERFILES.nombre_perfil IS 'Nombre visible del perfil (unico por usuario)';
COMMENT ON COLUMN PERFILES.avatar       IS 'Ruta o nombre del avatar del perfil';
COMMENT ON COLUMN PERFILES.tipo         IS 'ADULTO: acceso completo; INFANTIL: solo TP, +7 y +13';


-- 6. TABLAS DE TRANSACCIONES Y ACTIVIDAD

-- PAGOS: historial de cobros mensuales
CREATE TABLE PAGOS (
    id_pago           NUMBER        CONSTRAINT pk_pagos PRIMARY KEY,
    id_usuario        NUMBER        CONSTRAINT nn_pago_usu  NOT NULL,
    fecha_pago        DATE          DEFAULT SYSDATE         NOT NULL,
    monto             NUMBER(10, 2) CONSTRAINT nn_pago_monto NOT NULL,
    metodo_pago       VARCHAR2(20)  CONSTRAINT nn_pago_met  NOT NULL,
    estado_pago       VARCHAR2(15)  CONSTRAINT nn_pago_est  NOT NULL,
    fecha_vencimiento DATE          CONSTRAINT nn_pago_venc NOT NULL,
    CONSTRAINT ck_pago_monto  CHECK (monto > 0),
    CONSTRAINT ck_pago_metodo CHECK (metodo_pago IN ('TARJETA_CREDITO','TARJETA_DEBITO','PSE','NEQUI','DAVIPLATA')),
    CONSTRAINT ck_pago_estado CHECK (estado_pago IN ('EXITOSO','FALLIDO','PENDIENTE','REEMBOLSADO')),
    CONSTRAINT fk_pago_usuario FOREIGN KEY (id_usuario) REFERENCES USUARIOS (id_usuario)
);

COMMENT ON TABLE  PAGOS                   IS 'Historial de pagos mensuales de suscripcion';
COMMENT ON COLUMN PAGOS.id_pago           IS 'Identificador unico del pago';
COMMENT ON COLUMN PAGOS.id_usuario        IS 'FK al usuario que realizo el pago';
COMMENT ON COLUMN PAGOS.fecha_pago        IS 'Fecha en que se proceso el pago';
COMMENT ON COLUMN PAGOS.monto             IS 'Monto cobrado en COP, incluyendo descuentos aplicados';
COMMENT ON COLUMN PAGOS.metodo_pago       IS 'Medio de pago utilizado';
COMMENT ON COLUMN PAGOS.estado_pago       IS 'Estado: EXITOSO, FALLIDO, PENDIENTE o REEMBOLSADO';
COMMENT ON COLUMN PAGOS.fecha_vencimiento IS 'Fecha hasta la que cubre este pago';


-- REPRODUCCIONES: registro de cada reproduccion por perfil, tabla candidata a particionamiento por rango de fechas

CREATE TABLE REPRODUCCIONES (
    id_reproduccion   NUMBER        CONSTRAINT pk_reproducciones PRIMARY KEY,
    id_perfil         NUMBER        CONSTRAINT nn_rep_perfil NOT NULL,
    id_contenido      NUMBER        CONSTRAINT nn_rep_cont   NOT NULL,
    id_episodio       NUMBER,
    fecha_hora_inicio TIMESTAMP     CONSTRAINT nn_rep_inicio NOT NULL,
    fecha_hora_fin    TIMESTAMP,
    dispositivo       VARCHAR2(15)  CONSTRAINT nn_rep_disp   NOT NULL,
    porcentaje_avance NUMBER(5, 2)  DEFAULT 0                NOT NULL,
    CONSTRAINT ck_rep_disp    CHECK (dispositivo IN ('CELULAR','TABLET','TV','COMPUTADOR')),
    CONSTRAINT ck_rep_avance  CHECK (porcentaje_avance BETWEEN 0 AND 100),
    CONSTRAINT ck_rep_fechas  CHECK (fecha_hora_fin IS NULL OR fecha_hora_fin >= fecha_hora_inicio),
    CONSTRAINT fk_rep_perfil   FOREIGN KEY (id_perfil)    REFERENCES PERFILES  (id_perfil),
    CONSTRAINT fk_rep_cont     FOREIGN KEY (id_contenido) REFERENCES CONTENIDO (id_contenido),
    CONSTRAINT fk_rep_episodio FOREIGN KEY (id_episodio)  REFERENCES EPISODIOS (id_episodio)
);

COMMENT ON TABLE  REPRODUCCIONES                  IS 'Registro de cada reproduccion realizada por un perfil';
COMMENT ON COLUMN REPRODUCCIONES.id_reproduccion  IS 'Identificador unico de la reproduccion';
COMMENT ON COLUMN REPRODUCCIONES.id_perfil        IS 'FK al perfil que inicio la reproduccion';
COMMENT ON COLUMN REPRODUCCIONES.id_contenido     IS 'FK al contenido reproducido';
COMMENT ON COLUMN REPRODUCCIONES.id_episodio      IS 'FK al episodio (NULL para peliculas, documentales, musica)';
COMMENT ON COLUMN REPRODUCCIONES.fecha_hora_inicio IS 'Timestamp de inicio de la reproduccion';
COMMENT ON COLUMN REPRODUCCIONES.fecha_hora_fin   IS 'Timestamp de fin; NULL si esta en curso';
COMMENT ON COLUMN REPRODUCCIONES.dispositivo      IS 'Tipo de dispositivo: CELULAR, TABLET, TV, COMPUTADOR';
COMMENT ON COLUMN REPRODUCCIONES.porcentaje_avance IS 'Porcentaje del contenido reproducido (0-100)';

-- CALIFICACIONES: estrellas y resenas de contenido por perfil

CREATE TABLE CALIFICACIONES (
    id_calificacion   NUMBER   CONSTRAINT pk_calificaciones PRIMARY KEY,
    id_perfil         NUMBER   CONSTRAINT nn_cal_perfil NOT NULL,
    id_contenido      NUMBER   CONSTRAINT nn_cal_cont   NOT NULL,
    estrellas         NUMBER(1) CONSTRAINT nn_cal_est   NOT NULL,
    resenia           CLOB,
    fecha_calificacion DATE    DEFAULT SYSDATE          NOT NULL,
    CONSTRAINT uq_cal_perfil_cont UNIQUE (id_perfil, id_contenido),
    CONSTRAINT ck_cal_estrellas   CHECK (estrellas BETWEEN 1 AND 5),
    CONSTRAINT fk_cal_perfil   FOREIGN KEY (id_perfil)    REFERENCES PERFILES  (id_perfil),
    CONSTRAINT fk_cal_cont     FOREIGN KEY (id_contenido) REFERENCES CONTENIDO (id_contenido)
);

COMMENT ON TABLE  CALIFICACIONES                    IS 'Calificaciones y resenas de contenido por perfil';
COMMENT ON COLUMN CALIFICACIONES.id_calificacion    IS 'Identificador unico de la calificacion';
COMMENT ON COLUMN CALIFICACIONES.id_perfil          IS 'FK al perfil que califica';
COMMENT ON COLUMN CALIFICACIONES.id_contenido       IS 'FK al contenido calificado';
COMMENT ON COLUMN CALIFICACIONES.estrellas          IS 'Puntaje de 1 a 5 estrellas';
COMMENT ON COLUMN CALIFICACIONES.resenia            IS 'Texto opcional de resena';
COMMENT ON COLUMN CALIFICACIONES.fecha_calificacion IS 'Fecha en que se registro la calificacion';


-- FAVORITOS: lista personal de contenido guardado por perfil

CREATE TABLE FAVORITOS (
    id_perfil      NUMBER  CONSTRAINT nn_fav_perfil NOT NULL,
    id_contenido   NUMBER  CONSTRAINT nn_fav_cont   NOT NULL,
    fecha_agregado DATE    DEFAULT SYSDATE          NOT NULL,
    CONSTRAINT pk_favoritos     PRIMARY KEY (id_perfil, id_contenido),
    CONSTRAINT fk_fav_perfil    FOREIGN KEY (id_perfil)    REFERENCES PERFILES  (id_perfil)  ON DELETE CASCADE,
    CONSTRAINT fk_fav_contenido FOREIGN KEY (id_contenido) REFERENCES CONTENIDO (id_contenido) ON DELETE CASCADE
);

COMMENT ON TABLE  FAVORITOS               IS 'Lista personal de contenido favorito de cada perfil';
COMMENT ON COLUMN FAVORITOS.id_perfil     IS 'FK al perfil propietario de la lista';
COMMENT ON COLUMN FAVORITOS.id_contenido  IS 'FK al contenido guardado como favorito';
COMMENT ON COLUMN FAVORITOS.fecha_agregado IS 'Fecha en que se agrego el contenido a favoritos';


-- REPORTES: reportes de contenido inapropiado gestionados por moderadores

CREATE TABLE REPORTES (
    id_reporte           NUMBER        CONSTRAINT pk_reportes PRIMARY KEY,
    id_perfil_reportador NUMBER        CONSTRAINT nn_rep_perfil NOT NULL,
    id_contenido         NUMBER        CONSTRAINT nn_rep_cont   NOT NULL,
    motivo               VARCHAR2(300) CONSTRAINT nn_rep_motivo NOT NULL,
    fecha_reporte        DATE          DEFAULT SYSDATE          NOT NULL,
    estado_reporte       VARCHAR2(15)  DEFAULT 'PENDIENTE'      NOT NULL,
    id_moderador         NUMBER,
    fecha_resolucion     DATE,
    comentario_moderador VARCHAR2(500),
    CONSTRAINT ck_rep_estado     CHECK (estado_reporte IN ('PENDIENTE','EN_REVISION','RESUELTO','RECHAZADO')),
    CONSTRAINT ck_rep_fechas     CHECK (fecha_resolucion IS NULL OR fecha_resolucion >= fecha_reporte),
    CONSTRAINT fk_rep_perfil_rep FOREIGN KEY (id_perfil_reportador) REFERENCES PERFILES (id_perfil),
    CONSTRAINT fk_rep_contenido  FOREIGN KEY (id_contenido)         REFERENCES CONTENIDO(id_contenido),
    CONSTRAINT fk_rep_moderador  FOREIGN KEY (id_moderador)         REFERENCES USUARIOS  (id_usuario)
);

COMMENT ON TABLE  REPORTES                       IS 'Reportes de contenido inapropiado generados por perfiles y resueltos por moderadores';
COMMENT ON COLUMN REPORTES.id_reporte            IS 'Identificador unico del reporte';
COMMENT ON COLUMN REPORTES.id_perfil_reportador  IS 'FK al perfil que genero el reporte';
COMMENT ON COLUMN REPORTES.id_contenido          IS 'FK al contenido reportado';
COMMENT ON COLUMN REPORTES.motivo                IS 'Descripcion del motivo del reporte';
COMMENT ON COLUMN REPORTES.fecha_reporte         IS 'Fecha en que se genero el reporte';
COMMENT ON COLUMN REPORTES.estado_reporte        IS 'PENDIENTE, EN_REVISION, RESUELTO o RECHAZADO';
COMMENT ON COLUMN REPORTES.id_moderador          IS 'FK al usuario moderador que revisa el reporte';
COMMENT ON COLUMN REPORTES.fecha_resolucion      IS 'Fecha en que el moderador cerro el reporte';
COMMENT ON COLUMN REPORTES.comentario_moderador  IS 'Observacion del moderador al resolver el reporte';

