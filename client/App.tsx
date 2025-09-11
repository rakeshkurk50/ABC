import { useState } from 'react';
import React from 'react';
import Login from './components/Login';
import Signup from './components/Signup';
import OTPVerification from './components/OTPVerification';
import Success from './components/Success';
import AllUsers from './components/AllUsers';

type AuthStep = 'login' | 'signup' | 'otp' | 'success';
type AuthStepExtended = AuthStep | 'users';

function App() {
  const [currentStep, setCurrentStep] = useState<AuthStepExtended>('login');
  const [userMobile, setUserMobile] = useState('');

  const handleSwitchToSignup = () => {
    setCurrentStep('signup');
  };

  const handleSwitchToLogin = () => {
    setCurrentStep('login');
  };

  const handleLoginSuccess = (loginId: string) => {
    console.log('Login successful for:', loginId);
    setCurrentStep('success');
  };

  const handleViewAllUsers = () => {
    setCurrentStep('users');
  };

  const handleSignupSuccess = (mobile: string) => {
    // After signup, go to OTP verification step
    setUserMobile(mobile);
    setCurrentStep('otp');
  };

  const handleOTPVerificationSuccess = () => {
    // After successful OTP verification, return user to login to sign in
    setUserMobile('');
    setCurrentStep('login');
  };

  const handleGoBackToLogin = () => {
    setCurrentStep('login');
  };

  const handleGoBackToSignup = () => {
    setCurrentStep('signup');
  };

  const handleContinueToDashboard = () => {
    // Navigate to users view after success
    setCurrentStep('users');
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'login':
        return (
          <Login
            onSwitchToSignup={handleSwitchToSignup}
            onLoginSuccess={handleLoginSuccess}
            onViewAllUsers={handleViewAllUsers}
          />
        );
      case 'signup':
        return (
          <Signup
            onSwitchToLogin={handleSwitchToLogin}
            onSignupSuccess={handleSignupSuccess}
          />
        );
      case 'otp':
        return (
          <OTPVerification
            mobile={userMobile}
            onVerificationSuccess={handleOTPVerificationSuccess}
            onGoBack={handleGoBackToSignup}
          />
        );
      case 'success':
        return (
          <Success onContinue={handleContinueToDashboard} onBack={handleGoBackToLogin} />
        );
      case 'users':
        return <AllUsers onGoBack={() => setCurrentStep('success')} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {renderCurrentStep()}
      </div>
    </div>
  );
}

export default App;