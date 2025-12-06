import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientiModule } from './clienti/clienti.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3307,
      username: 'rc_user',          // o rc_user se preferisci
      password: 'rc_pass',          // o rc_pass
      database: 'recupero_crediti',
      autoLoadEntities: true,    // carica automaticamente le entity
      synchronize: true,         // DEV ONLY: crea/aggiorna le tabelle da solo
    }),
    ClientiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
