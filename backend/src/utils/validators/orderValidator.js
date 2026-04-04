const validateOrderCreate = (data) => {
  const errors = {};

  if (!data.type || !['cart', 'direct'].includes(data.type)) {
    errors.type = 'Invalid order type';
  }

  if (data.type === 'direct') {
    if (!data.productId) errors.productId = 'Product ID is required';
    if (!data.quantity || Number(data.quantity) < 1) errors.quantity = 'Valid quantity is required';
    if (!data.price || Number(data.price) <= 0) errors.price = 'Valid price is required';
  } else if (data.type === 'cart') {
    if (!Array.isArray(data.items) || data.items.length === 0) {
      errors.items = 'Cart must contain at least one item';
    } else {
      data.items.forEach((it, idx) => {
        const qty = Number(it.quantity ?? 0);
        const pid = it.product_id ?? it.id;
        if (!pid) errors[`items[${idx}].product_id`] = 'product_id is required';
        if (!Number.isFinite(qty) || qty <= 0) errors[`items[${idx}].quantity`] = 'quantity must be a positive integer';
        const price = Number(it.price ?? it.unit_price ?? 0);
        if (!Number.isFinite(price) || price <= 0) errors[`items[${idx}].price`] = 'price must be a positive number';
      });
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
    pending: ['confirmed'],
    confirmed: ['processing'],
    processing: ['packed' ],
    packed: ['shipped', 'processing'],
    shipped: ['out_for_delivery'],
    out_for_delivery: ['delivered']
  };

  if (!currentStatus || !newStatus) {
    return {
      isValid: false,
      message: "Both current and new statuses are required."
    };
  }

  if (!validTransitions.hasOwnProperty(currentStatus)) {
    return {
      isValid: false,
      message: `Invalid current status '${currentStatus}'.`
    };
  }

  const allowedNextStatuses = validTransitions[currentStatus];
  if (!allowedNextStatuses.includes(newStatus)) {
    return {
      isValid: false,
      message: `Status '${currentStatus}' can only be changed to: ${allowedNextStatuses.join(', ')}.`
    };
  }

  return {
    isValid: true,
    message: `Status changed from '${currentStatus}' to '${newStatus}' successfully.`
  };
};


module.exports = {
  validateOrderCreate,
  validateOrderPayment,
  validateCancellationReason,
  validateOrderUpdate,
  isValidStatusTransition
};