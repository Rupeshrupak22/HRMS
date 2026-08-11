import { Module } from '@nestjs/common';
import { AravindService } from './aravind.service';
import { AravindController } from './aravind.controller';

@Module({
  controllers: [AravindController],
  providers: [AravindService],
})
export class AravindModule {}
