import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { FlowsModule } from './flows/flows.module';
import { EdgesModule } from './edges/edges.module';
import { Flow } from './flows/entities/flow.entity';
import { Edge } from './edges/entities/edge.entity';
import { FlownodeModule } from './flownode/flownode.module';
import { FlowNode } from './flownode/entities/flownode.entity';
import { GeminiModule } from './gemini/gemini.module';
import { FlowrunModule } from './flowrun/flowrun.module';
import { FlowRun } from './flowrun/entities/flowrun.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Cho phép dùng ở mọi module mà không cần import lại
    }),
    TypeOrmModule.forRoot({
      type: "postgres",
      url: process.env.DATABASE_URL,
      ssl: true,
      entities: [Flow, Edge, FlowNode, FlowRun],
      synchronize: true,
    }),
    FlowsModule,
    EdgesModule,
    FlownodeModule,
    GeminiModule,
    FlowrunModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
