import { createContext, useContext } from 'react';
import { moods } from './moods';
export const MoodContext=createContext(moods[0]);
export const useMood=()=>useContext(MoodContext);
