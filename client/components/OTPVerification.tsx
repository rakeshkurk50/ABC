import React, { useState } from 'react';
import * as api from '../Api';

interface Props {
  mobile: string;
  email: string;
  onVerificationSuccess: () => void;
  onGoBack: () => void;
}

const OTPVerification: React.FC<Props> = ({ mobile, email, onVerificationSuccess, onGoBack }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const res = await api.verifyOtp(mobile, otp);
      if (res && res.success) {
        onVerificationSuccess();
      } else {
        setError(res && res.message ? res.message : 'Invalid OTP');
      }
    } catch (err) {
      setError('Network error while verifying OTP');
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setError('');
    setInfo('');
    try {
      const res = await api.resendOtp(mobile);
      if (res && res.success) {
        setInfo('A new OTP has been sent to your phone via Brave.');
      } else {
        setError(res && res.message ? res.message : 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Network error while resending OTP');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h3 className="text-xl font-semibold mb-4">Enter OTP</h3>
      <p className="text-sm text-gray-600 mb-2">
        We have sent an OTP to your email: <strong>{email}</strong>
      </p>
      <p className="text-xs text-gray-500 mb-4">
        Please check your email inbox and enter the 6-digit OTP below
      </p>
      <input
        type="text"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        placeholder="Enter 6-digit OTP"
        className="w-full border p-2 rounded mb-3"
      />
      {error && <p className="text-red-600 mb-2">{error}</p>}
      {info && <p className="text-green-600 mb-2">{info}</p>}
      <button
        onClick={handleVerify}
        className="w-full bg-blue-600 text-white py-2 rounded mb-2"
        disabled={loading}
      >
        {loading ? 'Verifying...' : 'Verify OTP'}
      </button>
      <button onClick={handleResend} className="w-full bg-gray-200 py-2 rounded mb-2">
        Resend OTP
      </button>
      <button onClick={onGoBack} className="w-full bg-gray-100 py-2 rounded">
        Go Back
      </button>
    </div>
  );
};

export default OTPVerification;
