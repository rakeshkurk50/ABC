import React from 'react';

interface Props {
  onContinue: () => void;
}

const Success: React.FC<Props> = ({ onContinue }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 p-6">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            ✅
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">Verification Successful!</h1>
        <p className="text-gray-600 mb-6">
          Your phone number has been successfully verified with Brave OTP. You can now continue to your account.
        </p>
        <button
          onClick={onContinue}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default Success;
