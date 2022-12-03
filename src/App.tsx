import { useEffect, useMemo, useState } from 'react';
import { Sun, Moon } from 'react-feather';
import './App.css';
import ThemeContext, { Theme } from './context/ThemeContext';
import Puzzle from './pages/Puzzle';

const getPreferredColorScheme = () => {
  const providedTheme = localStorage.getItem('theme');
  if (providedTheme === 'dark' || providedTheme === 'light') {
    return providedTheme;
  }

  if (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark';
  }
  return 'light';
};

function App() {
  const [theme, setTheme] = useState<Theme>(getPreferredColorScheme());

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('theme-dark');
    } else {
      document.body.classList.remove('theme-dark');
    }
  });

  const themeContextValue = useMemo(() => ({ theme, setTheme }), [theme]);

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <div className={theme === 'dark' ? 'theme-dark' : ''}>
        <div className="container">
          <div className="theme-control">
            <button
              className="btn-text theme-toggle"
              onClick={() => {
                if (theme === 'dark') {
                  setTheme('light');
                  localStorage.setItem('theme', 'light');
                } else if (theme === 'light') {
                  setTheme('dark');
                  localStorage.setItem('theme', 'dark');
                }
              }}
            >
              {theme === 'dark' ? (
                <Sun size={24} fill="currentColor" />
              ) : (
                <Moon
                  size={24}
                  fill="var(--light-gray)"
                  stroke="var(--light-gray)"
                />
              )}
            </button>
          </div>
          <Puzzle />
        </div>
      </div>
    </ThemeContext.Provider>
  );
}

export default App;
