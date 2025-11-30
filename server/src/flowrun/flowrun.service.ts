import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FlowRun } from './entities/flowrun.entity';
import { Repository } from 'typeorm';
import { CreateFlowRunDto } from './dto/create-flowrun.dto';
import { UpdateFlowRunDto } from './dto/update-flowrun.dto';
import { Socket } from 'socket.io';
import { CreateFlownodeDto } from 'src/flownode/dto/create-flownode.dto';
import { CreateEdgeDto } from 'src/edges/dto/create-edge.dto';
import { RunStatus } from './flowrun.enum';
import { FlowProgressEvent, runFlow } from 'src/engine/engine';


@Injectable()
export class FlowrunService {
    constructor(
        @InjectRepository(FlowRun)
        private readonly flowRunRepo: Repository<FlowRun>,
    ) {}

    async create(dto: CreateFlowRunDto) {
        const run = this.flowRunRepo.create({
            flow: { id: dto.flow_id },
            start_data: dto.start_data ?? null,
        });
        return this.flowRunRepo.save(run);
    }

    async update(runId: string, dto: UpdateFlowRunDto) {
        await this.flowRunRepo.update(runId, dto);
        return this.flowRunRepo.findOne({ where: { id: runId } });
    }

    async getAllByFlow(flowId: string) {
        return this.flowRunRepo.find({
            where: { flow: { id: flowId } },
            order: { created_at: 'DESC' },
        });
    }

    async runFlowInSocket(client: Socket, payload: { nodes: CreateFlownodeDto[]; edges: CreateEdgeDto[] }) {
        const { nodes, edges } = payload;

        if (!nodes?.length) {
            client.emit('run:finished', { status: 'failed', message: 'nodes is empty' });
            return { ok: false, message: 'nodes is empty' };
        }

        const flowId = nodes[0].flow_id;
        const run = await this.create({
            flow_id: flowId,
            start_data: nodes[0].data,
        });

        const runID = run.id;

        const emitEvent = (e: FlowProgressEvent) => {
            switch (e.type) {
                case 'run:started':
                    client.emit('run:started', { runID, flowId, start_data: e.startData });
                    break;

                case 'node:started':
                    client.emit('node:started', { runID, nodeId: e.nodeId, nodeType: e.nodeType, step: e.step });
                    break;

                case 'node:succeeded':
                    client.emit('node:succeeded', {
                        runID,
                        nodeId: e.nodeId,
                        nodeType: e.nodeType,
                        step: e.step,
                        data: e.data,
                    });
                    break;

                case 'node:failed':
                    client.emit('node:failed', {
                        runID,
                        nodeId: e.nodeId,
                        nodeType: e.nodeType,
                        step: e.step,
                        error: e.error,
                    });
                    break;

                case 'run:finished':
                    client.emit('run:finished', {
                        runID,
                        status: e.status,
                        result: e.result,
                        error: e.error,
                    });
                    break;
            }
        };

        try {
            const resultData = await runFlow(nodes, edges, { onEvent: emitEvent });

            await this.flowRunRepo.update(runID, {
                status: RunStatus.SUCCESS,
                end_data: resultData,
            });

            client.emit('run:finished', { runID, status: 'success', result: resultData });

            return { ok: true, runID };
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);

            await this.flowRunRepo.update(runID, {
                status: RunStatus.FAILED,
                end_data: {},
            });

            client.emit('run:finished', { runID, status: 'failed', message });

            return { ok: false, runID, message };
        }
    }
}
