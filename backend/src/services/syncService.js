const prisma = require('../utils/prisma');
const supabase = require('../utils/supabase');

const runAuthSync = async () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('[SyncService] Skipping Auth Synchronization: SUPABASE_SERVICE_ROLE_KEY is required for admin actions.');
    return;
  }
  console.log('[SyncService] Starting Auth Synchronization...');
  try {
    // 1. Fetch all Supabase users
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error('[SyncService] Failed to fetch Supabase users:', error);
      return;
    }

    const supabaseUserIds = users.map(u => u.id);

    // 2. Fetch all Prisma users
    const prismaUsers = await prisma.user.findMany({ select: { id: true, email: true } });
    const prismaUserIds = prismaUsers.map(u => u.id);

    // 3. Find Orphans
    const orphansInSupabase = users.filter(u => !prismaUserIds.includes(u.id));
    const orphansInPrisma = prismaUsers.filter(u => !supabaseUserIds.includes(u.id));

    // 4. Heal: Delete orphan Auth records in Supabase (as recommended for security)
    for (const orphan of orphansInSupabase) {
      console.log(`[SyncService] Deleting orphaned Supabase auth user: ${orphan.email} (${orphan.id})`);
      await supabase.auth.admin.deleteUser(orphan.id);
    }

    // 5. Heal: Handle orphan Prisma records (rare, usually means Supabase user was deleted manually)
    for (const orphan of orphansInPrisma) {
      console.log(`[SyncService] Found orphaned Prisma user: ${orphan.email} (${orphan.id}). Proceeding to delete from DB to maintain consistency.`);
      try {
        await prisma.user.delete({ where: { id: orphan.id } });
      } catch(err) {
         console.log(`[SyncService] Could not delete Prisma orphan ${orphan.id} due to foreign key constraints, skipping...`);
      }
    }

    console.log('[SyncService] Auth Synchronization Complete.');
  } catch (error) {
    console.error('[SyncService] Error during auth sync:', error);
  }
};

const runStorageSync = async () => {
  console.log('[SyncService] Starting Storage Synchronization...');
  try {
    const buckets = ['pyq', 'resources'];
    
    for (const bucket of buckets) {
      // List all files in the bucket
      const { data: files, error } = await supabase.storage.from(bucket).list('', { limit: 1000 });
      if (error) {
        console.error(`[SyncService] Failed to list bucket ${bucket}:`, error);
        continue;
      }

      // Filter out system files or folders
      const validFiles = files.filter(f => f.name !== '.emptyFolderPlaceholder');

      for (const file of validFiles) {
        const filePath = file.name;
        
        let existsInDb = false;
        if (bucket === 'pyq') {
          const paper = await prisma.questionPaper.findFirst({ where: { filePath } });
          existsInDb = !!paper;
        } else if (bucket === 'resources') {
          const resource = await prisma.resource.findFirst({ where: { filePath } });
          existsInDb = !!resource;
        }

        if (!existsInDb) {
          console.log(`[SyncService] Deleting orphaned file from ${bucket}: ${filePath}`);
          await supabase.storage.from(bucket).remove([filePath]);
        }
      }
    }

    console.log('[SyncService] Storage Synchronization Complete.');
  } catch (error) {
    console.error('[SyncService] Error during storage sync:', error);
  }
};

const initSyncJobs = () => {
  // Run on startup
  setTimeout(() => {
    runAuthSync();
    runStorageSync();
  }, 5000); // 5 second delay to let server boot up completely

  // Run periodically every 12 hours
  const TWELVE_HOURS = 12 * 60 * 60 * 1000;
  setInterval(() => {
    runAuthSync();
    runStorageSync();
  }, TWELVE_HOURS);
};

module.exports = {
  runAuthSync,
  runStorageSync,
  initSyncJobs
};
