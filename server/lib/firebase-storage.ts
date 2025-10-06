// server/lib/firebase-storage.ts
import { db, storage } from './firebase.js';
import type { FoodAnalysis, InsertFoodAnalysis } from "@shared/schema";

export class FirebaseStorage {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    console.log('🔄 FirebaseStorage created for user:', userId);
  }

  private foodAnalysesCollection() {
    try {
      const userDoc = db.collection('users').doc(this.userId);
      const collection = userDoc.collection('foodAnalyses');
      console.log('📁 Collection path: users/', this.userId, '/foodAnalyses');
      return collection;
    } catch (error) {
      console.error('❌ Error creating collection reference:', error);
      throw error;
    }
  }

  async createFoodAnalysis(insertAnalysis: InsertFoodAnalysis): Promise<FoodAnalysis> {
    try {
      console.log('💾 Starting to create food analysis for user:', this.userId);
      
      // Upload image to Firebase Storage if it's a data URL
      let imageUrl = insertAnalysis.imageUrl;
      
      if (insertAnalysis.imageUrl.startsWith('data:')) {
        console.log('📸 Uploading image to Firebase Storage...');
        try {
          const bucket = storage.bucket();
          const filename = `food-images/${this.userId}/${Date.now()}.jpg`;
          const file = bucket.file(filename);
          
          // Convert data URL to buffer
          const base64Data = insertAnalysis.imageUrl.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          
          await file.save(buffer, {
            metadata: {
              contentType: 'image/jpeg',
            },
          });
          
          // Make the file publicly accessible
          await file.makePublic();
          imageUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
          console.log('✅ Image uploaded to:', imageUrl);
        } catch (storageError) {
          console.error('❌ Error uploading image to storage:', storageError);
          // Continue with data URL if storage fails
          console.log('⚠️ Using data URL instead of storage URL');
        }
      }

      const analysisData = {
        ...insertAnalysis,
        imageUrl,
        createdAt: new Date(),
        userId: this.userId
      };

      console.log('📝 Saving analysis data to Firestore...');
      const docRef = await this.foodAnalysesCollection().add(analysisData);
      console.log('✅ Analysis saved with ID:', docRef.id);
      
      return {
        id: docRef.id,
        ...analysisData
      };
    } catch (error) {
      console.error('❌ Error creating food analysis:', error);
      throw error;
    }
  }

  async getFoodAnalysis(id: string): Promise<FoodAnalysis | undefined> {
    try {
      console.log('📋 Fetching analysis:', id, 'for user:', this.userId);
      const docRef = this.foodAnalysesCollection().doc(id);
      const docSnap = await docRef.get();
      
      if (docSnap.exists) {
        const data = docSnap.data();
        console.log('✅ Analysis found:', id);
        return {
          id: docSnap.id,
          ...data,
          createdAt: data?.createdAt?.toDate() || new Date()
        } as FoodAnalysis;
      }
      console.log('❌ Analysis not found:', id);
      return undefined;
    } catch (error) {
      console.error('❌ Error getting food analysis:', error);
      throw error;
    }
  }

  async getAllFoodAnalyses(): Promise<FoodAnalysis[]> {
    try {
      console.log('📋 Fetching all analyses for user:', this.userId);
      const snapshot = await this.foodAnalysesCollection().orderBy('createdAt', 'desc').get();
      console.log('✅ Found', snapshot.docs.length, 'analyses');
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data?.createdAt?.toDate() || new Date()
        } as FoodAnalysis;
      });
    } catch (error) {
      console.error('❌ Error getting all food analyses:', error);
      throw error;
    }
  }

  async getRecentFoodAnalyses(maxLimit: number): Promise<FoodAnalysis[]> {
    try {
      console.log('📋 Fetching recent analyses for user:', this.userId, 'limit:', maxLimit);
      const snapshot = await this.foodAnalysesCollection()
        .orderBy('createdAt', 'desc')
        .limit(maxLimit)
        .get();
      
      console.log('✅ Found', snapshot.docs.length, 'recent analyses');
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data?.createdAt?.toDate() || new Date()
        } as FoodAnalysis;
      });
    } catch (error) {
      console.error('❌ Error getting recent food analyses:', error);
      console.error('Error details:', error.message);
      throw error;
    }
  }

  async deleteFoodAnalysis(id: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting analysis:', id, 'for user:', this.userId);
      const docRef = this.foodAnalysesCollection().doc(id);
      await docRef.delete();
      console.log('✅ Analysis deleted:', id);
      return true;
    } catch (error) {
      console.error('❌ Error deleting food analysis:', error);
      throw error;
    }
  }

  async clearAllAnalyses(): Promise<boolean> {
    try {
      console.log('🗑️ Clearing all analyses for user:', this.userId);
      const snapshot = await this.foodAnalysesCollection().get();
      const batch = db.batch();
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log('✅ All analyses cleared for user:', this.userId);
      return true;
    } catch (error) {
      console.error('❌ Error clearing all analyses:', error);
      throw error;
    }
  }
}

// Factory function to create storage instance with user ID
export const createFirebaseStorage = (userId: string) => new FirebaseStorage(userId);