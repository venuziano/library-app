// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';

// import { BcryptPasswordHasher } from 'src/domain/auth/auth.entity';
// import { UserService } from '../user/user.service';
// import { RegisterDto } from './dtos/register.dto';
// import { LoginDto } from './dtos/login.dto';
// import { JwtPayload } from 'src/domain/auth/jwt-payload.interface';

// @Injectable()
// export class AuthService {
//   constructor(
//     private readonly userService: UserService,
//     private readonly jwtService: JwtService,
//     private readonly hasher: BcryptPasswordHasher,
//   ) {}

//   async signUp(registerDto: RegisterDto): Promise<{ accessToken: string }> {
//     const hashedPassword = await this.hasher.hash(registerDto.password);

//     const user = await this.userService.create({
//       username: registerDto.username,
//       email: registerDto.email,
//       password: hashedPassword,
//       firstname: registerDto.firstname,
//       lastname: registerDto.lastname,
//     });

//     const payload: JwtPayload = {
//       sub: user.id!.toString(),
//       username: user.username,
//     };

//     const accessToken = this.jwtService.sign(payload);
//     return { accessToken };
//   }

//   async signIn(loginDto: LoginDto): Promise<{ accessToken: string }> {
//     const user = await this.userService.findByEmail(loginDto.email);
//     if (!user) {
//       throw new UnauthorizedException('Invalid credentials');
//     }

//     const passwordMatches = await this.hasher.compare(
//       loginDto.password,
//       user.password,
//     );
//     if (!passwordMatches) {
//       throw new UnauthorizedException('Invalid credentials');
//     }

//     const payload: JwtPayload = {
//       sub: user.id.toString(),
//       username: user.username,
//       // roles: user.roles,
//     };

//     const accessToken = this.jwtService.sign(payload);
//     return { accessToken };
//   }
// }
