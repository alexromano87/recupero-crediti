import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientiService } from './clienti.service';
import { ClientiController } from './clienti.controller';
import { Cliente } from './cliente.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cliente])],
  providers: [ClientiService],
  controllers: [ClientiController],
})
export class ClientiModule {}
