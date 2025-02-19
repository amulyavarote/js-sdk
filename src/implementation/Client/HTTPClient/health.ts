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

import HTTPClient from './HTTPClient';
import IClientHealth from '../../../interfaces/Client/IClientHealth';

// https://docs.dapr.io/reference/api/health_api/
export default class HTTPClientHealth implements IClientHealth {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  // Send an event to an external system
  async isHealthy(): Promise<boolean> {
    try {
      await this.client.execute(`/healthz`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      return true;
    } catch (e) {
      return false;
    }
  }
}
