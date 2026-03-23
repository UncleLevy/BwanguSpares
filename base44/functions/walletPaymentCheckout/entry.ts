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
      const shopShippingCost = shippingOption === 'deliver' ? (shippingCost || 0) : 0;
      const shopDiscountAmount = discountAmount || 0;
      
      const order = await base44.asServiceRole.entities.Order.create({
        buyer_email: user.email,
        buyer_name: user.full_name || user.email,
        shop_id: shopId,
        shop_name: shopData.shop_name,
        items: shopData.items,
        total_amount: shopTotal + shopShippingCost - shopDiscountAmount,
        status: 'confirmed',
        delivery_address: deliveryAddress || '',
        delivery_phone: deliveryPhone || '',
        notes: notes || '',
        coupon_code: couponCode || '',
        discount_amount: shopDiscountAmount,
        payment_method: 'wallet',
        shipping_option: shippingOption,
        shipping_cost: shopShippingCost,
        payout_status: 'awaiting_delivery'
      });
      orderIds.push(order.id);
      
      // Get shop details for notification
      const shops = await base44.asServiceRole.entities.Shop.filter({ id: shopId });
      const shop = shops[0];
      
      // Notify shop owner
      if (shop && shop.owner_email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'BwanguSpares',
          to: shop.owner_email,
          subject: `🎉 New Order Received – ${shop.name}`,
          body: `
            <h2>New Order Notification</h2>
            <p>Hi ${shop.name} team,</p>
            <p>You have received a new order!</p>
            <ul>
              <li><strong>Customer:</strong> ${user.full_name || user.email}</li>
              <li><strong>Total:</strong> K${(shopTotal + shopShippingCost - shopDiscountAmount).toLocaleString()}</li>
              <li><strong>Shipping:</strong> ${shippingOption === 'deliver' ? `Delivery to ${deliveryAddress}` : 'Collect in-store'}</li>
              <li><strong>Payment:</strong> Wallet (Confirmed)</li>
            </ul>
            <p>Please log in to your Shop Dashboard to view details and process this order.</p>
          `
        }).catch(() => {});
        
        await base44.asServiceRole.entities.Notification.create({
          user_email: shop.owner_email,
          type: 'new_order',
          title: 'New Order Received',
          message: `Order from ${user.full_name} worth K${(shopTotal + shopShippingCost - shopDiscountAmount).toLocaleString()}`,
          related_id: order.id,
          action_url: 'ShopDashboard?view=orders',
        }).catch(() => {});
      }
      
      // Notify buyer
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'BwanguSpares',
        to: user.email,
        subject: `✓ Order Confirmed – ${shopData.shop_name}`,
        body: `
          <h2>Order Confirmation</h2>
          <p>Hi ${user.full_name || 'there'},</p>
          <p>Your order has been confirmed and paid via wallet!</p>
          <ul>
            <li><strong>Shop:</strong> ${shopData.shop_name}</li>
            <li><strong>Total:</strong> K${(shopTotal + shopShippingCost - shopDiscountAmount).toLocaleString()}</li>
            <li><strong>Shipping:</strong> ${shippingOption === 'deliver' ? 'Delivery' : 'Collect in-store'}</li>
            ${deliveryAddress ? `<li><strong>Delivery Address:</strong> ${deliveryAddress}</li>` : ''}
          </ul>
          <p>Track your order status in your Buyer Dashboard.</p>
        `
      }).catch(() => {});
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