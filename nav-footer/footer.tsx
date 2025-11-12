import Link from 'next/link';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-brand">
                        <h3>DAT Healthcare</h3>
                        <p>Your health, our priority - Connecting patients with healthcare professionals</p>
                    </div>

                    <div className="footer-links">
                        <div className="footer-section">
                            <h4>Quick Links</h4>
                            <Link href="/" className="footer-link">Home</Link>
                            <Link href="/about" className="footer-link">About Us</Link>
                            <Link href="/services" className="footer-link">Services</Link>
                            <Link href="/contact" className="footer-link">Contact</Link>
                        </div>

                        <div className="footer-section">
                            <h4>For Patients</h4>
                            <Link href="/auth/register" className="footer-link">Register</Link>
                            <Link href="/book-appointment" className="footer-link">Book Appointment</Link>
                            <Link href="/find-doctors" className="footer-link">Find Doctors</Link>
                        </div>

                        <div className="footer-section">
                            <h4>For Doctors</h4>
                            <Link href="/auth/register" className="footer-link">Join as Doctor</Link>
                            <Link href="/doctor-benefits" className="footer-link">Benefits</Link>
                        </div>

                        <div className="footer-section">
                            <h4>Legal</h4>
                            <Link href="/privacy" className="footer-link">Privacy Policy</Link>
                            <Link href="/terms" className="footer-link">Terms of Service</Link>
                            <Link href="/cookies" className="footer-link">Cookie Policy</Link>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <div className="social-links">
                        <a href="#!" className="social-link">Facebook</a>
                        <a href="#!" className="social-link">Twitter</a>
                        <a href="#!" className="social-link">LinkedIn</a>
                        <a href="#!" className="social-link">Instagram</a>
                    </div>

                    <div className="text-center mt-1">
                        <p>&copy; 2026 TeleMed Telemedicine Platform. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;