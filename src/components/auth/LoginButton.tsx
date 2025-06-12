import React from 'react';
import { useTranslation } from 'react-i18next';

const LoginButton: React.FC = () => {
  const { t, i18n } = useTranslation();

  const handleLogin = () => {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.NEXT_PUBLIC_MEDPLUM_CLIENT_ID!,
      redirect_uri: process.env.NEXT_PUBLIC_MEDPLUM_REDIRECT_URL!,
      scope: 'openid profile user/*.* launch/patient',
      // Optional: pass UI locale
      ui_locales: i18n.language,
    });
    window.location.href = `${process.env.NEXT_PUBLIC_MEDPLUM_AUTH_URL}?${params.toString()}`;
  };

  return (
    <button onClick={handleLogin} aria-label={t('auth.loginButtonAria')}>
      {t('auth.login')}
    </button>
  );
};

export default LoginButton;
