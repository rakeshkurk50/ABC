import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import * as api from '../Api';

interface SignupProps {
  onSwitchToLogin: () => void;
  onSignupSuccess: (mobile: string) => void;
}

const Signup: React.FC<SignupProps> = ({ onSwitchToLogin, onSignupSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    street: '',
    city: '',
    state: '',
    country: '',
    loginId: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [existingUsers, setExistingUsers] = useState<any[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  useEffect(() => {
    // load existing users once for client-side uniqueness checks (dev/demo only)
    let mounted = true;
    (async () => {
      try {
        const res = await api.getAllUsers();
        if (mounted && res && res.data) setExistingUsers(res.data);
      } catch (err) {
        // ignore errors — server will enforce uniqueness on submit
      }
    })();
    return () => { mounted = false; };
  }, []);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
  
    // Names: Only alphabets, spaces, apostrophes, hyphens allowed
    const nameRegex = /^[A-Za-z\s'-]+$/;
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (!nameRegex.test(formData.firstName)) {
      newErrors.firstName = 'First name can only contain letters, spaces, apostrophes, and hyphens';
    }
  
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (!nameRegex.test(formData.lastName)) {
      newErrors.lastName = 'Last name can only contain letters, spaces, apostrophes, and hyphens';
    }
  
    // Mobile number: only digits allowed, exactly 10 digits
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else {
      const digits = formData.mobile.replace(/\D/g, ''); // remove non-digit chars
      if (digits.length !== 10) {
        newErrors.mobile = 'Mobile number must be exactly 10 digits';
      } else if (
        existingUsers.some(
          (u: any) => (u.mobile || '') === formData.mobile || (u.mobile || '') === digits
        )
      ) {
        newErrors.mobile = 'Mobile number already in use';
      }
    }
  
    // Email: validate standard email format
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (
      existingUsers.some(
        (u: any) => (u.email || '').toLowerCase() === formData.email.toLowerCase()
      )
    ) {
      newErrors.email = 'Email already in use';
    }
  
    // Street Address: allow alphanumeric, spaces, commas, periods, hyphens
    // (Common address chars, but no special chars like #, $, etc.)
    if (!formData.street.trim()) {
      newErrors.street = 'Street address is required';
    } else if (!/^[a-zA-Z0-9\s,.'-]+$/.test(formData.street)) {
      newErrors.street = 'Street address contains invalid characters';
    }
  
    // City: alphabets and spaces only (like names)
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    } else if (!/^[A-Za-z\s'-]+$/.test(formData.city)) {
      newErrors.city = 'City can only contain letters, spaces, apostrophes, and hyphens';
    }
  
    // State: alphabets and spaces only
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    } else if (!/^[A-Za-z\s'-]+$/.test(formData.state)) {
      newErrors.state = 'State can only contain letters, spaces, apostrophes, and hyphens';
    }
  
    // Country: alphabets and spaces only
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    } else if (!/^[A-Za-z\s'-]+$/.test(formData.country)) {
      newErrors.country = 'Country can only contain letters, spaces, apostrophes, and hyphens';
    }
  
    // Login ID: alphanumeric, underscore, dot, hyphen; at least 3 chars
    const loginIdRegex = /^[a-zA-Z0-9_.-]{3,}$/;
    if (!formData.loginId.trim()) {
      newErrors.loginId = 'Login ID is required';
    } else if (!loginIdRegex.test(formData.loginId)) {
      newErrors.loginId =
        'Login ID must be at least 3 characters and can contain letters, numbers, underscore, dot, and hyphen';
    } else if (
      existingUsers.some(
        (u: any) => (u.loginId || '').toLowerCase() === formData.loginId.toLowerCase()
      )
    ) {
      newErrors.loginId = 'Login ID already taken';
    }
  
    // Password: minimum 6 chars, at least 1 uppercase letter
    const passwordRegex = /^(?=.*[A-Z]).{6,}$/;
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password =
        'Password must be at least 6 characters and contain at least one uppercase letter';
    }
  
    // Confirm Password: must match password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const res = await api.signup(formData);
      // If backend indicates success (OTP sent), proceed to OTP step
        if (res && res.success) {
          // Pass both mobile and email for OTP verification
          onSignupSuccess(formData.mobile, formData.email);
      } else if (res && res.message) {
        setErrors({ general: res.message });
      } else {
        setErrors({ general: 'Signup failed' });
      }
    } catch (err) {
      setErrors({ general: 'Signup failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
          <p className="text-gray-600">Join us today and get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.firstName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="First name"
                />
              </div>
              {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.lastName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Last name"
                />
              </div>
              {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
            </div>
          </div>

          {/* Contact Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  id="mobile"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.mobile ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              {errors.mobile && <p className="mt-1 text-sm text-red-600">{errors.mobile}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="your@email.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
          </div>

          {/* Address Fields */}
          <div>
            <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">
              Street Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                id="street"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.street ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="123 Main Street"
              />
            </div>
            {errors.street && <p className="mt-1 text-sm text-red-600">{errors.street}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.city ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="City"
              />
              {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.state ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="State"
              />
              {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.country ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Country"
              />
              {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
            </div>
          </div>

          {/* Login Credentials */}
          <div>
            <label htmlFor="loginId" className="block text-sm font-medium text-gray-700 mb-2">
              Login ID
            </label>
            <input
              type="text"
              id="loginId"
              name="loginId"
              value={formData.loginId}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                errors.loginId ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Choose a unique login ID"
            />
            {errors.loginId && <p className="mt-1 text-sm text-red-600">{errors.loginId}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pr-12 pl-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full pr-12 pl-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>
          </div>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Signup Failed</h3>
                  <p className="text-sm text-red-700 mt-1">{errors.general}</p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition duration-200 disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="ml-2" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Login here
          </button>
        </p>
      </div>
    </div>
  );
};

export default Signup;
