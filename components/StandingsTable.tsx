import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Layout } from '../constants/Colors';
import { Participant } from '../types/types';

interface Props {
    participants: Participant[];
}

export const StandingsTable = ({ participants }: Props) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.cell, styles.pos, styles.headerText]}>#</Text>
                <Text style={[styles.cell, styles.team, styles.headerText]}>Team</Text>
                <Text style={[styles.cell, styles.stat, styles.headerText]}>P</Text>
                <Text style={[styles.cell, styles.stat, styles.headerText]}>W</Text>
                <Text style={[styles.cell, styles.stat, styles.headerText]}>D</Text>
                <Text style={[styles.cell, styles.stat, styles.headerText]}>L</Text>
                <Text style={[styles.cell, styles.stat, styles.headerText]}>GD</Text>
                <Text style={[styles.cell, styles.pts, styles.headerText]}>Pts</Text>
            </View>
            <View>
                {participants.map((p, index) => (
                    <View key={p.id} style={[styles.row, index < 4 && styles.topRow]}>
                        <Text style={[styles.cell, styles.pos]}>{index + 1}</Text>
                        <Text style={[styles.cell, styles.team]}>{p.name}</Text>
                        <Text style={[styles.cell, styles.stat]}>{p.stats.played}</Text>
                        <Text style={[styles.cell, styles.stat]}>{p.stats.won}</Text>
                        <Text style={[styles.cell, styles.stat]}>{p.stats.drawn}</Text>
                        <Text style={[styles.cell, styles.stat]}>{p.stats.lost}</Text>
                        <Text style={[styles.cell, styles.stat]}>{p.stats.gf - p.stats.ga}</Text>
                        <Text style={[styles.cell, styles.pts]}>{p.stats.points}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.dark.surface,
        borderRadius: Layout.borderRadius.md,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        backgroundColor: '#333',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    row: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    topRow: {
        // borderLeftWidth: 3,
        // borderLeftColor: Colors.dark.primary, // Highlight top teams?
    },
    cell: {
        color: Colors.dark.text,
        textAlign: 'center',
        fontSize: 14,
    },
    headerText: {
        fontWeight: 'bold',
        color: Colors.dark.gray,
    },
    pos: { width: 30, color: Colors.dark.gray },
    team: { flex: 1, textAlign: 'left', fontWeight: 'bold' },
    stat: { width: 35 },
    pts: { width: 40, fontWeight: 'bold', color: Colors.dark.accent },
});
