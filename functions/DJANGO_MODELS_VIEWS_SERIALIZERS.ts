# Django Models, Views, and Serializers — BwanguSpares Standalone Export
# ========================================================================
# HOW TO USE:
# Copy each model class into the corresponding app's models.py
# Copy serializers into the app's serializers.py
# Copy views into the app's views.py
# Run: python manage.py makemigrations && python manage.py migrate
#
# All models use UUID primary keys to match Base44 entity IDs.
# created_date / updated_date match Base44's built-in timestamps.
# ========================================================================

---

## 1. USERS APP (users/models.py)

```python
from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid

class User(AbstractUser):
    """Custom user — replaces Base44 built-in User entity."""

    ROLE_CHOICES = [
        ('buyer', 'Buyer'),
        ('shop_owner', 'Shop Owner'),
        ('admin', 'Admin'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='buyer')
    profile_picture_url = models.URLField(blank=True)
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

    def is_admin_user(self):
        return self.role == 'admin'


class BannedUser(models.Model):
    """Mirrors Base44 BannedUser entity."""

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
    banned_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='bans_issued'
    )
    created_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_date']

    def __str__(self):
        return f"{self.email} - {self.get_ban_type_display()}"

    def is_active_ban(self):
        if self.ban_expires is None:
            return True
        from django.utils import timezone
        return timezone.now().date() <= self.ban_expires
```

---

## 2. REGIONS APP (regions/models.py)

```python
class Region(models.Model):
    """Mirrors Base44 Region entity."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    province = models.CharField(max_length=100, blank=True)
    created_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Town(models.Model):
    """Mirrors Base44 Town entity."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name='towns')
    region_name = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    description = models.TextField(blank=True)
    created_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name}, {self.region_name}"
```

---

## 3. SHOPS APP (shops/models.py)

```python
from django.core.validators import MinValueValidator, MaxValueValidator

class Shop(models.Model):
    """Mirrors Base44 Shop entity."""

    STATUS_CHOICES = [
        ('pending', 'Pending'), ('approved', 'Approved'),
        ('suspended', 'Suspended'), ('rejected', 'Rejected'),
    ]
    SLOT_CHOICES = [
        ('basic', 'Basic'), ('standard', 'Standard'), ('premium', 'Premium'),
    ]
    STRIPE_STATUS_CHOICES = [
        ('not_connected', 'Not Connected'), ('onboarding', 'Onboarding'),
        ('active', 'Active'), ('restricted', 'Restricted'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.OneToOneField('users.User', on_delete=models.CASCADE, related_name='shop')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    phone = models.CharField(max_length=20)
    address = models.CharField(max_length=255)
    region = models.ForeignKey('regions.Region', on_delete=models.SET_NULL, null=True)
    region_name = models.CharField(max_length=100, blank=True)
    town = models.CharField(max_length=100, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    logo_url = models.URLField(blank=True)
    cover_url = models.URLField(blank=True)
    business_registration_number = models.CharField(max_length=100, blank=True)
    tax_identification_number = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    rating = models.FloatField(default=0, validators=[MinValueValidator(0), MaxValueValidator(5)])
    total_sales = models.IntegerField(default=0)
    slot_type = models.CharField(max_length=20, choices=SLOT_CHOICES, default='basic')
    stripe_account_id = models.CharField(max_length=100, blank=True)
    stripe_account_status = models.CharField(max_length=20, choices=STRIPE_STATUS_CHOICES, default='not_connected')
    payout_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=500)
    loyalty_enabled = models.BooleanField(default=False)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_date']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['region']),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_status_display()})"


class Technician(models.Model):
    """Mirrors Base44 Technician entity."""

    SPECIALIZATION_CHOICES = [
        ('engine', 'Engine'), ('electrical', 'Electrical'), ('body_work', 'Body Work'),
        ('transmission', 'Transmission'), ('brakes', 'Brakes'), ('general', 'General'),
        ('diagnostics', 'Diagnostics'), ('ac_heating', 'AC/Heating'), ('tyres', 'Tyres'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='technicians')
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True)
    specialization = models.CharField(max_length=50, choices=SPECIALIZATION_CHOICES)
    experience_years = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    photo_url = models.URLField(blank=True)
    available = models.BooleanField(default=True)
    rating = models.FloatField(default=0, validators=[MinValueValidator(0), MaxValueValidator(5)])
    created_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-rating']

    def __str__(self):
        return f"{self.name} ({self.get_specialization_display()}) @ {self.shop.name}"


class Branch(models.Model):
    """Mirrors Base44 Branch entity."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='branches')
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    created_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.shop.name} — {self.name}"
```

---

## 4. PRODUCTS APP (products/models.py)

```python
class Product(models.Model):
    """Mirrors Base44 Product entity."""

    CATEGORY_CHOICES = [
        ('engine','Engine'),('brakes','Brakes'),('suspension','Suspension'),
        ('electrical','Electrical'),('body','Body'),('transmission','Transmission'),
        ('exhaust','Exhaust'),('cooling','Cooling'),('steering','Steering'),
        ('interior','Interior'),('accessories','Accessories'),('tyres','Tyres'),
        ('filters','Filters'),('oils_fluids','Oils & Fluids'),('other','Other'),
    ]
    CONDITION_CHOICES = [('new','New'),('used','Used'),('refurbished','Refurbished')]
    STATUS_CHOICES = [('active','Active'),('inactive','Inactive'),('out_of_stock','Out of Stock')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shop = models.ForeignKey('shops.Shop', on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    sub_category = models.CharField(max_length=100, blank=True)
    brand = models.CharField(max_length=100, blank=True)
    sku = models.CharField(max_length=100, blank=True)
    compatible_vehicles = models.CharField(max_length=255, blank=True)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='new')
    stock_quantity = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    low_stock_threshold = models.IntegerField(default=5)
    image_url = models.URLField(blank=True)
    image_urls = models.JSONField(default=list)       # Up to 5 photos
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    tags = models.JSONField(default=list)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_date']
        indexes = [
            models.Index(fields=['shop', 'status']),
            models.Index(fields=['category']),
        ]

    def __str__(self):
        return self.name

    def is_in_stock(self):
        return self.stock_quantity > 0

    def is_low_stock(self):
        return 0 < self.stock_quantity <= self.low_stock_threshold


class ProductVariation(models.Model):
    """Mirrors Base44 ProductVariation entity."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variations')
    name = models.CharField(max_length=100)          # e.g. "Size", "Color"
    value = models.CharField(max_length=100)         # e.g. "Large", "Red"
    price_delta = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock_quantity = models.IntegerField(default=0)
    sku = models.CharField(max_length=100, blank=True)
    created_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.name} — {self.name}: {self.value}"
```

---

## 5. CART APP (cart/models.py)

```python
class CartItem(models.Model):
    """Mirrors Base44 CartItem entity."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='cart_items')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    shop = models.ForeignKey('shops.Shop', on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    created_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('buyer', 'product')
        ordering = ['-created_date']

    def subtotal(self):
        return self.price * self.quantity
```

---

## 6. ORDERS APP (orders/models.py)

```python
class Order(models.Model):
    """Mirrors Base44 Order entity."""

    STATUS_CHOICES = [
        ('pending','Pending'),('confirmed','Confirmed'),('processing','Processing'),
        ('shipped','Shipped'),('delivered','Delivered'),('cancelled','Cancelled'),
    ]
    PAYOUT_STATUS_CHOICES = [
        ('pending','Pending'),('awaiting_delivery','Awaiting Delivery'),
        ('delivery_confirmed','Delivery Confirmed'),('payout_requested','Payout Requested'),
        ('payout_approved','Payout Approved'),('payout_completed','Payout Completed'),
    ]
    SHIPPING_CHOICES = [('collect','Collect'),('deliver','Deliver')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='orders')
    shop = models.ForeignKey('shops.Shop', on_delete=models.CASCADE, related_name='received_orders')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    delivery_address = models.CharField(max_length=255, blank=True)
    delivery_phone = models.CharField(max_length=20, blank=True)
    notes = models.TextField(blank=True)
    tracking_number = models.CharField(max_length=100, blank=True)
    current_location = models.CharField(max_length=255, blank=True)
    estimated_delivery = models.DateField(null=True, blank=True)
    payment_method = models.CharField(max_length=50, blank=True)
    stripe_session_id = models.CharField(max_length=255, blank=True)
    coupon_code = models.CharField(max_length=100, blank=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cancellation_reason = models.TextField(blank=True)
    refunded = models.BooleanField(default=False)
    refund_id = models.CharField(max_length=100, blank=True)
    payout_status = models.CharField(max_length=30, choices=PAYOUT_STATUS_CHOICES, default='pending')
    delivery_confirmed_at = models.DateTimeField(null=True, blank=True)
    payout_request_date = models.DateTimeField(null=True, blank=True)
    shipping_option = models.CharField(max_length=20, choices=SHIPPING_CHOICES, default='collect')
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
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
        return f"Order {self.id} — {self.buyer.email}"

    def can_be_cancelled(self):
        return self.status in ['pending', 'confirmed']


class OrderItem(models.Model):
    """Line items for an Order."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.SET_NULL, null=True)
    product_name = models.CharField(max_length=255)   # Snapshot at purchase time
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    price_at_purchase = models.DecimalField(max_digits=10, decimal_places=2)
    image_url = models.URLField(blank=True)

    def subtotal(self):
        return self.quantity * self.price_at_purchase
```

---

## 7. RETURNS APP (returns/models.py)

```python
class Return(models.Model):
    """Mirrors Base44 Return entity."""

    REASON_CHOICES = [
        ('defective','Defective'),('not_as_described','Not As Described'),
        ('damaged','Damaged'),('incorrect_item','Incorrect Item'),
        ('unsatisfied','Unsatisfied'),('other','Other'),
    ]
    STATUS_CHOICES = [
        ('pending','Pending'),('approved','Approved'),
        ('rejected','Rejected'),('refunded','Refunded'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='returns')
    buyer = models.ForeignKey('users.User', on_delete=models.CASCADE)
    shop = models.ForeignKey('shops.Shop', on_delete=models.CASCADE)
    product = models.ForeignKey('products.Product', on_delete=models.SET_NULL, null=True)
    product_name = models.CharField(max_length=255)
    reason = models.CharField(max_length=30, choices=REASON_CHOICES)
    description = models.TextField(blank=True)
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approval_notes = models.TextField(blank=True)
    refund_id = models.CharField(max_length=100, blank=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
```

---

## 8. SHIPPING APP (shipping/models.py)

```python
class ShippingRate(models.Model):
    """Mirrors Base44 ShippingRate entity."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    town = models.OneToOneField('regions.Town', on_delete=models.CASCADE, related_name='shipping_rate')
    town_name = models.CharField(max_length=100)
    region = models.ForeignKey('regions.Region', on_delete=models.SET_NULL, null=True)
    region_name = models.CharField(max_length=100, blank=True)
    default_rate = models.DecimalField(max_digits=10, decimal_places=2)
    set_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    updated_date = models.DateTimeField(auto_now=True)
```

---

## 9. WALLET APP (wallet/models.py)

```python
class BuyerWallet(models.Model):
    """Mirrors Base44 BuyerWallet entity."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer = models.OneToOneField('users.User', on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_credited = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    updated_date = models.DateTimeField(auto_now=True)

    def credit(self, amount, reason, order=None):
        self.balance += amount
        self.total_credited += amount
        self.save()
        WalletTransaction.objects.create(
            buyer=self.buyer, type='credit', amount=amount, reason=reason,
            order=order
        )

    def debit(self, amount, reason, order=None):
        self.balance -= amount
        self.total_spent += amount
        self.save()
        WalletTransaction.objects.create(
            buyer=self.buyer, type='debit', amount=amount, reason=reason,
            order=order
        )


class WalletTransaction(models.Model):
    """Mirrors Base44 WalletTransaction entity."""
    TYPE_CHOICES = [('credit','Credit'),('debit','Debit')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='wallet_transactions')
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.CharField(max_length=255)
    order = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, blank=True)
    shop_name = models.CharField(max_length=255, blank=True)
    created_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_date']
```

---

## 10. LOYALTY APP (loyalty/models.py)

```python
class LoyaltyPoints(models.Model):
    """Mirrors Base44 LoyaltyPoints entity."""
    TIER_CHOICES = [
        ('bronze','Bronze'),('silver','Silver'),('gold','Gold'),('platinum','Platinum'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer = models.OneToOneField('users.User', on_delete=models.CASCADE, related_name='loyalty')
    points_balance = models.IntegerField(default=0)
    total_earned = models.IntegerField(default=0)
    total_redeemed = models.IntegerField(default=0)
    tier = models.CharField(max_length=20, choices=TIER_CHOICES, default='bronze')
    updated_date = models.DateTimeField(auto_now=True)

    def recalculate_tier(self):
        if self.total_earned >= 5000:
            self.tier = 'platinum'
        elif self.total_earned >= 2000:
            self.tier = 'gold'
        elif self.total_earned >= 500:
            self.tier = 'silver'
        else:
            self.tier = 'bronze'
        self.save()


class LoyaltyTransaction(models.Model):
    """Mirrors Base44 LoyaltyTransaction entity."""
    TYPE_CHOICES = [('earn','Earn'),('redeem','Redeem')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='loyalty_transactions')
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    points = models.IntegerField()
    reason = models.CharField(max_length=255)
    order = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, blank=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_date']
```

---

## 11. MESSAGING APP (messaging/models.py)

```python
class Conversation(models.Model):
    """Mirrors Base44 Conversation entity."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='conversations')
    shop = models.ForeignKey('shops.Shop', on_delete=models.CASCADE, related_name='conversations')
    subject = models.CharField(max_length=255, blank=True)
    last_message = models.TextField(blank=True)
    last_message_date = models.DateTimeField(null=True, blank=True)
    buyer_unread = models.IntegerField(default=0)
    shop_unread = models.IntegerField(default=0)
    created_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('buyer', 'shop')
        ordering = ['-last_message_date']


class Message(models.Model):
    """Mirrors Base44 Message entity."""
    SENDER_ROLE_CHOICES = [('buyer','Buyer'),('shop','Shop')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey('users.User', on_delete=models.CASCADE)
    sender_role = models.CharField(max_length=10, choices=SENDER_ROLE_CHOICES)
    content = models.TextField()
    read = models.BooleanField(default=False)
    created_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_date']
```

---

## 12. PARTS REQUESTS APP (parts_requests/models.py)

```python
class PartsRequest(models.Model):
    """Mirrors Base44 PartsRequest entity."""

    CATEGORY_CHOICES = [  # Same as Product.CATEGORY_CHOICES
        ('engine','Engine'),('brakes','Brakes'),('suspension','Suspension'),
        ('electrical','Electrical'),('body','Body'),('transmission','Transmission'),
        ('exhaust','Exhaust'),('cooling','Cooling'),('steering','Steering'),
        ('interior','Interior'),('accessories','Accessories'),('tyres','Tyres'),
        ('filters','Filters'),('oils_fluids','Oils & Fluids'),('other','Other'),
    ]
    STATUS_CHOICES = [
        ('open','Open'),('counter_offered','Counter Offered'),
        ('accepted','Accepted'),('fulfilled','Fulfilled'),('cancelled','Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='parts_requests')
    buyer_phone = models.CharField(max_length=20, blank=True)
    buyer_region = models.CharField(max_length=100, blank=True)
    part_name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, blank=True)
    compatible_vehicles = models.CharField(max_length=255, blank=True)
    budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    accepted_by_shop = models.ForeignKey('shops.Shop', on_delete=models.SET_NULL, null=True, blank=True)
    accepted_date = models.DateField(null=True, blank=True)
    shop_counter_budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    shop_counter_message = models.TextField(blank=True)
    counter_by_shop = models.ForeignKey(
        'shops.Shop', on_delete=models.SET_NULL, null=True, blank=True, related_name='counter_offers'
    )
    buyer_response = models.CharField(max_length=20, blank=True)  # 'agreed' or 'declined'
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
```

---

## 13. APPOINTMENTS APP (appointments/models.py)

```python
PROBLEM_CHOICES = [
    ('engine','Engine'),('electrical','Electrical'),('body_work','Body Work'),
    ('transmission','Transmission'),('brakes','Brakes'),('diagnostics','Diagnostics'),
    ('ac_heating','AC/Heating'),('tyres','Tyres'),('general','General'),
]

class TechnicianHireRequest(models.Model):
    """Mirrors Base44 TechnicianHireRequest entity."""

    STATUS_CHOICES = [
        ('pending','Pending'),('counter_offered','Counter Offered'),
        ('accepted','Accepted'),('rejected','Rejected'),('completed','Completed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    technician = models.ForeignKey('shops.Technician', on_delete=models.CASCADE)
    shop = models.ForeignKey('shops.Shop', on_delete=models.CASCADE)
    buyer = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='hire_requests')
    buyer_phone = models.CharField(max_length=20, blank=True)
    problem_type = models.CharField(max_length=50, choices=PROBLEM_CHOICES)
    description = models.TextField(blank=True)
    preferred_date = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=255, blank=True)
    buyer_budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    shop_counter_budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    shop_response = models.TextField(blank=True)
    buyer_response = models.CharField(max_length=20, blank=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)


class Appointment(models.Model):
    """Mirrors Base44 Appointment entity."""

    STATUS_CHOICES = [
        ('pending','Pending'),('confirmed','Confirmed'),
        ('completed','Completed'),('cancelled','Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    technician = models.ForeignKey('shops.Technician', on_delete=models.CASCADE, related_name='appointments')
    shop = models.ForeignKey('shops.Shop', on_delete=models.CASCADE)
    buyer = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='appointments')
    buyer_phone = models.CharField(max_length=20, blank=True)
    problem_type = models.CharField(max_length=50, choices=PROBLEM_CHOICES)
    description = models.TextField(blank=True)
    appointment_date = models.DateField()
    time_slot = models.CharField(max_length=50)         # e.g. "09:00 - 10:00"
    location = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    hire_request = models.ForeignKey(
        TechnicianHireRequest, on_delete=models.SET_NULL, null=True, blank=True
    )
    shop_notes = models.TextField(blank=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['appointment_date', 'time_slot']
```

---

## 14. REVIEWS APP (reviews/models.py)

```python
class Review(models.Model):
    """Mirrors Base44 Review entity."""

    TYPE_CHOICES = [('shop','Shop'),('technician','Technician')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, blank=True)
    reviewer = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='reviews')
    shop = models.ForeignKey('shops.Shop', on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    technician = models.ForeignKey('shops.Technician', on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    created_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_date']
```

---

## 15. NOTIFICATIONS APP (notifications/models.py)

```python
class Notification(models.Model):
    """Mirrors Base44 Notification entity."""

    TYPE_CHOICES = [
        ('order_update','Order Update'),('new_order','New Order'),('low_stock','Low Stock'),
        ('new_review','New Review'),('shop_registration','Shop Registration'),
        ('review_reminder','Review Reminder'),('system_alert','System Alert'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    read = models.BooleanField(default=False)
    related_id = models.CharField(max_length=100, blank=True)
    action_url = models.CharField(max_length=255, blank=True)
    created_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_date']
        indexes = [models.Index(fields=['user', 'read'])]
```

---

## 16. DISCOUNTS APP (discounts/models.py)

```python
class DiscountCode(models.Model):
    """Mirrors Base44 DiscountCode entity."""

    TYPE_CHOICES = [('percentage','Percentage'),('fixed','Fixed Amount')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_uses = models.IntegerField(null=True, blank=True)
    times_used = models.IntegerField(default=0)
    expires_at = models.DateTimeField(null=True, blank=True)
    active = models.BooleanField(default=True)
    shop = models.ForeignKey('shops.Shop', on_delete=models.CASCADE, null=True, blank=True)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    created_date = models.DateTimeField(auto_now_add=True)

    def is_valid(self, order_total):
        from django.utils import timezone
        if not self.active:
            return False, "Code is inactive"
        if self.expires_at and timezone.now() > self.expires_at:
            return False, "Code has expired"
        if self.max_uses and self.times_used >= self.max_uses:
            return False, "Code usage limit reached"
        if order_total < self.min_order_amount:
            return False, f"Minimum order amount is ZMW {self.min_order_amount}"
        return True, "Valid"
```

---

## 17. PAYOUTS APP (payouts/models.py)

```python
class ShopWallet(models.Model):
    """Mirrors Base44 ShopWallet entity."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shop = models.OneToOneField('shops.Shop', on_delete=models.CASCADE, related_name='shop_wallet')
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_earned = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_paid_out = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    updated_date = models.DateTimeField(auto_now=True)


class Payout(models.Model):
    """Mirrors Base44 Payout entity."""

    STATUS_CHOICES = [
        ('pending','Pending'),('approved','Approved'),
        ('completed','Completed'),('rejected','Rejected'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shop = models.ForeignKey('shops.Shop', on_delete=models.CASCADE, related_name='payouts')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    stripe_transfer_id = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)
    created_date = models.DateTimeField(auto_now_add=True)
```

---

## 18. AUDIT APP (audit/models.py)

```python
class AuditLog(models.Model):
    """Mirrors Base44 AuditLog entity."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=50)         # e.g. 'create', 'update', 'delete'
    entity_type = models.CharField(max_length=100)   # e.g. 'Order', 'Shop'
    entity_id = models.CharField(max_length=100)
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_date']
        indexes = [
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['user']),
        ]


class Report(models.Model):
    """Mirrors Base44 Report entity."""
    TYPE_CHOICES = [('shop','Shop'),('product','Product'),('user','User')]
    STATUS_CHOICES = [('open','Open'),('reviewed','Reviewed'),('resolved','Resolved')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reporter = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='reports_filed')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    related_id = models.CharField(max_length=100)
    reason = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    reviewed_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='reports_reviewed'
    )
    created_date = models.DateTimeField(auto_now_add=True)
```

---

## 19. MARKETING APP (marketing/models.py)

```python
class Campaign(models.Model):
    """Mirrors Base44 Campaign entity."""
    STATUS_CHOICES = [('draft','Draft'),('scheduled','Scheduled'),('sent','Sent'),('cancelled','Cancelled')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shop = models.ForeignKey('shops.Shop', on_delete=models.CASCADE, related_name='campaigns')
    title = models.CharField(max_length=255)
    body = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    scheduled_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    recipient_count = models.IntegerField(default=0)
    open_count = models.IntegerField(default=0)
    created_date = models.DateTimeField(auto_now_add=True)


class Customer(models.Model):
    """Mirrors Base44 Customer entity — shop's customer list for campaigns."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shop = models.ForeignKey('shops.Shop', on_delete=models.CASCADE, related_name='customers')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, null=True, blank=True)
    email = models.EmailField()
    full_name = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    subscribed = models.BooleanField(default=True)
    created_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('shop', 'email')
```

---

## 20. SUBSCRIPTIONS APP (subscriptions/models.py)

```python
class Subscription(models.Model):
    """Mirrors Base44 Subscription entity — shop slot subscriptions."""
    PLAN_CHOICES = [('basic','Basic'),('standard','Standard'),('premium','Premium')]
    STATUS_CHOICES = [('active','Active'),('expired','Expired'),('cancelled','Cancelled')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shop = models.ForeignKey('shops.Shop', on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    stripe_subscription_id = models.CharField(max_length=100, blank=True)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_date = models.DateTimeField(auto_now_add=True)
```

---

## 21. WISHLISTS APP (wishlists/models.py)

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
```

---

## 22. SERIALIZERS — General Pattern

Every app serializer follows this pattern. Adapt field lists to your needs:

```python
# Example: shops/serializers.py
from rest_framework import serializers
from .models import Shop, Technician

class ShopListSerializer(serializers.ModelSerializer):
    owner_email = serializers.CharField(source='owner.email', read_only=True)
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Shop
        fields = ['id', 'name', 'logo_url', 'region_name', 'town', 'rating',
                  'status', 'slot_type', 'owner_email', 'product_count', 'created_date']

    def get_product_count(self, obj):
        return obj.products.filter(status='active').count()


class ShopDetailSerializer(serializers.ModelSerializer):
    owner_email = serializers.CharField(source='owner.email', read_only=True)
    technicians = serializers.SerializerMethodField()

    class Meta:
        model = Shop
        fields = '__all__'
        read_only_fields = ['id', 'created_date', 'updated_date', 'total_sales', 'rating']

    def get_technicians(self, obj):
        from shops.serializers import TechnicianSerializer
        return TechnicianSerializer(obj.technicians.filter(available=True), many=True).data
```

---

## 23. PERMISSIONS — General Pattern

```python
# permissions.py (shared or per-app)
from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsShopOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.owner == request.user

class IsShopOwner(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'shop')

class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsBuyerOwner(BasePermission):
    """Only the buyer who owns the record can access it."""
    def has_object_permission(self, request, view, obj):
        return obj.buyer == request.user
```

---

## 24. SIGNALS — Replacing Base44 Entity Automations

```python
# orders/signals.py  — fires notifications on order status change
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Order
from notifications.models import Notification

@receiver(post_save, sender=Order)
def notify_order_update(sender, instance, created, **kwargs):
    if created:
        # Notify shop owner of new order
        Notification.objects.create(
            user=instance.shop.owner,
            type='new_order',
            title='New Order Received',
            message=f'You have a new order from {instance.buyer.full_name}.',
            related_id=str(instance.id),
        )
    else:
        # Notify buyer of status change
        Notification.objects.create(
            user=instance.buyer,
            type='order_update',
            title=f'Order {instance.get_status_display()}',
            message=f'Your order status has been updated to {instance.get_status_display()}.',
            related_id=str(instance.id),
        )
```

Connect signals in apps.py:
```python
# orders/apps.py
class OrdersConfig(AppConfig):
    name = 'orders'

    def ready(self):
        import orders.signals  # noqa
```

---

## 25. BEST PRACTICES FOR STANDALONE DEPLOYMENT

### Query Optimization
- Use `select_related()` for ForeignKey fields in list views
- Use `prefetch_related()` for reverse FK and M2M in detail views
- Add `db_index=True` on fields used in `.filter()` frequently

### Security
- Never expose `stripe_account_id` or payment secrets in serializers
- Use `read_only_fields` for auto-computed fields
- Always filter querysets by `request.user` to prevent data leakage

### File Uploads
- Replace Base44 `UploadFile` integration with Django's `ImageField` + S3 via `django-storages`
- Store only the S3 URL in `image_url` / `logo_url` fields

### Background Tasks (replacing Base44 automations)
- Use Celery + Redis for all async work (emails, stock alerts, payouts)
- Register periodic tasks in Django admin (django-celery-beat)

### Real-time Updates (replacing Base44 subscriptions)
- Use Django Channels + WebSockets for real-time notifications
- Or poll `/api/notifications/?read=false` every 30 seconds as a simpler alternative