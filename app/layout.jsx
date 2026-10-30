import '@fontsource/barlow-condensed/700.css';
import '@fontsource/barlow-condensed/800.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import './globals.css';
export const metadata = {
  title: { default: 'HackMatch — Good ideas need great teams.', template: '%s | HackMatch' },
  description:
    'Find complementary skills. Meet your next teammate. Build something worth staying up for.',
  icons: { icon: '/icon.svg' },
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
