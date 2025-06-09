# 📋 **Guía de Respaldo y Restauración - Clínica Podológica Esmeralda**

## 🔄 **Sistema de Respaldo y Restauración**

Esta guía explica cómo crear respaldos de seguridad y restaurar la base de datos del sistema de gestión de la clínica.

---

## 📦 **Crear Respaldo de la Base de Datos**

### **Desde la Aplicación:**

1. **Acceder al módulo de respaldo:**
   - Abrir la aplicación web
   - Ir a la sección "Respaldo de Base de Datos"

2. **Generar el respaldo:**
   - Hacer clic en "Crear Copia de Seguridad"
   - Esperar a que el proceso termine (puede tardar unos segundos)
   - El archivo se descargará automáticamente

3. **Archivo generado:**
   - Nombre: `podoclinic_backup_YYYYMMDD_HHMMSS.json`
   - Formato: JSON (texto legible)
   - Contenido: Todos los pacientes, citas, tratamientos y configuraciones

### **Recomendaciones de Respaldo:**

- **Frecuencia:** Crear respaldos diariamente
- **Almacenamiento:** Guardar en múltiples ubicaciones:
  - Disco externo o USB
  - Servicio de nube (Google Drive, OneDrive, etc.)
  - Otra computadora
- **Nomenclatura:** No cambiar el nombre del archivo de respaldo

---

## 🔄 **Restaurar Base de Datos**

### **Desde la Aplicación:**

1. **Acceder al módulo de restauración:**
   - Ir a la sección "Respaldo de Base de Datos"
   - Buscar la sección "Restaurar Base de Datos"

2. **Seleccionar archivo de respaldo:**
   - Hacer clic en "Elegir archivo"
   - Seleccionar el archivo de respaldo (`.json` o `.sql`)
   - Verificar que aparezca el nombre del archivo

3. **Configurar opciones:**
   - ✅ **Recomendado:** Marcar "Limpiar base de datos antes de restaurar" para restauración completa
   - ❌ **Opcional:** Desmarcar para fusionar datos (puede crear duplicados)

4. **Ejecutar restauración:**
   - Hacer clic en "Restaurar Base de Datos"
   - Esperar a que termine el proceso
   - Revisar el resumen de elementos restaurados

### **Resultado de la Restauración:**

#### **Para archivos JSON:**
- **Pacientes restaurados:** Número de pacientes importados
- **Tratamientos restaurados:** Tipos de tratamiento importados
- **Citas restauradas:** Citas médicas importadas
- **Errores:** Lista de problemas (si los hay)

#### **Para archivos SQL:**
- **Comandos SQL ejecutados:** Número de comandos procesados
- **Pacientes/Tratamientos/Citas en BD:** Totales finales en la base de datos
- **Advertencias:** Comandos omitidos por seguridad
- **Errores:** Comandos que fallaron (si los hay)

---

## 💻 **Instalación en Nuevo Computador**

### **Requisitos Previos:**

1. **Instalar Python 3.11 o superior:**
   - Descargar desde: https://www.python.org/downloads/
   - ✅ Marcar "Add Python to PATH" durante la instalación

2. **Instalar Node.js 18 o superior:**
   - Descargar desde: https://nodejs.org/
   - Instalar la versión LTS (recomendada)

3. **Instalar PostgreSQL (opcional):**
   - Descargar desde: https://www.postgresql.org/download/
   - Solo si se usará PostgreSQL en lugar de SQLite

### **Pasos de Instalación:**

#### **1. Copiar Archivos del Software:**
```bash
# Copiar toda la carpeta "Podoclinic" al nuevo computador
# Mantener la estructura de directorios exactamente igual
```

#### **2. Configurar el Backend (Django):**
```bash
# Abrir terminal en la carpeta Podoclinic
cd Podoclinic

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual (Windows)
venv\Scripts\activate

# Instalar dependencias
cd podoclinic
pip install -r requirements.txt

# Crear base de datos SQLite
python manage.py makemigrations
python manage.py migrate

# Crear usuario administrador
python manage.py createsuperuser
```

#### **3. Configurar el Frontend (React):**
```bash
# En una nueva terminal, ir al directorio frontend
cd Podoclinic/frontend

# Instalar dependencias
npm install

# Compilar para producción (opcional)
npm run build
```

#### **4. Restaurar Datos:**
1. Iniciar el servidor backend:
   ```bash
   cd podoclinic
   python manage.py runserver
   ```

2. Iniciar el frontend:
   ```bash
   cd frontend
   npm start
   ```

3. Acceder a la aplicación: http://localhost:3000

4. Ir a "Respaldo de Base de Datos" y restaurar el archivo de respaldo

---

## 🔧 **Configuración Avanzada**

### **Variables de Entorno (Opcional):**

Crear archivo `.env` en el directorio raíz para configuración personalizada:

```env
# Configuración básica
DJANGO_SECRET_KEY=tu-clave-secreta-aqui
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Para usar PostgreSQL (opcional)
DB_NAME=podoclinic_db
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_HOST=localhost
DB_PORT=5432

# Configuración de correo (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=tu_email@gmail.com
EMAIL_HOST_PASSWORD=tu_password_de_aplicacion
```

### **Uso con PostgreSQL:**

Si prefieres usar PostgreSQL en lugar de SQLite:

1. **Instalar PostgreSQL**
2. **Crear base de datos:**
   ```sql
   CREATE DATABASE podoclinic_db;
   CREATE USER podoclinic_user WITH PASSWORD 'tu_password';
   GRANT ALL PRIVILEGES ON DATABASE podoclinic_db TO podoclinic_user;
   ```
3. **Configurar variables de entorno** (archivo `.env`)
4. **Ejecutar migraciones:**
   ```bash
   python manage.py migrate
   ```

---

## 🚨 **Solución de Problemas Comunes**

### **Error: "No se puede conectar a la base de datos"**
- **Solución:** Verificar que PostgreSQL esté ejecutándose o usar SQLite (más simple)
- **Alternativa:** Eliminar el archivo `.env` para usar SQLite por defecto

### **Error: "Módulo no encontrado"**
- **Solución:** Verificar que el entorno virtual esté activado
- **Comando:** `venv\Scripts\activate` (Windows) o `source venv/bin/activate` (Linux/Mac)

### **Error: "Puerto ya en uso"**
- **Solución:** Cambiar el puerto del servidor
- **Backend:** `python manage.py runserver 8001`
- **Frontend:** Modificar `package.json` o usar puerto diferente

### **Error al restaurar respaldo**
- **Verificar formato:** El archivo debe ser `.json` generado por esta aplicación
- **Verificar permisos:** Asegurar que el usuario tenga permisos de escritura
- **Logs:** Revisar la consola del navegador para errores específicos

---

## 📞 **Soporte Técnico**

### **Archivos Importantes a Conservar:**
- **Base de datos:** `podoclinic/db.sqlite3` (si usa SQLite)
- **Respaldos:** Archivos `.json` generados
- **Configuración:** Archivo `.env` (si existe)
- **Logs:** `podoclinic/django.log` para diagnóstico

### **Contacto para Soporte:**
- **Desarrollador:** [Información de contacto]
- **Documentación:** Este archivo y README.md
- **Logs del sistema:** Disponibles en la carpeta `podoclinic/logs/`

---

## ✅ **Lista de Verificación Post-Instalación**

- [ ] Python y Node.js instalados correctamente
- [ ] Dependencias del backend instaladas (`pip install -r requirements.txt`)
- [ ] Dependencias del frontend instaladas (`npm install`)
- [ ] Base de datos creada y migrada
- [ ] Usuario administrador creado
- [ ] Servidor backend funcionando (puerto 8000)
- [ ] Servidor frontend funcionando (puerto 3000)
- [ ] Datos restaurados desde respaldo
- [ ] Funcionalidades principales probadas (crear paciente, agendar cita)
- [ ] Respaldo de prueba creado exitosamente

---

*Última actualización: Junio 2025* 