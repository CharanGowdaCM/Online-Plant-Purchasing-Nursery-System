import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Alert } from 'react-bootstrap';
import api from '../../services/api';

const InventoryManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category_id: '',
    low_stock_threshold: '',
    image_url: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes, lowStockRes] = await Promise.all([
        api.get('/admin/inventory/products'),
        api.get('/admin/inventory/categories'),
        api.get('/admin/inventory/low-stock')
      ]);

      setProducts(productsRes.data.products);
      setCategories(categoriesRes.data.categories);
      setLowStockItems(lowStockRes.data.items);
    } catch (err) {
      setError('Failed to load inventory data');
      console.error('Inventory fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.post('/admin/inventory/addproduct', formData);
      if (response.data.success) {
        setProducts([...products, response.data.product]);
        setShowAddModal(false);
        setFormData({
          name: '',
          description: '',
          price: '',
          quantity: '',
          category_id: '',
          low_stock_threshold: '',
          image_url: ''
        });
      }
    } catch (err) {
      setError('Failed to add product');
      console.error('Add product error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (productId, newQuantity) => {
    try {
      setLoading(true);
      await api.patch(`/admin/inventory/products/${productId}/stock`, {
        quantity: newQuantity
      });
      fetchData(); // Refresh data
    } catch (err) {
      setError('Failed to update stock');
      console.error('Update stock error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading inventory...</div>;

  return (
    <div className="container-fluid p-4">
      <div className="row mb-4">
        <div className="col">
          <h2>Inventory Management</h2>
          {error && <Alert variant="danger">{error}</Alert>}
        </div>
        <div className="col text-end">
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            Add New Product
          </Button>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="alert alert-warning">
          <h5>Low Stock Alerts</h5>
          <ul>
            {lowStockItems.map(item => (
              <li key={item.id}>
                {item.name} - Current stock: {item.quantity}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Products Table */}
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              <td>{product.id}</td>
              <td>{product.name}</td>
              <td>{categories.find(c => c.id === product.category_id)?.name}</td>
              <td>{product.quantity}</td>
              <td>${product.price}</td>
              <td>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => handleUpdateStock(product.id, product.quantity + 1)}
                >
                  + Stock
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="ms-2"
                  onClick={() => handleUpdateStock(product.id, Math.max(0, product.quantity - 1))}
                >
                  - Stock
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Add Product Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddProduct}>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={formData.category_id}
                onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                required
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Price</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Initial Stock</Form.Label>
              <Form.Control
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Low Stock Threshold</Form.Label>
              <Form.Control
                type="number"
                value={formData.low_stock_threshold}
                onChange={(e) => setFormData({...formData, low_stock_threshold: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Image URL</Form.Label>
              <Form.Control
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({...formData, image_url: e.target.value})}
              />
            </Form.Group>

            <Button variant="primary" type="submit">
              Add Product
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default InventoryManagement;