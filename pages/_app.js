/* eslint-disable quotes */
import Script from "next/script";
import { ThemeProvider } from "next-themes";

import { Navbar, Footer } from "../components";
import "../styles/globals.css";

const MyApp = ({ Component, pageProps }) => (
  <ThemeProvider attribute="class">
    <div className="dark:bg-nft-dark bg-white min-h-screen">
      <Navbar />
      <Component {...pageProps} />
      <Footer />
    </div>

    <Script
      src="https://kit.fontawesome.com/0c7e264496.js"
      crossOrigin="anonymous"
    />
  </ThemeProvider>
);

export default MyApp;
