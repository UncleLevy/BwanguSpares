# Django Models Addendum — Additional Entities for BwanguSpares
# ================================================================
# This file supplements DJANGO_MODELS_VIEWS_SERIALIZERS with new entities
# added after the initial export: Vehicle, WatchlistPart, and SupportTicket.
# ================================================================

## 1. VEHICLES APP (vehicles/models.py)

```python
from django.db import models
import uuid

class Vehicle(models.Model):
    """Mirrors Base44 Vehicle entity — vehicle compatibility for products."""
    
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    brand = models.CharField(max_length=100, help_text="e.g. Toyota, Ford, Nissan")
    model = models.CharField(max_length=100, help_text="e.g. Corolla, Ranger, Altima")
    years = models.JSONField(default=list, help_text="Compatible years [2015, 2016, 2017, ...]")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['brand', 'model']
        unique_together = ('brand', 'model')
        indexes = [
            models.Index(fields=['brand']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.brand} {self.model}"
    
    def year_range_display(self):
        """Returns human-readable year range, e.g. '2015-2020'"""
        if not self.years:
            return "All Years"
        sorted_years = sorted(self.years)
        if len(sorted_years) == 1:
            return str(sorted_years[0])
        return f"{sorted_years[0]}-{sorted_years[-1]}"
```

### Vehicle Serializers (vehicles/serializers.py)

```python
from rest_framework import serializers
from .models import Vehicle

class VehicleSerializer(serializers.ModelSerializer):
    year_range = serializers.CharField(source='year_range_display', read_only=True)
    
    class Meta:
        model = Vehicle
        fields = ['id', 'brand', 'model', 'years', 'year_range', 'status', 'created_date']
        read_only_fields = ['id', 'created_date']

class VehicleListSerializer(serializers.ModelSerializer):
    """Minimal serializer for dropdowns/filters"""
    class Meta:
        model = Vehicle
        fields = ['id', 'brand', 'model', 'years']
```

### Vehicle Views (vehicles/views.py)

```python
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from .models import Vehicle
from .serializers import VehicleSerializer, VehicleListSerializer

class VehicleViewSet(viewsets.ModelViewSet):
    """
    API endpoint for vehicles - used for product compatibility filtering
    """
    queryset = Vehicle.objects.filter(status='active')
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['brand', 'status']
    search_fields = ['brand', 'model']
    ordering_fields = ['brand', 'model', 'created_date']
    ordering = ['brand', 'model']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return VehicleListSerializer
        return VehicleSerializer
```

### Vehicle URLs (vehicles/urls.py)

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VehicleViewSet

router = DefaultRouter()
router.register(r'', VehicleViewSet, basename='vehicle')

urlpatterns = [
    path('', include(router.urls)),
]
```

---

## 2. UPDATE PRODUCTS APP — Add Vehicle Compatibility

### Update products/models.py

```python
# ADD THIS FIELD to the Product model:

class Product(models.Model):
    # ... existing fields ...
    
    # REPLACE the old compatible_vehicles CharField with:
    compatible_vehicles = models.JSONField(
        default=list,
        help_text="""Array of vehicle compatibility objects:
        [{"vehicle_id": "uuid", "brand": "Toyota", "model": "Corolla", "years": [2015,2016,2017]}]"""
    )
    
    # Add helper method:
    def is_compatible_with(self, vehicle_id=None, brand=None, model=None, year=None):
        """Check if product is compatible with given vehicle criteria"""
        if not self.compatible_vehicles:
            return False
        
        for compat in self.compatible_vehicles:
            if vehicle_id and compat.get('vehicle_id') != vehicle_id:
                continue
            if brand and compat.get('brand', '').lower() != brand.lower():
                continue
            if model and compat.get('model', '').lower() != model.lower():
                continue
            if year and year not in compat.get('years', []):
                continue
            return True
        
        return False
```

---

## 3. WISHLISTS APP — Add WatchlistPart

Update wishlists/models.py to include both Wishlist and WatchlistPart:

```python
class Wishlist(models.Model):
    """Mirrors Base44 Wishlist entity."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='wishlist_items')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    created_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('buyer', 'product')
        ordering = ['-created_date']


class WatchlistPart(models.Model):
    """Mirrors Base44 WatchlistPart entity — price & stock alerts."""
    
    STOCK_CHOICES = [('in_stock', 'In Stock'), ('out_of_stock', 'Out of Stock')]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='watchlist')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='watchers')
    shop = models.ForeignKey('shops.Shop', on_delete=models.CASCADE)
    
    # Tracking fields
    current_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Price when added")
    last_notified_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    last_stock_status = models.CharField(max_length=20, choices=STOCK_CHOICES, blank=True)
    
    # Notification preferences
    notify_price_drop = models.BooleanField(default=True)
    notify_stock = models.BooleanField(default=True)
    price_drop_threshold = models.DecimalField(
        max_digits=5, decimal_places=2, default=5.0,
        help_text="Minimum % price drop to trigger notification"
    )
    
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('buyer', 'product', 'shop')
        ordering = ['-created_date']
        indexes = [
            models.Index(fields=['buyer', 'product']),
            models.Index(fields=['notify_price_drop', 'notify_stock']),
        ]
    
    def __str__(self):
        return f"{self.buyer.email} watching {self.product.name}"
    
    def check_price_alert(self):
        """Check if price has dropped enough to trigger alert"""
        if not self.notify_price_drop or not self.last_notified_price:
            return False
        
        price_diff_pct = ((self.last_notified_price - self.product.price) / self.last_notified_price) * 100
        return price_diff_pct >= float(self.price_drop_threshold)
    
    def check_stock_alert(self):
        """Check if stock status changed to in_stock"""
        if not self.notify_stock:
            return False
        
        current_stock_status = 'in_stock' if self.product.stock_quantity > 0 else 'out_of_stock'
        return (self.last_stock_status == 'out_of_stock' and current_stock_status == 'in_stock')
```

---

## 4. AUDIT APP — Add SupportTicket

Update audit/models.py to include SupportTicket:

```python
# Add to existing audit/models.py

class SupportTicket(models.Model):
    """Mirrors Base44 SupportTicket entity."""
    
    CATEGORY_CHOICES = [
        ('order_issue', 'Order Issue'),
        ('payment_issue', 'Payment Issue'),
        ('account_issue', 'Account Issue'),
        ('shop_issue', 'Shop Issue'),
        ('technical', 'Technical'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_number = models.IntegerField(unique=True, help_text="Auto-incremented ticket number")
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='support_tickets')
    subject = models.CharField(max_length=255)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='other')
    message = models.TextField()
    photo_urls = models.JSONField(default=list, help_text="Array of attached photo URLs")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    
    # Admin response
    admin_reply = models.TextField(blank=True)
    admin = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True, 
        related_name='handled_tickets'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_date']
        indexes = [
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['user']),
            models.Index(fields=['ticket_number']),
        ]
    
    def __str__(self):
        return f"Ticket #{self.ticket_number} — {self.subject}"
    
    def save(self, *args, **kwargs):
        if not self.ticket_number:
            # Auto-increment ticket number
            last_ticket = SupportTicket.objects.order_by('-ticket_number').first()
            self.ticket_number = (last_ticket.ticket_number + 1) if last_ticket else 1000
        super().save(*args, **kwargs)
```

---

## 5. CELERY TASKS — Watchlist Alerts

Create wishlists/tasks.py for background alerts:

```python
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from .models import WatchlistPart

@shared_task
def check_watchlist_alerts():
    """
    Periodic task to check for price drops and stock changes.
    Run every 4 hours via Celery Beat.
    """
    watchlist_items = WatchlistPart.objects.select_related('buyer', 'product', 'shop').filter(
        product__status='active'
    )
    
    alerts_sent = 0
    
    for item in watchlist_items:
        should_notify = False
        alert_type = []
        
        # Check price drop
        if item.check_price_alert():
            should_notify = True
            alert_type.append('price drop')
            item.last_notified_price = item.product.price
        
        # Check stock change
        if item.check_stock_alert():
            should_notify = True
            alert_type.append('back in stock')
            item.last_stock_status = 'in_stock' if item.product.stock_quantity > 0 else 'out_of_stock'
        
        if should_notify:
            # Send email notification
            send_mail(
                subject=f"Alert: {item.product.name} — {', '.join(alert_type)}",
                message=f"""
                Good news! The product you're watching has been updated:
                
                {item.product.name} at {item.shop.name}
                Current Price: K{item.product.price}
                Stock: {'In Stock' if item.product.stock_quantity > 0 else 'Out of Stock'}
                
                View product: {settings.FRONTEND_URL}/product/{item.product.id}
                """,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[item.buyer.email],
                fail_silently=True,
            )
            
            item.save()
            alerts_sent += 1
    
    return f"Sent {alerts_sent} watchlist alerts"
```

Register in celery beat:

```python
# config/celery.py or in Django admin (Periodic Tasks)

from celery.schedules import crontab

app.conf.beat_schedule = {
    # ... existing tasks ...
    'check-watchlist-alerts': {
        'task': 'wishlists.tasks.check_watchlist_alerts',
        'schedule': crontab(minute=0, hour='*/4'),  # Every 4 hours
    },
}
```

---

## 6. UPDATE config/settings/base.py

Add the new apps to INSTALLED_APPS:

```python
INSTALLED_APPS = [
    # ... existing apps ...
    'vehicles',        # NEW
    # wishlists already exists, just ensure WatchlistPart model is added
]
```

Add vehicles to URL routing in config/urls.py:

```python
urlpatterns = [
    # ... existing routes ...
    path('api/vehicles/', include('vehicles.urls')),
]
```

---

## 7. MIGRATION COMMANDS

After adding all models, run:

```bash
python manage.py makemigrations vehicles
python manage.py makemigrations wishlists  # If WatchlistPart is new
python manage.py makemigrations audit      # If SupportTicket is new
python manage.py makemigrations products   # If updating compatible_vehicles
python manage.py migrate
```

---

## 8. ADMIN PANEL REGISTRATION

Register new models in Django admin:

```python
# vehicles/admin.py
from django.contrib import admin
from .models import Vehicle

@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ['brand', 'model', 'year_range_display', 'status', 'created_date']
    list_filter = ['status', 'brand']
    search_fields = ['brand', 'model']
    ordering = ['brand', 'model']


# wishlists/admin.py
from django.contrib import admin
from .models import Wishlist, WatchlistPart

@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ['buyer', 'product', 'created_date']
    search_fields = ['buyer__email', 'product__name']
    raw_id_fields = ['buyer', 'product']

@admin.register(WatchlistPart)
class WatchlistPartAdmin(admin.ModelAdmin):
    list_display = ['buyer', 'product', 'shop', 'current_price', 'notify_price_drop', 'notify_stock', 'created_date']
    list_filter = ['notify_price_drop', 'notify_stock', 'last_stock_status']
    search_fields = ['buyer__email', 'product__name', 'shop__name']
    raw_id_fields = ['buyer', 'product', 'shop']


# audit/admin.py (add to existing)
from .models import SupportTicket

@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ['ticket_number', 'user', 'subject', 'category', 'status', 'priority', 'created_date']
    list_filter = ['status', 'category', 'priority']
    search_fields = ['ticket_number', 'subject', 'user__email']
    readonly_fields = ['ticket_number', 'created_date', 'updated_date']
    raw_id_fields = ['user', 'admin']
    
    fieldsets = (
        ('Ticket Info', {
            'fields': ('ticket_number', 'user', 'subject', 'category', 'message', 'photo_urls')
        }),
        ('Status', {
            'fields': ('status', 'priority', 'admin_reply', 'admin', 'resolved_at')
        }),
        ('Timestamps', {
            'fields': ('created_date', 'updated_date'),
            'classes': ('collapse',)
        }),
    )
```

---

## 9. DATA SEEDING — Vehicles Fixture

Create a fixture for common Zambian vehicles:

```json
// fixtures/vehicles.json
[
  {
    "model": "vehicles.vehicle",
    "fields": {
      "brand": "Toyota",
      "model": "Corolla",
      "years": [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020],
      "status": "active"
    }
  },
  {
    "model": "vehicles.vehicle",
    "fields": {
      "brand": "Toyota",
      "model": "Hilux",
      "years": [2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021],
      "status": "active"
    }
  },
  {
    "model": "vehicles.vehicle",
    "fields": {
      "brand": "Nissan",
      "model": "Hardbody",
      "years": [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018],
      "status": "active"
    }
  },
  {
    "model": "vehicles.vehicle",
    "fields": {
      "brand": "Isuzu",
      "model": "KB",
      "years": [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018],
      "status": "active"
    }
  }
]
```

Load fixture:

```bash
python manage.py loaddata fixtures/vehicles.json
```

---

## SUMMARY OF NEW FEATURES

1. **Vehicle** — Standardized vehicle database for product compatibility filtering
2. **WatchlistPart** — Price drop & stock alerts with customizable thresholds
3. **SupportTicket** — Customer support ticketing system with priorities and categories
4. **Updated Product Model** — Structured vehicle compatibility (JSON array)
5. **Celery Tasks** — Background job for watchlist notifications
6. **Admin Panel** — Full CRUD interfaces for all new entities

All models follow the same UUID primary key pattern and timestamp conventions as the rest of the BwanguSpares platform.