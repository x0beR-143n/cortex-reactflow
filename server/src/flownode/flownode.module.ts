import { Module } from '@nestjs/common';
import { FlownodeService } from './flownode.service';
import { FlownodeController } from './flownode.controller';
import { FlowNode } from './entities/flownode.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([FlowNode])], 
  controllers: [FlownodeController],
  providers: [FlownodeService],
  exports: [FlownodeService],
})
export class FlownodeModule {}
