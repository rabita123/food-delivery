'use client';

import { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormProps {
  clientSecret: string;
  orderId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function PaymentForm({ clientSecret, orderId, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Check payment status on mount and when redirected back
  useEffect(() => {
    if (!stripe) return;

    const checkPaymentStatus = async () => {
      // Check if we have a payment_intent_client_secret in the URL
      const clientSecret = searchParams.get('payment_intent_client_secret');
      const paymentIntentId = searchParams.get('payment_intent');

      if (clientSecret && paymentIntentId) {
        try {
          const { paymentIntent, error } = await stripe.retrievePaymentIntent(clientSecret);
          
          if (error) {
            console.error('Error retrieving payment intent:', error);
            onError(error.message || 'Payment verification failed');
            return;
          }

          if (paymentIntent && paymentIntent.status === 'succeeded') {
            console.log('Payment succeeded:', paymentIntent);
            onSuccess();
          } else if (paymentIntent) {
            console.log('Payment status:', paymentIntent.status);
            onError(`Payment ${paymentIntent.status}. Please try again.`);
          }
        } catch (error: any) {
          console.error('Error checking payment status:', error);
          onError('Failed to verify payment status');
        }
      }
    };

    checkPaymentStatus();
  }, [stripe, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError('Stripe is not initialized');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/orders/${orderId}?payment=stripe`,
          payment_method_data: {
            billing_details: {
              address: {
                country: 'US',
              },
            },
          },
        },
      });

      if (result.error) {
        throw new Error(result.error.message || 'Payment failed');
      }

      // If we get here without a redirect, payment was successful
      onSuccess();
    } catch (error: any) {
      console.error('Payment error:', error);
      onError(error.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Processing...
          </div>
        ) : (
          'Pay Now'
        )}
      </Button>
    </form>
  );
}

interface StripePaymentProps {
  amount: number;
  orderId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function StripePayment({ amount, orderId, onSuccess, onError }: StripePaymentProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializePayment = async () => {
      try {
        const response = await fetch('/api/stripe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, orderId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to initialize payment');
        }

        const data = await response.json();
        
        if (!data.clientSecret) {
          throw new Error('No client secret received');
        }

        setClientSecret(data.clientSecret);
      } catch (error: any) {
        console.error('Payment initialization error:', error);
        onError(error.message || 'Failed to initialize payment');
      } finally {
        setIsLoading(false);
      }
    };

    initializePayment();
  }, [amount, orderId]);

  if (isLoading || !clientSecret) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#f97316',
          },
        },
      }}
    >
      <PaymentForm
        clientSecret={clientSecret}
        orderId={orderId}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
} 