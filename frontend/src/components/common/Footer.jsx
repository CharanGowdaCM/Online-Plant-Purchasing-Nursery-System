import { APP_NAME } from '../../utils/constants';

const Footer = () => {
  return (
    <footer className="bg-dark text-white mt-5">
      <div className="container py-5">
        <div className="row">
          <div className="col-md-4 mb-4">
            <h5 className="mb-3">
              <i className="bi bi-flower1 me-2"></i>
              {APP_NAME}
            </h5>
            <p className="text-muted">
              Your trusted online plant nursery. We bring nature to your doorstep with
              a wide variety of healthy plants and expert care advice.
            </p>
            <div className="d-flex gap-3">
              <a href="#" className="text-white">
                <i className="bi bi-facebook fs-4"></i>
              </a>
              <a href="#" className="text-white">
                <i className="bi bi-instagram fs-4"></i>
              </a>
              <a href="#" className="text-white">
                <i className="bi bi-twitter fs-4"></i>
              </a>
              <a href="#" className="text-white">
                <i className="bi bi-youtube fs-4"></i>
              </a>
            </div>
          </div>

          <div className="col-md-2 mb-4">
            <h6 className="mb-3">Quick Links</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a href="/about" className="text-muted text-decoration-none">About Us</a>
              </li>
              <li className="mb-2">
                <a href="/plants" className="text-muted text-decoration-none">Shop Plants</a>
              </li>
              <li className="mb-2">
                <a href="/care-guides" className="text-muted text-decoration-none">Care Guides</a>
              </li>
              <li className="mb-2">
                <a href="/blog" className="text-muted text-decoration-none">Blog</a>
              </li>
            </ul>
          </div>

          <div className="col-md-3 mb-4">
            <h6 className="mb-3">Customer Service</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a href="/contact" className="text-muted text-decoration-none">Contact Us</a>
              </li>
              <li className="mb-2">
                <a href="/faq" className="text-muted text-decoration-none">FAQ</a>
              </li>
              <li className="mb-2">
                <a href="/shipping" className="text-muted text-decoration-none">Shipping Info</a>
              </li>
              <li className="mb-2">
                <a href="/returns" className="text-muted text-decoration-none">Returns Policy</a>
              </li>
            </ul>
          </div>

          <div className="col-md-3 mb-4">
            <h6 className="mb-3">Contact Info</h6>
            <ul className="list-unstyled text-muted">
              <li className="mb-2">
                <i className="bi bi-geo-alt me-2"></i>
                123 Green Street, Plant City
              </li>
              <li className="mb-2">
                <i className="bi bi-telephone me-2"></i>
                +1 234 567 8900
              </li>
              <li className="mb-2">
                <i className="bi bi-envelope me-2"></i>
                support@plantnursery.com
              </li>
              <li className="mb-2">
                <i className="bi bi-clock me-2"></i>
                Mon - Sat: 9AM - 6PM
              </li>
            </ul>
          </div>
        </div>

        <hr className="border-secondary my-4" />

        <div className="row">
          <div className="col-md-6 text-center text-md-start">
            <p className="text-muted mb-0">
              © 2025 {APP_NAME}. All rights reserved.
            </p>
          </div>
          <div className="col-md-6 text-center text-md-end">
            <a href="/privacy" className="text-muted text-decoration-none me-3">
              Privacy Policy
            </a>
            <a href="/terms" className="text-muted text-decoration-none">
              Terms & Conditions
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;