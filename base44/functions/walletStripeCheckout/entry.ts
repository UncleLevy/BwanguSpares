import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@15.5.0';

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
      deliveryAddress, 
      deliveryPhone, 
      notes, 
      couponCode, 
      discountAmount, 
      total,
      useWallet = false,
      walletAmount = 0,
      cardAmount = 0
    } = await req.json();

    // If using wallet + card, process both payments
    let stripeSessionId = null;
    let walletTransactionId = null;

    // Process card payment if needed
    if (cardAmount > 0) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: items.map(item => ({
          price_data: {
            currency: 'zmw',
            product_data: {
              name: item.product_name,
              description: item.product_id,
            },
            unit_amount: Math.round(cardAmount * 100),
          },
          quantity: 1,
        })),
        success_url: `${Deno.env.get('APP_URL') || 'http://localhost:5173'}/order-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${Deno.env.get('APP_URL') || 'http://localhost:5173'}/cart`,
        metadata: {
          base44_app_id: Deno.env.get('BASE44_APP_ID'),
          buyer_email: user.email,
          useWallet: useWallet,
          walletAmount: walletAmount,
        },
      });
      stripeSessionId = session.id;
    }

    // Process wallet deduction if using wallet
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
        const transaction = await base44.asServiceRole.entities.WalletTransaction.create({
          buyer_email: user.email,
          type: 'debit',
          amount: walletAmount,
          reason: 'Payment for order'
        });
        walletTransactionId = transaction.id;
      } else {
        return Response.json({ error: 'Wallet not found' }, { status: 404 });
      }
    }

    // Return redirect URL
    return Response.json({ 
      url: stripeSessionId ? `https://checkout.stripe.com/pay/${stripeSessionId}` : '/order-success',
      sessionId: stripeSessionId,
      walletTransactionId: walletTransactionId,
      success: true
    });
  } catch (error) {
    console.error('Wallet checkout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});