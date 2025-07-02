import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

import { CreateBookInput } from './create-book.input';

@InputType()
export class PatchBookInput extends PartialType(CreateBookInput) {
  @Field(() => Int)
  id: number;
}
