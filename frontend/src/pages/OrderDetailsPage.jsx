/**
 * Developer: Charan Gowda C M
 * Features: Order Details, Order Summary, Payment Integration, Razorpay, Cart Items, 
 * Billing Address, Order Confirmation, API Integration, Responsive UI, 
 * React Hooks, Toast Notification, Navigation
 */



import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OrderServiceUser from '../services/orderServiceUser';
import PaymentService from '../services/paymentService';
import profileService from '../services/profileService';
import 'bootstrap/dist/css/bootstrap.min.css';

// Get order flow from service
const normalOrderFlow = OrderServiceUser.getNormalOrderFlow();
const specialStatuses = OrderServiceUser.getSpecialStatuses();

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelData, setCancelData] = useState({
    reason: '',
    comments: ''
  });
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {

    fetchOrderDetails();
  }, [isAuthenticated, orderId, navigate]);

  const fetchOrderDetails = async () => {
    try {
      const response = await OrderServiceUser.getUserOrderDetails(orderId);
      console.log("Fetched Order Details:", response);
      if (response && response.success) {
        console.log("Order Data:", response.data);
        setOrder(response.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const initializeRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      if (!order) return;

      const res = await initializeRazorpay();
      if (!res) {
        throw new Error('Razorpay SDK failed to load');
      }

      const profileData = await profileService.getProfile();
      const paymentResponse = await PaymentService.initiatePayment(
        order.total_amount,
        order.id
      );

      const options = {
        key: paymentResponse.data.key,
        amount: order.total_amount * 100,
        currency: "INR",
        name: "Plant Nursery",
        description: "Plant Purchase Payment",
        order_id: paymentResponse.data.razorpayOrderId,
        handler: async (response) => {
          try {
            const verificationResponse = await PaymentService.verifyPayment(
              paymentResponse.data.razorpayOrderId,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            if (verificationResponse.success) {
              await OrderServiceUser.updateOrderPayment(
                order.id,
                { 
                  paymentId: response.razorpay_payment_id,
                  type: 'order'
                }
              );
              fetchOrderDetails();
            }
          } catch (err) {
            setError('Payment verification failed');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: profileData?.profile?.mobile_number || ''
        },
        theme: {
          color: "#28a745",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      setError(err.message || 'Payment initiation failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div 
        className="min-vh-100 d-flex align-items-center justify-content-center" 
        style={{ backgroundColor: '#F5F1E8' }}
      >
        <div className="text-center">
          <div 
            className="spinner-border mb-3" 
            role="status" 
            style={{ 
              width: '4rem', 
              height: '4rem',
              color: '#2C5F2D',
              borderWidth: '0.3rem'
            }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{ 
            color: '#2C5F2D', 
            fontWeight: '600', 
            fontSize: '1.1rem' 
          }}>
            Loading order details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="min-vh-100 d-flex align-items-center justify-content-center p-4" 
        style={{ backgroundColor: '#F5F1E8' }}
      >
        <div 
          className="alert border-0 shadow-lg" 
          role="alert" 
          style={{ 
            maxWidth: '500px',
            backgroundColor: '#FFF5F5',
            color: '#C53030',
            borderRadius: '12px',
            padding: '1.5rem'
          }}
        >
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      </div>
    );
  }

  console.log("Order Data:", order);
  
  if (!order) {
    return (
      <div 
        className="min-vh-100 d-flex align-items-center justify-content-center p-4" 
        style={{ backgroundColor: '#F5F1E8' }}
      >
        <div 
          className="card border-0 shadow-sm text-center" 
          style={{
            borderRadius: '16px',
            backgroundColor: '#FFFFFF',
            padding: '3rem',
            maxWidth: '500px'
          }}
        >
          <div style={{ fontSize: '4rem' }}>📦</div>
          <h3 className="mt-3 mb-2" style={{ color: '#2C5F2D' }}>Order not found</h3>
          <p style={{ color: '#6B7B5F' }}>The order you're looking for doesn't exist</p>
          <button 
            onClick={() => navigate('/profile')} 
            className="btn mt-3"
            style={{
              backgroundColor: '#2C5F2D',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '0.75rem 2rem',
              fontWeight: '600'
            }}
          >
            View All Orders
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = OrderServiceUser.getStatusColor;
  
  const formatAddress = (addr) => {
    if (!addr) return 'Not provided';
    return `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} - ${addr.postalCode || ''}, ${addr.country || ''}`;
  };

  const handleCancelOrder = async () => {
    try {
      setIsCancelling(true);
      await OrderServiceUser.cancelOrder(orderId, cancelData);
      setShowCancelModal(false);
      await fetchOrderDetails();
    } catch (err) {
      setError('Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      setDownloadingInvoice(true);
      await OrderServiceUser.downloadInvoice(orderId);
    } catch (err) {
      setError(err.message || 'Failed to download invoice');
      alert(err.message || 'Failed to download invoice. Please try again.');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': '⏳',
      'confirmed': '✅',
      'processing': '🔄',
      'shipped': '🚚',
      'delivered': '📦',
      'cancelled': '❌'
    };
    return icons[status] || '📋';
  };

  const getStatusBadgeStyle = (status) => {
    // Subtle border and shadow improve contrast on the green header background
    const base = {
      border: '1px solid rgba(255, 255, 255, 0.35)',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.15)'
    };

    const styles = {
      pending: { backgroundColor: '#FEF3C7', color: '#92400E' },
      confirmed: { backgroundColor: '#DBEAFE', color: '#1E40AF' },
      processing: { backgroundColor: '#E0E7FF', color: '#4338CA' },
      shipped: { backgroundColor: '#DBEAFE', color: '#1E3A8A' },
      delivered: { backgroundColor: '#D1FAE5', color: '#065F46' },
      cancelled: { backgroundColor: '#FEE2E2', color: '#991B1B' }
    };

    return { ...base, ...(styles[status] || styles.pending) };
  };

  return (
    <div 
      className="min-vh-100" 
      style={{ backgroundColor: '#F5F1E8', paddingTop: '3rem', paddingBottom: '3rem' }}
    >
      <div className="container" style={{ maxWidth: '1000px' }}>
        {/* Back Button */}
        <button 
          onClick={() => navigate('/profile')} 
          className="btn fw-semibold mb-4"
          style={{
            backgroundColor: 'transparent',
            color: '#2C5F2D',
            border: '2px solid #2C5F2D',
            borderRadius: '10px',
            padding: '0.65rem 1.5rem',
            fontSize: '0.95rem',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#2C5F2D';
            e.target.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#2C5F2D';
          }}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back to Orders
        </button>

        {/* Main Order Card */}
        <div 
          className="card border-0 shadow-lg" 
          style={{
            borderRadius: '20px',
            backgroundColor: '#FFFFFF',
            overflow: 'hidden'
          }}
        >
          {/* Header Section */}
          <div 
            style={{
              background: 'linear-gradient(135deg, #2C5F2D 0%, #4A8A4D 100%)',
              padding: '2.5rem 2rem',
              color: '#FFFFFF'
            }}
          >
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
              <div>
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div 
                    style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      border: '3px solid rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    {getStatusIcon(order.status)}
                  </div>
                  <div>
                    <h2 className="mb-1 fw-bold" style={{ fontSize: '1.8rem' }}>
                      Order #{order.order_number}
                    </h2>
                    <p className="mb-0" style={{ fontSize: '0.95rem', opacity: 0.9 }}>
                      <i className="bi bi-calendar3 me-2"></i>
                      Placed on {new Date(order.placed_at).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  <span 
                    className="fw-semibold"
                    style={{
                      // Base badge styling consistent with payment badge
                      padding: '0.6rem 1.2rem',
                      borderRadius: '10px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      // Colors come from getStatusBadgeStyle to keep theme-consistent
                      ...getStatusBadgeStyle(order.status)
                    }}
                  >
                    {order.status?.replace('_', ' ').toUpperCase()}
                  </span>
                  <span 
                    className="badge"
                    style={{
                      backgroundColor: order.payment_status === 'paid' ? '#D1FAE5' : '#FEF3C7',
                      color: order.payment_status === 'paid' ? '#065F46' : '#92400E',
                      padding: '0.6rem 1.2rem',
                      borderRadius: '10px',
                       display: 'inline-flex',
                      alignItems: 'center',
                      fontSize: '0.9rem',
                      fontWeight: '600'
                    }}
                  >
                    <i className="bi bi-credit-card me-2"></i>
                    Payment: {order.payment_status?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="text-md-end">
                <p className="mb-1" style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                  Total Amount
                </p>
                <h1 
                  className="mb-3 fw-bold" 
                  style={{ fontSize: '2.8rem', lineHeight: 1 }}
                >
                  ₹{order.total_amount}
                </h1>
                <button
                  className="btn btn-light fw-semibold shadow-sm"
                  onClick={handleDownloadInvoice}
                  disabled={downloadingInvoice}
                  style={{
                    borderRadius: '10px',
                    padding: '0.6rem 1.5rem',
                    fontSize: '0.9rem',
                    border: '2px solid rgba(255, 255, 255, 0.3)'
                  }}
                >
                  {downloadingInvoice ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-download me-2"></i>
                      Download Invoice
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="p-4">
            {/* Order Timeline */}
            {!specialStatuses.includes(order.status) && (
              <div 
                className="mb-4 p-4 rounded"
                style={{ backgroundColor: '#F8F6F1' }}
              >
                <h6 className="mb-4 fw-bold" style={{ color: '#2C5F2D', fontSize: '1.1rem' }}>
                  <i className="bi bi-clock-history me-2" style={{ color: '#97C97D' }}></i>
                  Order Journey
                </h6>
                <div className="position-relative" style={{ padding: '1.5rem 0' }}>
                  {/* Progress Line */}
                  <div 
                    className="position-absolute" 
                    style={{ 
                      top: '2rem', 
                      left: '1.5rem', 
                      right: '1.5rem', 
                      height: '4px',
                      backgroundColor: '#E5E7EB',
                      borderRadius: '2px'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${((normalOrderFlow.indexOf(order.status) + 1) / normalOrderFlow.length) * 100}%`,
                        background: 'linear-gradient(90deg, #2C5F2D 0%, #97C97D 100%)',
                        borderRadius: '2px',
                        transition: 'width 0.5s ease'
                      }}
                    ></div>
                  </div>

                  {/* Timeline Steps */}
                  <div className="d-flex justify-content-between position-relative">
                    {normalOrderFlow.map((step, index) => {
                      const isCompleted = normalOrderFlow.indexOf(order.status) >= index;
                      const isCurrent = normalOrderFlow.indexOf(order.status) === index;
                      
                      return (
                        <div key={index} className="text-center" style={{ flex: 1, zIndex: 1 }}>
                          <div
                            className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                            style={{
                              width: isCurrent ? '50px' : '40px',
                              height: isCurrent ? '50px' : '40px',
                              borderRadius: '50%',
                              backgroundColor: isCompleted ? '#2C5F2D' : '#E5E7EB',
                              color: '#FFFFFF',
                              fontSize: isCurrent ? '1.3rem' : '1rem',
                              fontWeight: '700',
                              transition: 'all 0.3s ease',
                              boxShadow: isCurrent ? '0 4px 12px rgba(44, 95, 45, 0.3)' : 'none',
                              border: isCurrent ? '4px solid #97C97D' : 'none'
                            }}
                          >
                            {isCompleted ? '✓' : (index + 1)}
                          </div>
                          <div
                            style={{
                              fontSize: isCurrent ? '0.85rem' : '0.75rem',
                              fontWeight: isCurrent ? '700' : '500',
                              color: isCompleted ? '#2C5F2D' : '#9CA3AF',
                              textTransform: 'capitalize',
                              padding: '0 0.3rem'
                            }}
                          >
                            {step.replace('_', ' ')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="mb-4">
              <h6 className="mb-3 fw-bold" style={{ color: '#2C5F2D', fontSize: '1.1rem' }}>
                <i className="bi bi-bag-check me-2" style={{ color: '#97C97D' }}></i>
                Order Items
              </h6>
              <div 
                className="rounded overflow-hidden"
                style={{ border: '2px solid #F8F6F1' }}
              >
                <table className="table table-hover mb-0">
                  <thead style={{ backgroundColor: '#F8F6F1' }}>
                    <tr>
                      <th style={{ 
                        padding: '1rem', 
                        color: '#2C5F2D', 
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Product
                      </th>
                      <th className="text-center" style={{ 
                        padding: '1rem', 
                        color: '#2C5F2D', 
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Price
                      </th>
                      <th className="text-center" style={{ 
                        padding: '1rem', 
                        color: '#2C5F2D', 
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Qty
                      </th>
                      <th className="text-end" style={{ 
                        padding: '1rem', 
                        color: '#2C5F2D', 
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.order_items?.map((item, idx) => (
                      <tr key={item.id}>
                        <td style={{ 
                          padding: '1rem',
                          color: '#2C5F2D',
                          fontWeight: '500',
                          border: 'none',
                          borderTop: idx === 0 ? 'none' : '1px solid #F8F6F1'
                        }}>
                          <i className="bi bi-box me-2" style={{ color: '#97C97D' }}></i>
                          {item.products?.name || item.product?.name || 'Unknown'}
                        </td>
                        <td className="text-center" style={{ 
                          padding: '1rem',
                          color: '#6B7B5F',
                          border: 'none',
                          borderTop: idx === 0 ? 'none' : '1px solid #F8F6F1'
                        }}>
                          ₹{item.unit_price}
                        </td>
                        <td className="text-center" style={{ 
                          padding: '1rem',
                          border: 'none',
                          borderTop: idx === 0 ? 'none' : '1px solid #F8F6F1'
                        }}>
                          <span 
                            className="badge"
                            style={{
                              backgroundColor: '#E8F5E9',
                              color: '#2C5F2D',
                              fontSize: '0.85rem',
                              padding: '0.4rem 0.8rem',
                              fontWeight: '600',
                              borderRadius: '8px'
                            }}
                          >
                            {item.quantity}
                          </span>
                        </td>
                        <td className="text-end" style={{ 
                          padding: '1rem',
                          color: '#2C5F2D',
                          fontWeight: '600',
                          fontSize: '1rem',
                          border: 'none',
                          borderTop: idx === 0 ? 'none' : '1px solid #F8F6F1'
                        }}>
                          ₹{item.subtotal}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Price Summary */}
                <div 
                  style={{
                    backgroundColor: '#F8F6F1',
                    padding: '1.5rem',
                    borderTop: '2px solid #E5E7EB'
                  }}
                >
                  <div className="row">
                    <div className="col-md-6"></div>
                    <div className="col-md-6">
                      <div className="d-flex justify-content-between mb-2">
                        <span style={{ color: '#6B7B5F', fontSize: '0.95rem' }}>Subtotal:</span>
                        <span style={{ color: '#2C5F2D', fontWeight: '500' }}>₹{order.subtotal}</span>
                      </div>
                      {order.discount_amount > 0 && (
                        <div className="d-flex justify-content-between mb-2">
                          <span style={{ color: '#6B7B5F', fontSize: '0.95rem' }}>Discount:</span>
                          <span style={{ color: '#E85D75', fontWeight: '500' }}>-₹{order.discount_amount}</span>
                        </div>
                      )}
                      {order.tax_amount > 0 && (
                        <div className="d-flex justify-content-between mb-2">
                          <span style={{ color: '#6B7B5F', fontSize: '0.95rem' }}>Tax:</span>
                          <span style={{ color: '#2C5F2D', fontWeight: '500' }}>₹{order.tax_amount}</span>
                        </div>
                      )}
                      {order.shipping_cost > 0 && (
                        <div className="d-flex justify-content-between mb-3">
                          <span style={{ color: '#6B7B5F', fontSize: '0.95rem' }}>Shipping:</span>
                          <span style={{ color: '#2C5F2D', fontWeight: '500' }}>₹{order.shipping_cost}</span>
                        </div>
                      )}
                      <div 
                        className="d-flex justify-content-between pt-3"
                        style={{ borderTop: '2px solid #2C5F2D' }}
                      >
                        <strong style={{ color: '#2C5F2D', fontSize: '1.1rem' }}>Total:</strong>
                        <strong style={{ color: '#2C5F2D', fontSize: '1.3rem' }}>₹{order.total_amount}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery & Contact Information */}
            <div className="row g-3 mb-4">
              {/* Shipping Address */}
              <div className="col-md-6">
                <div 
                  className="p-3 rounded h-100"
                  style={{ backgroundColor: '#F8F6F1' }}
                >
                  <h6 className="mb-2 fw-bold" style={{ color: '#2C5F2D', fontSize: '0.95rem' }}>
                    <i className="bi bi-truck me-2" style={{ color: '#97C97D' }}></i>
                    Shipping Address
                  </h6>
                  <p className="mb-0" style={{ color: '#6B7B5F', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    {formatAddress(order.shipping_address)}
                  </p>
                </div>
              </div>

              {/* Billing Address */}
              <div className="col-md-6">
                <div 
                  className="p-3 rounded h-100"
                  style={{ backgroundColor: '#F8F6F1' }}
                >
                  <h6 className="mb-2 fw-bold" style={{ color: '#2C5F2D', fontSize: '0.95rem' }}>
                    <i className="bi bi-receipt me-2" style={{ color: '#97C97D' }}></i>
                    Billing Address
                  </h6>
                  <p className="mb-0" style={{ color: '#6B7B5F', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    {formatAddress(order.billing_address)}
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="col-md-6">
                <div 
                  className="p-3 rounded h-100"
                  style={{ backgroundColor: '#F8F6F1' }}
                >
                  <h6 className="mb-2 fw-bold" style={{ color: '#2C5F2D', fontSize: '0.95rem' }}>
                    <i className="bi bi-person-circle me-2" style={{ color: '#97C97D' }}></i>
                    Contact Information
                  </h6>
                  <div>
                    <small style={{ color: '#97C97D', fontWeight: '600', fontSize: '0.8rem' }}>Email:</small>
                    <p className="mb-2" style={{ color: '#2C5F2D', fontSize: '0.9rem' }}>{order.customer_email || 'N/A'}</p>
                    <small style={{ color: '#97C97D', fontWeight: '600', fontSize: '0.8rem' }}>Phone:</small>
                    <p className="mb-0" style={{ color: '#2C5F2D', fontSize: '0.9rem' }}>{order.customer_phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Tracking Information */}
              {order.tracking_number && (
                <div className="col-md-6">
                  <div 
                    className="p-3 rounded h-100"
                    style={{ backgroundColor: '#F8F6F1' }}
                  >
                    <h6 className="mb-2 fw-bold" style={{ color: '#2C5F2D', fontSize: '0.95rem' }}>
                      <i className="bi bi-box-seam me-2" style={{ color: '#97C97D' }}></i>
                      Tracking Information
                    </h6>
                    <div>
                      <small style={{ color: '#97C97D', fontWeight: '600', fontSize: '0.8rem' }}>Tracking Number:</small>
                      <p 
                        className="mb-2" 
                        style={{ 
                          color: '#2C5F2D',
                          fontFamily: 'monospace',
                          fontSize: '1rem',
                          fontWeight: '700'
                        }}
                      >
                        {order.tracking_number}
                      </p>
                      <small style={{ color: '#97C97D', fontWeight: '600', fontSize: '0.8rem' }}>Shipping Partner:</small>
                      <p className="mb-0" style={{ color: '#2C5F2D', fontSize: '0.9rem' }}>{order.shipping_partner || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {(order.payment_status === 'pending' || ['pending', 'confirmed', 'processing'].includes(order.status)) && (
              <div 
                className="p-4 rounded text-center"
                style={{ backgroundColor: '#F8F6F1' }}
              >
                <div className="d-flex gap-3 flex-wrap justify-content-center">
                  {order.payment_status === 'pending' && (
                    <button
                      className="btn fw-bold shadow-sm"
                      onClick={handlePayment}
                      disabled={loading}
                      style={{
                        backgroundColor: '#2C5F2D',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '1rem 2.5rem',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#1F4520';
                        e.target.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#2C5F2D';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      <i className="bi bi-credit-card me-2"></i>
                      Pay Now
                    </button>
                  )}
                  {['pending', 'confirmed', 'processing'].includes(order.status) && (
                    <button
                      className="btn fw-semibold shadow-sm"
                      onClick={() => setShowCancelModal(true)}
                      disabled={loading}
                      style={{
                        backgroundColor: 'transparent',
                        color: '#E85D75',
                        border: '2px solid #E85D75',
                        borderRadius: '12px',
                        padding: '1rem 2.5rem',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#E85D75';
                        e.target.style.color = '#FFFFFF';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#E85D75';
                      }}
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div 
          className="modal show d-block" 
          style={{ 
            backgroundColor: 'rgba(44, 95, 45, 0.4)',
            backdropFilter: 'blur(4px)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1050
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div 
              className="modal-content border-0 shadow-lg"
              style={{
                borderRadius: '20px',
                overflow: 'hidden'
              }}
            >
              <div 
                className="modal-header"
                style={{
                  background: 'linear-gradient(135deg, #FFE5EC 0%, #FFF0F3 100%)',
                  border: 'none',
                  padding: '1.5rem 2rem'
                }}
              >
                <h5 
                  className="modal-title fw-bold" 
                  style={{ 
                    color: '#E85D75',
                    fontSize: '1.5rem'
                  }}
                >
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Cancel Order
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCancelModal(false)}
                  style={{
                    filter: 'invert(0.4) sepia(1) saturate(5) hue-rotate(320deg)'
                  }}
                ></button>
              </div>
              <div 
                className="modal-body"
                style={{
                  padding: '2rem',
                  backgroundColor: '#FFFFFF'
                }}
              >
                <div 
                  className="alert border-0 mb-4"
                  style={{
                    backgroundColor: '#FFF9E5',
                    color: '#8B6914',
                    borderRadius: '12px',
                    padding: '1rem'
                  }}
                >
                  <i className="bi bi-info-circle me-2"></i>
                  <small>Are you sure you want to cancel this order? This action cannot be undone.</small>
                </div>

                <div className="mb-4">
                  <label 
                    className="form-label fw-semibold mb-2" 
                    style={{ 
                      color: '#2C5F2D',
                      fontSize: '0.95rem'
                    }}
                  >
                    Reason for Cancellation *
                  </label>
                  <select
                    className="form-select"
                    value={cancelData.reason}
                    onChange={(e) => setCancelData({ ...cancelData, reason: e.target.value })}
                    required
                    style={{
                      backgroundColor: '#F8F6F1',
                      border: '2px solid #E5E7EB',
                      borderRadius: '10px',
                      padding: '0.75rem',
                      color: '#2C5F2D',
                      fontSize: '0.95rem'
                    }}
                  >
                    <option value="">Select a reason</option>
                    <option value="changed_mind">Changed my mind</option>
                    <option value="delivery_delayed">Shipping delay</option>
                    <option value="wrong_item_ordered">Ordered wrong product</option>
                    <option value="better_price_elsewhere">Better Price elsewhere</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label 
                    className="form-label fw-semibold mb-2" 
                    style={{ 
                      color: '#2C5F2D',
                      fontSize: '0.95rem'
                    }}
                  >
                    Additional Comments
                  </label>
                  <textarea
                    className="form-control"
                    value={cancelData.comments}
                    onChange={(e) => setCancelData({ ...cancelData, comments: e.target.value })}
                    rows="3"
                    placeholder="Tell us more about your reason..."
                    style={{
                      backgroundColor: '#F8F6F1',
                      border: '2px solid #E5E7EB',
                      borderRadius: '10px',
                      padding: '0.75rem',
                      color: '#2C5F2D',
                      fontSize: '0.95rem',
                      resize: 'none'
                    }}
                  ></textarea>
                </div>
              </div>
              <div 
                className="modal-footer"
                style={{
                  backgroundColor: '#F8F6F1',
                  border: 'none',
                  padding: '1.5rem 2rem'
                }}
              >
                <button
                  type="button"
                  className="btn fw-semibold"
                  onClick={() => setShowCancelModal(false)}
                  disabled={isCancelling}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#6B7B5F',
                    border: '2px solid #E5E7EB',
                    borderRadius: '10px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isCancelling) e.target.style.backgroundColor = '#E5E7EB';
                  }}
                  onMouseLeave={(e) => {
                    if (!isCancelling) e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  className="btn fw-bold shadow-sm"
                  onClick={handleCancelOrder}
                  disabled={!cancelData.reason || isCancelling}
                  style={{
                    backgroundColor: (!cancelData.reason || isCancelling) ? '#E5E7EB' : '#E85D75',
                    color: (!cancelData.reason || isCancelling) ? '#9CA3AF' : '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    cursor: (!cancelData.reason || isCancelling) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (cancelData.reason && !isCancelling) {
                      e.target.style.backgroundColor = '#D14861';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (cancelData.reason && !isCancelling) {
                      e.target.style.backgroundColor = '#E85D75';
                    }
                  }}
                >
                  {isCancelling ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-x-circle me-2"></i>
                      Cancel Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsPage;