import { THEME_GRADIENTS } from '../constants';

interface ThemeSelectorProps {
  activeTheme: number;
  onThemeChange: (index: number) => void;
}

/**
 * Theme selector component
 * Displays color palette buttons for switching themes
 */
export function ThemeSelector({ activeTheme, onThemeChange }: ThemeSelectorProps) {
  return (
    <div className="theme-selector absolute top-5 right-5 p-2 flex gap-3 bg-black/30 backdrop-blur-md rounded-full border border-white/20 shadow-lg z-20">
      {THEME_GRADIENTS.map((gradient, index) => (
        <button
          key={index}
          className={`
            w-8 h-8 rounded-full border-2 cursor-pointer
            transition-all duration-200 ease-in-out
            hover:scale-110 hover:border-white/70
            focus:outline-none focus:ring-2 focus:ring-white/50
            ${
              activeTheme === index
                ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]'
                : 'border-white/30'
            }
          `}
          style={{ background: gradient }}
          onClick={() => onThemeChange(index)}
          aria-label={`Theme ${index + 1}`}
          aria-pressed={activeTheme === index}
        />
      ))}
    </div>
  );
}
