import { IsEnum, IsNotEmpty, IsObject, IsString, IsUUID } from "class-validator";
import { FlowNodeType } from "../flownode.enum";
import { Type } from "class-transformer";

export class CreateFlownodeDto {
    @IsUUID()
    @IsNotEmpty()
    id: string;

    @IsUUID()
    @IsNotEmpty()
    flow_id: string;

    @IsString()
    label: string;

    @IsNotEmpty()
    @IsEnum(FlowNodeType)
    nodeType: FlowNodeType;

    @IsObject()
    @Type(() => Object)
    @IsNotEmpty()
    position?: { x: number; y: number };

    @IsObject()
    @Type(() => Object)
    @IsNotEmpty()
    data?: Record<string, any>;
}
