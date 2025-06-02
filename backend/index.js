import express from 'express'
import cors from 'cors'

import productRoutes from './routes/products.js'
import salesRoutes from './routes/sales.js'
import logRoutes from './routes/logs.js'
import configRoutes from './routes/config.js'
import estructuraRoutes from './routes/estructura.js'
import importarRoutes from './routes/importar.js'

const app = express()

// ✅ Permitir peticiones desde Vite
app.use(cors({
  origin: true,
  credentials: true
}))

app.use(express.json())

app.use('/products', productRoutes)
app.use('/sales', salesRoutes)
app.use('/logs', logRoutes)
app.use('/config', configRoutes)
app.use('/estructura', estructuraRoutes)
app.use('/importar', importarRoutes)


app.listen(3001, () => console.log('API escuchando en http://localhost:3001'))
