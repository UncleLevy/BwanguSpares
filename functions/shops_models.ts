"""
Shop model for sellers
"""
from django.db import models
import uuid

class Shop(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('suspended', 'Suspended'),
        ('rejected', 'Rejected'),
    ]
    
    SLOT_CHOICES = [
        ('basic', 'Basic - Free'),
        ('standard', 'Standard'),
        ('premium', 'Premium'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    owner_email = models.EmailField()
    owner_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    address = models.TextField()
    region_id = models.CharField(max_length=36)
    region_name = models.CharField(max_length=100, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    logo_url = models.URLField(blank=True)
    cover_url = models.URLField(blank=True)
    business_registration_number = models.CharField(max_length=100)
    tax_identification_number = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    rating = models.FloatField(default=0.0)
    total_sales = models.IntegerField(default=0)
    slot_type = models.CharField(max_length=20, choices=SLOT_CHOICES, default='basic')
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'shops_shop'
        ordering = ['-created_date']
    
    def __str__(self):
        return self.name