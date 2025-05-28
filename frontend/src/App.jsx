import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Home from './pages/Home'
import Stock from './pages/Stock'
import Ventas from './pages/Ventas'
import Ingreso from './pages/Ingreso'
import Registro from './pages/Registro'
import HistorialVentas from "./pages/HistorialVentas";

export default function App() {
  return (
    <Router>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-col flex-1">
          <Header />
          <main className="p-4 overflow-y-auto">
            <Routes>
              <Route path="/ingreso" element={<Ingreso />} />
              <Route path="/" element={<Home />} />
              <Route path="/stock" element={<Stock />} />
              <Route path="/ventas" element={<Ventas />} />
              <Route path="/registro" element={<Registro />} />
              <Route path="/historial-ventas" element={<HistorialVentas />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}
