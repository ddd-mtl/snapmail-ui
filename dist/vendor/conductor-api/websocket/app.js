var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Defines AppWebsocket, an easy-to-use websocket implementation of the
 * Conductor API for apps
 *
 *    const client = AppWebsocket.connect(
 *      'ws://localhost:9000',
 *      signal => console.log('got a signal:', signal)
 *    )
 *
 *    client.callZome({...})  // TODO: show what's in here
 *      .then(() => {
 *        console.log('DNA successfully installed')
 *      })
 *      .catch(err => {
 *        console.error('problem installing DNA:', err)
 *      })
 */
import * as msgpack from '@msgpack/msgpack';
import { WsClient } from './client';
import { catchError, promiseTimeout, DEFAULT_TIMEOUT } from './common';
import { requesterTransformer } from '../api/common';
export class AppWebsocket {
    constructor(client, defaultTimeout) {
        this._requester = (tag, transformer) => requesterTransformer((req, timeout) => promiseTimeout(this.client.request(req), tag, timeout || this.defaultTimeout).then(catchError), tag, transformer);
        this.appInfo = this._requester('app_info');
        this.callZome = this._requester('zome_call_invocation', callZomeTransform);
        this.client = client;
        this.defaultTimeout = defaultTimeout === undefined ? DEFAULT_TIMEOUT : defaultTimeout;
    }
    static connect(url, defaultTimeout, signalCb) {
        return __awaiter(this, void 0, void 0, function* () {
            const wsClient = yield WsClient.connect(url, signalCb);
            return new AppWebsocket(wsClient, defaultTimeout);
        });
    }
}
const callZomeTransform = {
    input: (req) => {
        req.payload = msgpack.encode(req.payload);
        return req;
    },
    output: (res) => {
        return msgpack.decode(res);
    }
};
//# sourceMappingURL=app.js.map