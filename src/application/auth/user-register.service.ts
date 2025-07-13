import { Injectable } from '@nestjs/common';

import { UserService } from '../user/user.service';
import { RegisterDto } from './dtos/register.dto';
import { MessageDto } from '../shared/dtos/message.dto';

@Injectable()
export class UserRegistrationService {
  constructor(private readonly userService: UserService) {}

  async signUp(registerDto: RegisterDto): Promise<MessageDto> {
    await this.userService.create(registerDto);
    return { message: 'Account created successfully' };
  }
}
