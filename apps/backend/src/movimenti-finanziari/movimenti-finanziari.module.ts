// apps/backend/src/movimenti-finanziari/movimenti-finanziari.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovimentiFinanziariService } from './movimenti-finanziari.service';
import { MovimentiFinanziariController } from './movimenti-finanziari.controller';
import { MovimentoFinanziario } from './movimento-finanziario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MovimentoFinanziario])],
  controllers: [MovimentiFinanziariController],
  providers: [MovimentiFinanziariService],
  exports: [MovimentiFinanziariService],
})
export class MovimentiFinanziariModule {}
