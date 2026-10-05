import express from 'express'
import { body } from 'express-validator'
import { getActiveVouchers, validateVoucher } from '../controllers/voucherController.js'
import validate from '../middleware/validate.js'

const router = express.Router()

router.get('/', getActiveVouchers)
router.post('/', [body('code').isString().trim().notEmpty().withMessage('Enter a voucher code')], validate, validateVoucher)

export default router
