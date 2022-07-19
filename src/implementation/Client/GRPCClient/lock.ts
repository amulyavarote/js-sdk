/*
Copyright 2022 The Dapr Authors
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import GRPCClient from './GRPCClient';
import { TryLockResponse as TryLockResponseResult } from '../../../types/lock/TryLockResponse';
import { UnlockResponse as UnLockResponseResult, LockStatus } from '../../../types/lock/UnlockResponse';
import { TryLockRequest, TryLockResponse, UnlockRequest, UnlockResponse } from '../../../proto/dapr/proto/runtime/v1/dapr_pb';
import IClientLock from '../../../interfaces/Client/IClientLock';

/**
 * Required. The lock store name,e.g. `redis`.
 * string store_name = 1;
 * 
 * Required. resource_id is the lock key. e.g. `order_id_111`
 * It stands for "which resource I want to protect"
 * string resource_id = 2;
 * 
 * Required. lock_owner indicate the identifier of lock owner.
 * You can generate a uuid as lock_owner.For example,in **JavaScript**:
 * 
 * req.LockOwner = uuid.New().String() // js example instead
 * 
 * This field is per request, not per process, so it is different for each request,
 * which aims to prevent multi-thread in the same process trying the same lock concurrently.
 */
export default class GRPCClientLock implements IClientLock {
    client: GRPCClient;

    constructor(client: GRPCClient) {
        this.client = client;
    }

    async tryLock(storeName: string, resourceId: string, lockOwner: string, expiryInSeconds: number): Promise<TryLockResponseResult> {
        const request = new TryLockRequest()
         .setStoreName(storeName)
         .setResourceId(resourceId)
         .setLockOwner(lockOwner)
         .setExpiryinseconds(expiryInSeconds);
        
        const client = await this.client.getClient();
        return new Promise((resolve, reject) => {
          client.tryLockAlpha1(request, (err, res: TryLockResponse) => {
            if (err) {
              return reject(err);
            }
    
            const wrapped: TryLockResponseResult = {
                success: res.getSuccess()
            }
    
            return resolve(wrapped);
          });
        });
      }


    async unlock(storeName: string, resourceId: string, lockOwner: string): Promise<UnLockResponseResult> {
        const request = new UnlockRequest()
         .setStoreName(storeName)
         .setResourceId(resourceId)
         .setLockOwner(lockOwner);

        const client = await this.client.getClient();
        return new Promise((resolve, reject) => {
          client.unlockAlpha1(request, (err, res: UnlockResponse) => {
            if (err) {
              return reject(err);
            }

            const wrapped: UnLockResponseResult = {
                status: this.getUnlockResponse(res)
            }
    
            return resolve(wrapped);
          });
        });
      }

      getUnlockResponse(res: UnlockResponse) {
        switch(res.getStatus()) {
            case UnlockResponse.Status.SUCCESS:
                return LockStatus.Success;
            case UnlockResponse.Status.LOCK_UNEXIST:
                return LockStatus.LockDoesNotExist;
            case UnlockResponse.Status.LOCK_BELONG_TO_OTHERS:
                return LockStatus.LockBelongToOthers;
            default:
                return LockStatus.InternalError;

        }
    }
}