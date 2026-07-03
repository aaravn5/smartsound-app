/**
 * Stripe Checkout + Customer Portal + webhooks (§4.4). Test-mode until real
 * Stripe keys/price IDs are provided — all three routes 503 until then (see
 * `requireConfig('stripe')`).
 */

import { Hono } from 'hono'
import Stripe from 'stripe'
import { z } from 'zod'
import { requireAuth } from '../middleware/require-auth.js'
import { requireConfig } from '../middleware/require-config.js'
import { env, stripeConfig } from '../env.js'
import { attachStripeCustomer, getSubscription, upsertSubscriptionByStripeCustomer } from '../db.js'
import type { Plan, SubscriptionStatus } from '../types.js'
import type { AppEnv } from '../hono-app.js'

export const billingRoutes = new Hono<AppEnv>()

function stripeClient(): Stripe {
  return new Stripe(stripeConfig().secretKey)
}

function priceIdFor(plan: Exclude<Plan, 'free'>, interval: 'month' | 'year'): string {
  const prices = stripeConfig().prices
  if (plan === 'pro') return interval === 'month' ? prices.proMonth : prices.proYear
  return interval === 'month' ? prices.studioMonth : prices.studioYear
}

function planFromPriceId(priceId: string | undefined): Plan | undefined {
  if (!priceId) return undefined
  const prices = stripeConfig().prices
  if (priceId === prices.proMonth || priceId === prices.proYear) return 'pro'
  if (priceId === prices.studioMonth || priceId === prices.studioYear) return 'studio'
  return undefined
}

function statusFromStripe(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'trialing':
      return 'trialing'
    case 'active':
      return 'active'
    case 'past_due':
      return 'past_due'
    case 'canceled':
    case 'incomplete_expired':
    case 'unpaid':
      return 'canceled'
    default:
      return 'inactive'
  }
}

async function ensureStripeCustomer(stripe: Stripe, userId: string, email: string | null): Promise<string> {
  const existing = getSubscription(userId).stripe_customer_id
  if (existing) return existing
  const customer = await stripe.customers.create({ email: email ?? undefined, metadata: { userId } })
  attachStripeCustomer(userId, customer.id)
  return customer.id
}

const checkoutBody = z.object({
  plan: z.enum(['pro', 'studio']),
  interval: z.enum(['month', 'year']),
})

billingRoutes.post('/checkout', requireAuth, requireConfig('stripe'), async (c) => {
  const user = c.get('user')
  const parsed = checkoutBody.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json({ error: 'invalid_body', issues: parsed.error.issues }, 400)
  }

  const stripe = stripeClient()
  const customerId = await ensureStripeCustomer(stripe, user.id, user.email)
  const priceId = priceIdFor(parsed.data.plan, parsed.data.interval)

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    // 7-day free trial on Pro/Studio (§4.1).
    subscription_data: { trial_period_days: 7 },
    success_url: `${env.PUBLIC_ORIGIN}/app/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.PUBLIC_ORIGIN}/app/billing/paywall`,
  })

  return c.json({ url: session.url })
})

billingRoutes.post('/portal', requireAuth, requireConfig('stripe'), async (c) => {
  const user = c.get('user')
  const customerId = getSubscription(user.id).stripe_customer_id
  if (!customerId) {
    return c.json({ error: 'no_stripe_customer' }, 400)
  }
  const stripe = stripeClient()
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${env.PUBLIC_ORIGIN}/app/me`,
  })
  return c.json({ url: session.url })
})

/**
 * Webhook signature verification needs the raw request body, so this route
 * reads text directly (never JSON-parses first) and never runs through
 * `requireAuth` — Stripe, not a signed-in browser, calls this.
 */
billingRoutes.post('/webhook', requireConfig('stripe'), async (c) => {
  const signature = c.req.header('stripe-signature')
  if (!signature) {
    return c.json({ error: 'missing_signature' }, 400)
  }
  const rawBody = await c.req.text()
  const stripe = stripeClient()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, stripeConfig().webhookSecret)
  } catch {
    return c.json({ error: 'invalid_signature' }, 400)
  }

  // L2 TODO: Stripe retries webhooks on any non-2xx response (and can send
  // legitimate duplicates), so this handler should be idempotent per
  // `event.id`. Add an `event_id` ledger table (unique constraint), check it
  // at the top of this handler, and skip/short-circuit with `{received:true}`
  // if we've already processed this event id before running the switch below.
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
      const subscriptionId =
        typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
      if (customerId && subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = sub.items.data[0]?.price.id
        const plan = planFromPriceId(priceId) ?? 'free'
        upsertSubscriptionByStripeCustomer(customerId, {
          plan,
          status: statusFromStripe(sub.status),
          stripe_sub_id: sub.id,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        })
      }
      break
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
      const priceId = sub.items.data[0]?.price.id
      const plan = event.type === 'customer.subscription.deleted' ? 'free' : (planFromPriceId(priceId) ?? 'free')
      upsertSubscriptionByStripeCustomer(customerId, {
        plan,
        status: event.type === 'customer.subscription.deleted' ? 'canceled' : statusFromStripe(sub.status),
        stripe_sub_id: sub.id,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      })
      break
    }
    default:
      break // other event types intentionally ignored
  }

  return c.json({ received: true })
})
