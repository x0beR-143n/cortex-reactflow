import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateDto {
  @ApiProperty({
    example: 'Viết 1 câu thơ vui về NestJS và React Flow',
    description: 'Prompt gửi tới mô hình Gemini',
  })
  @IsString()
  @IsNotEmpty()
  prompt: string;
}
