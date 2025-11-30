import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GeminiService } from './gemini.service';
import { GenerateDto } from './dto/generate.dto';

@ApiTags('Gemini')
@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Gọi Gemini API để sinh văn bản' })
  @ApiResponse({
    status: 200,
    description: 'Kết quả text từ mô hình Gemini',
    schema: { example: { text: 'Đây là câu trả lời từ Gemini.' } },
  })
  async generate(@Body() body: GenerateDto) {
    const text = await this.geminiService.generate(body.prompt);
    return { text };
  }
}
