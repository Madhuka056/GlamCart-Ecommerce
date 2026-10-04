const PAYHERE_SCRIPT = 'https://www.payhere.lk/lib/payhere.js'

function loadPayHereScript() {
  if (window.payhere) return Promise.resolve(window.payhere)

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${PAYHERE_SCRIPT}"]`)
    const script = existing || document.createElement('script')

    script.addEventListener('load', () => {
      if (window.payhere) resolve(window.payhere)
      else reject(new Error('PayHere could not be loaded. Please try again.'))
    })
    script.addEventListener('error', () => {
      reject(new Error('Could not load PayHere. Please check your connection and try again.'))
    })

    if (!existing) {
      script.src = PAYHERE_SCRIPT
      script.async = true
      document.head.appendChild(script)
    }
  })
}

// Resolves 'completed' or 'dismissed'. Rejects when PayHere reports an error.
export async function startPayHerePayment(payment) {
  const payhere = await loadPayHereScript()

  return new Promise((resolve, reject) => {
    payhere.onCompleted = () => resolve('completed')
    payhere.onDismissed = () => resolve('dismissed')
    payhere.onError = (error) => {
      reject(new Error(typeof error === 'string' && error ? error : 'Payment failed. Please try again.'))
    }
    payhere.startPayment(payment)
  })
}