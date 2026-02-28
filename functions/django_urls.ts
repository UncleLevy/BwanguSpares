"""
URL routing configuration for the API
Copy this to your main urls.py
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .django_views import (
    RegisterView, LoginView, RefreshTokenView,
    UserViewSet, RegionViewSet, ShopViewSet, ProductViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'regions', RegionViewSet, basename='region')
router.register(r'shops', ShopViewSet, basename='shop')
router.register(r'products', ProductViewSet, basename='product')

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/refresh/', RefreshTokenView.as_view(), name='refresh-token'),
    
    # API routes
    path('api/', include(router.urls)),
]