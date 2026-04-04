const nodemailer = require('nodemailer');
const AuthModel = require('../models/authModel');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Common email styles and header/footer
const emailStyles = `
  body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
  .email-wrapper { background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%); padding: 40px 20px; }
  .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(76, 175, 80, 0.1); }
  .header { background: linear-gradient(135deg, #66bb6a 0%, #81c784 100%); padding: 40px 30px; text-align: center; }
  .logo-section { margin-bottom: 15px; }
  .logo-img { height: 60px; margin-bottom: 10px; }
  .tagline { color: #e8f5e9; font-size: 14px; font-style: italic; margin: 8px 0 0 0; }
  .content { padding: 40px 30px; }
  .greeting { color: #2e7d32; font-size: 18px; margin-bottom: 20px; }
  .message { color: #424242; font-size: 16px; line-height: 1.6; margin-bottom: 25px; }
  .info-box { background: linear-gradient(135deg, #f1f8e9 0%, #e8f5e9 100%); border-left: 4px solid #66bb6a; padding: 20px; margin: 25px 0; border-radius: 8px; }
  .info-title { color: #2e7d32; font-size: 18px; font-weight: 600; margin: 0 0 15px 0; }
  .info-item { color: #424242; margin: 10px 0; font-size: 15px; }
  .info-label { color: #558b2f; font-weight: 600; }
  .table-container { margin: 25px 0; border-radius: 8px; overflow: hidden; }
  .email-table { width: 100%; border-collapse: collapse; }
  .table-header { background: linear-gradient(135deg, #66bb6a 0%, #81c784 100%); color: #ffffff; }
  .table-header th { padding: 15px; text-align: left; font-weight: 600; }
  .table-row td { padding: 15px; border-bottom: 1px solid #e8f5e9; color: #424242; }
  .table-row:last-child td { border-bottom: none; }
  .table-total { background: #f1f8e9; font-weight: 700; color: #2e7d32; }
  .alert-box { background: #fff3e0; border-left: 4px solid #ff9800; padding: 20px; margin: 25px 0; border-radius: 8px; }
  .button { display: inline-block; background: linear-gradient(135deg, #66bb6a 0%, #81c784 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 25px; font-weight: 600; margin: 20px 0; box-shadow: 0 4px 12px rgba(102, 187, 106, 0.3); }
  .footer { background: #f5f5f5; padding: 30px; text-align: center; color: #757575; font-size: 13px; }
  .footer-links { margin: 15px 0; }
  .footer-link { color: #66bb6a; text-decoration: none; margin: 0 10px; }
  .divider { height: 1px; background: linear-gradient(90deg, transparent, #c8e6c9, transparent); margin: 30px 0; }
`;

const getEmailHeader = () => `
  <div class="header">
    <div class="logo-section">
      <img src="cid:logo" alt="Bleaf Logo" class="logo-img" />
      <p class="tagline">Nature Knows the Way — Just Bleaf.</p>
    </div>
  </div>
`;

const getEmailFooter = () => `
  <div class="footer">
    <div class="divider"></div>
    <p style="margin: 0 0 10px 0; color: #2e7d32; font-weight: 600;">🌿 Bleaf - Nature's Trusted Choice</p>
    <p style="margin: 10px 0;">If you have any questions, our support team is here to help.</p>
    <div class="footer-links">
      <a href="#" class="footer-link">Contact Support</a> | 
      <a href="#" class="footer-link">Track Order</a> | 
      <a href="#" class="footer-link">Visit Website</a>
    </div>
    <p style="margin-top: 20px; font-size: 12px;">© ${new Date().getFullYear()} Bleaf. All rights reserved.</p>
  </div>
`;

const sendStockAlert = async (product) => {
  try {
    const inventoryAdmins = await AuthModel.getAdminsByRole('inventory_admin');
    
    if (!inventoryAdmins || inventoryAdmins.length === 0) {
      console.error('No inventory admins found for notification');
      return;
    }

    const adminEmails = inventoryAdmins.map(admin => admin.email);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmails.join(','),
      subject: `🔔 Low Stock Alert: ${product.name} - Bleaf Inventory`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${emailStyles}</style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              ${getEmailHeader()}
              
              <div class="content">
                <h2 class="greeting">⚠ Inventory Alert</h2>
                <p class="message">
                  Action required: The following product has reached its minimum stock threshold and needs immediate attention.
                </p>
                
                <div class="alert-box">
                  <h3 style="color: #e65100; margin: 0 0 15px 0;">📦 ${product.name}</h3>
                  <div style="display: table; width: 100%;">
                    <div style="display: table-row;">
                      <div style="display: table-cell; padding: 8px 0; color: #757575; font-weight: 600;">Current Stock:</div>
                      <div style="display: table-cell; padding: 8px 0; text-align: right; color: #d32f2f; font-weight: 700; font-size: 18px;">${product.stock_quantity} units</div>
                    </div>
                    <div style="display: table-row;">
                      <div style="display: table-cell; padding: 8px 0; color: #757575; font-weight: 600;">Minimum Threshold:</div>
                      <div style="display: table-cell; padding: 8px 0; text-align: right; color: #424242; font-weight: 600;">${product.min_stock_threshold} units</div>
                    </div>
                    <div style="display: table-row;">
                      <div style="display: table-cell; padding: 8px 0; color: #757575; font-weight: 600;">Recommended Reorder:</div>
                      <div style="display: table-cell; padding: 8px 0; text-align: right; color: #2e7d32; font-weight: 600;">${product.reorder_quantity || 'Not set'}</div>
                    </div>
                  </div>
                </div>
                
                <div class="info-box">
                  <p style="margin: 0; color: #558b2f; font-weight: 600;">📋 Recommended Action:</p>
                  <p style="margin: 10px 0 0 0; color: #424242;">Please initiate the restock process to ensure continuous availability for our customers.</p>
                </div>
              </div>
              
              ${getEmailFooter()}
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [{
        filename: 'logo.png',
        path: './assets/logo.png',
        cid: 'logo'
      }]
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending stock alert:', error);
    throw error;
  }
};

const sendOrderConfirmation = async (order, user) => {
  try {
    const username = order.users.profiles.first_name || order.name || 'Customer';

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `✅ Order Confirmation #${order.order_number} - Bleaf`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${emailStyles}</style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              ${getEmailHeader()}
              
              <div class="content">
                <h2 class="greeting">Thank you for your order, ${username}! 🌿</h2>
                <p class="message">
                  We're delighted to confirm your order. Your natural wellness journey continues with Bleaf!
                </p>
                
                <div class="info-box">
                  <h3 class="info-title">📦 Order Summary</h3>
                  <div class="info-item"><span class="info-label">Order Number:</span> #${order.order_number}</div>
                  <div class="info-item"><span class="info-label">Order Date:</span> ${new Date(order.placed_at).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</div>
                  <div class="info-item"><span class="info-label">Total Amount:</span> <span style="color: #2e7d32; font-size: 20px; font-weight: 700;">₹${order.total_amount}</span></div>
                </div>

                <h3 style="color: #2e7d32; margin: 30px 0 15px 0;">🛍 Items Ordered</h3>
                <div class="table-container">
                  <table class="email-table">
                    <thead class="table-header">
                      <tr>
                        <th>Product</th>
                        <th style="text-align: center;">Quantity</th>
                        <th style="text-align: right;">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${order.order_items.map(item => `
                        <tr class="table-row">
                          <td style="font-weight: 500;">${item.products.name}</td>
                          <td style="text-align: center;">${item.quantity}</td>
                          <td style="text-align: right;">₹${(item.quantity * item.unit_price).toFixed(2)}</td>
                        </tr>
                      `).join('')}
                      <tr class="table-total">
                        <td colspan="2" style="text-align: right; padding: 20px 15px;">Total Amount:</td>
                        <td style="text-align: right; padding: 20px 15px; font-size: 18px;">₹${order.total_amount}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="info-box">
                  <p style="margin: 0; color: #558b2f;">
                    <strong>📬 What's Next?</strong><br>
                    We're preparing your order with care. You'll receive a shipping notification with tracking details once your package is on its way.
                  </p>
                </div>
              </div>
              
              ${getEmailFooter()}
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [{
        filename: 'logo.png',
        path: './assets/logo.png',
        cid: 'logo'
      }]
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending order confirmation:', error);
    throw error;
  }
};

const sendOrderStatusUpdate = async (order) => {
  try {
    const userEmail = order.customer_email;
    const username = order.users.profiles.first_name || order.name || 'Customer';

    const statusConfig = {
      processing: { emoji: '⚙', title: 'Order Processing', message: 'Your order is being carefully prepared' },
      packed: { emoji: '📦', title: 'Order Packed', message: 'Your order has been packed with care' },
  shipped: { emoji: '🚚', title: 'Order Shipped', message: `Your order is on its way via ${order.shipping_partner}` },
      out_for_delivery: { emoji: '🏃', title: 'Out for Delivery', message: 'Your order is out for delivery and will arrive soon' },
      delivered: { emoji: '✅', title: 'Order Delivered', message: 'Your order has been successfully delivered' }
    };

    const status = statusConfig[order.status];

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `${status.emoji} Order Update #${order.order_number} - ${status.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${emailStyles}</style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              ${getEmailHeader()}
              
              <div class="content">
                <h2 class="greeting">${status.emoji} ${status.title}</h2>
                <p class="message">Hello ${username},</p>
                <p class="message">${status.message}!</p>
                
                ${order.tracking_number ? `
                  <div class="info-box">
                    <h3 class="info-title">🔍 Tracking Information</h3>
                    <div class="info-item">
                      <span class="info-label">Tracking Number:</span> 
                      <span style="font-family: monospace; font-size: 16px; color: #2e7d32; font-weight: 600;">${order.tracking_number}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Shipping Partner:</span> ${order.shipping_partner}
                    </div>
                  </div>
                ` : ''}
                
                <div class="info-box">
                  <h3 class="info-title">📋 Order Details</h3>
                  <div class="info-item"><span class="info-label">Order Number:</span> #${order.order_number}</div>
                  <div class="info-item">
                    <span class="info-label">Current Status:</span> 
                    <span style="background: linear-gradient(135deg, #66bb6a 0%, #81c784 100%); color: white; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;">${order.status.toUpperCase()}</span>
                  </div>
                </div>

                ${order.status === 'delivered' ? `
                  <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); padding: 20px; border-radius: 12px; text-align: center; margin: 25px 0;">
                    <p style="margin: 0; color: #2e7d32; font-size: 16px; font-weight: 600;">
                      🎉 Enjoy your Bleaf products!<br>
                      <span style="font-size: 14px; font-weight: 400; font-style: italic;">Nature Knows the Way — Just Bleaf.</span>
                    </p>
                  </div>
                ` : ''}
              </div>
              
              ${getEmailFooter()}
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [{
        filename: 'logo.png',
        path: './assets/logo.png',
        cid: 'logo'
      }]
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending order status update:', error);
    throw error;
  }
};

const sendOrderCancellation = async (order, reason, comments) => {
  try {
    const userEmail = order.customer_email;
    const userName = order.users.profiles.first_name;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `❌ Order Cancellation Confirmed #${order.order_number} - Bleaf`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${emailStyles}</style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              ${getEmailHeader()}
              
              <div class="content">
                <h2 class="greeting">Order Cancellation Confirmed</h2>
                <p class="message">Dear ${userName},</p>
                <p class="message">
                  Your order has been successfully cancelled as requested. We're sorry to see this order go, but we hope to serve you again soon.
                </p>
                
                <div class="info-box">
                  <h3 class="info-title">📋 Cancellation Details</h3>
                  <div class="info-item"><span class="info-label">Order Number:</span> #${order.order_number}</div>
                  <div class="info-item"><span class="info-label">Cancellation Reason:</span> ${reason}</div>
                  ${comments ? `<div class="info-item"><span class="info-label">Additional Comments:</span> ${comments}</div>` : ''}
                </div>

                <div class="info-box">
                  <h3 class="info-title">💳 Refund Information</h3>
                  <p style="margin: 10px 0 0 0; color: #424242;">
                    ${order.payment_status === 'paid' 
                      ? '✅ <strong>Refund Initiated:</strong> Your refund has been processed and will be credited to your original payment method within 5-7 business days.' 
                      : '✅ <strong>No Payment Required:</strong> Since no payment was processed, no refund is necessary.'}
                  </p>
                </div>

                <div style="background: #f1f8e9; padding: 20px; border-radius: 12px; text-align: center; margin: 25px 0; border: 2px dashed #66bb6a;">
                  <p style="margin: 0; color: #2e7d32; font-size: 15px;">
                    💚 We'd love to have you back!<br>
                    <span style="font-size: 13px; color: #558b2f;">Explore our natural products anytime at Bleaf.</span>
                  </p>
                </div>
              </div>
              
              ${getEmailFooter()}
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [{
        filename: 'logo.png',
        path: './assets/logo.png',
        cid: 'logo'
      }]
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending cancellation notification:', error);
    throw error;
  }
};

const sendEmailVerificationOTP = async (email, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '🔐 Verify Your Email Address - Bleaf',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${emailStyles}</style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              ${getEmailHeader()}
              
              <div class="content">
                <h2 class="greeting">🔐 Email Verification Required</h2>
                <p class="message">Dear User,</p>
                <p class="message">
                  You've requested to update your email address. Please use the verification code below to confirm your new email:
                </p>
                
                <div style="background: linear-gradient(135deg, #66bb6a 0%, #81c784 100%); padding: 30px; text-align: center; border-radius: 12px; margin: 30px 0;">
                  <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 14px; font-weight: 600; letter-spacing: 1px;">YOUR VERIFICATION CODE</p>
                  <h1 style="margin: 0; color: #ffffff; font-size: 42px; font-weight: 700; letter-spacing: 8px; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">${otp}</h1>
                </div>

                <div class="alert-box">
                  <p style="margin: 0; color: #e65100; font-weight: 600;">⏰ Important:</p>
                  <p style="margin: 10px 0 0 0; color: #424242;">This OTP will expire in <strong>10 minutes</strong>. Please complete verification promptly.</p>
                </div>

                <div class="info-box">
                  <p style="margin: 0; color: #558b2f;">
                    🔒 <strong>Security Note:</strong><br>
                    If you didn't request this change, please ignore this email and your account will remain secure.
                  </p>
                </div>
              </div>
              
              ${getEmailFooter()}
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [{
        filename: 'logo.png',
        path: './assets/logo.png',
        cid: 'logo'
      }]
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email verification OTP:', error);
    throw error;
  }
};

const sendTicketCreated = async (ticket) => {
  try {
    const priorityColors = {
      low: '#66bb6a',
      medium: '#ff9800',
      high: '#f44336',
      urgent: '#d32f2f'
    };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: ticket.customer_email,
      subject: `🎫 Support Ticket Created ${ticket.ticket_number} - Bleaf`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${emailStyles}</style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              ${getEmailHeader()}
              
              <div class="content">
                <h2 class="greeting">🎫 Support Request Received</h2>
                <p class="message">Dear ${ticket.customer_name},</p>
                <p class="message">
                  Thank you for reaching out to Bleaf Support. We've received your request and our team is reviewing it. We'll get back to you as soon as possible.
                </p>
                
                <div class="info-box">
                  <h3 class="info-title">📋 Ticket Details</h3>
                  <div class="info-item">
                    <span class="info-label">Ticket Number:</span> 
                    <span style="font-family: monospace; color: #2e7d32; font-weight: 600;">${ticket.ticket_number}</span>
                  </div>
                  <div class="info-item"><span class="info-label">Subject:</span> ${ticket.subject}</div>
                  <div class="info-item"><span class="info-label">Category:</span> ${ticket.category}</div>
                  <div class="info-item">
                    <span class="info-label">Priority:</span> 
                    <span style="background: ${priorityColors[ticket.priority] || '#66bb6a'}; color: white; padding: 3px 10px; border-radius: 10px; font-size: 12px; font-weight: 600; text-transform: uppercase;">${ticket.priority}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Status:</span> 
                    <span style="background: #e3f2fd; color: #1976d2; padding: 3px 10px; border-radius: 10px; font-size: 12px; font-weight: 600; text-transform: uppercase;">${ticket.status}</span>
                  </div>
                </div>

                <div style="background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%); padding: 20px; border-radius: 12px; text-align: center; margin: 25px 0;">
                  <p style="margin: 0; color: #2e7d32; font-size: 15px;">
                    💚 Our support team typically responds within 24 hours<br>
                    <span style="font-size: 13px; color: #558b2f; font-style: italic;">We're here to help you!</span>
                  </p>
                </div>
              </div>
              
              ${getEmailFooter()}
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [{
        filename: 'logo.png',
        path: './assets/logo.png',
        cid: 'logo'
      }]
    };
    
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending ticket creation email:', error);
    throw error;
  }
};

const sendTicketStatusUpdate = async (ticket, user) => {
  try {
    const statusConfig = {
      open: { emoji: '📂', color: '#2196f3', message: 'Your ticket is open and being reviewed' },
      in_progress: { emoji: '⚙', color: '#ff9800', message: 'Our team is actively working on your request' },
      resolved: { emoji: '✅', color: '#66bb6a', message: 'Your issue has been resolved' },
      closed: { emoji: '🔒', color: '#9e9e9e', message: 'This ticket has been closed' }
    };

    const status = statusConfig[ticket.status] || statusConfig.open;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `${status.emoji} Ticket Update ${ticket.ticket_number} - Bleaf`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${emailStyles}</style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              ${getEmailHeader()}
              
              <div class="content">
                <h2 class="greeting">${status.emoji} Ticket Status Updated</h2>
                <p class="message">Dear ${ticket.customer_name || user.name},</p>
                <p class="message">
                  Your support ticket <strong>"${ticket.subject}"</strong> has been updated.
                </p>
                
                <div style="background: ${status.color}15; border-left: 4px solid ${status.color}; padding: 20px; margin: 25px 0; border-radius: 8px;">
                  <h3 style="color: ${status.color}; margin: 0 0 10px 0; font-size: 18px;">
                    Current Status: ${ticket.status.toUpperCase().replace('_', ' ')}
                  </h3>
                  <p style="margin: 0; color: #424242; font-size: 15px;">${status.message}</p>
                </div>

                <div class="info-box">
                  <h3 class="info-title">📋 Ticket Information</h3>
                  <div class="info-item">
                    <span class="info-label">Ticket Number:</span> 
                    <span style="font-family: monospace; color: #2e7d32; font-weight: 600;">${ticket.ticket_number}</span>
                  </div>
                  <div class="info-item"><span class="info-label">Priority:</span> ${ticket.priority.toUpperCase()}</div>
                </div>

                ${ticket.status === 'resolved' ? `
                  <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0;">
                    <h3 style="color: #2e7d32; margin: 0 0 15px 0; font-size: 18px;">✨ Issue Resolved!</h3>
                    <p style="margin: 0; color: #424242; font-size: 15px;">
                      We hope we've addressed your concern satisfactorily. If you need further assistance, feel free to reply to reopen this ticket.
                    </p>
                  </div>
                ` : ''}

                <div style="background: #f1f8e9; padding: 20px; border-radius: 12px; text-align: center; margin: 25px 0; border: 2px dashed #66bb6a;">
                  <p style="margin: 0; color: #2e7d32; font-size: 14px;">
                    💬 Have questions? Reply to this email or contact our support team<br>
                    <span style="font-size: 12px; color: #558b2f; font-style: italic;">We're always here to help!</span>
                  </p>
                </div>
              </div>
              
              ${getEmailFooter()}
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [{
        filename: 'logo.png',
        path: './assets/logo.png',
        cid: 'logo'
      }]
    };
    
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending ticket status update email:', error);
    throw error;
  }
};

const sendRoleUpdateNotification = async (user, newRole, oldRole) => {
  try {
    const userName = user.profile?.first_name || user.email.split('@')[0];
    
    const roleDescriptions = {
      customer: { title: 'Customer', description: 'Browse and purchase products from our store', color: '#757575' },
      inventory_admin: { title: 'Inventory Admin', description: 'Manage product inventory, stock levels, and product listings', color: '#ff9800' },
      order_admin: { title: 'Order Admin', description: 'Process and manage customer orders and shipments', color: '#2196f3' },
      support_admin: { title: 'Support Admin', description: 'Handle customer support tickets and inquiries', color: '#9c27b0' },
      content_admin: { title: 'Content Admin', description: 'Manage blogs, FAQs, and other platform content', color: '#00bcd4' },
      super_admin: { title: 'Super Admin', description: 'Full system access with all administrative privileges', color: '#f44336' }
    };

    const newRoleInfo = roleDescriptions[newRole] || roleDescriptions.customer;
    const oldRoleInfo = roleDescriptions[oldRole] || roleDescriptions.customer;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `🔑 Your Account Role Has Been Updated - Bleaf`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${emailStyles}</style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              ${getEmailHeader()}
              
              <div class="content">
                <h2 class="greeting">🔑 Your Account Role Has Been Updated</h2>
                <p class="message">Dear ${userName},</p>
                <p class="message">
                  Your account role on Bleaf has been updated. This change affects your permissions and access levels within our platform.
                </p>
                
                <div style="background: linear-gradient(135deg, #fff9e5 0%, #ffe8b3 100%); border-left: 4px solid #ff9800; padding: 20px; margin: 25px 0; border-radius: 8px;">
                  <h3 style="color: #e65100; margin: 0 0 15px 0; font-size: 18px;">
                    ⚠ Role Change Details
                  </h3>
                  <div style="display: flex; align-items: center; justify-content: space-between; margin: 15px 0;">
                    <div style="flex: 1; text-align: center;">
                      <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <div style="color: #757575; font-size: 12px; font-weight: 600; margin-bottom: 8px;">PREVIOUS ROLE</div>
                        <div style="color: ${oldRoleInfo.color}; font-size: 16px; font-weight: 700; margin-bottom: 5px;">
                          ${oldRoleInfo.title}
                        </div>
                      </div>
                    </div>
                    <div style="flex: 0 0 40px; text-align: center; font-size: 24px; color: #ff9800;">
                      →
                    </div>
                    <div style="flex: 1; text-align: center;">
                      <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(102, 187, 106, 0.2); border: 2px solid #66bb6a;">
                        <div style="color: #2e7d32; font-size: 12px; font-weight: 600; margin-bottom: 8px;">NEW ROLE</div>
                        <div style="color: ${newRoleInfo.color}; font-size: 16px; font-weight: 700; margin-bottom: 5px;">
                          ${newRoleInfo.title}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="info-box">
                  <h3 class="info-title">📋 Your New Permissions</h3>
                  <div class="info-item">
                    <span class="info-label">Role:</span> 
                    <span style="color: ${newRoleInfo.color}; font-weight: 700;">${newRoleInfo.title}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Description:</span> ${newRoleInfo.description}
                  </div>
                  <div class="info-item">
                    <span class="info-label">Updated On:</span> ${new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}
                  </div>
                </div>

                ${newRole !== 'customer' ? `
                  <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0; border: 2px solid #66bb6a;">
                    <h3 style="color: #2e7d32; margin: 0 0 10px 0; font-size: 18px;">🎉 Welcome to the Team!</h3>
                    <p style="margin: 0; color: #424242; font-size: 15px;">
                      You now have administrative access to Bleaf. Please use your new permissions responsibly.
                    </p>
                  </div>
                ` : ''}

                <div style="background: #f1f8e9; padding: 20px; border-radius: 12px; text-align: center; margin: 25px 0; border: 2px dashed #66bb6a;">
                  <p style="margin: 0; color: #2e7d32; font-size: 14px;">
                    💡 Questions about your new role?<br>
                    <span style="font-size: 13px; color: #558b2f;">Contact our admin team for guidance and support.</span>
                  </p>
                </div>

                <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 25px 0; border-radius: 8px;">
                  <p style="margin: 0; color: #e65100; font-size: 13px;">
                    <strong>⚠ Security Notice:</strong> If you did not request this change or believe this is an error, please contact our support team immediately.
                  </p>
                </div>
              </div>
              
              ${getEmailFooter()}
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [{
        filename: 'logo.png',
        path: './assets/logo.png',
        cid: 'logo'
      }]
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending role update notification:', error);
    throw error;
  }
};

const sendAdminWelcomeNotification = async (email, password, role) => {
  try {
    const roleDescriptions = {
      inventory_admin: { 
        title: 'Inventory Admin', 
        description: 'Manage product inventory, stock levels, and product listings',
        color: '#ff9800',
        icon: '📦',
        responsibilities: [
          'Add, update, and remove products from inventory',
          'Monitor stock levels and set reorder thresholds',
          'Manage product categories and attributes',
          'Review and handle low stock alerts'
        ]
      },
      order_admin: { 
        title: 'Order Admin', 
        description: 'Process and manage customer orders and shipments',
        color: '#2196f3',
        icon: '📋',
        responsibilities: [
          'View and process customer orders',
          'Update order status and tracking information',
          'Handle order cancellations and refunds',
          'Monitor order fulfillment metrics'
        ]
      },
      support_admin: { 
        title: 'Support Admin', 
        description: 'Handle customer support tickets and inquiries',
        color: '#9c27b0',
        icon: '🎧',
        responsibilities: [
          'Respond to customer support tickets',
          'Resolve customer issues and complaints',
          'Manage FAQ and help documentation',
          'Track support metrics and satisfaction'
        ]
      },
      content_admin: { 
        title: 'Content Admin', 
        description: 'Manage blogs, FAQs, and other platform content',
        color: '#00bcd4',
        icon: '✍️',
        responsibilities: [
          'Create and publish blog posts',
          'Manage plant care guides and resources',
          'Update FAQs and help articles',
          'Moderate user-generated content'
        ]
      },
      super_admin: { 
        title: 'Super Admin', 
        description: 'Full system access with all administrative privileges',
        color: '#f44336',
        icon: '👑',
        responsibilities: [
          'Manage all admin accounts and roles',
          'Access all system features and settings',
          'Monitor overall platform performance',
          'Configure system-wide settings'
        ]
      }
    };

    const roleInfo = roleDescriptions[role] || roleDescriptions.inventory_admin;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `🎉 Welcome to Bleaf Admin Team - Your Account Has Been Created`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${emailStyles}</style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              ${getEmailHeader()}
              
              <div class="content">
                <h2 class="greeting">🎉 Welcome to the Bleaf Admin Team!</h2>
                <p class="message">
                  Congratulations! An administrator account has been created for you on the Bleaf platform.
                  You now have access to our admin dashboard with special privileges.
                </p>
                
                <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-left: 4px solid #2196f3; padding: 25px; margin: 25px 0; border-radius: 8px;">
                  <h3 style="color: #1565c0; margin: 0 0 20px 0; font-size: 20px; display: flex; align-items: center;">
                    ${roleInfo.icon} Your Admin Role: ${roleInfo.title}
                  </h3>
                  <p style="color: #424242; margin: 0 0 15px 0; font-size: 15px; line-height: 1.6;">
                    ${roleInfo.description}
                  </p>
                </div>

                <div class="info-box">
                  <h3 class="info-title">🔐 Your Login Credentials</h3>
                  <div class="info-item">
                    <span class="info-label">Email:</span> 
                    <span style="background: #f5f5f5; padding: 5px 12px; border-radius: 6px; font-family: monospace; color: #2e7d32; font-weight: 600;">${email}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Temporary Password:</span> 
                    <span style="background: #f5f5f5; padding: 5px 12px; border-radius: 6px; font-family: monospace; color: #d32f2f; font-weight: 600;">${password}</span>
                  </div>
                  <div class="info-item" style="margin-top: 15px; padding: 15px; background: #fff9e5; border-radius: 6px; border-left: 3px solid #ff9800;">
                    <span style="color: #e65100; font-weight: 600;">⚠ Important:</span> 
                    <span style="color: #424242;">Please change this password after your first login for security purposes.</span>
                  </div>
                </div>

                <div style="background: white; border: 2px solid #e8f5e9; padding: 25px; margin: 25px 0; border-radius: 8px;">
                  <h3 style="color: #2e7d32; margin: 0 0 15px 0; font-size: 18px;">
                    📌 Your Key Responsibilities
                  </h3>
                  <ul style="margin: 0; padding-left: 20px; color: #424242;">
                    ${roleInfo.responsibilities.map(resp => 
                      `<li style="margin: 10px 0; line-height: 1.5;">${resp}</li>`
                    ).join('')}
                  </ul>
                </div>

                <div style="background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%); border-left: 4px solid #e91e63; padding: 20px; margin: 25px 0; border-radius: 8px;">
                  <h3 style="color: #c2185b; margin: 0 0 12px 0; font-size: 16px;">
                    🔒 Security Best Practices
                  </h3>
                  <ul style="margin: 0; padding-left: 20px; color: #424242; font-size: 14px;">
                    <li style="margin: 8px 0;">Change your temporary password immediately after first login</li>
                    <li style="margin: 8px 0;">Use a strong password with at least 8 characters</li>
                    <li style="margin: 8px 0;">Never share your admin credentials with anyone</li>
                    <li style="margin: 8px 0;">Log out when finished using the admin panel</li>
                    <li style="margin: 8px 0;">Enable two-factor authentication if available</li>
                  </ul>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">
                    🚀 Access Admin Dashboard
                  </a>
                </div>

                <div class="divider"></div>

                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
                  <h3 style="color: #424242; margin: 0 0 15px 0; font-size: 16px;">
                    💡 Getting Started
                  </h3>
                  <ol style="margin: 0; padding-left: 20px; color: #616161; font-size: 14px;">
                    <li style="margin: 10px 0;">Click the "Access Admin Dashboard" button above</li>
                    <li style="margin: 10px 0;">Log in using your email and temporary password</li>
                    <li style="margin: 10px 0;">Navigate to your profile settings to change your password</li>
                    <li style="margin: 10px 0;">Explore the admin dashboard and familiarize yourself with the features</li>
                    <li style="margin: 10px 0;">Contact the Super Admin if you need any assistance</li>
                  </ol>
                </div>

                <p class="message" style="margin-top: 30px;">
                  If you believe this account was created in error or if you have any questions, please contact our Super Admin immediately.
                </p>

                <p class="message" style="color: #2e7d32; font-weight: 600;">
                  Welcome aboard! We're excited to have you as part of the Bleaf team. 🌿
                </p>
              </div>
              
              ${getEmailFooter()}
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [{
        filename: 'logo.png',
        path: './assets/logo.png',
        cid: 'logo'
      }]
    };

    await transporter.sendMail(mailOptions);
    console.log(`Admin welcome email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending admin welcome notification:', error);
    throw error;
  }
};

module.exports = {
  sendStockAlert,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendOrderCancellation,
  sendEmailVerificationOTP,
  sendTicketCreated,
  sendTicketStatusUpdate,
  sendRoleUpdateNotification,
  sendAdminWelcomeNotification
};