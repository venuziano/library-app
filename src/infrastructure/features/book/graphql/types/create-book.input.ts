import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class CreateBookInput {
  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  publisher?: string;

  @Field({ nullable: true })
  publicationDate?: Date;

  @Field(() => Int, { nullable: true })
  pageCount?: number;

  @Field(() => [Int])
  categoryIds: number[];

  @Field(() => [Int])
  authorIds: number[];
}
