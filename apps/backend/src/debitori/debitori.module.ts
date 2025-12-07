import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Debitore } from './debitore.entity';
import { DebitoriService } from './debitori.service';
import { DebitoriController } from './debitori.controller';
import { ClientiDebitoriModule } from '../relazioni/clienti-debitori.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Debitore]),
    ClientiDebitoriModule,           // <--- QUI
  ],
  controllers: [DebitoriController],
  providers: [DebitoriService],
})
export class DebitoriModule {}
