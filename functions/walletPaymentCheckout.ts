import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      items,
      deliveryAddress,
      deliveryPhone,
      notes,
      couponCode,
      discountAmount,
      total,
      shippingOption,
      shippingCost
    } = await req.json();

    // Get or create buyer wallet
    const wallets = await base44.asServiceRole.entities.BuyerWallet.filter({
      buyer_email: user.email
    });

    let wallet = wallets[0];
    if (!wallet) {
      return Response.json({ error: 'Wallet not found' }, { status: 404 });
    }

    if ((wallet.balance || 0) < total) {
      return Response.json({ error: 'Insufficient wallet balance' }, { status: 400 });
    }

    // Deduct from wallet
    await base44.asServiceRole.entities.BuyerWallet.update(wallet.id, {
      balance: (wallet.balance || 0) - total,
      total_spent: (wallet.total_spent || 0) + total
    });

    // Create wallet transaction
    const transaction = await base44.asServiceRole.entities.WalletTransaction.create({
      buyer_email: user.email,
      type: 'debit',
      amount: total,
      reason: 'Payment for order'
    });

    // Group items by shop
    const itemsByShop = {};
    items.forEach(item => {
      if (!itemsByShop[item.shop_id]) {
        itemsByShop[item.shop_id] = {
          shop_id: item.shop_id,
          shop_name: item.shop_name,
          items: []
        };
      }
      itemsByShop[item.shop_id].items.push(item);
    });

    // Create orders for each shop
    const orderIds = [];
    for (const [shopId, shopData] of Object.entries(itemsByShop)) {
      const shopTotal = shopData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const order = await base44.asServiceRole.entities.Order.create({
        buyer_email: user.email,
        buyer_name: user.full_name || user.email,
        shop_id: shopId,
        shop_name: shopData.shop_name,
        items: shopData.items,
        total_amount: shopTotal + shippingCost,
        status: 'confirmed',
        delivery_address: deliveryAddress,
        delivery_phone: deliveryPhone,
        notes: notes || '',
        coupon_code: couponCode || '',
        payment_method: 'wallet',
        shippingOption: shippingOption,
        shippingCost: shippingCost,
        payout_status: 'awaiting_delivery'
      });
      orderIds.push(order.id);
    }

    return Response.json({
      success: true,
      orderIds,
      transactionId: transaction.id,
      message: 'Payment successful'
    });
  } catch (error) {
    console.error('Wallet payment error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});