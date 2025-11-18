"use client";

import { useEffect, useState } from "react";
import { ToastContainer as ReactToastifyContainer } from "react-toastify";
import { useTheme } from "next-themes";

export function ToastContainer() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine current theme
  const currentTheme = theme === "system" ? systemTheme : theme;
  const toastTheme = currentTheme === "dark" ? "dark" : "light";

  if (!mounted) {
    return null;
  }

  return (
    <ReactToastifyContainer
      position="top-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={toastTheme}
      className="toast-container"
      toastClassName="toast-notification"
      bodyClassName="toast-body"
      progressClassName="toast-progress"
    />
  );
}

