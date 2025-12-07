import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientiModule } from './clienti/clienti.module';
import { DebitoriModule } from './debitori/debitori.module';
import { ClientiDebitoriModule } from './relazioni/clienti-debitori.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3307,
      username: 'rc_user',          
      password: 'rc_pass',          
      database: 'recupero_crediti',
      autoLoadEntities: true,    // carica automaticamente le entity
      synchronize: true,         // DEV ONLY: crea/aggiorna le tabelle da solo
    }),
    ClientiModule,
    DebitoriModule,
    ClientiDebitoriModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
