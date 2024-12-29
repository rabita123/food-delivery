import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HomeMade - Delicious Homemade Food Delivery",
  description: "Order authentic homemade dishes from local chefs in your area",
  keywords: ["food delivery", "homemade food", "local chefs", "food ordering"],
  authors: [{ name: "HomeMade" }],
  openGraph: {
    title: "HomeMade - Delicious Homemade Food Delivery",
    description: "Order authentic homemade dishes from local chefs in your area",
    type: "website",
    locale: "en_US",
    siteName: "HomeMade",
  },
  twitter: {
    card: "summary_large_image",
    title: "HomeMade - Delicious Homemade Food Delivery",
    description: "Order authentic homemade dishes from local chefs in your area",
  },
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
}; 