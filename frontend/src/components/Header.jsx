import { useLocation } from 'react-router-dom'

export default function Header() {
  const { pathname } = useLocation()
  const title = pathname === '/' ? 'Inicio'
    : pathname === '/stock' ? 'Stock Disponible'
    : pathname === '/ventas' ? 'Ventas de Productos'
    : ''

  return (
    <header className="bg-gray-100 border-b p-4">
      <h1 className="text-xl font-semibold">{title}</h1>
    </header>
  )
}