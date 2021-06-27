import React, { Context, useEffect, useMemo, useState } from 'react';

import Header from './Header';
import SampleList from './SampleList';

type SearchContextValue = {
    query: string;
    setQuery(query: string): void;
};

export const SearchContext: Context<SearchContextValue> = React.createContext(
    // This will cause errors if no SearchContext.Provider is used, but that
    // should never happen. And I would prefer a hard error over it silently not
    // working any day.
    undefined as any,
);

function useSearchContextValue(): SearchContextValue {
    const [query, setQuery] = useState('');
    return useMemo(() => ({ query, setQuery }), [query, setQuery]);
}

export enum Theme {
    Default = 'default',
    Cirkeltrek = 'cirkeltrek',
}

type ThemeContextValue = {
    theme: Theme;
    setTheme(theme: Theme): void;
};

export const ThemeContext: Context<ThemeContextValue> = React.createContext(
    undefined as any,
);

function useThemeContextValue(): ThemeContextValue {
    const [theme, setTheme] = useState(Theme.Default);

    useEffect(() => {
        document.body.setAttribute('data-theme', theme);
    }, [theme]);

    return useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
}

export default function App() {
    const searchContext = useSearchContextValue();
    const themeContext = useThemeContextValue();

    return (
        <SearchContext.Provider value={searchContext}>
            <ThemeContext.Provider value={themeContext}>
                <Header />
                <SampleList />
            </ThemeContext.Provider>
        </SearchContext.Provider>
    );
}
