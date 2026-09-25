import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wheat, ShieldCheck, ArrowRight, Sparkles, HeartHandshake, Building2, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/Button';
import api from '../services/api';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@zerohunger.org');
  const [password, setPassword] = useState('admin123');
  const [selectedRole, setSelectedRole] = useState('admin');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (isRegisterMode) {
        // Register new account via real backend API
        const res = await api.post('/auth/register', {
          name: name || 'Coordinator',
          email,
          password,
          role: selectedRole,
        });

        if (res.data?.success && res.data?.token) {
          login({
            token: res.data.token,
            user: res.data.user,
          });
          navigate('/dashboard');
        } else {
          throw new Error(res.data?.message || 'Registration failed');
        }
      } else {
        // Log in via real backend API
        const res = await api.post('/auth/login', {
          email,
          password,
        });

        if (res.data?.success && res.data?.token) {
          login({
            token: res.data.token,
            user: res.data.user,
          });
          navigate('/dashboard');
        } else {
          throw new Error(res.data?.message || 'Authentication failed');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Authentication error. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSelect = (role, demoEmail, demoPassword) => {
    setSelectedRole(role);
    setEmail(demoEmail);
    setPassword(demoPassword || 'admin123');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F8FA] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background futuristic light ambient glows */}
      <div className="absolute top-1/6 left-1/5 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/6 right-1/5 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 shadow-xl shadow-cyan-500/20 mb-4 border border-cyan-300">
            <Wheat className="w-9 h-9 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Smart Food Allocation
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-cyan-200 text-cyan-800 text-xs font-bold shadow-xs mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Hack Odyssey 4.0 &bull; SDG 2 Zero Hunger</span>
          </div>
        </div>

        {/* Login Card (Light Theme Glassmorphism) */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isRegisterMode ? 'Create New Account' : 'Access Command Portal'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {isRegisterMode
                  ? 'Register as coordinator, donor, or shelter leader'
                  : 'Log in to manage surplus, demand, and dynamic allocation.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setErrorMessage(null);
              }}
              className="text-xs font-bold text-cyan-600 hover:text-cyan-700 underline"
            >
              {isRegisterMode ? 'Have an account?' : 'Register'}
            </button>
          </div>

          {/* Error notice */}
          {errorMessage && (
            <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Demo Personas (only shown in Login mode) */}
          {!isRegisterMode && (
            <div className="mb-6">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                Quick Demo Personas
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoSelect('admin', 'admin@zerohunger.org', 'admin123')}
                  className={`p-2.5 rounded-xl text-xs font-bold border text-center transition-all ${
                    selectedRole === 'admin'
                      ? 'bg-cyan-50 border-cyan-400 text-cyan-800 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-cyan-600" />
                  Administrator (Lead)
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoSelect('coordinator', 'coordinator@zerohunger.org', 'coordinator123')}
                  className={`p-2.5 rounded-xl text-xs font-bold border text-center transition-all ${
                    selectedRole === 'coordinator'
                      ? 'bg-cyan-50 border-cyan-400 text-cyan-800 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <Sparkles className="w-4 h-4 mx-auto mb-1 text-teal-600" />
                  Coordinator
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoSelect('donor', 'donor@greenmarket.com', 'donor123')}
                  className={`p-2.5 rounded-xl text-xs font-bold border text-center transition-all ${
                    selectedRole === 'donor'
                      ? 'bg-cyan-50 border-cyan-400 text-cyan-800 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <Building2 className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                  Food Donor
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoSelect('shelter', 'shelter@hopevalley.org', 'shelter123')}
                  className={`p-2.5 rounded-xl text-xs font-bold border text-center transition-all ${
                    selectedRole === 'shelter'
                      ? 'bg-cyan-50 border-cyan-400 text-cyan-800 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <HeartHandshake className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                  Relief Shelter
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegisterMode && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/10 transition-all"
                  placeholder="e.g. Dr. Jane Smith"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Registered Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/10 transition-all"
                placeholder="you@domain.org"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/10 transition-all"
                placeholder="Enter password"
              />
            </div>

            {isRegisterMode && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  User Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white"
                >
                  <option value="admin">Administrator</option>
                  <option value="coordinator">Logistics Coordinator</option>
                  <option value="donor">Food Donor</option>
                  <option value="shelter">Relief Shelter Leader</option>
                </select>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2"
            >
              <span>{isRegisterMode ? 'Register & Enter Portal' : 'Launch Operations Portal'}</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Secured with JWT & Role-Based Access Control
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
