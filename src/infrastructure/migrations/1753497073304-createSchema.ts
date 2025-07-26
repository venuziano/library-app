import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSchema1753497073304 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tables and Indexes
    await queryRunner.query(`
      CREATE TABLE subscription_plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        stripe_price_id VARCHAR(30),
        price_cents INT NOT NULL,
        stripe_product_id VARCHAR(30),
        interval VARCHAR(20) NOT NULL,
        currency VARCHAR(5) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );

      CREATE TABLE "user" (
        id SERIAL PRIMARY KEY,
        username VARCHAR(40) NOT NULL UNIQUE,
        firstname VARCHAR(50),
        lastname VARCHAR(50),
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        stripe_customer_id VARCHAR(50),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );

      CREATE UNIQUE INDEX idx_user_username_lower 
        ON "user"(lower(username));
      CREATE INDEX idx_user_firstname_lower
        ON "user"(lower(firstname));
      CREATE INDEX idx_user_lastname_lower
        ON "user"(lower(lastname));
      CREATE UNIQUE INDEX idx_user_email_lower
        ON "user"(lower(email));
      CREATE INDEX idx_user_created_at
        ON "user"(created_at);
      CREATE INDEX idx_user_updated_at
        ON "user"(updated_at);

      CREATE TABLE user_token (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL
          REFERENCES "user"(id) ON DELETE CASCADE,
        token_type VARCHAR(30) NOT NULL
          CHECK (token_type IN ('email_verification', 'password_reset')),
        code VARCHAR(64) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        consumed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_user_token_user_id ON user_token(user_id);
      CREATE INDEX idx_user_token_code ON user_token(code);
      CREATE INDEX idx_user_token_consumed_at ON user_token(consumed_at);

      CREATE TABLE subscription (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        subscription_plan_id INT NOT NULL,
        stripe_subscription_id VARCHAR(50),
        stripe_customer_id VARCHAR(50),
        status VARCHAR(20),
        cancel_at_period_end BOOLEAN DEFAULT FALSE,
        current_period_start DATE,
        current_period_end DATE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        canceled_at TIMESTAMPTZ,
        metadata JSONB,
        CONSTRAINT fk_sub_user FOREIGN KEY (user_id)
          REFERENCES "user"(id) ON DELETE CASCADE,
        CONSTRAINT fk_sub_plan FOREIGN KEY (subscription_plan_id)
          REFERENCES subscription_plans(id) ON DELETE RESTRICT
      );

      CREATE TABLE author (
        id SERIAL PRIMARY KEY,
        firstname VARCHAR(50) NOT NULL,
        lastname VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );
      CREATE INDEX idx_author_firstname_lower
        ON author(lower(firstname));
      CREATE INDEX idx_author_lastname_lower
        ON author(lower(lastname));
      CREATE INDEX idx_author_created_at
        ON author(created_at);
      CREATE INDEX idx_author_updated_at
        ON author(updated_at);

      CREATE TABLE book (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        publisher VARCHAR(100),
        publication_date DATE,
        page_count INT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );
      CREATE INDEX idx_book_firstname_lower
        ON book(lower(title));
      CREATE INDEX idx_book_lastname_lower
        ON book(lower(publisher));
      CREATE INDEX idx_book_publication_date
        ON book(publication_date);
      CREATE INDEX idx_book_page_count
        ON book(page_count);
      CREATE INDEX idx_book_created_at
        ON book(created_at);
      CREATE INDEX idx_book_updated_at
        ON book(updated_at);

      CREATE TABLE book_author (
        book_id INT NOT NULL,
        author_id INT NOT NULL,
        PRIMARY KEY (book_id, author_id),
        CONSTRAINT fk_ba_book FOREIGN KEY (book_id)
          REFERENCES book(id) ON DELETE CASCADE,
        CONSTRAINT fk_ba_author FOREIGN KEY (author_id)
          REFERENCES author(id) ON DELETE RESTRICT
      );

      CREATE TABLE category (
        id SERIAL PRIMARY KEY,
        name VARCHAR(40) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );
      CREATE INDEX idx_category_name_lower
        ON category(lower(name));
      CREATE INDEX idx_category_created_at
        ON category(created_at);
      CREATE INDEX idx_category_updated_at
        ON category(updated_at);

      CREATE TABLE book_categories (
        book_id INT NOT NULL,
        category_id INT NOT NULL,
        PRIMARY KEY (book_id, category_id),
        CONSTRAINT fk_bc_book FOREIGN KEY (book_id)
          REFERENCES book(id) ON DELETE CASCADE,
        CONSTRAINT fk_bc_category FOREIGN KEY (category_id)
          REFERENCES category(id) ON DELETE RESTRICT
      );
      CREATE INDEX idx_book_categories_book
        ON book_categories(book_id);
      CREATE INDEX idx_book_categories_category
        ON book_categories(category_id);

      CREATE TABLE rental (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        book_id INT NOT NULL,
        rented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        due_at DATE,
        returned_at DATE,
        is_delayed BOOLEAN DEFAULT FALSE,
        price_cents INT,
        CONSTRAINT fk_rental_user FOREIGN KEY (user_id)
          REFERENCES "user"(id) ON DELETE CASCADE,
        CONSTRAINT fk_rental_book FOREIGN KEY (book_id)
          REFERENCES book(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_rental_user
        ON rental(user_id);
      CREATE INDEX idx_rental_book
        ON rental(book_id);

      CREATE INDEX idx_subscription_user
        ON subscription(user_id);
      CREATE INDEX idx_subscription_plan
        ON subscription(subscription_plan_id);
    `);

    // Stored Procedures
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION seed_users(p_count INT) RETURNS VOID AS $$
      BEGIN
        FOR i IN 1..p_count LOOP
          INSERT INTO "user"(username, firstname, lastname, email, stripe_customer_id, password)
          VALUES (
            format('user_%s', i),
            format('First%s', i),
            format('Last%s', i),
            format('user%s@example.com', i),
            NULL,
            'password'
          );
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION seed_authors(p_count INT) RETURNS VOID AS $$
      BEGIN
        FOR i IN 1..p_count LOOP
          INSERT INTO author(firstname, lastname)
          VALUES (
            format('AuthorFirst%s', i),
            format('AuthorLast%s', i)
          );
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION seed_categories(p_count INT) RETURNS VOID AS $$
      BEGIN
        FOR i IN 1..p_count LOOP
          INSERT INTO category(name)
          VALUES ( format('Category%s', i) );
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION seed_books(p_count INT) RETURNS VOID AS $$
      DECLARE
        author_count INT := (SELECT COUNT(*) FROM author);
      BEGIN
        IF author_count = 0 THEN
          RAISE EXCEPTION 'No authors found. Run seed_authors() first.';
        END IF;
        FOR i IN 1..p_count LOOP
          INSERT INTO book(title, publisher, publication_date, page_count)
          VALUES (
            format('Book Title %s', i),
            format('Publisher %s', i),
            CURRENT_DATE - (i || ' days')::INTERVAL,
            (floor(random() * 400) + 50)::INT
          );
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION seed_book_categories(p_count INT) RETURNS VOID AS $$
      DECLARE
        book_count     INT := (SELECT COUNT(*) FROM book);
        category_count INT := (SELECT COUNT(*) FROM category);
      BEGIN
        IF book_count = 0 OR category_count = 0 THEN
          RAISE EXCEPTION 'Need books and categories first.';
        END IF;
        FOR i IN 1..p_count LOOP
          INSERT INTO book_categories(book_id, category_id)
          VALUES (
            ((i - 1) % book_count) + 1,
            ((i - 1) % category_count) + 1
          )
          ON CONFLICT DO NOTHING;
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION seed_rentals(p_count INT) RETURNS VOID AS $$
      DECLARE
        user_count INT := (SELECT COUNT(*) FROM "user");
        book_count INT := (SELECT COUNT(*) FROM book);
        r_at TIMESTAMPTZ;
        r_due DATE;
        r_ret DATE;
        delayed BOOLEAN;
      BEGIN
        IF user_count = 0 OR book_count = 0 THEN
          RAISE EXCEPTION 'Need users and books first.';
        END IF;
        FOR i IN 1..p_count LOOP
          r_at := NOW() - (i || ' days')::INTERVAL;
          r_due := (r_at + INTERVAL '14 days')::DATE;
          IF (i % 2) = 0 THEN
            r_ret := (r_at + INTERVAL '16 days')::DATE;
          ELSE
            r_ret := (r_at + INTERVAL '10 days')::DATE;
          END IF;
          delayed := r_ret > r_due;
          INSERT INTO rental(
            user_id, book_id, rented_at, due_at,
            returned_at, is_delayed, price_cents
          )
          VALUES (
            ((i - 1) % user_count) + 1,
            ((i - 1) % book_count) + 1,
            r_at, r_due, r_ret, delayed,
            (floor(random() * 900) + 100)::INT
          );
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION seed_all(p_count INT) RETURNS VOID AS $$
      BEGIN
        PERFORM seed_users(p_count);
        PERFORM seed_authors(p_count);
        PERFORM seed_categories(p_count);
        PERFORM seed_books(p_count);
        PERFORM seed_book_categories(p_count);
        PERFORM seed_rentals(p_count);
      END;
      $$ LANGUAGE plpgsql;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop procedures
    await queryRunner.query(`
      DROP FUNCTION IF EXISTS seed_all(INT);
      DROP FUNCTION IF EXISTS seed_rentals(INT);
      DROP FUNCTION IF EXISTS seed_book_categories(INT);
      DROP FUNCTION IF EXISTS seed_books(INT);
      DROP FUNCTION IF EXISTS seed_categories(INT);
      DROP FUNCTION IF EXISTS seed_authors(INT);
      DROP FUNCTION IF EXISTS seed_users(INT);
    `);

    // Drop tables (in reverse-dependency order)
    await queryRunner.query(`
      DROP TABLE IF EXISTS rental;
      DROP TABLE IF EXISTS book_categories;
      DROP TABLE IF EXISTS category;
      DROP TABLE IF EXISTS book_author;
      DROP TABLE IF EXISTS book;
      DROP TABLE IF EXISTS author;
      DROP TABLE IF EXISTS subscription;
      DROP TABLE IF EXISTS user_token;
      DROP TABLE IF EXISTS "user";
      DROP TABLE IF EXISTS subscription_plans;
    `);
  }
}
