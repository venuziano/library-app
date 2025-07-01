import { InputType, Field, Int } from '@nestjs/graphql';

import { CreateAuthorInput } from './create-author.input';

@InputType()
export class UpdateAuthorInput extends CreateAuthorInput {
  @Field(() => Int)
  id: number;
}
