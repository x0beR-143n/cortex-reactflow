import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { FlowStatus } from '../enum/flow-status.enum';
import { Edge } from 'src/edges/entities/edge.entity';
import { FlowNode } from 'src/flownode/entities/flownode.entity';
import { FlowRun } from 'src/flowrun/entities/flowrun.entity';

@Entity({ name: 'flows' })
export class Flow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: FlowStatus,
    default: FlowStatus.ACTIVE,
  })
  status: FlowStatus;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updated_at: Date;

  @OneToMany(() => FlowNode, (node) => node.flow)
  nodes: FlowNode[];

  @OneToMany(() => Edge, (edge) => edge.flow)
  edges: Edge[];

  @OneToMany(() => FlowRun, (run) => run.flow)
  flow_run: FlowRun[];
}
