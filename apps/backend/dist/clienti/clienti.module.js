"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientiModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const clienti_service_1 = require("./clienti.service");
const clienti_controller_1 = require("./clienti.controller");
const cliente_entity_1 = require("./cliente.entity");
let ClientiModule = class ClientiModule {
};
exports.ClientiModule = ClientiModule;
exports.ClientiModule = ClientiModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([cliente_entity_1.Cliente])],
        providers: [clienti_service_1.ClientiService],
        controllers: [clienti_controller_1.ClientiController],
    })
], ClientiModule);
//# sourceMappingURL=clienti.module.js.map