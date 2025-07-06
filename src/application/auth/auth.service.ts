import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';

import { BcryptPasswordHasher } from 'src/domain/auth/auth.entity';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { JwtPayload } from 'src/domain/auth/jwt-payload.interface';
import { User } from 'src/domain/user/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly hasher: BcryptPasswordHasher,
    private readonly dataSource: DataSource,
  ) {}

  async signUp(registerDto: RegisterDto): Promise<{ accessToken: string }> {
    const result = await this.dataSource.transaction(async (manager) => {
      const hashed = await this.hasher.hash(registerDto.password);

      const newUser = User.create({
        username: registerDto.username,
        email: registerDto.email,
        password: hashed,
        firstname: registerDto.firstname,
        lastname: registerDto.lastname,
      });

      const saved = await this.userService.create(newUser, manager);

      const payload: JwtPayload = {
        sub: saved.id!.toString(),
        username: saved.username,
      };
      const token = this.jwtService.sign(payload);

      return { user: saved, token };
    });

    //retry failed emails
    return { accessToken: result.token };
  }

  // async signIn(loginDto: LoginDto): Promise<{ accessToken: string }> {
  //   const user = await this.userService.findByEmail(loginDto.email);
  //   if (!user) {
  //     throw new UnauthorizedException('Invalid credentials');
  //   }

  //   const passwordMatches = await this.hasher.compare(
  //     loginDto.password,
  //     user.password,
  //   );
  //   if (!passwordMatches) {
  //     throw new UnauthorizedException('Invalid credentials');
  //   }

  //   const payload: JwtPayload = {
  //     sub: user.id!.toString(),
  //     username: user.username,
  //     // roles: user.roles,
  //   };

  //   const accessToken = this.jwtService.sign(payload);
  //   return { accessToken };
  // }
}
