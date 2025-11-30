import { FlowNode } from 'src/flownode/entities/flownode.entity';
import { Flow } from 'src/flows/entities/flow.entity';
import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, CreateDateColumn, UpdateDateColumn, Index, JoinColumn, RelationId
} from 'typeorm';

@Entity({ name: 'edges' })
@Index('idx_edges_flow', ['flow'])
@Index('idx_edges_flow_source', ['flow', 'source_node'])
@Index('idx_edges_flow_target', ['flow', 'target_node'])
export class Edge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // --- FK đến Flow ---
  @ManyToOne(() => Flow, (flow) => flow.edges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'flow_id' })             // ép tên cột là flow_id
  flow: Flow;

  @RelationId((edge: Edge) => edge.flow)       // đọc được id mà không tạo cột thêm
  flow_id: string;

  // --- FK đến Node nguồn ---
  @ManyToOne(() => FlowNode, (node) => node.sourceEdges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'source_node_id' })
  source_node: FlowNode;

  @RelationId((edge: Edge) => edge.source_node)
  source_node_id: string;

  // --- FK đến Node đích ---
  @ManyToOne(() => FlowNode, (node) => node.targetEdges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_node_id' })
  target_node: FlowNode;

  @RelationId((edge: Edge) => edge.target_node)
  target_node_id: string;

  @Column({ type: 'jsonb', default: () => `'{}'` })
  data: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updated_at: Date;
}
