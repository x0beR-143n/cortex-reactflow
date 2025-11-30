import { Module } from '@nestjs/common';
import { FlowsService } from './flows.service';
import { FlowsController } from './flows.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Flow } from './entities/flow.entity';
import { FlowNode } from 'src/flownode/entities/flownode.entity';
import { Edge } from 'src/edges/entities/edge.entity';
import { FlownodeModule } from 'src/flownode/flownode.module';
import { EdgesModule } from 'src/edges/edges.module';

@Module({
  imports: [TypeOrmModule.forFeature([Flow, FlowNode, Edge]), FlownodeModule, EdgesModule], 
  controllers: [FlowsController],
  providers: [FlowsService],
  exports: [FlowsService],
})

export class FlowsModule {}
