import Stripe from "stripe";

export const stripe: Stripe.Stripe = Stripe(process.env.STRIPE_SECRET_KEY!);
