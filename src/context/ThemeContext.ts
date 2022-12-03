import React from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextState {
  theme: Theme;
  setTheme: (newTheme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextState>({
  theme: 'dark',
  setTheme: () => null,
});

export default ThemeContext;
