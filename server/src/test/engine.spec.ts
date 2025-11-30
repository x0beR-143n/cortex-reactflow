/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { runFlow, FlowProgressEvent } from '../engine/engine';
import { FlowNodeType } from '../flownode/flownode.enum';
import { CreateFlownodeDto } from '../flownode/dto/create-flownode.dto';
import { CreateEdgeDto } from '../edges/dto/create-edge.dto';

// Mock nodeRunner để không gọi logic thực/AI thật trong engine test
jest.mock('../engine/nodeRunner', () => ({
  runScriptNode: jest.fn((script: string, data: any) =>
    Promise.resolve({ ...data, fromScript: true }),
  ),
  runConditionNode: jest.fn((script: string, data: any) =>
    Promise.resolve(true), // luôn true cho đơn giản
  ),
  runAINode: jest.fn((data: any, prompt: string, field: string) =>
    Promise.resolve({ ...data, [field]: 'AI_MOCK' }),
  ),
}));

// 1 cái uuid fake cho đủ “hình thức”
const uuid = (s: string) => `00000000-0000-0000-0000-0000000000${s}`;

const makeStartNode = (options?: Partial<CreateFlownodeDto>): CreateFlownodeDto => ({
  id: uuid('01'),
  flow_id: uuid('f1'),
  label: 'Start',
  nodeType: FlowNodeType.startNode,
  position: { x: 0, y: 0 },
  data: { foo: 'bar', ...(options?.data ?? {}) },
  ...(options ?? {}),
});

const makeScriptNode = (options?: Partial<CreateFlownodeDto>): CreateFlownodeDto => ({
  id: uuid('02'),
  flow_id: uuid('f1'),
  label: 'Script',
  nodeType: FlowNodeType.scriptNode,
  position: { x: 100, y: 0 },
  data: { script: '{ x: 1 }', ...(options?.data ?? {}) },
  ...(options ?? {}),
});

const makeOutputNode = (options?: Partial<CreateFlownodeDto>): CreateFlownodeDto => ({
  id: uuid('03'),
  flow_id: uuid('f1'),
  label: 'Output',
  nodeType: FlowNodeType.outputNode,
  position: { x: 200, y: 0 },
  data: {},
  ...(options ?? {}),
});

const makeConditionNode = (options?: Partial<CreateFlownodeDto>): CreateFlownodeDto => ({
  id: uuid('04'),
  flow_id: uuid('f1'),
  label: 'Condition',
  nodeType: FlowNodeType.conditionalNode,
  position: { x: 150, y: 50 },
  data: { script: 'data.age >= 18', ...(options?.data ?? {}) },
  ...(options ?? {}),
});

const makeEdge = (
  source: string,
  target: string,
  extraData?: Record<string, any>,
): CreateEdgeDto => ({
  id: uuid(source.slice(-2) + target.slice(-2)),
  flow_id: uuid('f1'),
  source_node_id: source,
  target_node_id: target,
  data: extraData,
});

describe('engine - runFlow', () => {
  it('happy path: start -> script -> output', async () => {
    const events: FlowProgressEvent[] = [];

    const start = makeStartNode();
    const script = makeScriptNode();
    const output = makeOutputNode();

    const nodes: CreateFlownodeDto[] = [start, script, output];
    const edges: CreateEdgeDto[] = [
      makeEdge(start.id, script.id),
      makeEdge(script.id, output.id),
    ];

    const result = await runFlow(nodes, edges, {
      onEvent: (e) => events.push(e),
    });

    // do runScriptNode đã mock, nên data phải có fromScript: true
    expect(result).toMatchObject({ foo: 'bar', fromScript: true });

    // sự kiện đầu tiên là run:started
    expect(events[0]).toMatchObject({
      type: 'run:started',
      flowId: start.flow_id,
      startData: start.data,
    });

    // phải có node:succeeded cho script node
    expect(
      events.some(
        (e) => e.type === 'node:succeeded' && e.nodeId === script.id,
      ),
    ).toBe(true);

    // sự kiện cuối là run:finished success
    const last = events[events.length - 1];
    expect(last.type).toBe('run:finished');
    if (last.type === 'run:finished') {
      expect(last.status).toBe('success');
    }
  });

  it('throw nếu không có start node', async () => {
    const script = makeScriptNode();
    const output = makeOutputNode();

    const nodes: CreateFlownodeDto[] = [script, output];
    const edges: CreateEdgeDto[] = [];

    await expect(runFlow(nodes, edges)).rejects.toThrow('No start node found');
  });

  it('throw nếu start node data không phải object', async () => {
    const badStart = makeStartNode({ data: 'not-object' as any });
    const output = makeOutputNode();

    const nodes: CreateFlownodeDto[] = [badStart, output];
    const edges: CreateEdgeDto[] = [];

    await expect(runFlow(nodes, edges)).rejects.toThrow(
      'start node data must be an object',
    );
  });

  it('dừng nếu vượt step limit (vòng lặp)', async () => {
    const start = makeStartNode();
    const loopNode = makeScriptNode({ id: uuid('99'), label: 'Loop' });

    const nodes: CreateFlownodeDto[] = [start, loopNode];

    // start -> loop -> loop -> loop...
    const edges: CreateEdgeDto[] = [
      makeEdge(start.id, loopNode.id),
      makeEdge(loopNode.id, loopNode.id),
    ];

    await expect(runFlow(nodes, edges)).rejects.toThrow(
      'Exceeded stepLimit=50',
    );
  });

  it('emit node:failed & run:finished[failed] nếu node ném lỗi', async () => {
    const { runScriptNode } = jest.requireMock('../engine/nodeRunner');
    (runScriptNode as jest.Mock).mockRejectedValueOnce(
      new Error('Script crashed'),
    );

    const events: FlowProgressEvent[] = [];

    const start = makeStartNode();
    const script = makeScriptNode();
    const output = makeOutputNode();

    const nodes: CreateFlownodeDto[] = [start, script, output];
    const edges: CreateEdgeDto[] = [
      makeEdge(start.id, script.id),
      makeEdge(script.id, output.id),
    ];

    await expect(
      runFlow(nodes, edges, { onEvent: (e) => events.push(e) }),
    ).rejects.toThrow('[FlowError]');

    const hasNodeFailed = events.some((e) => e.type === 'node:failed');
    expect(hasNodeFailed).toBe(true);

    const last = events[events.length - 1];
    expect(last.type).toBe('run:finished');
    if (last.type === 'run:finished') {
      expect(last.status).toBe('failed');
    }
  });

  it('đi đúng nhánh true/false với conditional node', async () => {
    const { runConditionNode } = jest.requireMock('../engine/nodeRunner');

    // Lần chạy này: trả về true
    (runConditionNode as jest.Mock).mockResolvedValueOnce(true);

    const events: FlowProgressEvent[] = [];

    const start = makeStartNode({ data: { age: 20 } });
    const cond = makeConditionNode();
    const nodeTrue = makeScriptNode({ id: uuid('10'), label: 'TrueBranch' });
    const nodeFalse = makeScriptNode({ id: uuid('11'), label: 'FalseBranch' });
    const output = makeOutputNode();

    const nodes: CreateFlownodeDto[] = [start, cond, nodeTrue, nodeFalse, output];
    const edges: CreateEdgeDto[] = [
      makeEdge(start.id, cond.id),
      makeEdge(cond.id, nodeTrue.id, { branch: 'true' }),
      makeEdge(cond.id, nodeFalse.id, { branch: 'false' }),
      makeEdge(nodeTrue.id, output.id),
      makeEdge(nodeFalse.id, output.id),
    ];

    const result = await runFlow(nodes, edges, {
      onEvent: (e) => events.push(e),
    });

    expect(result).toMatchObject({ age: 20, fromScript: true });

    // verify là nodeTrue chạy, nodeFalse không chạy (ít nhất theo events)
    const ranTrue = events.some(
      (e) => e.type === 'node:succeeded' && e.nodeId === nodeTrue.id,
    );
    const ranFalse = events.some(
      (e) => e.type === 'node:succeeded' && e.nodeId === nodeFalse.id,
    );

    expect(ranTrue).toBe(true);
    expect(ranFalse).toBe(false);
  });
});
