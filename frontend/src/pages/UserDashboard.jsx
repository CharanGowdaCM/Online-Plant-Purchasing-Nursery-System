import React, { useState, useEffect } from 'react';
import { Card, Row, Col, ListGroup, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const UserDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [ordersRes, viewedRes] = await Promise.all([
        api.get('/orders/my-orders'),
        api.get('/users/recently-viewed')
      ]);

      setOrders(ordersRes.data.orders);
      setRecentlyViewed(viewedRes.data.products);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container py-4">
      {/* Welcome Section */}
      <Row className="mb-4">
        <Col>
          <h2>Welcome, {user?.profile?.first_name || 'User'}!</h2>
          <p>Here's what's happening with your account</p>
        </Col>
      </Row>

      <Row>
        {/* Recent Orders */}
        <Col md={8} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Recent Orders</h5>
            </Card.Header>
            <Card.Body>
              {orders.length === 0 ? (
                <p>No orders yet</p>
              ) : (
                <ListGroup variant="flush">
                  {orders.slice(0, 5).map(order => (
                    <ListGroup.Item key={order.id}>
                      <Row className="align-items-center">
                        <Col xs={3}>
                          <small className="text-muted">#{order.id}</small>
                        </Col>
                        <Col xs={5}>
                          <div>{new Date(order.created_at).toLocaleDateString()}</div>
                          <small className="text-muted">{order.items.length} items</small>
                        </Col>
                        <Col xs={4} className="text-end">
                          <Badge bg={getStatusBadgeVariant(order.status)}>
                            {order.status}
                          </Badge>
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Recently Viewed */}
        <Col md={4} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Recently Viewed</h5>
            </Card.Header>
            <Card.Body>
              {recentlyViewed.length === 0 ? (
                <p>No products viewed yet</p>
              ) : (
                <ListGroup variant="flush">
                  {recentlyViewed.slice(0, 5).map(product => (
                    <ListGroup.Item key={product.id}>
                      <div>{product.name}</div>
                      <small className="text-muted">${product.price}</small>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="mt-4">
        <Col md={4} className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <h5>My Profile</h5>
              <p>Update your personal information and preferences</p>
              <Card.Link href="/profile">View Profile</Card.Link>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <h5>My Orders</h5>
              <p>Track your orders and view order history</p>
              <Card.Link href="/orders">View Orders</Card.Link>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <h5>Support</h5>
              <p>Need help? Contact our customer support</p>
              <Card.Link href="/support">Get Help</Card.Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserDashboard;