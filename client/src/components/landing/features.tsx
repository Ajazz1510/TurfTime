import { 
  Calendar, 
  BellRing, 
  BarChart3, 
  CreditCard, 
  Clock, 
  Smartphone 
} from "lucide-react";

const features = [
  {
    title: "Smart Scheduling",
    description: "Intelligent scheduling system that optimizes your availability and prevents double bookings.",
    icon: Calendar,
  },
  {
    title: "Automated Reminders",
    description: "Reduce no-shows with customizable email and SMS reminders before appointments.",
    icon: BellRing,
  },
  {
    title: "Business Analytics",
    description: "Gain insights into your booking patterns and customer behavior with detailed analytics.",
    icon: BarChart3,
  },
  {
    title: "Online Payments",
    description: "Accept payments online via UPI, cards, and net banking for bookings, deposits, or full fees with secure payment processing.",
    icon: CreditCard,
  },
  {
    title: "24/7 Booking",
    description: "Allow customers to book appointments anytime, anywhere, even when your business is closed.",
    icon: Clock,
  },
  {
    title: "Mobile App",
    description: "Manage your bookings on the go with our user-friendly mobile app for iOS and Android.",
    icon: Smartphone,
  },
];

export default function Features() {
  return (
    <section id="features" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold text-primary uppercase tracking-wide">Features</h2>
          <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-4xl">Everything you need to manage bookings</p>
          <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">Simplify scheduling, reduce no-shows, and provide a seamless booking experience for your customers.</p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
              >
                <div className="p-6 flex-1">
                  <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-base text-gray-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
