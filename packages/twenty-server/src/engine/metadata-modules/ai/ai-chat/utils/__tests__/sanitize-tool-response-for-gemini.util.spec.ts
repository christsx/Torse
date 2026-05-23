import { sanitizeToolResponseForGemini } from 'src/engine/metadata-modules/ai/ai-chat/utils/sanitize-tool-response-for-gemini.util';

describe('sanitizeToolResponseForGemini', () => {
  it('should remove $defs and replace $ref nodes', () => {
    const input = {
      type: 'object',
      properties: {
        nested: { $ref: '#/$defs/__schema0' },
      },
      $defs: {
        __schema0: { type: 'string' },
      },
    };

    expect(sanitizeToolResponseForGemini(input)).toEqual({
      type: 'object',
      properties: {
        nested: {
          type: 'object',
          description:
            'Nested schema reference removed for Gemini tool response compatibility',
        },
      },
    });
  });
});
