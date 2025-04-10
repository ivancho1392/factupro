import { Montserrat } from 'next/font/google';
import { AppProvider } from './context';
import './styles/globals.css';
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingModal from './components/Loading';
import Menu from './components/AccountMenu';
import { Analytics } from "@vercel/analytics/react"

const montserrat = Montserrat({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={montserrat.className}>
        <AppProvider>
          <LoadingModal />
          <Menu />
          <Header />
          <main className="mt-[100px]">{children}</main>
        </AppProvider>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
