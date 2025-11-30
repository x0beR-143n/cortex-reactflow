import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateFlownodeDto } from './dto/create-flownode.dto';
import { UpdateFlownodeDto } from './dto/update-flownode.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { FlowNode } from './entities/flownode.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class FlownodeService {
  constructor(
    @InjectRepository(FlowNode)
    private readonly repo: Repository<FlowNode>
  ) {}

  // creat a node here
  async create(createFlownodeDto: CreateFlownodeDto): Promise<FlowNode> {
    const existed = await this.repo.existsBy({ id: createFlownodeDto.id });
    if (existed) {
      throw new ConflictException(`FlowNode id ${createFlownodeDto.id} already exists`);
    }

    const new_node = this.repo.create({
      id: createFlownodeDto.id,
      flow: { id: createFlownodeDto.flow_id },
      nodeType: createFlownodeDto.nodeType,
      label: createFlownodeDto.label,
      data: createFlownodeDto.data,
      position: createFlownodeDto.position
    });

    return this.repo.save(new_node);
  }

  async findAllByFlowId(flowId: string): Promise<FlowNode[]> {
    return this.repo.find({
      where: { flow_id: flowId },
      order: { created_at: "ASC" },
    });
  }

  async update(id: string, dto: UpdateFlownodeDto): Promise<FlowNode> {
    const node = await this.repo.findOne({ where: { id } });
    if (!node) throw new NotFoundException(`FlowNode ${id} not found`);

    let changed = false;

    if (typeof dto.label !== "undefined" && dto.label !== node.label) {
      node.label = dto.label;
      changed = true;
    }

    if (typeof dto.data !== "undefined") {
      // shallow compare; nếu muốn deep compare, có thể dùng lodash.isEqual
      const oldStr = JSON.stringify(node.data ?? {});
      const newStr = JSON.stringify(dto.data ?? {});
      if (oldStr !== newStr) {
        node.data = dto.data!;
        changed = true;
      }
    }

    if (typeof dto.position !== "undefined") {
      // shallow compare; nếu muốn deep compare, có thể dùng lodash.isEqual
      const oldStr = JSON.stringify(node.position ?? {});
      const newStr = JSON.stringify(dto.position ?? {});
      if (oldStr !== newStr) {
        node.position = dto.position!;
        changed = true;
      }
    }

    if (!changed) {
      return node;
    }

    return this.repo.save(node);
  }

  async saveFromCreate(createDto: CreateFlownodeDto): Promise<FlowNode> {
    const { id, flow_id, nodeType, label, position, data } = createDto;

    // chỉ patch các field có thể update
    const patch: UpdateFlownodeDto = {};
    if (typeof label !== 'undefined') patch.label = label;
    if (typeof position !== 'undefined') patch.position = position;
    if (typeof data !== 'undefined') patch.data = data;

    try {
      // thử update node theo id
      return await this.update(id, patch);
    } catch (e) {
      // nếu chưa tồn tại -> tạo mới bằng createDto
      if (e instanceof NotFoundException) {
        return this.create({
          id,
          flow_id,
          nodeType,
          label: label,
          position: position,
          data: data ,
        });
      }
      throw e;
    }
  }

  async deleteManyByIds(ids: string[]): Promise<void> {
    if (!ids.length) return;
    await this.repo.delete({ id: In(ids) });
  }

}
