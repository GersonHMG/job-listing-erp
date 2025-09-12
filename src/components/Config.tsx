import React, { useEffect, useState } from "react";
import { X } from "lucide-react"; // Asegúrate de tener lucide-react instalado

interface ConfigProps {
  open: boolean;
  onClose: () => void;
}

export const Config: React.FC<ConfigProps> = ({ open, onClose }) => {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg min-w-[300px] relative">
        {/* Botón X en la esquina superior derecha */}
        <button
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <X size={20} className="text-gray-700 dark:text-gray-200" />
        </button>
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Configuración
        </h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tema
          </label>
          <div className="flex gap-4">
            <button
              className={`px-4 py-2 rounded-xl border ${
                theme === "light"
                  ? "bg-gray-100 border-gray-400 font-bold"
                  : "border-gray-200"
              }`}
              onClick={() => setTheme("light")}
            >
              Claro
            </button>
            <button
              className={`px-4 py-2 rounded-xl border ${
                theme === "dark"
                  ? "bg-gray-800 text-white border-gray-400 font-bold"
                  : "border-gray-200"
              }`}
              onClick={() => setTheme("dark")}
            >
              Oscuro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};