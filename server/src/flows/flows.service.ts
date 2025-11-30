import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFlowDto } from './dto/create-flow.dto';
import { UpdateFlowDto } from './dto/update-flow.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Flow } from './entities/flow.entity';
import { Repository } from 'typeorm';
import { FlowStatus } from './enum/flow-status.enum';
import { FlownodeService } from 'src/flownode/flownode.service';
import { EdgesService } from 'src/edges/edges.service';
import { CreateFlownodeDto } from 'src/flownode/dto/create-flownode.dto';
import { CreateEdgeDto } from 'src/edges/dto/create-edge.dto';

@Injectable()
export class FlowsService {
  constructor(@InjectRepository(Flow) private readonly flowsRepo: Repository<Flow>,
              private readonly flowNodeRepo: FlownodeService,
              private readonly edgeRepo: EdgesService
            ) {}

  // CREATE
  async create(dto: CreateFlowDto): Promise<Flow> {
    const flow = this.flowsRepo.create({
      name: dto.name.trim(),
      description: dto.description?.trim(),
    });
    return this.flowsRepo.save(flow);
  }

  // READ ALL
  async findAll(): Promise<Flow[]> {
    return this.flowsRepo.find({ order: { created_at: 'DESC' } });
  }

  // READ ONE
  async findOne(id: string): Promise<Flow> {
    const flow = await this.flowsRepo.findOne({
      where: { id },
      relations: {
        nodes: true,
        edges: true,
        // nếu muốn kèm node nguồn/đích của edge:
        // edges: { source_node: true, target_node: true },
      },
      order: {
        nodes: { created_at: 'ASC' },
        edges: { created_at: 'ASC' },
      },
    });

    if (!flow) throw new NotFoundException('Flow not found');
    return flow;
  }

  // UPDATE (partial)
  async update(id: string, dto: UpdateFlowDto): Promise<Flow> {
    const flow = await this.findOne(id);
    if (dto.name !== undefined) flow.name = dto.name.trim();
    if (dto.description !== undefined) flow.description = dto.description?.trim();
    if (dto.status !== undefined) flow.status = dto.status;
    return this.flowsRepo.save(flow);
  }

  // hard delete
  async remove_hard(id: string): Promise<void> {
    await this.findOne(id); 
    await this.flowsRepo.delete(id);
  }

  // soft delete status=deactive
  async remove_soft(id: string): Promise<Flow> {
     const flow = await this.findOne(id);
     flow.status = FlowStatus.DEACTIVE;
     return this.flowsRepo.save(flow);
  }
  
  async handleNodeAndEdgeSave(nodes: CreateFlownodeDto[], edges: CreateEdgeDto[]) {
    for (const n of nodes ?? []) {
      await this.flowNodeRepo.saveFromCreate(n);
    }
    await this.edgeRepo.bulkCreateIfNotExists(edges ?? []);
  }

  async handleNodeAndEdgeSaveWithDelete(nodes: CreateFlownodeDto[], edges: CreateEdgeDto[], node_delete_ids: string[]) {
    for (const n of nodes ?? []) {
      await this.flowNodeRepo.saveFromCreate(n);
    }
    await this.edgeRepo.replaceEdges(edges ?? []);
    // delete node
    await this.flowNodeRepo.deleteManyByIds(node_delete_ids);
  }
}
