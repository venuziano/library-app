import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MessageGQL {
  @Field()
  message: string;
}
