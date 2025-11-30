import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateFlowDto {
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    name!: string;

    @IsOptional()
    @IsString()
    @MaxLength(5000)
    @Transform(({ value }: { value: unknown })=> (typeof value === 'string' ? value.trim() : value))
    description?: string;
}

