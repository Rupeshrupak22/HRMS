import { Module } from '@nestjs/common';
import { NitishaService } from './nitisha.service';
import { NitishaController } from './nitisha.controller';

@Module({
  controllers: [NitishaController],
  providers: [NitishaService],
})
export class NitishaModule {}
