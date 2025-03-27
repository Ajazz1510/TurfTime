import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Hero() {
  return (
    <section className="relative bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:w-full lg:pb-28 xl:pb-32">
          <div className="pt-10 sm:pt-16 lg:pt-8 lg:pb-14 lg:overflow-hidden">
            <div className="mx-auto max-w-7xl lg:px-8">
              <div className="lg:grid lg:grid-cols-2 lg:gap-8">
                <div className="mx-auto max-w-md px-4 sm:max-w-2xl sm:px-6 sm:text-center lg:px-0 lg:text-left lg:flex lg:items-center">
                  <div className="lg:py-24">
                    <h1 className="mt-4 text-4xl tracking-tight font-extrabold text-gray-900 sm:mt-5 sm:text-5xl lg:mt-6 xl:text-5xl">
                      <span className="block">Simplify your</span>
                      <span className="block text-primary">booking experience</span>
                    </h1>
                    <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                      BookEasy is a powerful platform that streamlines booking management for businesses and provides a seamless experience for customers. Join our waitlist to be the first to know when we launch.
                    </p>
                    <div className="mt-10 sm:mt-12">
                      {/* Mobile CTA */}
                      <div className="sm:hidden">
                        <Button asChild className="w-full">
                          <a href="#waitlist">Join the Waitlist</a>
                        </Button>
                        <p className="mt-3 text-sm text-gray-500 text-center">
                          No credit card required. Join the waitlist to get early access.
                        </p>
                      </div>
                      {/* Desktop CTA */}
                      <div className="hidden sm:block">
                        <div className="flex items-center justify-center lg:justify-start">
                          <Button asChild>
                            <a href="#waitlist">Join the Waitlist</a>
                          </Button>
                          <Button variant="link" asChild>
                            <a href="#how-it-works" className="ml-4 text-base font-medium text-gray-500 hover:text-gray-900">
                              Learn more →
                            </a>
                          </Button>
                        </div>
                        <p className="mt-3 text-sm text-gray-500">
                          No credit card required. Join the waitlist to get early access.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-12 -mb-16 sm:-mb-48 lg:m-0 lg:relative">
                  <div className="mx-auto max-w-md px-4 sm:max-w-2xl sm:px-6 lg:max-w-none lg:px-0">
                    <img
                      className="w-full lg:absolute lg:inset-y-0 lg:left-0 lg:h-full lg:w-auto lg:max-w-none rounded-lg shadow-xl"
                      src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                      alt="BookEasy dashboard preview"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
