import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const escapeCSV = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const arrayToCSV = (rows) => {
  return rows.map(row => row.map(escapeCSV).join(',')).join('\n');
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { shop_id, start_date, end_date } = await req.json();
    if (!shop_id || !start_date || !end_date) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch shop, products, orders, and technicians
    const [shop, products, orders, technicians] = await Promise.all([
      base44.entities.Shop.filter({ id: shop_id }),
      base44.entities.Product.filter({ shop_id }),
      base44.entities.Order.filter({ shop_id }),
      base44.entities.Technician.filter({ shop_id })
    ]);

    if (!shop || shop.length === 0) {
      return Response.json({ error: 'Shop not found' }, { status: 404 });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    // Filter orders by date range
    const ordersInRange = orders.filter(o => {
      const orderDate = new Date(o.created_date);
      return orderDate >= startDate && orderDate <= endDate;
    });

    // Calculate metrics
    const completedOrders = ordersInRange.filter(o => o.status === 'delivered');
    const totalRevenue = ordersInRange
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    // Product sales analysis
    const productSales = {};
    completedOrders.forEach(order => {
      order.items?.forEach(item => {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = {
            name: item.product_name,
            sold_quantity: 0,
            revenue: 0,
            price: item.price
          };
        }
        productSales[item.product_id].sold_quantity += item.quantity || 1;
        productSales[item.product_id].revenue += (item.price || 0) * (item.quantity || 1);
      });
    });

    // Build CSV sections
    let csv = '';

    // Summary section
    const summaryData = [
      ['Sales Report', shop[0].name],
      ['Report Period', `${start_date} to ${end_date}`],
      ['Generated Date', new Date().toLocaleDateString()],
      [],
      ['Metric', 'Value'],
      ['Total Orders', ordersInRange.length],
      ['Completed Orders', completedOrders.length],
      ['Total Revenue (ZMW)', totalRevenue.toFixed(2)],
      ['Average Order Value', completedOrders.length > 0 ? (totalRevenue / completedOrders.length).toFixed(2) : '0.00'],
      ['Active Products', products.filter(p => p.status === 'active').length],
      ['Total Technicians', technicians.length]
    ];
    csv += arrayToCSV(summaryData) + '\n\n';

    // Products section
    csv += 'PRODUCTS\n';
    const productsData = [['Product Name', 'Category', 'Stock', 'Price (ZMW)', 'Units Sold', 'Revenue (ZMW)', 'Status']];
    products.forEach(p => {
      const sales = productSales[p.id] || { sold_quantity: 0, revenue: 0 };
      productsData.push([
        p.name,
        p.category,
        p.stock_quantity,
        p.price.toFixed(2),
        sales.sold_quantity,
        sales.revenue.toFixed(2),
        p.status
      ]);
    });
    csv += arrayToCSV(productsData) + '\n\n';

    // Orders section
    csv += 'ORDERS\n';
    const ordersData = [['Order ID', 'Date', 'Buyer', 'Items Count', 'Amount (ZMW)', 'Status']];
    ordersInRange.forEach(o => {
      ordersData.push([
        o.id.slice(0, 8),
        new Date(o.created_date).toLocaleDateString(),
        o.buyer_name || o.buyer_email,
        o.items?.length || 0,
        o.total_amount.toFixed(2),
        o.status
      ]);
    });
    csv += arrayToCSV(ordersData) + '\n\n';

    // Technicians section (if any)
    if (technicians.length > 0) {
      csv += 'TECHNICIANS\n';
      const techData = [['Name', 'Specialization', 'Experience (yrs)', 'Hourly Rate (ZMW)', 'Rating', 'Available']];
      technicians.forEach(t => {
        techData.push([
          t.name,
          t.specialization,
          t.experience_years || 0,
          t.hourly_rate || 0,
          t.rating || 0,
          t.available !== false ? 'Yes' : 'No'
        ]);
      });
      csv += arrayToCSV(techData);
    }

    const encoder = new TextEncoder();
    const blob = encoder.encode(csv);

    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="Sales_Report_${shop[0].name.replace(/\s+/g, '_')}_${start_date}.csv"`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});