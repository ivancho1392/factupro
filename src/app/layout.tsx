import { Montserrat } from 'next/font/google';
import { AppProvider } from './context';
import './styles/globals.css';
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingModal from './components/Loading';

const montserrat = Montserrat({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={montserrat.className}>
        <AppProvider>
          <LoadingModal />
          <Header />
          <main className="mt-[90px]">{children}</main>
        </AppProvider>
        <Footer />
      </body>
    </html>
  );
}
