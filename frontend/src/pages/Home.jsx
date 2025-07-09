import '../styles/Home.css';
import { Link } from 'react-router-dom';
import { useRef } from 'react';
import useHeroAnimation from '../hooks/useHeroAnimation';
import { pulse } from '../utils/animations';
import MorphingBlob from '../components/MorphingBlob';
import useScrollReveal from '../hooks/useScrollReveal';
import useCountUp from '../hooks/useCountUp';
import useParallax from '../hooks/useParallax';
import useSmoothScrollAnimations from '../hooks/useSmoothScrollAnimations';

const avatar1 = 'https://i.pravatar.cc/120?img=1';
const avatar2 = 'https://i.pravatar.cc/120?img=2';
const avatar3 = 'https://i.pravatar.cc/120?img=3';
const avatar4 = 'https://i.pravatar.cc/120?img=4';
const avatar5 = 'https://i.pravatar.cc/120?img=5';

function Home() {
  const joinRef = useRef(null);
  useHeroAnimation();
  useScrollReveal();
  useCountUp();
  useParallax();
  useSmoothScrollAnimations();

  return (
    <>
      <section className="hero position-relative overflow-hidden" data-aos="fade-up">
        <MorphingBlob data-parallax data-speed="0.2" className="position-absolute top-0 start-50 translate-middle-x" />
        <MorphingBlob data-parallax data-speed="0.1" className="position-absolute top-50 start-0 translate-middle-y" />
        <div className="container hero-inner d-flex flex-column flex-md-row align-items-center">
          <Link to="/" className="mb-4 mb-md-0 me-md-5">
            <img src="/logo_2.jpg" alt="Gig Worker Finder" className="hero-img img-fluid" />
          </Link>
          <div className="text-center text-md-start">
            <h1>Find the Right Gig. <br/> Grow Your Career.</h1>
            <p>Browse thousands of flexible jobs and connect instantly with clients looking for talent like you.</p>
            <Link to="/register" ref={joinRef} onClick={() => pulse(joinRef.current)} className="btn join-btn">Join Now</Link>
          </div>
        </div>

        <div className="bubble b1"><img src={avatar1} alt="avatar" /></div>
        <div className="bubble b2"><img src={avatar2} alt="avatar" /></div>
        <div className="bubble b3"><img src={avatar3} alt="avatar" /></div>
        <div className="bubble b4"><img src={avatar4} alt="avatar" /></div>
        <div className="bubble b5"><img src={avatar5} alt="avatar" /></div>
      </section>

      {/* Features */}
      <section className="features py-5 bg-light" data-aos="fade-up" data-aos-duration="800" data-aos-delay="100">
        <div className="container">
          <h2 className="section-title text-center mb-5" data-aos="fade-up" data-aos-duration="800" data-aos-delay="200">Why Choose Gig Worker Finder?</h2>
          <div className="row text-center">
            <div className="col-md-4 mb-4" data-aos="fade-up" data-aos-duration="800" data-aos-delay="300">
              <div className="feature-card reveal p-4 h-100 shadow-sm bg-white rounded">
                <div className="icon-circle bg-primary text-white mb-3 mx-auto fs-3">💼</div>
                <h5 className="fw-bold mb-2">Diverse Opportunities</h5>
                <p className="text-muted mb-0">Thousands of gigs across design, tech, marketing, admin and more – updated daily.</p>
              </div>
            </div>
            <div className="col-md-4 mb-4" data-aos="fade-up" data-aos-duration="800" data-aos-delay="400">
              <div className="feature-card reveal p-4 h-100 shadow-sm bg-white rounded">
                <div className="icon-circle bg-success text-white mb-3 mx-auto fs-3">⚡️</div>
                <h5 className="fw-bold mb-2">Instant Connections</h5>
                <p className="text-muted mb-0">Chat with clients in real-time and get hired faster with our smart matching engine.</p>
              </div>
            </div>
            <div className="col-md-4 mb-4" data-aos="fade-up" data-aos-duration="800" data-aos-delay="500">
              <div className="feature-card reveal p-4 h-100 shadow-sm bg-white rounded">
                <div className="icon-circle bg-warning text-white mb-3 mx-auto fs-3">🔒</div>
                <h5 className="fw-bold mb-2">Secure & Transparent</h5>
                <p className="text-muted mb-0">Two-factor authentication and milestone payments keep your account and earnings safe.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how-it-works py-5" data-aos="fade-up" data-aos-duration="800" data-aos-delay="100">
        <div className="container">
          <h2 className="section-title text-center mb-5" data-aos="fade-up" data-aos-duration="800" data-aos-delay="200">How It Works</h2>
          <div className="row justify-content-center text-center gy-4">
            <div className="col-md-3 step" data-aos="fade-right" data-aos-duration="800" data-aos-delay="300">
              <div className="icon-circle bg-primary-subtle text-primary mb-3 fs-3">1</div>
              <h6 className="fw-bold mb-2">Create Your Profile</h6>
              <p className="text-muted">Sign up, verify your account and showcase your skills with a standout profile.</p>
            </div>
            <div className="col-md-3 step" data-aos="fade-up" data-aos-duration="800" data-aos-delay="400">
              <div className="icon-circle bg-primary-subtle text-primary mb-3 fs-3">2</div>
              <h6 className="fw-bold mb-2">Browse & Apply</h6>
              <p className="text-muted">Use advanced filters to discover gigs that fit your schedule and passion.</p>
            </div>
            <div className="col-md-3 step" data-aos="fade-left" data-aos-duration="800" data-aos-delay="500">
              <div className="icon-circle bg-primary-subtle text-primary mb-3 fs-3">3</div>
              <h6 className="fw-bold mb-2">Get Hired & Paid</h6>
              <p className="text-muted">Communicate seamlessly, deliver quality work and receive payments on time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats text-center py-5 bg-light" data-aos="fade-up" data-aos-duration="800" data-aos-delay="100">
        <div className="container">
          <div className="row gy-4">
            <div className="col-6 col-md-3" data-aos="fade-up" data-aos-duration="800" data-aos-delay="200">
              <h3 className="fw-bold">10k+</h3>
              <p className="text-muted mb-0">Gigs Posted</p>
            </div>
            <div className="col-6 col-md-3" data-aos="fade-up" data-aos-duration="800" data-aos-delay="300">
              <h3 className="fw-bold">4.5k</h3>
              <p className="text-muted mb-0">Active Freelancers</p>
            </div>
            <div className="col-6 col-md-3" data-aos="fade-up" data-aos-duration="800" data-aos-delay="400">
              <h3 className="fw-bold">2k+</h3>
              <p className="text-muted mb-0">Clients</p>
            </div>
            <div className="col-6 col-md-3" data-aos="fade-up" data-aos-duration="800" data-aos-delay="500">
              <h3 className="fw-bold">98%</h3>
              <p className="text-muted mb-0">Job Success</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="categories py-5" data-aos="fade-up">
        <div className="container">
          <h2 className="section-title text-center mb-5">Explore Popular Categories</h2>
          <div className="row g-4">
            <div className="col-md-4 col-lg-3">
              <div className="category-card reveal p-4 h-100 shadow-sm bg-white rounded" data-aos="fade-up">
                <div className="icon-circle bg-primary text-white mb-3 mx-auto fs-3">💻</div>
                <h5 className="fw-bold mb-2">Software Development</h5>
                <p className="text-muted mb-0">Full-stack developers, mobile apps, web development</p>
              </div>
            </div>
            <div className="col-md-4 col-lg-3">
              <div className="category-card reveal p-4 h-100 shadow-sm bg-white rounded" data-aos="fade-up">
                <div className="icon-circle bg-success text-white mb-3 mx-auto fs-3">🎨</div>
                <h5 className="fw-bold mb-2">Design & Creative</h5>
                <p className="text-muted mb-0">UI/UX, graphic design, video editing</p>
              </div>
            </div>
            <div className="col-md-4 col-lg-3">
              <div className="category-card reveal p-4 h-100 shadow-sm bg-white rounded" data-aos="fade-up">
                <div className="icon-circle bg-warning text-white mb-3 mx-auto fs-3">📊</div>
                <h5 className="fw-bold mb-2">Marketing & Sales</h5>
                <p className="text-muted mb-0">Digital marketing, SEO, content writing</p>
              </div>
            </div>
            <div className="col-md-4 col-lg-3">
              <div className="category-card reveal p-4 h-100 shadow-sm bg-white rounded" data-aos="fade-up">
                <div className="icon-circle bg-info text-white mb-3 mx-auto fs-3">📝</div>
                <h5 className="fw-bold mb-2">Writing & Translation</h5>
                <p className="text-muted mb-0">Technical writing, copywriting, translation</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials py-5" data-aos="fade-up" data-aos-duration="800" data-aos-delay="100">
        <div className="container">
          <h2 className="section-title text-center mb-5" data-aos="fade-up" data-aos-duration="800" data-aos-delay="200">Success Stories</h2>
          <div className="row gy-4">
            <div className="col-md-4" data-aos="fade-right" data-aos-duration="800" data-aos-delay="300">
              <div className="testimonial-card reveal p-4 bg-white shadow-sm h-100 rounded">
                <p className="mb-3 fst-italic">"I found my dream remote design job within a week!"</p>
                <div className="d-flex align-items-center">
                  <img src={avatar1} className="rounded-circle me-3" width="48" height="48" alt="Ayesha" />
                  <div>
                    <strong>Ayesha</strong><br/><small>UI/UX Designer</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4" data-aos="fade-up" data-aos-duration="800" data-aos-delay="400">
              <div className="testimonial-card reveal p-4 bg-white shadow-sm h-100 rounded">
                <p className="mb-3 fst-italic">"Hiring freelancers has never been this fast and hassle-free."</p>
                <div className="d-flex align-items-center">
                  <img src={avatar2} className="rounded-circle me-3" width="48" height="48" alt="Michael" />
                  <div>
                    <strong>Michael</strong><br/><small>Startup Founder</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4" data-aos="fade-left" data-aos-duration="800" data-aos-delay="500">
              <div className="testimonial-card reveal p-4 bg-white shadow-sm h-100 rounded">
                <p className="mb-3 fst-italic">"The milestone payment system keeps everything transparent and secure."</p>
                <div className="d-flex align-items-center">
                  <img src={avatar3} className="rounded-circle me-3" width="48" height="48" alt="Samantha" />
                  <div>
                    <strong>Samantha</strong><br/><small>Project Manager</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="pricing py-5" data-aos="fade-up">
        <div className="container">
          <h2 className="section-title text-center mb-5">Pricing Plans</h2>
          <div className="row g-4">
            <div className="col-md-6 col-lg-4">
              <div className="pricing-card reveal p-4 h-100 shadow-sm rounded" data-aos="fade-up">
                <h4 className="text-center mb-4">Basic</h4>
                <div className="price text-center mb-4">Free</div>
                <ul className="list-unstyled text-muted mb-4">
                  <li>✓ Unlimited Job Applications</li>
                  <li>✓ Basic Profile</li>
                  <li>✓ Standard Support</li>
                </ul>
                <Link to="/register" className="btn btn-outline-primary w-100">Get Started</Link>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="pricing-card reveal p-4 h-100 shadow-sm rounded bg-primary-subtle" data-aos="fade-up">
                <h4 className="text-center mb-4">Pro</h4>
                <div className="price text-center mb-4">$9.99/mo</div>
                <ul className="list-unstyled text-muted mb-4">
                  <li>✓ Everything in Basic</li>
                  <li>✓ Featured Profile</li>
                  <li>✓ Priority Support</li>
                  <li>✓ Analytics Dashboard</li>
                </ul>
                <Link to="/register" className="btn btn-primary w-100">Upgrade Now</Link>
              </div>
            </div>
            <div className="col-md-12 col-lg-4">
              <div className="pricing-card reveal p-4 h-100 shadow-sm rounded" data-aos="fade-up">
                <h4 className="text-center mb-4">Enterprise</h4>
                <div className="price text-center mb-4">Custom</div>
                <ul className="list-unstyled text-muted mb-4">
                  <li>✓ Everything in Pro</li>
                  <li>✓ Dedicated Account Manager</li>
                  <li>✓ Custom Solutions</li>
                  <li>✓ API Access</li>
                </ul>
                <Link to="/contact" className="btn btn-outline-primary w-100">Contact Us</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq py-5 bg-light" data-aos="fade-up">
        <div className="container">
          <h2 className="section-title text-center mb-5">Frequently Asked Questions</h2>
          <div className="row">
            <div className="col-lg-6 mb-4">
              <div className="faq-card reveal p-4 bg-white shadow-sm rounded" data-aos="fade-up">
                <h5 className="fw-bold mb-3">How do I create a profile?</h5>
                <p className="text-muted mb-0">Sign up, complete your profile with skills and experience, and upload a professional photo.</p>
              </div>
            </div>
            <div className="col-lg-6 mb-4">
              <div className="faq-card reveal p-4 bg-white shadow-sm rounded" data-aos="fade-up">
                <h5 className="fw-bold mb-3">How does payment work?</h5>
                <p className="text-muted mb-0">We use a secure milestone payment system. Clients release payments when work is completed.</p>
              </div>
            </div>
            <div className="col-lg-6 mb-4">
              <div className="faq-card reveal p-4 bg-white shadow-sm rounded" data-aos="fade-up">
                <h5 className="fw-bold mb-3">What happens if a client doesn't pay?</h5>
                <p className="text-muted mb-0">Our dispute resolution team helps mediate and ensures fair compensation.</p>
              </div>
            </div>
            <div className="col-lg-6 mb-4">
              <div className="faq-card reveal p-4 bg-white shadow-sm rounded" data-aos="fade-up">
                <h5 className="fw-bold mb-3">How do I find gigs?</h5>
                <p className="text-muted mb-0">Use our advanced filters to find gigs that match your skills and availability.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="contact py-5" data-aos="fade-up">
        <div className="container">
          <h2 className="section-title text-center mb-5">Get in Touch</h2>
          <div className="row justify-content-center">
            <div className="col-md-8">
              <form className="reveal bg-white shadow-sm rounded p-4" data-aos="fade-up">
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Your Name</label>
                  <input type="text" className="form-control" id="name" required />
                </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input type="email" className="form-control" id="email" required />
                </div>
                <div className="mb-3">
                  <label htmlFor="message" className="form-label">Message</label>
                  <textarea className="form-control" id="message" rows="5" required></textarea>
                </div>
                <button type="submit" className="btn btn-primary w-100">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer py-4 text-center">
        <div className="container">
          <p className="mb-1">&copy; 2025 Gig Worker Finder. All rights reserved.</p>
          <div>
            <Link to="/terms" className="text-decoration-none me-3 text-light">Terms &amp; Privacy</Link>
            <Link to="/contact" className="text-decoration-none text-light">Contact</Link>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Home;
