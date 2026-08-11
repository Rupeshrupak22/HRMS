import { Controller, Post, Body, Request } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';

@ApiTags('HR AI Copilot')
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('copilot/query')
  async copilotQuery(@Request() req: any, @Body() body: { query: string }) {
    // Use authenticated user if available, otherwise default to EMPLOYEE role
    const user = req.user || { id: 'demo', role: 'EMPLOYEE', email: 'demo@adyapan.com' };
    return this.aiService.handleCopilotQuery(user, body.query);
  }
}
