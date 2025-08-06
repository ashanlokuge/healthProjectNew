// Test Storage Setup Script
// Run this in your browser console after logging into your app

async function testStorageSetup() {
  console.log('🧪 Testing Storage Setup...');
  
  // Import supabase client (assuming it's available globally)
  const { supabase } = window;
  
  if (!supabase) {
    console.error('❌ Supabase client not found. Make sure you are on a page where it is loaded.');
    return;
  }

  try {
    // Test 1: Check if buckets exist
    console.log('\n📦 Testing bucket existence...');
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }
    
    const hazardImagesBucket = buckets.find(b => b.name === 'hazard-images');
    const evidenceFilesBucket = buckets.find(b => b.name === 'evidence-files');
    
    console.log('Available buckets:', buckets.map(b => b.name));
    console.log('✅ hazard-images bucket:', hazardImagesBucket ? 'EXISTS' : '❌ MISSING');
    console.log('✅ evidence-files bucket:', evidenceFilesBucket ? 'EXISTS' : '❌ MISSING');
    
    // Test 2: Test upload permissions (create a small test file)
    console.log('\n🔐 Testing upload permissions...');
    
    // Create a small test file
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const testFileName = `test-${Date.now()}.txt`;
    
    // Test hazard-images bucket
    if (hazardImagesBucket) {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('hazard-images')
        .upload(testFileName, testFile);
      
      if (uploadError) {
        console.error('❌ Upload to hazard-images failed:', uploadError);
      } else {
        console.log('✅ Upload to hazard-images successful:', uploadData);
        
        // Clean up test file
        await supabase.storage.from('hazard-images').remove([testFileName]);
        console.log('🧹 Test file cleaned up');
      }
    }
    
    // Test evidence-files bucket
    if (evidenceFilesBucket) {
      const { data: uploadData2, error: uploadError2 } = await supabase.storage
        .from('evidence-files')
        .upload(testFileName, testFile);
      
      if (uploadError2) {
        console.error('❌ Upload to evidence-files failed:', uploadError2);
      } else {
        console.log('✅ Upload to evidence-files successful:', uploadData2);
        
        // Clean up test file
        await supabase.storage.from('evidence-files').remove([testFileName]);
        console.log('🧹 Test file cleaned up');
      }
    }
    
    console.log('\n🎉 Storage setup test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testStorageSetup();