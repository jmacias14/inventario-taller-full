import { useState, useEffect } from 'react'
import axios from 'axios'

export default function Ingreso() {
  const [form, setForm] = useState({
    sku: '', descripcion: '', marca: '', estante: '', repisa: '', cantidad: '', unidad: '', observaciones: ''
  })
  const [editable, setEditable] = useState(true)
  const [mensaje, setMensaje] = useState(null)
  const [ubicacionConfig, setUbicacionConfig] = useState({})
  const [estantes, setEstantes] = useState([])

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
    if (form.repisa && ubicacionConfig[form.repisa]) {
      setEstantes(ubicacionConfig[form.repisa])
    } else {
      setEstantes([])
    }
  }, [form.repisa, ubicacionConfig])

  useEffect(() => {
    if (form.sku.trim() !== '') {
      axios.get(`http://localhost:3001/products/code/${form.sku}`)
        .then(res => {
          if (res.data) {
            const [repisa, estante] = res.data.ubicacion?.split('-') || ['', '']
            setForm(prev => ({
              ...prev,
              ...res.data,
              cantidad: '',
              repisa,
              estante
            }))
            setEditable(false)
            setMensaje(`Producto ya existe. Se actualizará la cantidad.`)
          } else {
            setEditable(true)
            setMensaje(null)
          }
        })
        .catch(err => console.error('Error buscando código:', err))
    } else {
      setEditable(true)
      setMensaje(null)
    }
  }, [form.sku])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'repisa' ? { estante: '' } : {})
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const ubicacion = `${form.repisa}-${form.estante}`
      if (editable) {
        const payload = {
          ...form,
          ubicacion,
          cantidad: parseFloat(form.cantidad),
          sku: form.sku === '' ? null : form.sku
        }
        await axios.post('http://localhost:3001/products/add', payload)
        setMensaje('Producto ingresado correctamente.')
      } else {
        await axios.post('http://localhost:3001/products/update', {
          sku: form.sku,
          cantidad: parseFloat(form.cantidad)
        })
        setMensaje('Cantidad actualizada correctamente.')
      }

      setForm({ sku: '', descripcion: '', marca: '', estante: '', repisa: '', cantidad: '', unidad: '', observaciones: '' })
      setEditable(true)
    } catch (err) {
      console.error(err)
      setMensaje('Ocurrió un error al guardar.')
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Ingreso de nuevos productos</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        <input name="sku" value={form.sku} onChange={handleChange} placeholder="Código (opcional)" className="input" />
        <input name="cantidad" value={form.cantidad} onChange={handleChange} required type="number" step="0.01" min="0" placeholder="Cantidad" className="input" />
        <input name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Descripción del producto" className="input" disabled={!editable} required={editable} />
        <input name="marca" value={form.marca} onChange={handleChange} placeholder="Marca" className="input" disabled={!editable} required={editable} />

        <select name="repisa" value={form.repisa} onChange={handleChange} className="input" disabled={!editable} required={editable}>
          <option value="">Seleccione repisa</option>
          {Object.keys(ubicacionConfig).map(rep => <option key={rep} value={rep}>{rep}</option>)}
        </select>
        <select name="estante" value={form.estante} onChange={handleChange} className="input" disabled={!editable || !form.repisa} required={editable}>
          <option value="">Seleccione estante</option>
          {estantes.map(est => <option key={est} value={est}>{est}</option>)}
        </select>

        <select name="unidad" value={form.unidad} onChange={handleChange} className="input" disabled={!editable} required={editable}>
          <option value="">Seleccione unidad</option>
          <option value="Unidad">Unidad</option>
          <option value="Litros">Litros</option>
          <option value="Metros">Metros</option>
          <option value="Paquete">Paquete</option>
        </select>

        <textarea name="observaciones" value={form.observaciones} onChange={handleChange} placeholder="Observaciones" className="input col-span-1 md:col-span-2" disabled={!editable} />

        <div className="col-span-1 md:col-span-2 text-right">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Guardar producto
          </button>
          <button onClick={() => window.location.reload()} className="ml-2 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">
            Recargar configuración
          </button>
        </div>
      </form>

      {mensaje && <p className="mt-4 text-green-600">{mensaje}</p>}
    </div>
  )
}
