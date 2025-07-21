/**
 * Utility function for generating mock response chunks in tests
 */
export function getResponseChunksByPrompt(prompt: any, includeTools?: boolean) {
  // Simple mock response chunks for testing
  const baseChunks = [
    { type: 'text', text: 'Hello' },
    { type: 'text', text: ', ' },
    { type: 'text', text: 'world!' },
  ];

  if (includeTools) {
    return [
      ...baseChunks,
      { type: 'tool', toolName: 'test-tool', args: {} },
    ];
  }

  return baseChunks;
}
