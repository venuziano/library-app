import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

import { CreateAuthorInput } from './create-author.input';

@InputType()
export class PatchAuthorInput extends PartialType(CreateAuthorInput) {
  @Field(() => Int)
  id: number;
}
