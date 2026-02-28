# Django Backend Setup Guide

## Quick Start (Local Linux Server)

### 1. Prerequisites
```bash
python3 --version  # Should be 3.9+
sudo apt-get install python3-pip python3-venv postgresql postgresql-contrib
```

### 2. Project Setup
```bash
mkdir bwangu-backend && cd bwangu-backend
python3 -m venv venv
source venv/bin/activate
pip install django djangorestframework django-cors-headers python-dotenv psycopg2-binary django-celery-beat pillow stripe
```

### 3. Create Django Project
```bash
django-admin startproject config .
python manage.py startapp users
python manage.py startapp shops
python manage.py startapp products
python manage.py startapp orders
python manage.py startapp cart
python manage.py startapp payments
python manage.py startapp messaging
python manage.py startapp requests
python manage.py startapp regions
```

### 4. PostgreSQL Setup
```bash
sudo -u postgres psql
CREATE DATABASE bwangu_db;
CREATE USER bwangu_user WITH PASSWORD 'your_secure_password';
ALTER ROLE bwangu_user SET client_encoding TO 'utf8';
ALTER ROLE bwangu_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE bwangu_user SET default_transaction_deferrable TO on;
ALTER ROLE bwangu_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE bwangu_db TO bwangu_user;
```

### 5. Files to Replace/Update
Copy the provided Django files:
- `config/settings.py`
- `config/urls.py`
- Individual app models, serializers, views, urls

### 6. Run Migrations
```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000
```

### 7. Test API
```bash
curl http://localhost:8000/api/auth/me
```

---

## Using Docker
```bash
docker-compose up -d
docker-compose exec django python manage.py migrate
docker-compose exec django python manage.py createsuperuser
```

See `docker-compose.yml` for full setup.