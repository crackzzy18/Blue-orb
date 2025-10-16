import { useTranslation } from '../utils/i18n';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-2xl font-bold">Blue Orb</h3>
            <p className="text-gray-400 mt-2">{t('footer.tagline')}</p>
          </div>

          <div className="text-center md:text-right">
            <p className="text-gray-400">
              © {new Date().getFullYear()} Blue Orb. {t('footer.rights')}.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
