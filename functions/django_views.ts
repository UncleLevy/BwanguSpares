"""
DRF Views for core API endpoints
"""
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Q
from .users_models import CustomUser
from .shops_models import Shop
from .products_models import Product
from .regions_models import Region
from .django_serializers import (
    UserRegisterSerializer, UserLoginSerializer, UserDetailSerializer, UserUpdateSerializer,
    RegionSerializer, ShopListSerializer, ShopDetailSerializer, ShopCreateSerializer, ShopUpdateSerializer,
    ProductListSerializer, ProductDetailSerializer, ProductCreateSerializer, ProductUpdateSerializer
)

# ===== AUTHENTICATION VIEWS =====
class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserDetailSerializer(user).data
        }, status=status.HTTP_201_CREATED)

class LoginView(generics.GenericAPIView):
    serializer_class = UserLoginSerializer
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = authenticate(
            email=serializer.validated_data['email'],
            password=serializer.validated_data['password']
        )
        
        if not user:
            return Response(
                {'detail': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserDetailSerializer(user).data
        })

class RefreshTokenView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        from rest_framework_simplejwt.views import TokenRefreshView
        view = TokenRefreshView.as_view()
        return view(request)

# ===== USER VIEWS =====
class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'update' or self.action == 'partial_update':
            return UserUpdateSerializer
        return UserDetailSerializer
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user profile"""
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put'])
    def update_profile(self, request):
        """Update current user profile"""
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserDetailSerializer(request.user).data)
    
    def get_queryset(self):
        # Users can only see their own profile, admins can see all
        if self.request.user.role == 'admin':
            return CustomUser.objects.all()
        return CustomUser.objects.filter(id=self.request.user.id)

# ===== REGION VIEWS =====
class RegionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Region.objects.all()
    serializer_class = RegionSerializer
    permission_classes = [AllowAny]
    pagination_class = None

# ===== SHOP VIEWS =====
class ShopViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ShopCreateSerializer
        elif self.action == 'update' or self.action == 'partial_update':
            return ShopUpdateSerializer
        elif self.action == 'list':
            return ShopListSerializer
        return ShopDetailSerializer
    
    def get_queryset(self):
        queryset = Shop.objects.all()
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by region
        region_filter = self.request.query_params.get('region_id')
        if region_filter:
            queryset = queryset.filter(region_id=region_filter)
        
        # Search by name
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(description__icontains=search))
        
        return queryset.order_by('-rating', '-created_date')
    
    def create(self, request, *args, **kwargs):
        """Create shop - requires authentication"""
        if not request.user.is_authenticated:
            return Response(
                {'detail': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        data = request.data.copy()
        data['owner_email'] = request.user.email
        data['owner_name'] = request.user.full_name
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response(ShopDetailSerializer(serializer.instance).data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def my_shop(self, request):
        """Get current user's shop"""
        if not request.user.is_authenticated:
            return Response(
                {'detail': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            shop = Shop.objects.get(owner_email=request.user.email)
            serializer = ShopDetailSerializer(shop)
            return Response(serializer.data)
        except Shop.DoesNotExist:
            return Response(
                {'detail': 'Shop not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        """Get products for a shop"""
        shop = self.get_object()
        products = Product.objects.filter(shop_id=str(shop.id))
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)

# ===== PRODUCT VIEWS =====
class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ProductCreateSerializer
        elif self.action == 'update' or self.action == 'partial_update':
            return ProductUpdateSerializer
        elif self.action == 'list':
            return ProductListSerializer
        return ProductDetailSerializer
    
    def get_queryset(self):
        queryset = Product.objects.filter(status='active')
        
        # Filter by shop
        shop_id = self.request.query_params.get('shop_id')
        if shop_id:
            queryset = queryset.filter(shop_id=shop_id)
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by condition
        condition = self.request.query_params.get('condition')
        if condition:
            queryset = queryset.filter(condition=condition)
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(brand__icontains=search)
            )
        
        # Price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        return queryset.order_by('-created_date')
    
    def create(self, request, *args, **kwargs):
        """Create product - requires authentication and shop"""
        if not request.user.is_authenticated:
            return Response(
                {'detail': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            shop = Shop.objects.get(owner_email=request.user.email)
        except Shop.DoesNotExist:
            return Response(
                {'detail': 'Shop not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        data = request.data.copy()
        data['shop_id'] = str(shop.id)
        data['shop_name'] = shop.name
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response(ProductDetailSerializer(serializer.instance).data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def my_products(self, request):
        """Get current user's shop products"""
        if not request.user.is_authenticated:
            return Response(
                {'detail': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            shop = Shop.objects.get(owner_email=request.user.email)
            products = Product.objects.filter(shop_id=str(shop.id))
            serializer = ProductListSerializer(products, many=True)
            return Response(serializer.data)
        except Shop.DoesNotExist:
            return Response(
                {'detail': 'Shop not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['patch'])
    def update_stock(self, request, pk=None):
        """Update product stock"""
        product = self.get_object()
        new_quantity = request.data.get('stock_quantity')
        
        if new_quantity is None:
            return Response(
                {'detail': 'stock_quantity required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        product.stock_quantity = new_quantity
        if new_quantity == 0:
            product.status = 'out_of_stock'
        else:
            product.status = 'active'
        product.save()
        
        return Response(ProductDetailSerializer(product).data)