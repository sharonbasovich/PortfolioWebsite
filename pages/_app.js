import { ThemeProvider, useTheme } from "next-themes";
import { useEffect } from "react";
import "../styles/globals.css";

const App = ({ Component, pageProps }) => {
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    // Set the theme to light only if no theme is resolved.
    if (resolvedTheme === undefined) {
      setTheme("light");
    }
  }, [resolvedTheme, setTheme]);

  return (
    
      <Component {...pageProps} />
    
  );
};

export default App;

//<ThemeProvider attribute="class">