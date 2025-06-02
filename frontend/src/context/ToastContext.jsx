import { createContext, useContext, useState, useCallback } from "react";
import Toast from "../components/Toast";

export const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((mensaje, tipo = "success") => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, showToast }}>
      {children}
      {toast && (
        <Toast mensaje={toast.mensaje} tipo={toast.tipo} visible={true} />
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
