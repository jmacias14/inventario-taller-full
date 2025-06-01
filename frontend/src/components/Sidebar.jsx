import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const { pathname } = useLocation();

  const linkClass = (path) =>
    `block rounded-lg px-4 py-2 text-sm font-medium ${
      pathname === path
        ? "bg-gray-100 text-blue-700"
        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
    }`;

  return (
    <aside className="flex h-screen w-64 flex-col justify-between border-r bg-white">
      <div className="px-4 py-6">
        <div className="mb-6">
  <h2 className="text-lg font-bold text-gray-900">Jose Luis Perez</h2>
  <p className="text-sm text-gray-500">Venta de Repuestos</p>
</div>


        <ul className="mt-6 space-y-1">
          <li>
            <Link to="/" className={linkClass("/")}>
              Inicio
            </Link>
          </li>
          <li>
            <Link to="/ingreso" className={linkClass("/ingreso")}>
              Ingresar Productos
            </Link>
          </li>
          <li>
            <Link to="/stock" className={linkClass("/stock")}>
              Ver Stock
            </Link>
          </li>
          <li>
            <Link to="/ventas" className={linkClass("/ventas")}>
              Ventas
            </Link>
          </li>
          <li>
            <Link to="/registro" className={linkClass("/registro")}>
              Registro de Movimientos
            </Link>
          </li>
          <li>
            <Link to="/historial-ventas" className={linkClass("/historial-ventas")}>
              Historial Ventas
            </Link>
          </li>
          <li>
            <Link to="/configuracion" className={linkClass("/configuracion")}>
              Configuración
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  );
}
