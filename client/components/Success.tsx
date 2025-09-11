import React from 'react';
import { CheckCircle, ArrowRight, User } from 'lucide-react';

interface SuccessProps {
  onContinue: () => void;
  onBack?: () => void;
}

const Success: React.FC<SuccessProps> = ({ onContinue, onBack }) => {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
        <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome!</h2>
        <p className="text-gray-600 mb-8">
          Your account is ready. Click below to go to your dashboard.
        </p>

        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
          <ul className="text-left space-y-3">
            <li className="flex items-center text-gray-700">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              Complete your profile setup
            </li>
            <li className="flex items-center text-gray-700">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              Explore our features and services
            </li>
            <li className="flex items-center text-gray-700">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              Connect with the community
            </li>
          </ul>
        </div>

        <div className="flex gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Back to Login
            </button>
          )}
          <button
            onClick={onContinue}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
          >
            <User className="mr-2 w-5 h-5" />
            Go to Dashboard
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Success;