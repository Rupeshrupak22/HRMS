import { Module } from '@nestjs/common';
import { ExitService } from './exit.service';
import { ExitController } from './exit.controller';

@Module({
  controllers: [ExitController],
  providers: [ExitService],
  exports: [ExitService],
})
export class ExitModule {}
