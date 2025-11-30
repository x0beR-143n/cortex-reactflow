import { IsObject, IsOptional, IsUUID } from 'class-validator';

export class CreateFlowRunDto {
  @IsUUID()
  flow_id: string; // khóa ngoại đến Flow

  @IsOptional()
  @IsObject()
  start_data?: Record<string, any>;
}
