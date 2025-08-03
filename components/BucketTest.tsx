// components/BucketTest.tsx
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../supabase'; // Make sure this path is correct

export const BucketTest = () => {

  const runUploadTest = async () => {
    console.log("--- STARTING UPLOAD TEST ---");

    // Let's verify the keys ONE LAST TIME right before we use them.
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log("TESTING WITH URL:", supabaseUrl);
    console.log("TESTING WITH KEY:", supabaseKey ? `${supabaseKey.substring(0, 8)}...` : "KEY IS MISSING");

    try {
      const { data, error } = await supabase.storage
        .from('report') // The bucket name we are testing
        .upload('test-from-app.txt', 'hello world', {
          cacheControl: '3600',
          upsert: true, // Overwrite the file if it exists
          contentType: 'text/plain'
        });

      if (error) {
        // If there's an error, throw it to the catch block
        throw error;
      }
      
      console.log("SUCCESS! File uploaded.", data);
      Alert.alert("Success!", "The test file was successfully uploaded to the 'report' bucket.");

    } catch (error) {
      console.error("TEST FAILED:", JSON.stringify(error, null, 2));
      Alert.alert("Test Failed", `Error: ${error.message}`);
    } finally {
        console.log("--- TEST FINISHED ---");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase Storage Test</Text>
      <TouchableOpacity style={styles.button} onPress={runUploadTest}>
        <Text style={styles.buttonText}>Run Upload Test</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});