import { useNavigate } from 'react-router-dom';

const AboutUs = () => {
  const navigate = useNavigate();

  const developers = [
    {
      name: 'K Akhilesh',
      role: 'User and Support Management',
      linkedin: 'https://www.linkedin.com/in/k-akhilesh-276749281/',
      github: 'https://github.com/Akki2005'
    },
    {
      name: 'M Lakshya',
      role: 'Cart and Order Management',
      linkedin: 'https://www.linkedin.com/in/lakshya017/',
      github: 'https://github.com/Lakshya5071'
    },
    {
      name: 'Charan Gowda C M',
      role: 'Product and Inventory Management',
      linkedin: 'https://www.linkedin.com/in/charan-gowda-c-m-96393428a/',
      github: 'https://github.com/CharanGowdaCM'
    }
  ];

  return (
    <div style={{ backgroundColor: '#F5F1E8', minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* Hero Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #2C5F2D 0%, #1e4620 100%)',
        color: 'white',
        padding: '80px 0 60px'
      }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8 mx-auto text-center">
              <h1 className="display-4 fw-bold mb-3">
                <i className="bi bi-leaf me-3" style={{ color: '#97C97D' }}></i>
                About Bleaf
              </h1>
              <p className="lead mb-0" style={{ color: '#E5E7EB', fontSize: '1.2rem' }}>
                Nature knows the way — just bleaf, just believe.
              </p>
              <div style={{
                width: '100px',
                height: '3px',
                backgroundColor: '#97C97D',
                margin: '30px auto 0'
              }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-5">
        {/* About Us Content */}
        <div className="row mb-5">
          <div className="col-lg-10 mx-auto">
            <div className="card border-0" style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(44, 95, 45, 0.1)',
              overflow: 'hidden'
            }}>
              <div className="card-body p-5">
                <div className="row align-items-center mb-5">
                  <div className="col-md-3 text-center mb-4 mb-md-0">
                    <div style={{
                      width: '120px',
                      height: '120px',
                      background: 'linear-gradient(135deg, #66bb6a 0%, #81c784 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                      boxShadow: '0 8px 24px rgba(102, 187, 106, 0.3)'
                    }}>
                      <i className="bi bi-heart-fill" style={{ fontSize: '3rem', color: '#FFFFFF' }}></i>
                    </div>
                  </div>
                  <div className="col-md-9">
                    <h2 className="mb-3" style={{ 
                      color: '#2C5F2D', 
                      fontSize: '2.2rem',
                      fontWeight: '700',
                      letterSpacing: '-0.5px'
                    }}>
                      Our Story
                    </h2>
                    <p style={{ 
                      color: '#6B7B5F', 
                      fontSize: '1.05rem',
                      lineHeight: '1.8',
                      marginBottom: '0'
                    }}>
                      At Bleaf, we believe that nature holds the answers to many of the challenges we face today. 
                      Our name — a beautiful blend of <strong style={{ color: '#2C5F2D' }}>"believe"</strong> and <strong style={{ color: '#2C5F2D' }}>"leaf"</strong> — 
                      reflects our vision to inspire trust in the wisdom of the natural world.
                    </p>
                  </div>
                </div>

                <div style={{ 
                  height: '2px', 
                  background: 'linear-gradient(90deg, transparent, #c8e6c9, transparent)',
                  margin: '40px 0'
                }}></div>

                <div className="mb-4">
                  <h3 className="mb-4" style={{ 
                    color: '#2C5F2D', 
                    fontSize: '1.5rem',
                    fontWeight: '600'
                  }}>
                    <i className="bi bi-flower1 me-2" style={{ color: '#97C97D' }}></i>
                    Our Philosophy
                  </h3>
                  <p style={{ 
                    color: '#424242', 
                    fontSize: '1.05rem',
                    lineHeight: '1.8',
                    textAlign: 'justify'
                  }}>
                    Bleaf was born from the idea that every element of nature, from the smallest leaf to the mightiest tree, 
                    carries lessons of balance, growth, and renewal. We strive to rekindle that bond between people and the 
                    environment — reminding everyone that nature isn't separate from us, but a part of who we are. Through our 
                    work, we aim to promote mindful living, sustainability, and a deeper sense of harmony with the planet.
                  </p>
                </div>

                <div className="mb-4">
                  <h3 className="mb-4" style={{ 
                    color: '#2C5F2D', 
                    fontSize: '1.5rem',
                    fontWeight: '600'
                  }}>
                    <i className="bi bi-compass me-2" style={{ color: '#97C97D' }}></i>
                    Our Mission
                  </h3>
                  <p style={{ 
                    color: '#424242', 
                    fontSize: '1.05rem',
                    lineHeight: '1.8',
                    textAlign: 'justify'
                  }}>
                    In a world driven by speed and technology, Bleaf encourages slowing down, breathing deeply, and listening 
                    to the quiet guidance that nature offers. We're here to spread the message that when we connect with nature 
                    and believe in its way, we find not only solutions but also peace, purpose, and hope for a greener future.
                  </p>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)',
                  borderLeft: '4px solid #66bb6a',
                  padding: '25px',
                  borderRadius: '12px',
                  marginTop: '40px'
                }}>
                  <p style={{ 
                    color: '#2e7d32', 
                    fontSize: '1.15rem',
                    fontWeight: '600',
                    fontStyle: 'italic',
                    margin: 0,
                    textAlign: 'center'
                  }}>
                    <i className="bi bi-quote me-2"></i>
                    Nature knows the way — just bleaf, just believe.
                    <i className="bi bi-quote ms-2"></i>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Developers Section */}
        <div className="row">
          <div className="col-lg-10 mx-auto">
            <div className="text-center mb-5">
              <h2 className="fw-bold mb-3" style={{ 
                color: '#2C5F2D', 
                fontSize: '2.2rem',
                letterSpacing: '-0.5px'
              }}>
                <i className="bi bi-people-fill me-2" style={{ color: '#97C97D' }}></i>
                Meet Our Developers
              </h2>
              <p style={{ 
                color: '#6B7B5F', 
                fontSize: '1.05rem'
              }}>
                The talented team behind Bleaf
              </p>
              <div style={{
                width: '80px',
                height: '3px',
                backgroundColor: '#97C97D',
                margin: '20px auto 0'
              }}></div>
            </div>

            <div className="row g-4">
              {developers.map((dev, index) => (
                <div key={index} className="col-md-4">
                  <div 
                    className="card border-0 h-100"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      boxShadow: '0 4px 16px rgba(44, 95, 45, 0.08)',
                      transition: 'all 0.3s ease',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(44, 95, 45, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(44, 95, 45, 0.08)';
                    }}
                  >
                    <div style={{
                      background: 'linear-gradient(135deg, #66bb6a 0%, #81c784 100%)',
                      height: '120px',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        bottom: '-40px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '80px',
                        height: '80px',
                        background: '#FFFFFF',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        border: '4px solid #FFFFFF'
                      }}>
                        <i className="bi bi-person-circle" style={{ 
                          fontSize: '3rem', 
                          color: '#2C5F2D' 
                        }}></i>
                      </div>
                    </div>

                    <div className="card-body text-center" style={{ paddingTop: '60px', paddingBottom: '30px' }}>
                      <h5 className="fw-bold mb-2" style={{ 
                        color: '#2C5F2D',
                        fontSize: '1.25rem'
                      }}>
                        {dev.name}
                      </h5>
                      <p className="mb-4" style={{ 
                        color: '#6B7B5F',
                        fontSize: '0.95rem',
                        fontWeight: '500'
                      }}>
                        {dev.role}
                      </p>

                      <div className="d-flex justify-content-center gap-3">
                        <a
                          href={dev.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn"
                          style={{
                            width: '45px',
                            height: '45px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#0077B5',
                            color: '#FFFFFF',
                            border: 'none',
                            transition: 'all 0.3s ease',
                            fontSize: '1.2rem'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 119, 181, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <i className="bi bi-linkedin"></i>
                        </a>
                        <a
                          href={dev.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn"
                          style={{
                            width: '45px',
                            height: '45px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#24292e',
                            color: '#FFFFFF',
                            border: 'none',
                            transition: 'all 0.3s ease',
                            fontSize: '1.2rem'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(36, 41, 46, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <i className="bi bi-github"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Back to Home Button */}
        <div className="row mt-5">
          <div className="col-12 text-center">
            <button
              onClick={() => navigate('/')}
              className="btn fw-semibold"
              style={{
                background: 'linear-gradient(135deg, #66bb6a 0%, #81c784 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '25px',
                padding: '12px 40px',
                fontSize: '1rem',
                boxShadow: '0 4px 12px rgba(102, 187, 106, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 187, 106, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 187, 106, 0.3)';
              }}
            >
              <i className="bi bi-house-fill me-2"></i>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
