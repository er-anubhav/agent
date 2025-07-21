import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { AlertCircle, Shield } from 'lucide-react';

interface UserKnowledgeGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function UserKnowledgeGuard({ children, fallback }: UserKnowledgeGuardProps) {
  const { data: session, status } = useSession();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (status === 'unauthenticated' && fallback) {
    return <>{fallback}</>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-center mb-4">
          <Shield className="h-6 w-6 text-amber-600 mr-2" />
          <h3 className="text-lg font-semibold text-amber-800">
            Personal Knowledge Base
          </h3>
        </div>
        <div className="text-amber-700 mb-4">
          <p className="mb-2">
            This application provides a personal knowledge base where your documents 
            are private and only accessible to you.
          </p>
          <p className="mb-2">
            <strong>Key Features:</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Upload and index your personal documents</li>
            <li>Ask questions about your uploaded content</li>
            <li>Your data is isolated from other users</li>
            <li>Secure, user-specific knowledge retrieval</li>
          </ul>
        </div>
        <div className="flex items-center p-3 bg-amber-100 border border-amber-300 rounded">
          <AlertCircle className="h-4 w-4 text-amber-600 mr-2 flex-shrink-0" />
          <span className="text-sm text-amber-800">
            Please sign in to access your personal knowledge base and start uploading documents.
          </span>
        </div>
      </div>
    );
  }

  if (session?.user) {
    return (
      <div>
        {showWarning && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <Shield className="h-4 w-4 text-green-600 mr-2" />
              <span className="text-sm text-green-700">
                Welcome! You now have access to your personal knowledge base.
              </span>
            </div>
          </div>
        )}
        {children}
      </div>
    );
  }

  return null;
}

export default UserKnowledgeGuard;
