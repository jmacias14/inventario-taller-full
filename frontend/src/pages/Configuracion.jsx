import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { ToastContext } from "../context/ToastContext";

export default function Configuracion() {
  const [letraRepisa, setLetraRepisa] = useState("");
  const [cantidadEstantes, setCantidadEstantes] = useState(1);
  const [repisas, setRepisas] = useState([]);
  const [mostrarRepisas, setMostrarRepisas] = useState(false);
  const [editarId, setEditarId] = useState(null);
  const [nuevaCantidad, setNuevaCantidad] = useState(0);
  const [confirmarEliminarId, setConfirmarEliminarId] = useState(null);
  const [confirmarEditar, setConfirmarEditar] = useState(null);

  const { showToast } = useContext(ToastContext);

  useEffect(() => {
    obtenerRepisas();
  }, []);

  const obtenerRepisas = async () => {
    try {
      const res = await axios.get("http://localhost:3001/config/repisa");
      setRepisas(res.data);
    } catch (err) {
      console.error("Error al cargar repisas", err);
      showToast("error", "❌ No se pudieron cargar las repisas.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:3001/config/repisa", {
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
      await axios.put(`http://localhost:3001/config/repisa/${editarId}`, {
        nuevaCantidad: parseInt(nuevaCantidad),
      });
      setEditarId(null);
      setConfirmarEditar(null);
      showToast("success", "✅ Estantes actualizados correctamente.");
      obtenerRepisas();
    } catch (err) {
      console.error("Error al actualizar estantes", err);
      showToast("error", "❌ Error al actualizar los estantes.");
    }
  };

  const handleEliminar = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/config/repisa/${id}`);
      showToast("success", "✅ Repisa eliminada correctamente.");
      setConfirmarEliminarId(null);
      obtenerRepisas();
    } catch (err) {
      console.error("Error al eliminar repisa", err);
      showToast("error", "❌ Error al eliminar la repisa.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Configuración</h1>

      <div className="mb-6">
        <button
          onClick={() => setMostrarRepisas(!mostrarRepisas)}
          className="inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Configuración Repisas
        </button>
      </div>

      {mostrarRepisas && (
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
            <div>
              <label className="block font-semibold mb-1">Letra de la repisa:</label>
              <input
                type="text"
                maxLength={1}
                pattern="[A-Za-z]"
                required
                value={letraRepisa}
                onChange={(e) => setLetraRepisa(e.target.value.toUpperCase())}
                className="w-full border rounded p-2"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Cantidad de estantes:</label>
              <input
                type="number"
                min={1}
                required
                value={cantidadEstantes}
                onChange={(e) => setCantidadEstantes(e.target.value.replace(/\D/, ""))}
                className="w-full border rounded p-2"
              />
            </div>

            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Agregar repisa
            </button>
          </form>

          <div>
            <h2 className="text-lg font-bold mt-8 mb-2">Repisas existentes</h2>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-900">Letra</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-900">Estantes</th>
                    <th className="px-4 py-2 text-center font-medium text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {repisas.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-2 font-medium">{r.letra}</td>
                      <td className="px-4 py-2">
                        {editarId === r.id ? (
                          <input
                            type="number"
                            min={r.estantes.length + 1}
                            value={nuevaCantidad}
                            onChange={(e) => setNuevaCantidad(e.target.value)}
                            className="border rounded px-2 py-1 w-20"
                          />
                        ) : (
                          r.estantes.length
                        )}
                      </td>
                      <td className="px-4 py-2 flex items-center justify-center gap-2">
                        {editarId === r.id ? (
                          <>
                            <CheckIcon
                              onClick={() => setConfirmarEditar(r.id)}
                              className="h-5 w-5 text-green-600 cursor-pointer hover:text-green-800"
                            />
                            <XMarkIcon
                              onClick={() => setEditarId(null)}
                              className="h-5 w-5 text-gray-500 cursor-pointer hover:text-gray-700"
                            />
                          </>
                        ) : (
                          <>
                            <PencilIcon
                              onClick={() => handleEditarClick(r)}
                              className="h-5 w-5 text-blue-600 cursor-pointer hover:text-blue-800"
                            />
                            <TrashIcon
                              onClick={() => setConfirmarEliminarId(r.id)}
                              className="h-5 w-5 text-red-600 cursor-pointer hover:text-red-800"
                            />
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {confirmarEliminarId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg space-y-4 max-w-md">
            <p className="text-lg font-semibold text-gray-800">¿Eliminar esta repisa?</p>
            <div className="flex justify-end gap-4">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                onClick={() => handleEliminar(confirmarEliminarId)}
              >
                Sí, eliminar
              </button>
              <button
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                onClick={() => setConfirmarEliminarId(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Edición */}
      {confirmarEditar && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg space-y-4 max-w-md">
            <p className="text-lg font-semibold text-gray-800">
              ¿Confirmás aumentar la cantidad de estantes?
            </p>
            <div className="flex justify-end gap-4">
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                onClick={confirmarEdicion}
              >
                Confirmar
              </button>
              <button
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                onClick={() => setConfirmarEditar(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
