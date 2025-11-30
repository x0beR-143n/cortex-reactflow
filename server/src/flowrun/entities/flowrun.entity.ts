import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  RelationId,
} from 'typeorm';
import { RunStatus } from '../flowrun.enum';
import { Flow } from 'src/flows/entities/flow.entity';

@Entity({ name: 'runs' })
export class FlowRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb', nullable: true })
  start_data?: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  end_data?: Record<string, any> | null;

  @Column({
    type: 'enum',
    enum: RunStatus,
    default: RunStatus.RUNNING,
  })
  @Index() 
  status: RunStatus;

  @ManyToOne(() => Flow, (flow) => flow.flow_run, {
    onDelete: 'CASCADE', 
    onUpdate: 'NO ACTION',
    nullable: false,
  })
  @Index() 
  flow: Flow;

  @RelationId((run: FlowRun) => run.flow)
  flow_id: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updated_at: Date;
}
