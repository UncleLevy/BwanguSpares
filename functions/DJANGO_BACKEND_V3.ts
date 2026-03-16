/**
 * DJANGO STANDALONE BACKEND - VERSION 3
 * Complete Django REST Framework implementation for BwanguSpares
 * 
 * This is a REFERENCE DOCUMENT showing the complete Django backend structure
 * that would run alongside the Base44 frontend as a standalone service.
 * 
 * ARCHITECTURE:
 * - Django REST Framework for API endpoints
 * - PostgreSQL database
 * - Celery for background tasks
 * - Redis for caching and task queue
 * - AWS S3 for media storage
 * - Stripe integration for payments
 * - M-Pesa integration for mobile money
 * 
 * DEPLOYMENT:
 * - Docker containers
 * - Nginx reverse proxy
 * - Gunicorn WSGI server
 * - Systemd for service management
 */

// ============================================================================
// PROJECT STRUCTURE
// ============================================================================

/**
 * bwangu_backend/
 * ├── manage.py
 * ├── requirements.txt
 * ├── Dockerfile
 * ├── docker-compose.yml
 * ├── .env.example
 * ├── config/
 * │   ├── __init__.py
 * │   ├── settings/
 * │   │   ├── __init__.py
 * │   │   ├── base.py
 * │   │   ├── development.py
 * │   │   ├── production.py
 * │   │   └── test.py
 * │   ├── urls.py
 * │   ├── wsgi.py
 * │   └── asgi.py
 * ├── apps/
 * │   ├── __init__.py
 * │   ├── core/
 * │   │   ├── __init__.py
 * │   │   ├── models.py
 * │   │   ├── admin.py
 * │   │   ├── serializers.py
 * │   │   ├── views.py
 * │   │   ├── urls.py
 * │   │   ├── permissions.py
 * │   │   ├── filters.py
 * │   │   └── utils.py
 * │   ├── users/
 * │   ├── shops/
 * │   ├── products/
 * │   ├── orders/
 * │   ├── shipments/
 * │   ├── payments/
 * │   ├── messaging/
 * │   ├── reviews/
 * │   └── analytics/
 * ├── tasks/
 * │   ├── __init__.py
 * │   ├── celery.py
 * │   ├── email_tasks.py
 * │   ├── payment_tasks.py
 * │   └── analytics_tasks.py
 * ├── utils/
 * │   ├── __init__.py
 * │   ├── validators.py
 * │   ├── helpers.py
 * │   └── constants.py
 * └── static/
 *     └── media/
 */

// ============================================================================
// 1. REQUIREMENTS.TXT
// ============================================================================

const REQUIREMENTS = `
# Django Core
Django
djangorestframework
django-cors-headers
django-filter
drf-spectacular

# Database
psycopg2-binary
dj-database-url

# Authentication
djangorestframework-simplejwt
django-allauth

# Celery & Redis
celery
redis
django-redis

# File Storage
django-storages
boto3

# Payments
stripe

# Email
sendgrid

# Monitoring
sentry-sdk

# Image Processing
Pillow

# Utilities
python-decouple
requests
python-dateutil

# Development
django-debug-toolbar
ipython

# Production
gunicorn
whitenoise
`;

// ============================================================================
// 2. DOCKER CONFIGURATION
// ============================================================================

const DOCKERFILE = `
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    postgresql-client \\
    build-essential \\
    libpq-dev \\
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput

# Run migrations and start server
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4"]
`;

const DOCKER_COMPOSE = `
version: '3.8'

services:
  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: bwangu
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  web:
    build: .
    command: gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4 --reload
    volumes:
      - .:/app
      - static_volume:/app/static
      - media_volume:/app/media
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/bwangu
      - REDIS_URL=redis://redis:6379/0
      - DJANGO_SETTINGS_MODULE=config.settings.development
    depends_on:
      - db
      - redis

  celery_worker:
    build: .
    command: celery -A tasks worker --loglevel=info
    volumes:
      - .:/app
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/bwangu
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis

  celery_beat:
    build: .
    command: celery -A tasks beat --loglevel=info
    volumes:
      - .:/app
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/bwangu
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis

volumes:
  postgres_data:
  static_volume:
  media_volume:
`;

// ============================================================================
// 3. DJANGO SETTINGS
// ============================================================================

const SETTINGS_BASE = `
from pathlib import Path
from decouple import config
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-dev-key')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    'storages',
    
    # Local apps
    'apps.core',
    'apps.users',
    'apps.shops',
    'apps.products',
    'apps.orders',
    'apps.shipments',
    'apps.payments',
    'apps.messaging',
    'apps.reviews',
    'apps.analytics',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL'),
        conn_max_age=600
    )
}

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# CORS
CORS_ALLOWED_ORIGINS = config('CORS_ORIGINS', default='http://localhost:3000').split(',')
CORS_ALLOW_CREDENTIALS = True

# Celery
CELERY_BROKER_URL = config('REDIS_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('REDIS_URL', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Africa/Lusaka'

# Cache
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://localhost:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# AWS S3
AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID', default='')
AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY', default='')
AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME', default='')
AWS_S3_REGION_NAME = config('AWS_S3_REGION_NAME', default='us-east-1')
AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
AWS_S3_OBJECT_PARAMETERS = {'CacheControl': 'max-age=86400'}
AWS_DEFAULT_ACL = 'public-read'

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'

# Stripe
STRIPE_SECRET_KEY = config('STRIPE_SECRET_KEY', default='')
STRIPE_PUBLISHABLE_KEY = config('STRIPE_PUBLISHABLE_KEY', default='')
STRIPE_WEBHOOK_SECRET = config('STRIPE_WEBHOOK_SECRET', default='')

# Email
SENDGRID_API_KEY = config('SENDGRID_API_KEY', default='')
DEFAULT_FROM_EMAIL = 'noreply@bwangu.com'

# Sentry
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn=config('SENTRY_DSN', default=''),
    integrations=[DjangoIntegration()],
    traces_sample_rate=0.1,
)
`;

// ============================================================================
// 4. CORE MODELS
// ============================================================================

const MODELS_CORE = `
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

class TimeStampedModel(models.Model):
    """Abstract base model with created/updated timestamps"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True

class User(AbstractUser):
    """Extended user model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)
    
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('shop_owner', 'Shop Owner'),
        ('buyer', 'Buyer'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='buyer')
    
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_date']

class Region(TimeStampedModel):
    """Zambian regions/provinces"""
    name = models.CharField(max_length=100, unique=True)
    province = models.CharField(max_length=100, blank=True)
    
    class Meta:
        db_table = 'regions'
        ordering = ['name']

class Town(TimeStampedModel):
    """Towns/cities in Zambia"""
    name = models.CharField(max_length=100)
    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name='towns')
    postal_code = models.CharField(max_length=20, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    class Meta:
        db_table = 'towns'
        unique_together = ['name', 'region']
        ordering = ['name']

class Shop(TimeStampedModel):
    """Shop/Store model"""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shops')
    phone = models.CharField(max_length=20)
    address = models.TextField()
    region = models.ForeignKey(Region, on_delete=models.PROTECT)
    town = models.CharField(max_length=100)
    
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    logo = models.ImageField(upload_to='shop_logos/', null=True, blank=True)
    cover = models.ImageField(upload_to='shop_covers/', null=True, blank=True)
    
    business_registration = models.CharField(max_length=100, blank=True)
    tax_id = models.CharField(max_length=100, blank=True)
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('suspended', 'Suspended'),
        ('rejected', 'Rejected'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    total_sales = models.IntegerField(default=0)
    
    SLOT_CHOICES = [
        ('basic', 'Basic'),
        ('standard', 'Standard'),
        ('premium', 'Premium'),
    ]
    slot_type = models.CharField(max_length=20, choices=SLOT_CHOICES, default='basic')
    
    stripe_account_id = models.CharField(max_length=100, blank=True)
    
    class Meta:
        db_table = 'shops'
        ordering = ['-created_date']
        indexes = [
            models.Index(fields=['status', 'region']),
            models.Index(fields=['owner', 'status']),
        ]

class Vehicle(TimeStampedModel):
    """Vehicle brands and models"""
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    years = models.JSONField(default=list)
    status = models.CharField(
        max_length=20,
        choices=[('active', 'Active'), ('inactive', 'Inactive')],
        default='active'
    )
    
    class Meta:
        db_table = 'vehicles'
        unique_together = ['brand', 'model']
        ordering = ['brand', 'model']

class Product(TimeStampedModel):
    """Auto parts product"""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    part_number = models.CharField(max_length=100, blank=True, db_index=True)
    
    CATEGORY_CHOICES = [
        ('engine', 'Engine'),
        ('brakes', 'Brakes'),
        ('suspension', 'Suspension'),
        ('electrical', 'Electrical'),
        ('body', 'Body'),
        ('transmission', 'Transmission'),
        ('exhaust', 'Exhaust'),
        ('cooling', 'Cooling'),
        ('steering', 'Steering'),
        ('interior', 'Interior'),
        ('accessories', 'Accessories'),
        ('tyres', 'Tyres'),
        ('filters', 'Filters'),
        ('oils_fluids', 'Oils & Fluids'),
        ('other', 'Other'),
    ]
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    sub_category = models.CharField(max_length=100, blank=True)
    brand = models.CharField(max_length=100, blank=True)
    sku = models.CharField(max_length=100, blank=True, unique=True, null=True)
    
    compatible_vehicles = models.ManyToManyField(Vehicle, related_name='products', blank=True)
    
    CONDITION_CHOICES = [
        ('new', 'New'),
        ('used', 'Used'),
        ('refurbished', 'Refurbished'),
    ]
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='new')
    
    stock_quantity = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    low_stock_threshold = models.IntegerField(default=5)
    
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='products')
    
    image_urls = models.JSONField(default=list)
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('out_of_stock', 'Out of Stock'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    tags = models.JSONField(default=list)
    shipping_cost = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0)]
    )
    
    class Meta:
        db_table = 'products'
        ordering = ['-created_date']
        indexes = [
            models.Index(fields=['shop', 'status']),
            models.Index(fields=['category', 'status']),
            models.Index(fields=['part_number']),
        ]

class Order(TimeStampedModel):
    """Customer orders"""
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='orders')
    
    items = models.JSONField(default=list)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('collected', 'Collected'),
        ('cancelled', 'Cancelled'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    delivery_address = models.TextField(blank=True)
    delivery_phone = models.CharField(max_length=20, blank=True)
    notes = models.TextField(blank=True)
    
    tracking_number = models.CharField(max_length=100, blank=True, db_index=True)
    current_location = models.CharField(max_length=200, blank=True)
    estimated_delivery = models.DateField(null=True, blank=True)
    
    payment_method = models.CharField(max_length=50, blank=True)
    stripe_session_id = models.CharField(max_length=200, blank=True)
    
    coupon_code = models.CharField(max_length=50, blank=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    cancellation_reason = models.TextField(blank=True)
    refunded = models.BooleanField(default=False)
    refund_id = models.CharField(max_length=200, blank=True)
    
    SHIPPING_CHOICES = [
        ('collect', 'Collect'),
        ('deliver', 'Deliver'),
    ]
    shipping_option = models.CharField(max_length=20, choices=SHIPPING_CHOICES, default='collect')
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    class Meta:
        db_table = 'orders'
        ordering = ['-created_date']
        indexes = [
            models.Index(fields=['buyer', 'status']),
            models.Index(fields=['shop', 'status']),
            models.Index(fields=['tracking_number']),
        ]

class Shipment(TimeStampedModel):
    """Shipping/delivery tracking"""
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='shipment')
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE)
    
    buyer_email = models.EmailField()
    buyer_name = models.CharField(max_length=200)
    buyer_phone = models.CharField(max_length=20)
    
    delivery_address = models.TextField()
    delivery_town = models.CharField(max_length=100)
    delivery_region = models.CharField(max_length=100)
    
    is_intercity = models.BooleanField(default=False)
    requires_handoff = models.BooleanField(default=False)
    
    # Courier assignments
    intercity_courier_id = models.UUIDField(null=True, blank=True)
    intercity_courier_name = models.CharField(max_length=200, blank=True)
    intercity_courier_phone = models.CharField(max_length=20, blank=True)
    
    local_courier_id = models.UUIDField(null=True, blank=True)
    local_courier_name = models.CharField(max_length=200, blank=True)
    local_courier_phone = models.CharField(max_length=20, blank=True)
    
    current_courier_id = models.UUIDField(null=True, blank=True)
    current_courier_name = models.CharField(max_length=200, blank=True)
    current_courier_phone = models.CharField(max_length=20, blank=True)
    
    handoff_location = models.CharField(max_length=200, blank=True)
    handoff_time = models.DateTimeField(null=True, blank=True)
    handoff_notes = models.TextField(blank=True)
    
    tracking_number = models.CharField(max_length=100, unique=True, db_index=True)
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('assigned', 'Assigned'),
        ('picked_up', 'Picked Up'),
        ('in_transit', 'In Transit'),
        ('awaiting_handoff', 'Awaiting Handoff'),
        ('handoff_complete', 'Handoff Complete'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
    ]
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2)
    intercity_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    local_delivery_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    estimated_delivery_date = models.DateField()
    actual_delivery_date = models.DateTimeField(null=True, blank=True)
    pickup_time = models.DateTimeField(null=True, blank=True)
    
    delivery_notes = models.TextField(blank=True)
    proof_of_delivery_url = models.URLField(blank=True)
    
    tracking_updates = models.JSONField(default=list)
    
    class Meta:
        db_table = 'shipments'
        ordering = ['-created_date']
        indexes = [
            models.Index(fields=['tracking_number']),
            models.Index(fields=['status']),
        ]
`;

// ============================================================================
// 5. SERIALIZERS
// ============================================================================

const SERIALIZERS = `
from rest_framework import serializers
from apps.core.models import User, Shop, Product, Order, Shipment

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'full_name', 'phone', 'role', 'profile_picture', 'created_date']
        read_only_fields = ['id', 'created_date']

class ShopSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    
    class Meta:
        model = Shop
        fields = '__all__'
        read_only_fields = ['id', 'created_date', 'updated_date', 'rating', 'total_sales']

class ProductSerializer(serializers.ModelSerializer):
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['id', 'created_date', 'updated_date']

class OrderSerializer(serializers.ModelSerializer):
    buyer_name = serializers.CharField(source='buyer.get_full_name', read_only=True)
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['id', 'created_date', 'updated_date']

class ShipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shipment
        fields = '__all__'
        read_only_fields = ['id', 'created_date', 'updated_date']
`;

// ============================================================================
// 6. VIEWS/VIEWSETS
// ============================================================================

const VIEWS = `
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from apps.core.models import Shop, Product, Order, Shipment
from apps.core.serializers import ShopSerializer, ProductSerializer, OrderSerializer, ShipmentSerializer
from apps.core.permissions import IsShopOwner, IsAdminOrReadOnly

class ShopViewSet(viewsets.ModelViewSet):
    queryset = Shop.objects.all()
    serializer_class = ShopSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'region', 'slot_type']
    search_fields = ['name', 'address', 'town']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == 'shop_owner':
            return queryset.filter(owner=self.request.user)
        return queryset.filter(status='approved')
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if not request.user.role == 'admin':
            return Response({'error': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)
        
        shop = self.get_object()
        shop.status = 'approved'
        shop.save()
        return Response({'status': 'Shop approved'})

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'shop', 'status', 'condition']
    search_fields = ['name', 'part_number', 'brand', 'sku']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == 'shop_owner':
            return queryset.filter(shop__owner=self.request.user)
        return queryset.filter(status='active', shop__status='approved')

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'shop', 'buyer']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Order.objects.all()
        elif user.role == 'shop_owner':
            return Order.objects.filter(shop__owner=user)
        return Order.objects.filter(buyer=user)
    
    def perform_create(self, serializer):
        serializer.save(buyer=self.request.user)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        order = self.get_object()
        if order.shop.owner != request.user:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        order.status = 'confirmed'
        order.save()
        
        # Trigger shipment creation task
        from tasks.email_tasks import create_shipment_task
        create_shipment_task.delay(order.id)
        
        return Response({'status': 'Order confirmed'})

class ShipmentViewSet(viewsets.ModelViewSet):
    queryset = Shipment.objects.all()
    serializer_class = ShipmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'shop']
    search_fields = ['tracking_number', 'buyer_name']
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        shipment = self.get_object()
        new_status = request.data.get('status')
        location = request.data.get('location', '')
        notes = request.data.get('notes', '')
        
        shipment.status = new_status
        shipment.tracking_updates.append({
            'timestamp': timezone.now().isoformat(),
            'status': new_status,
            'location': location,
            'notes': notes,
            'courier_name': shipment.current_courier_name,
        })
        shipment.save()
        
        # Sync to order if delivered
        if new_status == 'delivered':
            shipment.order.status = 'delivered'
            shipment.order.save()
        
        return Response(ShipmentSerializer(shipment).data)
`;

// ============================================================================
// 7. CELERY TASKS
// ============================================================================

const CELERY_TASKS = `
from celery import shared_task
from django.core.mail import send_mail
from apps.core.models import Order, Shipment, Shop
from django.utils import timezone
import uuid

@shared_task
def create_shipment_task(order_id):
    """Create shipment when order is confirmed"""
    try:
        order = Order.objects.get(id=order_id)
        
        if order.shipping_option != 'deliver':
            return
        
        # Generate tracking number
        tracking_number = f"BW{timezone.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:6].upper()}"
        
        # Create shipment
        shipment = Shipment.objects.create(
            order=order,
            shop=order.shop,
            buyer_email=order.buyer.email,
            buyer_name=order.buyer.get_full_name(),
            buyer_phone=order.delivery_phone,
            delivery_address=order.delivery_address,
            tracking_number=tracking_number,
            shipping_cost=order.shipping_cost,
            estimated_delivery_date=timezone.now().date() + timezone.timedelta(days=3),
        )
        
        # Update order
        order.tracking_number = tracking_number
        order.status = 'processing'
        order.save()
        
        # Send email notification
        send_shipment_email.delay(shipment.id)
        
    except Order.DoesNotExist:
        pass

@shared_task
def send_shipment_email(shipment_id):
    """Send shipment notification email"""
    try:
        shipment = Shipment.objects.get(id=shipment_id)
        
        send_mail(
            subject=f'Your Order Has Been Shipped - {shipment.tracking_number}',
            message=f'Your order has been assigned for delivery. Track it at: {shipment.tracking_number}',
            from_email='noreply@bwangu.com',
            recipient_list=[shipment.buyer_email],
        )
    except Shipment.DoesNotExist:
        pass

@shared_task
def process_auto_payouts():
    """Process automatic shop payouts"""
    from apps.shops.models import ShopWallet
    
    wallets = ShopWallet.objects.filter(
        pending_balance__gt=500,
        shop__stripe_account_id__isnull=False
    )
    
    for wallet in wallets:
        # Process Stripe payout logic here
        pass

@shared_task
def check_low_stock():
    """Check and notify shops of low stock"""
    from apps.products.models import Product
    
    low_stock_products = Product.objects.filter(
        stock_quantity__lte=models.F('low_stock_threshold'),
        status='active'
    )
    
    for product in low_stock_products:
        send_mail(
            subject=f'Low Stock Alert - {product.name}',
            message=f'Your product {product.name} is low on stock ({product.stock_quantity} remaining)',
            from_email='noreply@bwangu.com',
            recipient_list=[product.shop.owner.email],
        )
`;

// ============================================================================
// 8. URL CONFIGURATION
// ============================================================================

const URLS = `
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.shops.views import ShopViewSet
from apps.products.views import ProductViewSet
from apps.orders.views import OrderViewSet
from apps.shipments.views import ShipmentViewSet

router = DefaultRouter()
router.register(r'shops', ShopViewSet)
router.register(r'products', ProductViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'shipments', ShipmentViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/', include('rest_framework.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]
`;

// ============================================================================
// DEPLOYMENT NOTES
// ============================================================================

const DEPLOYMENT_NOTES = `
DEPLOYMENT STEPS:

1. Set environment variables:
   - DATABASE_URL
   - REDIS_URL
   - SECRET_KEY
   - AWS credentials
   - STRIPE keys
   - SENDGRID key
   - SENTRY_DSN

2. Build and run with Docker:
   docker-compose up -d --build

3. Run migrations:
   docker-compose exec web python manage.py migrate

4. Create superuser:
   docker-compose exec web python manage.py createsuperuser

5. Collect static files:
   docker-compose exec web python manage.py collectstatic --noinput

6. Start Celery workers:
   docker-compose up -d celery_worker celery_beat

7. Configure Nginx reverse proxy for production

8. Set up SSL with Let's Encrypt

9. Configure monitoring with Sentry

10. Set up automated backups for PostgreSQL
`;

export default {
  REQUIREMENTS,
  DOCKERFILE,
  DOCKER_COMPOSE,
  SETTINGS_BASE,
  MODELS_CORE,
  SERIALIZERS,
  VIEWS,
  CELERY_TASKS,
  URLS,
  DEPLOYMENT_NOTES,
};
