import './globals.css';

export const metadata = {
  title: 'SmartERP — Multi-Tenant POS & Enterprise Resource Planning for SMEs',
  description: 'Integrated POS, Inventory, Baki/Khata Credit Ledger, Mobile Banking Finance, Light Production & HR/Payroll built specifically for SMEs.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

