// dto/save-graph.dto.ts
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { CreateFlownodeDto } from 'src/flownode/dto/create-flownode.dto';
import { CreateEdgeDto } from 'src/edges/dto/create-edge.dto';

export class SaveFlowDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFlownodeDto)
  nodes: CreateFlownodeDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEdgeDto)
  edges: CreateEdgeDto[];
}

export class SaveFlowWithDeletion {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFlownodeDto)
  nodes: CreateFlownodeDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEdgeDto)
  edges: CreateEdgeDto[];

  @IsArray()
  node_id_delete: string[];
}
