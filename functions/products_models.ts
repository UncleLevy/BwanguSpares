"""
Product model for auto spare parts
"""
from django.db import models
import uuid

class Product(models.Model):
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
    shop_id = models.CharField(max_length=36, db_index=True)
    shop_name = models.CharField(max_length=255)
    name = models.CharField(max_length=255, db_index=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, db_index=True)
    sub_category = models.CharField(max_length=100, blank=True)
    brand = models.CharField(max_length=100, blank=True)
    sku = models.CharField(max_length=100, blank=True)
    compatible_vehicles = models.TextField(blank=True)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='new')
    stock_quantity = models.IntegerField(default=0)
    low_stock_threshold = models.IntegerField(default=5)
    image_url = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'products_product'
        ordering = ['-created_date']
        indexes = [
            models.Index(fields=['shop_id', 'category']),
            models.Index(fields=['name', 'category']),
        ]
    
    def __str__(self):
        return self.name
    
    def is_in_stock(self):
        return self.stock_quantity > 0
    
    def is_low_stock(self):
        return self.stock_quantity <= self.low_stock_threshold