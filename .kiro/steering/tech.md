# Technology Stack

## Backend
- **Framework**: Django 4.2.11 with Django REST Framework
- **Database**: PostgreSQL 13
- **Authentication**: JWT tokens with django-rest-framework-simplejwt
- **Task Queue**: Celery with Redis broker for background tasks
- **Email**: Mailgun API via django-anymail
- **File Storage**: Local filesystem with WhiteNoise for static files
- **WSGI Server**: Gunicorn for production
- **Custom User Model**: usuarios.Usuario (replaces default Django User)

## Frontend
- **Framework**: React 19.1.0
- **Routing**: React Router DOM 7.5.3
- **Styling**: Tailwind CSS with Headless UI components
- **HTTP Client**: Axios for API communication
- **Forms**: Formik with Yup validation
- **Calendar**: React Big Calendar for appointment scheduling
- **Build Tool**: Create React App

## Infrastructure
- **Containerization**: Docker with Docker Compose
- **Web Server**: Nginx (for production)
- **SSL**: Let's Encrypt certificates
- **Environment**: Multi-stage deployment (development/production)

## Key Libraries
- **Backend**: psycopg2-binary, django-cors-headers, django-filter, pillow, python-dotenv
- **Frontend**: @heroicons/react, date-fns, react-to-print

## Common Commands

### Development
```bash
# Start development environment
start.bat  # Windows batch file that runs docker-compose up

# Stop development environment  
stop.bat   # Windows batch file that runs docker-compose down

# Backend development (manual)
cd podoclinic
python manage.py runserver

# Frontend development (manual)
cd frontend
npm start
```

### Docker Operations
```bash
# Build and start all services
docker-compose up --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service_name]

# Execute commands in containers
docker-compose exec backend python manage.py [command]
```

### Django Management
```bash
# Database migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic

# Run tests
python manage.py test
```

### Frontend Commands
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Environment Configuration
- Development uses `.env` file in project root
- Production uses environment variables
- Database credentials, email API keys, and Django secret key must be configured
- CORS and CSRF settings are environment-specific