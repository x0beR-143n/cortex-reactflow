import { IsUUID, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class CreateEdgeDto {
  @IsUUID()
  @IsNotEmpty()
  id!: string;               

  @IsUUID()
  @IsNotEmpty()
  flow_id!: string;        

  @IsUUID()
  @IsNotEmpty()
  source_node_id!: string;   

  @IsUUID()
  @IsNotEmpty()
  target_node_id!: string;  

  @IsObject()
  @IsOptional()
  data?: Record<string, any>; 
}
