import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      items, 
      delivery_address, 
      delivery_phone, 
      notes, 
      coupon_code, 
      discount_amount, 
      total,
      useWallet = false,
      walletAmount = 0,
      cardAmount = 0,
      shippingOption = 'collect',
      shippingCost = 0
    } = await req.json();

    if (!items || items.length === 0) {
      return Response.json({ error: 'No items provided' }, { status: 400 });
    }

    // Process card payment
    if (cardAmount > 0) {
      // Build line items for Stripe
      const lineItems = items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.product_name,
            description: `From: ${item.shop_name || 'Shop'}`,
          },
          unit_amount: Math.round(item.price * item.quantity),
        },
        quantity: 1,
      }));

      const appUrl = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0,3).join('/') || 'https://app.base44.com';

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${appUrl}/BuyerDashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/Cart?payment=cancelled`,
        after_expiration: { recovery: { enabled: false } },
        customer_email: user.email,
        metadata: {
          base44_app_id: Deno.env.get("BASE44_APP_ID"),
          buyer_email: user.email,
          buyer_name: user.full_name,
          delivery_address,
          delivery_phone,
          notes: notes || '',
          coupon_code: coupon_code || '',
          useWallet: useWallet ? 'true' : 'false',
          walletAmount: walletAmount.toString(),
          shippingOption,
          shippingCost: shippingCost.toString(),
        },
      });

      // Process wallet deduction if using wallet + card combo
      if (useWallet && walletAmount > 0) {
        const wallets = await base44.asServiceRole.entities.BuyerWallet.filter({ 
          buyer_email: user.email 
        });

        if (wallets.length > 0) {
          const wallet = wallets[0];
          if ((wallet.balance || 0) < walletAmount) {
            return Response.json({ error: 'Insufficient wallet balance' }, { status: 400 });
          }

          // Deduct from wallet
          await base44.asServiceRole.entities.BuyerWallet.update(wallet.id, {
            balance: (wallet.balance || 0) - walletAmount,
            total_spent: (wallet.total_spent || 0) + walletAmount
          });

          // Record wallet transaction
          await base44.asServiceRole.entities.WalletTransaction.create({
            buyer_email: user.email,
            type: 'debit',
            amount: walletAmount,
            reason: 'Partial payment (wallet + card)'
          });
        }
      }

      // Group items by shop and create one order per shop
      const shopGroups = {};
      for (const item of items) {
        if (!shopGroups[item.shop_id]) {
          shopGroups[item.shop_id] = { shop_name: item.shop_name, items: [] };
        }
        shopGroups[item.shop_id].items.push(item);
      }

      // Store complete session data for webhook processing
      const orderData = JSON.stringify({
        items,
        shopGroups: Object.entries(shopGroups).map(([id, g]) => ({
          shop_id: id,
          shop_name: g.shop_name,
          items: g.items
        })),
        buyer_email: user.email,
        buyer_name: user.full_name,
        delivery_address,
        delivery_phone,
        notes: notes || '',
        coupon_code: coupon_code || '',
        discount_amount: discount_amount || 0,
        shipping_option: shippingOption,
        shipping_cost: shippingCost || 0
      });

      // Orders will be created by webhook after payment success
      // Store session metadata for retrieval
      await base44.asServiceRole.entities.Order.create({
        buyer_email: user.email,
        buyer_name: user.full_name,
        shop_id: 'PENDING_PAYMENT',
        shop_name: 'Payment Pending',
        items: items,
        total_amount: total,
        status: 'pending',
        delivery_address,
        delivery_phone,
        notes: notes || '',
        payment_method: 'stripe',
        stripe_session_id: session.id,
        coupon_code: coupon_code || '',
        discount_amount: discount_amount || 0,
        shipping_option: shippingOption,
        shipping_cost: shippingCost || 0,
        payout_status: 'pending',
      });

      console.log(`Stripe checkout session created: ${session.id} for ${user.email}`);
      return Response.json({ url: session.url });
    }

    return Response.json({ error: 'No payment amount specified' }, { status: 400 });

  } catch (error) {
    console.error('Stripe checkout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});