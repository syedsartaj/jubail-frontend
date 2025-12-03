import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../../services/auth';
import { Button } from '../../components/ui/Button';
import { Anchor } from 'lucide-react';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    
    const user = await AuthService.register(name, email, password);
    setLoading(false);
    
    if (user) {
      navigate('/shop'); // Redirect to shop after signup
    } else {
      setError('Email already registered or invalid data');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <Link to="/">
            <div className="bg-teal-100 p-3 rounded-full text-teal-600 mb-4">
              <Anchor size={32} />
            </div>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900">Create Account</h2>
          <p className="text-gray-500">Join RiverRun Adventures today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border-slate-400 bg-white border rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-sm"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border-slate-400 bg-white border rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-sm"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border-slate-400 bg-white border rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Confirm Password</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full border-slate-400 bg-white border rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-sm"
              required
            />
          </div>

          <Button type="submit" className="w-full" size="lg" isLoading={loading}>
            Sign Up
          </Button>

          <div className="text-center text-sm text-gray-600 mt-4">
            Already have an account? <Link to="/login" className="text-teal-600 font-bold hover:underline">Log in</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;