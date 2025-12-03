import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthService } from '../../services/auth';
import { Button } from '../../components/ui/Button';
import { Anchor } from 'lucide-react';

const CustomerLogin: React.FC = () => {
  const [email, setEmail] = useState('customer@riverrun.com');
  const [password, setPassword] = useState('secret');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const user = await AuthService.login(email, password);
    setLoading(false);
    
    if (user) {
      navigate(from, { replace: true });
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <Link to="/">
            <div className="bg-indigo-100 p-3 rounded-full text-indigo-600 mb-4">
              <Anchor size={32} />
            </div>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
          <p className="text-gray-500">Sign in to view your bookings</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border-slate-400 bg-white border rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border-slate-400 bg-white border rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              required
            />
          </div>

          <Button type="submit" className="w-full" size="lg" isLoading={loading}>
            Sign In
          </Button>

          <div className="text-center text-sm text-gray-600 mt-4">
            Don't have an account? <Link to="/register" className="text-indigo-600 font-bold hover:underline">Sign up</Link>
          </div>
          
          <div className="text-center text-xs text-gray-400 mt-2">
            Test Account: customer@riverrun.com / secret
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerLogin;