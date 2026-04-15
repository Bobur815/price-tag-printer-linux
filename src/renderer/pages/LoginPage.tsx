import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

interface Props {
  onSuccess: () => void;
}

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const LoginBox = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  padding: 40px;
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h2`
  margin-bottom: 24px;
  color: #333;
  text-align: center;
  font-size: 24px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  margin-bottom: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.3s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.p`
  color: #e74c3c;
  font-size: 14px;
  margin-bottom: 16px;
  text-align: center;
`;

const LanguageSelector = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
`;

const LanguageButton = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border: 1px solid ${props => props.$active ? '#667eea' : '#ddd'};
  background: ${props => props.$active ? '#667eea' : 'white'};
  color: ${props => props.$active ? 'white' : '#333'};
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;

  &:hover {
    border-color: #667eea;
  }
`;

const RememberRow = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #555;
  cursor: pointer;

  input[type='checkbox'] {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: #667eea;
  }
`;

const REMEMBER_KEY = 'rememberMe';
const SAVED_FIELDS_KEY = 'savedLoginFields';

export function LoginPage({ onSuccess }: Props) {
  const { t, i18n } = useTranslation();
  const [apiUrl, setApiUrl] = useState('');
  const [storeId, setStoreId] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const remembered = localStorage.getItem(REMEMBER_KEY) === 'true';
    setRememberMe(remembered);
    if (remembered) {
      try {
        const saved = JSON.parse(localStorage.getItem(SAVED_FIELDS_KEY) || '{}');
        if (saved.apiUrl) setApiUrl(saved.apiUrl);
        if (saved.storeId) setStoreId(saved.storeId);
        if (saved.phone) setPhone(saved.phone);
        if (saved.password) setPassword(saved.password);
      } catch {
        // ignore malformed data
      }
    }
  }, []);

  const handleLogin = async () => {
    if (!apiUrl || !phone || !password) {
      setError(t('common.fillAllFields', 'Please fill in all fields'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await window.electronAPI.auth.login(apiUrl, phone, password, storeId || undefined);

      localStorage.setItem(REMEMBER_KEY, String(rememberMe));
      if (rememberMe) {
        localStorage.setItem(SAVED_FIELDS_KEY, JSON.stringify({ apiUrl, storeId, phone, password }));
      } else {
        localStorage.removeItem(SAVED_FIELDS_KEY);
      }

      onSuccess();
    } catch (err) {
      console.error('Login error:', err);
      setError(t('common.loginFailed', 'Login failed. Check credentials and VPS URL.'));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <Container>
      <LoginBox>
        <LanguageSelector>
          <LanguageButton
            $active={i18n.language === 'ru'}
            onClick={() => changeLanguage('ru')}
          >
            Русский
          </LanguageButton>
          <LanguageButton
            $active={i18n.language === 'uz'}
            onClick={() => changeLanguage('uz')}
          >
            O'zbek
          </LanguageButton>
        </LanguageSelector>

        <Title>{t('common.priceTagPrinter', 'Price Tag Printer')}</Title>

        <Input
          type="text"
          placeholder={t('common.vpsApiUrl', 'VPS API URL')}
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />

        <Input
          type="text"
          placeholder={t('common.storeId', 'Store ID (leave empty for admin)')}
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />

        <Input
          type="text"
          placeholder={t('common.phone', 'Phone')}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />

        <Input
          type="password"
          placeholder={t('common.password', 'Password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />

        <RememberRow>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          {t('common.rememberMe', 'Remember me')}
        </RememberRow>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Button onClick={handleLogin} disabled={loading}>
          {loading ? t('common.loading', 'Loading...') : t('common.login', 'Login')}
        </Button>
      </LoginBox>
    </Container>
  );
}
