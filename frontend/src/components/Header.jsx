import { useLocation } from 'react-router-dom'

export default function Header() {
  const { pathname } = useLocation()

  const title = pathname === '/' ? 'Inicio'
    : pathname === '/stock' ? 'Stock Disponible'
    : pathname === '/ventas' ? 'Ventas de Productos'
    : pathname === '/ingreso' ? 'Ingreso de Productos'
    : pathname === '/registro' ? 'Registro de Movimientos'
    : pathname === '/historial-ventas' ? 'Historial de Ventas'
    : pathname === '/configuracion' ? 'Configuración del Sistema'
    : 'Inventario Taller'

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="mx-auto max-w-screen-xl px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      </div>
    </header>
  )
}
