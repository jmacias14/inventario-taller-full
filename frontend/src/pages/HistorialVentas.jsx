import { useState, useEffect } from "react";
import axios from "axios";
import { api } from "../api";

export default function HistorialVentas() {
  const [ventas, setVentas] = useState([]);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [productoDetalle, setProductoDetalle] = useState(null);
  const [error, setError] = useState(null);

  const fetchVentas = async () => {
    try {
      const res = await api.get("http://localhost:3001/sales/history");
      setVentas(res.data);
    } catch (err) {
      console.error(err);
      setError("Error al obtener el historial de ventas.");
    }
  };

  const fetchProductoDetalle = async (id) => {
    try {
      const res = await api.get(`http://localhost:3001/products/${id}`);
      setProductoDetalle(res.data);
    } catch (err) {
      console.error(err);
      alert("No se pudo obtener el detalle del producto.");
    }
  };

  useEffect(() => {
    fetchVentas();
  }, []);

  const toggleDetalle = (id) => {
    setVentaSeleccionada((prev) => (prev === id ? null : id));
  };

  const anularVenta = async (id) => {
    if (!window.confirm("¿Anular esta venta y restaurar el stock?")) return;
    try {
      await api.delete(`http://localhost:3001/sales/${id}`);
      await fetchVentas();
    } catch (err) {
      console.error(err);
      alert("Error al anular la venta.");
    }
  };

  const pluralizar = (unidad, cantidad) => {
    if (unidad === "Unidad") return cantidad === 1 ? "Unidad" : "Unidades";
    return cantidad === 1 ? unidad : unidad + "s";
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
                  {new Date(venta.fecha).toLocaleDateString("es-AR")}{" "}
                  {new Date(venta.fecha).toLocaleTimeString("es-AR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-sm text-gray-600">{venta.comentarios}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={() => toggleDetalle(venta.id)}
                  className="text-blue-600 hover:underline"
                >
                  {ventaSeleccionada === venta.id ? "Ocultar" : "Ver detalle"}
                </button>
                <button
                  onClick={() => anularVenta(venta.id)}
                  className="text-red-600 text-sm hover:underline"
                >
                  Anular venta
                </button>
              </div>
            </div>

            {ventaSeleccionada === venta.id && (
              <div className="mt-3 text-sm">
                <ul className="list-disc list-inside">
                  {venta.productos.map((producto, i) => (
                    <li
                      key={i}
                      className="cursor-pointer hover:underline"
                      onClick={() => fetchProductoDetalle(producto.id)}
                    >
                      {producto.cantidad} {pluralizar(producto.unidad, producto.cantidad)} – SKU ({producto.sku || "—"}) – {producto.descripcion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {productoDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <h2 className="text-lg font-bold mb-2">Detalle del producto</h2>
            <p><strong>Descripción:</strong> {productoDetalle.descripcion}</p>
            <p><strong>Marca:</strong> {productoDetalle.marca}</p>
            <p><strong>SKU:</strong> {productoDetalle.sku || '—'}</p>
            <p><strong>Ubicación:</strong> {
              productoDetalle.tipoUbicacion === 'repisa'
                ? `Repisa ${productoDetalle.repisa?.letra || '?'} – Estante ${productoDetalle.estante?.numero || '?'}`
                : productoDetalle.ubicacionLibre || '—'
            }</p>
            <p><strong>Cantidad:</strong> {productoDetalle.cantidad} {pluralizar(productoDetalle.unidad, productoDetalle.cantidad)}</p>
            <p><strong>Unidad:</strong> {productoDetalle.unidad}</p>
            <p><strong>Observaciones:</strong> {productoDetalle.observaciones || '—'}</p>
            <button
              onClick={() => setProductoDetalle(null)}
              className="mt-4 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
