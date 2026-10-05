import express from 'express';
import { body } from 'express-validator';
import {
  cancelMyOrder,
  createOrder,
  getMyOrder,
  getMyOrders,
} from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = express.Router();

router.get('/my-orders', protect, getMyOrders);
router.get('/:orderId', protect, getMyOrder);
router.patch('/:orderId/cancel', protect, cancelMyOrder);

router.post(
  '/',
  protect,
  [
    body('customer.fullName').trim().notEmpty().withMessage('Full name is required'),
    body('customer.phone').trim().notEmpty().withMessage('Phone number is required'),
    body('customer.address').trim().notEmpty().withMessage('Address is required'),
    body('customer.city').trim().notEmpty().withMessage('City is required'),
    body('customer.district').trim().notEmpty().withMessage('District is required'),
    body('payment')
      .optional()
      .isIn(['Cash on Delivery', 'Bank Transfer', 'Card Payment'])
      .withMessage('Invalid payment method'),
    body('paymentDetails.bankName').if(body('payment').equals('Bank Transfer')).trim().notEmpty().withMessage('Bank name is required'),
    body('paymentDetails.accountName').if(body('payment').equals('Bank Transfer')).trim().notEmpty().withMessage('Account holder name is required'),
    body('paymentDetails.accountNumber').if(body('payment').equals('Bank Transfer')).trim().notEmpty().withMessage('Account number is required'),
    body('paymentDetails.branch').if(body('payment').equals('Bank Transfer')).trim().notEmpty().withMessage('Branch is required'),
    body('paymentDetails.slipName').if(body('payment').equals('Bank Transfer')).trim().notEmpty().withMessage('Bank slip file name is required'),
    body('paymentDetails.slipDataUrl').if(body('payment').equals('Bank Transfer')).trim().notEmpty().withMessage('Bank slip upload is required'),
    body('items').isArray({ min: 1, max: 100 }).withMessage('An order must contain items'),
    body('items.*.productId').isMongoId().withMessage('Invalid product selection'),
    body('items.*.quantity').isInt({ min: 1, max: 100 }).withMessage('Invalid product quantity'),
    body('voucher').optional({ nullable: true }).isString().withMessage('Invalid voucher'),
    body('deliveryEstimate').trim().notEmpty().withMessage('Delivery estimate is required'),
  ],
  validate,
  createOrder
);

export default router;