import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { FlowsService } from './flows.service';
import { CreateFlowDto } from './dto/create-flow.dto';
import { UpdateFlowDto } from './dto/update-flow.dto';
import { SaveFlowDto, SaveFlowWithDeletion } from './dto/save-flow.dto';

@Controller('flows')
export class FlowsController {
  constructor(private readonly flowsService: FlowsService) {}

  @Post()
  create(@Body() createFlowDto: CreateFlowDto) {
    return this.flowsService.create(createFlowDto);
  }

  @Get()
  findAll() {
    return this.flowsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.flowsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFlowDto: UpdateFlowDto) {
    return this.flowsService.update(id, updateFlowDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.flowsService.remove_soft(id)
  }

  @Post('save')
  @HttpCode(HttpStatus.OK)
  async saveFlow(@Body() dto: SaveFlowDto) {
    await this.flowsService.handleNodeAndEdgeSave(dto.nodes, dto.edges);
    return { ok: true };
  }

  @Post('save-delete')
  @HttpCode(HttpStatus.OK)
  async saveFlowWithDeletion(@Body() dto: SaveFlowWithDeletion) {
    await this.flowsService.handleNodeAndEdgeSaveWithDelete(dto.nodes, dto.edges, dto.node_id_delete);
    return { ok: true };
  }
}
