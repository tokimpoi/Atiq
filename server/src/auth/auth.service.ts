import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';

import * as bycrpt from 'bcrypt';
import { Payload } from './payload.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async createUser(creteUserDto: CreateUserDto): Promise<void> {
    const { username, password } = creteUserDto;

    const salt = await bycrpt.genSalt();
    const hashedPassword = await bycrpt.hash(password, salt);

    const user = this.userRepository.create({
      username,
      password: hashedPassword,
    });

    try {
      await this.userRepository.save(user);
    } catch (e) {
      throw new InternalServerErrorException(
        'server error try to register again',
      );
    }
  }

  async logIn(createUserDto: CreateUserDto) {
    const { username, password } = createUserDto;

    const user = await this.userRepository.findOne({
      where: {
        username: username,
      },
    });

    if (user && (await bycrpt.compare(password, user.password))) {
      const payload: Payload = { username };

      const jwt = await this.jwtService.sign(payload);

      return { jwt };
    } else {
      throw new NotFoundException('Wrong user information');
    }
  }
}
