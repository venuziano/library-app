import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { plainToClass } from 'class-transformer';

import { UserService } from '../../../../application/user/user.service';
import { UserGQL, PaginatedUsersGQL } from './types/user.gql';
import { CreateUserInput } from './types/create-user.input';
import { UpdateUserInput } from './types/update-user.input';
import { PatchUserInput } from './types/patch-user.input';
import { PaginationGQL } from 'src/infrastructure/graphql/shared/pagination.input.gql';
import { toPaginatedGQL } from 'src/infrastructure/graphql/shared/pagination.output.gql';

@Resolver(() => UserGQL)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => PaginatedUsersGQL, { name: 'getAllUsers' })
  async users(@Args() pagination: PaginationGQL): Promise<PaginatedUsersGQL> {
    const users = await this.userService.findAll(pagination);
    return toPaginatedGQL(users, (user) => plainToClass(UserGQL, user));
  }

  @Query(() => UserGQL, { name: 'getUserById', nullable: true })
  getById(@Args('id', { type: () => ID }) id: number) {
    return this.userService.findById(id);
  }

  @Mutation(() => UserGQL, { name: 'createUser' })
  createUser(@Args('input') input: CreateUserInput) {
    return this.userService.create(input);
  }

  @Mutation(() => UserGQL, { name: 'updateUser' })
  updateUser(@Args('input') input: UpdateUserInput) {
    return this.userService.update(input);
  }

  @Mutation(() => UserGQL, { name: 'patchUser' })
  patchUser(@Args('input') input: PatchUserInput) {
    return this.userService.patch(input);
  }

  @Mutation(() => UserGQL, { name: 'deleteUser' })
  deleteUser(@Args('id', { type: () => Int }) id: number) {
    return this.userService.delete(id);
  }
}
