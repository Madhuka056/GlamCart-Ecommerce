import express from 'express'
import {
  getAdminSiteContent,
  resetSiteContent,
  updateSiteContent,
} from '../controllers/siteContentController.js'

const router = express.Router()

router.get('/site-content', getAdminSiteContent)
router.put('/site-content', updateSiteContent)
router.post('/site-content/reset', resetSiteContent)

export default router
