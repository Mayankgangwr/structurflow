import React from "react";
import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import StoreProvider from "@/store/StoreProvider";
import { Toaster } from "react-hot-toast";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const inter = Inter({ weight: "400", subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'StructurFlow | AI Document Processing',
  description: 'Turn unstructured documents into structured business data.',
};

const RootLayout: React.FC<LayoutProps<"/">> = ({ children }) => {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${inter.className} h-full bg-slate-50 text-slate-900 antialiased`}>
        <StoreProvider>
          {children}
          <Toaster position="top-right" />
        </StoreProvider>
      </body>
    </html>
  );
}

export default RootLayout;
