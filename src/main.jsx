import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { FeedbackProvider } from "./components/FeedbackProvider.jsx";
import { ToastProvider } from "./components/ToastProvider.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { FavoritesProvider } from "./context/FavoritesContext.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { cleanupServiceWorkersAndCaches } from "./utils/disableServiceWorker.js";
import "./i18n";
import "./styles.css";

// Remove legacy workers once, then cache public image requests for later visits.
const prepareImageCache = async () => {
  await cleanupServiceWorkersAndCaches();
  if (import.meta.env.PROD && "serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("/image-cache-sw.js", { scope: "/" });
    } catch (error) {
      console.warn("[image-cache] registration failed", error);
    }
  }
};

if (typeof window.requestIdleCallback === "function") {
  window.requestIdleCallback(() => void prepareImageCache(), { timeout: 3000 });
} else {
  window.setTimeout(() => void prepareImageCache(), 1500);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <FavoritesProvider>
              <ToastProvider>
                <FeedbackProvider>
                  <App />
                </FeedbackProvider>
              </ToastProvider>
            </FavoritesProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
