import React, { useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { PriceTags } from './pages/Settings/PriceTags';
import { ThemeProvider } from './theme/ThemeProvider';
import { ToastProvider } from './context/ToastContext';
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: ${({ theme }) => theme.colors.background};
  }

  #root {
    min-height: 100vh;
  }
`;

export function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <ThemeProvider>
      <ToastProvider>
        <GlobalStyle />
        {!loggedIn ? (
          <LoginPage onSuccess={() => setLoggedIn(true)} />
        ) : (
          <PriceTags />
        )}
      </ToastProvider>
    </ThemeProvider>
  );
}
