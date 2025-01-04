'use client';

import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">About HomeLy Eats</h1>

        <div className="prose prose-lg max-w-none">
          <p className="mb-6">
            Welcome to HomeLy Eats, where we&apos;re revolutionizing the way people experience home-cooked meals. Our platform connects talented home chefs with food enthusiasts who appreciate the authenticity and warmth of homemade cuisine.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Story</h2>
          <p className="mb-6">
            HomeLy Eats was born from a simple observation: in a world of fast food and chain restaurants, people are craving the comfort and authenticity of home-cooked meals. We recognized that many talented home chefs have incredible recipes and culinary skills passed down through generations, yet lacked a platform to share their creations with a wider audience.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
          <p className="mb-6">
            Our mission is to create meaningful connections through food, empowering home chefs while providing food lovers with access to authentic, homemade meals. We believe that every meal tells a story, and we&apos;re here to help share those stories with the world.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">What We Offer</h2>
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-3">For Food Lovers</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access to diverse, authentic home-cooked meals</li>
                <li>Transparent pricing and easy ordering</li>
                <li>Direct connection with talented home chefs</li>
                <li>Secure payment processing</li>
                <li>Detailed meal descriptions and photos</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-3">For Home Chefs</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Platform to showcase culinary talents</li>
                <li>Flexible scheduling and pricing</li>
                <li>Direct customer interaction</li>
                <li>Secure payment processing</li>
                <li>Marketing and promotion support</li>
              </ul>
            </div>
          </div>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-6 mt-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-3">Authenticity</h3>
              <p className="text-gray-600">
                We celebrate the genuine flavors and traditions of home cooking, preserving cultural heritage through food.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-3">Community</h3>
              <p className="text-gray-600">
                We foster meaningful connections between chefs and food lovers, building a vibrant culinary community.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-3">Quality</h3>
              <p className="text-gray-600">
                We maintain high standards for food safety and service, ensuring a premium experience for all users.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Join Our Community</h2>
          <p className="mb-6">
            Whether you&apos;re a passionate home chef looking to share your culinary creations or a food enthusiast seeking authentic home-cooked meals, HomeLy Eats is your platform. Join us in revolutionizing the way people experience food, one home-cooked meal at a time.
          </p>
        </div>
      </div>
    </div>
  );
} 