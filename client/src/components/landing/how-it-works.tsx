export default function HowItWorks() {
  const businessSteps = [
    {
      title: "Set up your business profile",
      description: "Create your profile, add services, define your working hours, and set your availability."
    },
    {
      title: "Customize booking options",
      description: "Set up booking rules, cancellation policies, and payment requirements that work for your business."
    },
    {
      title: "Share your booking page",
      description: "Add your booking link to your website, social media, or share directly with customers."
    },
    {
      title: "Manage your bookings",
      description: "View, approve, reschedule, or cancel bookings from your dashboard."
    }
  ];

  const customerSteps = [
    {
      title: "Find a business",
      description: "Search for businesses or click on a booking link shared by a business."
    },
    {
      title: "Select service and time",
      description: "Choose the service you want and a time slot that works for you."
    },
    {
      title: "Provide your details",
      description: "Fill in your information and any special requirements for your booking."
    },
    {
      title: "Confirm and manage",
      description: "Receive confirmation and reminders, and easily reschedule if needed."
    }
  ];

  return (
    <section id="how-it-works" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold text-primary uppercase tracking-wide">How It Works</h2>
          <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-4xl">Streamlined booking for everyone</p>
          <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">TurfTime works for both turf owners and players, making the booking process simple and efficient.</p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* For Businesses */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-8">
                <h3 className="text-2xl font-bold text-gray-900">For Businesses</h3>
                <div className="mt-8 space-y-6">
                  {businessSteps.map((step, index) => (
                    <div key={index} className="flex">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white text-lg font-medium">
                          {index + 1}
                        </div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-medium text-gray-900">{step.title}</h4>
                        <p className="mt-2 text-base text-gray-500">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* For Customers */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-8">
                <h3 className="text-2xl font-bold text-gray-900">For Customers</h3>
                <div className="mt-8 space-y-6">
                  {customerSteps.map((step, index) => (
                    <div key={index} className="flex">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary text-white text-lg font-medium">
                          {index + 1}
                        </div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-medium text-gray-900">{step.title}</h4>
                        <p className="mt-2 text-base text-gray-500">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
