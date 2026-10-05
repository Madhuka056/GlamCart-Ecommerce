import dotenv from 'dotenv'
import mongoose from 'mongoose'
import User from '../models/User.js'

dotenv.config()

const email = process.argv[2]?.trim().toLowerCase()
if (!email) {
  console.error('Usage: npm run admin:promote -- admin@example.com')
  process.exit(1)
}

try {
  await mongoose.connect(process.env.MONGO_URI)
  const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true })
  if (!user) {
    console.error(`No user account found for ${email}. Register the account first.`)
    process.exitCode = 1
  } else {
    console.log(`Admin role granted to ${user.email}.`)
  }
} catch (error) {
  console.error(`Could not update admin role: ${error.message}`)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
