import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function DashboardCartPreview({ userEmail }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const items = await base44.entities.CartItem.filter({ buyer_email: userEmail });
      setCartItems(items);
      setLoading(false);
    })();
  }, [userEmail]);

  const removeItem = async (cartItemId) => {
    await base44.entities.CartItem.delete(cartItemId);
    setCartItems(cartItems.filter(item => item.id !== cartItemId));
    toast.success("Item removed from cart");
  };

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (loading) {
    return <div className="text-center py-8 text-slate-500 dark:text-slate-400">Loading cart...</div>;
  }

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
        <h3 className="font-semibold text-slate-700 dark:text-slate-300">Cart is empty</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Start browsing and add items</p>
        <Link to={createPageUrl("BrowseProducts")}>
          <Button className="mt-4 bg-blue-600 hover:bg-blue-700">Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {cartItems.map(item => (
          <Card key={item.id} className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
            <CardContent className="p-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">{item.product_name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.shop_name}</p>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-2">K{item.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × {item.quantity}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 h-8 w-8 p-0"
                onClick={() => removeItem(item.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-slate-900 dark:text-slate-100">Total:</span>
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">K{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <Link to={createPageUrl("Cart")} className="block">
          <Button className="w-full bg-blue-600 hover:bg-blue-700">Proceed to Checkout</Button>
        </Link>
      </div>
    </div>
  );
}