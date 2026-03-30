import storyJson from './exercises/decorating_a_cake.json'; // Adjust the path if necessary

// Fetches the entire JSON content
export function getFullStoryData() {
    
    // In a real application, you might use 'fetch' here to load from an API route or server.
    // Since the file is static and small, we'll import it directly.
    return storyJson;
}

// Fetches the specific content based on the order and exercise key
export function getExerciseInteractions(exerciseKey) {
    const data = getFullStoryData();
    
    if (data && data[exerciseKey]) {
        return data[exerciseKey].interactions || [];
    }
    return [];
}