/**
 * Developer: K Akhilesh
 * Features: FAQ Page, React Component, Category Filter, Search Filter, Accordion Display, 
 * FAQ Service Integration, API Calls, Loading/Error Handling, Responsive Layout, 
 * Customer Support, Raise Ticket
 */


import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Accordion, Spinner, Alert } from 'react-bootstrap';
import faqService from '../services/faqService';

const FAQPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    search: ''
  });

  useEffect(() => {
    fetchCategories();
    fetchFAQs();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchFAQs();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const response = await faqService.getFAQCategories();
      if (response.success && response.categories) {
        setCategories(response.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchFAQs = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = {
        category: filters.category || undefined,
        search: filters.search || undefined,
        page: 1,
        limit: 100
      };

      const response = await faqService.getPublicFAQs(params);
      if (response.success && response.faqs) {
        setFaqs(response.faqs);
      } else {
        setFaqs([]);
      }
    } catch (err) {
      setError('Failed to load FAQs. Please try again later.');
      console.error('Error fetching FAQs:', err);
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({ category: '', search: '' });
  };

  // Group FAQs by category for better organization
  const groupedFaqs = faqs.reduce((acc, faq) => {
    const category = faq.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(faq);
    return acc;
  }, {});

  return (
    <div className="faq-page" style={{ backgroundColor: '#f8faf7', minHeight: '100vh', paddingTop: '80px' }}>
      <Container className="py-5">
        {/* Header */}
        <Row className="mb-5 text-center">
          <Col>
            <h1 className="display-4 fw-bold" style={{ color: '#2d5016' }}>
              <i className="bi bi-question-circle me-3"></i>
              Frequently Asked Questions
            </h1>
            <p className="lead text-muted">
              Find answers to common questions about our plants, care, shipping, and more.
            </p>
          </Col>
        </Row>

        {/* Filters */}
        <Row className="mb-4">
          <Col md={8} className="mx-auto">
            <div className="card shadow-sm border-0" style={{ borderRadius: '15px' }}>
              <div className="card-body p-4">
                <Row className="g-3">
                  <Col md={5}>
                    <Form.Control
                      type="text"
                      placeholder="Search FAQs..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="rounded-pill"
                    />
                  </Col>
                  <Col md={5}>
                    <Form.Select
                      value={filters.category}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                      className="rounded-pill"
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat, idx) => (
                        <option key={idx} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={2}>
                    {(filters.category || filters.search) && (
                      <button
                        className="btn btn-outline-secondary rounded-pill w-100"
                        onClick={handleClearFilters}
                      >
                        Clear
                      </button>
                    )}
                  </Col>
                </Row>
              </div>
            </div>
          </Col>
        </Row>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" style={{ color: '#2d5016' }} />
            <p className="mt-3 text-muted">Loading FAQs...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert variant="danger" className="text-center">
            {error}
          </Alert>
        )}

        {/* FAQs Display */}
        {!loading && !error && (
          <>
            {faqs.length === 0 ? (
              <Alert variant="info" className="text-center">
                <i className="bi bi-info-circle me-2"></i>
                No FAQs found. {filters.category || filters.search ? 'Try adjusting your filters.' : 'Check back soon!'}
              </Alert>
            ) : filters.category || filters.search ? (
              // Show flat list when filtering
              <Row>
                <Col md={10} className="mx-auto">
                  <Accordion defaultActiveKey="0" className="shadow-sm">
                    {faqs.map((faq, idx) => (
                      <Accordion.Item key={faq.id} eventKey={String(idx)}>
                        <Accordion.Header>
                          <div className="d-flex align-items-center w-100">
                            <span className="badge bg-secondary me-3">{faq.category}</span>
                            <strong>{faq.question}</strong>
                          </div>
                        </Accordion.Header>
                        <Accordion.Body>
                          <div style={{ whiteSpace: 'pre-wrap' }}>{faq.answer}</div>
                        </Accordion.Body>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                </Col>
              </Row>
            ) : (
              // Show grouped by category when not filtering
              Object.keys(groupedFaqs).sort().map((category, catIdx) => (
                <div key={catIdx} className="mb-5">
                  <Row>
                    <Col md={10} className="mx-auto">
                      <h3 className="mb-4" style={{ color: '#2d5016' }}>
                        <i className="bi bi-folder me-2"></i>
                        {category}
                      </h3>
                      <Accordion className="shadow-sm">
                        {groupedFaqs[category].map((faq, idx) => (
                          <Accordion.Item key={faq.id} eventKey={String(idx)}>
                            <Accordion.Header>
                              <strong>{faq.question}</strong>
                            </Accordion.Header>
                            <Accordion.Body>
                              <div style={{ whiteSpace: 'pre-wrap' }}>{faq.answer}</div>
                            </Accordion.Body>
                          </Accordion.Item>
                        ))}
                      </Accordion>
                    </Col>
                  </Row>
                </div>
              ))
            )}
          </>
        )}

        {/* Help Section */}
        {!loading && faqs.length > 0 && (
          <Row className="mt-5">
            <Col md={8} className="mx-auto">
              <div className="card border-0 shadow-sm" style={{ backgroundColor: '#e8f5e9', borderRadius: '15px' }}>
                <div className="card-body text-center p-4">
                  <h4 style={{ color: '#2d5016' }}>
                    <i className="bi bi-chat-dots me-2"></i>
                    Still have questions?
                  </h4>
                  <p className="text-muted mb-3">
                    Can't find what you're looking for? Our support team is here to help!
                  </p>
                  <a href="/tickets" className="btn btn-success rounded-pill px-4">
                    Raise a Ticket
                  </a>
                </div>
              </div>
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
};

export default FAQPage;
