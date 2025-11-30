import { IsEnum, IsObject, IsOptional } from 'class-validator';
import { RunStatus } from '../flowrun.enum';

export class UpdateFlowRunDto {
  @IsOptional()
  @IsObject()
  end_data?: Record<string, any>;

  @IsOptional()
  @IsEnum(RunStatus)
  status?: RunStatus;
}
