import { Button } from "@/components/ui/button";
import { Check, Trophy, Dumbbell, GraduationCap } from "lucide-react";

// Sports turf pricing cards
const sportsPricing = [
  {
    title: "Cricket",
    price: "₹400",
    icon: GraduationCap, // Using GraduationCap as a substitute for Cricket
    description: "Book our premium cricket field for a 2-hour session.",
    features: [
      "Professional cricket pitch",
      "Well-maintained outfield",
      "Equipment rental available",
      "Change rooms",
      "Floodlights for evening play",
      "Seating for spectators"
    ],
    popular: true,
    duration: "2 hours"
  },
  {
    title: "Football",
    price: "₹500",
    icon: Trophy,
    description: "Book our FIFA-standard football turf for a 1-hour session.",
    features: [
      "FIFA-standard football field",
      "Artificial turf",
      "Equipment rental available",
      "Change rooms",
      "Floodlights for evening matches",
      "Coaching available"
    ],
    popular: false,
    duration: "1 hour"
  },
  {
    title: "Badminton",
    price: "₹500",
    icon: Dumbbell,
    description: "Book our indoor badminton court for a 1-hour session.",
    features: [
      "Premium indoor court",
      "Wooden flooring",
      "Equipment rental",
      "Air-conditioned hall",
      "Professional lighting",
      "Coaching available"
    ],
    popular: false,
    duration: "1 hour"
  }
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-16 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold text-primary uppercase tracking-wide">Pricing</h2>
          <p className="mt-1 text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-4xl">Simple, transparent pricing</p>
          <p className="max-w-xl mt-5 mx-auto text-xl text-gray-400">Book quality sports facilities at affordable rates.</p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
          {sportsPricing.map((plan, index) => (
            <div
              key={index}
              className={`rounded-lg ${
                plan.popular 
                  ? "shadow-md border border-primary overflow-hidden relative" 
                  : "shadow-sm border border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-300"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 inset-x-0">
                  <div className="bg-primary text-white text-xs font-medium text-center uppercase py-1">
                    Most Popular
                  </div>
                </div>
              )}
              <div className={`p-6 ${plan.popular ? 'pt-8' : ''} bg-gray-900`}>
                <div className="flex items-center">
                  <plan.icon className="h-8 w-8 text-primary mr-3" />
                  <h3 className="text-lg font-medium text-white">{plan.title}</h3>
                </div>
                <p className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  <span className="ml-1 text-xl font-medium text-gray-400">/{plan.duration}</span>
                </p>
                <p className="mt-2 text-sm text-gray-400">{plan.description}</p>

                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <div className="flex-shrink-0">
                        <Check className="h-5 w-5 text-green-500" />
                      </div>
                      <p className="ml-3 text-base text-gray-300">{feature}</p>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <Button 
                    variant={plan.popular ? "default" : "outline"} 
                    className="w-full"
                    asChild
                  >
                    <a href="/auth">Book Now</a>
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
