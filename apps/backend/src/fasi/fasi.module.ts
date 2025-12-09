// src/fasi/fasi.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fase } from './fase.entity';
import { FasiService } from './fasi.service';
import { FasiController } from './fasi.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Fase])],
  controllers: [FasiController],
  providers: [FasiService],
  exports: [FasiService],
})
export class FasiModule {}