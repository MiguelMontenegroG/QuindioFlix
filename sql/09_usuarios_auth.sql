-- Tabla auxiliar para credenciales de usuario (no modifica el esquema existente)
CREATE TABLE USUARIOS_AUTH (
    id_usuario NUMBER NOT NULL,
    password_hash VARCHAR2(255) NOT NULL,
    CONSTRAINT pk_usuarios_auth PRIMARY KEY (id_usuario),
    CONSTRAINT fk_usuarios_auth_usuario FOREIGN KEY (id_usuario)
        REFERENCES QUINDIOFLIX.USUARIOS(id_usuario)
);

