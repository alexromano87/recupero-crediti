// src/pratiche/pratiche.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pratica } from './pratica.entity';
import { Avvocato } from '../avvocati/avvocato.entity';
import { PraticheService } from './pratiche.service';
import { PraticheController } from './pratiche.controller';
import { FasiModule } from '../fasi/fasi.module';

@Module({
  imports: [TypeOrmModule.forFeature([Pratica, Avvocato]), FasiModule],
  controllers: [PraticheController],
  providers: [PraticheService],
  exports: [PraticheService],
})
export class PraticheModule {}