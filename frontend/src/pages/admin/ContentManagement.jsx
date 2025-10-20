import { useState, useEffect } from 'react';
import contentService from '../../services/contentService';

const ContentManagement = () => {
  const [activeTab, setActiveTab] = useState('blog');
  const [blogs, setBlogs] = useState([]);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'blog') fetchBlogs();
    else fetchGuides();
  }, [activeTab]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await contentService.listBlogPosts();
      setBlogs(response.posts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGuides = async () => {
    try {
      setLoading(true);
      const response = await contentService.listPlantGuides();
      setGuides(response.guides || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      if (type === 'blog') {
        await contentService.deleteBlogPost(id);
        fetchBlogs();
      } else {
        await contentService.deletePlantGuide(id);
        fetchGuides();
      }
    } catch (err) {
      alert('Failed to delete');
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-md-6">
          <h2>Content Management</h2>
          <p className="text-muted">Manage blog posts and plant care guides</p>
        </div>
        <div className="col-md-6 text-end">
          <button className="btn btn-success">
            <i className="bi bi-plus-circle me-2"></i>
            Create New
          </button>
        </div>
      </div>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'blog' ? 'active' : ''}`}
            onClick={() => setActiveTab('blog')}
          >
            Blog Posts
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'guides' ? 'active' : ''}`}
            onClick={() => setActiveTab('guides')}
          >
            Plant Care Guides
          </button>
        </li>
      </ul>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success"></div>
        </div>
      ) : (
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'blog' ? blogs : guides).length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4">No items found</td>
                    </tr>
                  ) : (
                    (activeTab === 'blog' ? blogs : guides).map((item) => (
                      <tr key={item.id}>
                        <td>{item.title}</td>
                        <td>{item.category || item.plant_type || 'N/A'}</td>
                        <td>
                          <span className={`badge ${item.is_published ? 'bg-success' : 'bg-warning'}`}>
                            {item.is_published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td>{new Date(item.created_at).toLocaleDateString()}</td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary me-2">
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(item.id, activeTab)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagement;