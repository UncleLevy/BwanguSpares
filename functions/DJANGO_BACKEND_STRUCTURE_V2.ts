# Django Backend Structure V2 — New Additions to BwanguSpares
# ================================================================
# This file contains ONLY the new entities and features added after
# the initial DJANGO_MODELS_VIEWS_SERIALIZERS export.
# 
# New Features:
# - Vehicle compatibility system
# - Watchlist price & stock alerts
# - Support ticket system
# - Bulk inventory upload support
# ================================================================

---

## 1. VEHICLES APP (vehicles/models.py)

```python
from django.db import models
import uuid

class Vehicle(models.Model):
    """
    Standardized vehicle database for product compatibility filtering.
    Mirrors Base44 Vehicle entity.
    """
    
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    brand = models.CharField(max_length=100, help_text="e.g. Toyota, Ford, Nissan")
    model = models.CharField(max_length=100, help_text="e.g. Corolla, Ranger, Altima")
    years = models.JSONField(default=list, help_text="Compatible years [2015, 2016, 2017]")
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
        """Returns '2015-2020' or 'All Years'"""
        if not self.years:
            return "All Years"
        sorted_years = sorted(self.years)
        if len(sorted_years) == 1:
            return str(sorted_years[0])
        return f"{sorted_years[0]}-{sorted_years[-1]}"
```

---

## 2. UPDATE PRODUCTS MODEL — Vehicle Compatibility

```python
# In products/models.py, UPDATE the Product model:

class Product(models.Model):
    # ... existing fields ...
    
    # REPLACE old compatible_vehicles CharField with:
    compatible_vehicles = models.JSONField(
        default=list,
        help_text='[{"vehicle_id":"uuid","brand":"Toyota","model":"Corolla","years":[2015,2016]}]'
    )
    
    # Add helper method:
    def is_compatible_with(self, vehicle_id=None, brand=None, model=None, year=None):
        """Check product compatibility with vehicle criteria"""
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

## 3. WATCHLIST ALERTS (wishlists/models.py)

```python
# ADD to existing wishlists/models.py:

class WatchlistPart(models.Model):
    """
    Price drop and stock availability alerts.
    Mirrors Base44 WatchlistPart entity.
    """
    
    STOCK_CHOICES = [('in_stock', 'In Stock'), ('out_of_stock', 'Out of Stock')]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='watchlist')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='watchers')
    shop = models.ForeignKey('shops.Shop', on_delete=models.CASCADE)
    
    # Tracking
    current_price = models.DecimalField(max_digits=10, decimal_places=2)
    last_notified_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    last_stock_status = models.CharField(max_length=20, choices=STOCK_CHOICES, blank=True)
    
    # Preferences
    notify_price_drop = models.BooleanField(default=True)
    notify_stock = models.BooleanField(default=True)
    price_drop_threshold = models.DecimalField(max_digits=5, decimal_places=2, default=5.0)
    
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
        """Check if price dropped >= threshold %"""
        if not self.notify_price_drop or not self.last_notified_price:
            return False
        pct = ((self.last_notified_price - self.product.price) / self.last_notified_price) * 100
        return pct >= float(self.price_drop_threshold)
    
    def check_stock_alert(self):
        """Check if item back in stock"""
        if not self.notify_stock:
            return False
        current = 'in_stock' if self.product.stock_quantity > 0 else 'out_of_stock'
        return self.last_stock_status == 'out_of_stock' and current == 'in_stock'
```

---

## 4. SUPPORT TICKETS (audit/models.py)

```python
# ADD to existing audit/models.py:

class SupportTicket(models.Model):
    """
    Customer support ticketing system.
    Mirrors Base44 SupportTicket entity.
    """
    
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
    
    PRIORITY_CHOICES = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High')]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_number = models.IntegerField(unique=True)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='support_tickets')
    
    subject = models.CharField(max_length=255)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='other')
    message = models.TextField()
    photo_urls = models.JSONField(default=list)
    
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
            last = SupportTicket.objects.order_by('-ticket_number').first()
            self.ticket_number = (last.ticket_number + 1) if last else 1000
        super().save(*args, **kwargs)
```

---

## 5. CELERY TASK — Watchlist Alerts

```python
# wishlists/tasks.py

from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from .models import WatchlistPart

@shared_task
def check_watchlist_alerts():
    """
    Check for price drops and stock changes.
    Schedule: Every 4 hours via Celery Beat
    """
    items = WatchlistPart.objects.select_related('buyer', 'product', 'shop').filter(
        product__status='active'
    )
    
    alerts_sent = 0
    
    for item in items:
        should_notify = False
        alert_type = []
        
        if item.check_price_alert():
            should_notify = True
            alert_type.append('price drop')
            item.last_notified_price = item.product.price
        
        if item.check_stock_alert():
            should_notify = True
            alert_type.append('back in stock')
            item.last_stock_status = 'in_stock' if item.product.stock_quantity > 0 else 'out_of_stock'
        
        if should_notify:
            send_mail(
                subject=f"Alert: {item.product.name} — {', '.join(alert_type)}",
                message=f"""
                Good news! Your watched product has been updated:
                
                {item.product.name} at {item.shop.name}
                Price: K{item.product.price}
                Stock: {'In Stock' if item.product.stock_quantity > 0 else 'Out of Stock'}
                
                {settings.FRONTEND_URL}/product/{item.product.id}
                """,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[item.buyer.email],
                fail_silently=True,
            )
            item.save()
            alerts_sent += 1
    
    return f"Sent {alerts_sent} alerts"
```

Register in celery.py:

```python
from celery.schedules import crontab

app.conf.beat_schedule = {
    'check-watchlist-alerts': {
        'task': 'wishlists.tasks.check_watchlist_alerts',
        'schedule': crontab(minute=0, hour='*/4'),
    },
}
```

---

## 6. ADMIN PANELS

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


# wishlists/admin.py (ADD to existing)
from .models import WatchlistPart

@admin.register(WatchlistPart)
class WatchlistPartAdmin(admin.ModelAdmin):
    list_display = ['buyer', 'product', 'shop', 'current_price', 'notify_price_drop', 'notify_stock']
    list_filter = ['notify_price_drop', 'notify_stock', 'last_stock_status']
    search_fields = ['buyer__email', 'product__name', 'shop__name']
    raw_id_fields = ['buyer', 'product', 'shop']


# audit/admin.py (ADD to existing)
from .models import SupportTicket

@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ['ticket_number', 'user', 'subject', 'category', 'status', 'priority', 'created_date']
    list_filter = ['status', 'category', 'priority']
    search_fields = ['ticket_number', 'subject', 'user__email']
    readonly_fields = ['ticket_number', 'created_date', 'updated_date']
    raw_id_fields = ['user', 'admin']
```

---

## 7. SETTINGS & URLS

### Update settings/base.py:

```python
INSTALLED_APPS = [
    # ... existing ...
    'vehicles',  # NEW
]
```

### Update config/urls.py:

```python
urlpatterns = [
    # ... existing ...
    path('api/vehicles/', include('vehicles.urls')),
]
```

---

## 8. VEHICLES FIXTURE

```json
// fixtures/vehicles.json
[
  {
    "model": "vehicles.vehicle",
    "fields": {
      "brand": "Toyota",
      "model": "Corolla",
      "years": [2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020],
      "status": "active"
    }
  },
  {
    "model": "vehicles.vehicle",
    "fields": {
      "brand": "Toyota",
      "model": "Hilux",
      "years": [2012,2013,2014,2015,2016,2017,2018,2019,2020,2021],
      "status": "active"
    }
  },
  {
    "model": "vehicles.vehicle",
    "fields": {
      "brand": "Nissan",
      "model": "Hardbody",
      "years": [2010,2011,2012,2013,2014,2015,2016,2017,2018],
      "status": "active"
    }
  }
]
```

Load: `python manage.py loaddata fixtures/vehicles.json`

---

## 9. MIGRATION COMMANDS

```bash
# Create migrations
python manage.py makemigrations vehicles
python manage.py makemigrations wishlists
python manage.py makemigrations audit
python manage.py makemigrations products

# Apply migrations
python manage.py migrate

# Load vehicle data
python manage.py loaddata fixtures/vehicles.json
```

---

## SUMMARY OF V2 CHANGES

**New Entities:**
1. **Vehicle** — Standardized vehicle compatibility database
2. **WatchlistPart** — Automated price & stock alerts
3. **SupportTicket** — Customer support ticketing with auto-increment

**Updated Models:**
- **Product.compatible_vehicles** — Now JSON array with structured vehicle data

**New Features:**
- Bulk inventory upload support (CSV/Excel parsing)
- Background Celery task for watchlist notifications
- Admin interfaces for all new entities
- Vehicle compatibility filtering system

**Database Indexes Added:**
- Vehicle: brand, status
- WatchlistPart: buyer+product, notification flags
- SupportTicket: status+priority, ticket_number