const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Creating Storage Buckets...');
  
  await prisma.$executeRawUnsafe(`
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('question-papers', 'question-papers', true)
    ON CONFLICT (id) DO NOTHING;
  `);
  
  await prisma.$executeRawUnsafe(`
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('resources', 'resources', true)
    ON CONFLICT (id) DO NOTHING;
  `);

  console.log('Creating permissive policies for anonymous uploads (for dev)...');

  try {
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow public insert" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'question-papers' OR bucket_id = 'resources');
    `);
  } catch(e) { console.log('Insert policy may already exist.'); }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow public select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'question-papers' OR bucket_id = 'resources');
    `);
  } catch(e) { console.log('Select policy may already exist.'); }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow public update" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'question-papers' OR bucket_id = 'resources');
    `);
  } catch(e) { console.log('Update policy may already exist.'); }
  
  console.log('Buckets and Policies configured successfully!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
