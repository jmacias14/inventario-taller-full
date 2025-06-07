import { useEffect, useState } from 'react'
import { api } from "../api.js"
import { useVentaStore } from '../store/ventaStore'
import { useToast } from '../context/ToastContext'
import { Search, ChevronRight, ChevronUp, Trash2, Plus, ShoppingCart } from 'lucide-react'

export default function Stock() {
  const [productos, setProductos] = useState([])
  const [query, setQuery] = useState('')
  const [cantidadFiltro, setCantidadFiltro] = useState('')
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [estructuraRaw, setEstructuraRaw] = useState({})
  const [estructura, setEstructura] = useState([])
  const [modal, setModal] = useState(null)
  const [expandido, setExpandido] = useState(null)
  const [cantidadVenta, setCantidadVenta] = useState(1)
  const [confirmarEliminarId, setConfirmarEliminarId] = useState(null)

  const [productoEditar, setProductoEditar] = useState(null)
  const [formEditar, setFormEditar] = useState({})
  const [erroresEditar, setErroresEditar] = useState({})
  const [confirmarStockMenor, setConfirmarStockMenor] = useState(false)

  const { agregarProducto } = useVentaStore()
  const { showToast } = useToast()
  const LIMITE = 50

  useEffect(() => {
    api.get('/estructura')
      .then(res => {
        const raw = res.data
        setEstructuraRaw(raw)

        // Convertimos el objeto { A: [1,2], B:[1,2,3] } a array [{ letra: 'A', estantes: [...] }]
        const formateada = Object.entries(raw).map(([letra, estantes]) => ({
          letra,
          estantes: estantes.map((num, idx) => ({ id: `${letra}-${idx}`, numero: String(num) }))
        }))
        setEstructura(formateada)
      })
      .catch(err => showToast('Error al cargar estructura de ubicación', 'error'))
  }, [])

  const fetchProductos = async () => {
    try {
      const params = new URLSearchParams()
      if (query) params.append('query', query)
      if (cantidadFiltro) params.append('maxCantidad', cantidadFiltro)
      params.append('skip', (pagina - 1) * LIMITE)
      params.append('take', LIMITE)

      const res = await api.get(`/products?${params.toString()}`)
      const productosData = Array.isArray(res.data) ? res.data : res.data.productos
      setProductos(productosData || [])
      setTotalPaginas(Math.max(1, Math.ceil((res.data.total || productosData.length) / LIMITE)))
    } catch {
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

  const abrirModalEditar = (producto) => {
    const tipoUbicacion = producto.tipoUbicacion || (producto.ubicacionLibre ? 'otro' : 'repisa')
    const repisaLetra = producto.repisa?.letra || ''
    const estanteNumero = producto.estante?.numero || ''

    setFormEditar({
      ...producto,
      tipoUbicacion,
      repisaLetra,
      estanteNumero,
      ubicacionLibre: producto.ubicacionLibre || ''
    })

    setProductoEditar(producto)
    setErroresEditar({})
    setConfirmarStockMenor(false)
  }

  const handleTipoUbicacionChange = (tipo) => {
    setFormEditar(prev => ({
      ...prev,
      tipoUbicacion: tipo,
      repisaLetra: '',
      estanteNumero: '',
      ubicacionLibre: ''
    }))
  }

  const validarFormularioEditar = async () => {
    const camposObligatorios = ['sku', 'marca', 'descripcion', 'cantidad', 'unidad']
    const nuevosErrores = {}
    camposObligatorios.forEach(campo => {
      if (!formEditar[campo] || String(formEditar[campo]).trim() === '') {
        nuevosErrores[campo] = true
      }
    })

    if (formEditar.sku !== productoEditar.sku) {
      try {
        const res = await api.get(`/products/sku/${formEditar.sku}`)
        if (res.data) nuevosErrores.sku = 'SKU ya existente'
      } catch {}
    }

    setErroresEditar(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const confirmarEdicionProducto = async () => {
    const esValido = await validarFormularioEditar()
    if (!esValido) return showToast('Corrige los errores antes de continuar', 'error')

    const cantidadOriginal = productoEditar.cantidad
    const nuevaCantidad = parseFloat(formEditar.cantidad)

    if (!confirmarStockMenor && nuevaCantidad < cantidadOriginal) {
      setConfirmarStockMenor(true)
      return showToast('Estas eliminando productos del stock. Confirma nuevamente.', 'warning')
    }

    try {
      await api.put(`/products/${productoEditar.id}`, formEditar)
      showToast('Producto actualizado correctamente', 'success')
      setProductoEditar(null)
      fetchProductos()
    } catch {
      showToast('Error al guardar cambios', 'error')
    }
  }

  const confirmarEliminarProducto = async () => {
    try {
      await api.delete(`/products/${confirmarEliminarId}`)
      showToast('Producto eliminado correctamente', 'success')
      setConfirmarEliminarId(null)
      fetchProductos()
    } catch {
      showToast('Error al eliminar producto', 'error')
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
          <div key={prod.id} className={`p-4 border rounded bg-white shadow-sm ${prod.cantidad <= 1 ? 'bg-red-100' : ''}`}>
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
                  <button onClick={() => abrirModalEditar(prod)} className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700">
                    <Plus size={14} /> Editar producto
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

      {productoEditar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full overflow-y-auto max-h-[90vh]">
            <h3 className="text-lg font-bold mb-4">Editar Producto</h3>
            <div className="space-y-3">
              {['sku','marca','descripcion','cantidad','unidad','observaciones'].map((campo, i) => (
                <div key={i}>
                  <label className="text-sm font-medium capitalize">{campo}</label>
                  <input
                    type={campo === 'cantidad' ? 'number' : 'text'}
                    value={formEditar[campo] || ''}
                    onChange={e => setFormEditar({ ...formEditar, [campo]: e.target.value })}
                    className={`w-full border rounded px-3 py-2 ${erroresEditar[campo] ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {erroresEditar[campo] && typeof erroresEditar[campo] === 'string' && (
                    <p className="text-xs text-red-600">{erroresEditar[campo]}</p>
                  )}
                </div>
              ))}

              <div>
                <label className="text-sm font-medium block mb-1">Ubicación</label>
                <select
                  value={formEditar.tipoUbicacion}
                  onChange={e => handleTipoUbicacionChange(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
                >
                  <option value="repisa">Repisa</option>
                  <option value="otro">Ubicación libre</option>
                </select>

                {formEditar.tipoUbicacion === 'repisa' && (
                  <>
                    <label className="text-sm">Repisa</label>
                    <select
                      value={formEditar.repisaLetra}
                      onChange={e => setFormEditar(prev => ({ ...prev, repisaLetra: e.target.value, estanteNumero: '' }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
                    >
                      <option value="">Seleccionar repisa</option>
                      {estructura.map(r => (
                        <option key={r.letra} value={r.letra}>{r.letra}</option>
                      ))}
                    </select>

                    <label className="text-sm">Estante</label>
                    <select
                      value={formEditar.estanteNumero}
                      onChange={e => setFormEditar(prev => ({ ...prev, estanteNumero: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="">Seleccionar estante</option>
                      {estructura.find(r => r.letra === formEditar.repisaLetra)?.estantes.map(est => (
                        <option key={est.id} value={est.numero}>{est.numero}</option>
                      ))}
                    </select>
                  </>
                )}

                {formEditar.tipoUbicacion === 'otro' && (
                  <div className="mt-2">
                    <label className="text-sm">Ubicación libre</label>
                    <input
                      type="text"
                      value={formEditar.ubicacionLibre || ''}
                      onChange={e => setFormEditar(prev => ({ ...prev, ubicacionLibre: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setProductoEditar(null)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancelar</button>
              <button onClick={confirmarEdicionProducto} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Aceptar cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

