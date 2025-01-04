'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">About HomelyEats</h1>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
        <p className="text-gray-700 mb-4">
          Welcome to HomelyEats, where we bring the comfort of home-cooked meals right to your doorstep. Our journey began with a simple idea: everyone deserves access to delicious, nutritious, homemade food, even when they&apos;re too busy to cook.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
        <p className="text-gray-700 mb-4">
          At HomelyEats, we&apos;re committed to:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Connecting talented home chefs with food lovers in their community</li>
          <li>Ensuring the highest standards of food quality and safety</li>
          <li>Supporting local communities and promoting sustainable food practices</li>
          <li>Making authentic, homemade food accessible to everyone</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Browse & Order</h3>
            <p className="text-gray-700">
              Explore our diverse menu of homemade dishes and place your order with just a few clicks.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Fresh Preparation</h3>
            <p className="text-gray-700">
              Our home chefs prepare your meal fresh, using quality ingredients and authentic recipes.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Swift Delivery</h3>
            <p className="text-gray-700">
              We deliver your food hot and fresh, right to your doorstep at your chosen time.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Our Home Chefs</h2>
        <p className="text-gray-700 mb-4">
          We partner with passionate home chefs who bring years of experience and love for cooking to every dish they prepare. Each chef is carefully vetted and follows strict food safety guidelines to ensure you receive the highest quality meals.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Quality & Safety</h2>
        <p className="text-gray-700 mb-4">
          Your safety is our top priority. We maintain rigorous standards for:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Kitchen hygiene and cleanliness</li>
          <li>Ingredient freshness and quality</li>
          <li>Food handling and packaging</li>
          <li>Delivery safety protocols</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Join Our Community</h2>
        <p className="text-gray-700 mb-4">
          Whether you&apos;re a food lover looking for authentic homemade meals or a talented home chef wanting to share your culinary creations, we&apos;d love to have you in our community.
        </p>
        <div className="flex gap-4">
          <button className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors">
            Order Now
          </button>
          <button className="border border-primary text-primary px-6 py-2 rounded-md hover:bg-primary hover:text-white transition-colors">
            Become a Chef
          </button>
        </div>
      </section>
    </div>
  );
} 