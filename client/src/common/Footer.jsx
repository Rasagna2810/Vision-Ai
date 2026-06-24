import React from "react";
import "bootstrap-icons/font/bootstrap-icons.css";

function Footer() {
  return (
    <footer className="kk py-4 mt-5 border-top">
      <div className="container">
        <div className="row text-center text-md-start align-items-start">

          {/* Brand */}
          <div className="col-md-4 mb-3">
            <h5 className="fw-bold">YourBrand</h5>
            <p className="text-muted small mb-0">
              Empowering users with technology.<br />
              Stay connected for updates.
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-md-4 mb-3">
            <h6 className="fw-semibold">Quick Links</h6>
            <ul className="list-unstyled mt-2">
              <li className="mb-1">
                <a href="/contact" className="text-decoration-none text-muted footer-link">
                  Contact : xxxxxxx
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-decoration-none text-muted footer-link">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div className="col-md-4 mb-3">
            <h6 className="fw-semibold">Follow Us</h6>
            <div className="d-flex justify-content-center justify-content-md-start gap-3 mt-2">
              <a href="https://facebook.com" className="social-icon">
                <i className="bi bi-facebook"></i>
              </a>
              <a href="https://twitter.com" className="social-icon">
                <i className="bi bi-twitter"></i>
              </a>
              <a href="https://instagram.com" className="social-icon">
                <i className="bi bi-instagram"></i>
              </a>
              <a href="https://linkedin.com" className="social-icon">
                <i className="bi bi-linkedin"></i>
              </a>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="text-center mt-3 pt-3 border-top">
          <p className="mb-0 text-muted small">
            © {new Date().getFullYear()} YourBrand. All Rights Reserved.
          </p>
        </div>
      </div>

      {/* Inline styles (kept minimal on purpose) */}
      <style>{`
        .footer-link:hover {
          color: #667eea !important;
        }
        .social-icon {
          font-size: 1.2rem;
          color: #64748b;
          transition: color 0.2s ease, transform 0.2s ease;
        }
        .social-icon:hover {
          color: #667eea;
          transform: translateY(-2px);
        }
      `}</style>
    </footer>
  );
}

export default Footer;
