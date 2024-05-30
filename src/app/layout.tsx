import React from 'react';
import './styles/globals.css';
import styles from './styles/layout.module.css';
import Image from 'next/image';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className={styles.container}>
          <div className={styles.header}>
            <Image src="/logo.png" alt="Company Logo" width={300} height={50} />
            <h1>FactuPro - Gestiona tu factura</h1>
          </div>
          <main className={styles.main}>{children}</main>
        </div>
      </body>
    </html>
  );
}