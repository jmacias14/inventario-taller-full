import express from 'express'
import cors from 'cors'

import productRoutes from './routes/products.js'
import salesRoutes from './routes/sales.js'
import logRoutes from './routes/logs.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/products', productRoutes)
app.use('/sales', salesRoutes)
app.use('/logs', logRoutes)

app.listen(3001, () => console.log('API escuchando en http://localhost:3001'))
