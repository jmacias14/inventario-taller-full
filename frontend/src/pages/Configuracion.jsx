import { useEffect, useState, useContext } from "react";
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { ToastContext } from "../context/ToastContext";
import { api } from "../api.js";

export default function Configuracion() {
  const [letraRepisa, setLetraRepisa] = useState("");
  const [cantidadEstantes, setCantidadEstantes] = useState(1);
  const [repisas, setRepisas] = useState([]);
  const [editarId, setEditarId] = useState(null);
  const [nuevaCantidad, setNuevaCantidad] = useState(0);
  const [confirmarEliminarId, setConfirmarEliminarId] = useState(null);
  const [archivoExcel, setArchivoExcel] = useState(null);
  const [erroresImportacion, setErroresImportacion] = useState([]);

  const { showToast } = useContext(ToastContext);

  useEffect(() => {
    obtenerRepisas();
  }, []);

  const obtenerRepisas = async () => {
    try {
      const res = await api.get("/config/repisa");
      setRepisas(res.data);
    } catch (err) {
      console.error("Error al cargar repisas", err);
      showToast("error", "❌ No se pudieron cargar las repisas.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/config/repisa", {
        letra: letraRepisa.toUpperCase(),
        cantidadEstantes: parseInt(cantidadEstantes),
      });
      showToast("success", "✅ Repisa y estantes agregados correctamente.");
      setLetraRepisa("");
      setCantidadEstantes(1);
      obtenerRepisas();
    } catch (error) {
      console.error(error);
      if (error.response?.status === 409) {
        showToast("error", "❌ Ya existe una repisa con esa letra.");
      } else {
        showToast("error", "❌ Error al agregar la repisa.");
      }
    }
  };

  const handleEditarClick = (repisa) => {
    setEditarId(repisa.id);
    setNuevaCantidad(repisa.estantes.length + 1);
  };

  const confirmarEdicion = async () => {
    const repisa = repisas.find((r) => r.id === editarId);
    if (!repisa || nuevaCantidad <= repisa.estantes.length) {
      showToast("error", "❌ Solo se puede aumentar la cantidad de estantes.");
      return;
    }

    try {
      await api.put(`/config/repisa/${editarId}`, {
        nuevaCantidad: parseInt(nuevaCantidad),
      });
      setEditarId(null);
      showToast("success", "✅ Estantes actualizados correctamente.");
      obtenerRepisas();
    } catch (err) {
      console.error("Error al actualizar estantes", err);
      showToast("error", "❌ Error al actualizar los estantes.");
    }
  };

  const handleEliminar = async (id) => {
    try {
      await api.delete(`/config/repisa/${id}`);
      showToast("success", "✅ Repisa eliminada correctamente.");
      setConfirmarEliminarId(null);
      obtenerRepisas();
    } catch (err) {
      console.error("Error al eliminar repisa", err);
      showToast("error", "❌ Error al eliminar la repisa.");
    }
  };

  const handleExcelUpload = async () => {
    if (!archivoExcel) return showToast("error", "❌ Seleccioná un archivo Excel primero.");

    const formData = new FormData();
    formData.append("file", archivoExcel);

    try {
      await api.post("/importar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      showToast("success", "✅ Productos importados correctamente.");
      setErroresImportacion([]);
    } catch (error) {
      console.error("Error al importar productos", error);
      const errores = error.response?.data?.errores || [];
      setErroresImportacion(errores);
      showToast("error", "❌ Hubo errores durante la importación.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Configuración</h1>

      <div className="space-y-4">
        <details className="group rounded-lg border border-gray-200 p-4 [&_summary::-webkit-details-marker]:hidden" open>
          <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-gray-900">
            <h2 className="font-medium">Configuración Repisas</h2>
            <svg className="h-5 w-5 shrink-0 transition duration-300 group-open:-rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>

          <div className="mt-4 space-y-4">
            <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
              <div>
                <label className="block mb-1 font-semibold">Letra de la repisa:</label>
                <input type="text" maxLength={1} required pattern="[A-Za-z]" value={letraRepisa} onChange={(e) => setLetraRepisa(e.target.value.toUpperCase())} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block mb-1 font-semibold">Cantidad de estantes:</label>
                <input type="number" min={1} required value={cantidadEstantes} onChange={(e) => setCantidadEstantes(e.target.value.replace(/\D/, ""))} className="w-full border rounded p-2" />
              </div>
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Agregar repisa</button>
            </form>

            <div className="overflow-x-auto mt-6">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Letra</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Estantes</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {repisas.map((repisa) => (
                    <tr key={repisa.id}>
                      <td className="px-4 py-2 font-mono font-semibold">{repisa.letra}</td>
                      <td className="px-4 py-2">{repisa.estantes.length}</td>
                      <td className="px-4 py-2 flex gap-2">
                        {editarId === repisa.id ? (
                          <>
                            <input
                              type="number"
                              min={repisa.estantes.length + 1}
                              value={nuevaCantidad}
                              onChange={(e) => setNuevaCantidad(e.target.value)}
                              className="w-20 border rounded p-1"
                            />
                            <button onClick={confirmarEdicion} className="bg-green-500 text-white rounded p-1">
                              <CheckIcon className="h-5 w-5" />
                            </button>
                            <button onClick={() => setEditarId(null)} className="bg-gray-300 text-gray-800 rounded p-1">
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEditarClick(repisa)} className="bg-blue-500 text-white rounded p-1">
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button onClick={() => setConfirmarEliminarId(repisa.id)} className="bg-red-600 text-white rounded p-1">
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </details>

        <details className="group rounded-lg border border-gray-200 p-4 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-gray-900">
            <h2 className="font-medium">Importar desde Excel</h2>
            <svg className="h-5 w-5 shrink-0 transition duration-300 group-open:-rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>

          <div className="mt-4 flex flex-col md:flex-row md:items-center gap-4">
            <input type="file" accept=".xlsx, .xls" onChange={(e) => setArchivoExcel(e.target.files[0])} className="text-sm text-gray-600" />
            <button onClick={handleExcelUpload} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Importar Excel</button>
          </div>
        </details>

        {erroresImportacion.length > 0 && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded shadow-lg max-w-md space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Errores durante la importación</h2>
              <ul className="list-disc list-inside text-sm text-red-600 max-h-64 overflow-y-auto">
                {erroresImportacion.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
              <div className="flex justify-end">
                <button onClick={() => setErroresImportacion([])} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {confirmarEliminarId && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded shadow-lg space-y-4 max-w-sm text-center">
              <h2 className="text-lg font-semibold">¿Eliminar esta repisa?</h2>
              <p>Esta acción no se puede deshacer.</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => handleEliminar(confirmarEliminarId)}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => setConfirmarEliminarId(null)}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
