import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateAuthorInput {
  @Field()
  firstname: string;

  @Field()
  lastname: string;
}
