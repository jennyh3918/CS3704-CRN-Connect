import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SignupPage = () => {
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (session) return <Navigate to="/" />;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.toLowerCase().endsWith('@vt.edu')) {
      setError('A valid @vt.edu email address is required to sign up.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else alert('Check your email for confirmation!');
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-slate-50 text-slate-900 px-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <h1 className="text-3xl font-extrabold mb-2 text-center text-slate-900 tracking-tight">Create an account</h1>
        <p className="text-slate-500 text-center mb-8">Join the community and connect via CRNs</p>
        
        <form onSubmit={handleSignUp} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700 ml-1">Email address</label>
            <input
              type="email"
              placeholder="name@university.edu"
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 p-3.5 rounded-xl font-bold text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
          
          <div className="text-center mt-2">
            <span className="text-slate-500 text-sm">Already have an account? </span>
            <Link to="/login" className="text-blue-600 text-sm font-bold hover:underline">
              Log in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
