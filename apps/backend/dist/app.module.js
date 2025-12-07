"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const clienti_module_1 = require("./clienti/clienti.module");
const debitori_module_1 = require("./debitori/debitori.module");
const clienti_debitori_module_1 = require("./relazioni/clienti-debitori.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    type: 'mysql',
                    host: configService.get('DB_HOST', 'localhost'),
                    port: configService.get('DB_PORT', 3307),
                    username: configService.get('DB_USERNAME', 'rc_user'),
                    password: configService.get('DB_PASSWORD', 'rc_pass'),
                    database: configService.get('DB_DATABASE', 'recupero_crediti'),
                    autoLoadEntities: true,
                    synchronize: configService.get('NODE_ENV') !== 'production',
                }),
            }),
            clienti_module_1.ClientiModule,
            debitori_module_1.DebitoriModule,
            clienti_debitori_module_1.ClientiDebitoriModule,
        ],
        controllers: [],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map