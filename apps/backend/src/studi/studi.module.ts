import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Studio } from './studio.entity';
import { StudiService } from './studi.service';
import { StudiController } from './studi.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Studio])],
  controllers: [StudiController],
  providers: [StudiService],
  exports: [StudiService],
})
export class StudiModule {}
