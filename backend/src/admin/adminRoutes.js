import express from 'express'
import {
  createProduct,
  createVoucher,
  deleteProduct,
  deleteVoucher,
  getDashboardSummary,
  listCustomers,
  listOrders,
  listProducts,
  listVouchers,
  updateOrderStatus,
  updateProduct,
  updateVoucher,
} from './adminController.js'
import { protect, adminOnly } from '../middleware/auth.js'
import siteContentRoutes from './siteContentRoutes.js'
import { receiveImageUpload, uploadImage } from './imageUploadController.js'

const router = express.Router()

router.use(protect, adminOnly)
router.use(siteContentRoutes)
router.post('/uploads', receiveImageUpload, uploadImage)
router.get('/dashboard', getDashboardSummary)
router.get('/products', listProducts)
router.post('/products', createProduct)
router.put('/products/:id', updateProduct)
router.delete('/products/:id', deleteProduct)
router.get('/orders', listOrders)
router.patch('/orders/:id', updateOrderStatus)
router.get('/customers', listCustomers)
router.get('/vouchers', listVouchers)
router.post('/vouchers', createVoucher)
router.put('/vouchers/:id', updateVoucher)
router.delete('/vouchers/:id', deleteVoucher)

export default router
