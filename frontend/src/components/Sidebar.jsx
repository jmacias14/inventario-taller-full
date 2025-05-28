import { Link, useLocation } from 'react-router-dom'

export default function Sidebar() {
  const { pathname } = useLocation()
  const linkClass = (path) => pathname === path ? 'font-semibold text-blue-600' : 'text-gray-700'

  return (
    <nav className="w-64 bg-white border-r p-4 space-y-4">
      <h2 className="text-xl font-bold mb-6">Inventario Taller</h2>
      <ul className="space-y-2">
        <li><Link to="/" className={linkClass('/')}>Inicio</Link></li>
        <li><Link to="/ingreso" className={linkClass('/ingreso')}>Ingresar Productos</Link></li>
        <li><Link to="/stock" className={linkClass('/stock')}>Ver Stock</Link></li>
        <li><Link to="/ventas" className={linkClass('/ventas')}>Ventas</Link></li>
        <li><Link to="/registro" className={linkClass('/registro')}>Registro de Movimientos</Link></li> 
        <li><Link to="/historial-ventas" className={linkClass('/historial-ventas')}>Historial Ventas</Link></li>
      </ul>
    </nav>
  )
}