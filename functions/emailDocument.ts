import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { to, docType, docNumber, shop, order, partsRequest } = await req.json();
    if (!to) return Response.json({ error: 'Recipient email required' }, { status: 400 });

    const typeLabels = { invoice: 'INVOICE', receipt: 'RECEIPT', quotation: 'QUOTATION' };
    const isOrder = !!order;

    const clientName = isOrder
      ? (order.buyer_name || order.buyer_email)
      : (partsRequest?.buyer_name || partsRequest?.buyer_email);

    const clientPhone = isOrder ? order.delivery_phone : partsRequest?.buyer_phone;
    const clientAddress = isOrder ? order.delivery_address : partsRequest?.buyer_region;

    const items = isOrder
      ? (order.items || [])
      : [{ product_name: partsRequest?.part_name, quantity: 1, price: partsRequest?.budget || 0 }];

    const total = items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);
    const vat = docType !== 'quotation' ? total - (total / 1.16) : 0;
    const subtotal = total - vat;

    const typeColorMap = { invoice: '#1e40af', receipt: '#065f46', quotation: '#92400e' };
    const color = typeColorMap[docType] || '#1e40af';

    const itemRows = items.map((item, i) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">
        <td style="padding:10px 12px;font-size:13px;border-bottom:1px solid #e5e7eb">${item.product_name || item.name || 'Item'}</td>
        <td style="padding:10px 12px;text-align:center;font-size:13px;border-bottom:1px solid #e5e7eb">${item.quantity || 1}</td>
        <td style="padding:10px 12px;text-align:right;font-size:13px;border-bottom:1px solid #e5e7eb">K${(item.price || 0).toLocaleString()}</td>
        <td style="padding:10px 12px;text-align:right;font-size:13px;border-bottom:1px solid #e5e7eb">K${((item.price || 0) * (item.quantity || 1)).toLocaleString()}</td>
      </tr>`).join('');

    const vatRow = docType !== 'quotation'
      ? `<tr><td colspan="2"></td><td style="padding:4px 12px;font-size:13px;color:#555">VAT (16%)</td><td style="padding:4px 12px;text-align:right;font-size:13px;color:#555">K${vat.toLocaleString()}</td></tr>`
      : '';

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;background:#fff;padding:32px;color:#1a1a1a">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;border-bottom:3px solid ${color};padding-bottom:18px">
          <div>
            <h1 style="font-size:24px;font-weight:bold;color:${color};margin:0">${shop?.name}</h1>
            ${shop?.address ? `<p style="margin:4px 0 0;font-size:13px;color:#555">${shop.address}</p>` : ''}
            ${shop?.region_name ? `<p style="margin:2px 0 0;font-size:13px;color:#555">${shop.region_name}, Zambia</p>` : ''}
            ${shop?.phone ? `<p style="margin:2px 0 0;font-size:13px;color:#555">Tel: ${shop.phone}</p>` : ''}
          </div>
          <div style="text-align:right">
            <div style="background:${color};color:#fff;padding:8px 18px;border-radius:6px;font-size:17px;font-weight:bold;letter-spacing:1px">${typeLabels[docType]}</div>
            <p style="margin:8px 0 2px;font-size:13px;color:#555">No: <strong>${docNumber}</strong></p>
            <p style="margin:2px 0;font-size:13px;color:#555">Date: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <div style="margin-bottom:24px;background:#f8f9fa;padding:16px;border-radius:8px">
          <p style="font-size:11px;text-transform:uppercase;color:#999;font-weight:bold;margin:0 0 8px">Bill To</p>
          <p style="font-weight:bold;font-size:15px;margin:0 0 4px">${clientName}</p>
          ${clientPhone ? `<p style="margin:2px 0;font-size:13px;color:#555">Phone: ${clientPhone}</p>` : ''}
          ${clientAddress ? `<p style="margin:2px 0;font-size:13px;color:#555">Address: ${clientAddress}</p>` : ''}
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <thead>
            <tr style="background:${color}">
              <th style="padding:10px 12px;text-align:left;color:#fff;font-size:12px">Description</th>
              <th style="padding:10px 12px;text-align:center;color:#fff;font-size:12px;width:70px">Qty</th>
              <th style="padding:10px 12px;text-align:right;color:#fff;font-size:12px;width:110px">Unit Price</th>
              <th style="padding:10px 12px;text-align:right;color:#fff;font-size:12px;width:110px">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
            <tr><td colspan="4" style="height:8px"></td></tr>
            <tr><td colspan="2"></td><td style="padding:4px 12px;font-size:13px;color:#555">Subtotal</td><td style="padding:4px 12px;text-align:right;font-size:13px;color:#555">K${subtotal.toLocaleString()}</td></tr>
            ${vatRow}
            <tr>
              <td colspan="2"></td>
              <td colspan="2" style="padding:10px 12px;background:${color};color:#fff;font-weight:bold;font-size:15px;border-radius:6px;text-align:right">TOTAL: K${total.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        ${isOrder && order.notes ? `<div style="margin-top:20px;padding:14px;background:#f8f9fa;border-radius:8px;border-left:4px solid ${color}"><p style="font-size:11px;text-transform:uppercase;color:#999;font-weight:bold;margin:0 0 6px">Notes</p><p style="font-size:13px;margin:0;color:#555">${order.notes}</p></div>` : ''}
        ${docType === 'quotation' ? `<p style="margin-top:16px;font-size:12px;color:#aaa">This quotation is valid for 30 days from the date of issue.</p>` : ''}

        <div style="margin-top:36px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#aaa">
          <p style="margin:0">Thank you for your business — ${shop?.name}</p>
        </div>
      </div>`;

    const subjectMap = {
      invoice: `Invoice ${docNumber} from ${shop?.name}`,
      receipt: `Your Receipt ${docNumber} — ${shop?.name}`,
      quotation: `Quotation ${docNumber} from ${shop?.name}`,
    };

    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Bwangu Spares',
      to,
      subject: subjectMap[docType],
      body: html,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});