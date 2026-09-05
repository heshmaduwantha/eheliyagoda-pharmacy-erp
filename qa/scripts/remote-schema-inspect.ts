import { prisma } from "@/lib/prisma";

async function main() {
  const [migrations, columns, constraints] = await Promise.all([
    prisma.$queryRaw<Array<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }>>`
      SELECT migration_name, finished_at, rolled_back_at
      FROM "_prisma_migrations"
      ORDER BY finished_at NULLS LAST, migration_name
    `,
    prisma.$queryRaw<Array<{ table_name: string; column_name: string; data_type: string; is_nullable: string }>>`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('ProductUnit', 'SupplierReturn', 'SupplierInvoice', 'Batch')
      ORDER BY table_name, ordinal_position
    `,
    prisma.$queryRaw<Array<{ table_name: string; constraint_name: string; definition: string }>>`
      SELECT c.relname AS table_name, con.conname AS constraint_name, pg_get_constraintdef(con.oid) AS definition
      FROM pg_constraint con
      JOIN pg_class c ON c.oid = con.conrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname IN ('ProductUnit', 'SupplierReturn', 'SupplierInvoice', 'Batch')
      ORDER BY c.relname, con.conname
    `,
  ]);

  console.log(JSON.stringify({ migrations, columns, constraints }, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
