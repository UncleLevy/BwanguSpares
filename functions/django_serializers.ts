"""
DRF Serializers for core models
"""
from rest_framework import serializers
from .users_models import CustomUser
from .shops_models import Shop
from .products_models import Product
from .regions_models import Region

# ===== REGION SERIALIZERS =====
class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = ['id', 'name', 'province', 'created_date']

# ===== USER SERIALIZERS =====
class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = CustomUser
        fields = ['email', 'full_name', 'phone', 'password', 'password_confirm']
    
    def validate(self, data):
        if data['password'] != data.pop('password_confirm'):
            raise serializers.ValidationError("Passwords don't match")
        return data
    
    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            email=validated_data['email'],
            full_name=validated_data['full_name'],
            phone=validated_data.get('phone', ''),
            password=validated_data['password']
        )
        return user

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class UserDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'full_name', 'phone', 'role', 'created_date']
        read_only_fields = ['id', 'email', 'created_date']

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['full_name', 'phone']

# ===== SHOP SERIALIZERS =====
class ShopListSerializer(serializers.ModelSerializer):
    distance = serializers.SerializerMethodField()
    
    class Meta:
        model = Shop
        fields = [
            'id', 'name', 'owner_name', 'phone', 'region_name',
            'logo_url', 'status', 'rating', 'total_sales', 'distance'
        ]
    
    def get_distance(self, obj):
        # Placeholder for distance calculation
        return None

class ShopDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shop
        fields = [
            'id', 'name', 'description', 'owner_email', 'owner_name',
            'phone', 'address', 'region_id', 'region_name',
            'latitude', 'longitude', 'logo_url', 'cover_url',
            'business_registration_number', 'tax_identification_number',
            'status', 'rating', 'total_sales', 'slot_type',
            'created_date', 'updated_date'
        ]
        read_only_fields = ['id', 'created_date', 'updated_date', 'status', 'rating', 'total_sales']

class ShopCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shop
        fields = [
            'name', 'description', 'owner_name', 'phone', 'address',
            'region_id', 'region_name', 'latitude', 'longitude',
            'logo_url', 'cover_url', 'business_registration_number',
            'tax_identification_number', 'slot_type'
        ]

class ShopUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shop
        fields = [
            'name', 'description', 'phone', 'address',
            'latitude', 'longitude', 'logo_url', 'cover_url'
        ]

# ===== PRODUCT SERIALIZERS =====
class ProductListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'id', 'shop_id', 'shop_name', 'name', 'price',
            'category', 'condition', 'stock_quantity',
            'image_url', 'status'
        ]

class ProductDetailSerializer(serializers.ModelSerializer):
    in_stock = serializers.SerializerMethodField()
    low_stock = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'shop_id', 'shop_name', 'name', 'description',
            'price', 'category', 'sub_category', 'brand', 'sku',
            'compatible_vehicles', 'condition', 'stock_quantity',
            'low_stock_threshold', 'image_url', 'status',
            'in_stock', 'low_stock', 'created_date', 'updated_date'
        ]
        read_only_fields = ['id', 'created_date', 'updated_date']
    
    def get_in_stock(self, obj):
        return obj.is_in_stock()
    
    def get_low_stock(self, obj):
        return obj.is_low_stock()

class ProductCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'name', 'description', 'price', 'category', 'sub_category',
            'brand', 'sku', 'compatible_vehicles', 'condition',
            'stock_quantity', 'low_stock_threshold', 'image_url'
        ]

class ProductUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'name', 'description', 'price', 'sub_category',
            'brand', 'compatible_vehicles', 'stock_quantity',
            'low_stock_threshold', 'image_url', 'status'
        ]