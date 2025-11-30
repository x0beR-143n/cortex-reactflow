import { Edge } from 'src/edges/entities/edge.entity';
import { Flow } from 'src/flows/entities/flow.entity';
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn,
  UpdateDateColumn, Index, OneToMany, JoinColumn, RelationId
} from 'typeorm';
import { FlowNodeType } from '../flownode.enum';

@Entity({ name: 'nodes' })
@Index('idx_nodes_flow', ['flow'])                   
@Index('idx_nodes_flow_nodetype', ['flow', 'nodeType'])
export class FlowNode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Flow, (flow) => flow.nodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'flow_id' })
  flow: Flow;

  @RelationId((node: FlowNode) => node.flow)
  flow_id: string;

  @Column({ type: 'varchar', nullable: true })
  label?: string;

  @Column({ type: 'enum', enum: FlowNodeType, nullable: false })
  nodeType: FlowNodeType;

  @Column({ type: 'jsonb', default: () => `'{"x":0,"y":0}'` })
  position: Record<string, any>;

  @Column({ type: 'jsonb', default: () => `'{}'` })
  data: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updated_at: Date;

  @OneToMany(() => Edge, (edge) => edge.source_node)
  sourceEdges: Edge[];

  @OneToMany(() => Edge, (edge) => edge.target_node)
  targetEdges: Edge[];
}
