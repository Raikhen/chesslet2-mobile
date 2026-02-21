import AsyncStorage from "@react-native-async-storage/async-storage";

const PROGRESS_KEY = "chesslet-progress";
const HIGH_SCORE_KEY = "chesslet-timed-highscore";

export async function loadProgress() {
  try {
    const data = await AsyncStorage.getItem(PROGRESS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        level: parsed.level || 1,
        completed: new Set(parsed.completed || []),
      };
    }
  } catch (e) {
    console.error("Failed to load progress:", e);
  }
  return { level: 1, completed: new Set() };
}

export async function saveProgress(level, completed) {
  try {
    await AsyncStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({ level, completed: Array.from(completed) })
    );
  } catch (e) {
    console.error("Failed to save progress:", e);
  }
}

export async function loadHighScore() {
  try {
    const data = await AsyncStorage.getItem(HIGH_SCORE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return parsed.score || 0;
    }
  } catch (e) {
    console.error("Failed to load high score:", e);
  }
  return null;
}

export async function saveHighScore(score) {
  try {
    await AsyncStorage.setItem(
      HIGH_SCORE_KEY,
      JSON.stringify({ score, date: new Date().toISOString() })
    );
  } catch (e) {
    console.error("Failed to save high score:", e);
  }
}
