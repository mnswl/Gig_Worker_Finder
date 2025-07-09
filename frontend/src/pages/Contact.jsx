import '../styles/Contact.css';

function Contact() {
  return (
    <div className="contact-wrapper container py-5" data-aos="fade-up" style={{maxWidth:800}}>
      <h1 className="mb-4 text-primary">Contact Us</h1>
      <p className="mb-4">Have a question, partnership idea or feedback? We’d love to hear from you. Reach us via any of the options below and our team will respond within 1 business day.</p>

      <div className="row gy-4">
        <div className="col-md-6">
          <div className="contact-card p-4 h-100 shadow-sm bg-white rounded" data-aos="zoom-in">
            <h5 className="fw-bold mb-2">General Enquiries</h5>
            <p className="mb-1"><strong>Email:</strong> <a href="mailto:hello@gigworkerfinder.com">hello@gigworkerfinder.com</a></p>
            <p className="mb-1"><strong>Phone:</strong> +1 (415) 555-1212</p>
            <p className="mb-0"><strong>Hours:</strong> Mon–Fri, 9:00-18:00 (PST)</p>
          </div>
        </div>
        <div className="col-md-6">
          <div className="contact-card p-4 h-100 shadow-sm bg-white rounded" data-aos="zoom-in">
            <h5 className="fw-bold mb-2">Support</h5>
            <p className="mb-1">For account issues, payments, or reporting a bug:</p>
            <p className="mb-1"><strong>Email:</strong> <a href="mailto:support@gigworkerfinder.com">support@gigworkerfinder.com</a></p>
            <p className="mb-0"><strong>Live Chat:</strong> Available inside the Dashboard</p>
          </div>
        </div>
        <div className="col-12">
          <div className="contact-card p-4 h-100 shadow-sm bg-white rounded" data-aos="zoom-in">
            <h5 className="fw-bold mb-2">Head Office</h5>
            <address className="mb-0">
              Gig Worker Finder Inc.<br/>
              123 Market Street, Suite 600<br/>
              San Francisco, CA 94103<br/>
              United States
            </address>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;
