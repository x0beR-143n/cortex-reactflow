// src/edges/edges.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Edge } from './entities/edge.entity';
import { CreateEdgeDto } from './dto/create-edge.dto';

@Injectable()
export class EdgesService {
  constructor(
    @InjectRepository(Edge)
    private readonly repo: Repository<Edge>,
  ) {}

  async create(dto: CreateEdgeDto): Promise<Edge> {
    const edge = this.repo.create({
      id: dto.id,
      flow_id: dto.flow_id,
      source_node_id: dto.source_node_id,
      target_node_id: dto.target_node_id,
      data: dto.data, // optional
    });
    return this.repo.save(edge);
  }

  async findAllByFlowId(flowId: string): Promise<Edge[]> {
    return this.repo.find({
      where: { flow_id: flowId },
      relations: ['source_node', 'target_node'], // nếu cần kèm node
      order: { created_at: 'ASC' },
    });
  }

  // tạo hàng loạt nhưng chỉ tạo cái ko tồn tại
  async bulkCreateIfNotExists(dtos: CreateEdgeDto[]): Promise<void> {
    if (!dtos?.length) return;

    const ids = dtos.map(d => d.id);
    const existing = await this.repo.find({
      where: { id: In(ids) },
      select: ['id'],
    });
    const existed = new Set(existing.map(e => e.id));

    const toInsert = dtos
      .filter(d => !existed.has(d.id))
      .map(d => ({
        id: d.id,
        flow: { id: d.flow_id },               
        source_node: { id: d.source_node_id },   
        target_node: { id: d.target_node_id },
        data: d.data ?? {},
      }));

    if (toInsert.length) {
      await this.repo
        .createQueryBuilder()
        .insert()
        .into(Edge)
        .values(toInsert)
        .execute();
    }
  }

  async replaceEdges(dtos: CreateEdgeDto[]): Promise<void> {
    if (!dtos?.length) return;
    const flowId = dtos[0].flow_id;
    const payloadIds = dtos.map(d => d.id);

    // ❌ KHÔNG dùng repo.delete({ flow_id: ... })
    // ✅ Dùng QueryBuilder, tham chiếu tên cột thật trong DB ("flow_id")
    await this.repo
      .createQueryBuilder()
      .delete()
      .from(Edge)
      .where('flow_id = :flowId', { flowId })
      .andWhere(payloadIds.length ? 'id NOT IN (:...ids)' : '1=1', { ids: payloadIds })
      .execute();

    // Thêm mới những edge chưa có
    const existing = await this.repo.find({ where: { id: In(payloadIds) }, select: ['id'] });
    const existed = new Set(existing.map(e => e.id));

    const toInsert = dtos
      .filter(d => !existed.has(d.id))
      .map(d => ({
        id: d.id,
        flow: { id: d.flow_id },
        source_node: { id: d.source_node_id },
        target_node: { id: d.target_node_id },
        data: d.data ?? {},
      }));

    if (toInsert.length) {
      await this.repo
        .createQueryBuilder()
        .insert()
        .into(Edge)
        .values(toInsert)
        .execute();
    }
  }
}
