// src/clienti/clienti.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from './cliente.entity';
import { ClientiController } from './clienti.controller';
import { ClientiService } from './clienti.service';
import { ClientiDebitoriModule } from '../relazioni/clienti-debitori.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cliente]),
    ClientiDebitoriModule,   
  ],
  controllers: [ClientiController],
  providers: [ClientiService],
  exports: [ClientiService],
})
export class ClientiModule {}
