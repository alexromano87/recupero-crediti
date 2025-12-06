import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ClientiService } from './clienti.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Controller('clienti')
export class ClientiController {
  constructor(private readonly clientiService: ClientiService) {}

  @Post()
  create(@Body() dto: CreateClienteDto) {
    return this.clientiService.create(dto);
  }

  @Get()
  findAll() {
    return this.clientiService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientiService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClienteDto) {
    return this.clientiService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clientiService.remove(id);
  }
}
