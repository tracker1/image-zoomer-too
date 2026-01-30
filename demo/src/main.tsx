import React from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider, createTheme } from "@mantine/core";
import "@mantine/core/styles.css";
import { App } from "./App.tsx";

const theme = createTheme({
  fontFamily: "Inter, sans-serif",
});

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <MantineProvider theme={theme}>
        <App />
      </MantineProvider>
    </React.StrictMode>
  );
}
