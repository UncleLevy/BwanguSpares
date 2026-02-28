"""
Views for Orders, Cart, and Payments
"""
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q
import stripe
from decimal import Decimal
from .orders_models import CartItem, Order, Payment
from .orders_serializers import (
    CartItemSerializer, CartItemCreateSerializer, CartItemUpdateSerializer,
    OrderListSerializer, OrderDetailSerializer, OrderCreateSerializer, OrderUpdateSerializer,
    OrderStatusSerializer, PaymentSerializer, PaymentIntentSerializer
)

stripe.api_key = None  # Set from settings.py in actual implementation

# ===== CART VIEWS =====
class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CartItemCreateSerializer
        elif self.action == 'update' or self.action == 'partial_update':
            return CartItemUpdateSerializer
        return CartItemSerializer
    
    def get_queryset(self):
        return CartItem.objects.filter(buyer_email=self.request.user.email)
    
    def create(self, request, *args, **kwargs):
        """Add item to cart"""
        data = request.data.copy()
        data['buyer_email'] = request.user.email
        
        # Check if item already in cart
        try:
            existing = CartItem.objects.get(
                buyer_email=request.user.email,
                product_id=data['product_id']
            )
            existing.quantity += int(data.get('quantity', 1))
            existing.save()
            serializer = CartItemSerializer(existing)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except CartItem.DoesNotExist:
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(CartItemSerializer(serializer.instance).data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get cart summary with totals"""
        cart_items = self.get_queryset()
        items_total = sum(item.get_total() for item in cart_items)
        
        return Response({
            'items': CartItemSerializer(cart_items, many=True).data,
            'items_count': cart_items.count(),
            'total_amount': items_total,
            'total_shops': len(set(item.shop_id for item in cart_items))
        })
    
    @action(detail=False, methods=['post'])
    def clear(self, request):
        """Clear entire cart"""
        CartItem.objects.filter(buyer_email=request.user.email).delete()
        return Response({'detail': 'Cart cleared'}, status=status.HTTP_200_OK)

# ===== ORDER VIEWS =====
class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        elif self.action == 'update' or self.action == 'partial_update':
            return OrderUpdateSerializer
        elif self.action == 'list':
            return OrderListSerializer
        return OrderDetailSerializer
    
    def get_queryset(self):
        user = self.request.user
        # Buyers see their orders, shop owners see orders for their shop
        if user.role == 'shop_owner':
            return Order.objects.filter(shop_id=user.shop_id)
        return Order.objects.filter(buyer_email=user.email)
    
    def create(self, request, *args, **kwargs):
        """Create new order from cart"""
        data = request.data.copy()
        data['buyer_email'] = request.user.email
        data['buyer_name'] = request.user.full_name
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        
        order = serializer.save()
        
        # Clear cart items for this shop
        CartItem.objects.filter(
            buyer_email=request.user.email,
            shop_id=data['shop_id']
        ).delete()
        
        return Response(
            OrderDetailSerializer(order).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Shop owner confirms order"""
        order = self.get_object()
        if request.user.email != order.shop_id:  # Simplified check
            return Response(
                {'detail': 'Not authorized'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        order.status = 'confirmed'
        order.save()
        return Response(OrderDetailSerializer(order).data)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update order status (shop owner only)"""
        order = self.get_object()
        serializer = OrderStatusSerializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(OrderDetailSerializer(order).data)
    
    @action(detail=False, methods=['get'])
    def my_orders(self, request):
        """Get all orders for current buyer"""
        orders = self.get_queryset()
        serializer = OrderListSerializer(orders, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel order (only if pending)"""
        order = self.get_object()
        if order.status != 'pending':
            return Response(
                {'detail': f'Cannot cancel order with status {order.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'cancelled'
        order.save()
        
        # Restore cart items
        for item in order.items:
            CartItem.objects.create(
                buyer_email=order.buyer_email,
                product_id=item['product_id'],
                product_name=item['product_name'],
                shop_id=order.shop_id,
                shop_name=order.shop_name,
                price=item['price'],
                quantity=item['quantity'],
                image_url=item.get('image_url', '')
            )
        
        return Response(OrderDetailSerializer(order).data)

# ===== PAYMENT VIEWS =====
class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Payment.objects.filter(buyer_email=self.request.user.email)

class CreatePaymentIntentView(generics.GenericAPIView):
    """Create Stripe payment intent"""
    serializer_class = PaymentIntentSerializer
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            order_id = serializer.validated_data['order_id']
            amount = serializer.validated_data['amount']
            
            # Create Stripe payment intent
            intent = stripe.PaymentIntent.create(
                amount=int(amount * 100),  # Convert to cents
                currency='zmw',
                metadata={'order_id': order_id}
            )
            
            # Save payment record
            payment = Payment.objects.create(
                order_id=order_id,
                buyer_email=request.user.email,
                amount=amount,
                stripe_payment_id=intent['id'],
                status='pending'
            )
            
            return Response({
                'client_secret': intent['client_secret'],
                'payment_id': str(payment.id),
                'amount': amount
            }, status=status.HTTP_201_CREATED)
        
        except stripe.error.StripeError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class ConfirmPaymentView(generics.GenericAPIView):
    """Confirm payment after Stripe processing"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        payment_id = request.data.get('payment_id')
        
        try:
            payment = Payment.objects.get(id=payment_id)
            
            # Retrieve payment intent from Stripe
            intent = stripe.PaymentIntent.retrieve(payment.stripe_payment_id)
            
            if intent['status'] == 'succeeded':
                payment.status = 'succeeded'
                payment.stripe_charge_id = intent['charges']['data'][0]['id']
                payment.save()
                
                # Update order status
                try:
                    order = Order.objects.get(id=payment.order_id)
                    order.payment_status = 'completed'
                    order.status = 'processing'
                    order.save()
                except Order.DoesNotExist:
                    pass
                
                return Response({
                    'status': 'succeeded',
                    'payment': PaymentSerializer(payment).data
                })
            else:
                payment.status = 'failed'
                payment.error_message = intent.get('last_payment_error', {}).get('message', 'Unknown error')
                payment.save()
                return Response(
                    {'detail': 'Payment failed'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        except Payment.DoesNotExist:
            return Response(
                {'detail': 'Payment not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except stripe.error.StripeError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )