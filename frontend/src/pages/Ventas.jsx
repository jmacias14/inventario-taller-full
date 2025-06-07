import { useEffect, useState } from 'react'
import { useVentaStore } from '../store/ventaStore'
import { api } from '../api';
import { TrashIcon } from '@heroicons/react/24/solid' // Asegurate de tener Heroicons instalado

export default function Ventas() {
  const { venta, quitarProducto, reiniciarVenta } = useVentaStore()
  const [comentarios, setComentarios] = useState('')
  const [mensaje, setMensaje] = useState(null)

  useEffect(() => {
    if (mensaje) {
      const timeout = setTimeout(() => setMensaje(null), 4000)
      return () => clearTimeout(timeout)
    }
  }, [mensaje])

  const handleFinalizar = async () => {
    const confirmar = window.confirm('¿Estás seguro de que querés finalizar la venta? Esto actualizará el stock.')
    if (!confirmar) {
      setMensaje('Operación cancelada: la venta no fue finalizada.')
      return
    }

    try {
      const productos = venta.map(p => ({
        productId: p.id,
        cantidad: p.cantidadSeleccionada || p.cantidad || 1
      }))

      await api.post('http://localhost:3001/sales', {
        comentarios,
        productos
      })

      reiniciarVenta()
      setComentarios('')
      setMensaje('Venta finalizada y stock actualizado.')
    } catch (err) {
      console.error(err)
      setMensaje('Error al finalizar la venta.')
    }
  }

  const handleReiniciar = () => {
    const confirmar = window.confirm('¿Estás seguro de que querés reiniciar la venta? Se perderán los productos agregados.')
    if (confirmar) {
      reiniciarVenta()
      setComentarios('')
      setMensaje('Venta reiniciada.')
    } else {
      setMensaje('Operación cancelada: la venta no fue reiniciada.')
    }
  }

  const pluralizar = (unidad, cantidad) => {
    if (unidad === 'Unidad') return cantidad === 1 ? 'Unidad' : 'Unidades'
    return cantidad === 1 ? unidad : unidad + 's'
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Venta actual</h2>

      {venta.length === 0 ? (
        <p>No hay productos en la venta.</p>
      ) : (
        <div className="grid gap-4">
          {venta.map((prod, i) => (
            <div key={i} className="p-4 border rounded bg-white shadow-sm flex justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{prod.descripcion}</h3>
                <p><strong>Marca:</strong> {prod.marca}</p>
                <p><strong>SKU:</strong> {prod.sku || '—'}</p>
                <p><strong>Cantidad:</strong> {prod.cantidadSeleccionada || prod.cantidad || 1} {pluralizar(prod.unidad, prod.cantidadSeleccionada || prod.cantidad || 1)}</p>
                <p><strong>Unidad:</strong> {prod.unidad}</p>
                <p><strong>Ubicación:</strong> {prod.ubicacion}</p>
                <p><strong>Observaciones:</strong> {prod.observaciones || '—'}</p>
              </div>
              <button
                onClick={() => quitarProducto(prod.id)}
                className="text-red-600 hover:text-red-800"
                title="Quitar producto"
              >
                <TrashIcon className="w-6 h-6" />
              </button>
            </div>
          ))}
        </div>
      )}

      {venta.length > 0 && (
        <div className="mt-4">
          <label className="block font-semibold mb-1">Comentarios:</label>
          <textarea
            className="w-full border rounded p-2"
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            rows={3}
            placeholder="Comentarios sobre la venta..."
          />
        </div>
      )}

      <div className="mt-6 flex gap-4">
        <button
          onClick={handleFinalizar}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          disabled={venta.length === 0}
        >
          Finalizar venta
        </button>
        <button onClick={handleReiniciar} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
          Reiniciar venta
        </button>
      </div>

      {mensaje && <p className="mt-4 text-blue-600 transition-opacity duration-300">{mensaje}</p>}
    </div>
  )
}
