import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class CommonDatesGQL {
  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field()
  deletedAt: Date;
}
