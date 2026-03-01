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

    const { items, delivery_address, delivery_phone, notes, coupon_code, discount_amount, total } = await req.json();

    if (!items || items.length === 0) {
      return Response.json({ error: 'No items provided' }, { status: 400 });
    }

    // Build line items for Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.product_name,
          description: `From: ${item.shop_name || 'Shop'}`,
        },
        // Convert ZMW to cents (using 1 ZMW ≈ 0.05 USD for test, or treat as cents directly for testing)
        unit_amount: Math.round(item.price * item.quantity),
      },
      quantity: 1,
    }));

    const appUrl = req.headers.get('origin') || 'https://app.base44.com';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${appUrl}/BuyerDashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/Cart?payment=cancelled`,
      customer_email: user.email,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        buyer_email: user.email,
        buyer_name: user.full_name,
        delivery_address,
        delivery_phone,
        notes: notes || '',
        coupon_code: coupon_code || '',
      },
    });

    // Create the orders immediately (payment confirmation can be handled via webhook)
    const groupedByShop = {};
    for (const item of items) {
      if (!groupedByShop[item.shop_id]) {
        groupedByShop[item.shop_id] = { shop_name: item.shop_name, items: [] };
      }
      groupedByShop[item.shop_id].items.push(item);
    }

    const subtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);
    for (const [shopId, group] of Object.entries(groupedByShop)) {
      const shopSubtotal = group.items.reduce((s, i) => s + (i.price * i.quantity), 0);
      const shopDiscount = discount_amount ? Math.round((shopSubtotal / subtotal) * discount_amount) : 0;
      const shopTotal = shopSubtotal - shopDiscount;

      await base44.asServiceRole.entities.Order.create({
        buyer_email: user.email,
        buyer_name: user.full_name,
        shop_id: shopId,
        shop_name: group.shop_name,
        items: group.items.map(i => ({
          product_id: i.product_id,
          product_name: i.product_name,
          quantity: i.quantity || 1,
          price: i.price,
          image_url: i.image_url || '',
        })),
        total_amount: shopTotal,
        delivery_address,
        delivery_phone,
        notes: notes || '',
        coupon_code: coupon_code || '',
        status: 'pending',
        payment_method: 'stripe',
        stripe_session_id: session.id,
      });

      // Upsert customer record for this shop
      const existingCustomers = await base44.asServiceRole.entities.Customer.filter({ shop_id: shopId, email: user.email });
      if (existingCustomers.length > 0) {
        const c = existingCustomers[0];
        await base44.asServiceRole.entities.Customer.update(c.id, {
          total_orders: (c.total_orders || 0) + 1,
          total_spent: (c.total_spent || 0) + shopTotal,
          full_name: user.full_name,
          phone: delivery_phone || c.phone,
          address: delivery_address || c.address,
        });
      } else {
        await base44.asServiceRole.entities.Customer.create({
          shop_id: shopId,
          email: user.email,
          full_name: user.full_name,
          phone: delivery_phone || '',
          address: delivery_address || '',
          total_orders: 1,
          total_spent: shopTotal,
          status: 'active',
        });
      }
      console.log(`Customer upserted for shop ${shopId}: ${user.email}`);
    }

    console.log(`Stripe checkout session created: ${session.id} for ${user.email}`);
    return Response.json({ url: session.url });

  } catch (error) {
    console.error('Stripe checkout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});