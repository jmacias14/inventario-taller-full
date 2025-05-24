// src/pages/Stock.jsx
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useVentaStore } from '../store/ventaStore'

export default function Stock() {
  const [productos, setProductos] = useState([])
  const [filtros, setFiltros] = useState({
    query: '', marca: '', unidad: '', minCantidad: '', maxCantidad: '', estante: '', repisa: ''
  })
  const [expandido, setExpandido] = useState(null)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [ubicacionConfig, setUbicacionConfig] = useState({})
  const [estantesDisponibles, setEstantesDisponibles] = useState([])
  const [modal, setModal] = useState(null)
  const [cantidadVenta, setCantidadVenta] = useState(1)
  const { agregarProducto } = useVentaStore()
  const LIMITE = 50

  useEffect(() => {
    fetch('/config/ubicacion.config.json')
      .then(res => {
        if (!res.ok) throw new Error('No se pudo cargar el archivo de configuración')
        return res.json()
      })
      .then(data => setUbicacionConfig(data))
      .catch(err => console.error('Error cargando configuración:', err))
  }, [])

  useEffect(() => {
    if (filtros.repisa && ubicacionConfig[filtros.repisa]) {
      setEstantesDisponibles(ubicacionConfig[filtros.repisa])
    } else {
      setEstantesDisponibles([])
    }
  }, [filtros.repisa, ubicacionConfig])

  const fetchProductos = async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(filtros).forEach(([key, val]) => {
        if (val) params.append(key, val)
      })
      params.append('skip', (pagina - 1) * LIMITE)
      params.append('take', LIMITE)

      const res = await axios.get(`http://localhost:3001/products?${params.toString()}`)
      const productosData = Array.isArray(res.data) ? res.data : res.data.productos
      setProductos(productosData || [])
      setTotalPaginas(Math.max(1, Math.ceil((res.data.total || productosData.length) / LIMITE)))
    } catch (error) {
      console.error('Error al obtener productos:', error)
      setProductos([])
      setTotalPaginas(1)
    }
  }

  useEffect(() => { fetchProductos() }, [pagina])

  const handleChange = e => {
    const { name, value } = e.target
    setFiltros(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'repisa' ? { estante: '' } : {})
    }))
  }

  const handleBuscar = e => {
    e.preventDefault()
    setPagina(1)
    fetchProductos()
  }

  const toggleExpand = id => setExpandido(prev => prev === id ? null : id)

  const abrirModalVenta = (producto) => {
    setModal(producto)
    setCantidadVenta(1)
  }

  const confirmarAgregarVenta = () => {
    const cantidad = Number.isNaN(cantidadVenta) ? 1 : cantidadVenta
    if (cantidad > 0 && cantidad <= modal.cantidad) {
      agregarProducto({ ...modal, cantidadSeleccionada: cantidad })
      setModal(null)
    } else {
      alert('Cantidad inválida')
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Stock disponible</h2>

      <form onSubmit={handleBuscar} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <input name="query" value={filtros.query} onChange={handleChange} placeholder="Buscar por texto..." className="input" />
        <input name="marca" value={filtros.marca} onChange={handleChange} placeholder="Marca" className="input" />
        <select name="unidad" value={filtros.unidad} onChange={handleChange} className="input">
          <option value="">Todas las unidades</option>
          <option value="Unidad">Unidad</option>
          <option value="Litros">Litros</option>
          <option value="Metros">Metros</option>
          <option value="Paquete">Paquete</option>
        </select>
        <select name="repisa" value={filtros.repisa} onChange={handleChange} className="input">
          <option value="">Seleccione repisa</option>
          {Object.keys(ubicacionConfig).map(rep => <option key={rep} value={rep}>{rep}</option>)}
        </select>
        <select name="estante" value={filtros.estante} onChange={handleChange} className="input" disabled={!filtros.repisa}>
          <option value="">Seleccione estante</option>
          {estantesDisponibles.map(est => <option key={est} value={est}>{est}</option>)}
        </select>
        <input name="minCantidad" value={filtros.minCantidad} onChange={handleChange} placeholder="Mín. Cant." type="number" className="input" />
        <input name="maxCantidad" value={filtros.maxCantidad} onChange={handleChange} placeholder="Máx. Cant." type="number" className="input" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 col-span-full md:col-span-1">Buscar</button>
      </form>

      <div className="grid gap-4">
        {productos.map(prod => (
          <div key={prod.id} className="p-4 border rounded bg-white shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">{prod.descripcion}</h3>
                <p className="text-sm text-gray-600">Marca: {prod.marca}</p>
                <p className="text-sm">Cantidad: {prod.cantidad} {prod.unidad}</p>
                <p className="text-sm">Ubicación: {prod.ubicacion}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => toggleExpand(prod.id)} className="text-blue-500 text-sm hover:underline">
                  {expandido === prod.id ? 'Ocultar detalles' : 'Ver detalles'}
                </button>
                <button onClick={() => abrirModalVenta(prod)} className="bg-green-500 text-white text-sm px-3 py-1 rounded hover:bg-green-600">
                  Agregar a Venta
                </button>
              </div>
            </div>
            {expandido === prod.id && (
              <div className="mt-2 text-sm text-gray-700">
                <p><strong>SKU:</strong> {prod.sku || 'N/A'}</p>
                <p><strong>Estante:</strong> {prod.estante || '—'} / <strong>Repisa:</strong> {prod.repisa || '—'}</p>
                <p><strong>Observaciones:</strong> {prod.observaciones || '—'}</p>
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
              className="input mt-2 mb-4 w-full"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancelar</button>
              <button onClick={confirmarAgregarVenta} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Agregar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
