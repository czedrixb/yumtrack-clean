import { 
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  query,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import type { FoodAnalysis, InsertFoodAnalysis } from "@shared/schema";

export class FirebaseStorage {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  private foodAnalysesCollection() {
    return collection(db, 'users', this.userId, 'foodAnalyses');
  }

  async createFoodAnalysis(insertAnalysis: InsertFoodAnalysis): Promise<FoodAnalysis> {
    try {
      // Upload image to Firebase Storage if it's a data URL
      let imageUrl = insertAnalysis.imageUrl;
      
      if (insertAnalysis.imageUrl.startsWith('data:')) {
        const storageRef = ref(storage, `food-images/${this.userId}/${Date.now()}.jpg`);
        const snapshot = await uploadString(storageRef, insertAnalysis.imageUrl, 'data_url');
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const analysisData = {
        ...insertAnalysis,
        imageUrl,
        createdAt: Timestamp.now(),
        userId: this.userId
      };

      const docRef = await addDoc(this.foodAnalysesCollection(), analysisData);
      
      return {
        id: docRef.id,
        ...insertAnalysis,
        imageUrl,
        createdAt: new Date(),
        userId: this.userId
      };
    } catch (error) {
      console.error('Error creating food analysis:', error);
      throw error;
    }
  }

  async getFoodAnalysis(id: string): Promise<FoodAnalysis | undefined> {
    try {
      const docRef = doc(this.foodAnalysesCollection(), id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt.toDate()
        } as FoodAnalysis;
      }
      return undefined;
    } catch (error) {
      console.error('Error getting food analysis:', error);
      throw error;
    }
  }

  async getAllFoodAnalyses(): Promise<FoodAnalysis[]> {
    try {
      const q = query(
        this.foodAnalysesCollection(), 
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate()
        } as FoodAnalysis;
      });
    } catch (error) {
      console.error('Error getting all food analyses:', error);
      throw error;
    }
  }

  async getRecentFoodAnalyses(maxLimit: number): Promise<FoodAnalysis[]> {
    try {
      const q = query(
        this.foodAnalysesCollection(), 
        orderBy('createdAt', 'desc'),
        limit(maxLimit)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate()
        } as FoodAnalysis;
      });
    } catch (error) {
      console.error('Error getting recent food analyses:', error);
      throw error;
    }
  }

  async deleteFoodAnalysis(id: string): Promise<boolean> {
    try {
      const docRef = doc(this.foodAnalysesCollection(), id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting food analysis:', error);
      throw error;
    }
  }

  async clearAllAnalyses(): Promise<boolean> {
    try {
      const querySnapshot = await getDocs(this.foodAnalysesCollection());
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      return true;
    } catch (error) {
      console.error('Error clearing all analyses:', error);
      throw error;
    }
  }
}

// Factory function to create storage instance with user ID
export const createFirebaseStorage = (userId: string) => new FirebaseStorage(userId);