// app/theme-script.tsx

export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            document.documentElement.classList.add('theme-initializing');
            function getThemePreference() {
              if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
                return localStorage.getItem('theme');
              }
              return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            const theme = getThemePreference();
            document.documentElement.classList.add(theme);
            window.addEventListener('load', function() {
              document.documentElement.classList.remove('theme-initializing');
            });
          })();
        `,
      }}
    />
  );
} 