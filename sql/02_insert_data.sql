-- 1. PLANES (3 registros)

INSERT INTO PLANES VALUES (seq_planes.NEXTVAL, 'Basico',   14900, 1, 'SD',  2);
INSERT INTO PLANES VALUES (seq_planes.NEXTVAL, 'Estandar', 24900, 2, 'HD',  3);
INSERT INTO PLANES VALUES (seq_planes.NEXTVAL, 'Premium',  34900, 4, '4K',  5);

-- 2. CATEGORIAS (5 registros)
INSERT INTO CATEGORIAS VALUES (seq_categorias.NEXTVAL, 'Pelicula',    'Largometrajes de ficcion y no ficcion');
INSERT INTO CATEGORIAS VALUES (seq_categorias.NEXTVAL, 'Serie',       'Contenido serializado por temporadas');
INSERT INTO CATEGORIAS VALUES (seq_categorias.NEXTVAL, 'Documental',  'Contenido educativo y periodistico');
INSERT INTO CATEGORIAS VALUES (seq_categorias.NEXTVAL, 'Musica',      'Videos musicales y conciertos');
INSERT INTO CATEGORIAS VALUES (seq_categorias.NEXTVAL, 'Podcast',     'Programas de audio serializado');

-- 3. GENEROS (10 registros)
INSERT INTO GENEROS VALUES (seq_generos.NEXTVAL, 'Accion');
INSERT INTO GENEROS VALUES (seq_generos.NEXTVAL, 'Comedia');
INSERT INTO GENEROS VALUES (seq_generos.NEXTVAL, 'Drama');
INSERT INTO GENEROS VALUES (seq_generos.NEXTVAL, 'Suspenso');
INSERT INTO GENEROS VALUES (seq_generos.NEXTVAL, 'Romance');
INSERT INTO GENEROS VALUES (seq_generos.NEXTVAL, 'Ciencia Ficcion');
INSERT INTO GENEROS VALUES (seq_generos.NEXTVAL, 'Terror');
INSERT INTO GENEROS VALUES (seq_generos.NEXTVAL, 'Infantil');
INSERT INTO GENEROS VALUES (seq_generos.NEXTVAL, 'Documental');
INSERT INTO GENEROS VALUES (seq_generos.NEXTVAL, 'Musical');

-- 4. DEPARTAMENTOS (5 registros) -- id_jefe se actualiza tras insertar empleados

INSERT INTO DEPARTAMENTOS (id_departamento, nombre_depto) VALUES (seq_departamentos.NEXTVAL, 'Tecnologia');
INSERT INTO DEPARTAMENTOS (id_departamento, nombre_depto) VALUES (seq_departamentos.NEXTVAL, 'Contenido');
INSERT INTO DEPARTAMENTOS (id_departamento, nombre_depto) VALUES (seq_departamentos.NEXTVAL, 'Marketing');
INSERT INTO DEPARTAMENTOS (id_departamento, nombre_depto) VALUES (seq_departamentos.NEXTVAL, 'Soporte');
INSERT INTO DEPARTAMENTOS (id_departamento, nombre_depto) VALUES (seq_departamentos.NEXTVAL, 'Finanzas');

-- 5. EMPLEADOS (15 registros: 3 por departamento)

-- Tecnologia (depto 1)
INSERT INTO EMPLEADOS VALUES (seq_empleados.NEXTVAL, 'Carlos Mora',      'c.mora@quindioflix.co',     'Director de Tecnologia', DATE '2022-01-10', 1, NULL);
INSERT INTO EMPLEADOS VALUES (seq_empleados.NEXTVAL, 'Laura Ospina',     'l.ospina@quindioflix.co',   'Ingeniera de Datos',     DATE '2022-03-15', 1, 1);
INSERT INTO EMPLEADOS VALUES (seq_empleados.NEXTVAL, 'Andres Salazar',   'a.salazar@quindioflix.co',  'DBA Oracle',             DATE '2023-06-01', 1, 1);

-- Contenido (depto 2)
INSERT INTO EMPLEADOS VALUES (seq_empleados.NEXTVAL, 'Maria Cardona',    'm.cardona@quindioflix.co',  'Directora de Contenido', DATE '2021-08-20', 2, NULL);
INSERT INTO EMPLEADOS VALUES (seq_empleados.NEXTVAL, 'Juan Perez',       'j.perez@quindioflix.co',    'Editor de Contenido',    DATE '2022-02-14', 2, 4);
INSERT INTO EMPLEADOS VALUES (seq_empleados.NEXTVAL, 'Sofia Ramirez',    's.ramirez@quindioflix.co',  'Curadora de Catalogo',   DATE '2022-09-05', 2, 4);
INSERT INTO EMPLEADOS VALUES (seq_empleados.NEXTVAL, 'Diego Londono',    'd.londono@quindioflix.co',  'Gestor de Licencias',    DATE '2023-01-17', 2, 4);

-- Marketing (depto 3)
INSERT INTO EMPLEADOS VALUES (seq_empleados.NEXTVAL, 'Ana Gutierrez',    'a.gutierrez@quindioflix.co','Directora de Marketing', DATE '2021-11-03', 3, NULL);
INSERT INTO EMPLEADOS VALUES (seq_empleados.NEXTVAL, 'Felipe Torres',    'f.torres@quindioflix.co',   'Analista de Campanas',   DATE '2023-03-22', 3, 8);

-- Soporte (depto 4)
INSERT INTO EMPLEADOS VALUES (seq_empleados.NEXTVAL, 'Claudia Vargas',   'c.vargas@quindioflix.co',   'Jefa de Soporte',        DATE '2021-07-01', 4, NULL);
INSERT INTO EMPLEADOS VALUES (seq_empleados.NEXTVAL, 'Ricardo Mejia',    'r.mejia@quindioflix.co',    'Agente de Soporte',      DATE '2022-05-10', 4, 10);
INSERT INTO EMPLEADOS VALUES (seq_empleados.NEXTVAL, 'Valentina Cruz',   'v.cruz@quindioflix.co',     'Agente de Soporte',      DATE '2023-08-14', 4, 10);

-- Finanzas (depto 5)
INSERT INTO EMPLEADOS VALUES (seq_empleados.NEXTVAL, 'Hernando Rios',    'h.rios@quindioflix.co',     'Director Financiero',    DATE '2021-04-15', 5, NULL);
INSERT INTO EMPLEADOS VALUES (seq_empleados.NEXTVAL, 'Paola Mendez',     'p.mendez@quindioflix.co',   'Analista Financiero',    DATE '2022-11-28', 5, 13);
INSERT INTO EMPLEADOS VALUES (seq_empleados.NEXTVAL, 'Santiago Leal',    's.leal@quindioflix.co',     'Contador',               DATE '2023-04-03', 5, 13);

-- Asignar jefes a departamentos
UPDATE DEPARTAMENTOS SET id_jefe = 1  WHERE id_departamento = 1;
UPDATE DEPARTAMENTOS SET id_jefe = 4  WHERE id_departamento = 2;
UPDATE DEPARTAMENTOS SET id_jefe = 8  WHERE id_departamento = 3;
UPDATE DEPARTAMENTOS SET id_jefe = 10 WHERE id_departamento = 4;
UPDATE DEPARTAMENTOS SET id_jefe = 13 WHERE id_departamento = 5;

-- =============================================================================
-- 6. CONTENIDO (40 registros, distribuidos en 5 categorias)
-- Empleados responsables: solo los de Contenido (depto 2): ids 4,5,6,7
-- Asimetria: mas peliculas y series que documentales/musica/podcast
-- =============================================================================

-- PELICULAS (id_categoria=1): 14 registros (ids 1-14)
INSERT INTO CONTENIDO VALUES (1, 'El Secreto de Sus Ojos',         2009, 7320,  'Un oficial de justicia jubilado intenta resolver un caso de asesinato que lo obsesiona.', '+18', DATE '2023-01-15', 'N', 1, 5);
INSERT INTO CONTENIDO VALUES (2, 'La Sociedad de la Nieve',       2023, 8100,  'La historia real de los sobrevivientes del accidente aéreo en los Andes.', '+16', DATE '2023-02-10', 'N', 1, 4);
INSERT INTO CONTENIDO VALUES (3, 'Dune: Parte Uno',               2021, 6900,  'Adaptación de la novela de Frank Herbert sobre un joven noble en un planeta desértico.', '+13', DATE '2023-03-05', 'N', 1, 6);
INSERT INTO CONTENIDO VALUES (4, 'Encanto',                       2021, 5400,  'Una familia mágica en las montañas de Colombia debe salvar su hogar.', 'TP',  DATE '2023-04-20', 'S', 1, 7);
INSERT INTO CONTENIDO VALUES (5, 'Hereditary',                    2018, 7800,  'Una familia es aterrorizada por oscuros secretos después de la muerte de su abuela.', '+18', DATE '2023-05-11', 'N', 1, 5);
INSERT INTO CONTENIDO VALUES (6, 'Interestelar',                  2014, 8640,  'Un grupo de exploradores viaja a través de un agujero de gusano en busca de un nuevo hogar.', '+7',  DATE '2023-06-30', 'N', 1, 4);
INSERT INTO CONTENIDO VALUES (7, 'Un Amor Invencible',            2022, 6300,  'Dos jóvenes de familias enfrentadas se enamoran en el Quindío (Inventada).', '+13', DATE '2023-07-14', 'S', 1, 6);
INSERT INTO CONTENIDO VALUES (8, 'John Wick: Capítulo 4',         2023, 7020,  'El asesino a sueldo busca venganza contra el gremio de la Mesa Alta.', '+16', DATE '2023-08-22', 'N', 1, 5);
INSERT INTO CONTENIDO VALUES (9, 'El Padre de la Novia',          2022, 5760,  'Un padre debe lidiar con la boda de su hija y su ex esposo (Inventada).', '+7',  DATE '2023-09-18', 'N', 1, 7);
INSERT INTO CONTENIDO VALUES (10,'Los Colores de la Montaña',     2010, 8280,  'Un niño en una zona rural de Colombia sueña con ser futbolista mientras la violencia lo rodea.', '+13', DATE '2023-10-05', 'S', 1, 4);
INSERT INTO CONTENIDO VALUES (11,'El Orfanato',                   2007, 6660,  'Una mujer regresa al orfanato donde creció y descubre una presencia sobrenatural.', '+16', DATE '2023-11-01', 'N', 1, 6);
INSERT INTO CONTENIDO VALUES (12,'Origen',                        2010, 7560,  'Un ladrón que extrae secretos del subconsciente debe realizar una misión imposible.', '+13', DATE '2023-12-12', 'N', 1, 5);
INSERT INTO CONTENIDO VALUES (13,'Amor de Cuarentena',            2021, 6120,  'Dos vecinos se enamoran durante la pandemia a través del balcón (Inventada).', '+13', DATE '2024-01-08', 'N', 1, 7);
INSERT INTO CONTENIDO VALUES (14,'El Último Guardián del Amazonas',2023, 7200,  'Un guardabosques lucha contra taladores ilegales en la selva (Inventada).', '+13', DATE '2024-02-14', 'S', 1, 4);

-- SERIES (id_categoria=2): 10 registros (ids 15-24)
INSERT INTO CONTENIDO VALUES (15, 'Narcos',                        2015, 2700,  'La historia real del narcotráfico en Colombia, liderado por Pablo Escobar.', '+18', DATE '2023-02-28', 'S', 2, 5);
INSERT INTO CONTENIDO VALUES (16, 'Los Ingenieros de la Nube',     2023, 2400,  'Jóvenes colombianos crean una startup tecnológica en Bogotá (Inventada).', '+13', DATE '2023-05-15', 'S', 2, 6);
INSERT INTO CONTENIDO VALUES (17, 'Club de Cuervos',               2015, 3000,  'Hermanos pelean por la presidencia de un club de fútbol mexicano.', '+7',  DATE '2023-07-20', 'N', 2, 4);
INSERT INTO CONTENIDO VALUES (18, 'La Reina del Flow',             2018, 2700,  'Una compositora regresa a Medellín para vengarse de quien la traicionó.', '+16', DATE '2023-09-01', 'N', 2, 7);
INSERT INTO CONTENIDO VALUES (19, 'QuindioFlix Kids Aventuras',    2023, 1800,  'Una serie animada de animales que exploran el Eje Cafetero (Inventada).', 'TP',  DATE '2023-10-15', 'S', 2, 5);
INSERT INTO CONTENIDO VALUES (20, 'Dark',                          2017, 2880,  'Cuatro familias buscan respuestas tras la desaparición de un niño en un pueblo alemán.', '+16', DATE '2024-01-20', 'N', 2, 6);
INSERT INTO CONTENIDO VALUES (21, 'La Fiscal',                     2022, 2520,  'Una fiscal de la DEA persigue a una poderosa familia de narcos (Inventada).', '+13', DATE '2024-03-10', 'S', 2, 4);
INSERT INTO CONTENIDO VALUES (22, 'Cumbia de la Abuela',           2021, 2160,  'Una joven descubre sus raíces a través de la cumbia colombiana (Inventada).', '+7',  DATE '2024-04-05', 'N', 2, 7);
INSERT INTO CONTENIDO VALUES (23, 'El Coronel no tiene quien le escriba', 2022, 3120, 'Adaptación de García Márquez sobre un veterano de guerra en un pueblo olvidado.', '+16', DATE '2024-05-18', 'S', 2, 5);
INSERT INTO CONTENIDO VALUES (24, 'Mr. Robot',                     2015, 2640,  'Un ingeniero de seguridad y hacker con trastorno de identidad lucha contra una corporación.', '+13', DATE '2024-06-22', 'S', 2, 6);

-- DOCUMENTALES (id_categoria=3): 7 registros (ids 25-31)
INSERT INTO CONTENIDO VALUES (25, 'Nuestro Planeta: Colombia',     2020, 5400,  'Exploración de la biodiversidad única de los Andes y el Amazonas.', 'TP',  DATE '2023-03-18', 'N', 3, 4);
INSERT INTO CONTENIDO VALUES (26, 'Colombia: Tierra de Paz',       2022, 6300,  'Historias de reconciliación en zonas rurales después del conflicto (Inventada).', '+13', DATE '2023-06-10', 'S', 3, 6);
INSERT INTO CONTENIDO VALUES (27, 'Cafe: Alma de Colombia',        2023, 4800,  'Documental sobre la tradición cafetera del Quindío y su impacto social.', 'TP',  DATE '2023-09-25', 'S', 3, 5);
INSERT INTO CONTENIDO VALUES (28, 'Rios Sagrados',                 2021, 5100,  'La crisis ambiental en los ríos Magdalena y Cauca (Inventada).', '+7',  DATE '2024-01-30', 'N', 3, 7);
INSERT INTO CONTENIDO VALUES (29, 'Mujeres al Poder',              2022, 5700,  'Líderes comunitarias que transforman sus territorios (Inventada).', '+13', DATE '2024-03-22', 'S', 3, 4);
INSERT INTO CONTENIDO VALUES (30, 'Gastronomia del Quindio',       2021, 4500,  'Recorrido por los sabores tradicionales de la región (Inventada).', 'TP',  DATE '2024-05-08', 'N', 3, 6);
INSERT INTO CONTENIDO VALUES (31, 'Tesoros Ocultos de Colombia',   2023, 5200,  'Arquitectura colonial y moderna en ciudades patrimonio (Inventada).', '+7',  DATE '2024-07-01', 'N', 3, 5);

-- MUSICA (id_categoria=4): 5 registros (ids 32-36)
INSERT INTO CONTENIDO VALUES (32, 'Shakira: En Vivo desde Bogota', 2022, 7200,  'Concierto histórico de Shakira en el Estadio El Campín.', 'TP',  DATE '2023-04-12', 'N', 4, 7);
INSERT INTO CONTENIDO VALUES (33, 'Karol G: Mañana Sera Bonito Tour', 2023, 8100, 'La gira mundial de Karol G, grabada en Medellín.', '+7',  DATE '2023-08-30', 'N', 4, 4);
INSERT INTO CONTENIDO VALUES (34, 'Los Diablitos del Vallenato',   2021, 5400,  'Los mejores éxitos de la agrupación vallenata (Inventada).', 'TP',  DATE '2024-02-01', 'N', 4, 5);
INSERT INTO CONTENIDO VALUES (35, 'Urbanos: Reggaeton desde la Calle', 2022, 3600, 'Recopilación de artistas urbanos colombianos (Inventada).', '+13', DATE '2024-04-18', 'N', 4, 6);
INSERT INTO CONTENIDO VALUES (36, 'Cantos de Mi Tierra',           2023, 4200,  'Música folclórica y campesina del Quindío (Inventada).', 'TP',  DATE '2024-06-10', 'S', 4, 7);

-- PODCASTS (id_categoria=5): 4 registros (ids 37-40)
INSERT INTO CONTENIDO VALUES (37, 'Radio Ambulante',               2023, 3600,  'Historias reales de Latinoamérica narradas por sus protagonistas.', '+7',  DATE '2023-10-01', 'N', 5, 4);
INSERT INTO CONTENIDO VALUES (38, 'Colombia en Datos',             2022, 2700,  'Análisis económico y social con expertos (Inventada).', '+13', DATE '2024-01-10', 'N', 5, 5);
INSERT INTO CONTENIDO VALUES (39, 'El Hilo',                       2023, 3000,  'Investigación periodística sobre derechos humanos en Colombia.', '+7',  DATE '2024-03-05', 'S', 5, 6);
INSERT INTO CONTENIDO VALUES (40, 'La Cruda Legal',                2022, 3300,  'Abogados analizan casos judiciales de alto perfil (Inventada).', '+16', DATE '2024-05-20', 'N', 5, 7);

-- 7. CONTENIDO_GENERO (asignacion multiple de generos por contenido)

-- El Ultimo Vuelo: Drama + Suspenso
INSERT INTO CONTENIDO_GENERO VALUES (1,  3); INSERT INTO CONTENIDO_GENERO VALUES (1,  4);
-- Raices de Fuego: Drama
INSERT INTO CONTENIDO_GENERO VALUES (2,  3);
-- La Ciudad Invisible: Ciencia Ficcion + Suspenso
INSERT INTO CONTENIDO_GENERO VALUES (3,  4); INSERT INTO CONTENIDO_GENERO VALUES (3,  6);
-- Cuentos del Rio: Infantil
INSERT INTO CONTENIDO_GENERO VALUES (4,  8);
-- Noche sin Retorno: Terror + Suspenso
INSERT INTO CONTENIDO_GENERO VALUES (5,  4); INSERT INTO CONTENIDO_GENERO VALUES (5,  7);
-- Galaxia Perdida: Accion + Ciencia Ficcion
INSERT INTO CONTENIDO_GENERO VALUES (6,  1); INSERT INTO CONTENIDO_GENERO VALUES (6,  6);
-- La Promesa del Valle: Romance + Drama
INSERT INTO CONTENIDO_GENERO VALUES (7,  3); INSERT INTO CONTENIDO_GENERO VALUES (7,  5);
-- Codigo Rojo: Accion
INSERT INTO CONTENIDO_GENERO VALUES (8,  1);
-- El Gran Chiste: Comedia
INSERT INTO CONTENIDO_GENERO VALUES (9,  2);
-- Sombras del Pasado: Drama
INSERT INTO CONTENIDO_GENERO VALUES (10, 3);
-- Monstruo del Paramo: Terror
INSERT INTO CONTENIDO_GENERO VALUES (11, 7);
-- Viaje a la Semilla: Ciencia Ficcion
INSERT INTO CONTENIDO_GENERO VALUES (12, 6);
-- Amor en Cuarentena: Comedia + Romance
INSERT INTO CONTENIDO_GENERO VALUES (13, 2); INSERT INTO CONTENIDO_GENERO VALUES (13, 5);
-- El Ultimo Guardabosques: Accion + Drama
INSERT INTO CONTENIDO_GENERO VALUES (14, 1); INSERT INTO CONTENIDO_GENERO VALUES (14, 3);
-- Series
INSERT INTO CONTENIDO_GENERO VALUES (15, 4); INSERT INTO CONTENIDO_GENERO VALUES (15, 3); -- Medellin Noir
INSERT INTO CONTENIDO_GENERO VALUES (16, 3);                                               -- Los Ingenieros
INSERT INTO CONTENIDO_GENERO VALUES (17, 1);                                               -- Pacifico Salvaje
INSERT INTO CONTENIDO_GENERO VALUES (18, 3); INSERT INTO CONTENIDO_GENERO VALUES (18, 5); -- Secretos de Familia
INSERT INTO CONTENIDO_GENERO VALUES (19, 8); INSERT INTO CONTENIDO_GENERO VALUES (19, 2); -- QuindioFlix Kids
INSERT INTO CONTENIDO_GENERO VALUES (20, 6); INSERT INTO CONTENIDO_GENERO VALUES (20, 4); -- Cronos
INSERT INTO CONTENIDO_GENERO VALUES (21, 4); INSERT INTO CONTENIDO_GENERO VALUES (21, 3); -- La Fiscal
INSERT INTO CONTENIDO_GENERO VALUES (22,10); INSERT INTO CONTENIDO_GENERO VALUES (22, 5); -- Cumbia Forever
INSERT INTO CONTENIDO_GENERO VALUES (23, 3);                                               -- El Corregidor
INSERT INTO CONTENIDO_GENERO VALUES (24, 4); INSERT INTO CONTENIDO_GENERO VALUES (24, 6); -- Hacker Nation
-- Documentales
INSERT INTO CONTENIDO_GENERO VALUES (25, 9);  -- Biodiversidad Andina
INSERT INTO CONTENIDO_GENERO VALUES (26, 9);  -- Colombia Invisible
INSERT INTO CONTENIDO_GENERO VALUES (27, 9);  -- El Cafe y la Vida
INSERT INTO CONTENIDO_GENERO VALUES (28, 9);  -- Rios en Peligro
INSERT INTO CONTENIDO_GENERO VALUES (29, 3);  -- Mujeres Valientes
INSERT INTO CONTENIDO_GENERO VALUES (30, 9);  -- Gastronomia Regional
INSERT INTO CONTENIDO_GENERO VALUES (31, 9);  -- Arquitectura Invisible
-- Musica
INSERT INTO CONTENIDO_GENERO VALUES (32,10);  -- Carlos Vives
INSERT INTO CONTENIDO_GENERO VALUES (33,10);  -- Selena Gomez
INSERT INTO CONTENIDO_GENERO VALUES (34,10);  -- Clasicos Vallenato
INSERT INTO CONTENIDO_GENERO VALUES (35,10);  -- Beats Urbanos
INSERT INTO CONTENIDO_GENERO VALUES (36,10);  -- Cantos Tradicionales

-- 8. CONTENIDO_RELACIONADO (secuelas y spin-offs)

-- Galaxia Perdida -> secuela de Viaje a la Semilla
INSERT INTO CONTENIDO_RELACIONADO VALUES (12, 6,  'SECUELA',          'Galaxia Perdida es la continuacion de Viaje a la Semilla');
-- Medellin Noir -> spin-off de La Fiscal
INSERT INTO CONTENIDO_RELACIONADO VALUES (15, 21, 'SPIN_OFF',         'Comparten universo narrativo en el mundo juridico colombiano');
-- Cronos -> version extendida conceptual de Viaje a la Semilla
INSERT INTO CONTENIDO_RELACIONADO VALUES (20, 12, 'VERSION_EXTENDIDA','Cronos expande el universo temporal de Galaxia Perdida');


-- 9. TEMPORADAS (15 registros: series y podcasts)

-- Medellin Noir (id=15): 3 temporadas
INSERT INTO TEMPORADAS VALUES (seq_temporadas.NEXTVAL, 15, 1, 'Los Años de Plomo',   2022);
INSERT INTO TEMPORADAS VALUES (seq_temporadas.NEXTVAL, 15, 2, 'La Traicion',         2023);
INSERT INTO TEMPORADAS VALUES (seq_temporadas.NEXTVAL, 15, 3, 'El Ultimo Cartel',    2024);
-- Los Ingenieros (id=16): 2 temporadas
INSERT INTO TEMPORADAS VALUES (seq_temporadas.NEXTVAL, 16, 1, 'El Arranque',         2023);
INSERT INTO TEMPORADAS VALUES (seq_temporadas.NEXTVAL, 16, 2, 'La Expansion',        2024);
-- Pacifico Salvaje (id=17): 2 temporadas
INSERT INTO TEMPORADAS VALUES (seq_temporadas.NEXTVAL, 17, 1, 'Olas del Norte',      2021);
INSERT INTO TEMPORADAS VALUES (seq_temporadas.NEXTVAL, 17, 2, 'Marea Alta',          2022);
-- QuindioFlix Kids (id=19): 2 temporadas
INSERT INTO TEMPORADAS VALUES (seq_temporadas.NEXTVAL, 19, 1, 'Aventuras en el Bosque', 2023);
INSERT INTO TEMPORADAS VALUES (seq_temporadas.NEXTVAL, 19, 2, 'El Rio Magico',          2024);
-- Cronos (id=20): 2 temporadas
INSERT INTO TEMPORADAS VALUES (seq_temporadas.NEXTVAL, 20, 1, 'El Origen',           2022);
INSERT INTO TEMPORADAS VALUES (seq_temporadas.NEXTVAL, 20, 2, 'La Paradoja',         2023);
-- Tecnologia Hoy podcast (id=37): 2 temporadas
INSERT INTO TEMPORADAS VALUES (seq_temporadas.NEXTVAL, 37, 1, 'IA y el Futuro',      2023);
INSERT INTO TEMPORADAS VALUES (seq_temporadas.NEXTVAL, 37, 2, 'La Nueva Economia',   2024);
-- Historias de Vida podcast (id=39): 1 temporada
INSERT INTO TEMPORADAS VALUES (seq_temporadas.NEXTVAL, 39, 1, 'Testimonios 2023',    2023);
-- Colombia en Cifras podcast (id=38): 1 temporada
INSERT INTO TEMPORADAS VALUES (seq_temporadas.NEXTVAL, 38, 1, 'Temporada 2022',      2022);

-- 10. EPISODIOS (50 registros distribuidos en las temporadas)

-- Medellin Noir T1 (id_temporada=1): 6 episodios
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 1, 1, 'El Inicio del Fin',          2700, 'Primer capitulo: llegada de un nuevo capo.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 1, 2, 'Alianzas Peligrosas',        2580, 'Los carteles se reorganizan.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 1, 3, 'Sangre en el Asfalto',       2640, 'La ciudad se convierte en campo de batalla.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 1, 4, 'El Infiltrado',              2700, 'Un detective se mete en las filas del cartel.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 1, 5, 'La Gran Redada',             2820, 'La policia cierra el cerco.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 1, 6, 'Fuego Cruzado',              3000, 'Climax de la primera temporada.');
-- Medellin Noir T2 (id_temporada=2): 6 episodios
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 2, 1, 'Nuevos Jugadores',           2700, 'Llegan nuevos actores al conflicto.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 2, 2, 'La Red Invisible',           2640, 'Descubren una red de corrupcion.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 2, 3, 'Traicion',                   2760, 'Un aliado resulta ser el enemigo.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 2, 4, 'El Precio del Silencio',     2700, 'Un testigo clave desaparece.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 2, 5, 'Punto de Quiebre',           2820, 'La situacion escala a nivel nacional.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 2, 6, 'Sin Retorno',                3120, 'Final de temporada con giro impactante.');
-- Medellin Noir T3 (id_temporada=3): 5 episodios
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 3, 1, 'El Final Empieza',           2700, 'La caida del ultimo cartel.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 3, 2, 'Cazadores de Sombras',       2760, 'Unidad especial entra en accion.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 3, 3, 'La Ultima Jugada',           2880, 'El capo ejecuta su plan final.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 3, 4, 'Medellin Libre',             3000, 'La ciudad respira por primera vez.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 3, 5, 'Eplogo',                     1800, 'Cierre de todos los arcos narrativos.');
-- Los Ingenieros T1 (id_temporada=4): 5 episodios
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 4, 1, 'La Startup',                 2400, 'Cinco ingenieros crean una empresa.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 4, 2, 'El Primer Millon',           2400, 'Logran su primera ronda de inversion.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 4, 3, 'Caos Organizado',            2400, 'Los problemas de escalar rapido.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 4, 4, 'El Competidor',              2520, 'Una empresa rival amenaza su proyecto.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 4, 5, 'La Decision',               2640, 'Vender o seguir independientes.');
-- Los Ingenieros T2 (id_temporada=5): 4 episodios
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 5, 1, 'Nueva Etapa',               2400, 'La empresa enfrenta su mayor reto.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 5, 2, 'Internacionalizacion',       2520, 'Expansion hacia mercados extranjeros.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 5, 3, 'Crisis de Identidad',        2400, 'El equipo fundador se fractura.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 5, 4, 'Reinvencion',               2640, 'Final de temporada: un nuevo comienzo.');
-- QuindioFlix Kids T1 (id_temporada=8): 6 episodios
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 8, 1, 'El Bosque Encantado',        1800, 'Primer aventura de los amigos del bosque.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 8, 2, 'La Semilla Magica',          1800, 'Descubren una planta especial.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 8, 3, 'El Rio Habla',               1800, 'El rio guarda un secreto.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 8, 4, 'Colores del Arcoiris',       1800, 'Aprenden sobre los colores de la naturaleza.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 8, 5, 'La Gran Tormenta',           1800, 'Trabajo en equipo para enfrentar la lluvia.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL, 8, 6, 'Festival del Bosque',        1800, 'Celebracion de la naturaleza.');
-- Tecnologia Hoy T1 (id_temporada=12): 4 episodios (podcast)
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL,12, 1, 'IA Generativa en 2024',      3600, 'Revision del estado del arte.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL,12, 2, 'Big Data y Privacidad',       3300, 'El debate sobre los datos personales.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL,12, 3, 'Blockchain: mas alla del Hype', 3600, 'Casos reales de uso de blockchain.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL,12, 4, 'El Futuro del Trabajo',      3900, 'Automatizacion y empleo en Colombia.');
-- Historias de Vida T1 (id_temporada=14): 4 episodios (podcast)
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL,14, 1, 'De Cero a Emprendedor',      3000, 'Historia de una mujer que fundo su empresa.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL,14, 2, 'El Regreso al Campo',        2700, 'Profesional que volvio al campo.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL,14, 3, 'Superar lo Imposible',       3300, 'Deportista paralimpico colombiano.');
INSERT INTO EPISODIOS VALUES (seq_episodios.NEXTVAL,14, 4, 'La Maestra del Pacifico',    2700, 'Educadora en zona rural.');

-- 11. USUARIOS (30 registros)

-- BOGOTA - Premium (ids 1-6)
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Camila Torres',    'c.torres@gmail.com',    '3001234567', DATE '1992-04-12', 'Bogota',   'ACTIVO',   DATE '2023-01-15', 3, NULL);
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Esteban Mora',     'e.mora@gmail.com',      '3109876543', DATE '1988-07-22', 'Bogota',   'ACTIVO',   DATE '2023-02-10', 3, NULL);
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Daniela Ruiz',     'd.ruiz@yahoo.com',      '3201122334', DATE '1995-11-30', 'Bogota',   'ACTIVO',   DATE '2023-03-05', 3, 1);
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Nicolas Hoyos',    'n.hoyos@hotmail.com',   '3155566778', DATE '1990-02-14', 'Bogota',   'ACTIVO',   DATE '2023-04-20', 3, 1);
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Valentina Parra',  'v.parra@gmail.com',     '3203344556', DATE '1997-08-05', 'Bogota',   'ACTIVO',   DATE '2023-05-11', 3, 2);
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Andres Castaño',   'a.castano@gmail.com',   '3112233445', DATE '1985-12-25', 'Bogota',   'INACTIVO', DATE '2023-06-30', 3, NULL);
-- BOGOTA - Estandar (ids 7-10)
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Luisa Fernandez',  'l.fernandez@gmail.com', '3007788990', DATE '1993-06-18', 'Bogota',   'ACTIVO',   DATE '2023-07-14', 2, NULL);
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Sergio Vargas',    's.vargas@outlook.com',  '3168899001', DATE '1991-09-09', 'Bogota',   'ACTIVO',   DATE '2023-08-22', 2, 7);
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Carolina Lozano',  'c.lozano@gmail.com',    '3200011223', DATE '1996-01-28', 'Bogota',   'ACTIVO',   DATE '2023-09-18', 2, NULL);
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'David Herrera',    'd.herrera@gmail.com',   '3151234560', DATE '1989-05-15', 'Bogota',   'ACTIVO',   DATE '2023-10-05', 2, NULL);
-- BOGOTA - Basico (ids 11-12)
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Martha Reyes',     'm.reyes@gmail.com',     '3003344556', DATE '1975-03-22', 'Bogota',   'ACTIVO',   DATE '2023-11-01', 1, NULL);
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Jorge Castro',     'j.castro@hotmail.com',  '3134455667', DATE '2000-10-10', 'Bogota',   'INACTIVO', DATE '2023-12-12', 1, NULL);
-- BOGOTA - Premium adicionales (ids 13-14)
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Paola Mendoza',    'p.mendoza@gmail.com',   '3175566778', DATE '1994-07-04', 'Bogota',   'ACTIVO',   DATE '2024-01-08', 3, 2);
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Ricardo Suarez',   'r.suarez@gmail.com',    '3206677889', DATE '1987-11-19', 'Bogota',   'ACTIVO',   DATE '2024-02-14', 3, NULL);

-- MEDELLIN - Premium (ids 15-18)
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Isabel Gomez',     'i.gomez@gmail.com',     '3047788990', DATE '1993-02-28', 'Medellin', 'ACTIVO',   DATE '2023-01-20', 3, NULL);
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Tomas Arango',     't.arango@gmail.com',     '3178899001', DATE '1990-06-11', 'Medellin', 'ACTIVO',   DATE '2023-03-15', 3, 15);
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Natalia Vega',     'n.vega@yahoo.com',      '3200122334', DATE '1998-09-23', 'Medellin', 'ACTIVO',   DATE '2023-05-28', 3, NULL);
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Camilo Diaz',      'ca.diaz@gmail.com',     '3153344556', DATE '1986-04-07', 'Medellin', 'ACTIVO',   DATE '2023-07-10', 3, NULL);
-- MEDELLIN - Estandar (ids 19-22)
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Adriana Medina',   'a.medina@gmail.com',    '3005566778', DATE '1992-12-15', 'Medellin', 'ACTIVO',   DATE '2023-09-05', 2, NULL);
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Mauricio Soto',    'm.soto@outlook.com',    '3136677889', DATE '1995-03-30', 'Medellin', 'ACTIVO',   DATE '2023-11-18', 2, 19);
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Sandra Escobar',   's.escobar@gmail.com',   '3207788990', DATE '1988-08-12', 'Medellin', 'INACTIVO', DATE '2024-01-05', 2, NULL);
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Gustavo Pinto',    'g.pinto@gmail.com',     '3158899001', DATE '1997-05-20', 'Medellin', 'ACTIVO',   DATE '2024-03-22', 2, NULL);
-- MEDELLIN - Basico (ids 23-24)
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Ana Rojas',        'ana.rojas@gmail.com',   '3000011223', DATE '1982-07-08', 'Medellin', 'ACTIVO',   DATE '2024-04-15', 1, NULL);
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Luis Cano',        'l.cano@gmail.com',      '3131122334', DATE '2001-02-14', 'Medellin', 'ACTIVO',   DATE '2024-05-30', 1, NULL);

-- CALI - Premium (ids 25-27)
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Gloria Mena',      'g.mena@gmail.com',      '3165566778', DATE '1991-10-03', 'Cali',     'ACTIVO',   DATE '2023-02-28', 3, NULL);
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Fernando Palacios','f.palacios@hotmail.com','3206677890', DATE '1989-01-17', 'Cali',     'ACTIVO',   DATE '2023-06-10', 3, 25);
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Marcela Hurtado',  'm.hurtado@gmail.com',   '3007788991', DATE '1994-04-25', 'Cali',     'ACTIVO',   DATE '2023-09-20', 3, NULL);
-- CALI - Estandar (ids 28-28)
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Jose Caicedo',     'j.caicedo@gmail.com',   '3138899002', DATE '1996-11-08', 'Cali',     'ACTIVO',   DATE '2024-01-15', 2, NULL);
-- CALI - Basico (ids 29-30)
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Rosa Guerrero',    'r.guerrero@gmail.com',  '3200122335', DATE '1978-06-30', 'Cali',     'ACTIVO',   DATE '2024-03-10', 1, NULL);
INSERT INTO USUARIOS VALUES (seq_usuarios.NEXTVAL,'Pedro Valencia',   'p.valencia@yahoo.com',  '3151234561', DATE '2002-09-14', 'Cali',     'INACTIVO', DATE '2024-05-05', 1, NULL);

-- 12. PERFILES (50 registros distribuidos asimetricamente)

-- Usuario 1 (Premium): 4 perfiles
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL, 1, 'Camila',     'avatar1.png', 'ADULTO');
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL, 1, 'Ninos',      'kids1.png',   'INFANTIL');
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL, 1, 'Esposo',     'avatar2.png', 'ADULTO');
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL, 1, 'Abuela',     'avatar3.png', 'ADULTO');
-- Usuario 2 (Premium): 3 perfiles
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL, 2, 'Esteban',    'avatar4.png', 'ADULTO');
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL, 2, 'Esposa',     'avatar5.png', 'ADULTO');
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL, 2, 'Hijo',       'kids2.png',   'INFANTIL');
-- Usuario 3 (Premium): 2 perfiles
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL, 3, 'Daniela',    'avatar6.png', 'ADULTO');
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL, 3, 'Junior',     'kids3.png',   'INFANTIL');
-- Usuario 4 (Premium): 2 perfiles
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL, 4, 'Nicolas',    'avatar7.png', 'ADULTO');
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL, 4, 'Valentina',  'avatar8.png', 'ADULTO');
-- Usuario 5 (Premium): 3 perfiles
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL, 5, 'Vale',       'avatar9.png', 'ADULTO');
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL, 5, 'Papa',       'avatar10.png','ADULTO');
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL, 5, 'Bebe',       'kids4.png',   'INFANTIL');
-- Usuario 7 (Estandar): 2 perfiles
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL, 7, 'Luisa',      'avatar11.png','ADULTO');
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL, 7, 'Peque',      'kids5.png',   'INFANTIL');
-- Usuario 8 (Estandar): 2 perfiles
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL, 8, 'Sergio',     'avatar12.png','ADULTO');
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL, 8, 'Gamer',      'avatar13.png','ADULTO');
-- Usuario 9 (Estandar): 1 perfil
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL, 9, 'Carolina',   'avatar14.png','ADULTO');
-- Usuario 10 (Estandar): 3 perfiles
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,10, 'David',      'avatar15.png','ADULTO');
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,10, 'Mama',       'avatar16.png','ADULTO');
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,10, 'Niña',       'kids6.png',   'INFANTIL');
-- Usuario 11 (Basico): 1 perfil
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,11, 'Martha',     'avatar17.png','ADULTO');
-- Usuario 13 (Premium): 2 perfiles
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,13, 'Paola',      'avatar18.png','ADULTO');
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,13, 'Compañero',  'avatar19.png','ADULTO');
-- Usuario 14 (Premium): 2 perfiles
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,14, 'Ricardo',    'avatar20.png','ADULTO');
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,14, 'Familia',    'avatar21.png','ADULTO');
-- Usuario 15 (Premium): 3 perfiles
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,15, 'Isabel',     'avatar22.png','ADULTO');
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,15, 'Novio',      'avatar23.png','ADULTO');
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,15, 'Nena',       'kids7.png',   'INFANTIL');
-- Usuario 16 (Premium): 2 perfiles
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,16, 'Tomas',      'avatar24.png','ADULTO');
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,16, 'Amigo',      'avatar25.png','ADULTO');
-- Usuario 17 (Premium): 2 perfiles
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,17, 'Natalia',    'avatar26.png','ADULTO');
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,17, 'Pareja',     'avatar27.png','ADULTO');
-- Usuario 19 (Estandar): 2 perfiles
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,19, 'Adriana',    'avatar28.png','ADULTO');
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,19, 'Hijo',       'kids8.png',   'INFANTIL');
-- Usuario 20 (Estandar): 1 perfil
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,20, 'Mauricio',   'avatar29.png','ADULTO');
-- Usuario 22 (Estandar): 2 perfiles
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,22, 'Gustavo',    'avatar30.png','ADULTO');
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,22, 'Novia',      'avatar31.png','ADULTO');
-- Usuario 23 (Basico): 1 perfil
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,23, 'Ana',        'avatar32.png','ADULTO');
-- Usuario 24 (Basico): 1 perfil
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,24, 'Luis',       'avatar33.png','ADULTO');
-- Usuario 25 (Premium): 4 perfiles
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,25, 'Gloria',     'avatar34.png','ADULTO');
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,25, 'Esposo',     'avatar35.png','ADULTO');
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,25, 'Tia',        'avatar36.png','ADULTO');
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,25, 'Peque',      'kids9.png',   'INFANTIL');
-- Usuario 26 (Premium): 2 perfiles
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,26, 'Fernando',   'avatar37.png','ADULTO');
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,26, 'Gemela',     'avatar38.png','ADULTO');
-- Usuario 27 (Premium): 2 perfiles
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,27, 'Marcela',    'avatar39.png','ADULTO');
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,27, 'Hermana',    'avatar40.png','ADULTO');
-- Usuario 28 (Estandar): 1 perfil
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,28, 'Jose',       'avatar41.png','ADULTO');
-- Usuario 29 (Basico): 1 perfil
INSERT INTO PERFILES VALUES (seq_perfiles.NEXTVAL,29, 'Rosa',       'avatar42.png','ADULTO');

-- 13. PAGOS (80 registros: historial de varios meses, algunos fallidos)

-- Usuarios Bogota Premium (exitosos, multiples meses)
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL,  1, DATE '2024-01-15', 34900, 'TARJETA_CREDITO', 'EXITOSO',    DATE '2024-02-15');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL,  1, DATE '2024-02-15', 34900, 'TARJETA_CREDITO', 'EXITOSO',    DATE '2024-03-15');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL,  1, DATE '2024-03-15', 31410, 'TARJETA_CREDITO', 'EXITOSO',    DATE '2024-04-15'); -- descuento referido
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL,  2, DATE '2024-01-10', 34900, 'NEQUI',           'EXITOSO',    DATE '2024-02-10');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL,  2, DATE '2024-02-10', 34900, 'NEQUI',           'EXITOSO',    DATE '2024-03-10');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL,  2, DATE '2024-03-10', 34900, 'NEQUI',           'EXITOSO',    DATE '2024-04-10');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL,  3, DATE '2024-01-05', 29665, 'PSE',             'EXITOSO',    DATE '2024-02-05'); -- descuento referido
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL,  3, DATE '2024-02-05', 34900, 'PSE',             'EXITOSO',    DATE '2024-03-05');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL,  4, DATE '2024-01-20', 29665, 'TARJETA_DEBITO',  'EXITOSO',    DATE '2024-02-20');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL,  4, DATE '2024-02-20', 34900, 'TARJETA_DEBITO',  'EXITOSO',    DATE '2024-03-20');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL,  5, DATE '2024-01-11', 29665, 'DAVIPLATA',       'EXITOSO',    DATE '2024-02-11');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL,  5, DATE '2024-02-11', 34900, 'DAVIPLATA',       'EXITOSO',    DATE '2024-03-11');
-- Usuario 6 (INACTIVO): pago fallido
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL,  6, DATE '2023-12-30', 34900, 'TARJETA_CREDITO', 'FALLIDO',    DATE '2024-01-30');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL,  6, DATE '2024-01-15', 34900, 'TARJETA_CREDITO', 'FALLIDO',    DATE '2024-02-15');
-- Bogota Estandar
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL,  7, DATE '2024-01-14', 24900, 'NEQUI',           'EXITOSO',    DATE '2024-02-14');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL,  7, DATE '2024-02-14', 24900, 'NEQUI',           'EXITOSO',    DATE '2024-03-14');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL,  7, DATE '2024-03-14', 24900, 'NEQUI',           'EXITOSO',    DATE '2024-04-14');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL,  8, DATE '2024-01-22', 21165, 'PSE',             'EXITOSO',    DATE '2024-02-22'); -- descuento
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL,  8, DATE '2024-02-22', 24900, 'PSE',             'EXITOSO',    DATE '2024-03-22');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL,  9, DATE '2024-01-18', 24900, 'TARJETA_CREDITO', 'EXITOSO',    DATE '2024-02-18');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 10, DATE '2024-01-05', 24900, 'DAVIPLATA',       'EXITOSO',    DATE '2024-02-05');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 10, DATE '2024-02-05', 24900, 'DAVIPLATA',       'PENDIENTE',  DATE '2024-03-05');
-- Bogota Basico
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 11, DATE '2024-01-01', 14900, 'NEQUI',           'EXITOSO',    DATE '2024-02-01');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 11, DATE '2024-02-01', 14900, 'NEQUI',           'EXITOSO',    DATE '2024-03-01');
-- Usuario 12 (INACTIVO)
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 12, DATE '2023-11-12', 14900, 'PSE',             'FALLIDO',    DATE '2023-12-12');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 12, DATE '2023-12-12', 14900, 'PSE',             'FALLIDO',    DATE '2024-01-12');
-- Bogota Premium adicionales
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 13, DATE '2024-01-08', 29665, 'TARJETA_CREDITO', 'EXITOSO',    DATE '2024-02-08');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 14, DATE '2024-02-14', 34900, 'NEQUI',           'EXITOSO',    DATE '2024-03-14');
-- Medellin Premium
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 15, DATE '2024-01-20', 34900, 'TARJETA_CREDITO', 'EXITOSO',    DATE '2024-02-20');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 15, DATE '2024-02-20', 34900, 'TARJETA_CREDITO', 'EXITOSO',    DATE '2024-03-20');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 15, DATE '2024-03-20', 31410, 'TARJETA_CREDITO', 'EXITOSO',    DATE '2024-04-20');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 16, DATE '2024-01-15', 29665, 'DAVIPLATA',       'EXITOSO',    DATE '2024-02-15');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 17, DATE '2024-01-28', 34900, 'PSE',             'EXITOSO',    DATE '2024-02-28');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 17, DATE '2024-02-28', 34900, 'PSE',             'EXITOSO',    DATE '2024-03-28');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 18, DATE '2024-01-10', 34900, 'NEQUI',           'EXITOSO',    DATE '2024-02-10');
-- Medellin Estandar
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 19, DATE '2024-01-05', 24900, 'TARJETA_DEBITO',  'EXITOSO',    DATE '2024-02-05');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 19, DATE '2024-02-05', 24900, 'TARJETA_DEBITO',  'EXITOSO',    DATE '2024-03-05');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 20, DATE '2024-01-18', 21165, 'NEQUI',           'EXITOSO',    DATE '2024-02-18');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 20, DATE '2024-02-18', 24900, 'NEQUI',           'EXITOSO',    DATE '2024-03-18');
-- Usuario 21 (INACTIVO)
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 21, DATE '2023-12-05', 24900, 'PSE',             'FALLIDO',    DATE '2024-01-05');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 21, DATE '2024-01-05', 24900, 'PSE',             'REEMBOLSADO',DATE '2024-02-05');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 22, DATE '2024-02-22', 24900, 'TARJETA_CREDITO', 'EXITOSO',    DATE '2024-03-22');
-- Medellin Basico
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 23, DATE '2024-02-15', 14900, 'NEQUI',           'EXITOSO',    DATE '2024-03-15');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 24, DATE '2024-03-30', 14900, 'DAVIPLATA',       'EXITOSO',    DATE '2024-04-30');
-- Cali Premium
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 25, DATE '2024-01-28', 34900, 'TARJETA_CREDITO', 'EXITOSO',    DATE '2024-02-28');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 25, DATE '2024-02-28', 34900, 'TARJETA_CREDITO', 'EXITOSO',    DATE '2024-03-28');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 26, DATE '2024-01-10', 29665, 'PSE',             'EXITOSO',    DATE '2024-02-10');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 26, DATE '2024-02-10', 34900, 'PSE',             'EXITOSO',    DATE '2024-03-10');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 27, DATE '2024-01-20', 34900, 'NEQUI',           'EXITOSO',    DATE '2024-02-20');
-- Cali Estandar
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 28, DATE '2024-02-15', 24900, 'DAVIPLATA',       'EXITOSO',    DATE '2024-03-15');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 28, DATE '2024-03-15', 24900, 'DAVIPLATA',       'PENDIENTE',  DATE '2024-04-15');
-- Cali Basico
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 29, DATE '2024-03-10', 14900, 'NEQUI',           'EXITOSO',    DATE '2024-04-10');
-- Usuario 30 (INACTIVO Cali)
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 30, DATE '2024-02-05', 14900, 'PSE',             'FALLIDO',    DATE '2024-03-05');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 30, DATE '2024-03-05', 14900, 'PSE',             'FALLIDO',    DATE '2024-04-05');
-- Pagos adicionales para completar 80 (meses extras en usuarios activos)
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL,  1, DATE '2024-04-15', 34900, 'TARJETA_CREDITO', 'EXITOSO',    DATE '2024-05-15');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL,  2, DATE '2024-04-10', 34900, 'NEQUI',           'EXITOSO',    DATE '2024-05-10');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 15, DATE '2024-04-20', 34900, 'TARJETA_CREDITO', 'EXITOSO',    DATE '2024-05-20');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 25, DATE '2024-03-28', 34900, 'TARJETA_CREDITO', 'EXITOSO',    DATE '2024-04-28');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL,  7, DATE '2024-04-14', 24900, 'NEQUI',           'EXITOSO',    DATE '2024-05-14');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 19, DATE '2024-03-05', 24900, 'TARJETA_DEBITO',  'EXITOSO',    DATE '2024-04-05');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL,  3, DATE '2024-03-05', 34900, 'PSE',             'EXITOSO',    DATE '2024-04-05');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 17, DATE '2024-03-28', 34900, 'PSE',             'EXITOSO',    DATE '2024-04-28');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 18, DATE '2024-02-10', 34900, 'NEQUI',           'EXITOSO',    DATE '2024-03-10');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL,  9, DATE '2024-02-18', 24900, 'TARJETA_CREDITO', 'EXITOSO',    DATE '2024-03-18');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 27, DATE '2024-02-20', 34900, 'NEQUI',           'EXITOSO',    DATE '2024-03-20');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 14, DATE '2024-03-14', 34900, 'NEQUI',           'EXITOSO',    DATE '2024-04-14');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 22, DATE '2024-03-22', 24900, 'TARJETA_CREDITO', 'EXITOSO',    DATE '2024-04-22');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 13, DATE '2024-02-08', 34900, 'TARJETA_CREDITO', 'EXITOSO',    DATE '2024-03-08');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 26, DATE '2024-03-10', 34900, 'PSE',             'EXITOSO',    DATE '2024-04-10');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 16, DATE '2024-02-15', 34900, 'DAVIPLATA',       'EXITOSO',    DATE '2024-03-15');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL, 11, DATE '2024-03-01', 14900, 'NEQUI',           'EXITOSO',    DATE '2024-04-01');
INSERT INTO PAGOS VALUES (seq_pagos.NEXTVAL,  4, DATE '2024-03-20', 34900, 'TARJETA_DEBITO',  'EXITOSO',    DATE '2024-04-20');

-- 14. REPRODUCCIONES (200 registros)

-- Bloque 1: Perfiles Bogota (ids 1-14), peliculas y series, variedad de dispositivos
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  1,  1, NULL, TIMESTAMP '2024-01-16 20:00:00', TIMESTAMP '2024-01-16 22:02:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  1,  2, NULL, TIMESTAMP '2024-01-20 21:00:00', TIMESTAMP '2024-01-20 23:15:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  1,  6, NULL, TIMESTAMP '2024-02-05 19:30:00', TIMESTAMP '2024-02-05 22:00:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  1, 15,  1,   TIMESTAMP '2024-02-10 20:00:00', TIMESTAMP '2024-02-10 20:45:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  1, 15,  2,   TIMESTAMP '2024-02-11 20:00:00', TIMESTAMP '2024-02-11 20:43:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  1, 15,  3,   TIMESTAMP '2024-02-12 20:00:00', TIMESTAMP '2024-02-12 20:44:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  2,  8, NULL, TIMESTAMP '2024-01-17 22:00:00', TIMESTAMP '2024-01-17 23:57:00', 'COMPUTADOR',  100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  2,  3, NULL, TIMESTAMP '2024-02-01 21:00:00', TIMESTAMP '2024-02-01 22:55:00', 'COMPUTADOR',  100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  2, 20,  7,   TIMESTAMP '2024-02-15 21:00:00', TIMESTAMP '2024-02-15 21:48:00', 'COMPUTADOR',  100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  2, 20,  8,   TIMESTAMP '2024-02-16 21:00:00', TIMESTAMP '2024-02-16 21:44:00', 'COMPUTADOR',   85);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  3, 12, NULL, TIMESTAMP '2024-01-25 20:00:00', TIMESTAMP '2024-01-25 22:06:00', 'CELULAR',     100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  3,  7, NULL, TIMESTAMP '2024-02-08 19:00:00', TIMESTAMP '2024-02-08 20:45:00', 'CELULAR',     100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  3, 25, NULL, TIMESTAMP '2024-02-20 18:00:00', TIMESTAMP '2024-02-20 19:30:00', 'CELULAR',     100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  4,  5, NULL, TIMESTAMP '2024-01-22 23:00:00', TIMESTAMP '2024-01-23 01:10:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  4, 11, NULL, TIMESTAMP '2024-02-14 22:00:00', TIMESTAMP '2024-02-14 23:51:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  5, 13, NULL, TIMESTAMP '2024-01-30 20:00:00', TIMESTAMP '2024-01-30 21:36:00', 'TABLET',      100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  5, 16, 16,   TIMESTAMP '2024-02-03 20:00:00', TIMESTAMP '2024-02-03 20:40:00', 'TABLET',      100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  5, 16, 17,   TIMESTAMP '2024-02-04 20:00:00', TIMESTAMP '2024-02-04 20:40:00', 'TABLET',       90);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  6, 10, NULL, TIMESTAMP '2023-12-10 21:00:00', TIMESTAMP '2023-12-10 23:18:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  8,  1, NULL, TIMESTAMP '2024-01-18 20:00:00', TIMESTAMP '2024-01-18 22:02:00', 'COMPUTADOR',  100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  8,  2, NULL, TIMESTAMP '2024-01-25 21:00:00', TIMESTAMP '2024-01-25 23:15:00', 'COMPUTADOR',  100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  8,  6, NULL, TIMESTAMP '2024-02-07 20:00:00', TIMESTAMP '2024-02-07 22:24:00', 'COMPUTADOR',  100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  9, 21, 22,   TIMESTAMP '2024-02-10 19:00:00', TIMESTAMP '2024-02-10 19:42:00', 'CELULAR',     100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  9, 21, 23,   TIMESTAMP '2024-02-11 19:00:00', TIMESTAMP '2024-02-11 19:44:00', 'CELULAR',      60);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 10,  3, NULL, TIMESTAMP '2024-01-06 21:00:00', TIMESTAMP '2024-01-06 22:55:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 10,  8, NULL, TIMESTAMP '2024-02-07 22:00:00', TIMESTAMP '2024-02-07 23:57:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 11, 26, NULL, TIMESTAMP '2024-01-02 20:00:00', TIMESTAMP '2024-01-02 21:45:00', 'CELULAR',     100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 11, 27, NULL, TIMESTAMP '2024-02-02 18:00:00', TIMESTAMP '2024-02-02 19:20:00', 'CELULAR',     100);
-- Perfiles infantiles (ids 2, 7, 14): solo contenido TP o +7
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  2,  4, NULL, TIMESTAMP '2024-01-21 16:00:00', TIMESTAMP '2024-01-21 17:30:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  2, 19, 30,   TIMESTAMP '2024-02-17 17:00:00', TIMESTAMP '2024-02-17 17:30:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  7, 19, 31,   TIMESTAMP '2024-02-18 16:00:00', TIMESTAMP '2024-02-18 16:30:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  7, 19, 32,   TIMESTAMP '2024-02-19 16:00:00', TIMESTAMP '2024-02-19 16:30:00', 'TV',           80);

-- Bloque 2: Perfiles Medellin (ids 15-33)
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 15,  2, NULL, TIMESTAMP '2024-01-21 20:00:00', TIMESTAMP '2024-01-21 22:15:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 15, 15,  1,   TIMESTAMP '2024-01-28 20:00:00', TIMESTAMP '2024-01-28 20:45:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 15, 15,  2,   TIMESTAMP '2024-01-29 20:00:00', TIMESTAMP '2024-01-29 20:43:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 15, 15,  3,   TIMESTAMP '2024-01-30 20:00:00', TIMESTAMP '2024-01-30 20:44:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 15, 15,  4,   TIMESTAMP '2024-01-31 20:00:00', TIMESTAMP '2024-01-31 20:45:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 15, 15,  5,   TIMESTAMP '2024-02-01 20:00:00', TIMESTAMP '2024-02-01 20:47:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 16,  8, NULL, TIMESTAMP '2024-01-16 22:00:00', TIMESTAMP '2024-01-16 23:57:00', 'COMPUTADOR',  100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 16, 12, NULL, TIMESTAMP '2024-02-05 21:00:00', TIMESTAMP '2024-02-05 23:06:00', 'COMPUTADOR',  100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 16, 24, 37,   TIMESTAMP '2024-02-20 20:00:00', TIMESTAMP '2024-02-20 21:00:00', 'COMPUTADOR',  100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 16, 24, 38,   TIMESTAMP '2024-02-21 20:00:00', TIMESTAMP '2024-02-21 20:55:00', 'COMPUTADOR',   95);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 17,  1, NULL, TIMESTAMP '2024-01-29 21:00:00', TIMESTAMP '2024-01-29 23:02:00', 'CELULAR',     100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 17,  5, NULL, TIMESTAMP '2024-02-16 22:00:00', TIMESTAMP '2024-02-17 00:10:00', 'CELULAR',     100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 17, 11, NULL, TIMESTAMP '2024-03-01 21:30:00', TIMESTAMP '2024-03-01 23:21:00', 'CELULAR',     100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 18,  6, NULL, TIMESTAMP '2024-01-11 20:00:00', TIMESTAMP '2024-01-11 22:24:00', 'TABLET',      100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 18, 14, NULL, TIMESTAMP '2024-02-11 20:30:00', TIMESTAMP '2024-02-11 22:30:00', 'TABLET',      100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 19,  3, NULL, TIMESTAMP '2024-01-06 20:00:00', TIMESTAMP '2024-01-06 21:55:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 19, 16, 16,   TIMESTAMP '2024-02-06 20:00:00', TIMESTAMP '2024-02-06 20:40:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 19, 16, 17,   TIMESTAMP '2024-02-07 20:00:00', TIMESTAMP '2024-02-07 20:40:00', 'TV',           70);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 20, 15,  6,   TIMESTAMP '2024-02-19 21:00:00', TIMESTAMP '2024-02-19 21:50:00', 'COMPUTADOR',  100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 20, 15,  7,   TIMESTAMP '2024-02-20 21:00:00', TIMESTAMP '2024-02-20 21:45:00', 'COMPUTADOR',  100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 21, 10, NULL, TIMESTAMP '2023-12-06 21:00:00', TIMESTAMP '2023-12-06 23:18:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 22,  7, NULL, TIMESTAMP '2024-02-23 20:00:00', TIMESTAMP '2024-02-23 21:45:00', 'TABLET',      100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 22, 13, NULL, TIMESTAMP '2024-03-01 21:00:00', TIMESTAMP '2024-03-01 22:42:00', 'TABLET',      100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 23, 29, NULL, TIMESTAMP '2024-02-16 18:00:00', TIMESTAMP '2024-02-16 19:35:00', 'CELULAR',     100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 24, 30, NULL, TIMESTAMP '2024-03-31 17:00:00', TIMESTAMP '2024-03-31 18:15:00', 'CELULAR',     100);
-- Perfil infantil (id 29): serie kids
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 29, 19, 30,   TIMESTAMP '2024-02-29 15:00:00', TIMESTAMP '2024-02-29 15:30:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 29, 19, 31,   TIMESTAMP '2024-03-01 15:00:00', TIMESTAMP '2024-03-01 15:30:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 29,  4, NULL, TIMESTAMP '2024-03-02 16:00:00', TIMESTAMP '2024-03-02 17:30:00', 'TV',          100);

-- Bloque 3: Perfiles Cali (ids 34-43)
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 34,  1, NULL, TIMESTAMP '2024-01-29 21:00:00', TIMESTAMP '2024-01-29 23:02:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 34, 15,  1,   TIMESTAMP '2024-02-05 20:00:00', TIMESTAMP '2024-02-05 20:45:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 34, 15,  2,   TIMESTAMP '2024-02-06 20:00:00', TIMESTAMP '2024-02-06 20:43:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 34, 25, NULL, TIMESTAMP '2024-02-15 18:30:00', TIMESTAMP '2024-02-15 20:00:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 35,  2, NULL, TIMESTAMP '2024-01-11 21:00:00', TIMESTAMP '2024-01-11 23:15:00', 'COMPUTADOR',  100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 35, 14, NULL, TIMESTAMP '2024-02-11 20:00:00', TIMESTAMP '2024-02-11 22:00:00', 'COMPUTADOR',  100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 35, 16, 18,   TIMESTAMP '2024-02-22 20:00:00', TIMESTAMP '2024-02-22 20:40:00', 'COMPUTADOR',  100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 36,  6, NULL, TIMESTAMP '2024-01-21 20:00:00', TIMESTAMP '2024-01-21 22:24:00', 'TABLET',      100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 36, 12, NULL, TIMESTAMP '2024-02-21 21:00:00', TIMESTAMP '2024-02-21 23:06:00', 'TABLET',       75);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 38,  3, NULL, TIMESTAMP '2024-02-16 21:00:00', TIMESTAMP '2024-02-16 22:55:00', 'CELULAR',     100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 38, 21, 22,   TIMESTAMP '2024-02-25 20:00:00', TIMESTAMP '2024-02-25 20:42:00', 'CELULAR',     100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 39, 10, NULL, TIMESTAMP '2024-03-01 20:00:00', TIMESTAMP '2024-03-01 22:18:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 40,  9, NULL, TIMESTAMP '2024-03-11 20:00:00', TIMESTAMP '2024-03-11 21:36:00', 'TV',          100);
-- Perfil infantil Cali (id 37)
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 37,  4, NULL, TIMESTAMP '2024-02-18 15:00:00', TIMESTAMP '2024-02-18 16:30:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 37, 19, 30,   TIMESTAMP '2024-02-25 16:00:00', TIMESTAMP '2024-02-25 16:30:00', 'TV',          100);

-- Bloque 4: musica, documentales y podcasts (menor volumen pero representados)
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  1, 32, NULL, TIMESTAMP '2024-03-10 18:00:00', TIMESTAMP '2024-03-10 20:00:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  8, 33, NULL, TIMESTAMP '2024-03-15 17:00:00', TIMESTAMP '2024-03-15 19:15:00', 'COMPUTADOR',  100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 15, 34, NULL, TIMESTAMP '2024-02-28 19:00:00', TIMESTAMP '2024-02-28 20:30:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 19, 35, NULL, TIMESTAMP '2024-03-20 20:00:00', TIMESTAMP '2024-03-20 21:00:00', 'CELULAR',     100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 34, 36, NULL, TIMESTAMP '2024-03-25 17:00:00', TIMESTAMP '2024-03-25 18:10:00', 'TABLET',      100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  5, 37, 41,   TIMESTAMP '2024-02-28 08:00:00', TIMESTAMP '2024-02-28 09:00:00', 'CELULAR',     100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 10, 37, 42,   TIMESTAMP '2024-03-05 08:30:00', TIMESTAMP '2024-03-05 09:25:00', 'CELULAR',      92);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 22, 39, 45,   TIMESTAMP '2024-03-18 07:30:00', TIMESTAMP '2024-03-18 08:20:00', 'CELULAR',     100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 16, 26, NULL, TIMESTAMP '2024-03-12 19:00:00', TIMESTAMP '2024-03-12 20:45:00', 'COMPUTADOR',  100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 17, 27, NULL, TIMESTAMP '2024-03-02 19:30:00', TIMESTAMP '2024-03-02 21:05:00', 'TV',          100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 20, 28, NULL, TIMESTAMP '2024-03-08 18:00:00', TIMESTAMP '2024-03-08 19:25:00', 'TABLET',      100);

-- Bloque 5: reproducciones adicionales para completar 200 (meses anteriores)
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  1,  9, NULL, TIMESTAMP '2023-12-20 20:00:00', TIMESTAMP '2023-12-20 21:36:00', 'TV',           100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  2, 14, NULL, TIMESTAMP '2023-11-15 21:00:00', TIMESTAMP '2023-11-15 23:00:00', 'TV',           100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  3,  4, NULL, TIMESTAMP '2023-10-18 16:00:00', TIMESTAMP '2023-10-18 17:30:00', 'TABLET',       100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  4,  7, NULL, TIMESTAMP '2023-11-22 20:00:00', TIMESTAMP '2023-11-22 21:45:00', 'TV',           100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  5, 10, NULL, TIMESTAMP '2023-10-30 21:00:00', TIMESTAMP '2023-10-30 23:18:00', 'COMPUTADOR',   100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  8, 11, NULL, TIMESTAMP '2023-11-05 22:00:00', TIMESTAMP '2023-11-05 23:51:00', 'COMPUTADOR',   100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  9, 12, NULL, TIMESTAMP '2023-12-01 20:00:00', TIMESTAMP '2023-12-01 22:06:00', 'CELULAR',      100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 10, 13, NULL, TIMESTAMP '2023-12-15 20:00:00', TIMESTAMP '2023-12-15 21:42:00', 'TV',           100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 15,  6, NULL, TIMESTAMP '2023-11-10 20:00:00', TIMESTAMP '2023-11-10 22:24:00', 'TV',           100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 15,  8, NULL, TIMESTAMP '2023-12-08 22:00:00', TIMESTAMP '2023-12-08 23:57:00', 'TV',           100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 16,  3, NULL, TIMESTAMP '2023-11-18 21:00:00', TIMESTAMP '2023-11-18 22:55:00', 'COMPUTADOR',   100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 17,  9, NULL, TIMESTAMP '2023-12-20 20:00:00', TIMESTAMP '2023-12-20 21:36:00', 'CELULAR',      100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 18,  2, NULL, TIMESTAMP '2023-11-25 21:00:00', TIMESTAMP '2023-11-25 23:15:00', 'TABLET',       100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 19, 14, NULL, TIMESTAMP '2023-12-28 20:30:00', TIMESTAMP '2023-12-28 22:30:00', 'TV',           100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 20,  1, NULL, TIMESTAMP '2023-10-10 20:00:00', TIMESTAMP '2023-10-10 22:02:00', 'COMPUTADOR',   100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 22,  8, NULL, TIMESTAMP '2023-11-14 22:00:00', TIMESTAMP '2023-11-14 23:57:00', 'TABLET',       100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 34,  5, NULL, TIMESTAMP '2023-12-05 23:00:00', TIMESTAMP '2023-12-06 01:10:00', 'TV',           100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 35,  7, NULL, TIMESTAMP '2023-11-20 20:00:00', TIMESTAMP '2023-11-20 21:45:00', 'COMPUTADOR',   100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 36, 11, NULL, TIMESTAMP '2023-12-22 21:00:00', TIMESTAMP '2023-12-22 22:51:00', 'TABLET',       100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 38, 13, NULL, TIMESTAMP '2023-10-25 20:00:00', TIMESTAMP '2023-10-25 21:42:00', 'CELULAR',      100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 39,  6, NULL, TIMESTAMP '2023-11-30 20:00:00', TIMESTAMP '2023-11-30 22:24:00', 'TV',           100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 40,  4, NULL, TIMESTAMP '2023-12-14 15:30:00', TIMESTAMP '2023-12-14 17:00:00', 'TV',            80);
-- Reproducciones incompletas (porcentaje < 90%) para pruebas de triggers
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  5, 20,  9,   TIMESTAMP '2024-03-05 21:00:00', TIMESTAMP '2024-03-05 21:25:00', 'TABLET',        45);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 16, 21, 24,   TIMESTAMP '2024-03-06 22:00:00', TIMESTAMP '2024-03-06 22:28:00', 'COMPUTADOR',    50);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 22, 15, 10,   TIMESTAMP '2024-03-07 20:00:00', TIMESTAMP '2024-03-07 20:30:00', 'TABLET',        55);
-- Reproducciones adicionales variadas para completar el bloque
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  1, 16, 19,   TIMESTAMP '2024-03-15 21:00:00', TIMESTAMP '2024-03-15 21:42:00', 'TV',           100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  2, 17,  1,   TIMESTAMP '2024-03-16 20:00:00', TIMESTAMP '2024-03-16 20:50:00', 'COMPUTADOR',   100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  4, 18, NULL, TIMESTAMP '2024-03-17 19:00:00', TIMESTAMP '2024-03-17 20:45:00', 'TV',           100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL,  8, 19, 33,   TIMESTAMP '2024-03-18 16:30:00', TIMESTAMP '2024-03-18 17:00:00', 'TV',           100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 10, 22, 35,   TIMESTAMP '2024-03-20 20:00:00', TIMESTAMP '2024-03-20 20:36:00', 'TABLET',       100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 15, 23, 17,   TIMESTAMP '2024-03-21 20:00:00', TIMESTAMP '2024-03-21 20:42:00', 'TV',           100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 17, 24, 39,   TIMESTAMP '2024-03-22 20:00:00', TIMESTAMP '2024-03-22 21:05:00', 'CELULAR',      100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 19, 20, 10,   TIMESTAMP '2024-03-23 21:00:00', TIMESTAMP '2024-03-23 21:48:00', 'TV',           100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 25, 21, 25,   TIMESTAMP '2024-03-25 20:00:00', TIMESTAMP '2024-03-25 20:42:00', 'COMPUTADOR',   100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 36,  8, NULL, TIMESTAMP '2024-03-27 22:00:00', TIMESTAMP '2024-03-27 23:57:00', 'TV',           100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 38,  6, NULL, TIMESTAMP '2024-03-29 20:00:00', TIMESTAMP '2024-03-29 22:24:00', 'CELULAR',      100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 39, 15,  6,   TIMESTAMP '2024-04-02 20:00:00', TIMESTAMP '2024-04-02 20:50:00', 'TV',           100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 40, 16, 20,   TIMESTAMP '2024-04-03 20:00:00', TIMESTAMP '2024-04-03 20:40:00', 'TV',           100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 41,  1, NULL, TIMESTAMP '2024-04-05 21:00:00', TIMESTAMP '2024-04-05 23:02:00', 'COMPUTADOR',   100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 42,  2, NULL, TIMESTAMP '2024-04-06 21:00:00', TIMESTAMP '2024-04-06 23:15:00', 'TABLET',       100);
INSERT INTO REPRODUCCIONES VALUES (seq_reproducciones.NEXTVAL, 43,  9, NULL, TIMESTAMP '2024-04-07 20:00:00', TIMESTAMP '2024-04-07 21:36:00', 'CELULAR',      100);

-- 15. CALIFICACIONES (60 registros: solo perfiles que reprodujeron >= 50%)

INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL,  1,  1, 5, 'Excelente pelicula, me mantuvo en suspenso toda la noche.',     DATE '2024-01-17');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL,  1,  2, 4, 'Muy buen drama, aunque el final pudo ser mejor.',               DATE '2024-01-21');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL,  1,  6, 5, 'La mejor pelicula de ciencia ficcion que he visto.',            DATE '2024-02-06');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL,  2,  8, 4, 'Accion sin parar, pero la trama es algo plana.',                DATE '2024-01-18');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL,  2,  3, 5, 'El futuro que imaginamos. Guion impecable.',                    DATE '2024-02-02');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL,  3, 12, 5, 'Sorprendente. No esperaba ese giro al final.',                  DATE '2024-01-26');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL,  3,  7, 4, 'Bonita historia de amor, muy colombiana.',                     DATE '2024-02-09');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL,  3, 25, 3, 'Documental interesante, un poco largo para mi gusto.',         DATE '2024-02-21');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL,  4,  5, 3, 'El terror no era tan intenso como esperaba.',                  DATE '2024-01-24');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL,  4, 11, 4, 'Buena pelicula de terror colombiana, nueva propuesta.',        DATE '2024-02-15');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL,  5, 13, 5, 'Me rei muchisimo, la mejor comedia del catalogo.',             DATE '2024-01-31');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL,  6, 10, 4, 'Dramatica y bien actuada. Historia que no se olvida.',         DATE '2023-12-11');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL,  8,  1, 4, 'Buen vuelo hacia el drama. Recomendada.',                     DATE '2024-01-19');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL,  8,  2, 5, 'Obra maestra del cine colombiano reciente.',                  DATE '2024-01-26');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL,  8,  6, 5, 'Galaxia Perdida es espectacular en pantalla grande.',         DATE '2024-02-08');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL,  9, 21, 5, 'La Fiscal es adictiva. Termine la primera temporada en 2 dias.',DATE '2024-02-12');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 10,  3, 4, 'Muy original, la ciudad del futuro bien construida.',          DATE '2024-01-07');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 10,  8, 3, 'Accion decente pero predecible.',                             DATE '2024-02-08');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 11, 26, 5, 'Colombia Invisible te abre los ojos. Obligatorio.',            DATE '2024-01-03');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 11, 27, 4, 'El Cafe y la Vida me hizo querer visitar el Quindio.',         DATE '2024-02-03');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 15,  2, 5, 'Raices de Fuego es desgarradora y necesaria.',                DATE '2024-01-22');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 16,  8, 4, 'Codigo Rojo cumple con el genero de accion.',                 DATE '2024-01-17');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 16, 12, 5, 'Viaje a la Semilla reinventa la ciencia ficcion local.',       DATE '2024-02-06');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 17,  1, 5, 'Conmovedor y bien fotografiado.',                             DATE '2024-01-30');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 17,  5, 2, 'El terror no convenció. Clichés muy marcados.',               DATE '2024-02-17');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 17, 11, 4, 'Monstruo del Paramo es diferente, con identidad propia.',     DATE '2024-03-02');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 18,  6, 5, 'Galaxia Perdida supera a las producciones de Hollywood.',     DATE '2024-01-12');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 18, 14, 4, 'El Ultimo Guardabosques es emocionante de inicio a fin.',     DATE '2024-02-12');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 19,  3, 4, 'La Ciudad Invisible tiene un worldbuilding increible.',       DATE '2024-01-07');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 20, 15, 5, 'Medellin Noir es el mejor drama policiaco colombiano.',       DATE '2024-02-20');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 21, 10, 3, 'Historia interesante pero ritmo muy lento.',                  DATE '2023-12-07');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 22,  7, 5, 'La Promesa del Valle te da ganas de enamorarte.',             DATE '2024-02-24');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 22, 13, 4, 'Amor en Cuarentena es la pelicula que necesitabamos.',        DATE '2024-03-02');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 23, 29, 5, 'Mujeres Valientes es una leccion de vida.',                   DATE '2024-02-17');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 24, 30, 4, 'Gastronomia Regional: apetitoso y educativo.',               DATE '2024-04-01');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 34,  1, 4, 'El Ultimo Vuelo es una pelicula que te mueve.',               DATE '2024-01-30');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 34, 25, 5, 'Biodiversidad Andina: el Quindio es maravilloso.',            DATE '2024-02-16');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 35,  2, 5, 'Raices de Fuego: cine colombiano en su mejor momento.',       DATE '2024-01-12');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 35, 14, 4, 'Aventura en la selva bien ejecutada.',                       DATE '2024-02-12');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 36,  6, 4, 'Galaxia Perdida: visual impactante, historia solida.',        DATE '2024-01-22');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 38,  3, 5, 'Magistral construccion de un mundo futuro.',                  DATE '2024-02-17');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 39, 10, 4, 'Sombras del Pasado deberia verse en los colegios.',           DATE '2024-03-02');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 40,  9, 3, 'Comedia simpática pero sin grandes sorpresas.',               DATE '2024-03-12');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 15, 34, 5, 'Clasicos del Vallenato: patrimonio musical de Colombia.',     DATE '2024-02-29');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 19, 35, 4, 'Beats Urbanos: la energia del genero urbano bien capturada.', DATE '2024-03-21');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 34, 36, 5, 'Cantos Tradicionales: una ventana a nuestras raices.',        DATE '2024-03-26');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL,  5, 37, 5, 'Tecnologia Hoy es el podcast que todo nerd necesita.',        DATE '2024-02-29');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 22, 39, 5, 'Historias de Vida te motiva y te hace reflexionar.',          DATE '2024-03-19');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 16, 26, 4, 'Colombia Invisible: reportaje valiente y honesto.',           DATE '2024-03-13');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 17, 27, 4, 'El Cafe y la Vida: sencillo, hermoso y muy informativo.',     DATE '2024-03-03');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 20, 28, 5, 'Rios en Peligro: la alarma que necesitamos escuchar.',        DATE '2024-03-09');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL,  8, 33, 4, 'Concierto energico, la mejor produccion del año.',            DATE '2024-03-16');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL,  1, 32, 5, 'Carlos Vives En Vivo: una noche magica que quedo grabada.',   DATE '2024-03-11');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 36, 12, 3, 'Buen concepto, pero pudo profundizar mas en la trama.',       DATE '2024-02-22');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 19, 14, 5, 'El Ultimo Guardabosques es una aventura sin igual.',          DATE '2024-02-29');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 25, 21, 4, 'La Fiscal tiene mucha tension y buenos dialogos.',            DATE '2024-03-26');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 35,  7, 4, 'La Promesa del Valle: romantica y autentica.',                DATE '2024-03-10');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 39, 15, 5, 'Medellin Noir es impactante desde el primer episodio.',       DATE '2024-04-03');
INSERT INTO CALIFICACIONES VALUES (seq_calificaciones.NEXTVAL, 40, 16, 4, 'Los Ingenieros: me identifique mucho con los personajes.',    DATE '2024-04-04');

-- 16. FAVORITOS (40 registros)
INSERT INTO FAVORITOS VALUES (1,  1,  DATE '2024-01-17');
INSERT INTO FAVORITOS VALUES (1,  6,  DATE '2024-02-06');
INSERT INTO FAVORITOS VALUES (1, 15,  DATE '2024-02-13');
INSERT INTO FAVORITOS VALUES (2,  2,  DATE '2024-01-22');
INSERT INTO FAVORITOS VALUES (2,  8,  DATE '2024-01-19');
INSERT INTO FAVORITOS VALUES (2, 20,  DATE '2024-02-17');
INSERT INTO FAVORITOS VALUES (3, 12,  DATE '2024-01-26');
INSERT INTO FAVORITOS VALUES (3,  7,  DATE '2024-02-10');
INSERT INTO FAVORITOS VALUES (4,  5,  DATE '2024-01-24');
INSERT INTO FAVORITOS VALUES (4, 11,  DATE '2024-02-15');
INSERT INTO FAVORITOS VALUES (5, 13,  DATE '2024-01-31');
INSERT INTO FAVORITOS VALUES (5, 16,  DATE '2024-02-05');
INSERT INTO FAVORITOS VALUES (8,  1,  DATE '2024-01-20');
INSERT INTO FAVORITOS VALUES (8,  6,  DATE '2024-02-08');
INSERT INTO FAVORITOS VALUES (9, 21,  DATE '2024-02-12');
INSERT INTO FAVORITOS VALUES (10, 3,  DATE '2024-01-08');
INSERT INTO FAVORITOS VALUES (11, 26, DATE '2024-01-03');
INSERT INTO FAVORITOS VALUES (15, 15, DATE '2024-02-02');
INSERT INTO FAVORITOS VALUES (15, 34, DATE '2024-02-29');
INSERT INTO FAVORITOS VALUES (16, 12, DATE '2024-02-07');
INSERT INTO FAVORITOS VALUES (16, 24, DATE '2024-02-22');
INSERT INTO FAVORITOS VALUES (17, 11, DATE '2024-03-03');
INSERT INTO FAVORITOS VALUES (18,  6, DATE '2024-01-12');
INSERT INTO FAVORITOS VALUES (19,  3, DATE '2024-01-08');
INSERT INTO FAVORITOS VALUES (20, 15, DATE '2024-02-21');
INSERT INTO FAVORITOS VALUES (22,  7, DATE '2024-02-25');
INSERT INTO FAVORITOS VALUES (23, 29, DATE '2024-02-17');
INSERT INTO FAVORITOS VALUES (24, 30, DATE '2024-04-01');
INSERT INTO FAVORITOS VALUES (34,  1, DATE '2024-01-30');
INSERT INTO FAVORITOS VALUES (34, 25, DATE '2024-02-16');
INSERT INTO FAVORITOS VALUES (35,  2, DATE '2024-01-13');
INSERT INTO FAVORITOS VALUES (36,  6, DATE '2024-01-23');
INSERT INTO FAVORITOS VALUES (38,  3, DATE '2024-02-18');
INSERT INTO FAVORITOS VALUES (39, 10, DATE '2024-03-03');
INSERT INTO FAVORITOS VALUES (40,  9, DATE '2024-03-12');
INSERT INTO FAVORITOS VALUES ( 5, 37, DATE '2024-03-01');
INSERT INTO FAVORITOS VALUES (22, 39, DATE '2024-03-20');
INSERT INTO FAVORITOS VALUES ( 1, 32, DATE '2024-03-11');
INSERT INTO FAVORITOS VALUES (19, 35, DATE '2024-03-22');
INSERT INTO FAVORITOS VALUES (20, 28, DATE '2024-03-10');

-- 17. REPORTES (10 registros con diferentes estados)
INSERT INTO REPORTES VALUES (seq_reportes.NEXTVAL,  4,  5, 'Contenido sexual explicito inapropiado para la clasificacion +18', DATE '2024-02-01', 'RESUELTO',   1, DATE '2024-02-03', 'Verificado: el contenido tiene clasificacion correcta. Reporte rechazado.');
INSERT INTO REPORTES VALUES (seq_reportes.NEXTVAL,  9, 15, 'Imagen en miniatura engañosa, no refleja el contenido',            DATE '2024-02-10', 'RESUELTO',  15, DATE '2024-02-12', 'Se actualizo la miniatura del contenido. Reporte valido.');
INSERT INTO REPORTES VALUES (seq_reportes.NEXTVAL, 17, 11, 'Escenas de violencia extrema sin aviso previo',                    DATE '2024-02-20', 'EN_REVISION', 1, NULL, NULL);
INSERT INTO REPORTES VALUES (seq_reportes.NEXTVAL, 22, 18, 'El audio tiene problemas de calidad graves en varios capitulos',   DATE '2024-03-01', 'RESUELTO',  15, DATE '2024-03-05', 'Problema tecnico de audio corregido por el equipo de contenido.');
INSERT INTO REPORTES VALUES (seq_reportes.NEXTVAL,  8, 20, 'La descripcion del contenido contiene spoilers importantes',       DATE '2024-03-10', 'PENDIENTE', NULL, NULL, NULL);
INSERT INTO REPORTES VALUES (seq_reportes.NEXTVAL, 36, 21, 'Contenido politicamente sesgado presentado como objetivo',         DATE '2024-03-15', 'RESUELTO',   1, DATE '2024-03-18', 'El contenido es ficcion, no presenta informacion real como objetiva.');
INSERT INTO REPORTES VALUES (seq_reportes.NEXTVAL, 20, 24, 'Episodios fuera de orden en la plataforma',                        DATE '2024-03-20', 'RESUELTO',  15, DATE '2024-03-22', 'Error de metadatos corregido. Episodios reordenados.');
INSERT INTO REPORTES VALUES (seq_reportes.NEXTVAL, 34, 15, 'Subtitulos en español incorrectos y con errores gramaticales',     DATE '2024-03-25', 'EN_REVISION',15, NULL, NULL);
INSERT INTO REPORTES VALUES (seq_reportes.NEXTVAL, 40, 35, 'La musica tiene derechos de autor no autorizados',                 DATE '2024-04-01', 'PENDIENTE', NULL, NULL, NULL);
INSERT INTO REPORTES VALUES (seq_reportes.NEXTVAL, 16, 16, 'La tercera temporada no continua la historia de la segunda',       DATE '2024-04-05', 'PENDIENTE', NULL, NULL, NULL);

-- COMMIT FINAL
COMMIT;
/*
SELECT 'PLANES'         AS tabla, COUNT(*) AS total FROM PLANES         UNION ALL
SELECT 'USUARIOS',       COUNT(*) FROM USUARIOS        UNION ALL
SELECT 'PERFILES',       COUNT(*) FROM PERFILES         UNION ALL
SELECT 'CATEGORIAS',     COUNT(*) FROM CATEGORIAS       UNION ALL
SELECT 'GENEROS',        COUNT(*) FROM GENEROS          UNION ALL
SELECT 'CONTENIDO',      COUNT(*) FROM CONTENIDO        UNION ALL
SELECT 'TEMPORADAS',     COUNT(*) FROM TEMPORADAS       UNION ALL
SELECT 'EPISODIOS',      COUNT(*) FROM EPISODIOS        UNION ALL
SELECT 'EMPLEADOS',      COUNT(*) FROM EMPLEADOS        UNION ALL
SELECT 'DEPARTAMENTOS',  COUNT(*) FROM DEPARTAMENTOS    UNION ALL
SELECT 'REPRODUCCIONES', COUNT(*) FROM REPRODUCCIONES  UNION ALL
SELECT 'CALIFICACIONES', COUNT(*) FROM CALIFICACIONES  UNION ALL
SELECT 'PAGOS',          COUNT(*) FROM PAGOS            UNION ALL
SELECT 'FAVORITOS',      COUNT(*) FROM FAVORITOS        UNION ALL
SELECT 'REPORTES',       COUNT(*) FROM REPORTES;
*/
