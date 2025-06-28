import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateAuthorInput {
  @Field(() => String)
  firstname: string;

  @Field(() => String)
  lastname: string;
}
