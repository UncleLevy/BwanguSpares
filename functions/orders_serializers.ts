"""
Serializers for Orders, Cart, and Payments
"""
from rest_framework import serializers
from .orders_models import CartItem, Order, Payment

# ===== CART SERIALIZERS =====
class CartItemSerializer(serializers.ModelSerializer):
    total = serializers.SerializerMethodField()
    
    class Meta:
        model = CartItem
        fields = [
            'id', 'buyer_email', 'product_id', 'product_name',
            'shop_id', 'shop_name', 'price', 'quantity',
            'image_url', 'total', 'created_date'
        ]
        read_only_fields = ['id', 'created_date']
    
    def get_total(self, obj):
        return obj.get_total()

class CartItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = [
            'product_id', 'product_name', 'shop_id', 'shop_name',
            'price', 'quantity', 'image_url'
        ]

class CartItemUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = ['quantity']

# ===== ORDER SERIALIZERS =====
class OrderItemSerializer(serializers.Serializer):
    """Serializer for individual order items"""
    product_id = serializers.CharField()
    product_name = serializers.CharField()
    quantity = serializers.IntegerField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    image_url = serializers.URLField(required=False)

class OrderListSerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'buyer_email', 'buyer_name', 'shop_name',
            'total_amount', 'status', 'payment_status',
            'item_count', 'created_date'
        ]
    
    def get_item_count(self, obj):
        return len(obj.items)

class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, source='items')
    
    class Meta:
        model = Order
        fields = [
            'id', 'buyer_email', 'buyer_name', 'shop_id', 'shop_name',
            'items', 'total_amount', 'status', 'payment_status',
            'delivery_address', 'delivery_phone', 'notes',
            'tracking_number', 'current_location', 'estimated_delivery',
            'stripe_payment_id', 'created_date', 'updated_date'
        ]
        read_only_fields = ['id', 'created_date', 'updated_date', 'stripe_payment_id']

class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    
    class Meta:
        model = Order
        fields = [
            'shop_id', 'shop_name', 'items', 'total_amount',
            'delivery_address', 'delivery_phone', 'notes'
        ]
    
    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Order must have at least one item")
        return value

class OrderUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['status', 'tracking_number', 'current_location', 'estimated_delivery', 'notes']

class OrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['status', 'tracking_number', 'current_location', 'estimated_delivery']

# ===== PAYMENT SERIALIZERS =====
class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id', 'order_id', 'buyer_email', 'amount', 'currency',
            'stripe_payment_id', 'status', 'refund_amount',
            'created_date', 'updated_date'
        ]
        read_only_fields = [
            'id', 'stripe_payment_id', 'stripe_charge_id',
            'status', 'created_date', 'updated_date'
        ]

class PaymentIntentSerializer(serializers.Serializer):
    """Serializer for creating Stripe payment intent"""
    order_id = serializers.CharField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField(default='ZMW')

class PaymentWebhookSerializer(serializers.Serializer):
    """Serializer for Stripe webhook events"""
    type = serializers.CharField()
    data = serializers.JSONField()