import { useState, useEffect } from "react";
import { api } from "../api.js";

export default function AgregarAStockExistente({ volver }) {
  const [form, setForm] = useState({
    sku: "",
    cantidad: "",
  });
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [sugerencias, setSugerencias] = useState([]);

  useEffect(() => {
    const delay = setTimeout(() => {
      buscarCoincidencias(form.sku);
    }, 300);
    return () => clearTimeout(delay);
  }, [form.sku]);

  const buscarCoincidencias = async (texto) => {
    if (!texto || texto.length < 2) return setSugerencias([]);
    try {
      const res = await api.get("/products", {
        params: { query: texto, take: 5 }
      });
      setSugerencias(res.data.productos || []);
    } catch (err) {
      console.error(err);
    }
  };

  const seleccionarProducto = (producto) => {
    setForm({ ...form, sku: producto.sku });
    setProductoSeleccionado(producto);
    setSugerencias([]);
    setMensaje(null);
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMensaje(null);
    if (e.target.name === "sku") {
      setProductoSeleccionado(null);
    }
  };

  const handleSubmit = async () => {
    if (!form.sku || !form.cantidad || isNaN(form.cantidad)) {
      setMensaje("SKU y cantidad válida son requeridos.");
      return;
    }

    try {
      await api.post("/products/update", {
        sku: form.sku,
        cantidad: parseFloat(form.cantidad),
      });
      setMensaje("Stock actualizado correctamente.");
      setForm({ sku: "", cantidad: "" });
      setProductoSeleccionado(null);
    } catch {
      setMensaje("Error al actualizar stock.");
    }
  };

  const renderUbicacion = (producto) => {
    if (producto.tipoUbicacion === "repisa" && producto.repisa && producto.estante) {
      return `Repisa ${producto.repisa.letra} - Estante ${producto.estante.numero}`;
    } else if (producto.tipoUbicacion === "otro" && producto.ubicacionLibre) {
      return producto.ubicacionLibre;
    }
    return "Sin ubicación";
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Agregar a stock existente</h2>
      <div className="grid gap-3">
        <input
          name="sku"
          placeholder="Buscar por código, marca o descripción"
          className="border p-2 rounded"
          value={form.sku}
          onChange={handleInputChange}
        />
        <input
          name="cantidad"
          placeholder="Cantidad a agregar"
          className="border p-2 rounded"
          type="number"
          value={form.cantidad}
          onChange={handleInputChange}
        />
      </div>

      {productoSeleccionado && (
        <div className="mt-4 border p-4 rounded bg-gray-50">
          <p><strong>Descripción:</strong> {productoSeleccionado.descripcion}</p>
          <p><strong>Marca:</strong> {productoSeleccionado.marca}</p>
          <p><strong>SKU:</strong> {productoSeleccionado.sku}</p>
          <p><strong>Stock actual:</strong> {productoSeleccionado.cantidad} {productoSeleccionado.unidad}</p>
          <p><strong>Ubicación:</strong> {renderUbicacion(productoSeleccionado)}</p>
        </div>
      )}

      <div className="mt-4 flex gap-3">
        <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Agregar stock
        </button>
        <button onClick={volver} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
          Volver
        </button>
      </div>

      {mensaje && <p className="mt-4 text-sm text-blue-600">{mensaje}</p>}

      {sugerencias.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Coincidencias:</h3>
          <div className="grid gap-2">
            {sugerencias.map((p) => (
              <div
                key={p.id}
                className="border p-3 rounded shadow-sm bg-white cursor-pointer hover:bg-gray-100"
                onClick={() => seleccionarProducto(p)}
              >
                <p className="font-semibold">{p.descripcion}</p>
                <p className="text-sm text-gray-700">Marca: {p.marca}</p>
                <p className="text-sm text-gray-500">SKU: {p.sku}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
