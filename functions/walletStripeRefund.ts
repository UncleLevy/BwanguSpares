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

    const { amount, order_id } = await req.json();

    if (!amount || amount <= 0) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Get the wallet
    const wallets = await base44.entities.BuyerWallet.filter({ buyer_email: user.email });
    const wallet = wallets[0];
    if (!wallet || wallet.balance < amount) {
      return Response.json({ error: 'Insufficient wallet balance' }, { status: 400 });
    }

    // Find the original order to get the Stripe session/payment intent
    let order = null;
    if (order_id) {
      const orders = await base44.entities.Order.filter({ id: order_id });
      order = orders[0];
    } else {
      // Find the most recent stripe-paid cancelled order linked to a wallet credit
      const orders = await base44.entities.Order.filter({ buyer_email: user.email, payment_method: 'stripe', status: 'cancelled' }, '-created_date', 10);
      order = orders.find(o => o.stripe_session_id);
    }

    if (!order?.stripe_session_id) {
      return Response.json({ error: 'No original Stripe payment found to refund to' }, { status: 400 });
    }

    // Retrieve the Stripe session to get the payment intent
    const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
    if (!session.payment_intent) {
      return Response.json({ error: 'No payment intent found for this session' }, { status: 400 });
    }

    // Create a Stripe refund (amount in cents)
    // We treat 1 ZMW as 1 cent for test purposes (same as checkout)
    const refund = await stripe.refunds.create({
      payment_intent: session.payment_intent,
      amount: Math.round(amount),
    });

    // Deduct from wallet
    const newBalance = wallet.balance - amount;
    await base44.entities.BuyerWallet.update(wallet.id, {
      balance: newBalance,
      total_spent: (wallet.total_spent || 0) + amount,
    });

    // Log transaction
    await base44.entities.WalletTransaction.create({
      buyer_email: user.email,
      type: 'debit',
      amount,
      reason: `Stripe refund to card (Ref: ${refund.id})`,
      order_id: order.id,
    });

    console.log(`Stripe refund created: ${refund.id} for ${user.email} amount ${amount}`);
    return Response.json({ success: true, refund_id: refund.id });

  } catch (error) {
    console.error('Wallet stripe refund error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});