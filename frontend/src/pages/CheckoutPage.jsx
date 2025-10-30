/**
 * Developer: M Lakshya
 * Features: Checkout, Cart, Address Management, Razorpay Integration, Payment Verification, 
 * Order Confirmation, Total Calculation, React Component, API Calls, State Management
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CartService from '../services/cartService';
import OrderServiceUser from '../services/orderServiceUser';
import PaymentService from '../services/paymentService';
import profileService from '../services/profileService';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [postPayProcessing, setPostPayProcessing] = useState(false);
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  });
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressOption, setAddressOption] = useState('saved');

  useEffect(() => {
    fetchCart();
    fetchUserProfile();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await CartService.getCart();
      if (response.success) {
        setCart(response.data);
      }
    } catch (err) {
      setError('Failed to fetch cart details');
    }
  };

  const fetchUserProfile = async () => {
    try {
      const data = await profileService.getProfile();
      if (data.profile.delivery_addresses) {
        setSavedAddresses(data.profile.delivery_addresses);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressSelect = (addr) => {
    setSelectedAddress(addr);
    setAddress(addr);
  };

  const handleAddressOptionChange = (option) => {
    setAddressOption(option);
    if (option === 'saved') {
      setAddress({
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
      });
    } else {
      setSelectedAddress(null);
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
      const formattedItems = cart.items.map(item => ({
        product_id: item.product_id,
        product_name: item.products?.name || '',
        quantity: item.quantity,
        price: item.products?.price ?? 0
      }));
      
      const profileData = await profileService.getProfile();
      const subtotal = formattedItems.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 0)), 0);
      const taxAmount = Number((subtotal * 0.05).toFixed(2));
      const finalAmount = Number((subtotal + taxAmount).toFixed(2));

      const orderResponse = await OrderServiceUser.createOrder({
        userId: user.id,
        items: formattedItems,
        address: selectedAddress || address,
        amount: finalAmount,
        type: 'cart',
        paymentDetails: {
          customer_email: user.email,
          customer_phone: profileData.profile.mobile_number,
          tax_amount: taxAmount,
        }
      });

      if (!orderResponse.success) {
        throw new Error(orderResponse.message);
      }

      const res = await initializeRazorpay();
      if (!res) {
        throw new Error('Razorpay SDK failed to load');
      }

      const paymentResponse = await PaymentService.initiatePayment(
        finalAmount,
        orderResponse.data.orderId
      );

      const options = {
        key: paymentResponse.data.key,
        amount: finalAmount * 100,
        currency: "INR",
        name: "Plant Nursery",
        description: "Plant Purchase Payment",
        order_id: paymentResponse.data.razorpayOrderId,
        handler: async (response) => {
          try {
            // Show a dedicated processing state after payment while verifying
            setPostPayProcessing(true);
            const verificationResponse = await PaymentService.verifyPayment(
              paymentResponse.data.razorpayOrderId,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            if (verificationResponse.success) {
              await OrderServiceUser.updateOrderPayment(
                orderResponse.data.orderId,
                { paymentId: response.razorpay_payment_id }
              );
              
              await CartService.clearCart();
              navigate(`/orders/${orderResponse.data.orderId}`);
            }
          } catch (err) {
            setError('Payment verification failed');
          } finally {
            setPostPayProcessing(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#2C5F2D",
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

  const isAddressValid = () => {
    if (addressOption === 'saved') {
      return selectedAddress !== null;
    } else {
      return address.street && address.city && address.state && address.postalCode;
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F5F1E8', minHeight: '100vh' }}>
        <div className="container py-5 d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
          <div className="text-center">
            <div className="spinner-border mb-3" role="status" style={{ 
              width: '4rem', 
              height: '4rem',
              color: '#2C5F2D',
              borderWidth: '0.3rem'
            }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p style={{ color: '#2C5F2D', fontWeight: '600', fontSize: '1.1rem' }}>
              Loading checkout...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (postPayProcessing) {
    return (
      <div style={{ backgroundColor: '#F5F1E8', minHeight: '100vh' }}>
        <div className="container py-5 d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
          <div className="text-center">
            <div className="spinner-border mb-3" role="status" style={{ 
              width: '4rem', 
              height: '4rem',
              color: '#2C5F2D',
              borderWidth: '0.3rem'
            }}>
              <span className="visually-hidden">Processing...</span>
            </div>
            <p style={{ color: '#2C5F2D', fontWeight: '600', fontSize: '1.1rem' }}>
              Finalizing your order...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: '#F5F1E8', minHeight: '100vh' }}>
        <div className="container py-5">
          <div className="alert border-0" style={{
            backgroundColor: '#FFF5F5',
            color: '#C53030',
            borderRadius: '12px',
            padding: '1.5rem'
          }}>
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div style={{ backgroundColor: '#F5F1E8', minHeight: '100vh' }}>
        <div className="container py-5 d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
          <div className="card border-0 shadow-sm text-center" style={{
            borderRadius: '16px',
            backgroundColor: '#FFFFFF',
            padding: '3rem',
            maxWidth: '500px'
          }}>
            <div style={{ fontSize: '4rem' }}>🛒</div>
            <h3 className="mt-3 mb-2" style={{ color: '#2C5F2D' }}>Your cart is empty</h3>
            <p style={{ color: '#6B7B5F' }}>Add items to proceed to checkout</p>
            <button
              onClick={() => navigate('/products')}
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
              Browse Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  const subtotalDisplay = cart.items.reduce((sum, item) => {
    const price = Number(item.products?.price ?? 0);
    const qty = Number(item.quantity ?? 0);
    return sum + (price * qty);
  }, 0);
  const taxDisplay = Number((subtotalDisplay * 0.05).toFixed(2));
  const totalWithTaxDisplay = Number((subtotalDisplay + taxDisplay).toFixed(2));

  return (
    <div style={{ backgroundColor: '#F5F1E8', minHeight: '100vh', paddingBottom: '3rem' }}>
      <div className="container py-5">
        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="fw-bold mb-2" style={{
            color: '#2C5F2D',
            fontSize: '2.5rem',
            letterSpacing: '-0.5px'
          }}>
            <i className="bi bi-credit-card me-3" style={{ color: '#97C97D' }}></i>
            Checkout
          </h1>
          <p style={{ color: '#6B7B5F', fontSize: '1.1rem' }}>
            Complete your order
          </p>
        </div>

        {/* Main Checkout Container - Centered with max-width */}
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Order Summary */}
          <div className="card border-0 shadow-sm mb-4" style={{
            borderRadius: '16px',
            backgroundColor: '#FFFFFF',
            overflow: 'hidden'
          }}>
            <div className="card-header" style={{
              backgroundColor: '#F8F6F1',
              border: 'none',
              padding: '1.5rem'
            }}>
              <h5 className="mb-0" style={{ color: '#2C5F2D', fontWeight: '600', fontSize: '1.2rem' }}>
                <i className="bi bi-cart-check me-2" style={{ color: '#97C97D' }}></i>
                Order Summary
              </h5>
            </div>
            <div className="card-body" style={{ padding: '1.5rem' }}>
              {/* Items List */}
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {cart.items.map((item) => (
                  <div key={item.id} className="d-flex justify-content-between align-items-center mb-3 pb-3" style={{
                    borderBottom: '1px solid #F8F6F1'
                  }}>
                    <div className="d-flex align-items-center">
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        backgroundColor: '#F8F6F1',
                        marginRight: '1rem',
                        border: '2px solid #E5E7EB'
                      }}>
                        <img
                          src={item.products.image_url}
                          alt={item.products.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      </div>
                      <div>
                        <h6 className="mb-1" style={{ color: '#2C5F2D', fontWeight: '600' }}>
                          {item.products.name}
                        </h6>
                        <small style={{ color: '#6B7B5F' }}>Quantity: {item.quantity}</small>
                      </div>
                    </div>
                    <span style={{ color: '#2C5F2D', fontWeight: '600', fontSize: '1.1rem' }}>
                      ₹{(item.products.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <hr style={{ borderColor: '#F8F6F1', margin: '1.5rem 0' }} />

              {/* Price Breakdown */}
              <div className="mb-2 d-flex justify-content-between" style={{ color: '#6B7B5F' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: '500' }}>₹{subtotalDisplay.toFixed(2)}</span>
              </div>
              <div className="mb-3 d-flex justify-content-between" style={{ color: '#6B7B5F' }}>
                <span>Tax (5%)</span>
                <span style={{ fontWeight: '500' }}>₹{taxDisplay.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between" style={{
                padding: '1rem',
                backgroundColor: '#F8F6F1',
                borderRadius: '10px'
              }}>
                <strong style={{ color: '#2C5F2D', fontSize: '1.2rem' }}>Total</strong>
                <strong style={{ color: '#2C5F2D', fontSize: '1.3rem' }}>₹{totalWithTaxDisplay.toFixed(2)}</strong>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="card border-0 shadow-sm mb-4" style={{
            borderRadius: '16px',
            backgroundColor: '#FFFFFF',
            overflow: 'hidden'
          }}>
            <div className="card-header" style={{
              backgroundColor: '#F8F6F1',
              border: 'none',
              padding: '1.5rem'
            }}>
              <h5 className="mb-0" style={{ color: '#2C5F2D', fontWeight: '600', fontSize: '1.2rem' }}>
                <i className="bi bi-geo-alt me-2" style={{ color: '#97C97D' }}></i>
                Delivery Address
              </h5>
            </div>
            <div className="card-body" style={{ padding: '1.5rem' }}>
              {/* Address Option Selection */}
              <div className="mb-4">
                <div className="form-check mb-3 p-3" style={{
                  backgroundColor: addressOption === 'saved' ? '#F8F6F1' : 'transparent',
                  borderRadius: '10px',
                  border: addressOption === 'saved' ? '2px solid #2C5F2D' : '2px solid #E5E7EB',
                  transition: 'all 0.3s ease'
                }}>
                  <input
                    type="radio"
                    className="form-check-input"
                    name="addressOption"
                    id="savedAddressOption"
                    checked={addressOption === 'saved'}
                    onChange={() => handleAddressOptionChange('saved')}
                    disabled={savedAddresses.length === 0}
                    style={{
                      cursor: savedAddresses.length === 0 ? 'not-allowed' : 'pointer'
                    }}
                  />
                  <label className="form-check-label" htmlFor="savedAddressOption" style={{
                    cursor: savedAddresses.length === 0 ? 'not-allowed' : 'pointer',
                    color: '#2C5F2D',
                    fontWeight: '600'
                  }}>
                    Use Saved Address
                    {savedAddresses.length === 0 && (
                      <span style={{ color: '#6B7B5F', fontWeight: '400' }}> (No saved addresses)</span>
                    )}
                  </label>
                </div>

                <div className="form-check p-3" style={{
                  backgroundColor: addressOption === 'new' ? '#F8F6F1' : 'transparent',
                  borderRadius: '10px',
                  border: addressOption === 'new' ? '2px solid #2C5F2D' : '2px solid #E5E7EB',
                  transition: 'all 0.3s ease'
                }}>
                  <input
                    type="radio"
                    className="form-check-input"
                    name="addressOption"
                    id="newAddressOption"
                    checked={addressOption === 'new'}
                    onChange={() => handleAddressOptionChange('new')}
                    style={{ cursor: 'pointer' }}
                  />
                  <label className="form-check-label" htmlFor="newAddressOption" style={{
                    cursor: 'pointer',
                    color: '#2C5F2D',
                    fontWeight: '600'
                  }}>
                    Enter New Address
                  </label>
                </div>
              </div>

              {/* Saved Addresses */}
              {addressOption === 'saved' && savedAddresses.length > 0 && (
                <div className="mb-3">
                  <h6 className="mb-" style={{ color: '#2C5F2D', fontWeight: '600', fontSize: '23px' }}>
                    Select an Address
                  </h6>
                  {savedAddresses.map((addr, index) => (
                    <div key={index} className="form-check mb-3 p-3" style={{
                      backgroundColor: selectedAddress === addr ? '#F8F6F1' : '#FFFFFF',
                      borderRadius: '10px',
                      border: selectedAddress === addr ? '2px solid #2C5F2D' : '2px solid #E5E7EB',
                      transition: 'all 0.3s ease'
                    }}>
                      <input
                        type="radio"
                        className="form-check-input"
                        name="savedAddress"
                        id={`address${index}`}
                        onChange={() => handleAddressSelect(addr)}
                        checked={selectedAddress === addr}
                        style={{ cursor: 'pointer' }}
                      />
                      <label className="form-check-label" htmlFor={`address${index}`} style={{
                        cursor: 'pointer',
                        color: '#2C5F2D'
                      }}>
                        <div style={{ fontWeight: '500' }}>
                          {addr.street}
                        </div>
                        <div style={{ color: '#6B7B5F', fontSize: '0.9rem' }}>
                          {addr.city}, {addr.state} {addr.postalCode}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {/* New Address Form */}
              {addressOption === 'new' && (
                <div>
                  <h6 className="mb-3" style={{ color: '#2C5F2D', fontWeight: '600' }}>
                    Enter New Address
                  </h6>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label" style={{ color: '#2C5F2D', fontWeight: '500', fontSize: '0.9rem' }}>
                        Street Address
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter street address"
                        name="street"
                        value={address.street}
                        onChange={handleAddressChange}
                        style={{
                          backgroundColor: '#F8F6F1',
                          border: '2px solid #E5E7EB',
                          borderRadius: '10px',
                          padding: '0.75rem',
                          color: '#2C5F2D'
                        }}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" style={{ color: '#2C5F2D', fontWeight: '500', fontSize: '0.9rem' }}>
                        City
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter city"
                        name="city"
                        value={address.city}
                        onChange={handleAddressChange}
                        style={{
                          backgroundColor: '#F8F6F1',
                          border: '2px solid #E5E7EB',
                          borderRadius: '10px',
                          padding: '0.75rem',
                          color: '#2C5F2D'
                        }}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" style={{ color: '#2C5F2D', fontWeight: '500', fontSize: '0.9rem' }}>
                        State
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter state"
                        name="state"
                        value={address.state}
                        onChange={handleAddressChange}
                        style={{
                          backgroundColor: '#F8F6F1',
                          border: '2px solid #E5E7EB',
                          borderRadius: '10px',
                          padding: '0.75rem',
                          color: '#2C5F2D'
                        }}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" style={{ color: '#2C5F2D', fontWeight: '500', fontSize: '0.9rem' }}>
                        Postal Code
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter postal code"
                        name="postalCode"
                        value={address.postalCode}
                        onChange={handleAddressChange}
                        style={{
                          backgroundColor: '#F8F6F1',
                          border: '2px solid #E5E7EB',
                          borderRadius: '10px',
                          padding: '0.75rem',
                          color: '#2C5F2D'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pay Now Button */}
          <button
            className="btn w-100 fw-bold shadow-lg"
            onClick={handlePayment}
            disabled={loading || !isAddressValid()}
            style={{
              backgroundColor: isAddressValid() && !loading ? '#2C5F2D' : '#E5E7EB',
              color: isAddressValid() && !loading ? '#FFFFFF' : '#9CA3AF',
              border: 'none',
              borderRadius: '12px',
              padding: '1.25rem',
              fontSize: '1.2rem',
              cursor: isAddressValid() && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (isAddressValid() && !loading) {
                e.target.style.backgroundColor = '#1F4520';
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (isAddressValid() && !loading) {
                e.target.style.backgroundColor = '#2C5F2D';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Processing...
              </>
            ) : (
              <>
                <i className="bi bi-lock-fill me-2"></i>
                Pay ₹{totalWithTaxDisplay.toFixed(2)} Securely
              </>
            )}
          </button>

          {/* Security Badge */}
          <div className="text-center mt-3">
            <small style={{ color: '#6B7B5F' }}>
              <i className="bi bi-shield-check me-1" style={{ color: '#97C97D' }}></i>
              Secure payment powered by Razorpay
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;