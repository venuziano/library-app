import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedData1753497117442 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Seed tables via the stored procedures
    await queryRunner.query(`SELECT seed_users(10);`);
    await queryRunner.query(`SELECT seed_authors(10);`);
    await queryRunner.query(`SELECT seed_categories(10);`);
    await queryRunner.query(`SELECT seed_books(10);`);
    await queryRunner.query(`SELECT seed_book_categories(10);`);
    await queryRunner.query(`SELECT seed_rentals(10);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove seeded data
    await queryRunner.query(`
      TRUNCATE rental, book_categories, book, category, author, "user" 
        RESTART IDENTITY CASCADE;
    `);
  }
}
