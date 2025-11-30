import { Controller, Get, Post, Body, Param,  } from '@nestjs/common';
import { EdgesService } from './edges.service';
import { CreateEdgeDto } from './dto/create-edge.dto';

@Controller('edges')
export class EdgesController {
  constructor(private readonly edgesService: EdgesService) {}

  @Post()
  create(@Body() createEdgeDto: CreateEdgeDto) {
    return this.edgesService.create(createEdgeDto);
  }

  @Get(':flow_id')
  findOne(@Param('flow_id') id: string) {
    return this.edgesService.findAllByFlowId(id);
  }

}
