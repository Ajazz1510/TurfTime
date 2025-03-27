import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const pricingPlans = [
  {
    title: "Basic",
    price: "$29",
    description: "Perfect for small businesses just getting started.",
    features: [
      "1 staff account",
      "Up to 100 bookings/month",
      "Email reminders",
      "Basic analytics"
    ],
    popular: false
  },
  {
    title: "Professional",
    price: "$79",
    description: "For growing businesses with advanced needs.",
    features: [
      "5 staff accounts",
      "Unlimited bookings",
      "Email & SMS reminders",
      "Advanced analytics",
      "Online payments"
    ],
    popular: true
  },
  {
    title: "Enterprise",
    price: "$199",
    description: "For large businesses with complex requirements.",
    features: [
      "20 staff accounts",
      "Unlimited bookings",
      "All reminder types",
      "Advanced analytics & reporting",
      "API access",
      "Dedicated support"
    ],
    popular: false
  }
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold text-primary uppercase tracking-wide">Pricing</h2>
          <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-4xl">Simple, transparent pricing</p>
          <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">Choose the plan that works best for your business needs.</p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-lg ${
                plan.popular 
                  ? "shadow-md border border-primary overflow-hidden relative" 
                  : "shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 inset-x-0">
                  <div className="bg-primary text-white text-xs font-medium text-center uppercase py-1">
                    Most Popular
                  </div>
                </div>
              )}
              <div className={`p-6 ${plan.popular ? 'pt-8' : ''}`}>
                <h3 className="text-lg font-medium text-gray-900">{plan.title}</h3>
                <p className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="ml-1 text-xl font-medium text-gray-500">/month</span>
                </p>
                <p className="mt-2 text-sm text-gray-500">{plan.description}</p>

                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <div className="flex-shrink-0">
                        <Check className="h-5 w-5 text-green-500" />
                      </div>
                      <p className="ml-3 text-base text-gray-700">{feature}</p>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <Button 
                    variant={plan.popular ? "default" : "outline"} 
                    className="w-full"
                    asChild
                  >
                    <a href="#waitlist">Join Waitlist</a>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
