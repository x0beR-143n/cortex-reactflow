import { Type } from "class-transformer";
import { IsArray, ValidateNested } from "class-validator";
import { CreateEdgeDto } from "src/edges/dto/create-edge.dto";
import { CreateFlownodeDto } from "src/flownode/dto/create-flownode.dto";

export class RunFlowDto { 
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFlownodeDto)
  nodes: CreateFlownodeDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEdgeDto)
  edges: CreateEdgeDto[];
}