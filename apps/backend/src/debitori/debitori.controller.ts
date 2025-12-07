// apps/backend/src/debitori/debitori.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { DebitoriService } from './debitori.service';
import { CreateDebitoreDto } from './dto/create-debitore.dto';
import { UpdateDebitoreDto } from './dto/update-debitore.dto';

@Controller('debitori')
export class DebitoriController {
  constructor(private readonly debitoriService: DebitoriService) {}

  @Get()
  findAll() {
    return this.debitoriService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.debitoriService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDebitoreDto) {
    return this.debitoriService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDebitoreDto) {
    return this.debitoriService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.debitoriService.remove(id);
  }
}
