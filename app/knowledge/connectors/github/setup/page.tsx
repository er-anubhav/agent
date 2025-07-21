'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, ArrowLeft, CheckCircle, Github, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function GitHubSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'config' | 'sync'>('config');
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState({
    repositories: [''],
    accessToken: '',
    includeDocs: true,
    includeWiki: true,
    includeReadme: true,
    branch: 'main'
  });

  const addRepository = () => {
    setConfig(prev => ({
      ...prev,
      repositories: [...prev.repositories, '']
    }));
  };

  const updateRepository = (index: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      repositories: prev.repositories.map((repo, i) => i === index ? value : repo)
    }));
  };

  const removeRepository = (index: number) => {
    setConfig(prev => ({
      ...prev,
      repositories: prev.repositories.filter((_, i) => i !== index)
    }));
  };

  const handleSync = async () => {
    const validRepos = config.repositories.filter(repo => repo.trim());
    
    if (validRepos.length === 0) {
      alert('Please add at least one repository.');
      return;
    }

    if (!config.accessToken.trim()) {
      alert('Please provide a GitHub access token.');
      return;
    }

    setIsLoading(true);
    setStep('sync');

    try {
      const response = await fetch('/api/connectors/github/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repositories: validRepos,
          accessToken: config.accessToken,
          options: {
            includeDocs: config.includeDocs,
            includeWiki: config.includeWiki,
            includeReadme: config.includeReadme,
            branch: config.branch
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Successfully synced ${data.syncedCount} documents from GitHub repositories!`);
        router.push('/knowledge/connectors');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      alert(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStep('config');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/knowledge/connectors">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Connectors
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl">Connect GitHub</h1>
          <p className="text-muted-foreground">
            Import documentation, README files, and wikis from your GitHub repositories
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-8 mb-8">
        {['Configuration', 'Sync'].map((stepName, index) => {
          const stepKey = ['config', 'sync'][index];
          const isActive = step === stepKey;
          const isCompleted = ['config'].indexOf(step) > ['config'].indexOf(stepKey);
          
          return (
            <div key={stepName} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${isCompleted ? 'bg-green-500 text-white' : 
                  isActive ? 'bg-blue-500 text-white' : 
                  'bg-gray-200 text-gray-600'}
              `}>
                {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
              </div>
              <span className={`ml-2 text-sm ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                {stepName}
              </span>
              {index < 1 && <div className="w-8 h-0.5 bg-gray-200 mx-4" />}
            </div>
          );
        })}
      </div>

      {/* Configuration Step */}
      {step === 'config' && (
        <div className="space-y-6">
          {/* Access Token */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="w-5 h-5" />
                GitHub Access Token
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900">Required Permissions:</p>
                    <ul className="text-sm text-amber-800 mt-2 space-y-1">
                      <li>• <code>repo</code> - Access to private repositories (if needed)</li>
                      <li>• <code>public_repo</code> - Access to public repositories</li>
                      <li>• <code>read:user</code> - Read user profile information</li>
                    </ul>
                    <div className="mt-3">
                      <a 
                        href="https://github.com/settings/tokens/new" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-amber-700 hover:text-amber-900"
                      >
                        Create a new token
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="token">Access Token</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={config.accessToken}
                  onChange={(e) => setConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Repositories */}
          <Card>
            <CardHeader>
              <CardTitle>Repositories</CardTitle>
              <p className="text-sm text-muted-foreground">
                Add the repositories you want to sync (format: owner/repo)
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.repositories.map((repo, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="octocat/Hello-World"
                    value={repo}
                    onChange={(e) => updateRepository(index, e.target.value)}
                  />
                  {config.repositories.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeRepository(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addRepository}
                className="w-full"
              >
                Add Repository
              </Button>
            </CardContent>
          </Card>

          {/* Options */}
          <Card>
            <CardHeader>
              <CardTitle>Sync Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Input
                    id="branch"
                    value={config.branch}
                    onChange={(e) => setConfig(prev => ({ ...prev, branch: e.target.value }))}
                    placeholder="main"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Include Content</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.includeReadme}
                      onChange={(e) => setConfig(prev => ({ ...prev, includeReadme: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">README files</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.includeDocs}
                      onChange={(e) => setConfig(prev => ({ ...prev, includeDocs: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Documentation folders (docs/, documentation/)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.includeWiki}
                      onChange={(e) => setConfig(prev => ({ ...prev, includeWiki: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Wiki pages</span>
                  </label>
                </div>
              </div>

              <Button
                onClick={handleSync}
                disabled={!config.accessToken.trim() || config.repositories.filter(r => r.trim()).length === 0}
                className="w-full"
                size="lg"
              >
                Start Sync
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sync Step */}
      {step === 'sync' && (
        <Card>
          <CardHeader>
            <CardTitle>Syncing Your Repositories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
              <div>
                <p className="font-medium">Importing your GitHub documentation...</p>
                <p className="text-sm text-muted-foreground">
                  Syncing {config.repositories.filter(r => r.trim()).length} repositories to your knowledge base
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
