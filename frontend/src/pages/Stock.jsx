import { useEffect, useState } from 'react'
import { api } from '../api';
import { useVentaStore } from '../store/ventaStore'
import { useToast } from '../context/ToastContext'
import { Search, ChevronRight, ChevronUp, Trash2, Plus, Minus, ShoppingCart } from 'lucide-react'

export default function Stock() {
  const [productos, setProductos] = useState([])
  const [query, setQuery] = useState('')
  const [cantidadFiltro, setCantidadFiltro] = useState('')
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [estructura, setEstructura] = useState({})
  const [modal, setModal] = useState(null)
  const [expandido, setExpandido] = useState(null)
  const [cantidadVenta, setCantidadVenta] = useState(1)
  const [modificarStockModal, setModificarStockModal] = useState(null)
  const [accionStock, setAccionStock] = useState('agregar')
  const [cantidadStock, setCantidadStock] = useState('')
  const [confirmarEliminarId, setConfirmarEliminarId] = useState(null)

  const { agregarProducto } = useVentaStore()
  const { showToast } = useToast()
  const LIMITE = 50

  useEffect(() => {
    api.get('http://localhost:3001/estructura')
      .then(res => setEstructura(res.data || {}))
      .catch(err => {
        console.error('Error al cargar estructura:', err)
        showToast('Error al cargar estructura de ubicación', 'error')
      })
  }, [])

  const fetchProductos = async () => {
    try {
      const params = new URLSearchParams()
      if (query) params.append('query', query)
      if (cantidadFiltro) params.append('maxCantidad', cantidadFiltro)
      params.append('skip', (pagina - 1) * LIMITE)
      params.append('take', LIMITE)

      const res = await api.get(`http://localhost:3001/products?${params.toString()}`)
      const productosData = Array.isArray(res.data) ? res.data : res.data.productos
      setProductos(productosData || [])
      setTotalPaginas(Math.max(1, Math.ceil((res.data.total || productosData.length) / LIMITE)))
    } catch (error) {
      console.error('Error al obtener productos:', error)
      showToast('Error al obtener productos del servidor', 'error')
      setProductos([])
      setTotalPaginas(1)
    }
  }

  useEffect(() => { fetchProductos() }, [pagina, query, cantidadFiltro])

  const abrirModalVenta = (producto) => {
    setModal(producto)
    setCantidadVenta(1)
  }

  const confirmarAgregarVenta = () => {
    const cantidad = Number.isNaN(cantidadVenta) ? 1 : cantidadVenta
    if (cantidad > 0 && cantidad <= modal.cantidad) {
      agregarProducto({ ...modal, cantidadSeleccionada: cantidad })
      setModal(null)
      showToast('Producto agregado a la venta', 'success')
    } else {
      showToast('Cantidad inválida', 'error')
    }
  }

  const confirmarEliminarProducto = async () => {
    try {
      await api.delete(`http://localhost:3001/products/${confirmarEliminarId}`)
      showToast('Producto eliminado correctamente', 'success')
      setConfirmarEliminarId(null)
      fetchProductos()
    } catch (err) {
      console.error(err)
      showToast('Error al eliminar producto', 'error')
    }
  }

  const abrirModificarStock = (producto) => {
    setModificarStockModal(producto)
    setCantidadStock('')
    setAccionStock('agregar')
  }

  const confirmarModificarStock = async () => {
    const cantidad = parseFloat(cantidadStock)
    if (isNaN(cantidad) || cantidad <= 0) return showToast('Cantidad inválida', 'error')

    const producto = modificarStockModal
    if (accionStock === 'quitar' && cantidad > producto.cantidad) {
      return showToast('No puedes quitar más de lo disponible', 'error')
    }

    try {
      if (accionStock === 'agregar') {
        await api.post('http://localhost:3001/products/update', { sku: producto.sku, cantidad })
      } else {
        await api.put(`http://localhost:3001/products/${producto.id}/cantidad`, {
          cantidad: producto.cantidad - cantidad
        })
      }
      showToast(`Stock ${accionStock === 'agregar' ? 'agregado' : 'quitado'} correctamente`, 'success')
      setModificarStockModal(null)
      fetchProductos()
    } catch (err) {
      console.error(err)
      showToast('Error al modificar stock', 'error')
    }
  }

  return (
    <div>
      <div className="mb-4 relative max-w-2xl mx-auto">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por código, marca o descripción"
            className="block w-full rounded-lg border border-gray-300 py-3 pl-12 pr-4 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500/50"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPagina(1)
            }}
          />
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
        </div>
        <div className="mt-4 w-1/2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por cantidad (menor o igual a):</label>
          <input
            type="number"
            placeholder="Cantidad máxima"
            className="block w-full rounded-lg border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500/50"
            value={cantidadFiltro}
            onChange={(e) => {
              setCantidadFiltro(e.target.value)
              setPagina(1)
            }}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {productos.map(prod => (
          <div
            key={prod.id}
            className={`p-4 border rounded bg-white shadow-sm ${prod.cantidad <= 1 ? 'bg-red-100' : ''}`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setExpandido(expandido === prod.id ? null : prod.id)}>
                <div className="flex items-center justify-center h-full">
                  {expandido === prod.id ? <ChevronUp size={20} /> : <ChevronRight size={20} />}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{prod.descripcion}</h3>
                  <p className="text-sm text-gray-600">Marca: {prod.marca}</p>
                  <p className="text-sm text-gray-600">Ubicación: {prod.ubicacionLibre || `${prod.repisa?.letra || ''} ${prod.estante?.numero || ''}`}</p>
                </div>
              </div>
              <button onClick={() => abrirModalVenta(prod)} className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700">
                <ShoppingCart size={16} className="inline mr-1" /> Agregar a Venta
              </button>
            </div>

            {expandido === prod.id && (
              <div className="mt-4 text-sm text-gray-700 space-y-1">
                <p><strong>SKU:</strong> {prod.sku || '—'}</p>
                <p><strong>Cantidad:</strong> {prod.cantidad} {prod.unidad}</p>
                <p><strong>Observaciones:</strong> {prod.observaciones || '—'}</p>
                <p><strong>Última actualización:</strong> {new Date(prod.updatedAt).toLocaleString()}</p>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => abrirModificarStock(prod)} className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700">
                    <Plus size={14} /> Modificar stock
                  </button>
                  <button onClick={() => setConfirmarEliminarId(prod.id)} className="inline-flex items-center gap-1 rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700">
                    <Trash2 size={14} /> Borrar producto
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center items-center gap-4">
        <button disabled={pagina === 1} onClick={() => setPagina(p => p - 1)} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Anterior</button>
        <span className="font-medium">Página {pagina} de {totalPaginas}</span>
        <button disabled={pagina === totalPaginas} onClick={() => setPagina(p => p + 1)} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Siguiente</button>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">Agregar a venta</h3>
            <p>{modal.descripcion}</p>
            <p className="text-sm">Disponible: {modal.cantidad} {modal.unidad}</p>
            <input
              type="number"
              min="1"
              max={modal.cantidad}
              value={cantidadVenta}
              onChange={e => {
                const val = parseInt(e.target.value)
                setCantidadVenta(Number.isNaN(val) ? 1 : val)
              }}
              className="input mt-2 mb-4 w-full border border-gray-300 rounded px-3 py-2"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancelar</button>
              <button onClick={confirmarAgregarVenta} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Agregar</button>
            </div>
          </div>
        </div>
      )}

      {confirmarEliminarId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">¿Eliminar producto?</h3>
            <p className="text-sm text-gray-700 mb-4">Esta acción es permanente y no se puede deshacer.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmarEliminarId(null)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancelar</button>
              <button onClick={confirmarEliminarProducto} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {modificarStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">Modificar stock</h3>
            <div className="flex items-center gap-4 mb-3">
              <label className="flex items-center gap-2">
                <input type="radio" value="agregar" checked={accionStock === 'agregar'} onChange={() => setAccionStock('agregar')} /> Agregar
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" value="quitar" checked={accionStock === 'quitar'} onChange={() => setAccionStock('quitar')} /> Quitar
              </label>
            </div>
            <input
              type="number"
              placeholder="Cantidad"
              className="input w-full border border-gray-300 rounded px-3 py-2"
              value={cantidadStock}
              onChange={e => setCantidadStock(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setModificarStockModal(null)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancelar</button>
              <button onClick={confirmarModificarStock} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
