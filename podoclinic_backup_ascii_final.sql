-- Backup ASCII de Podoclinic - Datos Reales Simplificados
-- Sin caracteres especiales para evitar problemas de codificacion

-- Insertar tratamientos
INSERT INTO citas_tratamiento (id, nombre, descripcion, duracion_minutos, precio) VALUES
(1, 'hongos', 'Unas con hongos (Onicomicosis)', 60, 35000.00),
(2, 'manicura', 'Manicura', 60, 25000.00),
(3, 'encarnada', 'Una encarnada (Onicocriptosis)', 60, 30000.00),
(4, 'general', 'Podologia general', 60, 28000.00);

-- Insertar pacientes (datos reales simplificados)
INSERT INTO pacientes_paciente (id, rut, nombre, telefono, correo, direccion, fecha_nacimiento, enfermedad_base, contacto_emergencia, caso_clinico, fecha_registro) VALUES
(1, '13.214.488-5', 'Pablo Urra Alvarez', '+56944499976', 'pablo.urra@hotmail.com', 'Caracoles 122', '1977-08-29', 'Onicomicosis', '+56996497056', 'Limpieza por Onicomicosis', '2025-05-31 23:08:32'),
(2, '16.287.649-K', 'Katherine Vasquez Valdivia', '+56996497056', 'agro.kathy@gmail.com', 'Av. Santa Cruz 490 Casa 52, La Cruz', '1985-10-28', 'No Aplica', '+56944499976', 'No Aplica', '2025-05-31 23:17:29'),
(3, '20.796.485-9', 'Cristian Perez', '+56995973869', 'perezrojocristian@gmail.com', '12 de Octubre 975, Quillota', '2002-03-29', 'Sano', '+56982034599', 'Onicocriptosis severa recurrente', '2025-05-31 23:33:58'),
(4, '21.101.757-0', 'Javier Urra Araya', '+56944499976', 'pablo.urra@hotmail.com', 'Caracoles 122, La Cruz', '2002-10-10', 'Ninguna', '+56944499976', 'Onicomicosis', '2025-06-10 17:29:54'),
(5, '12.820.313-3', 'Rosa Margarita Valenzuela Zoto', '+56946669491', 'rvalenzuelazoto4@gmail.com', 'Av. Santa Cruz 418 La Cruz', '1975-03-31', 'Sana', '+56946669491', 'Onicocriptosis lamina involutada', '2025-06-11 03:30:41');

-- Insertar citas
INSERT INTO citas_cita (id, paciente_id, tratamiento_id, fecha, hora, estado, tipo_cita, duracion_cita, recordatorio_enviado, duracion_extendida, fecha_creacion) VALUES
(1, 1, 1, '2025-05-31', '20:00:00', 'reservada', 'podologia', 60, false, false, '2025-05-31 23:11:42'),
(2, 2, 2, '2025-05-31', '19:00:00', 'reservada', 'podologia', 60, false, false, '2025-05-31 23:18:19'),
(3, 3, 3, '2025-06-05', '08:00:00', 'reservada', 'podologia', 60, false, false, '2025-05-31 23:35:01'),
(4, 3, 3, '2025-05-31', '15:00:00', 'reservada', 'podologia', 60, false, false, '2025-05-31 23:41:38'),
(5, 1, 2, '2025-06-05', '08:00:00', 'reservada', 'manicura', 60, false, false, '2025-06-01 22:05:33'),
(6, 5, 1, '2025-06-10', '16:00:00', 'reservada', 'podologia', 60, false, false, '2025-06-10 17:30:12');

-- Insertar insumos
INSERT INTO insumos_insumo (id, nombre, descripcion, unidad_medida, stock_actual, stock_critico, ultima_actualizacion, fecha_vencimiento, valor_unitario) VALUES
(1, 'Guante Nitrilo Azul', 'Guantes de Nitrilo Azul Caja de 100 unidades', 'Par', 145, 50, '2025-06-01 00:45:49', '2999-09-09', 300),
(2, 'Alcohol', 'Alcohol 95%', 'Aplicacion', 97, 100, '2025-06-01 00:26:11', '2025-12-25', 40),
(3, 'Toallita Isoprol', 'Toallita con alcohol', 'Sachet', 474, 100, '2025-06-01 00:45:49', '2027-12-31', 19);

-- Insertar usuario
INSERT INTO usuarios_usuario (id, password, last_login, is_superuser, username, first_name, last_name, email, is_staff, is_active, date_joined, rol) VALUES
(1, 'pbkdf2_sha256$600000$eaAc43KXuDwaXN2ULC4GvY$VEAzuIkPYlihiOIT6ZXTzPDMEoVrJQCPJ8oqVJJGGtM=', NULL, true, 'admin', '', '', 'admin@example.com', true, true, '2025-05-31 22:57:32', 'profesional');
