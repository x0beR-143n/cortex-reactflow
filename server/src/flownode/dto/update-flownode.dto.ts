import { PartialType } from '@nestjs/mapped-types';
import { CreateFlownodeDto } from './create-flownode.dto';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateFlownodeDto extends PartialType(CreateFlownodeDto) {
    @IsString()
    @IsOptional()
    label?: string;

    @IsObject()
    @IsOptional()
    data?: Record<string, any>;

    @IsObject()
    @IsOptional()
    position?: { x: number; y: number };
}
