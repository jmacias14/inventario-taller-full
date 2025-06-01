// Ingreso.jsx
import { useState } from "react";
import AgregarNuevoProducto from "./AgregarNuevoProducto";
import AgregarAStockExistente from "./AgregarAStockExistente";

export default function Ingreso() {
  const [modo, setModo] = useState(null);

  return (
    <div className="p-6">
      {!modo ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">¿Qué querés hacer?</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setModo("nuevo")}
              className="inline-block w-full sm:w-auto rounded-lg bg-blue-600 px-6 py-3 text-lg font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Agregar producto nuevo
            </button>
            <button
              onClick={() => setModo("stock")}
              className="inline-block w-full sm:w-auto rounded-lg bg-green-600 px-6 py-3 text-lg font-medium text-white shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Agregar a stock existente
            </button>
          </div>
        </div>
      ) : modo === "nuevo" ? (
        <AgregarNuevoProducto volver={() => setModo(null)} />
      ) : (
        <AgregarAStockExistente volver={() => setModo(null)} />
      )}
    </div>
  );
}
