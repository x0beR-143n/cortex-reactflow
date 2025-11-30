import { Module } from '@nestjs/common';
import { EdgesService } from './edges.service';
import { EdgesController } from './edges.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Edge } from './entities/edge.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Edge])],
  controllers: [EdgesController],
  providers: [EdgesService],
  exports: [EdgesService],
})
export class EdgesModule {}
