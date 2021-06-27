import React, { useContext } from 'react';
import { Theme, ThemeContext } from './App';

export default function ThemeSelect(): JSX.Element {
    const { theme, setTheme } = useContext(ThemeContext);

    return (
        <div>
            {Object.entries(Theme).map(([key, value]) => (
                <div key={key}>
                    <label>
                        <input
                            name="theme"
                            type="radio"
                            value={value}
                            checked={theme === value}
                            onChange={() => {
                                setTheme(value);
                            }}
                        />
                        {key}
                    </label>
                </div>
            ))}
        </div>
    );
}
