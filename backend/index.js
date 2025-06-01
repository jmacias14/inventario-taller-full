import express from 'express'
import cors from 'cors'

import productRoutes from './routes/products.js'
import salesRoutes from './routes/sales.js'
import logRoutes from './routes/logs.js'
import configRoutes from './routes/config.js'
import estructuraRoutes from './routes/estructura.js'

const app = express()

// Permitir peticiones desde tu frontend (localhost:5173)
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))

app.use(express.json())

app.use('/products', productRoutes)
app.use('/sales', salesRoutes)
app.use('/logs', logRoutes)
app.use('/config', configRoutes)
app.use('/estructura', estructuraRoutes)

app.listen(3001, () => console.log('API escuchando en http://localhost:3001'))
