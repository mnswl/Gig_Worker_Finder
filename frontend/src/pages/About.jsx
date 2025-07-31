
import { useTranslation } from 'react-i18next';

function About() {
  const { t } = useTranslation();
  
  return (
    <div className="container mt-4" data-aos="fade-up" style={{ maxWidth: '800px' }}>
      <h1 className="mb-4 text-primary">{t('aboutTitle')}</h1>
      <p className="lead">{t('aboutIntro')}</p>
      <h2 className="h5 mt-4">{t('aboutStoryTitle')}</h2>
      <p>{t('aboutStory')}</p>
      <h2 className="h5 mt-4">{t('aboutWhatWeDoTitle')}</h2>
      <ul>
        <li>{t('aboutWWDPoint1')}</li>
        <li>{t('aboutWWDPoint2')}</li>
        <li>{t('aboutWWDPoint3')}</li>
      </ul>
      <h2 className="h5 mt-4">{t('aboutValuesTitle')}</h2>
      <ul>
        <li dangerouslySetInnerHTML={{__html: t('aboutValueTransparency')}} />
        <li dangerouslySetInnerHTML={{__html: t('aboutValueTrust')}} />
        <li dangerouslySetInnerHTML={{__html: t('aboutValueGrowth')}} />
      </ul>
      <h2 className="h5 mt-4">{t('aboutTeamTitle')}</h2>
      <p>{t('aboutTeamDesc')}</p>
    </div>
  );
}

export default About;
