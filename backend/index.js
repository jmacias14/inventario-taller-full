import express from 'express'
import cors from 'cors'

import productRoutes from './routes/products.js'
import ventasRoutes from './routes/sales.js'      // renombré a ventasRoutes para claridad
import logRoutes from './routes/logs.js'
import configRoutes from './routes/config.js'
import estructuraRoutes from './routes/estructura.js'
import importarRoutes from './routes/importar.js'

const app = express()

// ✅ Permitir peticiones desde cualquier origen
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}))

app.use(express.json())

app.use('/products', productRoutes)
app.use('/ventas', ventasRoutes)            // cambié '/sales' por '/ventas'
app.use('/logs', logRoutes)
app.use('/config', configRoutes)
app.use('/estructura', estructuraRoutes)
app.use('/importar', importarRoutes)

app.listen(3001, () => console.log('API escuchando en http://localhost:3001'))
