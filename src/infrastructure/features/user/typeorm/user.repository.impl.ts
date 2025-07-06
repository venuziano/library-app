import { Injectable } from '@nestjs/common';
import { EntityManager, FindManyOptions, ILike, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { UserOrm } from './user.orm-entity';
import { UserRepository } from 'src/domain/user/user.repository';
import { User } from 'src/domain/user/user.entity';
import {
  Pagination,
  PaginationResult,
} from 'src/domain/pagination/pagination.entity';

@Injectable()
export class UserRepositoryImpl implements UserRepository {
  constructor(
    @InjectRepository(UserOrm)
    private readonly userRepository: Repository<UserOrm>,
  ) {}

  private toDomain(user: UserOrm): User {
    return User.reconstitute({
      id: user.id,
      username: user.username,
      password: user.password,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      stripeCustomerId: user.stripeCustomerId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    });
  }

  async findAll(properties: Pagination): Promise<PaginationResult<User>> {
    const { searchTerm } = properties;

    const query: FindManyOptions<UserOrm> = {
      take: properties.limit,
      skip: properties.offset,
      order: { [properties.sortBy]: properties.order },
      select: [
        'id',
        'username',
        'firstname',
        'lastname',
        'email',
        'stripeCustomerId',
        'createdAt',
        'updatedAt',
      ],
      where: searchTerm
        ? [
            { username: ILike(`%${searchTerm}%`) },
            { firstname: ILike(`%${searchTerm}%`) },
            { lastname: ILike(`%${searchTerm}%`) },
            { email: ILike(`%${searchTerm}%`) },
          ]
        : undefined,
    };

    const [entities, totalItems] =
      await this.userRepository.findAndCount(query);

    const items: User[] = entities.map((entity) => this.toDomain(entity));

    return new PaginationResult(
      items,
      properties.page,
      properties.limit,
      totalItems,
    );
  }

  private async findOrmById(id: number): Promise<UserOrm | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    const foundUser: UserOrm | null = await this.userRepository.findOne({
      where: { email },
    });
    return foundUser ? this.toDomain(foundUser) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const foundUser: UserOrm | null = await this.userRepository.findOne({
      where: { username },
    });
    return foundUser ? this.toDomain(foundUser) : null;
  }

  async findById(id: number): Promise<User | null> {
    const foundUser: UserOrm | null = await this.findOrmById(id);
    return foundUser ? this.toDomain(foundUser) : null;
  }

  async findByIds(ids: number[]): Promise<User[] | []> {
    if (!ids || ids.length === 0) return [];

    const foundOrms: UserOrm[] = await this.userRepository.find({
      where: { id: In(ids) },
    });

    return foundOrms.map((orm) => this.toDomain(orm));
  }

  async create(user: User, manager?: EntityManager): Promise<User> {
    const repository: Repository<UserOrm> = manager
      ? manager.getRepository(UserOrm)
      : this.userRepository;

    const newUserOrm = repository.create({
      username: user.username,
      password: user.password,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      stripeCustomerId: user.stripeCustomerId,
    });

    const savedOrm = await repository.save(newUserOrm);

    return User.reconstitute({
      id: savedOrm.id,
      username: savedOrm.username,
      password: user.password,
      firstname: savedOrm.firstname,
      lastname: savedOrm.lastname,
      email: savedOrm.email,
      stripeCustomerId: savedOrm.stripeCustomerId,
      createdAt: savedOrm.createdAt,
      updatedAt: savedOrm.updatedAt,
      deletedAt: savedOrm.deletedAt,
    });
  }

  async update(user: User): Promise<User | null> {
    const toUpdate: UserOrm | undefined = await this.userRepository.preload({
      id: user.id!,
      username: user.username,
      password: user.password,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      stripeCustomerId: user.stripeCustomerId,
    });

    if (!toUpdate) return null;

    const updatedOrm: UserOrm = await this.userRepository.save(toUpdate);

    return User.reconstitute({
      id: updatedOrm.id,
      username: updatedOrm.username,
      password: user.password,
      firstname: updatedOrm.firstname,
      lastname: updatedOrm.lastname,
      email: updatedOrm.email,
      stripeCustomerId: updatedOrm.stripeCustomerId,
      createdAt: updatedOrm.createdAt,
      updatedAt: updatedOrm.updatedAt,
      deletedAt: updatedOrm.deletedAt,
    });
  }

  async delete(user: User): Promise<User | null> {
    const existing: UserOrm | null = await this.findOrmById(user.id as number);
    if (!existing) return null;

    const now = new Date();
    existing.deletedAt = now;
    existing.updatedAt = now;

    const deletedOrm = await this.userRepository.save(existing);

    return User.reconstitute({
      id: deletedOrm.id,
      username: deletedOrm.username,
      password: user.password,
      firstname: deletedOrm.firstname,
      lastname: deletedOrm.lastname,
      email: deletedOrm.email,
      stripeCustomerId: deletedOrm.stripeCustomerId,
      createdAt: deletedOrm.createdAt,
      updatedAt: deletedOrm.updatedAt,
      deletedAt: deletedOrm.deletedAt,
    });
  }
}
