// WebSocket 服务器管理
const WebSocket = require('ws');

class WebSocketManager {
    constructor() {
        this.wss = null;
        this.clients = new Map(); // 存储客户端连接，key: userId, value: ws
    }

    // 初始化 WebSocket 服务器
    init(server) {
        this.wss = new WebSocket.Server({ server });
        
        this.wss.on('connection', (ws, req) => {
            console.log('新的WebSocket连接');
            
            // 从URL参数中获取用户ID和角色
            const url = new URL(req.url, `http://${req.headers.host}`);
            const userId = url.searchParams.get('userId');
            const role = url.searchParams.get('role');
            
            if (userId) {
                this.clients.set(userId, ws);
                console.log(`用户 ${userId} (${role}) 已连接`);
            }
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleMessage(ws, data);
                } catch (error) {
                    console.error('WebSocket消息解析错误:', error);
                }
            });
            
            ws.on('close', () => {
                if (userId) {
                    this.clients.delete(userId);
                    console.log(`用户 ${userId} 已断开连接`);
                }
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket错误:', error);
            });
            
            // 发送连接成功消息
            ws.send(JSON.stringify({
                type: 'connected',
                message: 'WebSocket连接成功'
            }));
        });
        
        console.log('WebSocket服务器已启动');
    }

    // 处理收到的消息
    handleMessage(ws, data) {
        switch (data.type) {
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong' }));
                break;
            default:
                console.log('未知消息类型:', data.type);
        }
    }

    // 向特定用户发送消息
    sendToUser(userId, message) {
        const ws = this.clients.get(userId.toString());
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
            return true;
        }
        return false;
    }

    // 向多个用户发送消息
    sendToUsers(userIds, message) {
        userIds.forEach(userId => {
            this.sendToUser(userId, message);
        });
    }

    // 向所有教师发送消息
    broadcastToTeachers(message) {
        this.clients.forEach((ws, userId) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        });
    }

    // 广播给所有连接的客户端
    broadcast(message) {
        this.wss.clients.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        });
    }
}

// 创建单例实例
const wsManager = new WebSocketManager();

module.exports = wsManager;
