# TurfTime - Sports Turf Booking Platform

TurfTime is a comprehensive sports turf booking platform that enables seamless scheduling and management for sports venues and athletes, with advanced pricing and booking flexibility.

## Features

- Role-based authentication system (Customer/Owner)
- Comprehensive turf management for owners
- Easy booking system for customers with flexible time selection
- Hourly pricing calculation with rounded-up hour increments
- Integrated payment processing
- Geolocation to find nearby turfs
- Team management and player count tracking
- Mobile responsive design

## Tech Stack

- TypeScript-based full-stack application
- PostgreSQL database for robust data management
- Express.js backend with comprehensive API endpoints
- React frontend with Tailwind CSS for responsive design
- Authentication with secure session management

## Payment System

TurfTime includes a simulated payment system that's ready for integration with a real payment gateway:

- Supports multiple payment methods (UPI, Net Banking, Card, Digital Wallets)
- Shows booking details and calculated prices
- Generates unique service IDs for transactions
- Status tracking from payment_pending to confirmed

For integrating a real payment gateway, see the [Payment Gateway Integration Guide](docs/PAYMENT_GATEWAY_INTEGRATION.md).

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and configure environment variables
3. Install dependencies: `npm install`
4. Start the development server: `npm run dev`

## Usage

### For Customers
- Register as a customer
- Browse available turfs and slots
- Select a time slot and specify booking details
- Make payment to confirm booking
- View booking history and details

### For Turf Owners
- Register as an owner
- Add and manage your turfs
- Create and manage available time slots
- View and manage bookings
- Track payment status

## License

This project is licensed under the MIT License - see the LICENSE file for details.