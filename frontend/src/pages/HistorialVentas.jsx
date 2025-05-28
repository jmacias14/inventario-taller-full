import { useState, useEffect } from "react";
import axios from "axios";

export default function HistorialVentas() {
  const [ventas, setVentas] = useState([]);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVentas = async () => {
      try {
        const res = await axios.get("http://localhost:3001/sales/history");
        setVentas(res.data);
      } catch (err) {
        console.error(err);
        setError("Error al obtener el historial de ventas.");
      }
    };

    fetchVentas();
  }, []);

  const toggleDetalle = (id) => {
    setVentaSeleccionada((prev) => (prev === id ? null : id));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Historial de Ventas</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="space-y-4">
        {ventas.map((venta) => (
          <div
            key={venta.id}
            className="border rounded-lg shadow-sm p-4 bg-white"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">
                  Venta #{venta.id} –{" "}
                  {new Date(venta.fecha).toLocaleDateString("es-AR")}
                </p>
                <p className="text-sm text-gray-600">{venta.comentarios}</p>
              </div>
              <button
                onClick={() => toggleDetalle(venta.id)}
                className="text-blue-600 hover:underline"
              >
                {ventaSeleccionada === venta.id ? "Ocultar" : "Ver detalle"}
              </button>
            </div>
            {ventaSeleccionada === venta.id && (
              <div className="mt-3 text-sm">
                <ul className="list-disc list-inside">
                  {venta.productos.map((producto, i) => (
                    <li key={i}>
                      {producto.nombre} – {producto.cantidad} unidad/es –{" "}
                      {producto.marca}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
