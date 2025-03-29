import { Star } from "lucide-react";
const testimonials = [
    {
        name: "Sarah Johnson",
        role: "Owner, Glow Salon",
        content: "TurfTime has transformed our turf business. No more phone tag or double bookings. Our players love the easy booking process, and we've increased our bookings by 30%.",
        rating: 5,
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    },
    {
        name: "Michael Chen",
        role: "Director, Healing Hands Clinic",
        content: "The analytics feature has been a game-changer for our clinic. We can now see our busiest times and plan staffing accordingly. The automated reminders have cut our no-show rate in half.",
        rating: 5,
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    },
    {
        name: "Emily Rodriguez",
        role: "Regular Customer",
        content: "As a player, I love being able to book turf slots online instead of calling. The reminders are helpful, and rescheduling is so easy. I wish all sports facilities used TurfTime!",
        rating: 4,
        avatarUrl: "https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    }
];
export default function Testimonials() {
    return (<section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold text-primary uppercase tracking-wide">Testimonials</h2>
          <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-4xl">What early users are saying</p>
          <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">We're currently in private beta with select businesses.</p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (<div key={index} className="flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (<Star key={i} className={`h-5 w-5 ${i < testimonial.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}/>))}
                  </div>
                  <p className="mt-4 text-base text-gray-500">{testimonial.content}</p>
                  <div className="mt-6 flex items-center">
                    <div className="flex-shrink-0">
                      <img className="h-10 w-10 rounded-full" src={testimonial.avatarUrl} alt={`${testimonial.name} avatar`}/>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </div>))}
          </div>
        </div>
      </div>
    </section>);
}
