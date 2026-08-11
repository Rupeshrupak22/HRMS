import { Module } from '@nestjs/common';
import { VeenaService } from './veena.service';
import { VeenaController } from './veena.controller';

@Module({
  controllers: [VeenaController],
  providers: [VeenaService],
})
export class VeenaModule {}
