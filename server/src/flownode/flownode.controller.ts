import { Controller, Get, Post, Body, Patch, Param} from '@nestjs/common';
import { FlownodeService } from './flownode.service';
import { CreateFlownodeDto } from './dto/create-flownode.dto';
import { UpdateFlownodeDto } from './dto/update-flownode.dto';

@Controller('flownode')
export class FlownodeController {
  constructor(private readonly flownodeService: FlownodeService) {}

  @Post()
  create(@Body() createFlownodeDto: CreateFlownodeDto) {
    return this.flownodeService.create(createFlownodeDto);
  }

  @Get(':flow_id')
  findAllByFlowId(@Param('flow_id') flow_id: string) {
    return this.flownodeService.findAllByFlowId(flow_id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFlownodeDto: UpdateFlownodeDto) {
    return this.flownodeService.update(id, updateFlownodeDto);
  }

  // con chuc nang delete tam thoi chua viet
} 
