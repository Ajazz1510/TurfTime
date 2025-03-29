import { useState } from "react";
import { ChevronDown } from "lucide-react";
const faqs = [
    {
        question: "When will TurfTime be available?",
        answer: "We're planning to launch TurfTime in Q3 2025. Join our waitlist to get early access and be the first to know when we go live."
    },
    {
        question: "Is there a free trial available?",
        answer: "Yes, all plans include a 14-day free trial so you can experience the full platform before committing. No credit card required to start."
    },
    {
        question: "What types of sports facilities can use TurfTime?",
        answer: "TurfTime is designed specifically for turf owners managing cricket, football, and badminton facilities. If you own or manage sports turfs and need to streamline your booking process, TurfTime is the perfect solution."
    },
    {
        question: "Can I integrate TurfTime with my existing website?",
        answer: "Absolutely! TurfTime provides a booking widget that can be easily embedded into your existing website. We also offer direct links to your booking page that you can share with players and teams."
    },
    {
        question: "What payment methods do you accept?",
        answer: "TurfTime accepts all major credit cards, including Visa, Mastercard, American Express, and Discover. We also support payments through PayPal and can integrate with popular payment processors."
    }
];
export default function FAQ() {
    const [openIndex, setOpenIndex] = useState(null);
    const toggleFaq = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };
    return (<section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-base font-semibold text-primary uppercase tracking-wide">FAQ</h2>
          <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-4xl">Common questions</p>
          <p className="mt-5 text-xl text-gray-500">Everything you need to know about the product and billing.</p>
        </div>

        <div className="mt-12 max-w-3xl mx-auto">
          <dl className="space-y-6 divide-y divide-gray-200">
            {faqs.map((faq, index) => (<div key={index} className="pt-6">
                <dt className="text-lg">
                  <button className="text-left w-full flex justify-between items-start text-gray-900" onClick={() => toggleFaq(index)} aria-expanded={openIndex === index}>
                    <span className="font-medium text-gray-900">{faq.question}</span>
                    <span className="ml-6 h-7 flex items-center">
                      <ChevronDown className={`h-6 w-6 transform ${openIndex === index ? "rotate-180" : "rotate-0"} transition-transform duration-200`}/>
                    </span>
                  </button>
                </dt>
                <dd className={`mt-2 pr-12 ${openIndex === index ? "block" : "hidden"}`}>
                  <p className="text-base text-gray-500">{faq.answer}</p>
                </dd>
              </div>))}
          </dl>
        </div>
      </div>
    </section>);
}
