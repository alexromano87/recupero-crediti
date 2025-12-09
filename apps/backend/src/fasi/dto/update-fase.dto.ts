// src/fasi/dto/update-fase.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateFaseDto } from './create-fase.dto';

export class UpdateFaseDto extends PartialType(CreateFaseDto) {}