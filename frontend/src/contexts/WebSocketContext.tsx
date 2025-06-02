import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
    sendMessage: (message: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};

interface WebSocketProviderProps {
    children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
    const { user } = useAuth();
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (user) {
            // Connect to WebSocket server with authentication
            const token = localStorage.getItem('token');
            const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:5000/ws'}?token=${token}`;
            ws.current = new WebSocket(wsUrl);

            ws.current.onopen = () => {
                console.log('WebSocket connected');
            };

            ws.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    handleWebSocketMessage(data);
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };

            ws.current.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            ws.current.onclose = () => {
                console.log('WebSocket disconnected');
            };
        }

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [user]);

    const handleWebSocketMessage = (data: any) => {
        // Handle different types of WebSocket messages
        switch (data.type) {
            case 'NEW_FEEDBACK':
                // Trigger a refetch of the relevant queries
                // This will be handled by the components using the data
                break;
            case 'FEEDBACK_UPDATED':
                // Handle feedback updates
                break;
            case 'FEEDBACK_DELETED':
                // Handle feedback deletion
                break;
            default:
                console.warn('Unknown WebSocket message type:', data.type);
        }
    };

    const sendMessage = (message: any) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(message));
        } else {
            console.error('WebSocket is not connected');
        }
    };

    return (
        <WebSocketContext.Provider value={{ sendMessage }}>
            {children}
        </WebSocketContext.Provider>
    );
}; 