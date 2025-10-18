const validateOrderCreate = (data) => {
  const errors = {};

  if (!data.type || !['cart', 'direct'].includes(data.type)) {
    errors.type = 'Invalid order type';
  }

  if (data.type === 'direct') {
    if (!data.productId) {
      errors.productId = 'Product ID is required';
    }
    if (!data.quantity || data.quantity < 1) {
      errors.quantity = 'Valid quantity is required';
    }
    if (!data.price || data.price <= 0) {
      errors.price = 'Valid price is required';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateOrderPayment = (data) => {
  const errors = {};

  if (!data.paymentId) {
    errors.paymentId = 'Payment ID is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateCancellationReason = (data) => {
  const errors = {};
  const allowedReasons = [
    'changed_mind',
    'delivery_delayed',
    'wrong_item_ordered',
    'better_price_elsewhere',
    'address_change_needed',
    'payment_issue',
    'other'
  ];

  if (!data.reason) {
    errors.reason = 'Cancellation reason is required';
  } else if (!allowedReasons.includes(data.reason)) {
    errors.reason = 'Invalid cancellation reason';
  }

  if (data.reason === 'other' && !data.comments?.trim()) {
    errors.comments = 'Comments required for other reason';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateOrderUpdate = (data) => {
  const errors = {};
  const validStatuses = [
    'pending',
    'confirmed',
    'processing',
    'packed',
    'shipped',
    'out_for_delivery',
    'delivered'
  ];

  if (!data.status || !validStatuses.includes(data.status)) {
    errors.status = 'Invalid order status';
  }

  if (data.status === 'shipped' || data.status === 'out_for_delivery') {
    if (!data.trackingNumber?.trim()) {
      errors.trackingNumber = 'Tracking number required for shipping';
    }
    if (!data.shippingPartner?.trim()) {
      errors.shippingPartner = 'Shipping partner required';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const isValidStatusTransition = (currentStatus, newStatus) => {
  const validTransitions = {
    'pending': ['confirmed'],
    'confirmed': ['processing'],
    'processing': ['packed'],
    'packed': ['shipped'],
    'shipped': ['out_for_delivery'],
    'out_for_delivery': ['delivered']
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

module.exports = {
  validateOrderCreate,
  validateOrderPayment,
  validateCancellationReason,
  validateOrderUpdate,
  isValidStatusTransition
};