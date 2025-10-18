const nodemailer = require('nodemailer');
const AuthModel = require('../models/authModel');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendStockAlert = async (product) => {
  try {
    // Get all active inventory admins
    const inventoryAdmins = await AuthModel.getAdminsByRole('inventory_admin');
    
    if (!inventoryAdmins || inventoryAdmins.length === 0) {
      console.error('No inventory admins found for notification');
      return;
    }

    const adminEmails = inventoryAdmins.map(admin => admin.email);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmails.join(','), // Send to all inventory admins
      subject: `Low Stock Alert: ${product.name}`,
      html: `
        <h2>Low Stock Alert</h2>
        <p>Product: ${product.name}</p>
        <p>Current Stock: ${product.stock_quantity}</p>
        <p>Minimum Threshold: ${product.min_stock_threshold}</p>
        <p>Reorder Quantity: ${product.reorder_quantity || 'Not set'}</p>
        <p>Action Required: Please restock this item.</p>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending stock alert:', error);
    throw error;
  }
};

/**
 * Send order confirmation email to customer
 * @param {Object} order - Order details
 * @param {Object} user - User details
 */
const sendOrderConfirmation = async (order, user) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Order Confirmation - #${order.order_number}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Thank you for your order!</h2>
          <p>Dear ${user.first_name},</p>
          <p>Your order has been successfully placed.</p>
          
          <div style="background-color: #f7f7f7; padding: 15px; margin: 20px 0;">
            <h3>Order Details:</h3>
            <p>Order Number: #${order.order_number}</p>
            <p>Tracking ID: ${order.tracking_number}</p>
            <p>Date: ${new Date(order.placed_at).toLocaleString()}</p>
            <p>Total Amount: ₹${order.total_amount}</p>
          </div>

          <h3>Items Ordered:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background-color: #f7f7f7;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: right;">Quantity</th>
              <th style="padding: 10px; text-align: right;">Price</th>
            </tr>
            ${order.order_items.map(item => `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                  ${item.products.name}
                </td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">
                  ${item.quantity}
                </td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">
                  ₹${item.price}
                </td>
              </tr>
            `).join('')}
          </table>

          <p style="margin-top: 20px;">
            We will notify you once your order has been shipped.
          </p>

          <div style="margin-top: 30px; color: #666; font-size: 12px;">
            <p>If you have any questions, please contact our customer support.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending order confirmation:', error);
    throw error;
  }
};

const sendOrderStatusUpdate = async (order) => {
  try {
    const userEmail = order.users.email;
    const userName = order.users.profiles.first_name;

    const statusMessages = {
      processing: 'Your order is being processed',
      packed: 'Your order has been packed',
      shipped: `Your order has been shipped via ${order.shipping_partner}`,
      out_for_delivery: 'Your order is out for delivery',
      delivered: 'Your order has been delivered'
    };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Order Update - #${order.order_number}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Status Update</h2>
          <p>Dear ${userName},</p>
          <p>${statusMessages[order.status]}</p>
          
          ${order.tracking_number ? `
            <div style="background-color: #f7f7f7; padding: 15px; margin: 20px 0;">
              <p>Tracking Number: ${order.tracking_number}</p>
              <p>Shipping Partner: ${order.shipping_partner}</p>
            </div>
          ` : ''}
          
          <p>Order Details:</p>
          <ul>
            <li>Order Number: #${order.order_number}</li>
            <li>Status: ${order.status.toUpperCase()}</li>
          </ul>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending order status update:', error);
    throw error;
  }
};

const sendOrderCancellation = async (order) => {
  try {
    const userEmail = order.users.email;
    const userName = order.users.profiles.first_name;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Order Cancellation - #${order.order_number}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Cancellation Confirmation</h2>
          <p>Dear ${userName},</p>
          <p>Your order has been cancelled successfully.</p>
          
          <div style="background-color: #f7f7f7; padding: 15px; margin: 20px 0;">
            <h3>Cancellation Details:</h3>
            <p>Order Number: #${order.order_number}</p>
            <p>Cancellation Reason: ${order.cancellation_reason}</p>
            ${order.cancellation_comments ? 
              `<p>Additional Comments: ${order.cancellation_comments}</p>` : ''}
          </div>

          <div style="margin-top: 20px;">
            <p>Refund Status: ${
              order.payment_status === 'refunded' ? 
              'Refund initiated and will be processed in 5-7 business days' : 
              'No payment was processed for this order'
            }</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending cancellation notification:', error);
    throw error;
  }
};

module.exports = {
  sendStockAlert,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendOrderCancellation
};