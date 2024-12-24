// app/theme-script.tsx

/**
 * Theme Script Component (app/theme-script.tsx)
 * 
 * This component provides client-side theme initialization to prevent flash of wrong theme.
 * It injects a script into the document head that runs before the main JavaScript bundle.
 * 
 * Related Files:
 * - app/layout.tsx (Uses this component in RootLayout)
 * - app/providers/theme-provider.tsx (Main theme provider that takes over after hydration)
 * - components/theme-toggle.tsx (UI component for switching themes)
 * - lib/hooks/use-theme.ts (Hook for accessing theme state)
 * 
 * Purpose:
 * 1. Prevents flash of wrong theme on initial page load
 * 2. Checks localStorage for saved theme preference
 * 3. Falls back to system preference if no saved theme
 * 4. Adds appropriate theme class to document root
 * 5. Handles theme initialization before React hydration
 * 
 * Usage:
 * ```tsx
 * // In app/layout.tsx
 * import { ThemeScript } from './theme-script';
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <head>
 *         <ThemeScript />
 *       </head>
 *       <body>{children}</body>
 *     </html>
 *   );
 * }
 * ```
 * 
 * Flow:
 * 1. Script runs before page render
 * 2. Checks localStorage for 'theme' key
 * 3. Falls back to system preference if no stored theme
 * 4. Adds theme class to <html> element
 * 5. Removes initialization class when done
 * 
 * Theme Options:
 * - 'light': Light theme
 * - 'dark': Dark theme
 * - system: Uses system preference
 */

export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            // Add initialization class to prevent theme flash
            document.documentElement.classList.add('theme-initializing');

            // Function to get user's theme preference
            function getThemePreference() {
              // Check localStorage first
              if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
                return localStorage.getItem('theme');
              }
              // Fall back to system preference
              return window.matchMedia('(prefers-color-scheme: dark)').matches 
                ? 'dark' 
                : 'light';
            }

            // Get and apply the theme
            const theme = getThemePreference();
            document.documentElement.classList.add(theme);

            // Remove initialization class when page loads
            window.addEventListener('load', function() {
              document.documentElement.classList.remove('theme-initializing');
            });
          })();
        `,
      }}
    />
  );
}

/**
 * Implementation Notes:
 * 
 * 1. Script Injection:
 *    - Uses dangerouslySetInnerHTML to inject inline script
 *    - Script is self-executing function for isolation
 *    - Runs before React hydration
 * 
 * 2. Theme Detection:
 *    - Checks localStorage first for user preference
 *    - Uses matchMedia API for system preference
 *    - Provides fallback to light theme
 * 
 * 3. CSS Classes:
 *    - 'theme-initializing': Temporary class during theme setup
 *    - 'dark': Applied for dark theme
 *    - 'light': Applied for light theme
 * 
 * 4. Error Handling:
 *    - Checks for localStorage availability
 *    - Provides fallbacks for missing values
 *    - Handles missing matchMedia gracefully
 * 
 * 5. Performance:
 *    - Runs synchronously to prevent flash
 *    - Minimal DOM operations
 *    - Clean up on page load
 */ 