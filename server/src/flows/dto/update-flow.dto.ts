import { PartialType } from '@nestjs/mapped-types';
import { CreateFlowDto } from './create-flow.dto';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { FlowStatus } from '../enum/flow-status.enum';

export class UpdateFlowDto extends PartialType(CreateFlowDto) {
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(5000)
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    description?: string;

    @IsOptional()
    @IsEnum(FlowStatus, { message: `status must be one of: ${Object.values(FlowStatus).join(', ')}` })
    status?: FlowStatus;
}
