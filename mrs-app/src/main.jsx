import React from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import App from "./App";
import { ToastProvider } from "./providers/toastProvider";

const theme = createTheme({
  palette: { primary: { main: "#1976d2" } },
});

createRoot(document.getElementById("root")).render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <ToastProvider>
      <App />
    </ToastProvider>
  </ThemeProvider>
);
