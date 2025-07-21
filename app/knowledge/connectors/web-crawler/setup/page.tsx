'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, ArrowLeft, CheckCircle, Globe, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function WebCrawlerSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'config' | 'crawl'>('config');
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState({
    startUrls: [''],
    maxDepth: 2,
    maxPages: 50,
    allowedDomains: [''],
    excludePatterns: '',
    includePatterns: '',
    respectRobots: true,
    delay: 1000
  });

  const addUrl = () => {
    setConfig(prev => ({
      ...prev,
      startUrls: [...prev.startUrls, '']
    }));
  };

  const updateUrl = (index: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      startUrls: prev.startUrls.map((url, i) => i === index ? value : url)
    }));
  };

  const removeUrl = (index: number) => {
    setConfig(prev => ({
      ...prev,
      startUrls: prev.startUrls.filter((_, i) => i !== index)
    }));
  };

  const addDomain = () => {
    setConfig(prev => ({
      ...prev,
      allowedDomains: [...prev.allowedDomains, '']
    }));
  };

  const updateDomain = (index: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      allowedDomains: prev.allowedDomains.map((domain, i) => i === index ? value : domain)
    }));
  };

  const removeDomain = (index: number) => {
    setConfig(prev => ({
      ...prev,
      allowedDomains: prev.allowedDomains.filter((_, i) => i !== index)
    }));
  };

  const handleCrawl = async () => {
    const validUrls = config.startUrls.filter(url => url.trim());
    const validDomains = config.allowedDomains.filter(domain => domain.trim());
    
    if (validUrls.length === 0) {
      alert('Please add at least one starting URL.');
      return;
    }

    setIsLoading(true);
    setStep('crawl');

    try {
      const response = await fetch('/api/connectors/web-crawler/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startUrls: validUrls,
          options: {
            maxDepth: config.maxDepth,
            maxPages: config.maxPages,
            allowedDomains: validDomains.length > 0 ? validDomains : undefined,
            excludePatterns: config.excludePatterns ? config.excludePatterns.split('\n').filter(p => p.trim()) : undefined,
            includePatterns: config.includePatterns ? config.includePatterns.split('\n').filter(p => p.trim()) : undefined,
            respectRobots: config.respectRobots,
            delay: config.delay
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Successfully crawled and indexed ${data.crawledCount} pages!`);
        router.push('/knowledge/connectors');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Crawl failed');
      }
    } catch (error) {
      console.error('Crawl failed:', error);
      alert(`Crawl failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          <h1 className="text-3xl">Setup Web Crawler</h1>
          <p className="text-muted-foreground">
            Crawl and index websites to add their content to your knowledge base
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-8 mb-8">
        {['Configuration', 'Crawl'].map((stepName, index) => {
          const stepKey = ['config', 'crawl'][index];
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
          {/* Warning */}
          <Card>
            <CardContent className="p-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900">Important Guidelines:</p>
                    <ul className="text-sm text-amber-800 mt-2 space-y-1">
                      <li>• Only crawl websites you own or have permission to crawl</li>
                      <li>• Respect robots.txt files and rate limits</li>
                      <li>• Be mindful of the website's server resources</li>
                      <li>• Some sites may block automated crawling</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Starting URLs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Starting URLs
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Add the URLs where the crawler should start
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.startUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="https://docs.example.com"
                    value={url}
                    onChange={(e) => updateUrl(index, e.target.value)}
                  />
                  {config.startUrls.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeUrl(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addUrl}
                className="w-full"
              >
                Add URL
              </Button>
            </CardContent>
          </Card>

          {/* Crawl Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Crawl Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxDepth">Max Depth</Label>
                  <Input
                    id="maxDepth"
                    type="number"
                    min="1"
                    max="10"
                    value={config.maxDepth}
                    onChange={(e) => setConfig(prev => ({ ...prev, maxDepth: parseInt(e.target.value) || 2 }))}
                  />
                  <p className="text-xs text-muted-foreground">How many links deep to follow</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPages">Max Pages</Label>
                  <Input
                    id="maxPages"
                    type="number"
                    min="1"
                    max="1000"
                    value={config.maxPages}
                    onChange={(e) => setConfig(prev => ({ ...prev, maxPages: parseInt(e.target.value) || 50 }))}
                  />
                  <p className="text-xs text-muted-foreground">Maximum number of pages to crawl</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delay">Delay Between Requests (ms)</Label>
                <Input
                  id="delay"
                  type="number"
                  min="100"
                  max="10000"
                  value={config.delay}
                  onChange={(e) => setConfig(prev => ({ ...prev, delay: parseInt(e.target.value) || 1000 }))}
                />
                <p className="text-xs text-muted-foreground">Time to wait between requests to be respectful</p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.respectRobots}
                    onChange={(e) => setConfig(prev => ({ ...prev, respectRobots: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Respect robots.txt</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Domain Restrictions */}
          <Card>
            <CardHeader>
              <CardTitle>Domain Restrictions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Limit crawling to specific domains (optional)
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.allowedDomains.map((domain, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="docs.example.com"
                    value={domain}
                    onChange={(e) => updateDomain(index, e.target.value)}
                  />
                  {config.allowedDomains.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeDomain(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addDomain}
                className="w-full"
              >
                Add Domain
              </Button>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>URL Filters</CardTitle>
              <p className="text-sm text-muted-foreground">
                Use patterns to include or exclude specific URLs (one per line)
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="includePatterns">Include Patterns (optional)</Label>
                <Textarea
                  id="includePatterns"
                  placeholder="**/docs/**&#10;**/documentation/**"
                  value={config.includePatterns}
                  onChange={(e) => setConfig(prev => ({ ...prev, includePatterns: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="excludePatterns">Exclude Patterns (optional)</Label>
                <Textarea
                  id="excludePatterns"
                  placeholder="**/admin/**&#10;**/private/**"
                  value={config.excludePatterns}
                  onChange={(e) => setConfig(prev => ({ ...prev, excludePatterns: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleCrawl}
            disabled={config.startUrls.filter(url => url.trim()).length === 0}
            className="w-full"
            size="lg"
          >
            Start Crawling
          </Button>
        </div>
      )}

      {/* Crawl Step */}
      {step === 'crawl' && (
        <Card>
          <CardHeader>
            <CardTitle>Crawling Websites</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
              <div>
                <p className="font-medium">Crawling and indexing web pages...</p>
                <p className="text-sm text-muted-foreground">
                  Starting from {config.startUrls.filter(url => url.trim()).length} URLs, max depth: {config.maxDepth}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
