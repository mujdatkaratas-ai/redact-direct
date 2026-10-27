import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from '@/lib/config';

export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
