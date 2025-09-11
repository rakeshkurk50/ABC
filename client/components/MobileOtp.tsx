import React, { useState } from 'react';
import OTPVerification from './OTPVerification';
import * as api from '../api';

// Simple component to collect mobile number, call sendOtp, then show OTPVerification
const MobileOtp: React.FC = () => {
  const [mobile, setMobile] = useState('');
  const [step, setStep] = useState<'collect' | 'verify' | 'done'>('collect');
  const [error, setError] = useState('');

  const handleSend = async () => {
    setError('');

    // Basic validation for Indian numbers: expect +91 followed by 10 digits or 10 digits
    const trimmed = mobile.trim();
    const normalized = trimmed.startsWith('+') ? trimmed : trimmed.length === 10 ? `+91${trimmed}` : trimmed;
    if (!/^\+91[0-9]{10}$/.test(normalized)) {
      setError('Please enter a valid Indian number, e.g. +919876543210 or 9876543210');
      return;
    }

    try {
      const res = await api.sendOtp(normalized);
      if (res && res.success) {
        // If Twilio isn't configured the API returns the code; in that case we still proceed to verification
        setStep('verify');
      } else {
        setError(res && res.message ? res.message : 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network error while sending OTP');
    }
  };

  const handleVerified = () => {
    setStep('done');
  };

  if (step === 'verify') {
    return (
      <OTPVerification
        mobile={mobile.startsWith('+') ? mobile : `+91${mobile}`}
        onVerificationSuccess={handleVerified}
        onGoBack={() => setStep('collect')}
      />
    );
  }

  if (step === 'done') {
    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold">Phone verified</h3>
        <p className="text-sm text-gray-600">You have successfully verified your phone number.</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h3 className="text-xl font-semibold mb-4">Verify your phone</h3>
      <input
        type="text"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
        placeholder="Enter phone (+919876543210 or 9876543210)"
        className="w-full border p-2 rounded mb-3"
      />
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <button onClick={handleSend} className="w-full bg-blue-600 text-white py-2 rounded">Send OTP</button>
    </div>
  );
};

export default MobileOtp;


