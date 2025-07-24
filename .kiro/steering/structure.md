# Project Structure

## Root Directory
```
podoclinic/
├── frontend/           # React application
├── podoclinic/         # Django backend
├── docker-compose.yml  # Container orchestration
├── requirements.txt    # Python dependencies
├── start.bat          # Development startup script
├── stop.bat           # Development stop script
└── .env               # Environment variables
```

## Frontend Structure (`frontend/`)
```
frontend/
├── src/
│   ├── api/           # API client functions
│   ├── components/    # Reusable React components
│   ├── context/       # React context providers
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Page-level components
│   ├── routes/        # Routing configuration
│   ├── services/      # Business logic services
│   ├── utils/         # Utility functions
│   ├── App.jsx        # Main application component
│   └── index.js       # Application entry point
├── public/            # Static assets
├── build/             # Production build output
├── package.json       # Node.js dependencies
├── tailwind.config.js # Tailwind CSS configuration
└── Dockerfile         # Frontend container config
```

## Backend Structure (`podoclinic/`)
```
podoclinic/
├── podoclinic/        # Django project settings
│   ├── settings.py    # Main configuration
│   ├── urls.py        # URL routing
│   ├── wsgi.py        # WSGI application
│   └── celery.py      # Celery configuration
├── pacientes/         # Patient management app
├── citas/             # Appointment scheduling app
├── insumos/           # Inventory management app
├── usuarios/          # User management app
├── templates/         # Django templates
│   └── emails/        # Email templates
├── static/            # Static files
├── media/             # User uploaded files
├── manage.py          # Django management script
└── Dockerfile         # Backend container config
```

## Django App Structure
Each Django app follows standard structure:
```
app_name/
├── migrations/        # Database migrations
├── management/        # Custom management commands
├── __init__.py
├── admin.py          # Django admin configuration
├── apps.py           # App configuration
├── models.py         # Database models
├── serializers.py    # DRF serializers
├── views.py          # API views
├── urls.py           # URL patterns
├── tasks.py          # Celery tasks (if applicable)
├── utils.py          # Utility functions
└── tests.py          # Unit tests
```

## Key Configuration Files
- **docker-compose.yml**: Orchestrates backend, frontend, and database services
- **podoclinic/settings.py**: Django configuration with environment-specific settings
- **frontend/package.json**: Frontend dependencies and build scripts
- **requirements.txt**: Python package dependencies
- **.env**: Environment variables for development

## Deployment Files
- **start.bat/stop.bat**: Windows batch scripts for development
- **setup_production.sh**: Production deployment script
- **nginx_cloudflare_config.conf**: Nginx configuration for production
- **gunicorn.service/gunicorn.socket**: Systemd service files

## Data Storage
- **Database**: PostgreSQL container with persistent volume
- **Static Files**: Served by WhiteNoise in Django
- **Media Files**: Local filesystem storage
- **Logs**: Application logs stored in `podoclinic/logs/`

## Development Workflow
1. Use `start.bat` to launch development environment
2. Frontend runs on port 3000, proxies API calls to backend
3. Backend runs on port 8000 within Docker container
4. Database runs on port 5432 within Docker network
5. All services communicate through Docker network