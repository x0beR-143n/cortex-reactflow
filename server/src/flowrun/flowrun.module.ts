import { Module } from '@nestjs/common';
import { FlowrunService } from './flowrun.service';
import { FlowrunGateway } from './flowrun.gateway';
import { FlowRun } from './entities/flowrun.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([FlowRun])], 
  providers: [FlowrunGateway, FlowrunService],
})
export class FlowrunModule {}
