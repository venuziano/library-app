import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class VerifyEmailPayload {
  @Field()
  message: string;
} 