import '../styles/Terms.css';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Terms() {
  const { t } = useTranslation();
  return (
    <div className="terms-wrapper container py-5" data-aos="fade-up" style={{maxWidth: 900}}>
      <h1 className="mb-4">{t('termsTitle')}</h1>

      <p className="mb-4 text-muted">{t('termsLastUpdated')}</p>

      <h2 className="h4 mt-4">{t('termsAcceptanceHeading')}</h2>
      <p>{t('termsAcceptanceText')}</p>

      <h2 className="h4 mt-4">{t('termsUseHeading')}</h2>
      <p>{t('termsUseText')}</p>

      <h2 className="h4 mt-4">{t('termsAccountHeading')}</h2>
      <p>{t('termsAccountText')}</p>

      <h2 className="h4 mt-4">{t('termsPaymentsHeading')}</h2>
      <p>{t('termsPaymentsText')}</p>

      <h2 className="h4 mt-4">{t('termsIPHeading')}</h2>
      <p>{t('termsIPText')}</p>

      <h2 className="h4 mt-4">{t('termsProhibitedHeading')}</h2>
      <ul>
        <li>{t('termsProhibited1')}</li>
        <li>{t('termsProhibited2')}</li>
        <li>{t('termsProhibited3')}</li>
        <li>{t('termsProhibited4')}</li>
      </ul>

      <h2 className="h4 mt-4">{t('termsTerminationHeading')}</h2>
      <p>{t('termsTerminationText')}</p>

      <h2 className="h4 mt-4">{t('termsDisclaimerHeading')}</h2>
      <p>{t('termsDisclaimerText')}</p>

      <h2 className="h4 mt-4">{t('termsPrivacyHeading')}</h2>
      <p>{t('termsPrivacyText')}</p>

      <h3 className="h5 mt-3">{t('termsInfoCollectHeading')}</h3>
      <ul>
        <li>{t('termsInfoCollect1')}</li>
        <li>{t('termsInfoCollect2')}</li>
        <li>{t('termsInfoCollect3')}</li>
      </ul>

      <h3 className="h5 mt-3">{t('termsInfoUseHeading')}</h3>
      <ul>
        <li>{t('termsInfoUse1')}</li>
        <li>{t('termsInfoUse2')}</li>
        <li>{t('termsInfoUse3')}</li>
        <li>{t('termsInfoUse4')}</li>
      </ul>

      <h3 className="h5 mt-3">{t('termsDataSecurityHeading')}</h3>
      <p>{t('termsDataSecurityText')}</p>

      <h3 className="h5 mt-3">{t('termsCookiesHeading')}</h3>
      <p>{t('termsCookiesText')}</p>

      <h3 className="h5 mt-3">{t('termsDataRetentionHeading')}</h3>
      <p>{t('termsDataRetentionText')}</p>

      <h3 className="h5 mt-3">{t('termsYourRightsHeading')}</h3>
      <p dangerouslySetInnerHTML={{ __html: t('termsYourRightsText') }}></p>

      <h2 className="h4 mt-4">{t('termsChangesHeading')}</h2>
      <p>{t('termsChangesText')}</p>

      <h2 className="h4 mt-4">{t('termsContactHeading')}</h2>
      <p dangerouslySetInnerHTML={{ __html: t('termsContactText') }}></p>

      <div className="mt-5">
        <Link to="/" className="btn btn-primary">{t('termsBackHome')}</Link>
      </div>
    </div>
  );
}

export default Terms;
