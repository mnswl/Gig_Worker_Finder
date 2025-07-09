import '../styles/Terms.css';
import { Link } from 'react-router-dom';

function Terms() {
  return (
    <div className="terms-wrapper container py-5" data-aos="fade-up" style={{maxWidth: 900}}>
      <h1 className="mb-4">Terms & Privacy</h1>

      <p className="mb-4 text-muted">Last updated: 06 July 2025</p>

      <h2 className="h4 mt-4">1. Acceptance of Terms</h2>
      <p>By accessing or using the Gig Worker Finder platform (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service.</p>

      <h2 className="h4 mt-4">2. Use of the Service</h2>
      <p>You represent that you are at least 18 years old and have the legal capacity to enter into a binding agreement. You agree to use the Service only for lawful purposes and in accordance with these Terms.</p>

      <h2 className="h4 mt-4">3. Account Registration & Security</h2>
      <p>You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your credentials and all activities that occur under your account. Enable two-factor authentication (2FA) for additional security.</p>

      <h2 className="h4 mt-4">4. Payments & Fees</h2>
      <p>Clients agree to fund project milestones in advance. Freelancers will receive payments automatically upon milestone approval. All transactions are processed via our secure payment partners; we do not store your full card details.</p>

      <h2 className="h4 mt-4">5. Intellectual Property</h2>
      <p>Content posted by users remains their intellectual property. By posting content, you grant us a non-exclusive, worldwide, royalty-free licence to use, display and distribute such content solely for operating and promoting the Service.</p>

      <h2 className="h4 mt-4">6. Prohibited Conduct</h2>
      <ul>
        <li>Posting false, misleading or fraudulent content.</li>
        <li>Harassing or discriminating against other users.</li>
        <li>Uploading malware or attempting to gain unauthorised access to the Service.</li>
        <li>Violating any applicable laws or regulations.</li>
      </ul>

      <h2 className="h4 mt-4">7. Termination</h2>
      <p>We may suspend or terminate your account if you violate these Terms or pose a risk to other users.</p>

      <h2 className="h4 mt-4">8. Disclaimer</h2>
      <p>The Service is provided on an "as-is" basis without warranties of any kind. We disclaim all liability for any damages arising from your use of the Service.</p>

      <h2 className="h4 mt-4">9. Privacy Policy</h2>
      <p>Your privacy is important to us. This section explains how we collect, use and protect your personal information.</p>

      <h3 className="h5 mt-3">9.1 Information We Collect</h3>
      <ul>
        <li>Account data: name, email, phone, country & currency.</li>
        <li>Usage data: log files, IP address, browser type, pages visited.</li>
        <li>Payment data: provided to our payment processors, not stored by us.</li>
      </ul>

      <h3 className="h5 mt-3">9.2 How We Use Information</h3>
      <ul>
        <li>To provide and maintain the Service.</li>
        <li>To facilitate payments between clients and freelancers.</li>
        <li>To send transactional emails and security alerts (e.g. OTP codes).</li>
        <li>To improve our platform and develop new features.</li>
      </ul>

      <h3 className="h5 mt-3">9.3 Data Security</h3>
      <p>We implement industry-standard safeguards including encryption, two-factor authentication and regular security audits.</p>

      <h3 className="h5 mt-3">9.4 Cookies</h3>
      <p>We use cookies to keep you signed in, remember preferences and gather analytics. You can disable cookies in your browser but some features may not function.</p>

      <h3 className="h5 mt-3">9.5 Data Retention</h3>
      <p>We retain your personal data only as long as necessary for the purposes outlined above or as required by law.</p>

      <h3 className="h5 mt-3">9.6 Your Rights</h3>
      <p>Depending on your jurisdiction, you may have the right to access, correct or delete your personal data. Contact <a href="mailto:support@gigworkerfinder.com">support@gigworkerfinder.com</a> to exercise these rights.</p>

      <h2 className="h4 mt-4">10. Changes to These Terms & Privacy</h2>
      <p>We may update these Terms from time to time. We will notify you of significant changes by email or through the Service.</p>

      <h2 className="h4 mt-4">11. Contact Us</h2>
      <p>If you have any questions about these Terms or our Privacy practices, please contact us at <a href="mailto:legal@gigworkerfinder.com">legal@gigworkerfinder.com</a>.</p>

      <div className="mt-5">
        <Link to="/" className="btn btn-primary">Back to Home</Link>
      </div>
    </div>
  );
}

export default Terms;
