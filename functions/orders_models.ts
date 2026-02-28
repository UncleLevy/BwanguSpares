"""
Order and Cart models for transactions
"""
from django.db import models
import uuid
from decimal import Decimal

class CartItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer_email = models.EmailField(db_index=True)
    product_id = models.CharField(max_length=36)
    product_name = models.CharField(max_length=255)
    shop_id = models.CharField(max_length=36)
    shop_name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField(default=1)
    image_url = models.URLField(blank=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'orders_cartitem'
        unique_together = ('buyer_email', 'product_id')
    
    def get_total(self):
        return self.price * self.quantity
    
    def __str__(self):
        return f"{self.product_name} x {self.quantity}"


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer_email = models.EmailField(db_index=True)
    buyer_name = models.CharField(max_length=255)
    shop_id = models.CharField(max_length=36, db_index=True)
    shop_name = models.CharField(max_length=255)
    
    # Items JSON array
    items = models.JSONField(default=list)
    
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    
    # Delivery info
    delivery_address = models.TextField()
    delivery_phone = models.CharField(max_length=20)
    notes = models.TextField(blank=True)
    
    # Tracking
    tracking_number = models.CharField(max_length=100, blank=True)
    current_location = models.CharField(max_length=255, blank=True)
    estimated_delivery = models.DateField(null=True, blank=True)
    
    # Payment
    payment_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
            ('refunded', 'Refunded'),
        ],
        default='pending'
    )
    stripe_payment_id = models.CharField(max_length=255, blank=True)
    
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'orders_order'
        ordering = ['-created_date']
        indexes = [
            models.Index(fields=['buyer_email', '-created_date']),
            models.Index(fields=['shop_id', 'status']),
        ]
    
    def __str__(self):
        return f"Order {self.id[:8]} - {self.buyer_email}"
    
    def calculate_total(self):
        """Calculate total from items"""
        return sum(
            Decimal(str(item['price'])) * item['quantity']
            for item in self.items
        )


class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_id = models.CharField(max_length=36, db_index=True)
    buyer_email = models.EmailField(db_index=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='ZMW')
    
    stripe_payment_id = models.CharField(max_length=255, unique=True)
    stripe_charge_id = models.CharField(max_length=255, blank=True)
    
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('succeeded', 'Succeeded'),
            ('failed', 'Failed'),
            ('refunded', 'Refunded'),
        ],
        default='pending'
    )
    
    error_message = models.TextField(blank=True)
    refund_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'orders_payment'
        ordering = ['-created_date']
    
    def __str__(self):
        return f"Payment {self.id[:8]} - {self.status}"