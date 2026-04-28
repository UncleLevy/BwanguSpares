import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Home, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';

export default function OrderSuccess() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [countdown, setCountdown] = useState(5);

  // Support both ?orderId= and ?order= (reference) params
  const orderId = searchParams.get('orderId');
  const orderRef = searchParams.get('order');

  useEffect(() => {
    // Invalidate all cached queries so dashboard/cart reflect latest data
    queryClient.invalidateQueries();

    if (orderId) {
      base44.entities.Order.filter({ id: orderId }).then(orders => {
        if (orders.length > 0) setOrder(orders[0]);
      });
    } else if (orderRef) {
      base44.entities.Order.filter({ stripe_session_id: orderRef }).then(orders => {
        if (orders.length > 0) setOrder(orders[0]);
      });
    }
  }, [orderId, orderRef]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (countdown === 0) {
      navigate(createPageUrl('BuyerDashboard'));
    }
  }, [countdown, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 dark:from-slate-900 dark:via-emerald-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
            <CheckCircle2 className="w-20 h-20 text-green-600 dark:text-green-400 relative" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Order Confirmed!
        </h1>

        {/* Description */}
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          {order 
            ? `Your order has been placed successfully. Reference: #${order.id?.slice(0, 8).toUpperCase()}`
            : 'Your order has been placed successfully.'}
        </p>

        {/* Order Details Card */}
        {order && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 mb-8 border border-slate-200 dark:border-slate-700 text-left space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-sm text-slate-600 dark:text-slate-400">Shop</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{order.shop_name}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-slate-600 dark:text-slate-400">Total Amount</span>
              <span className="font-bold text-lg text-green-600 dark:text-green-400">K {order.total_amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-slate-600 dark:text-slate-400">Items</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{order.items?.length || 0}</span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
              <span className="text-sm text-slate-600 dark:text-slate-400">Delivery Method</span>
              <p className="font-semibold text-slate-900 dark:text-slate-100 capitalize">
                {order.shipping_option === 'deliver' ? '🚚 Delivery' : '📦 Collection'}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 mb-8">
          <Button 
            onClick={() => navigate(createPageUrl('BuyerDashboard'))}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-11 rounded-xl gap-2"
          >
            <Package className="w-4 h-4" />
            Track Your Order
          </Button>
          <Button 
            onClick={() => navigate(createPageUrl('Home'))}
            variant="outline"
            className="w-full h-11 rounded-xl gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
        </div>

        {/* Auto-redirect countdown */}
        <p className="text-xs text-slate-500 dark:text-slate-500">
          Redirecting to dashboard in <span className="font-bold text-slate-700 dark:text-slate-400">{countdown}s</span>...
        </p>
      </div>
    </div>
  );
}