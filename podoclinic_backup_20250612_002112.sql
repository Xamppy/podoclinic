-- Script para restaurar datos específicos en una base de datos existente.
-- ADVERTENCIA: Este script borrará los datos actuales de las tablas listadas.

-- 1. Limpiar los datos existentes de las tablas relacionadas
-- Se usa TRUNCATE por ser más rápido para borrar todas las filas.
-- RESTART IDENTITY reinicia los contadores de ID.
-- CASCADE se encarga de las tablas relacionadas por llaves foráneas.
TRUNCATE 
    public.citas_tratamiento,
    public.pacientes_paciente,
    public.insumos_insumo
RESTART IDENTITY CASCADE;

-- 2. Copiar los datos del respaldo a las tablas limpias

-- Datos para: citas_tratamiento
COPY public.citas_tratamiento (id, nombre, descripcion, duracion_minutos, precio) FROM stdin;
1	hongos	Uñas con hongos (Onicomicosis)	60	0.00
2	manicura	Manicura	60	0.00
3	encarnada	Uña encarnada (Onicocriptosis)	60	0.00
4	general	Podología general	60	0.00
\.

-- Datos para: insumos_insumo (Stock)
COPY public.insumos_insumo (id, nombre, descripcion, unidad_medida, stock_actual, stock_critico, ultima_actualizacion, fecha_vencimiento, valor_unitario) FROM stdin;
2	Alcohol	Alcohol 95%	Aplicacion	97	100	2025-06-01 00:26:11.688269+00	2025-12-25	40
1	Guante Nitrilo Azul	Guantes de Nitrilo Azul Caja de 100 unidades	Par	145	50	2025-06-01 00:45:49.429285+00	2999-09-09	300
3	Toallita Isoprol	Toallita con alcohol	Sachet	474	100	2025-06-01 00:45:49.434934+00	2027-12-31	19
6	Gasa adhesiva 10Cm x 10MTS	Pharmafix gasa adhesiva	Rollo	396	200	2025-06-01 00:45:49.4394+00	2999-12-30	30
5	Microaplicador	Aplicador de cauterizador	Unidad	188	100	2025-06-01 00:45:49.44372+00	2999-12-30	20
7	Sabanilla clinica	Rollo papel para camilla	Rollo	718	160	2025-06-01 00:45:49.447937+00	2999-12-31	34
4	Emostatic	Cauterizador coagulante 10 ML	Aplicacion	88	80	2025-06-01 00:45:49.45217+00	2026-10-10	215
10	Cemento quirurgico	Cemento quirurgico	Aplicaciones	118	100	2025-06-01 00:45:49.457755+00	2027-04-30	150
8	Mascarillas facial		Unidad	149	50	2025-06-01 00:45:49.466812+00	2999-12-30	20
9	Lidocaina spray	Anestesia en spray	Aplicacion	29	60	2025-06-01 01:04:07.458229+00	2025-06-30	200
\.

-- Datos para: insumos_movimientoinsumo (Movimientos de Stock)
COPY public.insumos_movimientoinsumo (id, cantidad, tipo_movimiento, motivo, fecha_movimiento, insumo_id, usuario_id) FROM stdin;
1	1	salida	Uso en ficha clínica #1	2025-05-31 23:14:40.258596+00	1	1
2	1	salida	Uso en ficha clínica #2	2025-05-31 23:48:30.030646+00	1	1
3	1	salida	Uso en ficha clínica #2	2025-05-31 23:48:30.04082+00	2	1
4	1	salida	Uso en ficha clínica #2	2025-05-31 23:52:02.710407+00	1	1
5	1	salida	Uso en ficha clínica #2	2025-05-31 23:52:02.718119+00	2	1
6	2	salida	Uso en ficha clínica #2	2025-05-31 23:52:02.723063+00	3	1
7	1	salida	Uso en ficha clínica #2	2025-06-01 00:22:05.727558+00	1	1
8	1	salida	Uso en ficha clínica #2	2025-06-01 00:22:05.736504+00	2	1
9	2	salida	Uso en ficha clínica #2	2025-06-01 00:22:05.740897+00	3	1
10	4	salida	Uso en ficha clínica #2	2025-06-01 00:22:05.744898+00	3	1
11	2	salida	Uso en ficha clínica #2	2025-06-01 00:22:05.749327+00	6	1
12	6	salida	Uso en ficha clínica #2	2025-06-01 00:22:05.753648+00	5	1
13	1	salida	Uso en ficha clínica #2	2025-06-01 00:22:05.758458+00	7	1
14	6	salida	Uso en ficha clínica #2	2025-06-01 00:22:05.762681+00	4	1
15	1	salida	Uso en ficha clínica #2	2025-06-01 00:45:49.425265+00	1	1
16	2	salida	Uso en ficha clínica #2	2025-06-01 00:45:49.434147+00	3	1
17	2	salida	Uso en ficha clínica #2	2025-06-01 00:45:49.438573+00	6	1
18	6	salida	Uso en ficha clínica #2	2025-06-01 00:45:49.442928+00	5	1
19	1	salida	Uso en ficha clínica #2	2025-06-01 00:45:49.447016+00	7	1
20	6	salida	Uso en ficha clínica #2	2025-06-01 00:45:49.451424+00	4	1
21	2	salida	Uso en ficha clínica #2	2025-06-01 00:45:49.456804+00	10	1
22	1	salida	Uso en ficha clínica #2	2025-06-01 00:45:49.461402+00	9	1
23	1	salida	Uso en ficha clínica #2	2025-06-01 00:45:49.465778+00	8	1
\.

-- Datos para: pacientes_paciente
COPY public.pacientes_paciente (id, rut, nombre, telefono, correo, enfermedad_base, contacto_emergencia, caso_clinico, fecha_registro, direccion, fecha_nacimiento) FROM stdin;
1	13.214.488-5	Pablo Urra Alvarez	+56944499976	pablo.urra@hotamil.com	Onicomicosis	+56996497056	Limpieza por Onicomicosis	2025-05-31 23:08:32.699286+00	Caracoles 122	1977-08-29
2	16.287.649-K	Katherine Vasquez Valdivia	+56996497056	agro.kathy@gmail.com	No Aplica	+56944499976	No Aplica	2025-05-31 23:17:29.045087+00	Av. Santa Cruz 490 Casa 52, La Cruz	1985-10-28
3	20.796.485-9	Cristian Perez	+56995973869	perezrojocristian@gmail.com	Sano	+56982034599	Onicocriptosis severa recurrente	2025-05-31 23:33:58.279415+00	12 de Octubre 975, Quillota	2002-03-29
5	21.101.757-0	Javier Urra Araya	+569444499976	pablo.urra@hotmail.com	Ninguna	+56944499976	Onicomicosis	2025-06-10 17:29:54.188203+00	Caracoles 122, La Cruz	2002-10-10
10	12.820.313-3	rosa margarita valenzuela zoto	+56946669491	rvalenzuelazoto4@gmail.com	sana	+56946669491	onicocriptosis \\lamina involiutada	2025-06-11 03:30:41.847214+00	av.santa cruz#418 la cruz	1975-03-31
9	5.380.331-8	gabriel enrrique ordenes briones	+56992604008	walterbustos27@hotmail.com	hipertension	+56966008648	onicomicosis\\dermatomicosis interdigital	2025-06-11 03:25:02.147446+00	camino troncal paradero22 y medio    la cruz	1946-01-22
24	16.018.498-1	gonzalo andres lorca zoto	´+56999408275	gonzalolorca1985@gmail.com	sano	+56999408275	onicogrifosis\\onicocriptosis	2025-06-11 14:23:00.048125+00	av. 21 de mayo 2049 #54	1985-07-15
25	3.765.578-3	silvio alfredo meza gonzales	+56997736370	rosa.villalon1954@gmail.com	insuficiencia cardiaca \\diabetes\\hipertension	+56997736370	onicomicosis	2025-06-11 14:46:45.301047+00	calle 3 # 226  bolonia la cruz	1935-08-04
26	7.591.561-6	rosa elvira villalon navarro	+56997736370	rosa.villalon1954@gmail.com	hipertension\\ diabetes	+56997736370	onicomicosis	2025-06-11 14:52:33.554709+00	calle 3 #226 bolonia  la cruz	1954-06-17
6	12.602.275-1	Walter Eduardo Bustos Ordenes	+56966008648	walterbustos27@hotmail.com	TRANSTORNO MOTRISIDAD	+56966008648	DERMATOMICOSIS  INTERDIJITAL-PLANTAL\\HIPERQUERATOSIS\\ONICOMICOSIS\\HELOMAS	2025-06-11 01:46:54.451468+00	TRONCAL7806 PARADERO 23  LA CRUZ	1974-10-31
7	6.279.113-6	Alejandrina del Trancito Zamora Vargas	+56939378173	esmeraldapodoclinica@gmail.com	diabetes cardiopatia	+56939378173	uñas involutas dermatomicosis interdigital	2025-06-11 02:17:59.905682+00	alonso ercilla villa camino el sol 2 #55 la cruz	1943-09-25
8	11.451.599-K	Jose Braulio Olivares Mora	+56959884984	jolygenchy@gmail.com	hipertencion	+56959884984	onicocriptosis recurrente \\lamina involuta severa dermatomicosis interdigital - planta del pie	2025-06-11 03:15:21.759659+00	caletera 6 oriente parcela 1 santa lucia pocochay la cruz	1969-02-14
11	11.387.618-2	Juan Carlos Iglesias Marchant	+56997077185	esmeraldapodoclinica@gmail.com	sano	+56997077185	onicomicosis \\hiperqueratosis	2025-06-11 03:46:49.143747+00	francisco bilbao#160 villa el bosque la cruz	1969-03-20
12	18.421.292-7	Javier Ignacio Alvares Peña	+56993828587	javieralvares1993@gmail.com	diabetes\\hipertension	+56993828587	onicomicosis-onicocriptosis recurrente -laminas involutadas	2025-06-11 03:53:13.298079+00	villa padre enrrique del rio blok b #104 la cruz	1993-11-12
13	10.447.115-3	Julia Adriana Gatica Fuentes	+5694855255	hector.gallardo.g@hotmail.com	hipertension\\diabetes\\epilepcia\\asma\\tiroides	+5694855255	lamina involuta\\helomas\\dermatomicosis	2025-06-11 04:19:42.773075+00	alonso de ercilla y zuñiga #81 villa camiño el sol la cruz	1965-04-09
14	12.508.242-4	Nadia Leonora Rojo Estay	+56982034599	nadiarojoestay4394@gmail.com	sana (cancer)	+569822034599	uñas involutas \\helomas \\hiperqueratosis\\dermatomicosis\\allux valgus rigidos	2025-06-11 04:29:19.045819+00	pasaje 12 de octubre #975 poblacion reyes catolicos quillota	1972-04-19
15	13.993.329-K	Ramiro Gonsalo Olivares Castro	+56983313415	castrofrut@gmail.com	sano	+56983313415	onicocriptosis \\onicomicosis	2025-06-11 04:37:51.977661+00	av.21 de mayo # 2798	1981-04-08
16	5.448.728-2	Gladis Covili Ruiz	+56984596377	esmeraldapodoclinica@gmail.com	tiroides	+56984596377	onicocriptosis\\laminas involutas	2025-06-11 04:44:35.039731+00	caracoles #50 condominio  puerta de alcala  #1	1943-08-29
17	23.207.788-3	Nelson Alexander Cisternas Rojas	+56932254663	nelsoncisternas116@gmail.com	cardiopatia congenita \\riñon poliquistico	+56932254663	onicocriptosis recurrente \\dermatomicosis interdigital	2025-06-11 04:58:11.498+00	poblacion santa rosa calle 5 oriente #501 la cruz	2009-12-22
18	13.186.849-9	monica isabel contreras pino	+56997106194	esmeraldapodoclinica@gimail.com	sana	+56997106194	onicomicosis \\uñas involutas	2025-06-11 13:27:25.900788+00	los geraneos #5 villa jardines de la cruz comuna la cruz	1977-01-07
19	5.001.405-3	teresa de jesus contreras lopes	+56984006568	esmeraldapodoclinica@gmail.com	hipertencion\\insuficiencia renal\\insuficiencia cardiaca	+56984006568	onicomicosis \\uñas involutas	2025-06-11 13:37:18.050219+00	los geraneos #07 villa jardines de la cruz comuna de la cruz	1964-10-16
20	19.045.038-4	patricio alejandro rivera gaete	+569799233260	patricioalejandroriveragaete@gmail.com	sano	+56979233260	onicocriptosis recurrente\\uñas involutas	2025-06-11 13:43:55.901184+00	av.21 de mayo #2040	1996-05-04
21	9.542.018-4	julio enrrique galleguillos miranda	+56939021802	likke.miranda6419@gmail.com	sano	+56985433364	pie valgo\\uñas involutas	2025-06-11 13:49:28.722084+00	villa el bosque calle serguio jorquera #65 la cruz	1964-09-24
22	19.761.144-8	agustin maximiliano arias mena	+56933787030	agustin.arias@sansano.usm.cl	sano	+56933787030	hiperqueratosis	2025-06-11 14:00:32.457534+00	coquimbo #11 la calera	1998-08-22
23	15.521.150-4	pamela andrea martinez peralta	+56948892169	pame-martinez.peralta@gmail.com	asma\\rinitis	+56948892169	onicomicosis\\uñas involutas	2025-06-11 14:15:33.04014+00	villa las palmas pasaje volcan chaiten la cruz	1982-11-22
27	22.130.808-5	ricardo rodolfo saavedra meza	+56963576485	arimlap.1980@gmail.com	transtorno general en el desarrollo TDA.	+56963576485	limpieza profunda	2025-06-11 15:01:58.838326+00	calle caracoles n°50 departamento #204	2006-06-03
28	24.058.106-K	David Antonio Duran Meza	+56963576485	airmlap.1980@gmail.com	sano	+56963576485	onicocriptosis recurrente\\lamina involutada	2025-06-11 15:14:06.924574+00	calle caracoles #50 puerta de alcala torre13 #204	2012-09-05
\.

-- Datos para: citas_cita
COPY public.citas_cita (id, fecha, hora, estado, fecha_creacion, recordatorio_enviado, paciente_id, tratamiento_id, tipo_cita, duracion_extendida, duracion_cita) FROM stdin;
1	2025-05-31	20:00:00	reservada	2025-05-31 23:11:42.55874+00	f	1	1	podologia	f	60
2	2025-05-31	19:00:00	reservada	2025-05-31 23:18:19.401347+00	f	2	2	podologia	f	60
3	2025-06-05	08:00:00	reservada	2025-05-31 23:35:01.504601+00	f	3	3	podologia	f	60
4	2025-05-31	15:00:00	reservada	2025-05-31 23:41:38.529429+00	f	3	3	podologia	f	60
7	2025-06-05	08:00:00	reservada	2025-06-01 22:05:33.732786+00	f	1	2	manicura	f	60
40	2025-06-10	16:00:00	reservada	2025-06-10 17:30:12.016002+00	f	5	1	podologia	f	60
\.

-- Datos para: pacientes_fichaclinica
COPY public.pacientes_fichaclinica (id, fecha, descripcion_atencion, procedimiento, indicaciones, proxima_sesion_estimada, cita_id, paciente_id, costo_total) FROM stdin;
1	2025-05-31	Onicomicosis	Limpieza	NP27	\N	\N	1	300
3	2025-06-10	traumatismo por golpe en falangina del 1° ortejo derecho ,que se encontraba en tratamiento por padecer las dos siguientes patologías : Onicocriptosis recurrente \\lamina involutada.	se realiza limpieza  y desinfeccion , retiro de lo dañado aplicado de cemento quirurgico en bordes periungueales zona dañada extendiendola tapando toda la lamina	Se recomienda mantener reposo sin uso de calzado ajustado por tres dias	\N	\N	28	0
2	2025-05-31	Control de Onicocriptosis	Retiro de cemento quirurgico, se observa exsudacion maseracion y material purulento	Aplicar NP27  2 veces al dia, realizar revision y hacer presion en laminas dañadas, se recomendo tomar amoxicilina	\N	\N	3	2362
\.

-- Datos para: pacientes_usoproductoenficha (Uso de productos en fichas)
COPY public.pacientes_usoproductoenficha (id, cantidad, fecha_uso, ficha_id, insumo_id) FROM stdin;
1	1	2025-05-31 23:14:40.230658+00	1	1
15	1	2025-06-01 00:45:49.422354+00	2	1
16	2	2025-06-01 00:45:49.433256+00	2	3
17	2	2025-06-01 00:45:49.437592+00	2	6
18	6	2025-06-01 00:45:49.442003+00	2	5
19	1	2025-06-01 00:45:49.446067+00	2	7
20	6	2025-06-01 00:45:49.450486+00	2	4
21	2	2025-06-01 00:45:49.454771+00	2	10
22	1	2025-06-01 00:45:49.460359+00	2	9
23	1	2025-06-01 00:45:49.464854+00	2	8
\.