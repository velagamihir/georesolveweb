import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MapPin, Users, TrendingUp, Shield } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      const user = JSON.parse(userStr);
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/citizen/dashboard');
      }
    }
  }, [navigate]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 opacity-70"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

        {/* Navigation */}
        <nav className="relative z-10 container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2.5 rounded-xl shadow-lg">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                GeoResolve
              </span>
            </div>
            <div className="flex space-x-3">
              <Button
                data-testid="nav-login-btn"
                variant="ghost"
                onClick={() => navigate('/login')}
                className="hover:bg-blue-50"
              >
                Login
              </Button>
              <Button
                data-testid="nav-register-btn"
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg"
              >
                Get Started
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-6 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Smart Rural Problem Reporting & Tracking System
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Empowering communities to report civic issues with geospatial tagging. Connecting citizens and authorities for faster resolution.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                data-testid="hero-get-started-btn"
                size="lg"
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-6 text-lg shadow-xl"
              >
                Report an Issue
              </Button>
              <Button
                data-testid="hero-admin-login-btn"
                size="lg"
                variant="outline"
                onClick={() => navigate('/login')}
                className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg"
              >
                Admin Login
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12">
            Why Choose GeoResolve?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<MapPin className="w-8 h-8 text-blue-500" />}
              title="GPS Location"
              description="Auto-detect location with precise GPS coordinates for accurate reporting"
            />
            <FeatureCard
              icon={<Users className="w-8 h-8 text-cyan-500" />}
              title="Community Driven"
              description="Citizens and authorities working together for better communities"
            />
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8 text-blue-500" />}
              title="Real-time Tracking"
              description="Track complaint status from submission to resolution"
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-cyan-500" />}
              title="Transparent System"
              description="Complete transparency with analytics and insights"
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-br from-blue-500 to-cyan-500">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-lg text-blue-50 mb-8 max-w-2xl mx-auto">
            Join thousands of citizens making their communities better, one report at a time.
          </p>
          <Button
            data-testid="cta-register-btn"
            size="lg"
            onClick={() => navigate('/register')}
            className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-6 text-lg shadow-xl"
          >
            Join Now
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; 2025 GeoResolve. Empowering rural communities.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-2xl hover:shadow-xl transition-all duration-300 border border-blue-100">
      <div className="bg-white p-3 rounded-xl w-fit mb-4 shadow-md">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
};

export default LandingPage;