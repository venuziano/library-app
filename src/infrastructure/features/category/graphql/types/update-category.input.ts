import { InputType, Field, Int } from '@nestjs/graphql';

import { CreateCategoryInput } from './create-category.input';

@InputType()
export class UpdateCategoryInput extends CreateCategoryInput {
  @Field(() => Int)
  id: number;
}
