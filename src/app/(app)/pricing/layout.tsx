import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Docs²",
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
