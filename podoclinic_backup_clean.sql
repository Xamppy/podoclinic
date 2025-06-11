-- Respaldo limpio de Podoclinic
-- Solo datos de la aplicación, sin tablas del sistema Django
-- Fecha: 2025-06-10

-- Limpiar tablas existentes (se ejecuta desde Django)
-- DELETE FROM citas_cita;
-- DELETE FROM citas_tratamiento;
-- DELETE FROM pacientes_fichaclinica;
-- DELETE FROM pacientes_usoproductoenficha;
-- DELETE FROM pacientes_paciente;
-- DELETE FROM insumos_movimientoinsumo;
-- DELETE FROM insumos_insumo;

-- Datos de Tratamientos
INSERT INTO citas_tratamiento (id, nombre, descripcion, duracion_minutos, precio) VALUES
(1, 'hongos', 'Uñas con hongos (Onicomicosis)', 60, 0.00),
(2, 'manicura', 'Manicura', 60, 0.00),
(3, 'encarnada', 'Uña encarnada (Onicocriptosis)', 60, 0.00),
(4, 'general', 'Podología general', 60, 0.00);

-- Datos de Pacientes
INSERT INTO pacientes_paciente (id, rut, nombre, telefono, correo, enfermedad_base, contacto_emergencia, caso_clinico, fecha_registro, direccion, fecha_nacimiento) VALUES
(1, '13.214.488-5', 'Pablo Urra Alvarez', '+56944499976', 'pablo.urra@hotamil.com', 'Onicomicosis', '+56996497056', 'Limpieza por Onicomicosis', '2025-05-31 23:08:32.699286+00', 'Caracoles 122', '1977-08-29'),
(2, '16.287.649-K', 'Katherine Vasquez Valdivia', '+56996497056', 'agro.kathy@gmail.com', 'No Aplica', '+56944499976', 'No Aplica', '2025-05-31 23:17:29.045087+00', 'Av. Santa Cruz 490 Casa 52, La Cruz', '1985-10-28'),
(3, '20.796.485-9', 'Cristian Perez', '+56995973869', 'perezrojocristian@gmail.com', 'Sano', '+56982034599', 'Onicocriptosis severa recurrente', '2025-05-31 23:33:58.279415+00', '12 de Octubre 975, Quillota', '2002-03-29');

-- Datos de Citas
INSERT INTO citas_cita (id, fecha, hora, estado, fecha_creacion, recordatorio_enviado, paciente_id, tratamiento_id, tipo_cita, duracion_extendida, duracion_cita) VALUES
(1, '2025-05-31', '20:00:00', 'reservada', '2025-05-31 23:11:42.55874+00', false, 1, 1, 'podologia', false, 60),
(2, '2025-05-31', '19:00:00', 'reservada', '2025-05-31 23:18:19.401347+00', false, 2, 2, 'podologia', false, 60),
(3, '2025-06-05', '08:00:00', 'reservada', '2025-05-31 23:35:01.504601+00', false, 3, 3, 'podologia', false, 60),
(4, '2025-05-31', '15:00:00', 'reservada', '2025-05-31 23:41:38.529429+00', false, 3, 3, 'podologia', false, 60),
(7, '2025-06-05', '08:00:00', 'reservada', '2025-06-01 22:05:33.732786+00', false, 1, 2, 'manicura', false, 60);

-- Datos de Insumos
INSERT INTO insumos_insumo (id, nombre, descripcion, unidad_medida, stock_actual, stock_critico, ultima_actualizacion, fecha_vencimiento, valor_unitario) VALUES
(1, 'Guante Nitrilo Azul', 'Guantes de Nitrilo Azul Caja de 100 unidades', 'Par', 145, 50, '2025-06-01 00:45:49.429285+00', '2999-09-09', 300),
(2, 'Alcohol', 'Alcohol 95%', 'Aplicacion', 97, 100, '2025-06-01 00:26:11.688269+00', '2025-12-25', 40),
(3, 'Toallita Isoprol', 'Toallita con alcohol', 'Sachet', 474, 100, '2025-06-01 00:45:49.434934+00', '2027-12-31', 19),
(4, 'Emostatic', 'Cauterizador coagulante 10 ML', 'Aplicacion', 88, 80, '2025-06-01 00:45:49.45217+00', '2026-10-10', 215),
(5, 'Microaplicador', 'Aplicador de cauterizador', 'Unidad', 188, 100, '2025-06-01 00:45:49.44372+00', '2999-12-30', 20),
(6, 'Gasa adhesiva 10Cm x 10MTS', 'Pharmafix gasa adhesiva', 'Rollo', 396, 200, '2025-06-01 00:45:49.4394+00', '2999-12-30', 30),
(7, 'Sabanilla clinica', 'Rollo papel para camilla', 'Rollo', 718, 160, '2025-06-01 00:45:49.447937+00', '2999-12-31', 34),
(8, 'Mascarillas facial', '', 'Unidad', 149, 50, '2025-06-01 00:45:49.466812+00', '2999-12-30', 20),
(9, 'Lidocaina spray', 'Anestesia en spray', 'Aplicacion', 29, 60, '2025-06-01 01:04:07.458229+00', '2025-06-30', 200),
(10, 'Cemento quirurgico', 'Cemento quirurgico', 'Aplicaciones', 118, 100, '2025-06-01 00:45:49.457755+00', '2027-04-30', 150);

-- Datos de Fichas Clínicas
INSERT INTO pacientes_fichaclinica (id, fecha, descripcion_atencion, procedimiento, indicaciones, proxima_sesion_estimada, cita_id, paciente_id, costo_total) VALUES
(1, '2025-05-31', 'Onicomicosis', 'Limpieza', 'NP27', NULL, NULL, 1, 300),
(2, '2025-05-31', 'Control de Onicocriptosis', 'Retiro de cemento quirurgico, se observa exsudacion maseracion y material purulento', 'Aplicar NP27  2 veces al dia, realizar revision y hacer presion en laminas dañadas, se recomendo tomar amoxicilina', NULL, NULL, 3, 2362);

-- Datos de Movimientos de Insumos
INSERT INTO insumos_movimientoinsumo (id, cantidad, tipo_movimiento, motivo, fecha_movimiento, insumo_id, usuario_id) VALUES
(1, 1, 'salida', 'Uso en ficha clínica #1', '2025-05-31 23:14:40.258596+00', 1, 1),
(2, 1, 'salida', 'Uso en ficha clínica #2', '2025-05-31 23:48:30.030646+00', 1, 1),
(3, 1, 'salida', 'Uso en ficha clínica #2', '2025-05-31 23:48:30.04082+00', 2, 1),
(4, 1, 'salida', 'Uso en ficha clínica #2', '2025-05-31 23:52:02.710407+00', 1, 1),
(5, 1, 'salida', 'Uso en ficha clínica #2', '2025-05-31 23:52:02.718119+00', 2, 1),
(6, 2, 'salida', 'Uso en ficha clínica #2', '2025-05-31 23:52:02.723063+00', 3, 1),
(7, 1, 'salida', 'Uso en ficha clínica #2', '2025-06-01 00:22:05.727558+00', 1, 1),
(8, 1, 'salida', 'Uso en ficha clínica #2', '2025-06-01 00:22:05.736504+00', 2, 1),
(9, 2, 'salida', 'Uso en ficha clínica #2', '2025-06-01 00:22:05.740897+00', 3, 1),
(10, 4, 'salida', 'Uso en ficha clínica #2', '2025-06-01 00:22:05.744898+00', 3, 1),
(11, 2, 'salida', 'Uso en ficha clínica #2', '2025-06-01 00:22:05.749327+00', 6, 1),
(12, 6, 'salida', 'Uso en ficha clínica #2', '2025-06-01 00:22:05.753648+00', 5, 1),
(13, 1, 'salida', 'Uso en ficha clínica #2', '2025-06-01 00:22:05.758458+00', 7, 1),
(14, 6, 'salida', 'Uso en ficha clínica #2', '2025-06-01 00:22:05.762681+00', 4, 1),
(15, 1, 'salida', 'Uso en ficha clínica #2', '2025-06-01 00:45:49.425265+00', 1, 1),
(16, 2, 'salida', 'Uso en ficha clínica #2', '2025-06-01 00:45:49.434147+00', 3, 1),
(17, 2, 'salida', 'Uso en ficha clínica #2', '2025-06-01 00:45:49.438573+00', 6, 1),
(18, 6, 'salida', 'Uso en ficha clínica #2', '2025-06-01 00:45:49.442928+00', 5, 1),
(19, 1, 'salida', 'Uso en ficha clínica #2', '2025-06-01 00:45:49.447016+00', 7, 1),
(20, 6, 'salida', 'Uso en ficha clínica #2', '2025-06-01 00:45:49.451424+00', 4, 1),
(21, 2, 'salida', 'Uso en ficha clínica #2', '2025-06-01 00:45:49.456804+00', 10, 1),
(22, 1, 'salida', 'Uso en ficha clínica #2', '2025-06-01 00:45:49.461402+00', 9, 1),
(23, 1, 'salida', 'Uso en ficha clínica #2', '2025-06-01 00:45:49.465778+00', 8, 1);

-- Datos de Uso de Productos en Fichas
INSERT INTO pacientes_usoproductoenficha (id, cantidad, fecha_uso, ficha_id, insumo_id) VALUES
(1, 1, '2025-05-31 23:14:40.230658+00', 1, 1),
(15, 1, '2025-06-01 00:45:49.422354+00', 2, 1),
(16, 2, '2025-06-01 00:45:49.433256+00', 2, 3),
(17, 2, '2025-06-01 00:45:49.437592+00', 2, 6),
(18, 6, '2025-06-01 00:45:49.442003+00', 2, 5),
(19, 1, '2025-06-01 00:45:49.446067+00', 2, 7),
(20, 6, '2025-06-01 00:45:49.450486+00', 2, 4),
(21, 2, '2025-06-01 00:45:49.454771+00', 2, 10),
(22, 1, '2025-06-01 00:45:49.460359+00', 2, 9),
(23, 1, '2025-06-01 00:45:49.464854+00', 2, 8);

-- Reiniciar secuencias para que los próximos IDs sean correctos
SELECT setval('citas_tratamiento_id_seq', (SELECT MAX(id) FROM citas_tratamiento));
SELECT setval('pacientes_paciente_id_seq', (SELECT MAX(id) FROM pacientes_paciente));
SELECT setval('citas_cita_id_seq', (SELECT MAX(id) FROM citas_cita));
SELECT setval('insumos_insumo_id_seq', (SELECT MAX(id) FROM insumos_insumo));
SELECT setval('pacientes_fichaclinica_id_seq', (SELECT MAX(id) FROM pacientes_fichaclinica));
SELECT setval('insumos_movimientoinsumo_id_seq', (SELECT MAX(id) FROM insumos_movimientoinsumo));
SELECT setval('pacientes_usoproductoenficha_id_seq', (SELECT MAX(id) FROM pacientes_usoproductoenficha)); 