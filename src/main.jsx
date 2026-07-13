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

void cleanupServiceWorkersAndCaches();

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
