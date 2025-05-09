import { ObjectType, Field, GraphQLISODateTime } from '@nestjs/graphql';
import { Type } from 'class-transformer';

@ObjectType()
export class CommonDatesGQL {
  @Field(() => GraphQLISODateTime)
  @Type(() => Date)
  createdAt: Date;

  @Field(() => GraphQLISODateTime)
  @Type(() => Date)
  updatedAt: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @Type(() => Date)
  deletedAt: Date;
}
