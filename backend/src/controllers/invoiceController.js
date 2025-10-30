/*
 Order Invoice - Prints the pdf of bill
 Author: M Lakshya
 Features: a pdf file download of invoice for a particular order
*/ 

const OrderModel = require('../models/orderModel');
const UserModel = require('../models/userModel');
const PDFDocument = require('pdfkit');
const { recordActivity } = require('../utils/activityRecorder');

class InvoiceController {
    //Download Invoice PDF for an order
  
  static async downloadInvoice(req, res) {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await OrderModel.getOrderById(orderId);
    const profile = await UserModel.getProfileByUserId(order.user_id);

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    if (order.user_id !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You do not own this order.' 
      });
    }

    recordActivity(req, 'DOWNLOAD', 'Invoice', orderId, {
      order_number: order.order_number,
      order_total: order.total_amount,
      payment_status: order.payment_status
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${order.order_number || orderId}.pdf`);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    doc.rect(0, 0, doc.page.width, 120).fill('#2d5016');

    doc.fontSize(32)
       .fillColor('#ffffff')
       .font('Helvetica-Bold')
       .text('Bleaf', 50, 30);

    doc.fontSize(11)
       .fillColor('#e8f5e9')
       .font('Helvetica-Oblique')
       .text('Nature knows the way - just Bleaf, just Blieve', 50, 70);

    doc.fillColor('#000000').font('Helvetica');
    doc.y = 140;

    doc.fontSize(28)
       .font('Helvetica-Bold')
       .fillColor('#2d5016')
       .text('INVOICE', 50, doc.y);

    doc.moveDown(1);

    const detailsY = doc.y;
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#2d5016')
       .text('Invoice Details', 50, detailsY);
    
    doc.font('Helvetica')
       .fillColor('#333333')
       .fontSize(9);
    
    doc.text(`Invoice Number: ${order.order_number || orderId}`, 50, detailsY + 18);
    doc.text(`Invoice Date: ${new Date(order.placed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, detailsY + 33);
    doc.text(`Payment Status: ${order.payment_status.toUpperCase()}`, 50, detailsY + 48);
    doc.text(`Order Status: ${order.status.toUpperCase()}`, 50, detailsY + 63);
    
    if (order.tracking_number) {
      doc.text(`Tracking Number: ${order.tracking_number}`, 50, detailsY + 78);
    }

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#2d5016')
       .text('Customer Details', 320, detailsY);
    
    doc.font('Helvetica')
       .fillColor('#333333')
       .fontSize(9);
    
    const customerName = profile?.first_name 
      ? `${profile.first_name} ${profile.last_name || ''}`.trim() 
      : 'Customer';
    
    doc.text(customerName, 320, detailsY + 18);
    doc.text(order.customer_email || 'N/A', 320, detailsY + 33);
    
    if (order.customer_phone) {
      doc.text(order.customer_phone, 320, detailsY + 48);
    }

    doc.moveDown(6);

    const addressY = doc.y;
    
    if (order.billing_address) {
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#2d5016')
         .text('Billing Address', 50, addressY);
      
      doc.font('Helvetica')
         .fillColor('#333333')
         .fontSize(9);
      
      const billing = order.billing_address;
      doc.text(billing.street || '', 50, addressY + 18, { width: 220 });
      doc.text(`${billing.city || ''}, ${billing.state || ''} ${billing.postalCode || ''}`, 50, addressY + 33, { width: 220 });
    }

    // Shipping Address
    if (order.shipping_address) {
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#2d5016')
         .text('Shipping Address', 320, addressY);
      
      doc.font('Helvetica')
         .fillColor('#333333')
         .fontSize(9);
      
      const shipping = order.shipping_address;
      doc.text(shipping.street || '', 320, addressY + 18, { width: 220 });
      doc.text(`${shipping.city || ''}, ${shipping.state || ''} ${shipping.postalCode || ''}`, 320, addressY + 33, { width: 220 });
    }

    doc.moveDown(4);

    const tableTop = doc.y;
    doc.rect(50, tableTop, 500, 30).fill('#2d5016');
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#ffffff')
       .text('Item Description', 60, tableTop + 10)
       .text('Qty', 320, tableTop + 10)
       .text('Unit Price', 380, tableTop + 10)
       .text('Amount', 470, tableTop + 10);

    let yPosition = tableTop + 40;
    doc.fillColor('#000000').font('Helvetica');

    if (order.order_items && order.order_items.length > 0) {
      order.order_items.forEach((item, index) => {
        const itemName = item.products?.name || item.product?.name || 'Product';
        const quantity = item.quantity || 0;
        const price = parseFloat(item.unit_price || 0);
        const total = quantity * price;

        if (index % 2 === 0) {
          doc.rect(50, yPosition - 8, 500, 28).fill('#f9f9f9');
          doc.fillColor('#000000');
        }

        doc.fontSize(9)
           .text(itemName, 60, yPosition, { width: 240, ellipsis: true })
           .text(quantity.toString(), 320, yPosition, { width: 50 })
           .text(`Rs.${price.toFixed(2)}`, 380, yPosition, { width: 80 })
           .text(`Rs.${total.toFixed(2)}`, 470, yPosition, { width: 80, align: 'right' });

        yPosition += 28;
      });
    }

    yPosition += 10;

    doc.moveTo(320, yPosition).lineTo(550, yPosition).stroke('#cccccc');
    yPosition += 15;

    const subtotal = parseFloat(order.subtotal || 0);
    const tax = parseFloat(order.tax_amount || 0);
    const shippingCost = parseFloat(order.shipping_cost || 0);
    const discount = parseFloat(order.discount_amount || 0);
    const totalAmount = parseFloat(order.total_amount || 0);

    doc.fontSize(9)
       .fillColor('#333333')
       .font('Helvetica');

    doc.text('Subtotal:', 380, yPosition)
       .text(`Rs.${subtotal.toFixed(2)}`, 470, yPosition, { align: 'right', width: 80 });
    yPosition += 18;

    if (tax > 0) {
      doc.text('Tax (GST):', 380, yPosition)
         .text(`Rs.${tax.toFixed(2)}`, 470, yPosition, { align: 'right', width: 80 });
      yPosition += 18;
    }

    if (shippingCost > 0) {
      doc.text('Shipping:', 380, yPosition)
         .text(`Rs.${shippingCost.toFixed(2)}`, 470, yPosition, { align: 'right', width: 80 });
      yPosition += 18;
    }

    if (discount > 0) {
      doc.fillColor('#dc3545')
         .text('Discount:', 380, yPosition)
         .text(`-Rs.${discount.toFixed(2)}`, 470, yPosition, { align: 'right', width: 80 });
      yPosition += 18;
    }

    doc.moveTo(320, yPosition).lineTo(550, yPosition).stroke('#2d5016');
    yPosition += 15;

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#2d5016')
       .text('Total Amount:', 380, yPosition)
       .text(`Rs.${totalAmount.toFixed(2)}`, 470, yPosition, { align: 'right', width: 80 });

    doc.moveDown(4);
    
    const footerY = doc.y + 40;
    doc.moveTo(50, footerY).lineTo(550, footerY).stroke('#e0e0e0');

    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#666666');

    const footerText1 = 'Thank you for your business!';
    const footerText2 = 'For any queries, please contact us at bleaforg@gmail.com';

    const pageWidth = doc.page.width;
    const textWidth1 = doc.widthOfString(footerText1);
    const textWidth2 = doc.widthOfString(footerText2);

    const xCenter1 = (pageWidth - textWidth1) / 2;
    const xCenter2 = (pageWidth - textWidth2) / 2;

    doc.text(footerText1, xCenter1, footerY + 15);
    doc.text(footerText2, xCenter2, footerY + 30);

    const pages = doc.bufferedPageRange();

    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      const pageHeight = doc.page.height;
      
      doc.fontSize(8)
         .fillColor('#999999')
         .text(
           `Page ${i + 1} of ${pages.count}`,
           0,
           pageHeight - 50,
           {
             align: 'center',
             width: doc.page.width
           }
         );
    }

    doc.end();

  } catch (error) {
    console.error('Error generating invoice:', error);
    
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate invoice'
      });
    }
  }
}
}

module.exports = InvoiceController;
