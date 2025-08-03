/**
 * Migration script to convert absence dates from Date objects to strings
 * Run this once to fix existing data
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/barbershop', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const BarberAbsence = require('./models/barber-absence.model');

async function migrateAbsenceDates() {
  try {
    console.log('🔄 Starting absence date migration...');

    // Find all absence records
    const absences = await BarberAbsence.find({});
    console.log(`📋 Found ${absences.length} absence records to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const absence of absences) {
      console.log(`\n📅 Processing absence ${absence._id}:`);
      console.log(`  Current startDate: ${absence.startDate} (${typeof absence.startDate})`);
      console.log(`  Current endDate: ${absence.endDate} (${typeof absence.endDate})`);

      let needsUpdate = false;
      let newStartDate = absence.startDate;
      let newEndDate = absence.endDate;

      // Convert startDate if it's a Date object
      if (absence.startDate instanceof Date) {
        newStartDate = absence.startDate.toISOString().split('T')[0];
        needsUpdate = true;
        console.log(`  ✅ Converting startDate: ${absence.startDate} → ${newStartDate}`);
      }

      // Convert endDate if it's a Date object
      if (absence.endDate instanceof Date) {
        newEndDate = absence.endDate.toISOString().split('T')[0];
        needsUpdate = true;
        console.log(`  ✅ Converting endDate: ${absence.endDate} → ${newEndDate}`);
      }

      if (needsUpdate) {
        // Update the record directly in MongoDB to bypass schema validation
        await mongoose.connection.collection('barberabsences').updateOne(
          { _id: absence._id },
          {
            $set: {
              startDate: newStartDate,
              endDate: newEndDate
            }
          }
        );
        
        console.log(`  ✅ Updated absence ${absence._id}`);
        migratedCount++;
      } else {
        console.log(`  ⏭️ Skipping absence ${absence._id} (already string format)`);
        skippedCount++;
      }
    }

    console.log('\n🎉 Migration completed!');
    console.log(`📊 Results:`);
    console.log(`  - Migrated: ${migratedCount} records`);
    console.log(`  - Skipped: ${skippedCount} records`);
    console.log(`  - Total: ${absences.length} records`);

    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const verifyAbsences = await BarberAbsence.find({});
    
    for (const absence of verifyAbsences) {
      if (absence.startDate instanceof Date || absence.endDate instanceof Date) {
        console.log(`❌ Migration failed for absence ${absence._id}`);
        console.log(`  startDate: ${absence.startDate} (${typeof absence.startDate})`);
        console.log(`  endDate: ${absence.endDate} (${typeof absence.endDate})`);
      }
    }

    console.log('✅ Migration verification completed');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
  }
}

// Run migration
migrateAbsenceDates();
