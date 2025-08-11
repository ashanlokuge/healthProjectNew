import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../lib/supabase';
import { User, Shield, Users, Eye, EyeOff, Mail, Lock, AlertTriangle, Code } from 'lucide-react';

export function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, setDeveloperMode } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        console.log('Signing up with role:', role);
        await signUp(email, password, fullName, role);
      } else {
        await signIn(email, password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const roleConfig = {
    user: {
      icon: User,
      title: 'User',
      description: 'Report Hazards',
      color: 'blue',
      emoji: '👤'
    },
    reviewer: {
      icon: Shield,
      title: 'Reviewer',
      description: 'Review & Assign',
      color: 'emerald',
      emoji: '👨‍💼'
    },
    assignee: {
      icon: Users,
      title: 'Assignee',
      description: 'Complete Tasks',
      color: 'purple',
      emoji: '🔧'
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header Section */}
        <div className="text-center mb-8 animate-slide-in">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gradient mb-3">
            {isSignUp ? 'Join Our Team' : 'Welcome Back'}
          </h1>
          <p className="text-slate-600 text-lg font-medium">
            Hazard Reporting System
          </p>
          <p className="text-slate-500 text-sm mt-2">
            {isSignUp ? 'Create your account to get started' : 'Sign in to manage workplace safety'}
          </p>
        </div>

        {/* Developer Mode Button */}
        <div className="mb-6 animate-fade-in">
          <button
            onClick={() => setDeveloperMode(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 font-medium"
          >
            <Code className="w-5 h-5" />
            <span>Developer Mode</span>
          </button>
        </div>

        {/* Form Card */}
        <div className="card animate-slide-in">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-fade-in">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Full Name Field (Sign Up Only) */}
              {isSignUp && (
                <div className="animate-fade-in">
                  <label className="form-label">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="form-input pl-12"
                      placeholder="Enter your full name"
                      required={isSignUp}
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="form-label">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input pl-12"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="form-label">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input pl-12 pr-12"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Role Selection (Sign Up Only) */}
              {isSignUp && (
                <div className="animate-fade-in">
                  <label className="form-label mb-4">
                    <Shield className="w-4 h-4 inline mr-2" />
                    Choose Your Role
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {(['user', 'reviewer', 'assignee'] as UserRole[]).map((r) => {
                      const config = roleConfig[r];
                      const Icon = config.icon;
                      const isSelected = role === r;

                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          className={`p-4 border-2 rounded-xl flex items-center space-x-4 transition-all duration-200 ${isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSelected ? 'bg-blue-100' : 'bg-slate-100'
                            }`}>
                            <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-600' : 'text-slate-600'
                              }`} />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{config.emoji}</span>
                              <h3 className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-slate-900'
                                }`}>
                                {config.title}
                              </h3>
                              {isSelected && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                            <p className={`text-sm ${isSelected ? 'text-blue-700' : 'text-slate-600'
                              }`}>
                              {config.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-4 text-base font-semibold"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner w-5 h-5 mr-3"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    {isSignUp ? (
                      <>
                        <User className="w-5 h-5 mr-2" />
                        Create Account
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5 mr-2" />
                        Sign In
                      </>
                    )}
                  </div>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="card-footer text-center">
            <p className="text-slate-600 text-sm mb-3">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
            </p>
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors"
            >
              {isSignUp ? '← Back to Sign In' : 'Create New Account →'}
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl animate-fade-in">
          <div className="flex items-start">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">Secure & Confidential</h4>
              <p className="text-xs text-blue-700">
                Your data is protected with enterprise-grade security. All hazard reports are confidential and handled according to safety protocols.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}