import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Colors, Layout } from '../constants/Colors';
import { Participant } from '../types/types';

interface Props {
    scorers: { player: Participant; goals: number }[];
}

export const Leaderboard = ({ scorers }: Props) => {
    return (
        <View style={styles.container}>
            {scorers.length === 0 ? (
                <Text style={styles.empty}>No goals scored yet.</Text>
            ) : (
                <FlatList
                    data={scorers}
                    keyExtractor={(item) => item.player.id}
                    renderItem={({ item, index }) => (
                        <View style={styles.row}>
                            <View style={[styles.rank, { backgroundColor: index === 0 ? Colors.dark.accent : 'transparent' }]}>
                                <Text style={[styles.rankText, { color: index === 0 ? '#000' : Colors.dark.gray }]}>{index + 1}</Text>
                            </View>
                            <Text style={styles.name}>{item.player.name}</Text>
                            <Text style={styles.goals}>{item.goals} Goals</Text>
                        </View>
                    )}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: Layout.spacing.md,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.surface,
        padding: Layout.spacing.md,
        borderRadius: Layout.borderRadius.md,
        marginBottom: Layout.spacing.sm,
    },
    rank: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Layout.spacing.md,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    rankText: {
        fontWeight: 'bold',
    },
    name: {
        flex: 1,
        color: Colors.dark.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    goals: {
        color: Colors.dark.primary,
        fontWeight: 'bold',
    },
    empty: {
        color: Colors.dark.gray,
        textAlign: 'center',
        marginTop: 20,
    }
});
