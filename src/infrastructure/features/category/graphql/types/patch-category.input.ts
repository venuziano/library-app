import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

import { CreateCategoryInput } from './create-category.input';

@InputType()
export class PatchCategoryInput extends PartialType(CreateCategoryInput) {
  @Field(() => Int)
  id: number;
}
