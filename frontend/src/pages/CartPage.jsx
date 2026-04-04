/*
* Cart Page Component - Shows shopping cart items
* Author: Lakshya M
* Features: Cart display, quantity updates, checkout
*/

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CartService from '../services/cartService';
import { useAuth } from '../context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';

const CartPage = () => {
  const [cart, setCart] = useState({ items: [], totalItems: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated, navigate]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await CartService.getCart();
      if (response.success) {
        setCart(response.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (cartItemId, newQuantity) => {
    try {
      if (newQuantity < 1) return;
      const response = await CartService.updateCartItem(cartItemId, newQuantity);
      if (response.success) {
        fetchCart();
      }
    } catch (err) {
      setError(err.response.data.message || 'Failed to update quantity');
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    try {
      const response = await CartService.removeFromCart(cartItemId);
      if (response.success) {
        fetchCart();
      }
    } catch (err) {
      setError(err.message || 'Failed to remove item');
    }
  };

  const handleClearCart = async () => {
    try {
      const response = await CartService.clearCart();
      if (response.success) {
        fetchCart();
      }
    } catch (err) {
      setError(err.message || 'Failed to clear cart');
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
            Loading your cart...
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

  return (
    <div 
      className="min-vh-100" 
      style={{ backgroundColor: '#F5F1E8', paddingBottom: '3rem' }}
    >
      <div className="container py-5" style={{ maxWidth: '1200px' }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-5">
          <div>
            <h1 
              className="fw-bold mb-2" 
              style={{ 
                color: '#2C5F2D',
                fontSize: '2.5rem',
                letterSpacing: '-0.5px'
              }}
            >
              <i className="bi bi-cart3 me-3" style={{ color: '#97C97D' }}></i>
              Your Shopping Cart
            </h1>
            <p style={{ 
              color: '#6B7B5F', 
              fontSize: '1.1rem',
              marginLeft: '3.5rem'
            }}>
              Review your selected plants
            </p>
          </div>
          {cart.totalItems > 0 && (
            <button
              onClick={handleClearCart}
              className="btn fw-semibold"
              style={{
                backgroundColor: 'transparent',
                color: '#E85D75',
                border: '2px solid #E85D75',
                borderRadius: '10px',
                padding: '0.65rem 1.5rem',
                fontSize: '0.95rem',
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
              <i className="bi bi-trash me-2"></i>
              Clear Cart
            </button>
          )}
        </div>

        {cart.items.length === 0 ? (
          <div 
            className="card border-0 shadow-sm" 
            style={{ 
              borderRadius: '16px',
              backgroundColor: '#FFFFFF'
            }}
          >
            <div className="card-body text-center py-5">
              <div className="mb-4" style={{ fontSize: '5rem' }}>🪴</div>
              <h3 className="mb-3" style={{ color: '#2C5F2D', fontWeight: '600' }}>
                Your cart is empty
              </h3>
              <p className="mb-4" style={{ color: '#6B7B5F', fontSize: '1.05rem' }}>
                Add some beautiful plants to your collection!
              </p>
              <button
                onClick={() => navigate('/products')}
                className="btn fw-semibold"
                style={{
                  backgroundColor: '#2C5F2D',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '1rem 2.5rem',
                  fontSize: '1rem',
                  boxShadow: '0 4px 12px rgba(44, 95, 45, 0.2)'
                }}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="mb-4">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="card mb-3 border-0 shadow-sm"
                  style={{
                    borderRadius: '16px',
                    backgroundColor: '#FFFFFF',
                    overflow: 'hidden',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(44, 95, 45, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(44, 95, 45, 0.08)';
                  }}
                >
                  <div className="card-body p-4">
                    <div className="row align-items-center g-4">
                      {/* Product Info */}
                      <div className="col-md-5">
                        <div className="d-flex align-items-center">
                          <div className="position-relative me-4">
                            <div style={{
                              width: '100px',
                              height: '100px',
                              borderRadius: '12px',
                              overflow: 'hidden',
                              backgroundColor: '#F8F6F1',
                              border: '3px solid #E5E7EB'
                            }}>
                              <img
                                src={(() => {
                                  try {
                                    const parsed = JSON.parse(item.products.image_url);
                                    return parsed.image_url?.replace(/\/$/, '') || '';
                                  } catch (error) {
                                    return item.products.image_url?.replace(/\/$/, '') || '';
                                  }
                                })()}
                                alt={item.products.name}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            </div>
                            <span 
                              className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
                              style={{
                                fontSize: '0.75rem',
                                backgroundColor: '#2C5F2D',
                                color: '#FFFFFF',
                                padding: '0.4rem 0.6rem'
                              }}
                            >
                              {item.quantity}
                            </span>
                          </div>
                          <div>
                            <h5 
                              className="fw-bold mb-2" 
                              style={{ 
                                color: '#2C5F2D',
                                fontSize: '1.2rem'
                              }}
                            >
                              {item.products.name}
                            </h5>
                            <p className="mb-0" style={{ color: '#2C5F2D', fontWeight: '600' }}>
                              ₹{item.products.price.toFixed(2)} 
                              <small style={{ color: '#6B7B5F', fontWeight: '400' }}> each</small>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Quantity and Actions */}
                      <div className="col-md-7">
                        <div className="d-flex align-items-center justify-content-md-end gap-3 flex-wrap">
                          {/* Quantity Controls */}
                          <div 
                            className="btn-group" 
                            role="group" 
                            style={{
                              border: '2px solid #E5E7EB',
                              borderRadius: '10px',
                              overflow: 'hidden',
                              backgroundColor: '#F8F6F1'
                            }}
                          >
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="btn fw-bold"
                              style={{
                                color: '#2C5F2D',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderRight: '1px solid #E5E7EB',
                                padding: '0.5rem 1rem'
                              }}
                            >
                              <i className="bi bi-dash"></i>
                            </button>
                            <span 
                              className="btn fw-bold" 
                              style={{
                                color: '#2C5F2D',
                                backgroundColor: 'transparent',
                                border: 'none',
                                pointerEvents: 'none',
                                minWidth: '60px'
                              }}
                            >
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="btn fw-bold"
                              style={{
                                color: '#2C5F2D',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderLeft: '1px solid #E5E7EB',
                                padding: '0.5rem 1rem'
                              }}
                            >
                              <i className="bi bi-plus"></i>
                            </button>
                          </div>

                          {/* Item Total */}
                          <h5 
                            className="fw-bold mb-0" 
                            style={{
                              color: '#2C5F2D',
                              minWidth: '120px',
                              textAlign: 'right',
                              fontSize: '1.3rem'
                            }}
                          >
                            ₹{(item.products.price * item.quantity).toFixed(2)}
                          </h5>

                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="btn fw-semibold"
                            style={{
                              backgroundColor: 'transparent',
                              color: '#E85D75',
                              border: '2px solid #E85D75',
                              borderRadius: '10px',
                              padding: '0.5rem 1rem',
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
                            <i className="bi bi-trash me-2"></i>
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div 
              className="card border-0 shadow-lg"
              style={{
                borderRadius: '16px',
                backgroundColor: '#2C5F2D',
                color: '#FFFFFF',
                overflow: 'hidden'
              }}
            >
              <div className="card-body p-5">
                <div className="row align-items-center">
                  <div className="col-md-6 mb-3 mb-md-0">
                    <p 
                      className="mb-2" 
                      style={{ 
                        color: '#E5E7EB',
                        fontSize: '1.1rem'
                      }}
                    >
                      Total Items: <span className="fw-bold" style={{ color: '#FFFFFF' }}>{cart.totalItems}</span>
                    </p>
                    <h2 
                      className="fw-bold mb-0" 
                      style={{ 
                        fontSize: '2.5rem',
                        color: '#FFFFFF'
                      }}
                    >
                      ₹{cart.totalAmount.toFixed(2)}
                    </h2>
                    <small style={{ color: '#97C97D' }}>Exclusive of taxes</small>
                  </div>
                  <div className="col-md-6 text-md-end">
                    <button
                      onClick={() => navigate('/checkout')}
                      className="btn fw-bold shadow-lg"
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: '#2C5F2D',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '1rem 2.5rem',
                        fontSize: '1.1rem',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#F8F6F1';
                        e.target.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#FFFFFF';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      Proceed to Checkout
                      <i className="bi bi-arrow-right ms-2"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Continue Shopping Link */}
            <div className="text-center mt-4">
              <button
                onClick={() => navigate('/products')}
                className="btn btn-link fw-semibold"
                style={{
                  color: '#2C5F2D',
                  textDecoration: 'none',
                  fontSize: '1rem'
                }}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartPage;