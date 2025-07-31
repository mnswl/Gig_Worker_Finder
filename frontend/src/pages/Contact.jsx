import '../styles/Contact.css';
import { useTranslation } from 'react-i18next';

function Contact() {
  const { t } = useTranslation();
  return (
    <div className="contact-wrapper container py-5" data-aos="fade-up" style={{maxWidth:800}}>
      <h1 className="mb-4 text-primary">{t('contactTitle')}</h1>
      <p className="mb-4">{t('contactIntro')}</p>

      <div className="row gy-4">
        <div className="col-md-6">
          <div className="contact-card p-4 h-100 shadow-sm bg-white rounded" data-aos="zoom-in">
            <h5 className="fw-bold mb-2">{t('contactGeneral')}</h5>
            <p className="mb-1"><strong>{t('contactEmail')}:</strong> <a href="mailto:hello@gigworkerfinder.com">hello@gigworkerfinder.com</a></p>
            <p className="mb-1"><strong>{t('contactPhone')}:</strong> +1 (415) 555-1212</p>
            <p className="mb-0"><strong>{t('contactHours')}:</strong> Mon–Fri, 9:00-18:00 (PST)</p>
          </div>
        </div>
        <div className="col-md-6">
          <div className="contact-card p-4 h-100 shadow-sm bg-white rounded" data-aos="zoom-in">
            <h5 className="fw-bold mb-2">{t('contactSupport')}</h5>
            <p className="mb-1">{t('contactSupportDesc')}</p>
            <p className="mb-1"><strong>{t('contactEmail')}:</strong> <a href="mailto:support@gigworkerfinder.com">support@gigworkerfinder.com</a></p>
             <p className="mb-0"><strong>{t('contactLiveChat')}:</strong> {t('contactLiveChatDesc')}</p>
          </div>
        </div>
        <div className="col-12">
          <div className="contact-card p-4 h-100 shadow-sm bg-white rounded" data-aos="zoom-in">
            <h5 className="fw-bold mb-2">{t('contactHeadOffice')}</h5>
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
