import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientiModule } from './clienti/clienti.module';
import { DebitoriModule } from './debitori/debitori.module';
import { ClientiDebitoriModule } from './relazioni/clienti-debitori.module';
import { FasiModule } from './fasi/fasi.module';
import { PraticheModule } from './pratiche/pratiche.module';

@Module({
  imports: [
    // Carica variabili da .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Configurazione TypeORM con variabili d'ambiente
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3307),
        username: configService.get<string>('DB_USERNAME', 'rc_user'),
        password: configService.get<string>('DB_PASSWORD', 'rc_pass'),
        database: configService.get<string>('DB_DATABASE', 'recupero_crediti'),
        autoLoadEntities: true,
        // Synchronize solo in development
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
      }),
    }),

    ClientiModule,
    DebitoriModule,
    ClientiDebitoriModule,
    FasiModule,
    PraticheModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}