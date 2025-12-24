import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tournament } from '../types/types';

const STORAGE_KEY = 'ALL_TOURNAMENTS_V1';

export const getTournaments = async (): Promise<Tournament[]> => {
    try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        return json ? JSON.parse(json) : [];
    } catch (e) {
        console.error('Failed to load tournaments', e);
        return [];
    }
};

export const saveTournament = async (tournament: Tournament) => {
    try {
        const list = await getTournaments();
        const index = list.findIndex(t => t.id === tournament.id);
        if (index >= 0) {
            list[index] = tournament;
        } else {
            list.push(tournament);
        }
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
        console.error('Failed to save tournament', e);
    }
};

export const deleteTournament = async (id: string) => {
    try {
        const list = await getTournaments();
        const newList = list.filter(t => t.id !== id);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
        console.log(e);
    }
}
