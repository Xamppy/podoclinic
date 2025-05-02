# Podoclinic - Sistema de Gestión Podológica

Sistema integral de gestión para clínicas podológicas que incluye gestión de pacientes, citas, inventario y usuarios.

## Características Principales

- Gestión de pacientes y fichas clínicas
- Sistema de citas y tratamientos
- Control de inventario de insumos
- Gestión de usuarios y roles
- API RESTful para integración con frontend
- Sistema de autenticación JWT
- Recordatorios automáticos de citas

## Requisitos

- Python 3.8+
- PostgreSQL
- Redis (para tareas asíncronas)
- Node.js y npm (para el frontend)

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/podoclinic.git
cd podoclinic
```

2. Crear y activar entorno virtual:
```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

3. Instalar dependencias:
```bash
pip install -r requirements.txt
```

4. Configurar base de datos:
```bash
python manage.py migrate
```

5. Crear superusuario:
```bash
python manage.py createsuperuser
```

6. Iniciar el servidor:
```bash
python manage.py runserver
```

## Estructura del Proyecto

- `podoclinic/`: Configuración principal de Django
- `pacientes/`: Gestión de pacientes y fichas clínicas
- `citas/`: Sistema de citas y tratamientos
- `insumos/`: Control de inventario
- `usuarios/`: Gestión de usuarios y autenticación
- `frontend/`: Aplicación React

## API Endpoints

- `/api/pacientes/`: Gestión de pacientes
- `/api/citas/`: Gestión de citas
- `/api/insumos/`: Control de inventario
- `/api/usuarios/`: Gestión de usuarios
- `/api/auth/login/`: Autenticación

## Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles. 