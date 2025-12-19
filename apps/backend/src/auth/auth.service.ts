// apps/backend/src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Normalizza email in lowercase
    const normalizedEmail = registerDto.email.toLowerCase().trim();

    // Verifica se l'email è già in uso
    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('Email già registrata');
    }

    // Hash della password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Crea nuovo utente
    const user = this.userRepository.create({
      email: normalizedEmail,
      password: hashedPassword,
      nome: registerDto.nome,
      cognome: registerDto.cognome,
      ruolo: registerDto.ruolo || 'collaboratore',
      clienteId: registerDto.clienteId || null,
    });

    await this.userRepository.save(user);

    // Genera token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      ruolo: user.ruolo,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        cognome: user.cognome,
        ruolo: user.ruolo,
        clienteId: user.clienteId,
        attivo: user.attivo,
      },
    };
  }

  async login(loginDto: LoginDto) {
    // Normalizza email in lowercase
    const normalizedEmail = loginDto.email.toLowerCase().trim();

    // Trova utente
    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException('Credenziali non valide');
    }

    if (!user.attivo) {
      throw new UnauthorizedException('Utente disattivato');
    }

    // Verifica password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenziali non valide');
    }

    // Aggiorna lastLogin
    await this.userRepository.update(user.id, { lastLogin: new Date() });

    // Genera token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      ruolo: user.ruolo,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        cognome: user.cognome,
        ruolo: user.ruolo,
        clienteId: user.clienteId,
        attivo: user.attivo,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Utente non trovato');
    }

    const { password, ...result } = user;
    return result;
  }
}
