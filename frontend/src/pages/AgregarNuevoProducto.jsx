import { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "../context/ToastContext"; // Asegurate de que esté bien importado

export default function AgregarNuevoProducto({ volver }) {
  const [form, setForm] = useState({
    descripcion: "",
    marca: "",
    sku: "",
    repisaId: "",
    estanteId: "",
    ubicacionLibre: "",
    tipoUbicacion: "repisa",
    cantidad: "",
    unidad: "",
    observaciones: ""
  });

  const { showToast } = useToast();
  const [estructura, setEstructura] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:3001/estructura")
      .then(res => setEstructura(res.data))
      .catch(() => showToast("❌ No se pudieron cargar las repisas", "error"));
  }, []);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const { descripcion, marca, cantidad, unidad, tipoUbicacion } = form;
    const esOtro = tipoUbicacion === "otro";

    if (!descripcion || !marca || !cantidad || !unidad) {
      showToast("❌ Faltan campos obligatorios", "error");
      return;
    }

    if (esOtro && !form.ubicacionLibre) {
      showToast("❌ Debes ingresar una ubicación personalizada", "error");
      return;
    }

    if (!esOtro && (!form.repisaId || !form.estanteId)) {
      showToast("❌ Debes seleccionar repisa y estante", "error");
      return;
    }

    try {
      await axios.post("http://localhost:3001/products/add", {
        descripcion: form.descripcion,
        marca: form.marca,
        sku: form.sku || null,
        unidad: form.unidad,
        cantidad: parseFloat(form.cantidad),
        observaciones: form.observaciones,
        tipoUbicacion: form.tipoUbicacion,
        repisaId: !esOtro ? parseInt(form.repisaId) : undefined,
        estanteId: !esOtro ? parseInt(form.estanteId) : undefined,
        ubicacionLibre: esOtro ? form.ubicacionLibre : null
      });

      showToast("✅ Producto agregado con éxito", "success");

      setForm({
        descripcion: "",
        marca: "",
        sku: "",
        repisaId: "",
        estanteId: "",
        ubicacionLibre: "",
        tipoUbicacion: "repisa",
        cantidad: "",
        unidad: "",
        observaciones: ""
      });
    } catch (error) {
      console.error(error);
      showToast("❌ Error al agregar producto", "error");
    }
  };

  const repisaSeleccionada = estructura.find(r => r.id === parseInt(form.repisaId));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Agregar nuevo producto</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded-lg shadow">
        <input
          name="sku"
          placeholder="Código (SKU)"
          className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
          value={form.sku}
          onChange={handleInputChange}
        />
        <input
          name="descripcion"
          placeholder="Descripción *"
          className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
          value={form.descripcion}
          onChange={handleInputChange}
        />
        <input
          name="marca"
          placeholder="Marca *"
          className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
          value={form.marca}
          onChange={handleInputChange}
        />

        <div className="flex items-center gap-6 col-span-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="tipoUbicacion"
              value="repisa"
              checked={form.tipoUbicacion === "repisa"}
              onChange={handleInputChange}
              className="accent-blue-600"
            />
            <span>Repisa</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="tipoUbicacion"
              value="otro"
              checked={form.tipoUbicacion === "otro"}
              onChange={handleInputChange}
              className="accent-blue-600"
            />
            <span>Otro</span>
          </label>
        </div>

        {form.tipoUbicacion === "repisa" ? (
          <>
            <select
              name="repisaId"
              value={form.repisaId}
              onChange={handleInputChange}
              className="rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccione repisa</option>
              {estructura.map((r) => (
                <option key={r.id} value={r.id}>{r.letra}</option>
              ))}
            </select>

            <select
              name="estanteId"
              value={form.estanteId}
              onChange={handleInputChange}
              className="rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccione estante</option>
              {(repisaSeleccionada?.estantes || []).map(e => (
                <option key={e.id} value={e.id}>{e.numero}</option>
              ))}
            </select>
          </>
        ) : (
          <input
            name="ubicacionLibre"
            placeholder="Ubicación personalizada *"
            className="col-span-2 rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
            value={form.ubicacionLibre}
            onChange={handleInputChange}
          />
        )}

        <input
          name="cantidad"
          placeholder="Cantidad *"
          type="number"
          className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
          value={form.cantidad}
          onChange={handleInputChange}
        />

        <select
          name="unidad"
          value={form.unidad}
          onChange={handleInputChange}
          className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Seleccione unidad *</option>
          <option value="Unidad">Unidad</option>
          <option value="Litro">Litro</option>
          <option value="Metro">Metro</option>
          <option value="Paquete">Paquete</option>
        </select>

        <textarea
          name="observaciones"
          placeholder="Observaciones"
          className="col-span-2 rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
          value={form.observaciones}
          onChange={handleInputChange}
        />
      </div>

      <div className="mt-6 flex gap-4">
        <button
          onClick={handleSubmit}
          className="inline-block rounded bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700"
        >
          Guardar
        </button>
        <button
          onClick={volver}
          className="inline-block rounded bg-gray-300 px-6 py-3 text-base font-medium text-gray-800 hover:bg-gray-400"
        >
          Volver
        </button>
      </div>
    </div>
  );
}
