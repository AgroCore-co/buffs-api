import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../../database/schema';
import * as relations from '../../database/relations';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;
  public db: NodePgDatabase<typeof schema & typeof relations>;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    this.logger.log('Initializing database connection pool...');

    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 10, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // Timeout after 10 seconds
    });

    // Initialize Drizzle with schema and relations
    this.db = drizzle(this.pool, {
      schema: { ...schema, ...relations },
      logger: this.configService.get<string>('NODE_ENV') === 'development',
    });

    // Test connection
    try {
      const client = await this.pool.connect();
      this.logger.log('✅ Database connection pool initialized successfully');
      client.release();
    } catch (error) {
      this.logger.error('❌ Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('Closing database connection pool...');
    await this.pool.end();
    this.logger.log('✅ Database connection pool closed');
  }

  /**
   * Get the Drizzle database instance
   */
  getDb() {
    return this.db;
  }

  /**
   * Get the underlying connection pool
   */
  getPool() {
    return this.pool;
  }
}
