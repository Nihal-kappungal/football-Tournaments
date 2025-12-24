import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Colors, Layout } from '../constants/Colors';

export interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'cancel' | 'destructive' | 'default';
}

interface Props {
    visible: boolean;
    title: string;
    message: string;
    onClose: () => void;
    type?: 'error' | 'success' | 'info';
    buttons?: AlertButton[];
}

export const CustomAlert = ({ visible, title, message, onClose, type = 'info', buttons }: Props) => {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={[styles.title, type === 'error' && styles.errorTitle]}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.buttonContainer}>
                        {buttons && buttons.length > 0 ? (
                            buttons.map((btn, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.button,
                                        btn.style === 'cancel' && styles.cancelButton,
                                        btn.style === 'destructive' && styles.destructiveButton
                                    ]}
                                    onPress={() => {
                                        if (btn.onPress) btn.onPress();
                                        else onClose();
                                    }}
                                >
                                    <Text style={[
                                        styles.buttonText,
                                        btn.style === 'cancel' && styles.cancelButtonText,
                                        btn.style === 'destructive' && styles.destructiveButtonText
                                    ]}>{btn.text}</Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <TouchableOpacity style={styles.button} onPress={onClose}>
                                <Text style={styles.buttonText}>OK</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Layout.spacing.lg,
    },
    container: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: Colors.dark.surface,
        borderRadius: Layout.borderRadius.md,
        padding: Layout.spacing.lg,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.dark.text,
        marginBottom: Layout.spacing.md,
        textAlign: 'center',
    },
    errorTitle: {
        color: Colors.dark.danger,
    },
    message: {
        fontSize: 16,
        color: Colors.dark.gray,
        marginBottom: Layout.spacing.xl,
        textAlign: 'center',
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'center',
        width: '100%',
    },
    button: {
        backgroundColor: Colors.dark.accent,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: Layout.borderRadius.sm,
        minWidth: 100,
        alignItems: 'center',
        flex: 1,
    },
    buttonText: {
        color: Colors.dark.background,
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.dark.gray,
    },
    cancelButtonText: {
        color: Colors.dark.gray,
    },
    destructiveButton: {
        backgroundColor: Colors.dark.danger,
    },
    destructiveButtonText: {
        color: '#FFF',
    }
});
