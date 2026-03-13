# Django Backend Structure V2 — New Additions to BwanguSpares

This document contains ONLY the new entities and features added after the initial `DJANGO_MODELS_VIEWS_SERIALIZERS` export.

## New Features Added
- Vehicle compatibility system
- Watchlist price & stock alerts  
- Support ticket system
- Bulk inventory upload support

---

## 1. VEHICLES APP

**File: `vehicles/models.py`**

```python
from django.db import models
import uuid

class Vehicle(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    years = models.JSONField(default=list)
    status = models.CharField(max_length=20, choices=[('active','Active'),('inactive','Inactive')], default='active')
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['brand', 'model']
        unique_together = ('brand', 'model')
        indexes = [models.Index(fields=['brand']), models.Index(fields=['status'])]
```

---

## 2. UPDATE PRODUCTS MODEL

**File: `products/models.py`**

```python
# REPLACE compatible_vehicles CharField with:
compatible_vehicles = models.JSONField(default=list)

# ADD method:
def is_compatible_with(self, vehicle_id=None, brand=None, model=None, year=None):
    if not self.compatible_vehicles:
        return False
    for compat in self.compatible_vehicles:
        if vehicle_id and compat.get('vehicle_id') != vehicle_id:
            continue
        if brand and compat.get('brand','').lower() != brand.lower():
            continue
        if model and compat.get('model','').lower() != model.lower():
            continue
        if year and year not in compat.get('years',[]):
            continue
        return True
    return False
```

---

## 3. WATCHLIST ALERTS

**File: `wishlists/models.py`** (ADD to existing)

```python
class WatchlistPart(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='watchlist')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='watchers')
    shop = models.ForeignKey('shops.Shop', on_delete=models.CASCADE)
    
    current_price = models.DecimalField(max_digits=10, decimal_places=2)
    last_notified_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    last_stock_status = models.CharField(max_length=20, blank=True)
    
    notify_price_drop = models.BooleanField(default=True)
    notify_stock = models.BooleanField(default=True)
    price_drop_threshold = models.DecimalField(max_digits=5, decimal_places=2, default=5.0)
    
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('buyer', 'product', 'shop')
        ordering = ['-created_date']
```

---

## 4. SUPPORT TICKETS

**File: `audit/models.py`** (ADD to existing)

```python
class SupportTicket(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_number = models.IntegerField(unique=True)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='support_tickets')
    
    subject = models.CharField(max_length=255)
    category = models.CharField(max_length=30, default='other')
    message = models.TextField()
    photo_urls = models.JSONField(default=list)
    
    status = models.CharField(max_length=20, default='open')
    priority = models.CharField(max_length=20, default='medium')
    
    admin_reply = models.TextField(blank=True)
    admin = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='handled_tickets')
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_date']
        indexes = [models.Index(fields=['status','priority']), models.Index(fields=['ticket_number'])]
    
    def save(self, *args, **kwargs):
        if not self.ticket_number:
            last = SupportTicket.objects.order_by('-ticket_number').first()
            self.ticket_number = (last.ticket_number + 1) if last else 1000
        super().save(*args, **kwargs)
```

---

## 5. CELERY TASK

**File: `wishlists/tasks.py`**

```python
from celery import shared_task
from django.core.mail import send_mail
from .models import WatchlistPart

@shared_task
def check_watchlist_alerts():
    items = WatchlistPart.objects.select_related('buyer','product','shop').filter(product__status='active')
    alerts_sent = 0
    
    for item in items:
        if item.check_price_alert() or item.check_stock_alert():
            send_mail(
                subject=f"Alert: {item.product.name}",
                message=f"Price: K{item.product.price}, Stock: {'In Stock' if item.product.stock_quantity > 0 else 'Out'}",
                from_email='noreply@bwangu.com',
                recipient_list=[item.buyer.email],
                fail_silently=True
            )
            item.save()
            alerts_sent += 1
    
    return f"Sent {alerts_sent} alerts"
```

---

## 6. MIGRATIONS

```bash
python manage.py makemigrations vehicles wishlists audit products
python manage.py migrate
```

---

## Summary

**3 New Models:** Vehicle, WatchlistPart, SupportTicket  
**1 Updated Model:** Product (compatible_vehicles now JSON)  
**New Background Task:** Watchlist alerts every 4 hours