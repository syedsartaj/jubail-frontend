import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sun, Waves, Ticket } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <div className="relative bg-slate-900 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=2070&auto=format&fit=crop" 
            alt="Kayaking Background" 
            className="w-full h-full object-cover opacity-40"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-48">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Experience the Wild <br/> 
            <span className="text-teal-400">RiverRun Adventures</span>
          </h1>
          <p className="max-w-xl text-lg md:text-xl text-gray-200 mb-10">
            Book your park entry tickets and kayaking slots online. Skip the line and dive straight into nature.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/shop">
              <Button size="lg" className="w-full sm:w-auto">
                Book Adventure <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/my-bookings">
              <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent text-white border-white hover:bg-white hover:text-slate-900">
                View My Bookings
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Why Choose RiverRun?</h2>
            <p className="mt-4 text-gray-600">We offer the best outdoor experiences for families and thrill-seekers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center p-6 bg-gray-50 rounded-2xl">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Ticket className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Instant E-Tickets</h3>
              <p className="text-gray-600">Get your QR code instantly. Scan at the gate and you are in.</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-2xl">
              <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Waves className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Premium Kayaking</h3>
              <p className="text-gray-600">High-quality single and double kayaks available for hourly rental.</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-2xl">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sun className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Beautiful Scenery</h3>
              <p className="text-gray-600">Explore over 5 miles of pristine river and lush parklands.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;