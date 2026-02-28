# Django Backend Structure Guide for BwanguSpares

This guide outlines how to structure the Django Python backend when migrating the BwanguSpares application to a larger Linux server.

## Project Root Directory Structure

```
bwangu-backend/
├── manage.py                 # Django management script
├── requirements.txt          # Python dependencies
├── .env                      # Environment variables (NOT in git)
├── .env.example              # Template for environment variables
├── .gitignore               # Git ignore rules
├── Dockerfile               # Docker configuration
├── docker-compose.yml       # Docker compose for local dev
├── config/                  # Main Django configuration
│   ├── __init__.py
│   ├── settings.py          # Settings (use environment variables)
│   ├── urls.py              # Root URL configuration
│   ├── wsgi.py              # WSGI application
│   └── asgi.py              # ASGI application (for async)
├── staticfiles/             # Collected static files (generated)
├── media/                   # User-uploaded files
├── logs/                    # Application logs
└── [apps]/                  # Django apps (see below)
```

## Django Apps Structure

Each app should follow this structure:

```
[app_name]/
├── migrations/
│   ├── __init__.py
│   └── 0001_initial.py
├── __init__.py
├── admin.py                 # Django admin configuration
├── apps.py                  # App configuration
├── models.py                # Database models
├── serializers.py           # DRF serializers
├── views.py                 # API views
├── urls.py                  # URL routing
├── permissions.py           # Custom permissions
├── filters.py               # Filtering logic
├── tests.py                 # Unit tests
└── signals.py               # Django signals (optional)
```

## Required Apps

Create these apps in your project:

```
python manage.py startapp users
python manage.py startapp regions
python manage.py startapp shops
python manage.py startapp products
python manage.py startapp cart
python manage.py startapp orders
python manage.py startapp payments
python manage.py startapp messaging
python manage.py startapp requests
python manage.py startapp reviews
python manage.py startapp notifications
```

## Configuration Management

### settings.py Structure

```python
# Organize settings by environment
import os
from pathlib import Path
from decouple import config, Csv
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

# Core Settings
SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', cast=Csv())

# Application Definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'django_filters',
    'rest_framework_simplejwt',
    # Local apps
    'users',
    'regions',
    'shops',
    'products',
    'cart',
    'orders',
    'payments',
    'messaging',
    'requests',
    'reviews',
    'notifications',
]

# Database - use environment variables
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# CORS Configuration
CORS_ALLOWED_ORIGINS = config('CORS_ORIGINS', cast=Csv())
CORS_ALLOW_CREDENTIALS = True

# Static and Media Files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Stripe Configuration
STRIPE_SECRET_KEY = config('STRIPE_SECRET_KEY')
STRIPE_PUBLISHABLE_KEY = config('STRIPE_PUBLISHABLE_KEY')
STRIPE_WEBHOOK_SECRET = config('STRIPE_WEBHOOK_SECRET')
```

## Environment Variables (.env)

```
# Django
DEBUG=False
SECRET_KEY=your-super-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=bwangu_prod
DB_USER=bwangu_user
DB_PASSWORD=strong_password_here
DB_HOST=localhost
DB_PORT=5432

# Stripe
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# Email (for notifications)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Redis/Celery (for background tasks)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# JWT
JWT_SECRET=your-jwt-secret
```

## Dependencies (requirements.txt)

```
Django==4.2.0
djangorestframework==3.14.0
django-cors-headers==4.0.0
django-filter==23.1
psycopg2-binary==2.9.6
python-decouple==3.8
Pillow==10.0.0
Stripe==5.4.0
celery==5.3.0
redis==4.5.0
gunicorn==21.0.0
whitenoise==6.5.0
django-rest-framework-simplejwt==5.2.2
```

## Server Setup (Linux)

### 1. System Dependencies
```bash
sudo apt-get update
sudo apt-get install -y python3.11 python3-pip python3-venv
sudo apt-get install -y postgresql postgresql-contrib
sudo apt-get install -y redis-server
sudo apt-get install -y nginx supervisor git
```

### 2. Project Setup
```bash
cd /var/www
git clone your-repo
cd bwangu-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
```

### 3. Database Setup (PostgreSQL)
```sql
CREATE DATABASE bwangu_prod;
CREATE USER bwangu_user WITH PASSWORD 'strong_password';
ALTER ROLE bwangu_user SET client_encoding TO 'utf8';
ALTER ROLE bwangu_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE bwangu_user SET default_transaction_deferrable TO on;
GRANT ALL PRIVILEGES ON DATABASE bwangu_prod TO bwangu_user;
```

### 4. Gunicorn Configuration
Create `/etc/supervisor/conf.d/bwangu.conf`:
```
[program:bwangu]
directory=/var/www/bwangu-backend
command=/var/www/bwangu-backend/venv/bin/gunicorn config.wsgi:application --bind 127.0.0.1:8000 --workers 4
autostart=true
autorestart=true
stderr_logfile=/var/log/bwangu/error.log
stdout_logfile=/var/log/bwangu/access.log
```

### 5. Nginx Configuration
Create `/etc/nginx/sites-available/bwangu`:
```nginx
upstream bwangu_app {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    client_max_body_size 20M;

    location /static/ {
        alias /var/www/bwangu-backend/staticfiles/;
    }

    location /media/ {
        alias /var/www/bwangu-backend/media/;
    }

    location / {
        proxy_pass http://bwangu_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable with:
```bash
sudo ln -s /etc/nginx/sites-available/bwangu /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

### 6. SSL/TLS (Let's Encrypt)
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 7. Celery (Background Tasks)
Create `/etc/supervisor/conf.d/bwangu-celery.conf`:
```
[program:bwangu-celery]
directory=/var/www/bwangu-backend
command=/var/www/bwangu-backend/venv/bin/celery -A config worker -l info
autostart=true
autorestart=true
stderr_logfile=/var/log/bwangu/celery-error.log
stdout_logfile=/var/log/bwangu/celery.log
```

## URL Configuration (config/urls.py)

```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/regions/', include('regions.urls')),
    path('api/shops/', include('shops.urls')),
    path('api/products/', include('products.urls')),
    path('api/cart/', include('cart.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/messaging/', include('messaging.urls')),
    path('api/requests/', include('requests.urls')),
    path('api/reviews/', include('reviews.urls')),
    path('api/notifications/', include('notifications.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

## Testing Strategy

Create tests in each app's `tests.py`:
```bash
python manage.py test --settings=config.settings.test
```

## Deployment Checklist

- [ ] Set `DEBUG=False` in production
- [ ] Use strong `SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Set up SSL/TLS
- [ ] Configure PostgreSQL backups
- [ ] Set up logging
- [ ] Configure email backend
- [ ] Set up Stripe webhook signing
- [ ] Configure Redis for caching/sessions
- [ ] Set up monitoring (New Relic, Sentry)
- [ ] Configure automated backups
- [ ] Set up rate limiting
- [ ] Test payment processing
- [ ] Verify CORS configuration

## Maintenance

- Regularly run `python manage.py migrate` after code updates
- Collect static files: `python manage.py collectstatic`
- Monitor logs in `/var/log/bwangu/`
- Use supervisor to manage services
- Set up cron jobs for scheduled tasks
- Regular database backups: `pg_dump -U bwangu_user bwangu_prod > backup.sql