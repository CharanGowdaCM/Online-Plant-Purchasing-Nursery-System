// Developer: M Lakshya
// Features: Order creation, payment update, payment options, user order history, order details, order cancellation, invoice download, order status color, order flow tracking, special status handling


import api from './api';

class OrderServiceUser {
  // Create a new order
  static async createOrder(orderData) {
    try {
      const response = await api.post('/orders/create', orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Update order payment status
  static async updateOrderPayment(orderId, paymentData) {
    try {
      const response = await api.post(`/orders/${orderId}/payment`, paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get available payment options for an order
  static async getPaymentOptions(orderId) {
    try {
      const response = await api.get(`/orders/${orderId}/payment-options`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get all orders for the logged-in user
  static async getUserOrders() {
    try {
      const response = await api.get('/orders/user');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get specific order details for the logged-in user
  static async getUserOrderDetails(orderId) {
    try {
      const response = await api.get(`/orders/user/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Cancel an order
  static async cancelOrder(orderId, cancelData) {
    try {
      const response = await api.post(`/orders/${orderId}/cancel`, cancelData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Download invoice PDF for an order
  static async downloadInvoice(orderId) {
    try {
      // Use axios api instance to leverage token refresh interceptor
      const response = await api.get(`/orders/${orderId}/invoice`, {
        responseType: 'blob' // Important for PDF download
      });

      // Get filename from Content-Disposition header if available
      const contentDisposition = response.headers['content-disposition'];
      let filename = `Invoice-${orderId}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create temporary anchor element and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      a.remove();
      window.URL.revokeObjectURL(url);

      return { success: true, message: 'Invoice downloaded successfully' };
    } catch (error) {
      console.error('Error downloading invoice:', error);
      throw error.response?.data?.message || error.message || 'Failed to download invoice';
    }
  }

  //  status color
  static getStatusColor(status) {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'cancelled':
      case 'refunded':
        return 'danger';
      case 'shipped':
      case 'out_for_delivery':
        return 'info';
      case 'processing':
      case 'packed':
        return 'warning';
      default:
        return 'primary';
    }
  }

  //  order flow steps
  static getNormalOrderFlow() {
    return [
      'pending',
      'confirmed',
      'processing',
      'packed',
      'shipped',
      'out_for_delivery',
      'delivered'
    ];
  }

  // special statuses
  static getSpecialStatuses() {
    return ['cancelled', 'refunded'];
  }
}

export default OrderServiceUser;