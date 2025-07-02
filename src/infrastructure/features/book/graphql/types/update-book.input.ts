import { InputType, Field, Int } from '@nestjs/graphql';

import { CreateBookInput } from './create-book.input';

@InputType()
export class UpdateBookInput extends CreateBookInput {
  @Field(() => Int)
  id: number;
}
