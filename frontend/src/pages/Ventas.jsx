// src/pages/Ventas.jsx
import { useEffect, useState } from 'react'
import { useVentaStore } from '../store/ventaStore'
import axios from 'axios'

export default function Ventas() {
  const { venta, quitarProducto, reiniciarVenta, finalizarVenta } = useVentaStore()
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
      const items = venta.map(p => ({ id: p.id, cantidad: p.cantidadSeleccionada || p.cantidad || 1 }))
      await axios.post('http://localhost:3001/sales', { items })
      reiniciarVenta()
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
      setMensaje('Venta reiniciada.')
    } else {
      setMensaje('Operación cancelada: la venta no fue reiniciada.')
    }
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
              <div>
                <h3 className="font-semibold">{prod.descripcion}</h3>
                <p>Marca: {prod.marca}</p>
                <p>Cantidad: {prod.cantidadSeleccionada || prod.cantidad || 1} {prod.unidad}</p>
                <p>Ubicación: {prod.ubicacion}</p>
              </div>
              <button onClick={() => quitarProducto(prod.id)} className="text-red-600 hover:underline">Quitar</button>
            </div>
          ))}
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
