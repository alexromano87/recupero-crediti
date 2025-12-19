// apps/backend/src/documenti/documenti.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Documento } from './documento.entity';
import { DocumentiService } from './documenti.service';
import { DocumentiController } from './documenti.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Documento])],
  controllers: [DocumentiController],
  providers: [DocumentiService],
  exports: [DocumentiService],
})
export class DocumentiModule {}
