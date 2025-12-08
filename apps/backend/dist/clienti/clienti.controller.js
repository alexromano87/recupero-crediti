"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientiController = void 0;
const common_1 = require("@nestjs/common");
const clienti_service_1 = require("./clienti.service");
const create_cliente_dto_1 = require("./dto/create-cliente.dto");
const update_cliente_dto_1 = require("./dto/update-cliente.dto");
const clienti_debitori_service_1 = require("../relazioni/clienti-debitori.service");
let ClientiController = class ClientiController {
    clientiService;
    clientiDebitoriService;
    constructor(clientiService, clientiDebitoriService) {
        this.clientiService = clientiService;
        this.clientiDebitoriService = clientiDebitoriService;
    }
    findAll(includeInactive) {
        return this.clientiService.findAll(includeInactive === 'true');
    }
    findOne(id) {
        return this.clientiService.findOne(id);
    }
    async getPraticheCount(id) {
        const count = await this.clientiService.countPraticheCollegate(id);
        return { count };
    }
    create(dto) {
        return this.clientiService.create(dto);
    }
    update(id, dto) {
        return this.clientiService.update(id, dto);
    }
    deactivate(id) {
        return this.clientiService.deactivate(id);
    }
    reactivate(id) {
        return this.clientiService.reactivate(id);
    }
    remove(id) {
        return this.clientiService.remove(id);
    }
    getDebitoriForCliente(id) {
        return this.clientiDebitoriService.getDebitoriByCliente(id);
    }
    async updateDebitoriForCliente(id, body) {
        await this.clientiDebitoriService.setDebitoriForCliente(id, body.debitoriIds ?? []);
        return { success: true };
    }
    async unlinkDebitore(id, debitoreId) {
        await this.clientiDebitoriService.unlinkDebitoreFromCliente(id, debitoreId);
        return { success: true };
    }
};
exports.ClientiController = ClientiController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('includeInactive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ClientiController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ClientiController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/pratiche-count'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClientiController.prototype, "getPraticheCount", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_cliente_dto_1.CreateClienteDto]),
    __metadata("design:returntype", void 0)
], ClientiController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_cliente_dto_1.UpdateClienteDto]),
    __metadata("design:returntype", void 0)
], ClientiController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/deactivate'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ClientiController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Patch)(':id/reactivate'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ClientiController.prototype, "reactivate", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ClientiController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/debitori'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ClientiController.prototype, "getDebitoriForCliente", null);
__decorate([
    (0, common_1.Put)(':id/debitori'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ClientiController.prototype, "updateDebitoriForCliente", null);
__decorate([
    (0, common_1.Delete)(':id/debitori/:debitoreId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('debitoreId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ClientiController.prototype, "unlinkDebitore", null);
exports.ClientiController = ClientiController = __decorate([
    (0, common_1.Controller)('clienti'),
    __metadata("design:paramtypes", [clienti_service_1.ClientiService,
        clienti_debitori_service_1.ClientiDebitoriService])
], ClientiController);
//# sourceMappingURL=clienti.controller.js.map