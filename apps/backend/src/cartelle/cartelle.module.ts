// apps/backend/src/cartelle/cartelle.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cartella } from './cartella.entity';
import { CartelleService } from './cartelle.service';
import { CartelleController } from './cartelle.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Cartella])],
  controllers: [CartelleController],
  providers: [CartelleService],
  exports: [CartelleService],
})
export class CartelleModule {}
