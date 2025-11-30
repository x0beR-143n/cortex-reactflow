/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { runScriptNode, runConditionNode, runAINode } from "../engine/nodeRunner";

// --- mock GeminiAI để không gọi API thật ---
jest.mock('../engine/gemini', () => {
  return {
    GeminiAI: jest.fn().mockImplementation(() => ({
      generate: jest.fn().mockResolvedValue('MOCK_AI_RESULT'),
    })),
  };
});

describe('nodeRunner - runScriptNode', () => {
  it('trả về cùng data nếu không có script', async () => {
    const input = { a: 1, b: 2 };

    const out = await runScriptNode(undefined, input);

    expect(out).toEqual(input);
  });

  it('chạy script dạng expression và trả về object mới', async () => {
    const input = { a: 1, b: 2 };

    const out = await runScriptNode('{ sum: data.a + data.b }', input);

    expect(out).toEqual({ sum: 3 });
  });

  it('throw nếu input không phải object', async () => {
    // @ts-expect-error cố tình truyền sai để test
    await expect(runScriptNode('return data;', 123)).rejects.toThrow('[InputError]');
  });

  it('throw nếu output không phải object', async () => {
    const input = { a: 1 };

    await expect(runScriptNode('return 123;', input)).rejects.toThrow('[OutputTypeError]');
  });
});

describe('nodeRunner - runConditionNode', () => {
  it('trả về boolean đúng với expression', async () => {
    const input = { age: 20 };
    const result = await runConditionNode('data.age >= 18', input);
    expect(result).toBe(true);
  });

  it('throw nếu script không trả về boolean', async () => {
    const input = { x: 1 };
    await expect(runConditionNode('return { ok: true };', input)).rejects.toThrow('[OutputTypeError]');
  });
});

describe('nodeRunner - runAINode', () => {
  it('gọi Gemini và gán kết quả vào field', async () => {
    const input = { context: 'hello' };

    const out = await runAINode(input, 'Say hi', 'ai_output');

    expect(out).toEqual({ context: 'hello', ai_output: 'MOCK_AI_RESULT' });
  });

  it('throw nếu Gemini ném lỗi', async () => {
    // override mock cho case này
    const { GeminiAI } = jest.requireMock('../engine/gemini');
    (GeminiAI as jest.Mock).mockImplementationOnce(() => ({
      generate: jest.fn().mockRejectedValue(new Error('Boom!')),
    }));

    await expect(runAINode({ x: 1 }, 'test', 'ai')).rejects.toThrow('[RunAINodeError]');
  });
});
