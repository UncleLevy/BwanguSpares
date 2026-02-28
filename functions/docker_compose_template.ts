version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: bwangu_postgres
    environment:
      POSTGRES_DB: bwangu_db
      POSTGRES_USER: bwangu_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U bwangu_user -d bwangu_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: bwangu_redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  django:
    build: .
    container_name: bwangu_django
    command: >
      sh -c "python manage.py migrate &&
             python manage.py runserver 0.0.0.0:8000"
    environment:
      DEBUG: 'True'
      SECRET_KEY: 'django-insecure-dev-key'
      DB_ENGINE: django.db.backends.postgresql
      DB_NAME: bwangu_db
      DB_USER: bwangu_user
      DB_PASSWORD: secure_password
      DB_HOST: postgres
      DB_PORT: 5432
      CELERY_BROKER_URL: redis://redis:6379/0
      CELERY_RESULT_BACKEND: redis://redis:6379/0
    volumes:
      - .:/app
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  celery:
    build: .
    container_name: bwangu_celery
    command: celery -A config worker -l info
    environment:
      DEBUG: 'True'
      DB_ENGINE: django.db.backends.postgresql
      DB_NAME: bwangu_db
      DB_USER: bwangu_user
      DB_PASSWORD: secure_password
      DB_HOST: postgres
      DB_PORT: 5432
      CELERY_BROKER_URL: redis://redis:6379/0
      CELERY_RESULT_BACKEND: redis://redis:6379/0
    volumes:
      - .:/app
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data: