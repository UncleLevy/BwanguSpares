# Django Models, Views, and Serializers Structure Guide

Comprehensive guide for structuring models, serializers, and views in the BwanguSpares Django backend.

---

## 1. MODELS STRUCTURE

### Location: `[app_name]/models.py`

Models should include:
- Proper field types and validation
- Relationships (ForeignKey, OneToOneField, ManyToManyField)
- Custom managers
- Meta class with ordering and indexes
- String representations
- Model methods

#### Example: User Model (users/models.py)

```python
from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid

class User(AbstractUser):
    """Custom user model extending Django's AbstractUser"""
    
    ROLE_CHOICES = [
        ('buyer', 'Buyer'),
        ('shop_owner', 'Shop Owner'),
        ('admin', 'Admin'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='buyer')
    is_verified = models.BooleanField(default=False)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        ordering = ['-created_date']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
        ]
    
    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"
    
    def is_shop_owner(self):
        return self.role == 'shop_owner'
    
    def is_admin(self):
        return self.role == 'admin'


class BannedUser(models.Model):
    """Track banned or suspended users"""
    
    BAN_TYPE_CHOICES = [
        ('suspended', 'Suspended'),
        ('banned', 'Banned'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    full_name = models.CharField(max_length=255)
    ban_type = models.CharField(max_length=20, choices=BAN_TYPE_CHOICES)
    reason = models.TextField()
    ban_expires = models.DateField(null=True, blank=True)
    banned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='bans_issued')
    created_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_date']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['ban_type']),
        ]
    
    def __str__(self):
        return f"{self.email} - {self.get_ban_type_display()}"
    
    def is_active(self):
        """Check if ban is still active"""
        if self.ban_expires is None:
            return True
        from django.utils import timezone
        return timezone.now().date() <= self.ban_expires
```

#### Example: Shop Model (shops/models.py)

```python
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

class Shop(models.Model):
    """Shop/business model"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('suspended', 'Suspended'),
        ('rejected', 'Rejected'),
    ]
    SLOT_CHOICES = [
        ('basic', 'Basic'),
        ('standard', 'Standard'),
        ('premium', 'Premium'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.OneToOneField(User, on_delete=models.CASCADE, related_name='shop')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    phone = models.CharField(max_length=20)
    address = models.CharField(max_length=255)
    region = models.ForeignKey('regions.Region', on_delete=models.SET_NULL, null=True)
    region_name = models.CharField(max_length=100, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    logo_url = models.URLField(blank=True)
    cover_url = models.URLField(blank=True)
    business_registration_number = models.CharField(max_length=100, blank=True)
    tax_identification_number = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    rating = models.FloatField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    total_sales = models.IntegerField(default=0)
    slot_type = models.CharField(max_length=20, choices=SLOT_CHOICES, default='basic')
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_date']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['region']),
            models.Index(fields=['created_date']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_status_display()})"
    
    def is_approved(self):
        return self.status == 'approved'
    
    def product_count(self):
        return self.products.filter(status='active').count()


class Technician(models.Model):
    """Technician/mechanic model"""
    
    SPECIALIZATION_CHOICES = [
        ('engine', 'Engine'),
        ('electrical', 'Electrical'),
        ('body_work', 'Body Work'),
        ('transmission', 'Transmission'),
        ('brakes', 'Brakes'),
        ('general', 'General'),
        ('diagnostics', 'Diagnostics'),
        ('ac_heating', 'AC/Heating'),
        ('tyres', 'Tyres'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='technicians')
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    specialization = models.CharField(max_length=50, choices=SPECIALIZATION_CHOICES)
    experience_years = models.IntegerField(validators=[MinValueValidator(0)])
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2)
    photo_url = models.URLField(blank=True)
    available = models.BooleanField(default=True)
    rating = models.FloatField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    created_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-rating']
        indexes = [
            models.Index(fields=['shop']),
            models.Index(fields=['specialization']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.get_specialization_display()}"
```

#### Example: Product Model (products/models.py)

```python
class Product(models.Model):
    """Product/spare part model"""
    
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
    CONDITION_CHOICES = [
        ('new', 'New'),
        ('used', 'Used'),
        ('refurbished', 'Refurbished'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('out_of_stock', 'Out of Stock'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    sub_category = models.CharField(max_length=100, blank=True)
    brand = models.CharField(max_length=100, blank=True)
    sku = models.CharField(max_length=100, unique=True, blank=True)
    compatible_vehicles = models.CharField(max_length=255, blank=True)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='new')
    stock_quantity = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    low_stock_threshold = models.IntegerField(default=5, validators=[MinValueValidator(0)])
    image_url = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_date']
        indexes = [
            models.Index(fields=['shop', 'status']),
            models.Index(fields=['category']),
            models.Index(fields=['created_date']),
        ]
    
    def __str__(self):
        return self.name
    
    def is_in_stock(self):
        return self.stock_quantity > 0
    
    def is_low_stock(self):
        return self.stock_quantity <= self.low_stock_threshold
```

#### Example: Order Model (orders/models.py)

```python
class Order(models.Model):
    """Customer order model"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='received_orders')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    delivery_address = models.CharField(max_length=255)
    delivery_phone = models.CharField(max_length=20)
    tracking_number = models.CharField(max_length=100, blank=True)
    current_location = models.CharField(max_length=255, blank=True)
    estimated_delivery = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_date']
        indexes = [
            models.Index(fields=['buyer']),
            models.Index(fields=['shop']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Order {self.id} - {self.buyer.email}"
    
    def is_delivered(self):
        return self.status == 'delivered'
    
    def can_be_cancelled(self):
        return self.status in ['pending', 'confirmed']


class OrderItem(models.Model):
    """Individual items in an order"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    price_at_purchase = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        indexes = [
            models.Index(fields=['order']),
        ]
    
    def __str__(self):
        return f"{self.order.id} - {self.product.name if self.product else 'Deleted'}"
    
    def subtotal(self):
        return self.quantity * self.price_at_purchase
```

---

## 2. SERIALIZERS STRUCTURE

### Location: `[app_name]/serializers.py`

Serializers handle data validation and transformation.

#### Example: User Serializers (users/serializers.py)

```python
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import BannedUser

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['email', 'username', 'full_name', 'password', 'password2', 'phone', 'role']
    
    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password2'):
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
        )
        user.full_name = validated_data.get('full_name', '')
        user.phone = validated_data.get('phone', '')
        user.role = validated_data.get('role', 'buyer')
        user.save()
        return user


class UserDetailSerializer(serializers.ModelSerializer):
    """Detailed user information"""
    
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'full_name', 'phone', 'role', 'is_verified', 'created_date']
        read_only_fields = ['id', 'created_date', 'is_verified']


class BannedUserSerializer(serializers.ModelSerializer):
    """Serializer for banned users"""
    
    class Meta:
        model = BannedUser
        fields = '__all__'
        read_only_fields = ['created_date']
```

#### Example: Shop Serializers (shops/serializers.py)

```python
class ShopListSerializer(serializers.ModelSerializer):
    """Lightweight shop list serializer"""
    
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    product_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Shop
        fields = ['id', 'name', 'logo_url', 'region_name', 'rating', 'status', 'owner_name', 'product_count']
    
    def get_product_count(self, obj):
        return obj.products.filter(status='active').count()


class ShopDetailSerializer(serializers.ModelSerializer):
    """Detailed shop information with technicians"""
    
    owner_email = serializers.CharField(source='owner.email', read_only=True)
    technicians = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Shop
        fields = [
            'id', 'name', 'description', 'owner_email', 'phone', 'address',
            'region', 'region_name', 'latitude', 'longitude', 'logo_url',
            'cover_url', 'status', 'rating', 'total_sales', 'slot_type',
            'created_date', 'technicians', 'product_count'
        ]
        read_only_fields = ['id', 'created_date', 'total_sales']
    
    def get_technicians(self, obj):
        technicians = obj.technicians.filter(available=True)
        return TechnicianSerializer(technicians, many=True).data
    
    def get_product_count(self, obj):
        return obj.products.filter(status='active').count()


class TechnicianSerializer(serializers.ModelSerializer):
    """Technician information"""
    
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    
    class Meta:
        model = Technician
        fields = ['id', 'name', 'phone', 'specialization', 'experience_years', 'hourly_rate', 'photo_url', 'available', 'rating', 'shop_name', 'created_date']
        read_only_fields = ['id', 'created_date']
```

#### Example: Product Serializers (products/serializers.py)

```python
class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight product list serializer"""
    
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    in_stock = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'category', 'image_url', 'shop_name', 'status', 'in_stock']
    
    def get_in_stock(self, obj):
        return obj.is_in_stock()


class ProductDetailSerializer(serializers.ModelSerializer):
    """Detailed product information"""
    
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    shop_id = serializers.CharField(source='shop.id', read_only=True)
    in_stock = serializers.SerializerMethodField()
    low_stock = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'category', 'sub_category',
            'brand', 'sku', 'compatible_vehicles', 'condition', 'stock_quantity',
            'image_url', 'status', 'shop_id', 'shop_name', 'created_date',
            'in_stock', 'low_stock'
        ]
        read_only_fields = ['id', 'created_date']
    
    def get_in_stock(self, obj):
        return obj.is_in_stock()
    
    def get_low_stock(self, obj):
        return obj.is_low_stock()


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating products (shop owners only)"""
    
    class Meta:
        model = Product
        fields = [
            'name', 'description', 'price', 'category', 'sub_category',
            'brand', 'sku', 'compatible_vehicles', 'condition', 'stock_quantity',
            'low_stock_threshold', 'image_url', 'status'
        ]
    
    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than 0")
        return value
```

#### Example: Order Serializers (orders/serializers.py)

```python
class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for order items"""
    
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'price_at_purchase']
        read_only_fields = ['id']


class OrderListSerializer(serializers.ModelSerializer):
    """Lightweight order list serializer"""
    
    buyer_name = serializers.CharField(source='buyer.full_name', read_only=True)
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    
    class Meta:
        model = Order
        fields = ['id', 'buyer_name', 'shop_name', 'total_amount', 'status', 'created_date']


class OrderDetailSerializer(serializers.ModelSerializer):
    """Detailed order with items"""
    
    items = OrderItemSerializer(many=True, read_only=True)
    buyer_name = serializers.CharField(source='buyer.full_name', read_only=True)
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'buyer_name', 'shop_name', 'items', 'total_amount', 'status',
            'delivery_address', 'delivery_phone', 'tracking_number', 'current_location',
            'estimated_delivery', 'notes', 'created_date', 'updated_date'
        ]
        read_only_fields = ['id', 'total_amount', 'created_date', 'updated_date']


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating orders"""
    
    class Meta:
        model = Order
        fields = ['shop', 'delivery_address', 'delivery_phone', 'notes']
```

---

## 3. VIEWS STRUCTURE

### Location: `[app_name]/views.py`

Views handle HTTP requests and responses using Django REST Framework.

#### Example: User Views (users/views.py)

```python
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import UserDetailSerializer, UserRegistrationSerializer
from .models import BannedUser

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    """User management viewset"""
    
    queryset = User.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserRegistrationSerializer
        return UserDetailSerializer
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user info"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change user password"""
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        if not user.check_password(old_password):
            return Response(
                {'old_password': 'Wrong password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Password changed successfully'})
    
    @action(detail=False, methods=['get'])
    def is_banned(self, request):
        """Check if user is banned"""
        banned = BannedUser.objects.filter(email=request.user.email).first()
        if banned and banned.is_active():
            return Response(
                {'banned': True, 'reason': banned.reason},
                status=status.HTTP_403_FORBIDDEN
            )
        return Response({'banned': False})
```

#### Example: Shop Views (shops/views.py)

```python
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Shop, Technician
from .serializers import ShopListSerializer, ShopDetailSerializer, TechnicianSerializer
from .permissions import IsShopOwnerOrReadOnly

class ShopViewSet(viewsets.ModelViewSet):
    """Shop management viewset"""
    
    queryset = Shop.objects.filter(status='approved')
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['region', 'slot_type']
    search_fields = ['name', 'description']
    ordering_fields = ['rating', 'total_sales', 'created_date']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ShopListSerializer
        return ShopDetailSerializer
    
    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        """Get all products from a shop"""
        from products.serializers import ProductListSerializer
        shop = self.get_object()
        products = shop.products.filter(status='active')
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def technicians(self, request, pk=None):
        """Get all technicians from a shop"""
        shop = self.get_object()
        technicians = shop.technicians.filter(available=True)
        serializer = TechnicianSerializer(technicians, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_shop(self, request):
        """Get current user's shop"""
        if not request.user.is_authenticated:
            return Response(
                {'detail': 'Not authenticated'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            shop = request.user.shop
            serializer = self.get_serializer(shop)
            return Response(serializer.data)
        except Shop.DoesNotExist:
            return Response(
                {'detail': 'User does not have a shop'},
                status=status.HTTP_404_NOT_FOUND
            )


class TechnicianViewSet(viewsets.ModelViewSet):
    """Technician management viewset"""
    
    queryset = Technician.objects.filter(available=True)
    serializer_class = TechnicianSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['shop', 'specialization']
    ordering_fields = ['rating', 'created_date']
    
    def perform_create(self, serializer):
        """Only shop owners can create technicians"""
        user = self.request.user
        if not hasattr(user, 'shop'):
            return Response(
                {'detail': 'User must be a shop owner'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer.save(shop=user.shop)
```

#### Example: Product Views (products/views.py)

```python
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product
from .serializers import ProductListSerializer, ProductDetailSerializer, ProductCreateUpdateSerializer

class ProductViewSet(viewsets.ModelViewSet):
    """Product management viewset"""
    
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'condition', 'status', 'shop']
    search_fields = ['name', 'description', 'brand']
    ordering_fields = ['price', 'stock_quantity', 'created_date']
    
    def get_queryset(self):
        # Unauthenticated users see only active products
        queryset = Product.objects.filter(status='active')
        
        # Shop owners see their own products regardless of status
        if self.request.user.is_authenticated and hasattr(self.request.user, 'shop'):
            queryset = Product.objects.filter(shop=self.request.user.shop)
        
        return queryset.order_by('-created_date')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProductCreateUpdateSerializer
        elif self.action == 'list':
            return ProductListSerializer
        return ProductDetailSerializer
    
    def perform_create(self, serializer):
        """Only shop owners can create products"""
        if not hasattr(self.request.user, 'shop'):
            return Response(
                {'detail': 'User must be a shop owner'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer.save(shop=self.request.user.shop)
    
    @action(detail=True, methods=['post'])
    def low_stock_alert(self, request, pk=None):
        """Alert when product is low stock"""
        product = self.get_object()
        
        if product.is_low_stock():
            # Send notification to shop owner
            # This would typically be handled by a signal or task
            return Response({'detail': 'Low stock alert sent'})
        
        return Response(
            {'detail': 'Product has sufficient stock'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get all low stock products for shop owner"""
        if not hasattr(request.user, 'shop'):
            return Response(
                {'detail': 'User must be a shop owner'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        products = self.get_queryset().filter(stock_quantity__lte=request.query_params.get('threshold', 5))
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)
```

#### Example: Order Views (orders/views.py)

```python
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Order, OrderItem
from .serializers import OrderListSerializer, OrderDetailSerializer, OrderCreateSerializer

class OrderViewSet(viewsets.ModelViewSet):
    """Order management viewset"""
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'shop']
    ordering_fields = ['created_date', 'total_amount']
    
    def get_queryset(self):
        user = self.request.user
        
        # Buyers see only their orders
        if user.role == 'buyer':
            return Order.objects.filter(buyer=user).order_by('-created_date')
        
        # Shop owners see orders for their shop
        elif hasattr(user, 'shop'):
            return Order.objects.filter(shop=user.shop).order_by('-created_date')
        
        # Admins see all orders
        elif user.role == 'admin':
            return Order.objects.all().order_by('-created_date')
        
        return Order.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        elif self.action == 'list':
            return OrderListSerializer
        return OrderDetailSerializer
    
    def create(self, request, *args, **kwargs):
        """Create order from cart items"""
        buyer = request.user
        shop_id = request.data.get('shop')
        
        # Get cart items for this shop
        from cart.models import CartItem
        cart_items = CartItem.objects.filter(buyer=buyer, shop_id=shop_id)
        
        if not cart_items.exists():
            return Response(
                {'detail': 'No cart items for this shop'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate total
        total = sum(item.price * item.quantity for item in cart_items)
        
        # Create order
        order = Order.objects.create(
            buyer=buyer,
            shop_id=shop_id,
            total_amount=total,
            delivery_address=request.data.get('delivery_address'),
            delivery_phone=request.data.get('delivery_phone'),
            notes=request.data.get('notes', '')
        )
        
        # Create order items
        for cart_item in cart_items:
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                quantity=cart_item.quantity,
                price_at_purchase=cart_item.price
            )
        
        # Clear cart
        cart_items.delete()
        
        serializer = OrderDetailSerializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update order status (shop owners only)"""
        order = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(Order.STATUS_CHOICES):
            return Response(
                {'detail': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = new_status
        order.save()
        
        serializer = self.get_serializer(order)
        return Response(serializer.data)
```

---

## 4. PERMISSIONS

### Location: `[app_name]/permissions.py`

```python
from rest_framework import permissions

class IsShopOwnerOrReadOnly(permissions.BasePermission):
    """Permission for shop-related endpoints"""
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user


class IsShopOwner(permissions.BasePermission):
    """Only shop owners can perform actions"""
    
    def has_permission(self, request, view):
        return request.user and hasattr(request.user, 'shop')
    
    def has_object_permission(self, request, view, obj):
        return obj.shop.owner == request.user


class IsAdminUser(permissions.BasePermission):
    """Only admin users can perform actions"""
    
    def has_permission(self, request, view):
        return request.user and request.user.role == 'admin'
```

---

## 5. URL ROUTING

### Location: `[app_name]/urls.py`

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'shops', views.ShopViewSet, basename='shop')
router.register(r'technicians', views.TechnicianViewSet, basename='technician')

urlpatterns = [
    path('', include(router.urls)),
]

# config/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('rest_framework.urls')),
    path('api/users/', include('users.urls')),
    path('api/shops/', include('shops.urls')),
    path('api/products/', include('products.urls')),
    path('api/orders/', include('orders.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

---

## 6. BEST PRACTICES

### Field Validation
- Use validators on model fields
- Use serializer validation methods
- Validate related object permissions

### Query Optimization
- Use `select_related()` for ForeignKey and OneToOne relationships
- Use `prefetch_related()` for ManyToMany relationships
- Use `.only()` and `.defer()` for large models

### Security
- Always check permissions in viewsets
- Validate user input through serializers
- Use read_only_fields appropriately
- Filter querysets based on user permissions

### Naming Conventions
- Model names: Singular, PascalCase (e.g., `Product`)
- Field names: snake_case (e.g., `created_date`)
- Serializer names: `{Model}Serializer` for detailed, `{Model}ListSerializer` for list views
- View names: `{Model}ViewSet`
- URL patterns: plural, lowercase (e.g., `/api/products/`)

### Docstrings
- Include docstrings for models, serializers, and viewsets
- Document custom methods and actions
- Explain business logic in comments