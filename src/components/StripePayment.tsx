'use client';

import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { StripeElementsOptions } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormProps {
  onSuccess: () => void;
  onError: (error: Error) => void;
  orderId: string;
  amount: number;
}

function PaymentForm({ onSuccess, onError, orderId, amount }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw submitError;
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation/${orderId}`,
        },
      });

      if (confirmError) {
        throw confirmError;
      }

      onSuccess();
    } catch (error: any) {
      setMessage(error.message || 'An error occurred');
      onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <PaymentElement />
      <button
        disabled={isLoading || !stripe || !elements}
        className="w-full bg-primary text-white py-2 px-4 rounded-md mt-4 disabled:opacity-50"
      >
        {isLoading ? 'Processing...' : `Pay $${(amount / 100).toFixed(2)}`}
      </button>
      {message && (
        <div className="mt-4 text-red-500 text-sm text-center">{message}</div>
      )}
    </form>
  );
}

interface StripePaymentProps {
  orderId: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: Error) => void;
}

export default function StripePayment({
  orderId,
  amount,
  onSuccess,
  onError,
}: StripePaymentProps) {
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, amount }),
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        console.error('Error:', error);
        onError(error);
      });
  }, [orderId, amount, onError]);

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  };

  return (
    <div className="w-full">
      {clientSecret && (
        <Elements stripe={stripePromise} options={options}>
          <PaymentForm
            onSuccess={onSuccess}
            onError={onError}
            orderId={orderId}
            amount={amount}
          />
        </Elements>
      )}
    </div>
  );
} 