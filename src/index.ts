interface CrossTabInterface {
    on(eventName: string, cb:(data:any) => void):void;
    postMessage(eventName: string, msg:any):void;
}

export class CrossTab implements CrossTabInterface{
    private subscribes: Object = {};
    public constructor() {
        // 订阅事件
        this.subscribes = {}
        this.init();
    }
    // 初始化
    private init(): void {
        if(!window.BroadcastChannel) {
            window.addEventListener('storage', this.handleStorage.bind(this));
        }
    }
    // 处理监听
    private handleStorage(e: StorageEvent): void {
        const {key: event, newValue} = e;
        // localStorage 没字段，或者没订阅就直接返回
        if (!localStorage.getItem(<string>event) || !this.subscribes[<string>event]) return;
        // 删除也会触发
        if (!newValue) return;
        let data: null | string = null;
        try {
            data = JSON.parse(newValue);
            this.subscribes[<string>event].forEach(cb => {
                cb && cb(data);
            });
        } catch (error) {
            console.error('this is a error in data parse');
        }
    }

    // 监听
    public on(eventName: string, cb:(data:any) => void):void {
        eventName += 'crossTab';
        if(window.BroadcastChannel) {
            // 未订阅过的
            if(!this.subscribes[eventName]) {
                let bc = new BroadcastChannel(eventName);
                bc.onmessage = function (msg) {
                    if(cb) {
                        cb(msg.data)
                    }
                }
                this.subscribes[eventName] = bc
            }
        } else {
            this.subscribes[eventName] = [...(this.subscribes[eventName] || []), cb];
            localStorage.setItem(eventName, 'listen');
            localStorage.removeItem(eventName);
        }
    }

    // 广播-发送
    public postMessage(eventName: string, msg:any):void {
        eventName += 'crossTab';
        if(window.BroadcastChannel) {
            this.subscribes[eventName].postMessage(msg);
        } else {
            localStorage.setItem(eventName, msg)
            localStorage.removeItem(eventName)
        }
    }
}

